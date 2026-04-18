const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!

type GoogleTokenRow = {
  access_token: string
  refresh_token: string | null
  expires_at: string | null
  calendar_id: string | null
  owner_id: string
}

async function refreshAccessToken(token: GoogleTokenRow): Promise<string> {
  if (!token.refresh_token) throw new Error('Sem refresh token')

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: token.refresh_token,
      grant_type: 'refresh_token',
    }),
  })
  const data = await res.json()
  return data.access_token
}

export async function getValidAccessToken(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  ownerId: string
): Promise<{ accessToken: string; calendarId: string } | null> {
  const { data: token } = await supabase
    .from('google_tokens')
    .select('*')
    .eq('owner_id', ownerId)
    .single() as { data: GoogleTokenRow | null }

  if (!token) return null

  const isExpired = token.expires_at ? new Date(token.expires_at) < new Date() : false
  const accessToken = isExpired ? await refreshAccessToken(token) : token.access_token

  if (isExpired) {
    const expiresAt = new Date(Date.now() + 3600 * 1000).toISOString()
    await supabase.from('google_tokens').update({ access_token: accessToken, expires_at: expiresAt }).eq('owner_id', ownerId)
  }

  return { accessToken, calendarId: token.calendar_id ?? 'primary' }
}

type CalendarEventInput = {
  title: string
  date: string
  description?: string
  googleEventId?: string | null
}

export async function upsertCalendarEvent(
  accessToken: string,
  calendarId: string,
  event: CalendarEventInput
): Promise<string | null> {
  const body = {
    summary: event.title,
    description: event.description ?? '',
    start: { date: event.date },
    end: { date: event.date },
  }

  let res: Response
  if (event.googleEventId) {
    res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${event.googleEventId}`,
      {
        method: 'PUT',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }
    )
  } else {
    res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }
    )
  }

  const data = await res.json()
  return data.id ?? null
}

export async function deleteCalendarEvent(
  accessToken: string,
  calendarId: string,
  googleEventId: string
): Promise<void> {
  await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${googleEventId}`,
    {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  )
}
