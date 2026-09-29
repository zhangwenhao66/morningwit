// @ts-check
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';
import { sitemapConfig } from './vendor/site-toolkit/packages/sitemap-config/src/index.ts';

export default defineConfig({
	site: 'https://morningwit.com',
	integrations: [sitemap(sitemapConfig())],
	build: {
		inlineStylesheets: 'auto',
	},
});
