export type Category = 'text-to-image' | 'image-to-video';
export type WorkspaceView =
  | 'overview'
  | 'community'
  | 'admin'
  | 'links'
  | 'prompts'
  | 'more'
  | 'text-to-image'
  | 'image-to-video'
  | 'favorites'
  | 'settings';
export type Visibility = 'private' | 'public';
export type Item = {
  _id: string;
  kind: 'link' | 'prompt';
  title: string;
  content: string;
  category?: Category;
  tool: string;
  favorite?: boolean;
  createdAt: number;
  visibility?: Visibility;
  authorName?: string;
  publishedAt?: number;
  imageUrl?: string;
  groupId?: string;
};
export type NewItem = Pick<
  Item,
  'kind' | 'title' | 'content' | 'category' | 'tool' | 'visibility' | 'groupId'
>;
export type LibraryGroup = { _id: string; name: string; kind: 'link' | 'prompt' };
export type AdminUser = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  registeredAt: number;
  role: 'super_admin' | 'member';
};
