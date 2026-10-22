import { chromium } from "playwright-core";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";

const output = join(process.cwd(), "public", "captures");
await mkdir(output, { recursive: true });
const browser = await chromium.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: true,
  args: ["--enable-webgl", "--use-gl=angle", "--use-angle=swiftshader"],
});
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
const capture = async (name) => {
  await page.waitForTimeout(700);
  await page.screenshot({ path: join(output, `${name}.png`), timeout: 60000 });
  console.log("Captured", name);
};

await page.goto("http://localhost:3000", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(2200);
await page.getByRole("button", { name: /Clock in/i }).click();
await capture("office-clean");
await page.getByRole("button", { name: /Team 10/i }).click();
await capture("team-panel");
await page.getByRole("button", { name: /Work 0/i }).click();
await capture("work-panel");
await page.getByRole("button", { name: /Q3 report/i }).click();
await capture("computer-tasks");
console.log("buttons", (await page.getByRole("button").allTextContents()).map((text) => text.trim()).filter(Boolean).slice(-20));
await browser.close();
