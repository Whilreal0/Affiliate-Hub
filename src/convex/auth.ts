import { createClient, type GenericCtx } from '@convex-dev/better-auth';
import { convex } from '@convex-dev/better-auth/plugins';
import { betterAuth } from 'better-auth/minimal';
import { components } from './_generated/api';
import type { DataModel } from './_generated/dataModel';
import { query } from './_generated/server';
import authConfig from './auth.config';
import { getAuthOrigins } from './authOrigins';

export const authComponent = createClient<DataModel>(components.betterAuth);
export const createAuth = (ctx: GenericCtx<DataModel>) => {
  const origins = getAuthOrigins(process.env.SITE_URL!, process.env.AUTH_TRUSTED_ORIGINS);
  return betterAuth({
    baseURL: {
      allowedHosts: origins.map((origin) => new URL(origin).host),
      fallback: origins[0],
      protocol: 'auto'
    },
    secret: process.env.BETTER_AUTH_SECRET!,
    trustedOrigins: origins,
    database: authComponent.adapter(ctx),
    socialProviders: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!
      }
    },
    plugins: [convex({ authConfig })]
  });
};
export const getCurrentUser = query({ args: {}, handler: (ctx) => authComponent.getAuthUser(ctx) });
