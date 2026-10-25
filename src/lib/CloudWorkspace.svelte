<script lang="ts">
  import { useAuth } from '@mmailaender/convex-better-auth-svelte/svelte';
  import { useQuery, usePaginatedQuery, useConvexClient } from 'convex-svelte';
  import { authClient } from './auth-client';
  import { page } from '$app/state';
  import { itemApi, adminApi, groupApi } from './api';
  import type { Id } from '$convex/_generated/dataModel';
  import Workspace from './Workspace.svelte';
  import type { WorkspaceView } from './types';
  let { initialView = 'overview' }: { initialView?: WorkspaceView } = $props();
  const auth = useAuth();
  const client = useConvexClient();
  const session = authClient.useSession();
  const items = useQuery(itemApi.list, () => (auth.isAuthenticated ? {} : 'skip'));
  const groups = useQuery(groupApi.list, () => (auth.isAuthenticated ? {} : 'skip'));
  const feed = usePaginatedQuery(itemApi.publicFeed, {}, { initialNumItems: 24 });
  const adminAccess = useQuery(adminApi.access, () => (auth.isAuthenticated ? {} : 'skip'));
</script>

<Workspace
  {initialView}
  cloud={true}
  authenticated={auth.isAuthenticated}
  authLoading={!auth.isAuthenticated && (auth.isLoading || $session.isPending)}
  loading={auth.isLoading || (auth.isAuthenticated && items.isLoading)}
  superAdmin={auth.isAuthenticated && adminAccess.data?.isSuperAdmin === true}
  adminAccessLoading={auth.isLoading || (auth.isAuthenticated && adminAccess.isLoading)}
  adminAccessError={adminAccess.error?.message}
  name={$session.data?.user.name ?? (auth.isAuthenticated ? page.data.authUser?.name : undefined)}
  cloudItems={items.data ?? []}
  cloudError={items.error?.message}
  cloudGroups={groups.data ?? []}
  groupError={groups.error?.message}
  ongroupmembers={async (id, add, remove) => {
    await client.mutation(groupApi.updateMembers, {
      id: id as Id<'groups'>,
      add: add as Id<'items'>[],
      remove: remove as Id<'items'>[]
    });
  }}
  oncreategroup={async (kind, name) => {
    await client.mutation(groupApi.create, { kind, name });
  }}
  onrenamegroup={async (id, name) => {
    await client.mutation(groupApi.rename, { id: id as Id<'groups'>, name });
  }}
  onremovegroup={async (id) => {
    await client.mutation(groupApi.remove, { id: id as Id<'groups'> });
  }}
  onupdate={async (id, item, image, removeImage) => {
    if (image)
      await client.action(itemApi.updateWithImage, {
        ...item,
        id: id as Id<'items'>,
        image: await image.arrayBuffer()
      });
    else await client.mutation(itemApi.update, { ...item, id: id as Id<'items'>, removeImage });
  }}
  publicItems={feed.results}
  publicLoading={feed.status === 'LoadingFirstPage' || feed.status === 'LoadingMore'}
  publicError={feed.error?.message}
  hasMorePublic={feed.status === 'CanLoadMore'}
  onloadmore={() => feed.loadMore(24)}
  onvisibility={async (id, visibility) => {
    await client.mutation(itemApi.setVisibility, { id: id as Id<'items'>, visibility });
  }}
  oncreate={async (item, image) => {
    if (image)
      await client.action(itemApi.createWithImage, { ...item, image: await image.arrayBuffer() });
    else await client.mutation(itemApi.create, item);
  }}
  onfavorite={async (id) => {
    await client.mutation(itemApi.favorite, { id: id as Id<'items'> });
  }}
  onremove={async (id) => {
    await client.mutation(itemApi.remove, { id: id as Id<'items'> });
  }}
/>
