import { describe, expect, it, vi } from 'vitest';
import { defineTestApp } from 'convex-test';
import schema from '../../convex/schema';
import * as items from '../../convex/items';

// Replace only the external session service; database, indexes, validators,
// access checks, and the public projection execute through convex-test.
vi.mock('../../convex/auth', () => ({
  authComponent: {
    getAuthUser: async (ctx: {
      auth: { getUserIdentity: () => Promise<{ subject: string; name?: string } | null> };
    }) => {
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) throw new Error('Unauthenticated');
      return { _id: identity.subject, name: identity.name };
    }
  }
}));

const { api, createTest } = defineTestApp({ schema }).defineModules({ items });
const link = {
  kind: 'link' as const,
  title: 'Desk lamp',
  content: 'https://example.com/lamp?ref=alice',
  tool: 'Store'
};
const pageOptions = { paginationOpts: { numItems: 10, cursor: null } };

describe('public posting and record privacy', () => {
  it('saves an image and tracking URL, keeps it owner-only, publishes it, and cleans up storage on deletion', async () => {
    const t = createTest();
    const alice = t.withIdentity({ subject: 'alice', name: 'Alice' });
    const bob = t.withIdentity({ subject: 'bob' });
    const image = Uint8Array.from(
      Buffer.from('UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA', 'base64')
    ).buffer;
    await expect(t.action(api.items.createWithImage, { ...link, image })).rejects.toThrow(
      'Unauthenticated'
    );
    await expect(
      alice.action(api.items.createWithImage, { ...link, image: new ArrayBuffer(12) })
    ).rejects.toThrow('WebP');
    await expect(
      alice.action(api.items.createWithImage, { ...link, image: new ArrayBuffer(102401) })
    ).rejects.toThrow('WebP');
    const id = await alice.action(api.items.createWithImage, { ...link, image });
    const saved = (await alice.query(api.items.list, {}))[0];
    expect(saved.content).toBe(link.content);
    expect(saved.imageUrl).toBeTruthy();
    expect(await bob.query(api.items.list, {})).toEqual([]);
    expect((await t.query(api.items.publicFeed, pageOptions)).page).toHaveLength(0);
    await expect(bob.mutation(api.items.remove, { id })).rejects.toThrow('Record not found');
    await alice.mutation(api.items.setVisibility, { id, visibility: 'public' });
    const publicItem = (await t.query(api.items.publicFeed, pageOptions)).page[0];
    expect(publicItem.imageUrl).toBeTruthy();
    expect(publicItem).not.toHaveProperty('imageStorageId');
    await alice.mutation(api.items.remove, { id });
    expect(await alice.query(api.items.list, {})).toEqual([]);
    expect(await t.run((ctx) => ctx.db.system.query('_storage').collect())).toHaveLength(0);
  });

  it('keeps new and legacy records private; exposes published content without identity or favorites', async () => {
    const t = createTest();
    const alice = t.withIdentity({ subject: 'alice', name: 'Alice' });
    await alice.mutation(api.items.create, link);
    await t.run((ctx) =>
      ctx.db.insert('items', {
        ...link,
        owner: 'legacy',
        favorite: true,
        createdAt: 1,
        category: 'text-to-image'
      })
    );
    const id = await alice.mutation(api.items.create, {
      ...link,
      title: 'Public lamp',
      visibility: 'public'
    });
    const result = await t.query(api.items.publicFeed, pageOptions);
    expect(result.page).toHaveLength(1);
    expect(result.page[0]).toMatchObject({
      _id: id,
      title: 'Public lamp',
      authorName: 'Alice',
      visibility: 'public'
    });
    expect(result.page[0]).not.toHaveProperty('owner');
    expect(result.page[0]).not.toHaveProperty('favorite');
    expect(result.page[0]).not.toHaveProperty('category');
    await expect(t.query(api.items.list, {})).rejects.toThrow('Unauthenticated');
  });

  it('allows only the owner to publish, withdraw, or delete and removes withdrawn posts from the feed', async () => {
    const t = createTest();
    const alice = t.withIdentity({ subject: 'alice', name: 'Alice' });
    const bob = t.withIdentity({ subject: 'bob', name: 'Bob' });
    const id = await alice.mutation(api.items.create, link);
    await expect(
      bob.mutation(api.items.setVisibility, { id, visibility: 'public' })
    ).rejects.toThrow('Record not found');
    await expect(t.mutation(api.items.setVisibility, { id, visibility: 'public' })).rejects.toThrow(
      'Unauthenticated'
    );
    await alice.mutation(api.items.setVisibility, { id, visibility: 'public' });
    expect((await t.query(api.items.publicFeed, pageOptions)).page).toHaveLength(1);
    await expect(bob.mutation(api.items.remove, { id })).rejects.toThrow('Record not found');
    await expect(
      bob.mutation(api.items.setVisibility, { id, visibility: 'private' })
    ).rejects.toThrow('Record not found');
    expect(await bob.query(api.items.list, {})).toHaveLength(0);
    await alice.mutation(api.items.setVisibility, { id, visibility: 'private' });
    expect((await t.query(api.items.publicFeed, pageOptions)).page).toHaveLength(0);
    expect(await alice.query(api.items.list, {})).toHaveLength(1);
    await alice.mutation(api.items.setVisibility, { id, visibility: 'public' });
    await alice.mutation(api.items.remove, { id });
    expect((await t.query(api.items.publicFeed, pageOptions)).page).toHaveLength(0);
  });

  it('shares image and video prompts and paginates through public posts', async () => {
    const t = createTest();
    const alice = t.withIdentity({ subject: 'alice', name: 'Alice' });
    await alice.mutation(api.items.create, { ...link, visibility: 'public' });
    await alice.mutation(api.items.create, {
      ...link,
      kind: 'prompt',
      category: 'text-to-image',
      visibility: 'public',
      content: 'Photo of [PRODUCT]'
    });
    await alice.mutation(api.items.create, {
      ...link,
      kind: 'prompt',
      category: 'image-to-video',
      visibility: 'public',
      content: 'Animate [PRODUCT]'
    });
    const first = await t.query(api.items.publicFeed, {
      paginationOpts: { numItems: 2, cursor: null }
    });
    expect(first.page).toHaveLength(2);
    expect(first.isDone).toBe(false);
    const second = await t.query(api.items.publicFeed, {
      paginationOpts: { numItems: 2, cursor: first.continueCursor }
    });
    expect(second.page).toHaveLength(1);
    expect(second.isDone).toBe(true);
    expect(new Set([...first.page, ...second.page].map((post) => post._id)).size).toBe(3);
  });

  it('rejects anonymous publishing, unsafe links, and uncategorized prompts', async () => {
    const t = createTest();
    const alice = t.withIdentity({ subject: 'alice', name: 'Alice' });
    for (const invalid of [
      { title: 'x'.repeat(121) },
      { tool: 'x'.repeat(81) },
      { content: 'https://user:password@example.com' },
      { title: 'bad\u0000title' }
    ]) {
      await expect(alice.mutation(api.items.create, { ...link, ...invalid })).rejects.toThrow();
    }
    await expect(t.mutation(api.items.create, { ...link, visibility: 'public' })).rejects.toThrow(
      'Unauthenticated'
    );
    await expect(
      alice.mutation(api.items.create, {
        ...link,
        visibility: 'public',
        content: 'javascript:alert(1)'
      })
    ).rejects.toThrow('http');
    await expect(
      alice.mutation(api.items.create, { ...link, kind: 'prompt', content: 'Photo' })
    ).rejects.toThrow('category');
  });
});
