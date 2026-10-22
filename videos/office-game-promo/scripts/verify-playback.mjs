import { chromium } from 'playwright-core';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { writeFile } from 'node:fs/promises';

const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--autoplay-policy=no-user-gesture-required'] });
const version = process.argv[2] || 'v2';
try {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await writeFile(`out/preview-${version}.html`, `<!doctype html><html><head><title>Office Survival 1999 — Promo</title><style>body{margin:0;background:#09212a;display:grid;place-items:center;height:100vh}video{width:100%;max-height:100vh}</style></head><body><video controls preload="auto" src="office-survival-1999-promo-${version}.mp4"></video></body></html>`);
  await page.goto(pathToFileURL(resolve(`out/preview-${version}.html`)).href);
  await page.waitForSelector('video');
  await page.waitForFunction(() => document.querySelector('video').readyState >= 3);
  const metrics = await page.evaluate(async () => {
    const video = document.querySelector('video');
    video.muted = true;
    video.currentTime = 0;
    const before = video.getVideoPlaybackQuality();
    await video.play();
    await new Promise((resolve, reject) => {
      video.addEventListener('ended', resolve, { once: true });
      video.addEventListener('error', reject, { once: true });
    });
    const quality = video.getVideoPlaybackQuality();
    return { duration: video.duration, width: video.videoWidth, height: video.videoHeight, totalVideoFrames: quality.totalVideoFrames - before.totalVideoFrames, droppedVideoFrames: quality.droppedVideoFrames - before.droppedVideoFrames, corruptedVideoFrames: quality.corruptedVideoFrames - before.corruptedVideoFrames };
  });
  await writeFile(`out/${version}-playback.json`, JSON.stringify(metrics, null, 2));
  console.log(JSON.stringify(metrics));
} finally {
  await browser.close();
}
