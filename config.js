import "dotenv/config";

export const config = {
  // Місце астрономічних розрахунків
  location: {
    name: "Київ",
    latitude: 50.4501,
    longitude: 30.5234,
  },

  // Часовий пояс
  timezone: "Europe/Kyiv",

  // Telegram
  telegram: {
    botToken: process.env.BOT_TOKEN,
    channelId: process.env.CHANNEL_ID,
  },

  // Шлях до файлу стану
  stateFile: "state/last-published-date.txt",
};
