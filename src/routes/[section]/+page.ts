import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';
const sections = [
  'links',
  'prompts',
  'more',
  'favorites',
  'settings',
  'text-to-image',
  'image-to-video'
] as const;
export const load: PageLoad = ({ params }) => {
  if (!sections.some((section) => section === params.section)) error(404, 'Page not found');
  return { section: params.section as (typeof sections)[number] };
};
