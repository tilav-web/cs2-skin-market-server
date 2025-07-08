import { config } from 'dotenv';
config();

export const steamApiKey = process.env.STEAM_API_KEY;
export const serverUrl = process.env.SERVER_URL;
export const steamCallbackUrl = process.env.STEAM_CALLBACK_URL;
export const clientUrl = process.env.CLIENT_URL;
export const botToken = process.env.BOT_TOKEN;
