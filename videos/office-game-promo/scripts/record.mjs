import { chromium } from "playwright-core";
import { mkdir, copyFile } from "node:fs/promises";
import { join } from "node:path";

const output = join(process.cwd(), "public", "captures");
await mkdir(output, { recursive: true });
const browser = await chromium.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: true,
  args: ["--enable-webgl", "--use-gl=angle", "--use-angle=swiftshader"],
});
const context = await browser.newContext({
  viewport: { width: 1600, height: 900 },
  deviceScaleFactor: 1,
  recordVideo: { dir: output, size: { width: 1600, height: 900 } },
});
const page = await context.newPage();
const pause = (ms) => page.waitForTimeout(ms);

try {
  await page.goto("http://localhost:3000", { waitUntil: "domcontentloaded" });
  await pause(2500);
  await page.getByRole("button", { name: /Clock in/i }).click();
  await pause(1200);
  await page.getByRole("button", { name: /Jim · AVAILABLE/i }).click();
  await pause(1600);
  await page.getByRole("button", { name: /ASSIGN TASK/i }).click();
  await pause(1800);
  await page.getByRole("button", { name: /Advance 15 min/i }).click();
  await pause(1400);
} finally {
  await context.close();
  const videoPath = await page.video().path();
  await copyFile(videoPath, join(output, "gameplay.webm"));
  await browser.close();
  console.log("Saved gameplay.webm");
}
