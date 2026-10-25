import { v, ConvexError } from 'convex/values';
import {
  query,
  mutation,
  action,
  internalMutation,
  internalQuery,
  type ActionCtx,
  type MutationCtx
} from './_generated/server';
import { internal } from './_generated/api';
import type { Id } from './_generated/dataModel';
import type { NewItem } from '../lib/types';
import { paginationOptsValidator } from 'convex/server';
import { category, visibility } from './schema';
import { authComponent } from './auth';
import { validateItem } from '../lib/validation';

export const list = query({
  args: {},
  handler: async (ctx) => {
    const user = await authComponent.getAuthUser(ctx);
    const items = await ctx.db
      .query('items')
      .withIndex('by_owner', (q) => q.eq('owner', user._id))
      .order('desc')
      .collect();
    return Promise.all(
      items.map(async (item) => ({
        ...item,
        ...(item.imageStorageId
          ? { imageUrl: (await ctx.storage.getUrl(item.imageStorageId)) ?? undefined }
          : {})
      }))
    );
  }
});
const createArgs = {
  kind: v.union(v.literal('link'), v.literal('prompt')),
  title: v.string(),
  content: v.string(),
  category: v.optional(category),
  tool: v.string(),
  visibility: v.optional(visibility),
  groupId: v.optional(v.id('groups'))
};

type ItemInput = Omit<NewItem, 'groupId'> & { groupId?: Id<'groups'> };
async function checkGroup(ctx: MutationCtx, owner: string, item: ItemInput) {
  if (!item.groupId) return;
  const group = await ctx.db.get(item.groupId);
  if (!group || group.owner !== owner || group.kind !== item.kind)
    throw new ConvexError('Choose one of your own groups for this item type.');
}

async function insertItem(ctx: MutationCtx, args: ItemInput, imageStorageId?: Id<'_storage'>) {
  const user = await authComponent.getAuthUser(ctx);
  const problem = validateItem(args);
  if (problem) throw new ConvexError(problem);
  await checkGroup(ctx, user._id, args);
  const now = Date.now();
  return ctx.db.insert('items', {
    ...args,
    category: args.kind === 'prompt' ? args.category : undefined,
    title: args.title.trim(),
    content: args.content.trim(),
    tool: args.tool.trim(),
    owner: user._id,
    ...(imageStorageId ? { imageStorageId } : {}),
    favorite: false,
    createdAt: now,
    visibility: args.visibility ?? 'private',
    ...(args.visibility === 'public'
      ? { authorName: user.name?.trim().slice(0, 80) || 'Community member', publishedAt: now }
      : {})
  });
}

export const create = mutation({ args: createArgs, handler: (ctx, args) => insertItem(ctx, args) });

export const createWithStoredImage = internalMutation({
  args: { ...createArgs, imageStorageId: v.id('_storage') },
  handler: (ctx, { imageStorageId, ...item }) => insertItem(ctx, item, imageStorageId)
});

async function storePreview(ctx: ActionCtx, image: ArrayBuffer, kind: string) {
  const bytes = new Uint8Array(image);
  const signature = (start: number, length: number) =>
    String.fromCharCode(...bytes.slice(start, start + length));
  if (
    kind !== 'link' ||
    bytes.length < 12 ||
    bytes.length > 100 * 1024 ||
    signature(0, 4) !== 'RIFF' ||
    signature(8, 4) !== 'WEBP'
  ) {
    throw new ConvexError('Choose a WebP preview image up to 100 KB for an affiliate link.');
  }
  return ctx.storage.store(new Blob([image], { type: 'image/webp' }));
}

export const createWithImage = action({
  args: { ...createArgs, image: v.bytes() },
  handler: async (ctx, { image, ...item }): Promise<Id<'items'>> => {
    await authComponent.getAuthUser(ctx);
    const problem = validateItem(item);
    if (problem) throw new ConvexError(problem);
    const imageStorageId = await storePreview(ctx, image, item.kind);
    try {
      return await ctx.runMutation(internal.items.createWithStoredImage, {
        ...item,
        imageStorageId
      });
    } catch (error) {
      await ctx.storage.delete(imageStorageId);
      throw error;
    }
  }
});

export const getOwned = internalQuery({
  args: { id: v.id('items') },
  handler: async (ctx, { id }) => {
    const user = await authComponent.getAuthUser(ctx);
    const item = await ctx.db.get(id);
    if (!item || item.owner !== user._id) throw new ConvexError('Record not found');
    return item;
  }
});

async function updateItem(
  ctx: MutationCtx,
  id: Id<'items'>,
  input: ItemInput,
  removeImage = false,
  imageStorageId?: Id<'_storage'>
) {
  const user = await authComponent.getAuthUser(ctx);
  const old = await ctx.db.get(id);
  if (!old || old.owner !== user._id) throw new ConvexError('Record not found');
  if (old.kind !== input.kind) throw new ConvexError('The item type cannot be changed.');
  const problem = validateItem(input);
  if (problem) throw new ConvexError(problem);
  await checkGroup(ctx, user._id, input);
  const nextImage = imageStorageId ?? (removeImage ? undefined : old.imageStorageId);
  await ctx.db.patch(id, {
    ...input,
    title: input.title.trim(),
    content: input.content.trim(),
    tool: input.tool.trim(),
    category: input.kind === 'prompt' ? input.category : undefined,
    groupId: input.groupId,
    visibility: input.visibility ?? 'private',
    imageStorageId: nextImage,
    authorName:
      input.visibility === 'public'
        ? user.name?.trim().slice(0, 80) || 'Community member'
        : undefined,
    publishedAt: input.visibility === 'public' ? (old.publishedAt ?? Date.now()) : undefined
  });
  if (old.imageStorageId && old.imageStorageId !== nextImage)
    await ctx.storage.delete(old.imageStorageId);
  return null;
}
export const update = mutation({
  args: { ...createArgs, id: v.id('items'), removeImage: v.optional(v.boolean()) },
  handler: (ctx, { id, removeImage, ...input }) => updateItem(ctx, id, input, removeImage)
});
export const updateWithStoredImage = internalMutation({
  args: { ...createArgs, id: v.id('items'), imageStorageId: v.id('_storage') },
  handler: (ctx, { id, imageStorageId, ...input }) =>
    updateItem(ctx, id, input, false, imageStorageId)
});
export const updateWithImage = action({
  args: { ...createArgs, id: v.id('items'), image: v.bytes() },
  handler: async (ctx, { id, image, ...input }): Promise<null> => {
    await ctx.runQuery(internal.items.getOwned, { id });
    const problem = validateItem(input);
    if (problem) throw new ConvexError(problem);
    const imageStorageId = await storePreview(ctx, image, input.kind);
    try {
      return await ctx.runMutation(internal.items.updateWithStoredImage, {
        ...input,
        id,
        imageStorageId
      });
    } catch (error) {
      await ctx.storage.delete(imageStorageId);
      throw error;
    }
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
      page: await Promise.all(
        result.page.map(async (item) => ({
          _id: item._id,
          kind: item.kind,
          title: item.title,
          content: item.content,
          ...(item.kind === 'prompt' && item.category ? { category: item.category } : {}),
          tool: item.tool,
          visibility: 'public' as const,
          authorName: item.authorName || 'Community member',
          publishedAt: item.publishedAt ?? item.createdAt,
          createdAt: item.createdAt,
          ...(item.imageStorageId
            ? { imageUrl: (await ctx.storage.getUrl(item.imageStorageId)) ?? undefined }
            : {})
        }))
      )
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
    if (item.imageStorageId) await ctx.storage.delete(item.imageStorageId);
  }
});
