// Запускает отдельный профиль Chrome и загружает в него расширение swarm-rebuild
// через DevTools-протокол (Extensions.loadUnpacked). Обычный Chrome 137+ не принимает
// флаг --load-extension, а этот способ работает без ручных кликов.
// Запуск: node scripts/launch-chrome.mjs [url]
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const extDir = path.join(root, "swarm-rebuild");
const profile = path.join(root, ".chrome-profile");
const startUrl = process.argv[2] || "https://example.com";

const candidates = [
  process.env.CHROME_PATH,
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  path.join(process.env.LOCALAPPDATA || "", "Google\\Chrome\\Application\\chrome.exe"),
].filter(Boolean);
const chrome = candidates.find((p) => existsSync(p));
if (!chrome) {
  console.error("Chrome не найден. Укажите путь в переменной CHROME_PATH.");
  process.exit(1);
}

const proc = spawn(
  chrome,
  [
    `--user-data-dir=${profile}`,
    "--remote-debugging-pipe",
    "--enable-unsafe-extension-debugging",
    "--no-first-run",
    "--no-default-browser-check",
    startUrl,
  ],
  { stdio: ["ignore", "ignore", "ignore", "pipe", "pipe"] }
);

const toChrome = proc.stdio[3];
const fromChrome = proc.stdio[4];
let id = 0;
const waiting = new Map();
let buf = "";
fromChrome.on("data", (chunk) => {
  buf += chunk.toString("utf8");
  let i;
  while ((i = buf.indexOf("\0")) >= 0) {
    const msg = JSON.parse(buf.slice(0, i));
    buf = buf.slice(i + 1);
    if (msg.id && waiting.has(msg.id)) {
      waiting.get(msg.id)(msg);
      waiting.delete(msg.id);
    }
  }
});
const send = (method, params = {}) =>
  new Promise((resolve) => {
    const m = { id: ++id, method, params };
    waiting.set(m.id, resolve);
    toChrome.write(JSON.stringify(m) + "\0");
  });

const res = await send("Extensions.loadUnpacked", { path: extDir });
if (res.error) {
  console.error("Не удалось загрузить расширение:", res.error.message);
} else {
  console.log(`Расширение Swarm Rebuild загружено (id ${res.result.id}).`);
  console.log("На любой странице: Alt+Shift+S или иконка расширения (пазл -> закрепить).");
  console.log("Не закрывайте это окно, пока пользуетесь Chrome: при закрытии Chrome тоже закроется.");
}
proc.on("exit", () => process.exit(0));
