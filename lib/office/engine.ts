import { achievements, emails, endings, events, meetings, tasks, type Counters, type Effect, type Ending, type OfficeEvent, type Stats } from "./content.ts";
export type AppId = "Mail" | "Calendar" | "Tasks" | "Solitaire" | "Internet" | "Recycle Bin" | "Drawer" | "Phone";
export type InteractionKind = "coffee" | "plant" | "printer" | "work" | "busy" | "clock" | "floppy" | "break" | "lunch";
export type MailState = { read: boolean; answered: boolean; deleted: boolean; purged: boolean; overdue: boolean; urgent: boolean; everDeleted: boolean };
export type Feedback = { id: number; text: string; energy: number; patience: number; jobSecurity: number; minutes: number };
export type GameState = Stats & Counters & {
  mode: "boot" | "welcome" | "playing" | "ended"; time: number; seed: number; runId: string; ending: Ending | null;
  mail: Record<string, MailState>; taskStatus: Record<string, "pending" | "done" | "obsolete">; meetingStatus: Record<string, "pending" | "attended" | "declined" | "missed">;
  printerBroken: boolean; lunchEaten: boolean; breaks: number; activeEvent: { id: string; target?: string } | null;
  seenEvents: string[]; followups: { id: string; due: number; target?: string }[]; nextEventAt: number; cooldown: number; calmMinutes: number;
  openApps: { id: AppId; minimized: boolean; x: number; y: number }[]; focusedApp: AppId | null; selectedMail: string | null;
  drawerFound: string[]; usedItems: string[]; drawerOrder: string[]; card: number | null; stack: number; cardDraws: number; internetPage: number; lampOn: boolean;
  achievements: string[]; history: { time: number; text: string }[]; feedback: Feedback | null; notices: { id: number; text: string; achievement?: boolean }[];
  interaction: { kind: InteractionKind; id?: string } | null; plantHealth: number; printedPages: number; backupMade: boolean; coffeeFill: number; coffeeSpilled: boolean;
  modal: "restart" | "achievements" | "history" | "help" | null; sound: boolean; serial: number;
};
export type Action = { type: "BOOT_DONE" | "START" | "RESTART" | "RESTART_CONFIRM" | "DISMISS_MODAL" | "CLOSE_INTERACTION" | "SOUND" | "ACHIEVEMENTS" | "HISTORY" | "HELP"; seed?: number } | { type: "OPEN" | "CLOSE" | "MINIMIZE" | "FOCUS"; app: AppId } | { type: "MOVE"; app: AppId; x: number; y: number } | { type: "DO"; kind: string; id?: string; index?: number } | { type: "DISMISS_NOTICE"; id: number } | { type: "INSPECT"; kind: InteractionKind; id?: string };
export function formatTime(time: number) { const total = 540 + time; const hour = Math.floor(total / 60); return `${String(hour % 12 || 12).padStart(2, "0")}:${String(total % 60).padStart(2, "0")} ${hour >= 12 ? "PM" : "AM"}`; }
export function managerState(s: number) { return s < 20 ? "CALM" : s < 40 ? "AWARE" : s < 60 ? "WATCHING" : s < 80 ? "SUSPICIOUS" : s < 95 ? "WALKING TOWARD YOU" : "CAUGHT"; }
const clamp = (n: number) => Math.min(100, Math.max(0, Number.isFinite(n) ? n : 0));
function random(s: GameState) { s.seed = (Math.imul(s.seed, 1664525) + 1013904223) >>> 0; return s.seed / 4294967296; }
export function initialState(seed = 1999): GameState {
  const s: GameState = { mode: "boot", time: 0, seed, runId: String(seed), ending: null, energy: 75, patience: 70, jobSecurity: 65, suspicion: 0,
    coffeeCount: 0, plantUses: 0, clockChecks: 0, tasksCompleted: 0, emailsAnswered: 0, meetingsAttended: 0, coworkersHelped: 0, workActions: 0, distractionActions: 0, ignoredRequests: 0, deletedEmails: 0, solitaireSessions: 0, successfulAltTabs: 0, printerFixes: 0, managerRefusals: 0,
    mail: Object.fromEntries(emails.map(m => [m.id, { read: false, answered: false, deleted: false, purged: false, overdue: false, urgent: m.importance === "URGENT", everDeleted: false }])), taskStatus: Object.fromEntries(tasks.map(t => [t.id, "pending"])), meetingStatus: Object.fromEntries(meetings.map(m => [m.id, "pending"])), printerBroken: false, lunchEaten: false, breaks: 0,
    activeEvent: null, seenEvents: [], followups: [], nextEventAt: 42, cooldown: 0, calmMinutes: 0, openApps: [], focusedApp: null, selectedMail: null,
    drawerFound: [], usedItems: [], drawerOrder: ["snack", "aspirin", "floppy", "manual", "letter", "rubber band", "secret note", "coffee packet"], card: null, stack: 0, cardDraws: 0, internetPage: -1, lampOn: true, achievements: [], history: [], feedback: null, notices: [], interaction: null, plantHealth: 55, printedPages: 0, backupMade: false, coffeeFill: 0, coffeeSpilled: false, modal: null, sound: false, serial: 0 };
  for (let i = s.drawerOrder.length - 1; i > 0; i--) { const j = Math.floor(random(s) * (i + 1)); [s.drawerOrder[i], s.drawerOrder[j]] = [s.drawerOrder[j], s.drawerOrder[i]]; }
  return s;
}
function log(s: GameState, text: string) { s.history.push({ time: s.time, text }); }
function notice(s: GameState, text: string, achievement = false) { s.notices.push({ id: ++s.serial, text, achievement }); s.notices = s.notices.slice(-3); if (!achievement) log(s, text); }
function unlock(s: GameState, id: string) { if (s.achievements.includes(id)) return; s.achievements.push(id); const a = achievements.find(a => a.id === id); notice(s, `ACHIEVEMENT UNLOCKED · ${a?.title}`, true); log(s, `Achievement: ${a?.title}`); }
export function evaluateEnding(s: GameState): Ending | null {
  if (s.jobSecurity <= 0) return "FIRED";
  if (s.energy <= 0) return "BURNOUT";
  if (s.patience <= 0) return "RAGE";
  if (s.time < 480) return null;
  if (s.jobSecurity >= 90 && s.workActions >= 6) return "EMPLOYEE";
  if (s.energy <= 10 && s.workActions < 5) return "QUIET";
  if (meetings.every(m => s.meetingStatus[m.id] === "attended")) return "WARRIOR";
  if (s.workActions <= 2) return "LEGEND";
  return "SURVIVOR";
}
function checkAchievements(s: GameState) {
  if (s.meetingsAttended >= 5) unlock(s, "meeting"); if (s.coffeeCount >= 5) unlock(s, "coffee"); if (s.successfulAltTabs >= 3) unlock(s, "alt");
  if (s.managerRefusals >= 8) unlock(s, "no"); if (s.printerFixes > 0) unlock(s, "printer"); if (s.clockChecks >= 12) unlock(s, "clock");
  if (s.workActions >= 8) unlock(s, "model"); if (s.time >= 360 && s.workActions <= 2) unlock(s, "nothing"); if (s.deletedEmails >= 10) unlock(s, "delete");
  if (s.time >= 480) { if (s.calmMinutes >= 330) unlock(s, "ghost"); if (emails.filter(m => m.arrival <= s.time).every(m => s.mail[m.id].read || s.mail[m.id].deleted)) unlock(s, "inbox"); }
}
function apply(s: GameState, e: Effect, text: string) {
  const before = { energy: s.energy, patience: s.patience, jobSecurity: s.jobSecurity, time: s.time };
  const duration = Math.min(e.minutes ?? 0, 480 - s.time);
  if (s.suspicion < 20) s.calmMinutes += duration;
  for (const key of ["energy", "patience", "jobSecurity", "suspicion"] as const) s[key] += e[key] ?? 0;
  for (const key of ["coffeeCount", "plantUses", "clockChecks", "tasksCompleted", "emailsAnswered", "meetingsAttended", "coworkersHelped", "workActions", "distractionActions", "ignoredRequests", "deletedEmails", "solitaireSessions", "successfulAltTabs", "printerFixes", "managerRefusals"] as const) s[key] += e[key] ?? 0;
  s.energy -= Math.floor((s.time % 40 + duration) / 40); s.patience -= Math.floor((s.time % 60 + duration) / 60);
  if (duration && s.suspicion >= 80) s.jobSecurity -= 2;
  if (duration && s.time >= 180 && s.workActions < 2) s.suspicion += 2;
  s.time += duration;
  if (e.repair) s.printerBroken = false; if (e.breakPrinter) s.printerBroken = true; if (e.lunch) s.lunchEaten = true;
  if (e.loseTask && s.backupMade) notice(s, "BACKUP RESTORED · Your completed work survived the crash.");
  if (e.loseTask && !s.backupMade) { const done = tasks.find(t => s.taskStatus[t.id] === "done" && t.deadline > s.time); if (done) { s.taskStatus[done.id] = "pending"; s.tasksCompleted = Math.max(0, s.tasksCompleted - 1); } }
  for (const key of ["energy", "patience", "jobSecurity", "suspicion"] as const) s[key] = clamp(s[key]);
  s.feedback = { id: ++s.serial, text, energy: s.energy - before.energy, patience: s.patience - before.patience, jobSecurity: s.jobSecurity - before.jobSecurity, minutes: duration };
  log(s, `${text}${duration ? ` (+${duration} min)` : ""}`);
}
function trigger(s: GameState, id: string, target?: string) { s.activeEvent = { id, target }; if (!s.seenEvents.includes(id)) s.seenEvents.push(id); if (id === "jam") s.printerBroken = true; }
function finishAction(s: GameState, previousTime: number, fromEvent = false) {
  const securityBeforeDeadlines = s.jobSecurity;
  // Crossed thresholds are processed exactly once, including long actions.
  for (const m of emails) {
    if (m.arrival > previousTime && m.arrival <= s.time) notice(s, `NEW MAIL · ${m.subject}`);
    const mail = s.mail[m.id];
    if (m.deadline && s.time > m.deadline && !mail.answered && !mail.overdue) { mail.overdue = true; s.jobSecurity -= 4; s.suspicion += 4; notice(s, `DEADLINE MISSED · ${m.subject} · Security −4`); if (m.importance === "URGENT") s.followups.push({ id: "q3-followup", due: s.time, target: m.id }); }
  }
  for (const t of tasks) if (s.time > t.deadline && s.taskStatus[t.id] === "pending") { s.taskStatus[t.id] = "obsolete"; s.jobSecurity -= 2; notice(s, `TASK OBSOLETE · ${t.title} · Security −2`); }
  for (const m of meetings) if (s.time > m.at + 35 && s.meetingStatus[m.id] === "pending") { s.meetingStatus[m.id] = "missed"; s.jobSecurity -= 4; s.suspicion += 3; notice(s, `MISSED MEETING · ${m.title} · Security −4`); }
  s.jobSecurity = clamp(s.jobSecurity); s.suspicion = clamp(s.suspicion);
  if (s.feedback) s.feedback.jobSecurity += s.jobSecurity - securityBeforeDeadlines;
  checkAchievements(s); s.ending = evaluateEnding(s);
  if (s.ending) { s.mode = "ended"; s.activeEvent = null; s.interaction = null; log(s, endings[s.ending][0]); return; }
  if (fromEvent) { s.cooldown = 1; s.nextEventAt = s.time + (s.time >= 390 ? 18 : 35); return; }
  if (s.activeEvent) return;
  if (s.cooldown > 0) s.cooldown--;
  if (s.suspicion >= 95) { trigger(s, "caught"); return; }
  const followup = s.followups.find(f => f.due <= s.time);
  if (followup) { s.followups.splice(s.followups.indexOf(followup), 1); trigger(s, followup.id, followup.target); return; }
  const meeting = meetings.find(m => m.at <= s.time && s.meetingStatus[m.id] === "pending");
  if (meeting) { trigger(s, "meeting", meeting.id); return; }
  if (s.time >= 450 && !s.seenEvents.includes("five-minutes")) { trigger(s, "five-minutes"); return; }
  if (s.time < s.nextEventAt) return;
  const pool = events.filter(e => e.id !== "welcome" && !["caught", "footsteps", "q3-followup", "five-minutes"].includes(e.id) && s.time >= e.min && s.time <= e.max && !s.seenEvents.includes(e.id) && (!e.condition || (e.condition === "broken" && s.printerBroken) || (e.condition === "notLunch" && !s.lunchEaten)));
  if (pool.length) { let ticket = random(s) * pool.reduce((sum, e) => sum + e.weight, 0); const chosen = pool.find(e => (ticket -= e.weight) <= 0) ?? pool[0]; trigger(s, chosen.id); }
  s.nextEventAt = s.time + (s.time >= 390 ? 22 : 42);
}
export function officeEffect<T extends GameState>(state:T,e:Effect,text:string):T {
  const s=structuredClone(state); const before=s.time;
  apply(s,e,text); finishAction(s,before); return s;
}
export function activeEvent(s: GameState): OfficeEvent | null {
  if (!s.activeEvent) return null;
  if (s.activeEvent.id === "meeting") {
    const m = meetings.find(m => m.id === s.activeEvent?.target)!;
    return { id: "meeting", title: m.title, category: "Meeting", body: "Your attendance is optional in the same way that employment is optional.", min: 0, max: 480, weight: 1, priority: "HIGH", choices: [
      { label: "Attend", effect: { minutes: m.duration, energy: -8, patience: -7, jobSecurity: 8, suspicion: -10, meetingsAttended: 1, workActions: 1 }, result: "You contribute one well-timed nod." },
      { label: "Decline", effect: { minutes: 5, patience: 2, jobSecurity: -5, suspicion: 7, ignoredRequests: 1, managerRefusals: 1 }, result: "Your empty chair makes a statement." },
      { label: "Connection issue", effect: { minutes: 12, energy: 4, patience: 3, jobSecurity: -3, suspicion: 5, ignoredRequests: 1 }, result: "A cable takes the blame. Again." },
    ] };
  }
  return events.find(e => e.id === s.activeEvent?.id) ?? null;
}
function open(s: GameState, id: AppId) { const a = s.openApps.find(a => a.id === id); if (a) a.minimized = false; else s.openApps.push({ id, minimized: false, x: 0, y: 0 }); s.focusedApp = id; }
export function reducer(state: GameState, action: Action): GameState {
  const s = structuredClone(state);
  switch (action.type) {
    case "BOOT_DONE": if (s.mode === "boot") s.mode = "welcome"; return s;
    case "START": { const fresh = initialState(action.seed ?? 1999); fresh.mode = "playing"; fresh.sound = s.sound; trigger(fresh, "welcome"); log(fresh, "Clocked in. The company thanks you for your remaining energy."); return fresh; }
    case "RESTART": s.modal = "restart"; return s;
    case "RESTART_CONFIRM": { const fresh = initialState(action.seed ?? 2000); fresh.mode = "welcome"; fresh.sound = s.sound; return fresh; }
    case "DISMISS_MODAL": s.modal = null; return s;
    case "INSPECT": if (s.mode !== "playing" || s.activeEvent) return state; s.interaction = { kind: action.kind, id: action.id }; return s;
    case "CLOSE_INTERACTION": s.interaction = null; return s;
    case "SOUND": s.sound = !s.sound; return s;
    case "ACHIEVEMENTS": s.modal = "achievements"; return s;
    case "HISTORY": s.modal = "history"; return s;
    case "HELP": s.modal = "help"; return s;
    case "DISMISS_NOTICE": s.notices = s.notices.filter(n => n.id !== action.id); return s;
    case "OPEN": if (s.mode !== "playing" || s.activeEvent) return state; open(s, action.app); return s;
    case "CLOSE": s.openApps = s.openApps.filter(a => a.id !== action.app); s.focusedApp = s.openApps.filter(a => !a.minimized).at(-1)?.id ?? null; return s;
    case "MINIMIZE": { const a = s.openApps.find(a => a.id === action.app); if (a) a.minimized = true; s.focusedApp = s.openApps.filter(a => !a.minimized).at(-1)?.id ?? null; return s; }
    case "FOCUS": s.focusedApp = action.app; return s;
    case "MOVE": { const a = s.openApps.find(a => a.id === action.app); if (a) { a.x = action.x; a.y = action.y; } return s; }
  }
  if (action.type !== "DO" || s.mode !== "playing" || (s.activeEvent && action.kind !== "choose")) return state;
  s.interaction = null;
  const before = s.time; const id = action.id ?? "";
  switch (action.kind) {
    case "choose": { const event = activeEvent(s); const c = event?.choices[action.index ?? -1]; if (!c || !event) return state;
      const target = s.activeEvent?.target;
      if (event.id === "meeting" && target) s.meetingStatus[target] = action.index === 0 ? "attended" : "declined";
      if (event.id === "q3-followup" && target) { s.mail[target].overdue = true; if (action.index === 0) { s.mail[target].answered = true; s.mail[target].read = true; s.emailsAnswered++; if (target === "m05" && s.taskStatus.t2 !== "done") { s.taskStatus.t2 = "done"; s.tasksCompleted++; } } }
      if (event.id === "footsteps" && action.index === 0) { const a = s.openApps.find(a => a.id === "Solitaire"); if (a) a.minimized = true; open(s, "Tasks"); }
      let e = { ...c.effect }; let text = c.result;
      if (c.risk && random(s) < c.risk.probability) { for (const [k, v] of Object.entries(c.risk.effect)) { const key = k as keyof Effect; (e as Record<string, number | boolean>)[key] = typeof v === "number" ? Number(e[key] ?? 0) + v : v; } text = c.risk.result; }
      if (c.followup) s.followups.push({ id: c.followup, due: s.time + 55 });
      s.activeEvent = null; apply(s, e, text); finishAction(s, before, true); return s;
    }
    case "brew":
    case "coffee": { const count = Math.min(s.coffeeCount, 5); const fill = action.kind === "brew" ? Math.max(0, Math.min(100, action.index ?? 0)) : 80; s.coffeeFill = fill; if (fill > 90) s.coffeeSpilled = true; const quality = fill >= 70 && fill <= 90 ? 1 : fill > 90 ? .75 : .55; apply(s, { minutes: 6, energy: Math.round([18, 15, 10, 7, 4, 2][count] * quality), patience: [4, 2, -5, -8, -12, -8][count] - (fill > 90 ? 4 : 0), suspicion: count >= 2 ? count : 0, coffeeCount: 1, distractionActions: 1 }, fill > 90 ? "Coffee spilled on the desk. Some of it reached you. The stain is permanent." : fill < 70 ? "A cautious half-cup. It restores a cautious amount of energy." : count >= 4 ? "HEART RATE: CONCERNING. You are vibrating at corporate frequency." : "A perfectly filled cup. Morale temporarily soluble."); break; }
    case "tend": s.plantHealth = clamp(s.plantHealth + (action.index === 1 ? 20 : -15)); apply(s, { minutes: 3, patience: action.index === 1 ? Math.max(1, 5 - s.plantUses) : -2, plantUses: 1, distractionActions: 1, suspicion: s.plantUses >= 3 ? 2 : 0 }, action.index === 1 ? "Leaves cleaned. Soil watered. One living thing in this office is thriving." : "The plant requests fewer management interventions. Too much water."); break;
    case "repairPrinter": if (!s.printerBroken) return state; apply(s, { minutes: 15, energy: -3, patience: -4, jobSecurity: 5, suspicion: -4, repair: true, printerFixes: 1, workActions: 1 }, "You removed the jam and reseated tray 1. The printer is actually working."); break;
    case "backup": if (s.backupMade) return state; s.backupMade = true; apply(s, { minutes: 12, energy: -2, jobSecurity: 5, suspicion: -4, workActions: 1 }, "MONDAY_FINAL.DOC backed up and verified. One future disaster has been cancelled."); break;
    case "plant": apply(s, { minutes: 3, patience: Math.max(1, 4 - s.plantUses), energy: s.plantUses === 0 ? 2 : 0, suspicion: s.plantUses >= 3 ? 2 : 0, plantUses: 1, distractionActions: 1 }, s.plantUses >= 3 ? "The plant feels responsible for your emotional wellbeing." : "You stare at the plant. It has no quarterly targets."); break;
    case "clock": apply(s, { clockChecks: 1, suspicion: s.clockChecks >= 3 ? 2 : 0 }, `${formatTime(s.time)}. ${480 - s.time} minutes of employment remain.`); checkAchievements(s); if (s.suspicion >= 95) trigger(s, "caught"); return s;
    case "break": s.breaks++; apply(s, { minutes: 18, energy: Math.max(3, 11 - s.breaks), patience: 4, suspicion: 3 + s.breaks * 2, jobSecurity: s.breaks > 2 ? -3 : -1, distractionActions: 1 }, "You hide in the break room. The vending machine understands."); break;
    case "lunch": if (s.lunchEaten || s.time < 165) return state; apply(s, { minutes: 30, energy: 28, patience: 12, jobSecurity: -2, suspicion: 2, lunch: true }, "You eat lunch away from your desk. A radical act."); break;
    case "busy": apply(s, { minutes: 15 + Math.min(10, Math.max(0, action.index ?? 0)) * 2, energy: -3, patience: -2 - Math.min(10, Math.max(0, action.index ?? 0)), jobSecurity: 4, suspicion: -9, distractionActions: 1 }, "You type numbers into a spreadsheet with convincing urgency."); break;
    case "work": apply(s, { minutes: 20 + Math.min(10, Math.max(0, action.index ?? 0)) * 2, energy: -7, patience: -3 - Math.min(10, Math.max(0, action.index ?? 0)), jobSecurity: 6, suspicion: -8, workActions: 1 }, "You file actual paperwork. Nobody notices immediately."); break;
    case "task": { const t = tasks.find(t => t.id === id); if (!t || s.taskStatus[id] !== "pending") return state; s.taskStatus[id] = "done"; apply(s, { minutes: t.minutes + Math.min(10, Math.max(0, action.index ?? 0)) * 2, energy: -t.energy, patience: -3 - Math.min(10, Math.max(0, action.index ?? 0)), jobSecurity: t.security, suspicion: -9, tasksCompleted: 1, workActions: 1 }, `Completed: ${t.title}. A tangible contribution has occurred.`); if (id === "t2") { s.mail.m05.answered = true; s.mail.m05.read = true; s.followups = s.followups.filter(f => f.target !== "m05"); } break; }
    case "checkMail": apply(s, { minutes: 3 }, "Mail checked. The server regrets to inform you that it is working."); break;
    case "read": { const m = emails.find(m => m.id === id); if (!m || m.arrival > s.time || s.mail[id].deleted) return state; s.selectedMail = id; if (s.mail[id].read) return s; s.mail[id].read = true; apply(s, { minutes: 3 }, `Opened: ${m.subject}.`); break; }
    case "reply": { const m = emails.find(m => m.id === id); if (!m || m.arrival > s.time || s.mail[id].answered || s.mail[id].deleted) return state; s.mail[id].answered = true; s.mail[id].read = true; const important = ["IMPORTANT", "URGENT", "CLIENT"].includes(m.importance); const tone = action.index ?? 0; apply(s, { minutes: 7, energy: -2, patience: tone === 1 ? 3 : tone === 2 ? 2 : important ? -2 : -1, jobSecurity: tone === 1 ? 1 : tone === 2 ? -3 : important ? 5 : 1, suspicion: tone === 2 ? 4 : tone === 1 ? 0 : -5, emailsAnswered: 1, workActions: important && tone !== 2 ? 1 : 0 }, tone === 1 ? "Reply sent with a clear boundary. Your patience appreciates the representation." : tone === 2 ? "A vague reply has left your outbox. Management requests a less abstract employee." : "A helpful reply has been sent. Corporate diplomacy achieved."); s.followups = s.followups.filter(f => f.target !== id); break; }
    case "delete": { const m = emails.find(m => m.id === id); if (!m || m.arrival > s.time || s.mail[id].deleted) return state; const mail = s.mail[id]; mail.deleted = true; const important = !!m.deadline && !mail.answered; apply(s, { minutes: 3, patience: 3, suspicion: important ? 6 : 1, deletedEmails: mail.everDeleted ? 0 : 1, ignoredRequests: important ? 1 : 0 }, important ? "Moved to Recycle Bin. The deadline remains legally alive." : "Deleted. A small, measurable improvement to your day."); mail.everDeleted = true; s.selectedMail = null; break; }
    case "ignore": { if (!s.mail[id]) return state; s.selectedMail = null; apply(s, { minutes: 4, patience: 1, suspicion: 2, ignoredRequests: 1 }, "You decide this is a problem for future you."); break; }
    case "urgent": if (s.mail[id]) { s.mail[id].urgent = !s.mail[id].urgent; apply(s, { minutes: 1 }, "Priority flag updated. The actual deadline is unchanged."); } break;
    case "restore": if (!s.mail[id]?.deleted || s.mail[id].purged) return state; s.mail[id].deleted = false; apply(s, { minutes: 3, suspicion: -2 }, "Email restored. Accountability also restored."); break;
    case "empty": { const deleted = Object.values(s.mail).filter(m => m.deleted && !m.purged); if (!deleted.length) return state; deleted.forEach(m => m.purged = true); apply(s, { minutes: 4, patience: 2, suspicion: 3 }, "Bin emptied. Management's memory is a separate system."); break; }
    case "meeting": { const m = meetings.find(m => m.id === id); if (!m || s.meetingStatus[id] !== "pending" || s.time < m.at - 10) return state; trigger(s, "meeting", id); return s; }
    case "phone": { const pool = events.filter(e => e.category === "Phone" && !s.seenEvents.includes(e.id)); const e = pool[Math.floor(random(s) * pool.length)] ?? events.find(e => e.id === "phone-reception")!; trigger(s, e.id); return s; }
    case "it": apply(s, { minutes: 18, energy: -2, patience: -3, jobSecurity: s.printerBroken ? 4 : 1, suspicion: -4, repair: true, printerFixes: s.printerBroken ? 1 : 0 }, "IT asks you to restart it. This resolves an alarming number of things."); break;
    case "printer": if (s.printerBroken) { trigger(s, "jam"); return s; } s.printedPages += 3; apply(s, { minutes: 12, energy: -3, patience: -2, jobSecurity: 3, suspicion: -3, workActions: 1 }, "PRINTER STATUS: MIRACULOUSLY FUNCTIONAL. Your report is printed."); if (random(s) < .35) { s.printerBroken = true; notice(s, "PRINTER JAM · The miracle has expired."); } break;
    case "drawer": { if (s.drawerFound.length >= s.drawerOrder.length) return state; const item = id !== "" ? s.drawerOrder[Number(id)] : s.drawerOrder.find(item => !s.drawerFound.includes(item)); if (!item || s.drawerFound.includes(item)) return state; s.drawerFound.push(item); apply(s, { minutes: 4, distractionActions: 1 }, `Found: ${item}. It predates your employment contract.`); break; }
    case "item": { if (!s.drawerFound.includes(id) || s.usedItems.includes(id)) return state; s.usedItems.push(id); const effects: Record<string, Effect> = { snack: { energy: 14, patience: 3 }, aspirin: { patience: 10, energy: 2 }, floppy: { jobSecurity: 4, suspicion: -3 }, manual: { patience: -2, jobSecurity: 2 }, letter: { patience: 5, suspicion: 3 }, "rubber band": { patience: 6, suspicion: 4 }, "secret note": { suspicion: -12, patience: 3 }, "coffee packet": { energy: 12, patience: -2, coffeeCount: 1 } }; apply(s, { minutes: 6, ...effects[id] }, ({ manual: "Page 1: Employees are our greatest asset. Page 2: Overtime is expected.", floppy: "BACKUP_1997.DOC. You return a lost file to the shared drive.", letter: "An unsigned resignation letter. You appreciate its potential.", "secret note": "“When Martin walks by, open the budget.” Useful intelligence." } as Record<string, string>)[id] ?? `Used: ${id}. Personal wellbeing has improved on paper.`); break; }
    case "draw": s.card = 1 + Math.floor(random(s) * 13); s.cardDraws++; apply(s, { minutes: 10, patience: 5, suspicion: 8, distractionActions: 1, solitaireSessions: 1 }, "You draw a card. The work waits with excellent manners."); if (s.suspicion >= 25 && random(s) < .48) trigger(s, "footsteps"); break;
    case "stack": if (s.card === null) return state; { const match = s.stack === 0 || Math.abs(s.stack - s.card) === 1; if (match) { s.stack = s.card; s.card = null; } apply(s, { minutes: 3, patience: match ? 4 : -1, suspicion: 3 }, match ? "Card stacked. This is what progress feels like." : "Needs a card one rank higher or lower. The rules remain unreasonable."); break; }
    case "newCards": s.card = null; s.stack = 0; apply(s, { minutes: 3, suspicion: 2 }, "A new game. A fresh opportunity to avoid a spreadsheet."); break;
    case "browse": s.internetPage = (s.internetPage + 1) % 6; apply(s, { minutes: 10, patience: 4, suspicion: 6, distractionActions: 1 }, "The page loads. The future is mostly advertisements."); break;
    case "lamp": s.lampOn = !s.lampOn; apply(s, { minutes: 1 }, s.lampOn ? "The desk lamp reveals the paperwork." : "The paperwork remains, but less visibly."); break;
    default: return state;
  }
  finishAction(s, before); return s;
}
