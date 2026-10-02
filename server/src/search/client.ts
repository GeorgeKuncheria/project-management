import { Client } from "@elastic/elasticsearch";

const node = process.env.ELASTICSEARCH_URL || "http://localhost:9200";
const apiKey = process.env.ELASTICSEARCH_API_KEY;

export const es = new Client({
  node,
  ...(apiKey ? { auth: { apiKey } } : {}),
});

export const INDEX = {
  tasks: "pm-tasks",
  projects: "pm-projects",
  users: "pm-users",
} as const;
