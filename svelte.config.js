import nodeAdapter from '@sveltejs/adapter-node';
import netlifyAdapter from '@sveltejs/adapter-netlify';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
export default {
  preprocess: vitePreprocess(),
  kit: {
    adapter:
      process.env.DEPLOY_TARGET === 'netlify' || process.env.NETLIFY === 'true'
        ? netlifyAdapter({ edge: false, split: false })
        : nodeAdapter(),
    alias: { $convex: './src/convex' }
  }
};
