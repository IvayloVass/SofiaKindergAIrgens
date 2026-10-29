// Minimal allow-list HTML sanitizer for the "info for parents" text that
// kindergartens publish. Only simple formatting tags survive, without attributes
// (except safe links), so the result is safe to render in the browser.

const KEEP = new Set(['p', 'br', 'strong', 'b', 'em', 'i', 'u', 'ul', 'ol', 'li', 'a']);
const AS_PARAGRAPH = new Set(['div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'tr', 'table', 'blockquote']);
const DROP_WITH_CONTENT = /<(script|style|iframe|object|embed|noscript|template|svg|math)\b[\s\S]*?<\/\1\s*>/gi;
const SAFE_HREF = /^(https?:\/\/|mailto:|tel:)/i;

const escapeAttr = (value) => value.replace(/&(?!(?:[a-z]+|#\d+);)/gi, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

function rewriteTag(match, slash, rawName, attrs) {
  const name = rawName.toLowerCase();
  const closing = slash === '/';
  if (AS_PARAGRAPH.has(name)) return closing ? '</p>' : '<p>';
  if (name === 'td' || name === 'th') return ' ';
  if (!KEEP.has(name)) return '';
  if (name === 'br') return '<br>';
  if (closing) return `</${name}>`;
  if (name === 'a') {
    const href = /\bhref\s*=\s*(?:"([^"]*)"|'([^']*)')/i.exec(attrs);
    const url = (href?.[1] ?? href?.[2] ?? '').trim();
    return SAFE_HREF.test(url) ? `<a href="${escapeAttr(url)}" target="_blank" rel="noopener noreferrer">` : '<a>';
  }
  return `<${name}>`;
}

export function sanitizeHtml(html) {
  const cleaned = String(html ?? '')
    .replace(DROP_WITH_CONTENT, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    // Either a tag (rewritten) or a stray < / > (escaped).
    .replace(/<(\/?)([a-zA-Z][a-zA-Z0-9]*)\b([^<>]*)>|[<>]/g, (m, slash, name, attrs) =>
      name ? rewriteTag(m, slash, name, attrs ?? '') : m === '<' ? '&lt;' : '&gt;',
    )
    .replace(/&nbsp;/g, ' ');

  // Remove paragraphs that hold nothing but whitespace/formatting, and tidy up.
  const emptyPara = /<p>(?:\s|<br>|<\/?(?:strong|b|em|i|u)>)*<\/p>/g;
  let out = cleaned;
  for (let i = 0; i < 3; i++) out = out.replace(emptyPara, '');
  return out
    .replace(/(<br>\s*){3,}/g, '<br><br>')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{2,}/g, '\n')
    .trim();
}

/** Plain text version (used to decide whether there is any content at all). */
export function htmlToText(html) {
  return String(html ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
