"use client"

import { useEffect, useState, type CSSProperties, type MouseEvent } from "react"
import "./reference-game.css"

type PersonId = "kevin" | "jim" | "pam" | "michael"
type TaskId = "report" | "meeting"
type Dialog = "talk" | "tasks" | "menu" | "help" | null
type Game = {
  time: number
  energy: number
  patience: number
  security: number
  selected: PersonId
  jobs: PersonId[]
  report: number
  done: TaskId[]
  line: string
  manager: "AWARE" | "WATCHING" | "CALM"
  player: { x: number; y: number }
}

const initial: Game = {
  time: 10 * 60 + 42,
  energy: 75,
  patience: 70,
  security: 65,
  selected: "kevin",
  jobs: [],
  report: 65,
  done: [],
  line: "",
  manager: "AWARE",
  player: { x: 53.6, y: 72 },
}

const people: Record<
  PersonId,
  {
    name: string
    role: string
    greeting: string
    working: string
    x: number
    y: number
    w: number
    h: number
    portrait: [number, number]
    head: [number, number, number, number]
  }
> = {
  kevin: {
    name: "KEVIN",
    role: "Accounts",
    greeting: "I can finish the report. Unless Martin has another quick favor.",
    working: "The numbers are coming together. Give me a little more time.",
    x: 37,
    y: 39,
    w: 11,
    h: 32,
    portrait: [1194, 610],
    head: [648, 381, 112, 116],
  },
  jim: {
    name: "JIM",
    role: "Sales",
    greeting: "I can call the client. Let's keep the meeting short.",
    working: "I'm on it. The client may even pick up.",
    x: 8,
    y: 31,
    w: 12,
    h: 36,
    portrait: [167, 302],
    head: [152, 299, 113, 108],
  },
  pam: {
    name: "PAM",
    role: "Reception",
    greeting: "I'm on a call, but I can help in a minute.",
    working: "The schedule is sorted. Almost.",
    x: 88,
    y: 30,
    w: 10,
    h: 23,
    portrait: [1493, 303],
    head: [1490, 298, 111, 108],
  },
  michael: {
    name: "MARTIN",
    role: "Manager",
    greeting: "Good people. Better work. Brighter tomorrow.",
    working: "I'll approve it after a very quick meeting.",
    x: 55,
    y: 13,
    w: 11,
    h: 39,
    portrait: [978, 137],
    head: [980, 139, 103, 111],
  },
}

const clamp = (n: number) => Math.max(0, Math.min(100, n))
const clock = (minutes: number) => {
  const hour = Math.floor(minutes / 60)
  return `${String(hour % 12 || 12).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")} ${hour >= 12 ? "PM" : "AM"}`
}

function Meter({
  label,
  value,
  color,
}: {
  label: string
  value: number
  color: string
}) {
  return (
    <div className="ref-meter">
      <div className="ref-meter-label">
        <span>{label}</span>
        <b>{value}</b>
      </div>
      <div
        className="ref-meter-track"
        role="progressbar"
        aria-label={label}
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        {Array.from({ length: 15 }, (_, i) => (
          <i
            key={i}
            style={{
              background:
                i < Math.round((value / 100) * 15) ? color : "#fbf6e8",
            }}
          />
        ))}
      </div>
    </div>
  )
}

export default function ReferenceGame() {
  const [game, setGame] = useState<Game>(initial)
  const [ready, setReady] = useState(false)
  const [dialog, setDialog] = useState<Dialog>(null)
  const [toast, setToast] = useState("")
  const [walking, setWalking] = useState(false)
  const [panelTouched, setPanelTouched] = useState(false)
  const [hudTouched, setHudTouched] = useState(false)
  const [reportTouched, setReportTouched] = useState(false)
  const [talkLine, setTalkLine] = useState("")
  const [reaction, setReaction] = useState<PersonId | null>(null)

  useEffect(() => {
    try {
      const saved = JSON.parse(
        localStorage.getItem("office-reference-game-v1") || "null"
      )
      if (
        saved &&
        typeof saved.time === "number" &&
        people[saved.selected as PersonId] &&
        Array.isArray(saved.jobs) &&
        Array.isArray(saved.done)
      ) {
        setGame({ ...initial, ...saved })
        const changed = JSON.stringify(saved) !== JSON.stringify(initial)
        setPanelTouched(
          changed && (saved.selected !== "kevin" || saved.jobs.length > 0)
        )
        setHudTouched(
          changed &&
            (saved.time !== initial.time ||
              saved.energy !== initial.energy ||
              saved.patience !== initial.patience ||
              saved.security !== initial.security)
        )
        setReportTouched(changed && saved.report !== initial.report)
      }
    } catch {
      /* A fresh game is still playable when storage is blocked. */
    }
    setReady(true)
  }, [])
  useEffect(() => {
    if (!ready) return
    try {
      localStorage.setItem("office-reference-game-v1", JSON.stringify(game))
    } catch {
      /* Optional save. */
    }
  }, [game, ready])
  useEffect(() => {
    if (!toast) return
    const id = window.setTimeout(() => setToast(""), 3600)
    return () => window.clearTimeout(id)
  }, [toast])
  useEffect(() => {
    if (!reaction) return
    const id = window.setTimeout(() => setReaction(null), 850)
    return () => window.clearTimeout(id)
  }, [reaction])
  useEffect(() => {
    const handle = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setDialog(null)
        return
      }
      if (event.key.toLowerCase() === "m") {
        setDialog("menu")
        return
      }
      if (event.key === "?" || event.key.toLowerCase() === "h") {
        setDialog("help")
        return
      }
      const dir: Record<string, [number, number]> = {
        ArrowUp: [0, -2],
        ArrowDown: [0, 2],
        ArrowLeft: [-2, 0],
        ArrowRight: [2, 0],
        w: [0, -2],
        s: [0, 2],
        a: [-2, 0],
        d: [2, 0],
      }
      const step = dir[event.key]
      if (step && !dialog) {
        event.preventDefault()
        setWalking(true)
        setGame((g) => ({
          ...g,
          player: {
            x: Math.max(4, Math.min(96, g.player.x + step[0])),
            y: Math.max(17, Math.min(91, g.player.y + step[1])),
          },
        }))
      }
    }
    window.addEventListener("keydown", handle)
    return () => window.removeEventListener("keydown", handle)
  }, [dialog])

  const selected = people[game.selected]
  const isWorking = game.jobs.includes(game.selected)
  function select(id: PersonId) {
    setGame((g) => ({ ...g, selected: id }))
    setReaction(id)
    setPanelTouched(true)
    setTalkLine("")
    setToast(`${people[id].name} SELECTED`)
  }
  function assign() {
    if (isWorking) return
    setReaction(game.selected)
    setGame((g) => ({
      ...g,
      jobs: [...g.jobs, g.selected],
      time: g.time + 5,
      energy: clamp(g.energy - 2),
      security: clamp(g.security + 2),
      line: `${people[g.selected].name} is on the job.`,
    }))
    setPanelTouched(true)
    setHudTouched(true)
    if (game.selected === "kevin") setReportTouched(true)
    setToast(`${selected.name} STARTED WORK  •  SECURITY +2`)
  }
  function advance(minutes = 15) {
    setGame((g) => {
      const report = clamp(g.report + (g.jobs.includes("kevin") ? 20 : 5))
      const done = [...g.done]
      if (report >= 100 && !done.includes("report")) done.push("report")
      if (g.time + minutes >= 11 * 60 && !done.includes("meeting"))
        done.push("meeting")
      return {
        ...g,
        time: g.time + minutes,
        energy: clamp(g.energy - (g.jobs.length ? 3 : 1)),
        patience: clamp(g.patience - 1),
        security: clamp(g.security + (g.jobs.length ? 3 : 0)),
        report,
        done,
        manager:
          g.time + minutes >= 12 * 60 && report < 100 ? "WATCHING" : "AWARE",
        line:
          report >= 100
            ? "The Q3 report is finished. Somehow, we survived."
            : `${g.jobs.length} coworker${g.jobs.length === 1 ? "" : "s"} making progress.`,
      }
    })
    setHudTouched(true)
    setReportTouched(true)
    setPanelTouched(true)
    setToast(`TIME ADVANCED ${minutes} MINUTES`)
  }
  function station(kind: "coffee" | "printer" | "plant" | "computer") {
    if (kind === "computer") {
      setDialog("tasks")
      return
    }
    setGame((g) => ({
      ...g,
      time: g.time + 5,
      energy: clamp(
        g.energy + (kind === "coffee" ? 12 : kind === "printer" ? -3 : 0)
      ),
      patience: clamp(g.patience + (kind === "plant" ? 8 : 0)),
      security: clamp(g.security + (kind === "printer" ? 5 : 0)),
    }))
    setHudTouched(true)
    setToast(
      kind === "coffee"
        ? "COFFEE BREAK  •  ENERGY +12"
        : kind === "printer"
          ? "REPORT PRINTED  •  SECURITY +5"
          : "PLANT WATERED  •  PATIENCE +8"
    )
  }
  function move(event: MouseEvent<HTMLDivElement>) {
    if ((event.target as HTMLElement).closest("button")) return
    const rect = event.currentTarget.getBoundingClientRect()
    const x = Math.max(
      4,
      Math.min(96, ((event.clientX - rect.left) / rect.width) * 100)
    )
    const y = Math.max(
      17,
      Math.min(91, ((event.clientY - rect.top) / rect.height) * 100)
    )
    setWalking(true)
    setGame((g) => ({ ...g, player: { x, y } }))
    setToast("MOVING THROUGH THE OFFICE")
  }
  function doTask(id: TaskId) {
    if (game.done.includes(id)) return
    setGame((g) => ({
      ...g,
      done: [...g.done, id],
      time: g.time + (id === "report" ? 25 : 15),
      energy: clamp(g.energy - (id === "report" ? 8 : 3)),
      security: clamp(g.security + (id === "report" ? 8 : 2)),
      report: id === "report" ? 100 : g.report,
    }))
    setHudTouched(true)
    setReportTouched(true)
    setDialog(null)
    setToast(
      id === "report"
        ? "Q3 REPORT COMPLETE  •  SECURITY +8"
        : "TEAM MEETING COMPLETE"
    )
  }
  function reset() {
    setGame(initial)
    setPanelTouched(false)
    setHudTouched(false)
    setReportTouched(false)
    setWalking(false)
    setReaction(null)
    setDialog(null)
    setToast("NEW SHIFT STARTED")
    try {
      localStorage.removeItem("office-reference-game-v1")
    } catch {
      /* Optional save. */
    }
  }
  const portraitStyle = {
    "--crop-x": `-${selected.portrait[0] / 16.72}cqw`,
    "--crop-y": `-${selected.portrait[1] / 16.72}cqw`,
  } as CSSProperties

  return (
    <main className="ref-shell">
      <div
        className="ref-stage"
        onClick={move}
        aria-label="Interactive pixel art office"
      >
        <div className="ref-scene" aria-hidden="true" />
      {(["jim", "kevin", "michael", "pam"] as PersonId[]).map((id) => {
        const [headX, headY, headW, headH] = people[id].head
        const headStyle = {
          left: `${(headX / 1672) * 100}%`,
          top: `${(headY / 941) * 100}%`,
          width: `${(headW / 1672) * 100}%`,
          height: `${(headH / 941) * 100}%`,
          "--sprite-x": `-${headX / 16.72}cqw`,
          "--sprite-y": `-${headY / 16.72}cqw`,
        } as CSSProperties
        return (
          <div key={id}>
            <span
              className={`ref-avatar-head ref-head-${id} ${reaction === id ? "is-reacting" : ""}`}
              style={headStyle}
              aria-hidden="true"
            />
            <button
              type="button"
              className={`ref-hotspot ref-${id} ${game.jobs.includes(id) ? "is-working" : ""}`}
              style={{
                left: `${people[id].x}%`,
                top: `${people[id].y}%`,
                width: `${people[id].w}%`,
                height: `${people[id].h}%`,
              }}
              aria-label={`Select ${people[id].name}`}
              title={`Select ${people[id].name}`}
              onClick={(event) => {
                event.stopPropagation()
                select(id)
              }}
            >
              <span className="ref-character-activity" aria-hidden="true" />
            </button>
          </div>
        )
      })}
      <span
        className="ref-avatar-head ref-head-player"
        style={{
          left: `${(831 / 1672) * 100}%`,
          top: `${(417 / 941) * 100}%`,
          width: `${(132 / 1672) * 100}%`,
          height: `${(119 / 941) * 100}%`,
          "--sprite-x": `-${831 / 16.72}cqw`,
          "--sprite-y": `-${417 / 16.72}cqw`,
        } as CSSProperties}
        aria-hidden="true"
      />
        <button
          className="ref-object ref-coffee"
          title="Make coffee"
          aria-label="Make coffee"
          onClick={(event) => {
            event.stopPropagation()
            station("coffee")
          }}
        />
        <button
          className="ref-object ref-printer"
          title="Use printer"
          aria-label="Use printer"
          onClick={(event) => {
            event.stopPropagation()
            station("printer")
          }}
        />
        <button
          className="ref-object ref-plant"
          title="Water plant"
          aria-label="Water plant"
          onClick={(event) => {
            event.stopPropagation()
            station("plant")
          }}
        />
        <button
          className="ref-object ref-computer"
          title="Open computer tasks"
          aria-label="Open computer tasks"
          onClick={(event) => {
            event.stopPropagation()
            station("computer")
          }}
        />
        <button
          className="ref-report-hit"
          title="Open Q3 report"
          aria-label="Open Q3 report"
          onClick={(event) => {
            event.stopPropagation()
            setDialog("tasks")
          }}
        />

        {hudTouched && (
          <header className="ref-hud" onClick={(e) => e.stopPropagation()}>
            <h1>
              OFFICE SURVIVAL
              <br />
              1999
            </h1>
            <div className="ref-meters">
              <Meter label="ENERGY" value={game.energy} color="#f9af2a" />
              <Meter label="PATIENCE" value={game.patience} color="#48c987" />
              <Meter label="SECURITY" value={game.security} color="#27bfce" />
            </div>
            <div className="ref-clock">
              <strong>{clock(game.time)}</strong>
              <span>👨🏻‍💼 &nbsp; MANAGER: {game.manager}</span>
            </div>
          </header>
        )}
        {reportTouched && (
          <button
            className="ref-report"
            onClick={(event) => {
              event.stopPropagation()
              setDialog("tasks")
            }}
          >
            <b>Q3 REPORT</b>
            <span>
              <i style={{ width: `${game.report}%` }} />
            </span>
            <small>{game.report >= 100 ? "Completed!" : "In progress"}</small>
          </button>
        )}
        {walking && (
          <div
            className="ref-waypoint"
            style={{ left: `${game.player.x}%`, top: `${game.player.y}%` }}
            aria-label="Your current position"
          >
            <i />
          </div>
        )}
        <section
          className={`ref-today ${game.done.length ? "is-active" : ""}`}
          onClick={(e) => e.stopPropagation()}
          aria-label="Today's tasks"
        >
          <h2>TODAY</h2>
          <button
            onClick={() => doTask("report")}
            aria-label="Complete Q3 report"
          >
            <span>{game.done.includes("report") ? "✓" : ""}</span>
            <b>Q3 report</b>
            <time>12:10 PM</time>
          </button>
          <button
            onClick={() => doTask("meeting")}
            aria-label="Attend team meeting"
          >
            <span>{game.done.includes("meeting") ? "✓" : ""}</span>
            <b>Team meeting</b>
            <time>11:00 AM</time>
          </button>
        </section>
        <section
          className={`ref-person ${panelTouched ? "is-active" : ""}`}
          onClick={(e) => e.stopPropagation()}
          aria-label="Selected coworker"
        >
          <h2>{selected.name}</h2>
          <div className="ref-person-content">
            <div
              className="ref-portrait"
              style={portraitStyle}
              aria-hidden="true"
            />
            <div>
              <span>{selected.role}</span>
              <p>{isWorking ? selected.working : selected.greeting}</p>
            </div>
          </div>
          <div className="ref-actions">
            <button
              className="ref-assign"
              onClick={assign}
              disabled={isWorking}
            >
              {isWorking ? "WORKING..." : "ASSIGN TASK"}
            </button>
            <button
              onClick={() => {
                setTalkLine("")
                setDialog("talk")
              }}
            >
              TALK
            </button>
          </div>
        </section>
        {!panelTouched && (
          <>
            <button
              className="ref-original-assign"
              aria-label="Assign Kevin a task"
              onClick={(event) => {
                event.stopPropagation()
                assign()
              }}
            />
            <button
              className="ref-original-talk"
              aria-label="Talk to Kevin"
              onClick={(event) => {
                event.stopPropagation()
                setDialog("talk")
              }}
            />
          </>
        )}
        <button
          className="ref-footer"
          onClick={(event) => {
            event.stopPropagation()
            setDialog("help")
          }}
          aria-label="How to play"
        >
          Click to move &nbsp; • &nbsp; Select a coworker to interact
        </button>
        <button
          className="ref-menu-trigger"
          onClick={(event) => {
            event.stopPropagation()
            setDialog("menu")
          }}
          title="Open game menu"
          aria-label="Open game menu"
        >
          ☰
        </button>
        {toast && (
          <div className="ref-toast" role="status">
            {toast}
          </div>
        )}
        {dialog && (
          <div
            className="ref-modal-scrim"
            onClick={(event) => {
              event.stopPropagation()
              setDialog(null)
            }}
          >
            <section
              className="ref-modal"
              role="dialog"
              aria-modal="true"
              aria-label={
                dialog === "talk"
                  ? `Talk to ${selected.name}`
                  : dialog === "tasks"
                    ? "Tasks"
                    : dialog === "help"
                      ? "How to play"
                      : "Game menu"
              }
              onClick={(event) => event.stopPropagation()}
            >
              <button
                className="ref-close"
                onClick={() => setDialog(null)}
                aria-label="Close"
              >
                ×
              </button>
              {dialog === "talk" ? (
                <>
                  <h2>TALK TO {selected.name}</h2>
                  <p className="ref-dialog-line">
                    {talkLine || selected.greeting}
                  </p>
                  <div className="ref-modal-actions">
                    <button
                      onClick={() => {
                        setTalkLine(
                          "Let's get this done. I'll leave you to it."
                        )
                        setGame((g) => ({
                          ...g,
                          patience: clamp(g.patience + 2),
                          time: g.time + 4,
                        }))
                        setHudTouched(true)
                      }}
                    >
                      ASK ABOUT WORK <small>4 MIN · PATIENCE +2</small>
                    </button>
                    <button
                      onClick={() => {
                        setTalkLine("A tiny break might actually help.")
                        setGame((g) => ({
                          ...g,
                          patience: clamp(g.patience + 5),
                          time: g.time + 6,
                          security: clamp(g.security - 1),
                        }))
                        setHudTouched(true)
                      }}
                    >
                      CHAT A LITTLE <small>6 MIN · PATIENCE +5</small>
                    </button>
                  </div>
                </>
              ) : dialog === "tasks" ? (
                <>
                  <h2>THE TO-DO LIST</h2>
                  <p>
                    Every choice moves the office clock. Give Kevin work, or
                    finish the report yourself.
                  </p>
                  <div className="ref-modal-actions">
                    <button
                      disabled={game.done.includes("report")}
                      onClick={() => doTask("report")}
                    >
                      FINISH Q3 REPORT <small>25 MIN · SECURITY +8</small>
                    </button>
                    <button
                      disabled={game.done.includes("meeting")}
                      onClick={() => doTask("meeting")}
                    >
                      ATTEND TEAM MEETING <small>15 MIN · SECURITY +2</small>
                    </button>
                  </div>
                </>
              ) : dialog === "help" ? (
                <>
                  <h2>HOW TO PLAY</h2>
                  <p>
                    Click coworkers to select them. Assign tasks, talk, or click
                    the coffee machine, printer, plant, and computer. Click the
                    floor or use arrow keys / WASD to move your marker. Advance
                    time to see work progress.
                  </p>
                  <div className="ref-modal-actions">
                    <button onClick={() => setDialog("menu")}>OPEN MENU</button>
                    <button onClick={() => setDialog(null)}>
                      BACK TO OFFICE
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <h2>OFFICE MENU</h2>
                  <p>
                    {clock(game.time)} · {game.jobs.length} coworker
                    {game.jobs.length === 1 ? "" : "s"} working · Q3 report{" "}
                    {game.report}%
                  </p>
                  <div className="ref-modal-actions">
                    <button
                      onClick={() => {
                        advance()
                        setDialog(null)
                      }}
                    >
                      ADVANCE 15 MIN
                    </button>
                    <button onClick={() => setDialog("tasks")}>
                      VIEW TASKS
                    </button>
                    <button onClick={() => setDialog("help")}>
                      HOW TO PLAY
                    </button>
                    <button onClick={reset}>START NEW SHIFT</button>
                  </div>
                </>
              )}
            </section>
          </div>
        )}
      </div>
      <p className="ref-mobile-note">Drag sideways to explore the office.</p>
    </main>
  )
}
