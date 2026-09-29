// @ts-check
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';
import { sitemapConfig } from './vendor/site-toolkit/packages/sitemap-config/src/index.ts';
import { guides } from './src/data/guides.ts';

const shared = sitemapConfig();

export default defineConfig({
	site: 'https://morningwit.com',
	integrations: [
		sitemap({
			...shared,
			// /learn/ is noindex until the first guide exists, so keep it out of the sitemap too.
			filter: (page) => shared.filter(page) && (guides.length > 0 || !page.endsWith('/learn/')),
		}),
	],
	build: {
		inlineStylesheets: 'auto',
	},
});
