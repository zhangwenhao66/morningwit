import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { SITE_TITLE, SITE_DESCRIPTION } from '../consts';

// The feed lists new pages as they are published. It starts empty on purpose.
export async function GET(context: APIContext) {
	return rss({
		title: `${SITE_TITLE} updates`,
		description: SITE_DESCRIPTION,
		site: context.site ?? 'https://morningwit.com',
		items: [],
	});
}
