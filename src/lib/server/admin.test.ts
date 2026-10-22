import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineTestApp } from 'convex-test';
import * as betterAuthTest from '@convex-dev/better-auth/test';
import schema from '../../convex/schema';
import * as admin from '../../convex/admin';
import { components } from '../../convex/_generated/api';

const { api, createTest } = defineTestApp({
  schema,
  components: { betterAuth: betterAuthTest }
}).defineModules({ admin });
type Test = ReturnType<typeof createTest>;
async function register(t: Test, email: string, name: string, verified = true, expired = false) {
  const user = (await t.mutation(components.betterAuth.adapter.create, {
    input: {
      model: 'user',
      data: { name, email, emailVerified: verified, createdAt: Date.now(), updatedAt: Date.now() }
    }
  })) as { _id: string };
  const session = (await t.mutation(components.betterAuth.adapter.create, {
    input: {
      model: 'session',
      data: {
        userId: user._id,
        token: `test-session-${user._id}`,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        expiresAt: Date.now() + (expired ? -1000 : 3600000)
      }
    }
  })) as { _id: string };
  return t.withIdentity({ subject: user._id, sessionId: session._id });
}
const opts = { paginationOpts: { numItems: 25, cursor: null } };
afterEach(() => vi.unstubAllEnvs());

describe('super admin user directory with real auth component sessions', () => {
  it('denies anonymous visitors and regular members at the query boundary', async () => {
    vi.stubEnv('SUPER_ADMIN_EMAILS', 'owner@example.test');
    const t = createTest();
    const member = await register(t, 'member@example.test', 'Member');
    expect(await t.query(api.admin.access, {})).toEqual({ isSuperAdmin: false });
    expect(await member.query(api.admin.access, {})).toEqual({ isSuperAdmin: false });
    await expect(t.query(api.admin.listUsers, opts)).rejects.toThrow('Super admin access required');
    await expect(member.query(api.admin.listUsers, opts)).rejects.toThrow(
      'Super admin access required'
    );
  });

  it('requires a verified email, a valid session, and an explicit server allowlist', async () => {
    vi.stubEnv('SUPER_ADMIN_EMAILS', 'unverified@example.test,expired@example.test');
    const t = createTest();
    const unverified = await register(t, 'unverified@example.test', 'Unverified', false);
    const expired = await register(t, 'expired@example.test', 'Expired', true, true);
    expect(await unverified.query(api.admin.access, {})).toEqual({ isSuperAdmin: false });
    expect(await expired.query(api.admin.access, {})).toEqual({ isSuperAdmin: false });
    await expect(unverified.query(api.admin.listUsers, opts)).rejects.toThrow(
      'Super admin access required'
    );
    await expect(expired.query(api.admin.listUsers, opts)).rejects.toThrow(
      'Super admin access required'
    );
    vi.stubEnv('SUPER_ADMIN_EMAILS', '');
    const noAllowlist = await register(t, 'owner@example.test', 'Owner');
    expect(await noAllowlist.query(api.admin.access, {})).toEqual({ isSuperAdmin: false });
  });

  it('lists existing registrations and paginates while returning only directory fields', async () => {
    vi.stubEnv('SUPER_ADMIN_EMAILS', ' OWNER@EXAMPLE.TEST , another@example.test ');
    const t = createTest();
    await register(t, 'first@example.test', 'First Member');
    await register(t, 'second@example.test', 'Second Member', false);
    const owner = await register(t, 'owner@example.test', 'Owner');
    expect(await owner.query(api.admin.access, {})).toEqual({ isSuperAdmin: true });
    const first = await owner.query(api.admin.listUsers, {
      paginationOpts: { numItems: 2, cursor: null }
    });
    expect(first.page).toHaveLength(2);
    expect(first.isDone).toBe(false);
    const second = await owner.query(api.admin.listUsers, {
      paginationOpts: { numItems: 2, cursor: first.continueCursor }
    });
    expect(second.page).toHaveLength(1);
    expect(second.isDone).toBe(true);
    const users = [...first.page, ...second.page];
    expect(users.map((user) => user.email).sort()).toEqual([
      'first@example.test',
      'owner@example.test',
      'second@example.test'
    ]);
    expect(users.find((user) => user.email === 'owner@example.test')?.role).toBe('super_admin');
    for (const user of users) {
      expect(Object.keys(user).sort()).toEqual(
        ['email', 'emailVerified', 'id', 'name', 'registeredAt', 'role'].sort()
      );
    }
  });
});
