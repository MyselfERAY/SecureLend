'use client';

import { useMemo } from 'react';
import DOMPurify from 'dompurify';

/**
 * Makale/HTML içeriğini tarayıcıda DOMPurify ile temizleyip render eder.
 * dangerouslySetInnerHTML'e ham içerik VERİLMEZ — stored XSS engeli.
 * İzinli etiketler sadece biçimlendirme + tablo; script/iframe/on* öznitelikleri
 * ve javascript: URL'leri elenir.
 */
export default function SafeHtml({
  html,
  className,
}: {
  html: string;
  className?: string;
}) {
  const clean = useMemo(
    () =>
      DOMPurify.sanitize(html, {
        ALLOWED_TAGS: [
          'p', 'br', 'strong', 'em', 'u', 'a', 'ul', 'ol', 'li',
          'h1', 'h2', 'h3', 'h4', 'blockquote', 'code', 'pre',
          'table', 'thead', 'tbody', 'tr', 'th', 'td', 'span', 'div',
        ],
        ALLOWED_ATTR: ['href', 'title', 'target', 'rel'],
        ALLOW_DATA_ATTR: false,
        // javascript:/data: gibi tehlikeli şemaları engelle (yalnızca güvenli linkler)
        ALLOWED_URI_REGEXP: /^(?:https?|mailto|tel):/i,
      }),
    [html],
  );

  return (
    <div className={className} dangerouslySetInnerHTML={{ __html: clean }} />
  );
}
