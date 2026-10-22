import {
  initialState,
  reducer as deskReducer,
  officeEffect,
  evaluateEnding,
  type Action,
  type GameState,
} from "../office/engine.ts"
import { employees, employeeById, departments } from "./roster.ts"
import { endings } from "../office/content.ts"
export type Person = {
  trust: number
  mood: number
  talks: number
  helped: number
  interrupted: number
  completed: number
  memory: string
  job: null | { progress: number; duration: number; title: string }
}
export type OfficeState = GameState & {
  people: Record<string, Person>
  completedDepartments: string[]
  officeNews: { time: number; text: string }[]
  milestones: number[]
  selected: string
  version: 3
}
export type OfficeAction =
  | Action
  | {
      type: "PERSON"
      id: string
      kind: "assign" | "help" | "interrupt" | "talk"
      topic?: number
    }
  | { type: "SHIFT"; minutes: number }
  | { type: "SELECT"; id: string }
  | { type: "RESTORE"; state: OfficeState }
export function newOffice(seed = 1999): OfficeState {
  return {
    ...initialState(seed),
    version: 3,
    mode: "welcome",
    people: Object.fromEntries(
      employees.map((e) => [
        e.id,
        {
          trust: 50,
          mood: 70,
          talks: 0,
          helped: 0,
          interrupted: 0,
          completed: 0,
          memory: "We haven't worked together yet.",
          job: null,
        },
      ])
    ),
    completedDepartments: [],
    officeNews: [
      {
        time: 0,
        text: "The branch is open. Coordinate one delivery from each department and make it to 5 PM.",
      },
    ],
    milestones: [],
    selected: "dwight",
  }
}
const clamp = (n: number) => Math.max(0, Math.min(100, n))
export const workRate = (p: Person) =>
  p.mood < 35 ? 0.55 : p.trust >= 65 ? 1.2 : 1
function finishOffice(s: OfficeState) {
  const prior = s.ending
  s.ending = evaluateEnding(s)
  if (
    prior !== s.ending &&
    prior &&
    s.history.at(-1)?.text === endings[prior][0]
  ) {
    if (s.ending) s.history[s.history.length - 1].text = endings[s.ending][0]
    else s.history.pop()
  }
  if (s.ending) {
    s.mode = "ended"
    s.activeEvent = null
    s.interaction = null
  } else if (s.mode === "ended") s.mode = "playing"
}
function news(s: OfficeState, text: string) {
  s.officeNews = [{ time: s.time, text }, ...s.officeNews].slice(0, 60)
}
function advancePeople(s: OfficeState, elapsed: number, previous: number) {
  if (elapsed <= 0) return
  for (const [id, p] of Object.entries(s.people)) {
    if (!p.job) continue
    const speed = workRate(p)
    p.job.progress = Math.min(p.job.duration, p.job.progress + elapsed * speed)
    if (p.job.progress >= p.job.duration) {
      const e = employeeById(id)
      const title = p.job.title
      p.completed++
      p.trust = clamp(p.trust + 7)
      p.mood = clamp(p.mood + 4)
      p.job = null
      p.memory = `We delivered: ${title.toLowerCase()}.`
      s.tasksCompleted++
      s.jobSecurity = clamp(s.jobSecurity + 4)
      if (!s.completedDepartments.includes(e.department))
        s.completedDepartments.push(e.department)
      news(s, `${e.name} completed “${title}”. Job security +4.`)
    }
  }
  const moments = [75, 150, 240, 330, 420]
  for (const at of moments) {
    if (previous < at && s.time >= at && !s.milestones.includes(at)) {
      s.milestones.push(at)
      if (at === 75) {
        const jim = s.people.jim,
          dwight = s.people.dwight
        if (jim.job) {
          news(
            s,
            "Jim kept the prank for later. Dwight's inventory work stays on schedule."
          )
          dwight.trust = clamp(dwight.trust + 3)
        } else {
          news(
            s,
            "Jim moved Dwight's stationery. Dwight's investigation costs 8 minutes of inventory progress."
          )
          if (dwight.job)
            dwight.job.progress = Math.max(0, dwight.job.progress - 8)
          dwight.mood = clamp(dwight.mood - 10)
        }
      }
      if (at === 150) {
        const workers = Object.values(s.people).filter((p) => p.job)
        workers.forEach((p) => {
          p.job!.progress = Math.max(0, p.job!.progress - 5)
        })
        news(
          s,
          `Michael called an impromptu meeting. ${workers.length} active assignments lost 5 minutes of progress.`
        )
      }
      if (at === 240) {
        if (s.people.oscar.completed || s.people.angela.completed) {
          s.people.kevin.mood = clamp(s.people.kevin.mood + 12)
          if (s.people.kevin.job) s.people.kevin.job.progress += 10
          news(
            s,
            "Oscar and Angela shared the checked figures. Kevin gains 10 minutes of progress and 12 morale."
          )
        } else
          news(
            s,
            "Kevin is still waiting for checked figures. An accounting assignment would help."
          )
      }
      if (at === 330) {
        const support = s.people.pam.completed || s.people.ryan.completed
        if (support) {
          for (const p of Object.values(s.people)) p.mood = clamp(p.mood + 8)
          s.patience = clamp(s.patience + 6)
          news(
            s,
            "Pam and Ryan's organized records made the afternoon easier. Team morale +8; your patience +6."
          )
        } else
          news(
            s,
            "Pam needs help with the office records. An operations delivery can still improve the afternoon."
          )
      }
      if (at === 420) {
        s.jobSecurity = clamp(
          s.jobSecurity +
            (s.completedDepartments.length === departments.length ? 6 : -3)
        )
        news(
          s,
          s.completedDepartments.length === departments.length
            ? "Michael approved the branch report. Every department delivered. Job security +6."
            : "Michael needs the branch report. Finish the missing department deliveries before closing."
        )
      }
    }
  }
}
export function officeReducer(
  state: OfficeState,
  a: OfficeAction
): OfficeState {
  if (a.type === "RESTORE")
    return validSave(a.state)
      ? { ...a.state, sound: false, interaction: null }
      : state
  if (a.type === "SELECT") return employees.some(e => e.id === a.id) ? { ...state, selected: a.id } : state
  if (a.type === "START" || a.type === "RESTART_CONFIRM")
    return {
      ...newOffice(a.seed ?? state.seed),
      mode: "playing",
      sound: state.sound,
    }
  if (a.type === "PERSON" || a.type === "SHIFT") {
    if (state.mode !== "playing" || state.activeEvent || state.interaction)
      return state
    let s = structuredClone(state)
    const before = s.time
    if (a.type === "SHIFT") {
      s = officeEffect(
        s,
        {
          minutes: Math.min(30, Math.max(5, a.minutes)),
          energy: -2,
          patience: -1,
          jobSecurity: 1,
          suspicion: -3,
          workActions: 1,
        },
        "Coordinated the branch's active assignments."
      )
    } else {
      const e = employees.find((e) => e.id === a.id)
      if (!e) return state
      const p = s.people[a.id]
      s.selected = a.id
      if (a.kind === "assign") {
        if (p.job) return state
        p.job = {
          title: p.completed
            ? `${e.task} · follow-up ${p.completed + 1}`
            : e.task,
          progress: 0,
          duration: e.duration + p.completed * 10,
        }
        p.memory = "You gave me a clear task and time to work on it."
        s = officeEffect(
          s,
          { minutes: 5, energy: -1, jobSecurity: 1, suspicion: -2 },
          `Assigned ${e.name}: ${p.job.title}.`
        )
        news(s, `${e.name}: “${e.response}”`)
      }
      if (a.kind === "help") {
        if (!p.job) return state
        const bonus = p.helped >= 3 ? 3 : 12
        p.job.progress += bonus
        p.helped++
        p.trust = clamp(p.trust + 8)
        p.mood = clamp(p.mood + 6)
        p.memory = "You helped me work through the difficult part."
        s = officeEffect(
          s,
          {
            minutes: 8,
            energy: -4,
            patience: 2,
            coworkersHelped: 1,
            workActions: 1,
            suspicion: -3,
          },
          `Helped ${e.name}. Task progress +${bonus} minutes; trust +8.`
        )
      }
      if (a.kind === "interrupt") {
        if (!p.job) return state
        p.job.progress = Math.max(0, p.job.progress - 10)
        p.trust = clamp(p.trust - 8)
        p.mood = clamp(p.mood - 12)
        p.interrupted++
        p.memory = "You interrupted my work. I lost my place."
        s = officeEffect(
          s,
          { minutes: 4, patience: 2, jobSecurity: -2, suspicion: 4 },
          `Interrupted ${e.name}. Task progress −10; trust −8.`
        )
      }
      if (a.kind === "talk") {
        const topic = a.topic ?? 0
        const fresh = p.talks < 3
        p.talks++
        p.trust = clamp(p.trust + (fresh ? 5 : 1))
        p.mood = clamp(p.mood + (fresh ? 4 : 0))
        p.memory =
          topic === 1
            ? "You listened to my advice about the work."
            : topic === 2
              ? `We took a moment to ${e.hobby.toLowerCase()}.`
              : "You stopped by and asked how I was doing."
        s = officeEffect(
          s,
          {
            minutes: topic === 2 ? 8 : 4,
            patience: fresh ? 3 : 0,
            energy: topic === 2 ? 2 : -1,
            suspicion: topic === 2 ? 3 : 0,
          },
          `Talked with ${e.name}. ${topic === 1 ? e.advice : topic === 2 ? e.hobby : e.greeting}`
        )
      }
    }
    advancePeople(s, s.time - before, before)
    finishOffice(s)
    return s
  }
  const next = deskReducer(state, a) as OfficeState
  if (next === state) return state
  // The legacy desk reducer clones the whole state, preserving simulation data.
  advancePeople(next, next.time - state.time, state.time)
  finishOffice(next)
  return next
}
export function migrateOfficeSave(value: unknown): unknown {
  if (!value || typeof value !== "object") return value
  const old = value as Record<string, unknown>
  if (old.version !== 2 || !old.people || typeof old.people !== "object") return value
  const people = old.people as Record<string, Person>
  return {
    ...old,
    version: 3,
    people: Object.fromEntries(employees.map(e => [e.id, people[e.id]])),
    selected: employees.some(e => e.id === old.selected) ? old.selected : "dwight",
    completedDepartments: Array.isArray(old.completedDepartments) ? old.completedDepartments.filter(d => departments.includes(d)) : [],
  }
}
export function validSave(s: unknown): s is OfficeState {
  if (!s || typeof s !== "object") return false
  const v = s as OfficeState
  const baseline = newOffice()
  return (
    v.version === 3 &&
    Object.keys(v.people ?? {}).length === employees.length &&
    ["welcome", "playing", "ended"].includes(v.mode) &&
    employees.some((e) => e.id === v.selected) &&
    Number.isFinite(v.time) &&
    v.time >= 0 &&
    v.time <= 480 &&
    employees.every((e) => {
      const p = v.people?.[e.id]
      return (
        p &&
        [p.trust, p.mood].every(
          (n) => Number.isFinite(n) && n >= 0 && n <= 100
        ) &&
        Number.isFinite(p.completed) &&
        typeof p.memory === "string" &&
        (!p.job ||
          (typeof p.job.title === "string" &&
            Number.isFinite(p.job.duration) &&
            p.job.duration > 0 &&
            Number.isFinite(p.job.progress) &&
            p.job.progress >= 0))
      )
    }) &&
    [
      "officeNews",
      "completedDepartments",
      "milestones",
      "history",
      "notices",
      "followups",
      "seenEvents",
      "achievements",
      "openApps",
      "drawerFound",
      "usedItems",
      "drawerOrder",
    ].every((key) => Array.isArray(v[key as keyof OfficeState])) &&
    Object.keys(baseline.mail).every(
      (id) => typeof v.mail?.[id]?.read === "boolean"
    ) &&
    !!v.taskStatus &&
    !!v.meetingStatus &&
    [v.energy, v.patience, v.jobSecurity, v.suspicion].every(
      (n) => Number.isFinite(n) && n >= 0 && n <= 100
    )
  )
}
