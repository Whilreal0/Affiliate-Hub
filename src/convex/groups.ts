import { ConvexError, v } from 'convex/values';
import { query, mutation, type MutationCtx } from './_generated/server';
import { authComponent } from './auth';
import { validateGroupName } from '../lib/validation';

async function checkName(
  ctx: MutationCtx,
  owner: string,
  kind: string,
  name: string,
  exclude?: string
) {
  const problem = validateGroupName(name);
  if (problem) throw new ConvexError(problem);
  const groups = await ctx.db
    .query('groups')
    .withIndex('by_owner', (q) => q.eq('owner', owner))
    .collect();
  if (
    groups.some(
      (group) =>
        group._id !== exclude &&
        group.kind === kind &&
        group.name.toLowerCase() === name.trim().toLowerCase()
    )
  )
    throw new ConvexError('A group with this name already exists.');
}
export const list = query({
  args: {},
  handler: async (ctx) => {
    const user = await authComponent.getAuthUser(ctx);
    return ctx.db
      .query('groups')
      .withIndex('by_owner', (q) => q.eq('owner', user._id))
      .collect();
  }
});
export const create = mutation({
  args: { name: v.string(), kind: v.union(v.literal('link'), v.literal('prompt')) },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);
    await checkName(ctx, user._id, args.kind, args.name);
    return ctx.db.insert('groups', { owner: user._id, kind: args.kind, name: args.name.trim() });
  }
});
export const rename = mutation({
  args: { id: v.id('groups'), name: v.string() },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);
    const group = await ctx.db.get(args.id);
    if (!group || group.owner !== user._id) throw new ConvexError('Group not found.');
    await checkName(ctx, user._id, group.kind, args.name, group._id);
    await ctx.db.patch(args.id, { name: args.name.trim() });
  }
});
export const remove = mutation({
  args: { id: v.id('groups') },
  handler: async (ctx, { id }) => {
    const user = await authComponent.getAuthUser(ctx);
    const group = await ctx.db.get(id);
    if (!group || group.owner !== user._id) throw new ConvexError('Group not found.');
    const items = await ctx.db
      .query('items')
      .withIndex('by_group', (q) => q.eq('groupId', id))
      .collect();
    for (const item of items) await ctx.db.patch(item._id, { groupId: undefined });
    await ctx.db.delete(id);
  }
});
