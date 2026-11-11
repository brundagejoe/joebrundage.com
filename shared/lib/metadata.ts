import type { Metadata } from "next"

export const SITE_NAME = "Joe Brundage"
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.joebrundage.com"

type PageMetadataInput = {
  /** Page title; the root layout's template appends the site name. */
  title: string
  description?: string
  /** Route path, used for the canonical URL and og:url. */
  path?: string
  /** Keep the page out of search results (auth, private, or personal pages). */
  noindex?: boolean
}

/**
 * Builds per-page metadata. Client pages cannot export `metadata`, so export
 * this from a sibling server `layout.tsx` instead of from `page.tsx`.
 */
export function pageMetadata({
  title,
  description,
  path,
  noindex,
}: PageMetadataInput): Metadata {
  return {
    title,
    description,
    ...(path ? { alternates: { canonical: path } } : {}),
    openGraph: {
      title,
      description,
      url: path,
      siteName: SITE_NAME,
      type: "website",
    },
    ...(noindex ? { robots: { index: false, follow: false } } : {}),
  }
}
