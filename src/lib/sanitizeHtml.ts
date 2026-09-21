const ALLOWED_TAGS = new Set(['P', 'STRONG', 'EM', 'U', 'BR', 'UL', 'OL', 'LI', 'A']);
// Disallowed tags are normally unwrapped (children promoted, text kept) rather than deleted —
// but these carry non-prose payloads, so drop them (and their content) entirely.
const STRIP_CONTENTS_TAGS = new Set(['SCRIPT', 'STYLE']);
const SAFE_URL_PATTERN = /^(https?:|mailto:|\/|#)/i;

function sanitizeHref(href: string | null): string | null {
  if (!href) return null;
  const trimmed = href.trim();
  return SAFE_URL_PATTERN.test(trimmed) ? trimmed : null;
}

/**
 * The recipe rich-text fields (notes, instructions) are authored with Tiptap,
 * restricted to bold/italic/underline/lists/links. Strip everything else before
 * rendering with dangerouslySetInnerHTML, in case stored content was ever
 * edited outside the app.
 */
export function sanitizeRichText(html: string): string {
  if (typeof window === 'undefined' || typeof DOMParser === 'undefined') {
    const withoutScriptsAndStyles = html.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, '');
    return withoutScriptsAndStyles.replace(/<(?!\/?(p|strong|em|u|br|ul|ol|li|a)\b)[^>]*>/gi, '');
  }

  const doc = new DOMParser().parseFromString(html, 'text/html');

  const walk = (node: Node) => {
    for (const child of Array.from(node.childNodes)) {
      if (child.nodeType === Node.ELEMENT_NODE) {
        const element = child as HTMLElement;
        if (STRIP_CONTENTS_TAGS.has(element.tagName)) {
          node.removeChild(element);
          continue;
        }
        if (!ALLOWED_TAGS.has(element.tagName)) {
          while (element.firstChild) {
            node.insertBefore(element.firstChild, element);
          }
          node.removeChild(element);
          continue;
        }

        const safeHref = element.tagName === 'A' ? sanitizeHref(element.getAttribute('href')) : null;
        for (const attribute of Array.from(element.attributes)) {
          element.removeAttribute(attribute.name);
        }
        if (element.tagName === 'A') {
          if (safeHref) {
            element.setAttribute('href', safeHref);
            element.setAttribute('target', '_blank');
            element.setAttribute('rel', 'noopener noreferrer');
          } else {
            // No safe destination — keep the text but drop the link itself.
            while (element.firstChild) {
              node.insertBefore(element.firstChild, element);
            }
            node.removeChild(element);
            continue;
          }
        }
        walk(element);
      } else if (child.nodeType !== Node.TEXT_NODE) {
        node.removeChild(child);
      }
    }
  };

  walk(doc.body);
  return doc.body.innerHTML;
}
