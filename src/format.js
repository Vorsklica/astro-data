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
