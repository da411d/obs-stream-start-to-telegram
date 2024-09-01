import * as http from "node:http";
import open from "open";
import fetch from "node-fetch";
import * as config from './config.js';
import {noop, rand, randomString} from "./utils.js";

const get = config.get.bind(config, "YouTube");
const set = config.set.bind(config, "YouTube");

const OAUTH_SERVER_PORT = 30300 + rand(0, 99);
const YOUTUBE_REDIRECT_URI = `http://127.0.0.1:${OAUTH_SERVER_PORT}`;
const YOUTUBE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const YOUTUBE_TOKEN_URL = "https://www.googleapis.com/oauth2/v4/token";


export async function getCurrentStream() {
  const liveBroadcastsResponse = await tryAPIRequest("https://www.googleapis.com/youtube/v3/liveBroadcasts?mine=true&part=id,status,snippet");
  for (let liveBroadcastItem of liveBroadcastsResponse.items) {
    if (liveBroadcastItem.status.lifeCycleStatus === "live") {
      return {
        "title": liveBroadcastItem.snippet.title,
        "url": `https://youtube.com/live/${liveBroadcastItem.id}`
      }
    }
  }
  return null;
}

async function tryAPIRequest(url, options = {}) {
  const token = get("AccessToken");
  if (!options.headers) options.headers = {};
  options.headers.Authorization = `Bearer ${token}`

  const response = await fetch(url, options);
  if (response.status > 201) {
    console.log(`Response is ${response.status} with token ${token}`);
    await updateToken();
    return await tryAPIRequest(url);
  }
  return await response.json();
}

async function updateToken() {
  console.log("Updating token...");
  const {
    ClientId,
    ClientSecret,
    AccessToken,
    RefreshToken,
  } = get();
  let AuthCode;

  if (!ClientId || !ClientSecret) {
    throw new Error("No ClientId or ClientSecret provided!");
  }

  if (!AccessToken || !RefreshToken) {
    console.log("No RefreshToken found. Need to obtain a new one");
    AuthCode = await obtainAuthToken();
  }

  const someTokenPart = AuthCode ?
    `grant_type=authorization_code&code=${encodeURIComponent(AuthCode)}&redirect_uri=${encodeURIComponent(YOUTUBE_REDIRECT_URI)}` :
    `grant_type=refresh_token&refresh_token=${encodeURIComponent(RefreshToken)}`;
  const endpoint = `${YOUTUBE_TOKEN_URL}?client_id=${ClientId}&client_secret=${ClientSecret}&${someTokenPart}`;
  const response = await fetch(endpoint, {"method": "POST"})
    .then(response => response.json());

  if (response.access_token) {
    set("AccessToken", response.access_token);
  }
  if (response.refresh_token) {
    set("RefreshToken", response.refresh_token);
  }
}

async function obtainAuthToken() {
  const ClientId = get("ClientId");
  const state = randomString(32);
  const url = `${YOUTUBE_AUTH_URL}?response_type=code&client_id=${ClientId}&redirect_uri=${YOUTUBE_REDIRECT_URI}&state=${state}&scope=https://www.googleapis.com/auth/youtube`;
  open(url).then(noop);
  const response = await waitForOauthCallback(state);
  return response.code;
}

function waitForOauthCallback(state) {
  return new Promise((resolve, reject) => {
    const requestHandler = (req, res) => {
      const urlQueryString = req.url.split("?")[1] || "";
      if (!urlQueryString) {
        res.end("You can close the window");
        return;
      }
      const queryParams = Object.fromEntries(
        urlQueryString
          .split("&")
          .map(pair => pair.split("=").map(decodeURIComponent))
      );
      if (queryParams.state === state || queryParams.code === state) {
        resolve(queryParams);
        res.end("You can close the window");
      } else {
        reject();
        res.end("You can close the window");
      }
      server.close();
    };

    const server = http.createServer(requestHandler);
    server.listen(OAUTH_SERVER_PORT);
  });
}
