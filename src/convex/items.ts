import { v, ConvexError } from 'convex/values';
import { query, mutation } from './_generated/server';
import { paginationOptsValidator } from 'convex/server';
import { category, visibility } from './schema';
import { authComponent } from './auth';
import { validateItem } from '../lib/validation';

export const list = query({
  args: {},
  handler: async (ctx) => {
    const user = await authComponent.getAuthUser(ctx);
    return ctx.db
      .query('items')
      .withIndex('by_owner', (q) => q.eq('owner', user._id))
      .order('desc')
      .collect();
  }
});
export const create = mutation({
  args: {
    kind: v.union(v.literal('link'), v.literal('prompt')),
    title: v.string(),
    content: v.string(),
    category: v.optional(category),
    tool: v.string(),
    visibility: v.optional(visibility)
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);
    const problem = validateItem(args);
    if (problem) throw new ConvexError(problem);
    const now = Date.now();
    return ctx.db.insert('items', {
      ...args,
      category: args.kind === 'prompt' ? args.category : undefined,
      title: args.title.trim(),
      content: args.content.trim(),
      tool: args.tool.trim(),
      owner: user._id,
      favorite: false,
      createdAt: now,
      visibility: args.visibility ?? 'private',
      ...(args.visibility === 'public'
        ? { authorName: user.name?.trim().slice(0, 80) || 'Community member', publishedAt: now }
        : {})
    });
  }
});

// Deliberately unauthenticated: only explicitly published content is returned.
// Project an allowlist so owner IDs and personal favorite state never leak.
export const publicFeed = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, { paginationOpts }) => {
    const result = await ctx.db
      .query('items')
      .withIndex('by_visibility_published', (q) => q.eq('visibility', 'public'))
      .order('desc')
      .paginate({
        ...paginationOpts,
        numItems: Math.min(50, Math.max(1, paginationOpts.numItems))
      });
    return {
      ...result,
      page: result.page.map((item) => ({
        _id: item._id,
        kind: item.kind,
        title: item.title,
        content: item.content,
        ...(item.kind === 'prompt' && item.category ? { category: item.category } : {}),
        tool: item.tool,
        visibility: 'public' as const,
        authorName: item.authorName || 'Community member',
        publishedAt: item.publishedAt ?? item.createdAt,
        createdAt: item.createdAt
      }))
    };
  }
});

export const setVisibility = mutation({
  args: { id: v.id('items'), visibility },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);
    const item = await ctx.db.get(args.id);
    if (!item || item.owner !== user._id) throw new ConvexError('Record not found');
    await ctx.db.patch(args.id, {
      visibility: args.visibility,
      authorName:
        args.visibility === 'public'
          ? user.name?.trim().slice(0, 80) || 'Community member'
          : undefined,
      publishedAt:
        args.visibility === 'public'
          ? item.visibility === 'public'
            ? (item.publishedAt ?? Date.now())
            : Date.now()
          : undefined
    });
  }
});
export const favorite = mutation({
  args: { id: v.id('items') },
  handler: async (ctx, { id }) => {
    const user = await authComponent.getAuthUser(ctx);
    const item = await ctx.db.get(id);
    if (!item || item.owner !== user._id) throw new ConvexError('Record not found');
    await ctx.db.patch(id, { favorite: !item.favorite });
  }
});
export const remove = mutation({
  args: { id: v.id('items') },
  handler: async (ctx, { id }) => {
    const user = await authComponent.getAuthUser(ctx);
    const item = await ctx.db.get(id);
    if (!item || item.owner !== user._id) throw new ConvexError('Record not found');
    await ctx.db.delete(id);
  }
});
