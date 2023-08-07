import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';
import { Journal, Memories, Characters, Worlds, Maps } from './types';

export default defineSchema(
  {
    worlds: Worlds.table,
    maps: Maps.table,
    characters: Characters.table,
    players: defineTable({
      name: v.string(),
      worldId: v.id('worlds'),
      characterId: v.id('characters'),
    }).index('by_worldId', ['worldId']),

    journal: Journal.table
      .index('by_playerId_type', ['playerId', 'data.type'])
      .index('by_conversation', ['data.conversationId']),

    memories: Memories.table
      .index('by_playerId_embeddingId', ['playerId', 'embeddingId'])
      .index('by_playerId_type', ['playerId', 'data.type']),

    // To track recent accesses
    memoryAccesses: defineTable({
      memoryId: v.id('memories'),
    }).index('by_memoryId', ['memoryId']),

    embeddings: defineTable({
      playerId: v.id('players'),
      text: v.string(),
      embedding: v.array(v.number()),
    })
      .vectorIndex('embedding', {
        vectorField: 'embedding',
        filterFields: ['playerId'],
        dimension: 1536,
      })
      // To avoid recomputing embeddings, we can use this table as a cache.
      // IMPORTANT: don't re-use the object, as it has a reference to the playerId.
      // Just copy the embedding to a new document when needed.
      .index('by_text', ['text']),

    // Something for messages to associate with, can store
    // read-only metadata here in the future.
    conversations: defineTable({ worldId: v.id('worlds') }).index('by_worldId', ['worldId']),

    heartbeats: defineTable({}),
  },
  // When schemaValidation is enabled, it prevents pushing code that has a
  // schema incompatible with the current database.
  // It also prevents writing data at runtime that doesn't match the schema.
  // We disable it while iterating on the schema, to avoid needing to clear
  // tables all the time or write migrations while iterating quickly.
  // Instead, we just create new worlds with the correct data schema for now.
  { schemaValidation: false },
);
