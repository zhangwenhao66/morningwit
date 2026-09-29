// Tiny inline renderer for guide text: escapes HTML, then allows [text](url) and **bold**.

function escapeHtml(s: string): string {
	return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function renderInline(text: string): string {
	let out = escapeHtml(text);
	out = out.replace(/\[([^\]]+)\]\((\/[^)\s]*|https?:\/\/[^)\s]+)\)/g, (_m, label: string, url: string) => {
		const external = url.startsWith('http');
		return `<a href="${url}"${external ? ' rel="noopener" target="_blank"' : ''}>${label}</a>`;
	});
	out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
	return out;
}
