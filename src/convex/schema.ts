import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';
export const category = v.union(v.literal('text-to-image'), v.literal('image-to-video'));
export const visibility = v.union(v.literal('private'), v.literal('public'));
export default defineSchema({
  items: defineTable({
    owner: v.string(),
    kind: v.union(v.literal('link'), v.literal('prompt')),
    title: v.string(),
    content: v.string(),
    category: v.optional(category),
    tool: v.string(),
    favorite: v.boolean(),
    createdAt: v.number(),
    // Optional fields keep existing records private without a migration.
    visibility: v.optional(visibility),
    authorName: v.optional(v.string()),
    publishedAt: v.optional(v.number()),
    imageStorageId: v.optional(v.id('_storage'))
  })
    .index('by_owner', ['owner'])
    .index('by_visibility_published', ['visibility', 'publishedAt'])
});
