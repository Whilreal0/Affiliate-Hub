import { makeFunctionReference } from 'convex/server';
import type { Item, NewItem, AdminUser } from './types';
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
