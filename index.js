import ObsWebSocket from "obs-websocket-js";
import {getCurrentStream} from "./utils/youtube.js";
import {sendMessage} from "./utils/sendMessage.js";
import {sleep} from "./utils/utils.js";

async function onStreamStarted() {
  try {
    let currentStream;
    for (let tries = 0; tries < 10; tries++) {
      currentStream = await getCurrentStream();
      if (currentStream) {
        break;
      }
      await sleep(tries * 1000);
    }
    if (!currentStream) {
      console.log("Stream is not live");
      return
    }
    console.log(currentStream);
    await sendMessage(currentStream);
  } catch (e) {
    console.log("Error handling onStreamStarted");
    console.error(e);
  }
}


await getCurrentStream(); // Refresh tokens before begin

const obs = new ObsWebSocket();
try {
  await obs.connect({"secure": false});
  obs.on("StreamStarted", onStreamStarted);
} catch (e) {
  console.log("ObsWebsocket Error:", e);
}
