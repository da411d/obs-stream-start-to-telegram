import {readFileSync, writeFileSync} from "fs";
import {resolve} from "path";
import {fileURLToPath} from "url";
import configIni from "config.ini"

const fileName = resolve(fileURLToPath(new URL('.', import.meta.url)), "../config.ini");
let config = {};

export const read = () => {
  try {
    const fileContents = readFileSync(fileName, {encoding: "utf-8"});
    config = configIni.parse(fileContents) || {};
    return config;
  } catch (e) {
    return {};
  }
};

export const get = (section, key) => {
  read();
  if (typeof section !== "undefined" && typeof key !== "undefined") {
    return config?.[section]?.[key] || null;
  } else if (typeof section !== "undefined") {
    return config?.[section] || null;
  }
  return config;
};

export const set = (section, key, value) => {
  const data = read();
  if (!data[section]) {
    data[section] = {};
  }
  data[section][key] = value;
  const fileContents = configIni.stringify(data);
  writeFileSync(fileName, fileContents, {encoding: "utf-8"});
  read();
};
