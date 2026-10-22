import { ConvexError } from 'convex/values';
import { paginationOptsValidator, type PaginationResult } from 'convex/server';
import { query } from './_generated/server';
import { components } from './_generated/api';
import { authComponent } from './auth';
import type { AdminUser } from '../lib/types';

function isSuperAdmin(user: { email: string; emailVerified: boolean } | undefined): boolean {
  if (!user?.emailVerified) return false;
  const allowed = (process.env.SUPER_ADMIN_EMAILS ?? '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
  return allowed.includes(user.email.trim().toLowerCase());
}

export const access = query({
  args: {},
  handler: async (ctx) => ({ isSuperAdmin: isSuperAdmin(await authComponent.safeGetAuthUser(ctx)) })
});

export const listUsers = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, { paginationOpts }): Promise<PaginationResult<AdminUser>> => {
    const viewer = await authComponent.safeGetAuthUser(ctx);
    if (!isSuperAdmin(viewer)) throw new ConvexError('Super admin access required.');
    const result: PaginationResult<{
      _id: string;
      name: string;
      email: string;
      emailVerified: boolean;
      createdAt: number;
    }> = await ctx.runQuery(components.betterAuth.adapter.findMany, {
      model: 'user',
      select: ['_id', 'name', 'email', 'emailVerified', 'createdAt'],
      sortBy: { field: 'createdAt', direction: 'desc' },
      paginationOpts: {
        ...paginationOpts,
        numItems: Math.min(50, Math.max(1, paginationOpts.numItems))
      }
    });
    return {
      ...result,
      page: result.page.map((user) => ({
        id: user._id,
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified,
        registeredAt: user.createdAt,
        role: isSuperAdmin(user) ? 'super_admin' : 'member'
      }))
    };
  }
});
