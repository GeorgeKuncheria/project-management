import { Request, Response } from "express";
import { PrismaClient } from "../../generated/prisma";
import { es, INDEX } from "../search/client";

const prisma = new PrismaClient();

// Elasticsearch search; throws if the cluster is unreachable so the caller can fall back.
async function searchElasticsearch(q: string) {
  // Plain-text markers (not HTML) so the client can render highlights without innerHTML.
  const hl = { pre_tags: ["[[hl]]"], post_tags: ["[[/hl]]"] };
  const fuzzy = { fuzziness: "AUTO" as const, type: "best_fields" as const };
  const res = await es.msearch({
    searches: [
      { index: INDEX.tasks },
      {
        size: 20,
        query: {
          multi_match: {
            query: q,
            fields: ["title^3", "title.ac^2", "tags^2", "description", "comments", "attachmentNames"],
            ...fuzzy,
          },
        },
        highlight: { ...hl, fields: { title: {}, description: {} } },
      },
      { index: INDEX.projects },
      {
        size: 20,
        query: {
          multi_match: { query: q, fields: ["name^3", "name.ac^2", "description"], ...fuzzy },
        },
        highlight: { ...hl, fields: { name: {}, description: {} } },
      },
      { index: INDEX.users },
      {
        size: 20,
        query: { match: { username: { query: q } } },
      },
    ],
  });

  const [taskRes, projectRes, userRes] = res.responses as any[];
  if (res.responses.some((r: any) => r.error)) {
    throw new Error("Elasticsearch msearch returned an error response");
  }
  const ids = (r: any) => r.hits.hits.map((h: any) => Number(h._id));
  const highlights = (r: any) =>
    Object.fromEntries(r.hits.hits.map((h: any) => [h._id, h.highlight ?? {}]));

  const [taskIds, projectIds, userIds] = [ids(taskRes), ids(projectRes), ids(userRes)];

  // Hydrate full rows from Postgres so the response shape matches what the client expects.
  const [tasks, projects, users] = await Promise.all([
    prisma.task.findMany({ where: { id: { in: taskIds } } }),
    prisma.project.findMany({ where: { id: { in: projectIds } } }),
    prisma.user.findMany({ where: { userId: { in: userIds } } }),
  ]);
  // Postgres `in` doesn't preserve order; restore Elasticsearch relevance order.
  const order = <T>(rows: T[], idList: number[], key: (r: T) => number) =>
    idList.map((id) => rows.find((r) => key(r) === id)).filter((r): r is T => !!r);

  return {
    tasks: order(tasks, taskIds, (t) => t.id),
    projects: order(projects, projectIds, (p) => p.id),
    users: order(users, userIds, (u) => u.userId),
    highlights: { tasks: highlights(taskRes), projects: highlights(projectRes) },
  };
}

// Original Postgres search, kept as a fallback when Elasticsearch is unavailable.
async function searchPostgres(q: string) {
  const insensitive = "insensitive" as const;
  const [tasks, projects, users] = await Promise.all([
    prisma.task.findMany({
      where: {
        OR: [
          { title: { contains: q, mode: insensitive } },
          { description: { contains: q, mode: insensitive } },
        ],
      },
    }),
    prisma.project.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: insensitive } },
          { description: { contains: q, mode: insensitive } },
        ],
      },
    }),
    prisma.user.findMany({ where: { username: { contains: q, mode: insensitive } } }),
  ]);
  return { tasks, projects, users };
}

export const search = async (req: Request, res: Response): Promise<void> => {
  const query = String(req.query.query ?? "").trim();
  if (!query) {
    res.status(200).json({ tasks: [], projects: [], users: [] });
    return;
  }

  try {
    res.status(200).json(await searchElasticsearch(query));
  } catch (esError: any) {
    console.warn(`Elasticsearch search failed, falling back to Postgres: ${esError.message}`);
    try {
      res.status(200).json(await searchPostgres(query));
    } catch (error: any) {
      res.status(500).json({ message: `Error Performing Search: ${error.message}` });
    }
  }
};
