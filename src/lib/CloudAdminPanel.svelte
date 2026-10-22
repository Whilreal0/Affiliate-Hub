<script lang="ts">
  import { usePaginatedQuery } from 'convex-svelte';
  import { adminApi } from './api';
  import AdminPanel from './AdminPanel.svelte';
  const users = usePaginatedQuery(adminApi.listUsers, {}, { initialNumItems: 25 });
</script>

<AdminPanel
  cloud
  users={users.results}
  loading={users.status === 'LoadingFirstPage' || users.status === 'LoadingMore'}
  error={users.error?.message}
  hasMore={users.status === 'CanLoadMore'}
  onloadmore={() => users.loadMore(25)}
/>
