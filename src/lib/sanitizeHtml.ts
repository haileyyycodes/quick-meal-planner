const ALLOWED_TAGS = new Set(['P', 'STRONG', 'EM', 'U', 'BR']);

/**
 * The recipe rich-text fields (notes, step text) are authored with Tiptap,
 * restricted to bold/italic/underline. Strip everything else before
 * rendering with dangerouslySetInnerHTML, in case stored content was ever
 * edited outside the app.
 */
export function sanitizeRichText(html: string): string {
  if (typeof window === 'undefined' || typeof DOMParser === 'undefined') {
    return html.replace(/<(?!\/?(p|strong|em|u|br)\b)[^>]*>/gi, '');
  }

  const doc = new DOMParser().parseFromString(html, 'text/html');

  const walk = (node: Node) => {
    for (const child of Array.from(node.childNodes)) {
      if (child.nodeType === Node.ELEMENT_NODE) {
        const element = child as HTMLElement;
        if (!ALLOWED_TAGS.has(element.tagName)) {
          while (element.firstChild) {
            node.insertBefore(element.firstChild, element);
          }
          node.removeChild(element);
          continue;
        }
        for (const attribute of Array.from(element.attributes)) {
          element.removeAttribute(attribute.name);
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
