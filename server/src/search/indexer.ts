import { PrismaClient } from "../../generated/prisma";
import { es, INDEX } from "./client";

const prisma = new PrismaClient();

export async function buildTaskDoc(id: number) {
  const task = await prisma.task.findUnique({
    where: { id },
    include: { assignee: true, comments: true, attachments: true },
  });
  if (!task) return null;
  return {
    title: task.title,
    description: task.description,
    tags: task.tags,
    status: task.status,
    priority: task.priority,
    projectId: task.projectId,
    assigneeUsername: task.assignee?.username ?? null,
    comments: task.comments.map((c) => c.text),
    attachmentNames: task.attachments.map((a) => a.fileName).filter(Boolean),
  };
}

export async function indexTask(id: number) {
  const doc = await buildTaskDoc(id);
  if (!doc) return deleteDoc("tasks", id);
  await es.index({ index: INDEX.tasks, id: String(id), document: doc });
}

export async function indexProject(id: number) {
  const p = await prisma.project.findUnique({ where: { id } });
  if (!p) return deleteDoc("projects", id);
  await es.index({
    index: INDEX.projects,
    id: String(id),
    document: { name: p.name, description: p.description },
  });
}

export async function indexUser(userId: number) {
  const u = await prisma.user.findUnique({ where: { userId } });
  if (!u) return deleteDoc("users", userId);
  await es.index({
    index: INDEX.users,
    id: String(userId),
    document: { username: u.username, teamId: u.teamId },
  });
}

export async function deleteDoc(kind: keyof typeof INDEX, id: number) {
  await es.delete({ index: INDEX[kind], id: String(id) }, { ignore: [404] });
}

/** Fire-and-forget wrapper for controllers: index failures must never fail a request. */
export function safeIndex(fn: () => Promise<unknown>) {
  fn().catch((err) => console.error("Elasticsearch index error:", err.message));
}

/** Bulk-load everything from Postgres. */
export async function indexAll() {
  const [tasks, projects, users] = await Promise.all([
    prisma.task.findMany({ include: { assignee: true, comments: true, attachments: true } }),
    prisma.project.findMany(),
    prisma.user.findMany(),
  ]);

  const operations: any[] = [];
  for (const t of tasks) {
    operations.push({ index: { _index: INDEX.tasks, _id: String(t.id) } });
    operations.push({
      title: t.title,
      description: t.description,
      tags: t.tags,
      status: t.status,
      priority: t.priority,
      projectId: t.projectId,
      assigneeUsername: t.assignee?.username ?? null,
      comments: t.comments.map((c) => c.text),
      attachmentNames: t.attachments.map((a) => a.fileName).filter(Boolean),
    });
  }
  for (const p of projects) {
    operations.push({ index: { _index: INDEX.projects, _id: String(p.id) } });
    operations.push({ name: p.name, description: p.description });
  }
  for (const u of users) {
    operations.push({ index: { _index: INDEX.users, _id: String(u.userId) } });
    operations.push({ username: u.username, teamId: u.teamId });
  }

  if (operations.length === 0) return { tasks: 0, projects: 0, users: 0 };
  const res = await es.bulk({ operations, refresh: true });
  if (res.errors) {
    const failed = res.items.filter((i) => i.index?.error);
    console.error(`Bulk indexing had ${failed.length} errors`, failed[0]?.index?.error);
  }
  return { tasks: tasks.length, projects: projects.length, users: users.length };
}
