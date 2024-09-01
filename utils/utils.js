export const rand = (mi = 0, ma = Number.MAX_SAFE_INTEGER) => {
  return Math.floor(Math.random() * (ma - mi + 1) + mi);
};

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const randomStringAlphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_-";
export const randomString = (t = 21) =>
  randomStringAlphabet.repeat(t).split("").sort(() => Math.random() - 0.5).splice(0, t).join("");

export const noop = () => {
};
