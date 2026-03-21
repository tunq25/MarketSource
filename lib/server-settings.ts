import { queryOne } from "@/lib/database";
import { logger } from "@/lib/logger";

type SettingRow = {
  value?: string | null;
};

function firstNonEmpty(values: Array<string | null | undefined>) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return "";
}

export async function getServerSetting(key: string, envKeys: string[] = []) {
  try {
    const row = await queryOne<SettingRow>(
      'SELECT value FROM settings WHERE "key" = $1',
      [key]
    );

    if (typeof row?.value === "string" && row.value.trim()) {
      return row.value.trim();
    }
  } catch (error) {
    logger.warn("Failed to read server setting from database", {
      key,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  return firstNonEmpty(envKeys.map((envKey) => process.env[envKey]));
}

export async function hasServerSetting(key: string, envKeys: string[] = []) {
  return Boolean(await getServerSetting(key, envKeys));
}

export async function getTelegramConfig() {
  const botToken = await getServerSetting("telegramBotToken", ["TELEGRAM_BOT_TOKEN"]);
  const chatId = await getServerSetting("telegramChatId", ["TELEGRAM_CHAT_ID"]);

  return { botToken, chatId };
}

export async function getWhatsAppNumber() {
  return getServerSetting("whatsappNumber", ["TWILIO_WHATSAPP_NUMBER"]);
}
