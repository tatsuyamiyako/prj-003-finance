import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const TOKEN_PATH = join(process.cwd(), ".google-token.json");
const CLIENT_ID = () => process.env.GOOGLE_CLIENT_ID ?? "";
const CLIENT_SECRET = () => process.env.GOOGLE_CLIENT_SECRET ?? "";
const CALENDAR_ID = () =>
  process.env.GOOGLE_CALENDAR_ID || "tatsuya.miyako@bru-scape.com";

type TokenData = {
  access_token: string;
  refresh_token: string;
  expires_at: number;
};

function readToken(): TokenData | null {
  try {
    return JSON.parse(readFileSync(TOKEN_PATH, "utf-8"));
  } catch {
    return null;
  }
}

async function getAccessToken(): Promise<string | null> {
  const token = readToken();
  if (!token) return null;

  if (Date.now() < token.expires_at) {
    return token.access_token;
  }

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: CLIENT_ID(),
      client_secret: CLIENT_SECRET(),
      refresh_token: token.refresh_token,
      grant_type: "refresh_token",
    }),
  });

  const data = await res.json();
  if (data.error) {
    console.error("Google token refresh failed:", data);
    return null;
  }

  const updated: TokenData = {
    access_token: data.access_token,
    refresh_token: data.refresh_token || token.refresh_token,
    expires_at: Date.now() + (data.expires_in - 60) * 1000,
  };
  writeFileSync(TOKEN_PATH, JSON.stringify(updated, null, 2));
  return updated.access_token;
}

type SyncItem = {
  id: string;
  title: string;
  side: string;
  start_date: string | null;
  due_date: string | null;
  is_done: boolean;
  google_event_id: string | null;
  assignee_names: string[];
  project_label: string | null;
};

export async function syncToGoogleCalendar(items: SyncItem[]): Promise<
  { itemId: string; eventId: string }[]
> {
  const accessToken = await getAccessToken();
  if (!accessToken) return [];

  const calendarId = encodeURIComponent(CALENDAR_ID());
  const baseUrl = `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`;
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };

  const results: { itemId: string; eventId: string }[] = [];

  for (const item of items) {
    if (!item.start_date && !item.due_date) continue;

    const startDate = item.start_date ?? item.due_date!;
    const endDateRaw = item.due_date ?? item.start_date!;
    const endDate = addOneDay(endDateRaw);

    const sideLabel = item.side === "bruscape" ? "BRU" : "お客様";
    const summary = `[${sideLabel}] ${item.title}`;

    const descriptionParts: string[] = [];
    if (item.project_label) descriptionParts.push(item.project_label);
    if (item.assignee_names.length > 0)
      descriptionParts.push(`担当: ${item.assignee_names.join(", ")}`);
    if (item.is_done) descriptionParts.push("✅ 完了");

    const eventBody = {
      summary,
      description: descriptionParts.join("\n"),
      start: { date: startDate },
      end: { date: endDate },
      transparency: "transparent",
    };

    try {
      if (item.google_event_id) {
        const res = await fetch(`${baseUrl}/${item.google_event_id}`, {
          method: "PUT",
          headers,
          body: JSON.stringify(eventBody),
        });
        if (res.ok) {
          results.push({ itemId: item.id, eventId: item.google_event_id });
        } else if (res.status === 404 || res.status === 410) {
          const createRes = await fetch(baseUrl, {
            method: "POST",
            headers,
            body: JSON.stringify(eventBody),
          });
          const created = await createRes.json();
          if (created.id) results.push({ itemId: item.id, eventId: created.id });
        } else {
          console.error(`Calendar update failed for item ${item.id}:`, await res.text());
        }
      } else {
        const res = await fetch(baseUrl, {
          method: "POST",
          headers,
          body: JSON.stringify(eventBody),
        });
        const created = await res.json();
        if (created.id) {
          results.push({ itemId: item.id, eventId: created.id });
        } else {
          console.error(`Calendar create failed for item ${item.id}:`, created);
        }
      }
    } catch (e) {
      console.error(`Calendar sync failed for item ${item.id}:`, e);
    }
  }

  return results;
}

export async function deleteGoogleCalendarEvent(eventId: string) {
  const accessToken = await getAccessToken();
  if (!accessToken) return;

  const calendarId = encodeURIComponent(CALENDAR_ID());
  try {
    await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${eventId}`,
      { method: "DELETE", headers: { Authorization: `Bearer ${accessToken}` } }
    );
  } catch (e) {
    console.error(`Calendar delete failed for event ${eventId}:`, e);
  }
}

function addOneDay(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}
