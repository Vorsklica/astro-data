import { readFile, writeFile } from "node:fs/promises";

import { config } from "../config.js";
import { getDailyAstronomy } from "./astronomy/usno.js";
import { extractDailyData, formatTelegramPost } from "./format.js";
import { sendTelegramMessage } from "./telegram.js";

async function main() {
  try {
    // Поточна дата за київським часом
    const date = new Intl.DateTimeFormat("en-CA", {
      timeZone: config.timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());

    console.log(`Перевірка дати: ${date}`);

    // Перевірка попередньої публікації
    let lastPublishedDate = "";

    try {
      lastPublishedDate = (await readFile(config.stateFile, "utf8")).trim();
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }

    if (lastPublishedDate === date) {
      console.log("Допис за сьогодні вже опубліковано.");
      return;
    }

    // Отримання астрономічних даних
    const raw = await getDailyAstronomy(date);

    // Обробка даних
    const data = extractDailyData(raw);

    // Формування допису
    const message = formatTelegramPost(data);

    console.log("\nПідготовлений допис:\n");
    console.log(message);

    // Тестовий режим — без публікації
    if (process.argv.includes("--dry-run")) {
      console.log("\nТЕСТОВИЙ РЕЖИМ: публікацію не виконано.");
      return;
    }

    // Публікація
    const result = await sendTelegramMessage(message);

    // Збереження дати після успішної публікації
    await writeFile(config.stateFile, date, "utf8");

    console.log("\nДопис успішно опубліковано!");
    console.log(`Message ID: ${result.message_id}`);
  } catch (error) {
    console.error("Помилка виконання:", error.message);
    process.exitCode = 1;
  }
}

main();
