import fetch from "node-fetch";
import {get} from "./config.js";

export async function sendMessage(streamData) {
  const {
    BotToken,
    ChatId,
  } = get("Telegram");
  await fetch(`https://api.telegram.org/bot${BotToken}/sendMessage`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      chat_id: ChatId,
      text: streamData.url,
      silent: true,
    })
  });
}
