function formatDateForIcs(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0")
  return [
    date.getUTCFullYear(),
    pad(date.getUTCMonth() + 1),
    pad(date.getUTCDate()),
    "T",
    pad(date.getUTCHours()),
    pad(date.getUTCMinutes()),
    pad(date.getUTCSeconds()),
    "Z",
  ].join("")
}

export function buildGoogleCalendarLink(params: {
  title: string
  description: string
  startIso: string
  durationMinutes?: number
}) {
  const start = new Date(params.startIso)
  const end = new Date(start.getTime() + (params.durationMinutes ?? 90) * 60 * 1000)

  const dates = `${formatDateForIcs(start)}/${formatDateForIcs(end)}`
  const url = new URL("https://calendar.google.com/calendar/render")
  url.searchParams.set("action", "TEMPLATE")
  url.searchParams.set("text", params.title)
  url.searchParams.set("details", params.description)
  url.searchParams.set("dates", dates)
  return url.toString()
}

export function buildIcsContent(params: {
  title: string
  description: string
  startIso: string
  durationMinutes?: number
  uid: string
}) {
  const start = new Date(params.startIso)
  const end = new Date(start.getTime() + (params.durationMinutes ?? 90) * 60 * 1000)
  const now = new Date()

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Joe Brundage//Bookclub//EN",
    "BEGIN:VEVENT",
    `UID:${params.uid}`,
    `DTSTAMP:${formatDateForIcs(now)}`,
    `DTSTART:${formatDateForIcs(start)}`,
    `DTEND:${formatDateForIcs(end)}`,
    `SUMMARY:${params.title.replace(/\n/g, " ")}`,
    `DESCRIPTION:${params.description.replace(/\n/g, " ")}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n")
}
