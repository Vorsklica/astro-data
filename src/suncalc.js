import * as SunCalc from "suncalc";
import { config } from "../config.js";

const { latitude, longitude } = config.location;
const timezone = config.timezone;

const moonPhases = [
  { value: 0, name: "Новий Місяць" },
  { value: 0.25, name: "Перша чверть" },
  { value: 0.5, name: "Повня" },
  { value: 0.75, name: "Остання чверть" },
];

// Визначення UTC-зсуву для конкретної дати
function getUtcOffset(date) {
  const instant = new Date(`${date}T12:00:00Z`);

  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(instant);

  const hour = Number(parts.find((part) => part.type === "hour").value);

  return hour - 12;
}

// Початок місцевої доби в абсолютному часі
function getLocalMidnight(date) {
  const [year, month, day] = date.split("-").map(Number);

  return new Date(
    Date.UTC(year, month - 1, day) - getUtcOffset(date) * 3600000,
  );
}

// Форматування часу за київським часом
function formatTime(date) {
  if (!date || Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat("uk-UA", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);
}

// Отримання дати й часу за київським часом
function getLocalDateParts(date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );

  return {
    day: Number(values.day),
    month: Number(values.month),
    year: Number(values.year),
  };
}

// Тривалість дня
function getDayLength(sunrise, sunset) {
  if (!sunrise || !sunset) return null;

  const minutes = Math.round((sunset - sunrise) / 60000);

  return {
    hours: Math.floor(minutes / 60),
    minutes: minutes % 60,
  };
}

// Різниця фаз по колу
function phaseDistance(from, to) {
  return (to - from + 1) % 1;
}

// Пошук моменту проходження заданої фази
function findPhase(start, targetPhase) {
  const hour = 3600000;
  const searchPeriod = 10 * 24 * hour;

  let left = new Date(start);
  let leftPhase = SunCalc.getMoonIllumination(left).phase;

  // Перевіряємо наступні 10 діб
  for (let elapsed = hour; elapsed <= searchPeriod; elapsed += hour) {
    const right = new Date(start.getTime() + elapsed);
    const rightPhase = SunCalc.getMoonIllumination(right).phase;

    const progress = phaseDistance(leftPhase, rightPhase);
    const targetDistance = phaseDistance(leftPhase, targetPhase);

    if (targetDistance <= progress) {
      // Уточнюємо момент фази до мілісекунд
      let low = left.getTime();
      let high = right.getTime();

      while (high - low > 1000) {
        const middle = Math.floor((low + high) / 2);
        const middlePhase = SunCalc.getMoonIllumination(new Date(middle)).phase;

        const distance = phaseDistance(leftPhase, middlePhase);

        if (distance < targetDistance) {
          low = middle;
        } else {
          high = middle;
        }
      }

      return new Date(high);
    }

    left = right;
    leftPhase = rightPhase;
  }

  return null;
}

// Найближча основна фаза Місяця від початку доби
function getClosestPhase(start) {
  const phases = moonPhases
    .map((phase) => {
      const moment = findPhase(start, phase.value);

      return moment
        ? {
            moment,
            phase: phase.name,
          }
        : null;
    })
    .filter(Boolean);

  if (phases.length === 0) return null;

  phases.sort((a, b) => a.moment.getTime() - b.moment.getTime());

  const closest = phases[0];

  return {
    ...getLocalDateParts(closest.moment),
    time: formatTime(closest.moment),
    phase: closest.phase,
  };
}

// Отримання астрономічних даних за день
export async function getDailyAstronomy(date) {
  const localDate = getLocalMidnight(date);

  // Для розрахунку сходу та заходу беремо середину місцевої доби
  const calculationDate = new Date(localDate.getTime() + 12 * 3600000);

  const sun = SunCalc.getTimes(calculationDate, latitude, longitude);

  const moon = SunCalc.getMoonTimes(calculationDate, latitude, longitude);

  const illumination = SunCalc.getMoonIllumination(calculationDate);

  return {
    date: (() => {
      const [year, month, day] = date.split("-").map(Number);
      return { day, month, year };
    })(),

    sun: {
      sunrise: formatTime(sun.sunrise),
      sunset: formatTime(sun.sunset),
      dayLength: getDayLength(sun.sunrise, sun.sunset),
    },

    moon: {
      rise: moon.rise ? formatTime(moon.rise) : null,
      set: moon.set ? formatTime(moon.set) : null,
      phase: getMoonPhase(illumination.phase),
      illumination: `${Math.round(illumination.fraction * 100)}%`,
    },

    closestPhase: getClosestPhase(localDate),
  };
}

// Назва поточної фази Місяця
function getMoonPhase(phase) {
  if (phase < 0.025 || phase >= 0.975) {
    return "Новий Місяць";
  }
  if (phase < 0.225) return "Молодик";
  if (phase < 0.275) return "Перша чверть";
  if (phase < 0.475) return "Зростаючий опуклий Місяць";
  if (phase < 0.525) return "Повня";
  if (phase < 0.725) return "Спадаючий опуклий Місяць";
  if (phase < 0.775) return "Остання чверть";

  return "Старий Місяць";
}
