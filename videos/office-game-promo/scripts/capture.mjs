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
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
page.on("console", (message) => {
  if (message.type() === "error") console.log("BROWSER ERROR", message.text());
});
await page.goto("http://localhost:3000", { waitUntil: "networkidle" });
await page.waitForTimeout(2000);
await page.screenshot({ path: join(output, "welcome.png") });
await page.getByRole("button", { name: /Clock in/i }).click();
await page.waitForTimeout(2500);
await page.screenshot({ path: join(output, "office.png") });
await page.getByRole("button", { name: /ASSIGN TASK/i }).click();
await page.waitForTimeout(500);
await page.screenshot({ path: join(output, "assign.png") });
console.log("assignment buttons", (await page.getByRole("button").allTextContents()).map((text) => text.trim()).filter(Boolean).slice(-35));
await browser.close();
