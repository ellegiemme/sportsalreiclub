// Allow-list HTML cleaner for article bodies written in the admin.
// Keeps paragraphs, sub-headings, lists, emphasis, quotes and links; drops everything else.

const ALLOWED = new Set(['p', 'h2', 'h3', 'ul', 'ol', 'li', 'strong', 'b', 'em', 'i', 'a', 'blockquote', 'br']);

function cleanAttrs(tag, attrs) {
  let out = '';
  if (tag === 'p' && /class\s*=\s*["']lead["']/i.test(attrs)) out += ' class="lead"';
  if (tag === 'a') {
    const m = attrs.match(/href\s*=\s*"([^"]*)"|href\s*=\s*'([^']*)'/i);
    const href = (m && (m[1] ?? m[2]) || '').trim();
    if (/^(https?:\/\/|\/|#|mailto:)/i.test(href)) {
      out += ` href="${href.replace(/"/g, '&quot;')}"`;
      if (/^https?:\/\//i.test(href)) out += ' target="_blank" rel="noopener"';
    }
  }
  return out;
}

export function sanitize(input) {
  return String(input || '')
    .replace(/<(script|style|iframe|object|embed|template)[\s\S]*?<\/\1\s*>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<\/?([a-z0-9]+)([^>]*)>/gi, (whole, name, attrs) => {
      const tag = name.toLowerCase();
      if (!ALLOWED.has(tag)) return '';
      if (whole.startsWith('</')) return tag === 'br' ? '' : `</${tag}>`;
      return `<${tag}${cleanAttrs(tag, attrs)}>`;
    });
}
