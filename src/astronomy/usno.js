const API_URL = "https://aa.usno.navy.mil/api";

/**
 * Отримання даних з USNO API
 */
export async function fetchUSNO(endpoint, params = {}) {
  const url = new URL(`${API_URL}/${endpoint}`);

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, value);
    }
  }

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `USNO API error: ${response.status} ${response.statusText}`,
    );
  }

  const data = await response.json();

  if (data.error) {
    throw new Error(`USNO API: ${data.error}`);
  }

  return data;
}

import { config } from "../../config.js";

// Визначення різниці між місцевим часом та UTC
function getUtcOffset(date, timezone) {
  const instant = new Date(`${date}T12:00:00Z`);

  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(instant);

  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );

  const localAsUTC = Date.UTC(
    Number(values.year),
    Number(values.month) - 1,
    Number(values.day),
    Number(values.hour),
    Number(values.minute),
    Number(values.second),
  );

  return (localAsUTC - instant.getTime()) / 3600000;
}

// Отримання даних про Сонце та Місяць за день
export async function getDailyAstronomy(date) {
  const { latitude, longitude } = config.location;

  const tz = getUtcOffset(date, config.timezone);

  return await fetchUSNO("rstt/oneday", {
    date,
    coords: `${latitude}, ${longitude}`,
    tz,
  });
}
