import { config } from "../config.js";

export async function sendTelegramMessage(text) {
  const { botToken, channelId } = config.telegram;

  if (!botToken || !channelId) {
    throw new Error("Не задано BOT_TOKEN або CHANNEL_ID");
  }

  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      chat_id: channelId,
      text,
      parse_mode: "Markdown",
      disable_web_page_preview: true,
    }),
  });

  const result = await response.json();

  if (!result.ok) {
    throw new Error(`Telegram API: ${result.description}`);
  }

  return result.result;
}
