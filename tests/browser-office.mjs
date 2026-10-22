import { chromium } from "../videos/office-game-promo/node_modules/playwright-core/index.mjs"
import assert from "node:assert/strict"
import { mkdir, writeFile } from "node:fs/promises"
import { employees } from "../lib/scranton/roster.ts"
import { movementClear } from "../lib/scranton/world.ts"
import { officeBounds } from "../lib/scranton/camera.ts"

await mkdir("artifacts", { recursive: true })
const browser = await chromium.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: true,
  args: ["--use-gl=angle"],
})
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
const errors = []
page.on("pageerror", (e) => errors.push(e.message))
const snapshot = () =>
  page
    .locator(".scranton-canvas canvas")
    .evaluate((canvas) => canvas.officeSnapshot)
const report = { routes: [], errors }

function checkScene(s) {
  assert.ok(
    movementClear(
      s.player,
      s.player,
      s.people.map((p) => p.position)
    ),
    `Player collision: ${s.player}`
  )
  for (const p of s.people)
    assert.ok(
      movementClear(
        p.position,
        p.position,
        [
          s.player,
          ...s.people
            .filter((other) => other.id !== p.id)
            .map((other) => other.position),
        ],
        p.id
      ),
      `${p.id} collision: ${p.position}`
    )
  assert.ok(
    s.camera.x > officeBounds.left &&
      s.camera.x < officeBounds.right &&
      s.camera.z > officeBounds.back &&
      s.camera.z < officeBounds.front &&
      s.camera.y > 0 &&
      s.camera.y < officeBounds.height
  )
}
async function select(id) {
  await page.getByRole("button", { name: /^Team\s*10/i }).click()
  await page
    .locator(".scranton-team-row")
    .filter({ hasText: employees.find((e) => e.id === id).name })
    .click()
  await page.waitForTimeout(100)
}
async function arrive(id) {
  const began = Date.now()
  while (Date.now() - began < 18000) {
    const s = await snapshot()
    checkScene(s)
    if (!s.path.length && !s.goal) {
      const person = s.people.find((p) => p.id === id)
      assert.ok(
        Math.hypot(
          s.player[0] - person.position[0],
          s.player[1] - person.position[1]
        ) < 2.35,
        `Stopped too far from ${id}`
      )
      report.routes.push({
        id,
        milliseconds: Date.now() - began,
        player: s.player,
      })
      console.log("Arrived:", id, s.player)
      return
    }
    await page.waitForTimeout(80)
  }
  throw new Error(
    `Timed out approaching ${id}: ${JSON.stringify(await snapshot())}`
  )
}
try {
  await page.goto("http://127.0.0.1:3000", { waitUntil: "networkidle" })
  await page.getByRole("button", { name: /Clock in/i }).click()
  await page.waitForTimeout(250)
  for (const e of employees) {
    await select(e.id)
    await arrive(e.id)
  }
  let priorAngle
  report.cameraTurns = []
  for (let i = 0; i < 8; i++) {
    await page
      .getByRole("button", { name: "Rotate view right", exact: true })
      .click()
    await page.waitForTimeout(1150)
    const s = await snapshot()
    checkScene(s)
    const angle = Math.atan2(s.camera.x - s.target.x, s.camera.z - s.target.z)
    if (priorAngle !== undefined) {
      const difference = Math.atan2(
        Math.sin(angle - priorAngle),
        Math.cos(angle - priorAngle)
      )
      assert.ok(
        difference > 0.25 && difference < 1.25,
        `Orbit stuck or jumped: ${difference}`
      )
    }
    priorAngle = angle
    report.cameraTurns.push(angle)
  }
  await page
    .getByRole("button", { name: "Reset office view", exact: true })
    .click()
  await page.waitForTimeout(1100)
  const box = await page.locator(".scranton-canvas canvas").boundingBox()
  const clickable = await page.locator(".scranton-canvas canvas").evaluate(canvas => {
    const r = canvas.getBoundingClientRect()
    return canvas.officeSnapshot.people.find(person => person.screen.visible && document.elementFromPoint(r.x + person.screen.x, r.y + person.screen.y) === canvas)
  })
  assert.ok(clickable, "No visible coworker available for a direct click")
  await page.mouse.click(box.x + clickable.screen.x, box.y + clickable.screen.y)
  await arrive(clickable.id)
  assert.equal((await page.locator(".office-person h2").innerText()).toUpperCase(), employees.find(e => e.id === clickable.id).name.toUpperCase())
  const selectedBefore = await page.locator(".office-person h2").innerText()
  await page.mouse.move(box.x + box.width * 0.55, box.y + box.height * 0.3)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width * 0.8, box.y + box.height * 0.4, {
    steps: 20,
  })
  await page.mouse.up()
  assert.equal(
    await page.locator(".office-person h2").innerText(),
    selectedBefore,
    "Dragging selected a coworker"
  )
  await select("dwight")
  await arrive("dwight")
  await page.getByRole("button", { name: "ASSIGN TASK", exact: true }).click()
  await page.locator(".office-task-progress").waitFor()
  await page.getByRole("button", { name: /Advance 15 min/i }).click()
  const progressAfterAdvance = Number(
    (await page.locator(".office-task-progress").innerText()).match(/(\d+)%/)[1]
  )
  assert.ok(
    progressAfterAdvance > 0 && progressAfterAdvance < 100,
    "Advance time did not progress the assignment"
  )
  await page
    .getByRole("button", { name: /Help · 8 min/i })
    .first()
    .click()
  await page.getByText("0 working · 1 delivered", { exact: true }).waitFor()
  report.task = "Assignment advanced and was delivered after helping"
  report.frameTiming = await page.evaluate(
    () =>
      new Promise((resolve) => {
        const deltas = []
        let last = performance.now()
        function next(t) {
          deltas.push(t - last)
          last = t
          if (deltas.length < 100) requestAnimationFrame(next)
          else
            resolve({
              medianMs: deltas.sort((a, b) => a - b)[50],
              slowFrames: deltas.filter((d) => d > 35).length,
            })
        }
        requestAnimationFrame(next)
      })
  )
  report.renderQuality = (await snapshot()).quality
  await page.screenshot({ path: "artifacts/office-desktop-fixed.png" })

  const mobile = await browser.newPage({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  })
  await mobile.goto("http://127.0.0.1:3000", { waitUntil: "networkidle" })
  await mobile.getByRole("button", { name: /Clock in/i }).click()
  for (const name of [
    "Rotate view left",
    "Rotate view right",
    "Zoom in",
    "Zoom out",
    "Reset office view",
  ]) {
    const control = mobile.getByRole("button", { name, exact: true })
    assert.ok(await control.isVisible())
    const unobstructed = await control.evaluate((button) => {
      const r = button.getBoundingClientRect()
      return button.contains(
        document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)
      )
    })
    assert.ok(unobstructed, `Mobile control covered: ${name}`)
  }
  await mobile.getByRole("button", { name: "ASSIGN TASK", exact: true }).click()
  await mobile.locator(".office-task-progress").waitFor()
  for (const name of ["Rotate view left", "Rotate view right", "Zoom in", "Zoom out"]) {
    const control = mobile.getByRole("button", { name, exact: true })
    assert.ok(await control.evaluate(button => { const r = button.getBoundingClientRect(); return button.contains(document.elementFromPoint(r.x + r.width/2, r.y + r.height/2)); }), `Feedback covered mobile control: ${name}`)
  }
  await mobile.screenshot({ path: "artifacts/office-mobile-fixed.png" })
  await mobile.close()
  assert.deepEqual(errors, [])
  await writeFile(
    "artifacts/office-smoke.json",
    JSON.stringify(report, null, 2)
  )
  console.log(JSON.stringify(report, null, 2))
} catch (error) {
  await page.screenshot({ path: "artifacts/office-browser-failure.png" })
  console.error(error)
  process.exitCode = 1
} finally {
  await browser.close()
}
