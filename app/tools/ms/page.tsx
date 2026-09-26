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
    <div className="min-h-screen bg-background pt-16">
      <div className="mx-auto max-w-[78rem] px-6 py-10">
        <div className="max-w-[44rem]">
          <h1 className="text-[2.4rem] leading-tight">Money Stuff</h1>
          <p className="mt-4 max-w-[38rem]">Bloomberg RSS via archive.ph</p>

          {error ? (
            <p className="mt-6 text-[0.9rem] text-destructive">
              Failed to load feed: {error}
            </p>
          ) : null}

          {!error && items.length === 0 ? (
            <p className="mt-6 text-[0.9rem] opacity-60">No feed items found.</p>
          ) : null}

          <ol className="mt-10 border-t border-current/20">
            {items.map((item, index) => (
              <li key={item.link} className="border-b border-current/10">
                <a
                  href={toArchiveUrl(item.link)}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: "var(--foreground)" }}
                  className="grid grid-cols-[2rem_1fr_auto] items-baseline gap-3 py-1.5 hover:underline"
                >
                  <span className="plate-data text-[0.8rem] opacity-50">
                    {index + 1}
                  </span>
                  <span className="truncate">{item.title}</span>
                  <span className="plate-data w-12 text-right text-[0.8rem] opacity-60">
                    {formatPubDate(item.pubDate) ?? "--/--"}
                  </span>
                </a>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  )
}
