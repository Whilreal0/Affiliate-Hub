import { makeFunctionReference } from 'convex/server';
import type { Item, NewItem, AdminUser, LibraryGroup } from './types';
import type { PaginationOptions, PaginationResult } from 'convex/server';
import type { Id } from '$convex/_generated/dataModel';
// Explicit references allow a local build before the first cloud deployment.
export const itemApi = {
  list: makeFunctionReference<'query', Record<string, never>, Item[]>('items:list'),
  publicFeed: makeFunctionReference<
    'query',
    { paginationOpts: PaginationOptions },
    PaginationResult<Item>
  >('items:publicFeed'),
  setVisibility: makeFunctionReference<
    'mutation',
    { id: Id<'items'>; visibility: 'private' | 'public' },
    null
  >('items:setVisibility'),
  create: makeFunctionReference<'mutation', NewItem, Id<'items'>>('items:create'),
  update: makeFunctionReference<
    'mutation',
    NewItem & { id: Id<'items'>; removeImage?: boolean },
    null
  >('items:update'),
  updateWithImage: makeFunctionReference<
    'action',
    NewItem & { id: Id<'items'>; image: ArrayBuffer },
    null
  >('items:updateWithImage'),
  createWithImage: makeFunctionReference<'action', NewItem & { image: ArrayBuffer }, Id<'items'>>(
    'items:createWithImage'
  ),
  favorite: makeFunctionReference<'mutation', { id: Id<'items'> }, null>('items:favorite'),
  remove: makeFunctionReference<'mutation', { id: Id<'items'> }, null>('items:remove')
};
export const adminApi = {
  access: makeFunctionReference<'query', Record<string, never>, { isSuperAdmin: boolean }>(
    'admin:access'
  ),
  listUsers: makeFunctionReference<
    'query',
    { paginationOpts: PaginationOptions },
    PaginationResult<AdminUser>
  >('admin:listUsers')
};

export const groupApi = {
  list: makeFunctionReference<'query', Record<string, never>, LibraryGroup[]>('groups:list'),
  create: makeFunctionReference<
    'mutation',
    { name: string; kind: 'link' | 'prompt' },
    Id<'groups'>
  >('groups:create'),
  rename: makeFunctionReference<'mutation', { id: Id<'groups'>; name: string }, null>(
    'groups:rename'
  ),
  remove: makeFunctionReference<'mutation', { id: Id<'groups'> }, null>('groups:remove')
};
