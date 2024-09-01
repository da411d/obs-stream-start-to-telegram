const OBSWebSocket = require('obs-websocket-js');
const path = require('path');
const process = require('process');
var configIni = require('config.ini');
const getAppDataPath = require("appdata-path");
const fs = require('fs');
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async function(){
	
const obs = new OBSWebSocket();

try {
	await obs.connect({"secure": false});
	
	obs.on("StreamStarted", onStreamStarted);	

} catch(e){ 
	console.log("error");
	console.error(e);
}
async function onStreamStarted() {

    try {
	let currentStream = null;
	let tries = 0;
	do {
		if(tries > 0) {
			await sleep(5000);
		}
		currentStream = await getCurrentStream();
		tries++;
	} while(currentStream == null && tries <= 10);
	if(currentStream == null) {
		console.log("Stream is not live")
		return
	}
	console.log(currentStream);
	await sendMessage(currentStream);
    } catch(e) {
        console.log("Error handling onStreamStarted");
	console.error(e);
    }

}

async function sendMessage(streamData) {
	let localConfig = getLocalConfig();
	await fetch(`https://api.telegram.org/bot${localConfig.Telegram.BotToken}/sendMessage?chat_id=${localConfig.Telegram.ChatId}&text=${encodeURIComponent(streamData.url)}&silent=true`)
}

async function getCurrentStream() {
	let res = await tryGet("https://www.googleapis.com/youtube/v3/liveBroadcasts?mine=true&part=id,status,snippet", {})
	let resObject = await res.json();
	//console.log(JSON.stringify(resObject, null, 4));
	for(itemIndex in resObject.items) {
		let item = resObject.items[itemIndex];
		console.log(item.status);
		if(item.status.lifeCycleStatus === "live") {
			return {
				"title": item.snippet.title,
				"url": `https://youtube.com/live/${item.id}`
			}
		}
	}
	return null;
}

async function tryGet(url, headers) {
	const token = getToken()
	headers = headers || {};
	headers["Authorization"] = `Bearer ${getToken()}`
	const requestOptions = {
  		method: "GET",
  		headers: headers
	};
	let response = await fetch(url, requestOptions);
	if(response.status > 201) {
		console.log(`Response is 400 with token ${getToken()}`)
		await updateToken();
		let newRes = await tryGet(url, headers);
		return newRes;
	}
	return response;
}

function getToken() {
	let localConfig = getLocalConfig();
	try {
		return localConfig.Config.Token;
	} catch(e) {
		return ""
	}
}

async function updateToken() {
	let localConfig = getLocalConfig();
	let obsConfig = await getObsConfig();
	let clientId = localConfig.Config.ClientId;
	let clientSecret = localConfig.Config.ClientSecret;
	let refreshToken = obsConfig.YouTube.RefreshToke;
	let response = await fetch(
		`https://oauth2.googleapis.com/token?client_id=${clientId}&client_secret=${clientSecret}&refresh_token=${refreshToken}&grant_type=refresh_token`,
		{
			"method": "POST"
		}
	);
	let json = await response.json();
	localConfig.Config.Token = json.access_token;
	let configBody = configIni.stringify(localConfig);
	await fs.writeFileSync("./config.ini", configBody);
}

async function getObsConfig() {
	let currentProfileName = await getCurrentProfileName();
	let configPath = path.join(getAppDataPath(), "obs-studio", "basic", "profiles", currentProfileName, "basic.ini")
	return configIni.load(configPath);
}


function getLocalConfig() {
	return configIni.load(path.join(process.cwd(), 'config.ini'));
}

async function getCurrentProfileName() {
	let res = await obs.send("GetCurrentProfile");
	return res["profile-name"];
}

})()
