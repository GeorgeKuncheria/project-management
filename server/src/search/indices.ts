import { es, INDEX } from "./client";

const settings: any = {
  analysis: {
    filter: {
      edge_ngram_filter: { type: "edge_ngram", min_gram: 2, max_gram: 15 },
      english_stemmer: { type: "stemmer", language: "english" },
    },
    analyzer: {
      // index-time: lowercase + edge n-grams for as-you-type matching
      autocomplete_index: {
        type: "custom",
        tokenizer: "standard",
        filter: ["lowercase", "edge_ngram_filter"],
      },
      // query-time: no n-grams, otherwise every query term explodes
      autocomplete_search: {
        type: "custom",
        tokenizer: "standard",
        filter: ["lowercase"],
      },
      english_text: {
        type: "custom",
        tokenizer: "standard",
        filter: ["lowercase", "english_stemmer"],
      },
    },
  },
};

const titleField = {
  type: "text",
  analyzer: "english_text",
  fields: {
    ac: {
      type: "text",
      analyzer: "autocomplete_index",
      search_analyzer: "autocomplete_search",
    },
  },
} as const;

const textField = { type: "text", analyzer: "english_text" } as const;

const mappings = {
  [INDEX.tasks]: {
    properties: {
      title: titleField,
      description: textField,
      tags: { type: "text", analyzer: "english_text", fields: { raw: { type: "keyword" } } },
      status: { type: "keyword" },
      priority: { type: "keyword" },
      projectId: { type: "integer" },
      assigneeUsername: { type: "keyword" },
      comments: textField,
      attachmentNames: textField,
    },
  },
  [INDEX.projects]: {
    properties: {
      name: titleField,
      description: textField,
    },
  },
  [INDEX.users]: {
    properties: {
      username: {
        type: "text",
        analyzer: "autocomplete_index",
        search_analyzer: "autocomplete_search",
        fields: { raw: { type: "keyword" } },
      },
      teamId: { type: "integer" },
    },
  },
} as const;

export async function ensureIndices(): Promise<void> {
  for (const index of Object.values(INDEX)) {
    const exists = await es.indices.exists({ index });
    if (!exists) {
      await es.indices.create({
        index,
        settings,
        mappings: mappings[index] as any,
      });
      console.log(`Created Elasticsearch index ${index}`);
    }
  }
}

/** Drop and recreate all indices (used by the full reindex). */
export async function recreateIndices(): Promise<void> {
  for (const index of Object.values(INDEX)) {
    await es.indices.delete({ index, ignore_unavailable: true });
  }
  await ensureIndices();
}
