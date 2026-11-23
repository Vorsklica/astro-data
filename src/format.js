const moonPhases = {
  "New Moon": "Новий Місяць",
  "Waxing Crescent": "Молодик",
  "First Quarter": "Перша чверть",
  "Waxing Gibbous": "Зростаючий опуклий Місяць",
  "Full Moon": "Повня",
  "Waning Gibbous": "Спадаючий опуклий Місяць",
  "Last Quarter": "Остання чверть",
  "Waning Crescent": "Старий Місяць",
};

function getTime(events, phenomenon) {
  return events.find((event) => event.phen === phenomenon)?.time ?? null;
}

export function extractDailyData(response) {
  const data = response.properties.data;

  const sunrise = getTime(data.sundata, "Rise");
  const sunset = getTime(data.sundata, "Set");

  let dayLength = null;

  if (sunrise && sunset) {
    const [riseHour, riseMinute] = sunrise.split(":").map(Number);
    const [setHour, setMinute] = sunset.split(":").map(Number);

    const minutes = setHour * 60 + setMinute - riseHour * 60 - riseMinute;

    dayLength = {
      hours: Math.floor(minutes / 60),
      minutes: minutes % 60,
    };
  }

  return {
    date: {
      day: data.day,
      month: data.month,
      year: data.year,
      dayOfWeek: data.day_of_week,
    },

    sun: {
      sunrise,
      sunset,
      dayLength,
    },

    moon: {
      rise: getTime(data.moondata, "Rise"),
      set: getTime(data.moondata, "Set"),
      phase: moonPhases[data.curphase] ?? data.curphase,
      illumination: data.fracillum,
    },

    closestPhase: data.closestphase
      ? {
          day: data.closestphase.day,
          month: data.closestphase.month,
          year: data.closestphase.year,
          time: data.closestphase.time,
          phase: moonPhases[data.closestphase.phase] ?? data.closestphase.phase,
        }
      : null,
  };
}

const weekdays = [
  "неділя",
  "понеділок",
  "вівторок",
  "середа",
  "четвер",
  "п’ятниця",
  "субота",
];

const months = [
  "січня",
  "лютого",
  "березня",
  "квітня",
  "травня",
  "червня",
  "липня",
  "серпня",
  "вересня",
  "жовтня",
  "листопада",
  "грудня",
];

export function formatTelegramPost(data) {
  const { date, sun, moon, closestPhase } = data;

  const weekday =
    weekdays[
      new Date(Date.UTC(date.year, date.month - 1, date.day)).getUTCDay()
    ];

  let text = `🌞 **Астрономічний календар**

📅 ${weekday}, ${date.day} ${months[date.month - 1]} ${date.year} року
📍 Київ

🌅 **Сонце**
Схід: ${sun.sunrise ?? "—"}
Захід: ${sun.sunset ?? "—"}
Тривалість дня: ${
    sun.dayLength
      ? `${sun.dayLength.hours} год ${sun.dayLength.minutes} хв`
      : "—"
  }

🌙 **Місяць**
Схід: ${moon.rise ?? "—"}
Захід: ${moon.set ?? "—"}
Фаза: ${moon.phase ?? "—"}
Освітленість: ${moon.illumination ?? "—"}`;

  if (closestPhase) {
    text += `

🔭 **Найближча фаза**
${closestPhase.phase} — ${closestPhase.day} ${months[closestPhase.month - 1]} о ${closestPhase.time}`;
  }

  return text;
}
