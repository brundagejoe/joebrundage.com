type RssItem = {
  title: string
  link: string
  pubDate?: string
}

const FEED_URL =
  "https://www.bloomberg.com/opinion/authors/ARbTQlRLRjE/matthew-s-levine.rss"

function decodeXmlEntities(value: string): string {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
}

function stripCdata(value: string): string {
  const match = value.match(/^<!\[CDATA\[(.*)\]\]>$/s)
  return match ? match[1] : value
}

function extractTag(itemXml: string, tagName: string): string | undefined {
  const match = itemXml.match(new RegExp(`<${tagName}>([\\s\\S]*?)</${tagName}>`))
  if (!match) {
    return undefined
  }

  return decodeXmlEntities(stripCdata(match[1]).trim())
}

function parseRssItems(xml: string): RssItem[] {
  const itemMatches = Array.from(xml.matchAll(/<item\b[\s\S]*?<\/item>/g))

  return itemMatches
    .map((match) => {
      const itemXml = match[0]
      const title = extractTag(itemXml, "title")
      const link = extractTag(itemXml, "link")
      const pubDate = extractTag(itemXml, "pubDate")

      if (!title || !link) {
        return null
      }

      if (pubDate) {
        return { title, link, pubDate }
      }

      return { title, link }
    })
    .filter((item): item is RssItem => item !== null)
}

function toArchiveUrl(articleUrl: string): string {
  return `https://archive.ph/${articleUrl}`
}

function formatPubDate(pubDate?: string): string | null {
  if (!pubDate) {
    return null
  }

  const parsed = new Date(pubDate)
  if (Number.isNaN(parsed.getTime())) {
    return pubDate
  }

  const month = String(parsed.getMonth() + 1).padStart(2, "0")
  const day = String(parsed.getDate()).padStart(2, "0")
  return `${month}/${day}`
}

async function getMoneyStuffItems(): Promise<RssItem[]> {
  const response = await fetch(FEED_URL, {
    headers: { Accept: "application/rss+xml, application/xml;q=0.9, */*;q=0.8" },
    cache: "no-store",
  })

  if (!response.ok) {
    throw new Error(`Feed request failed with status ${response.status}`)
  }

  const xml = await response.text()
  return parseRssItems(xml)
}

export default async function MoneyStuffToolPage() {
  let items: RssItem[] = []
  let error: string | null = null

  try {
    items = await getMoneyStuffItems()
  } catch (caughtError) {
    error = caughtError instanceof Error ? caughtError.message : "Unknown error"
  }

  return (
    <div className="terminal min-h-screen bg-background pt-16 font-mono">
      <section className="mx-auto max-w-4xl px-6 py-8">
        <div className="max-w-4xl">
          <h2 className="text-xl font-bold tracking-wide">MONEY STUFF</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Bloomberg RSS via archive.ph
          </p>

          {error ? (
            <p className="mt-6 text-sm text-destructive">Failed to load feed: {error}</p>
          ) : null}

          {!error && items.length === 0 ? (
            <p className="mt-6 text-sm text-muted-foreground">No feed items found.</p>
          ) : null}

          <ol className="mt-5 space-y-1 border border-border bg-card px-3 py-3 text-sm leading-tight">
            {items.map((item, index) => (
              <li key={item.link}>
                <a
                  href={toArchiveUrl(item.link)}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: "var(--foreground)" }}
                  className="grid grid-cols-[auto_1fr_auto] items-start gap-3 text-foreground hover:underline"
                >
                  <span className="tabular-nums text-card-foreground">
                    {index + 1})
                  </span>
                  <span className="truncate">{item.title}</span>
                  <span className="w-10 text-right tabular-nums text-foreground">
                    {formatPubDate(item.pubDate) ?? "--/--"}
                  </span>
                </a>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </div>
  )
}
