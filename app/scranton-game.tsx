"use client"
import { useEffect, useReducer, useRef, useState, type Dispatch } from "react"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/8bit/button"
import { Card } from "@/components/ui/8bit/card"
import { Badge } from "@/components/ui/8bit/badge"
import { Input } from "@/components/ui/8bit/input"
import { Progress } from "@/components/ui/8bit/progress"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/8bit/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/8bit/select"
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/8bit/dialog"
import { DeskInteraction } from "@/components/office/interactions"
import { AppContent } from "./office-game"
import {
  employees,
  departments,
  employeeById,
  type Employee,
} from "@/lib/scranton/roster"
import { stations } from "@/lib/scranton/world"
import {
  newOffice,
  officeReducer,
  validSave,
  migrateOfficeSave,
  workRate,
  type OfficeAction,
  type OfficeState,
} from "@/lib/scranton/simulation"
import {
  activeEvent,
  formatTime,
  managerState,
  type Action,
  type AppId,
  type InteractionKind,
} from "@/lib/office/engine"
import { endings, meetings } from "@/lib/office/content"
import { enableSound, playSound } from "@/lib/office/sound"
import {
  Volume2,
  VolumeX,
  HelpCircle,
  RotateCcw,
  Clock3,
  Check,
  ArrowUpRight,
  ClipboardList,
  Users,
  MessageSquare,
  Zap,
  Coffee,
  MapPin,
  Building2,
} from "lucide-react"
import "./scranton.css"
import "./immersive.css"
const Scene = dynamic(() => import("@/components/scranton/scene"), {
  ssr: false,
  loading: () => (
    <div className="scranton-loading">
      <Building2 />
      <span className="retro">OPENING THE BRANCH…</span>
    </div>
  ),
})
const SAVE_KEY = "office-survival-1999-v3"
function Portrait({
  employee: e,
  small = false,
}: {
  employee: Employee
  small?: boolean
}) {
  return (
    <svg
      className={`scranton-portrait ${small ? "small" : ""}`}
      viewBox="0 0 24 26"
      shapeRendering="crispEdges"
      aria-label={`Pixel portrait of ${e.name}`}
      role="img"
    >
      <path fill="#d1d5bc" d="M0 0h24v26H0z" />
      <path fill="#b6c1a7" d="M0 20h24v6H0zM2 2h6v2H2zM18 6h4v2h-4z" />
      <path fill={e.hair} d="M7 3h10v2h2v11H5V5h2z" />
      <path
        fill={e.skin}
        d="M7 6h10v11H7zM5 8h2v5H5zM17 8h2v5h-2zM10 17h4v3h-4z"
      />
      <path
        fill={e.hair}
        d={
          e.style === "bald"
            ? "M7 5h2v3H7zM15 5h2v3h-2z"
            : "M7 4h10v3H7zM7 6h2v2H7z"
        }
      />
      {e.style === "long" && (
        <path fill={e.hair} d="M5 5h2v16H5zM17 5h2v16h-2z" />
      )}
      <path fill="#303a32" d="M9 10h1v1H9zM14 10h1v1h-1z" />
      {e.style === "glasses" && (
        <path
          fill="#4b4c35"
          d="M8 9h3v1H8zM13 9h3v1h-3zM8 12h3v1H8zM13 12h3v1h-3zM8 10h1v2H8zM10 10h1v2h-1zM13 10h1v2h-1zM15 10h1v2h-1zM11 10h2v1h-2z"
        />
      )}
      <path fill="#a97456" d="M11 14h3v1h-3z" />
      <path fill={e.shirt} d="M5 19h14v2h2v5H3v-5h2z" />
      <path fill="#ece6d1" d="M9 19h6v2H9z" />
      <path fill={e.tie} d="M11 20h2v6h-2z" />
      <path fill="#102735" opacity=".14" d="M15 7h2v10h-2zM14 17v2h-4v-2zM17 21h4v5h-4z"/>
      <path fill="#fff7e2" opacity=".22" d="M7 7h2v8H7zM5 21h2v5H5zM8 4h7v1H8z"/>
      {e.style === "beard" && <path fill={e.hair} d="M7 13h2v2h6v-2h2v4H7z" />}
    </svg>
  )
}
const actualNames = (text: string) =>
  text
    .replace(/\bMartin\b/g, "Michael")
    .replace(/Corporate Systems Inc\./g, "Dunder Mifflin")
export default function ScrantonGame() {
  const [s, rawDispatch] = useReducer(officeReducer, undefined, () =>
    newOffice()
  )
  const [ready, setReady] = useState(false)
  const [saved, setSaved] = useState<OfficeState | null>(null)
  const [storageError, setStorageError] = useState(false)
  const [panel, setPanel] = useState("employee")
  const [search, setSearch] = useState("")
  const [department, setDepartment] = useState("all")
  const [sort, setSort] = useState("name")
  const [dialog, setDialog] = useState<
    | null
    | "talk"
    | "computer"
    | "help"
    | "history"
    | "restart"
    | "directory"
    | "stations"
  >(null)
  const [app, setApp] = useState<AppId>("Mail")
  const [reply, setReply] = useState<string | null>(null)
  const [focus, setFocus] = useState("dwight")
  const [focusSerial, setFocusSerial] = useState(0)
  const [navigation, setNavigation] = useState("Click a coworker · Drag to rotate · Scroll to zoom · Shift-drag to pan")
  const lastFeedback = useRef(0)
  const [showFeedback, setShowFeedback] = useState(false)
  const dispatch: Dispatch<OfficeAction> = (a) => {
    if (a.type !== "DISMISS_NOTICE" && a.type !== "SELECT") playSound("click")
    rawDispatch(a)
  }
  const deskDispatch: Dispatch<Action> = (a) => {
    if (a.type === "INSPECT") setDialog(null)
    dispatch(a)
  }
  useEffect(() => {
    try {
      const value = migrateOfficeSave(JSON.parse(localStorage.getItem(SAVE_KEY) || localStorage.getItem("scranton-office-v2") || "null"))
      if (validSave(value) && value.mode !== "welcome") setSaved(value)
    } catch {
      setStorageError(true)
    }
    setReady(true)
  }, [])
  useEffect(() => {
    if (!ready || s.mode === "welcome") return
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(s))
    } catch {
      setStorageError(true)
    }
  }, [s, ready])
  useEffect(() => {
    if (!s.feedback || s.feedback.id === lastFeedback.current) return
    lastFeedback.current = s.feedback.id
    playSound(s.feedback.jobSecurity < 0 ? "error" : "success")
    setShowFeedback(true)
    const timeout = setTimeout(() => setShowFeedback(false), 5000)
    return () => clearTimeout(timeout)
  }, [s.feedback])
  useEffect(() => {
    if (s.activeEvent) {
      setDialog(null)
      playSound("alarm")
    }
  }, [s.activeEvent?.id])
  useEffect(() => {
    document.body.classList.add("office-immersive-theme")
    return () => document.body.classList.remove("office-immersive-theme")
  }, [])
  const live = s.mode === "playing" && !s.activeEvent && !s.interaction
  const e = employeeById(s.selected)
  const p = s.people[e.id]
  const event = activeEvent(s)
  const workers = Object.values(s.people).filter((p) => p.job).length
  const completed = Object.values(s.people).reduce(
    (total, p) => total + p.completed,
    0
  )
  const morale = Math.round(
    Object.values(s.people).reduce((sum, p) => sum + p.mood, 0) / employees.length
  )
  function select(id: string) {
    setDialog(null)
    dispatch({ type: "SELECT", id })
    setPanel("employee")
    setReply(null)
    playSound("open")
    locate(id)
  }
  function locate(id: string) {
    setDialog(null)
    setFocus(id)
    setFocusSerial((v) => v + 1)
  }
  function station(id: string) {
    if (!live) return
    const st = stations.find((st) => st.id === id)
    if (!st) return
    setFocus(`station:${id}`)
    setFocusSerial(v => v + 1)
    playSound("open")
    if (id === "computer") {
      setApp("Mail")
      setDialog("computer")
    } else if (id === "phone") {
      setApp("Phone")
      setDialog("computer")
    } else dispatch({ type: "INSPECT", kind: st.kind as InteractionKind })
  }
  function toggleSound() {
    enableSound(!s.sound)
    rawDispatch({ type: "SOUND" })
    if (!s.sound) playSound("open")
  }
  const filtered = employees
    .filter(
      (e) =>
        (department === "all" || e.department === department) &&
        `${e.name} ${e.role}`.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) =>
      sort === "trust"
        ? s.people[b.id].trust - s.people[a.id].trust
        : sort === "status"
          ? Number(!!s.people[b.id].job) - Number(!!s.people[a.id].job)
          : a.name.localeCompare(b.name)
    )
  const nextMeeting = meetings.find((m) => s.meetingStatus[m.id] === "pending")
  function openPanel(value: string) {
    setPanel(value)
    setDialog("directory")
    playSound("open")
  }
  function openApp(value: AppId) {
    setApp(value)
    setDialog("computer")
    playSound("open")
  }
  return (
    <main className="scranton-app immersive-office">
      <div className="immersive-scene">
        <Scene
          state={s}
          onSelect={select}
          onStation={station}
          onNavigation={setNavigation}
          focus={focus}
          focusSerial={focusSerial}
          paused={!live || !!dialog}
        />
      </div>
      <header className="office-hud-wrap">
        <Card font="normal" className="gap-0 py-0">
          <div className="office-hud">
            <h1 className="retro">
              OFFICE SURVIVAL<span>1999</span>
            </h1>
            <div className="office-meters">
              {(
                [
                  { key: "energy", label: "ENERGY", tone: "bg-energy" },
                  { key: "patience", label: "PATIENCE", tone: "bg-patience" },
                  {
                    key: "jobSecurity",
                    label: "SECURITY",
                    tone: "bg-security",
                  },
                ] as const
              ).map((stat) => (
                <div className="office-meter" key={stat.key}>
                  <div className="retro">
                    <span>{stat.label}</span>
                    <b key={s[stat.key]}>{s[stat.key]}</b>
                  </div>
                  <Progress
                    variant="retro"
                    value={s[stat.key]}
                    className="h-3"
                    progressBg={
                      s[stat.key] <= 20 ? "bg-destructive" : stat.tone
                    }
                    aria-label={stat.label}
                  />
                </div>
              ))}
            </div>
            <div className="office-time">
              <strong className="retro">{formatTime(s.time)}</strong>
              <div className="office-manager">
                <Portrait employee={employeeById("michael")} small />
                <span className="retro">
                  MANAGER: {managerState(s.suspicion).toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </Card>
      </header>
      <nav className="office-toolbar" aria-label="Office controls">
        <Button variant="outline" size="sm" onClick={() => openPanel("team")}>
          <Users /> Team <span className="office-nav-count">{employees.length}</span>
        </Button>
        <Button variant="outline" size="sm" onClick={() => openPanel("work")}>
          <ClipboardList /> Work{" "}
          <span className="office-nav-count">{workers}</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setDialog("stations")}
        >
          <Coffee /> Office
        </Button>
        <Button
          variant="outline"
          size="icon"
          aria-label={s.sound ? "Mute sounds" : "Enable sounds"}
          onClick={toggleSound}
        >
          {s.sound ? <Volume2 /> : <VolumeX />}
        </Button>
        <Button
          variant="outline"
          size="icon"
          aria-label="How to play"
          onClick={() => setDialog("help")}
        >
          <HelpCircle />
        </Button>
        <Button
          variant="outline"
          size="icon"
          aria-label="Restart shift"
          onClick={() => setDialog("restart")}
        >
          <RotateCcw />
        </Button>
      </nav>
      {s.mode === "welcome" && (
        <div className="office-welcome-wrap">
          <Card font="normal" className="gap-0 py-0">
            <div className="office-welcome">
              <h2 className="retro">MONDAY. SCRANTON.</h2>
              <p>
                10 coworkers. One branch report. Make it to 5 PM.
                <br />
                Click a coworker to talk or give them real work.
              </p>
              <div>
                {saved && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      rawDispatch({ type: "RESTORE", state: saved })
                      setSaved(null)
                    }}
                  >
                    Resume shift
                  </Button>
                )}
                <Button
                  onClick={() => {
                    dispatch({ type: "START", seed: Date.now() % 1000000 })
                    setSaved(null)
                  }}
                >
                  Clock in <ArrowUpRight />
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
      <aside className="office-today-wrap" aria-label="Today's tasks">
        <Card font="normal" className="gap-0 py-0">
          <div className="office-today">
            <h2 className="office-pixel-heading retro">TODAY</h2>
            <Button
              font="normal"
              variant="ghost"
              onClick={() => openApp("Tasks")}
            >
              <span className="office-check">
                {s.taskStatus.t2 === "done" ? <Check /> : null}
              </span>
              <b>Q3 report</b>
              <time>12:10 PM</time>
            </Button>
            <Button
              font="normal"
              variant="ghost"
              onClick={() => openApp("Calendar")}
            >
              <span className="office-check" />
              <b>{nextMeeting?.title ?? "Meetings finished"}</b>
              <time>{nextMeeting ? formatTime(nextMeeting.at) : "✓"}</time>
            </Button>
            <Button
              font="normal"
              variant="ghost"
              onClick={() => openPanel("work")}
              className="office-branch-goal"
            >
              <span className="office-check">
                {s.completedDepartments.length === departments.length ? <Check /> : null}
              </span>
              <b>Branch report</b>
              <time>{s.completedDepartments.length}/{departments.length}</time>
            </Button>
          </div>
        </Card>
      </aside>
      <aside className="office-person-wrap" aria-label="Selected coworker">
        <Card font="normal" className="gap-0 py-0">
          <div className="office-person">
            <div className="office-pixel-heading">
              <h2 className="retro">{e.name.toUpperCase()}</h2>
              <Button
                font="normal"
                size="sm"
                variant="ghost"
                aria-label={`Open ${e.name} employee details`}
                onClick={() => openPanel("employee")}
              >
                FILE ↗
              </Button>
            </div>
            <div className="office-person-body">
              <Portrait employee={e} />
              <div>
                <span className="office-person-role">
                  {e.department} · {p.job ? "Working" : "Available"}
                </span>
                <p key={e.id}>“{p.job ? e.response : e.greeting}”</p>
              </div>
            </div>
            {!p.job && <div className="office-assignment-preview"><span>{e.task}</span><small>{e.duration} min · Choose Assign task to start</small></div>}
            {p.job && (
              <div className="office-task-progress">
                <span>
                  {p.job.title}
                  <b>{Math.round((p.job.progress / p.job.duration) * 100)}%</b>
                </span>
                <Progress
                  value={(p.job.progress / p.job.duration) * 100}
                  variant="retro"
                  className="h-2"
                />
                <div className="office-task-help">
                  <Button
                    font="normal"
                    variant="ghost"
                    size="sm"
                    disabled={!live}
                    onClick={() =>
                      dispatch({ type: "PERSON", id: e.id, kind: "help" })
                    }
                  >
                    Help · 8 min
                  </Button>
                  <small>
                    {Math.ceil((p.job.duration - p.job.progress) / workRate(p))}{" "}
                    min left
                  </small>
                </div>
              </div>
            )}
            <div className="office-person-buttons">
              <Button
                disabled={!live || !!p.job}
                title={p.job ? "This coworker is already working. Advance time or choose Help." : e.task}
                onClick={() =>
                  dispatch({ type: "PERSON", id: e.id, kind: "assign" })
                }
              >
                {p.job ? "WORKING" : "ASSIGN TASK"}
              </Button>
              <Button
                variant="outline"
                disabled={!live}
                onClick={() => {
                  setReply(null)
                  setDialog("talk")
                }}
              >
                TALK
              </Button>
            </div>
          </div>
        </Card>
      </aside>
      {s.mode === "playing" && (
        <div className="office-advance">
          <Button
            size="sm"
            disabled={!live}
            onClick={() => dispatch({ type: "SHIFT", minutes: 15 })}
          >
            <Clock3 /> Advance 15 min
          </Button>
          <span>
            {workers} working · {completed} delivered
          </span>
        </div>
      )}
      {s.feedback && showFeedback && (
        <div className="office-feedback" aria-live="polite" key={s.feedback.id}>
          <span>{actualNames(s.feedback.text)}</span>
          <Button
            font="normal"
            variant="ghost"
            size="sm"
            onClick={() => setDialog("history")}
          >
            Activity ↗
          </Button>
        </div>
      )}
      <footer className="office-footer-wrap">
        <Card font="normal" className="gap-0 py-0">
          <div className="office-footer">
            <span aria-live="polite">{navigation}</span>
            <small>
              {storageError
                ? "Save unavailable"
                : s.mode === "welcome"
                  ? "8BITCN · SCRANTON"
                  : "SHIFT AUTOSAVED"}
            </small>
          </div>
        </Card>
      </footer>
      <Dialog
        open={dialog === "directory" && !event}
        onOpenChange={(open) => {
          if (!open) setDialog(null)
        }}
      >
        <DialogContent
          font="normal"
          className="scranton-dialog office-directory-dialog"
        >
          <DialogTitle className="office-directory-title">
            EMPLOYEE DIRECTORY
          </DialogTitle>
          <DialogDescription className="sr-only">
            All 10 coworkers, their assignments and relationships.
          </DialogDescription>
          <div className="scranton-sidebar">
            <Card font="normal" className="gap-0 py-0">
              <Tabs
                font="normal"
                value={panel}
                onValueChange={(v) => setPanel(String(v))}
              >
                <TabsList className="scranton-panel-tabs">
                  <TabsTrigger value="employee">
                    <MessageSquare />
                    PERSON
                  </TabsTrigger>
                  <TabsTrigger value="team">
                    <Users />
                    TEAM
                  </TabsTrigger>
                  <TabsTrigger value="work">
                    <ClipboardList />
                    WORK
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="employee" className="scranton-person-panel">
                  <div className="scranton-person-top">
                    <span className="scranton-kicker">
                      EMPLOYEE FILE /{" "}
                      {String(employees.indexOf(e) + 1).padStart(2, "0")}
                    </span>
                    <Badge variant={p.job ? "default" : "secondary"}>
                      {p.job ? "WORKING" : "AVAILABLE"}
                    </Badge>
                  </div>
                  <div className="scranton-person-heading">
                    <Portrait employee={e} />
                    <div>
                      <h2 className="retro">{e.name}</h2>
                      <p>{e.role}</p>
                      <span>
                        <MapPin />
                        {e.room}
                      </span>
                    </div>
                  </div>
                  <div className="scranton-quote">“{e.greeting}”</div>
                  <div className="scranton-relationship">
                    <div>
                      <span>TRUST</span>
                      <b>{p.trust}/100</b>
                    </div>
                    <Progress
                      value={p.trust}
                      variant="retro"
                      className="h-2"
                      aria-label={`${e.name} trust`}
                    />
                    <div>
                      <span>MOOD</span>
                      <b>
                        {p.mood >= 65
                          ? "Content"
                          : p.mood >= 35
                            ? "Distracted"
                            : "Frustrated"}{" "}
                        · {p.mood}
                      </b>
                    </div>
                  </div>
                  <div className="scranton-current-task">
                    <span className="scranton-kicker">
                      {p.job ? "CURRENT ASSIGNMENT" : "READY TO ASSIGN"}
                    </span>
                    <h3>{p.job?.title ?? e.task}</h3>
                    {p.job ? (
                      <>
                        <Progress
                          value={(p.job.progress / p.job.duration) * 100}
                          variant="retro"
                          className="h-2"
                          aria-label={`${e.name} task progress`}
                        />
                        <p>
                          {Math.round((p.job.progress / p.job.duration) * 100)}%
                          complete · approximately{" "}
                          {Math.ceil(
                            (p.job.duration - p.job.progress) / workRate(p)
                          )}{" "}
                          office minutes left
                        </p>
                      </>
                    ) : (
                      <p>
                        {e.duration + p.completed * 10} office minutes · gains
                        job security when delivered
                      </p>
                    )}
                  </div>
                  <div className="scranton-person-actions">
                    <Button
                      disabled={!live || !!p.job}
                      onClick={() =>
                        dispatch({ type: "PERSON", id: e.id, kind: "assign" })
                      }
                    >
                      <ClipboardList />
                      {p.job ? "Assignment in progress" : "Assign work · 5 min"}
                    </Button>
                    <div>
                      <Button
                        variant="outline"
                        disabled={!live}
                        onClick={() => {
                          setReply(null)
                          setDialog("talk")
                        }}
                      >
                        <MessageSquare />
                        Talk
                      </Button>
                      <Button
                        variant="outline"
                        disabled={!live || !p.job}
                        onClick={() =>
                          dispatch({ type: "PERSON", id: e.id, kind: "help" })
                        }
                      >
                        <Zap />
                        Help · 8m
                      </Button>
                    </div>
                    <div>
                      <Button
                        font="normal"
                        variant="ghost"
                        disabled={!live || !p.job}
                        onClick={() =>
                          dispatch({
                            type: "PERSON",
                            id: e.id,
                            kind: "interrupt",
                          })
                        }
                      >
                        Interrupt · trust −8
                      </Button>
                      <Button
                        font="normal"
                        variant="ghost"
                        onClick={() => locate(e.id)}
                      >
                        Find in office <ArrowUpRight />
                      </Button>
                    </div>
                  </div>
                  <div className="scranton-memory">
                    <span className="scranton-kicker">THEY REMEMBER</span>
                    <p>{p.memory}</p>
                    <span>
                      {p.completed} delivered · {p.helped} helped · {p.talks}{" "}
                      conversations
                    </span>
                  </div>
                </TabsContent>
                <TabsContent value="team" className="scranton-directory">
                  <div className="scranton-section-heading">
                    <h2 className="retro">THE WHOLE TEAM</h2>
                    <Badge variant="secondary">{employees.length}</Badge>
                  </div>
                  <label htmlFor="team-search" className="scranton-kicker">
                    FIND AN EMPLOYEE
                  </label>
                  <Input
                    id="team-search"
                    font="normal"
                    value={search}
                    onChange={(ev) => setSearch(ev.target.value)}
                    placeholder="Name or role…"
                  />
                  <div className="scranton-directory-filters">
                    <Select
                      value={department}
                      onValueChange={(v) => setDepartment(String(v))}
                    >
                      <SelectTrigger
                        font="normal"
                        aria-label="Filter employees by department"
                      >
                        <SelectValue>
                          {department === "all"
                            ? "All departments"
                            : department}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent font="normal">
                        <SelectItem value="all">All departments</SelectItem>
                        {departments.map((d) => (
                          <SelectItem key={d} value={d}>
                            {d}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={sort}
                      onValueChange={(v) => setSort(String(v))}
                    >
                      <SelectTrigger font="normal" aria-label="Sort employees">
                        <SelectValue>
                          {sort === "name"
                            ? "A → Z"
                            : sort === "trust"
                              ? "Trust"
                              : "Working first"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent font="normal">
                        <SelectItem value="name">A → Z</SelectItem>
                        <SelectItem value="trust">Trust</SelectItem>
                        <SelectItem value="status">Working first</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="scranton-team-list">
                    {filtered.map((e) => (
                      <Button
                        font="normal"
                        variant="ghost"
                        key={e.id}
                        className="scranton-team-row"
                        onClick={() => {
                          select(e.id)
                        }}
                      >
                        <Portrait employee={e} small />
                        <span>
                          <b>{e.name}</b>
                          <small>
                            {e.department} ·{" "}
                            {s.people[e.id].job
                              ? "Working"
                              : s.people[e.id].completed
                                ? "Delivered"
                                : "Available"}
                          </small>
                        </span>
                        <ArrowUpRight />
                      </Button>
                    ))}
                    {!filtered.length && (
                      <p className="scranton-empty">
                        No employees match this search.
                      </p>
                    )}
                  </div>
                  <p className="scranton-directory-count">
                    {filtered.length} employees · select anyone to interact
                  </p>
                </TabsContent>
                <TabsContent value="work" className="scranton-work-panel">
                  <div className="scranton-section-heading">
                    <h2 className="retro">ASSIGNMENTS</h2>
                    <Badge variant="secondary">{workers} ACTIVE</Badge>
                  </div>
                  <p>
                    Work progresses whenever office time advances. Trusted
                    employees work faster; frustrated employees slow down.
                  </p>
                  <div className="scranton-work-list">
                    {employees
                      .filter((e) => s.people[e.id].job)
                      .map((e) => {
                        const job = s.people[e.id].job!
                        return (
                          <div key={e.id}>
                            <div>
                              <b>{e.name}</b>
                              <Button
                                font="normal"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  select(e.id)
                                  locate(e.id)
                                }}
                              >
                                Open <ArrowUpRight />
                              </Button>
                            </div>
                            <p>{job.title}</p>
                            <Progress
                              value={(job.progress / job.duration) * 100}
                              variant="retro"
                              className="h-2"
                            />
                            <small>
                              {Math.round((job.progress / job.duration) * 100)}%
                              ·{" "}
                              {Math.ceil(
                                (job.duration - job.progress) /
                                  workRate(s.people[e.id])
                              )}{" "}
                              min remaining
                            </small>
                          </div>
                        )
                      })}
                    {!workers && (
                      <div className="scranton-empty">
                        <ClipboardList />
                        <p>No active assignments.</p>
                        <Button
                          variant="outline"
                          onClick={() => setPanel("team")}
                        >
                          Choose an employee
                        </Button>
                      </div>
                    )}
                  </div>
                  <div className="scranton-delivery-summary">
                    <b>{completed} assignments delivered</b>
                    <span>
                      {s.completedDepartments.length} of 5 departments
                      represented
                    </span>
                  </div>
                </TabsContent>
              </Tabs>
            </Card>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog
        open={dialog === "stations" && !event}
        onOpenChange={(open) => {
          if (!open) setDialog(null)
        }}
      >
        <DialogContent font="normal" className="scranton-dialog">
          <DialogTitle>AROUND THE OFFICE</DialogTitle>
          <DialogDescription>
            Every station has a playable interaction. You can also click it in
            the office.
          </DialogDescription>
          <div className="office-station-grid">
            {stations
              .filter((st) => st.id !== "clock")
              .map((st) => (
                <Button
                  key={st.id}
                  font="normal"
                  variant="outline"
                  disabled={!live}
                  onClick={() => {
                    setDialog(null)
                    station(st.id)
                  }}
                >
                  <b>{st.name}</b>
                  <span>{st.description}</span>
                </Button>
              ))}
          </div>
        </DialogContent>
      </Dialog>
      <DeskInteraction s={s} dispatch={deskDispatch} />
      <Dialog
        open={dialog === "talk" && !event}
        onOpenChange={(open) => {
          if (!open) setDialog(null)
        }}
      >
        <DialogContent font="normal" className="scranton-dialog">
          <div className="scranton-person-heading">
            <Portrait employee={e} />
            <div>
              <DialogTitle>{e.name}</DialogTitle>
              <DialogDescription>
                {e.role} · a conversation takes office time
              </DialogDescription>
            </div>
          </div>
          <blockquote className="scranton-talk-answer" aria-live="polite">
            “{reply ?? e.greeting}”
          </blockquote>
          <div className="scranton-talk-options">
            {[
              { label: "Ask how they're doing", time: 4, answer: e.greeting },
              { label: "Ask for work advice", time: 4, answer: e.advice },
              {
                label: e.hobby,
                time: 8,
                answer: `That was a nice change of pace. ${e.advice}`,
              },
            ].map((choice, i) => (
              <Button
                font="normal"
                variant="outline"
                key={i}
                disabled={!live}
                onClick={() => {
                  dispatch({ type: "PERSON", id: e.id, kind: "talk", topic: i })
                  setReply(choice.answer)
                }}
              >
                {choice.label}
                <span>
                  {choice.time} min · trust +{p.talks < 3 ? 5 : 1}
                </span>
              </Button>
            ))}
          </div>
          <p>
            Listening builds trust. The first three conversations also restore
            patience; repeated chatting has smaller benefits.
          </p>
          <Button onClick={() => setDialog(null)}>Back to the office</Button>
        </DialogContent>
      </Dialog>
      <Dialog
        open={dialog === "computer" && !event && !s.interaction}
        onOpenChange={(open) => {
          if (!open) setDialog(null)
        }}
      >
        <DialogContent font="normal" className="scranton-computer-dialog">
          <DialogTitle>WORKSTATION 042</DialogTitle>
          <DialogDescription>
            DunderOS 99 · {formatTime(s.time)} · actions take office time
          </DialogDescription>
          <div className="scranton-computer-tabs">
            {(
              [
                "Mail",
                "Calendar",
                "Tasks",
                "Solitaire",
                "Internet",
                "Recycle Bin",
                "Drawer",
                "Phone",
              ] as AppId[]
            ).map((id) => (
              <Button
                font="normal"
                size="sm"
                variant={app === id ? "default" : "outline"}
                key={id}
                onClick={() => {
                  setApp(id)
                  playSound("open")
                }}
              >
                {id}
              </Button>
            ))}
          </div>
          <div className="window-body mono">
            <AppContent app={app} s={s} dispatch={deskDispatch} />
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={!!event && s.mode === "playing"} onOpenChange={() => {}}>
        <DialogContent font="normal" className="scranton-dialog event-dialog">
          <Badge variant="secondary">
            {event?.category.toUpperCase()} · DECISION REQUIRED
          </Badge>
          <DialogTitle>{event?.title && actualNames(event.title)}</DialogTitle>
          <DialogDescription>
            {event?.body && actualNames(event.body)}
          </DialogDescription>
          <div className="scranton-event-choices">
            {event?.choices.map((c, i) => (
              <Button
                font="normal"
                variant="outline"
                key={i}
                onClick={() =>
                  dispatch({ type: "DO", kind: "choose", index: i })
                }
              >
                <b>{actualNames(c.label)}</b>
                <span>
                  {c.effect.minutes ?? 0} min · Energy {signed(c.effect.energy)}{" "}
                  · Patience {signed(c.effect.patience)} · Security{" "}
                  {signed(c.effect.jobSecurity)}
                </span>
                {c.risk && (
                  <small>
                    {Math.round(c.risk.probability * 100)}% risk:{" "}
                    {actualNames(c.risk.result)}
                  </small>
                )}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
      <Dialog
        open={dialog === "help"}
        onOpenChange={(open) => {
          if (!open) setDialog(null)
        }}
      >
        <DialogContent font="normal" className="scranton-dialog">
          <DialogTitle>YOUR FIRST DAY</DialogTitle>
          <DialogDescription>
            A small office simulation with real decisions.
          </DialogDescription>
          <ol className="scranton-help">
            <li>
              <b>Meet everyone.</b> Click a character in the 3D office or choose
              them from Team. All 10 employees have conversations and
              assignments.
            </li>
            <li>
              <b>Deliver the branch report.</b> Assign at least one task in each
              of the four departments. Helping adds progress and trust;
              interruptions reduce both.
            </li>
            <li>
              <b>Keep time moving.</b> Conversations, station activities and
              coordinating work advance the clock and every active assignment.
              Time never runs while you&apos;re deciding.
            </li>
            <li>
              <b>Look after yourself.</b> Coffee, lunch, plants and breaks
              restore resources. Complete work and respond to deadlines to
              protect job security.
            </li>
            <li>
              <b>Explore.</b> Click a coworker to approach them using a clear route,
              or click an office object to interact. Drag to look around, use the
              rotate buttons for a full turn, and scroll to zoom. Click the floor
              to walk; arrow keys move your character when the scene is focused.
            </li>
            <li>
              <b>Expect coworkers.</b> Meetings, pranks and team dependencies
              change progress. Office Pulse records the consequences. Sound is
              optional; progress saves in this browser.
            </li>
          </ol>
          <p>
            Characters from different seasons share this fictional workday. The
            UI uses actual 8bitcn components; the custom voxel scene matches its
            pixel art direction.
          </p>
          <Button onClick={() => setDialog(null)}>Got it</Button>
        </DialogContent>
      </Dialog>
      <Dialog
        open={dialog === "history"}
        onOpenChange={(open) => {
          if (!open) setDialog(null)
        }}
      >
        <DialogContent font="normal" className="scranton-dialog">
          <DialogTitle>OFFICE ACTIVITY</DialogTitle>
          <DialogDescription>
            Assignments, decisions, and what happened next.
          </DialogDescription>
          <div className="scranton-history">
            {[
              ...s.history.map((n) => ({ ...n, text: actualNames(n.text) })),
              ...s.officeNews,
            ]
              .sort((a, b) => b.time - a.time)
              .map((n, i) => (
                <p key={i}>
                  <time>{formatTime(n.time)}</time>
                  <span>{n.text}</span>
                </p>
              ))}
          </div>
        </DialogContent>
      </Dialog>
      <Dialog
        open={dialog === "restart"}
        onOpenChange={(open) => {
          if (!open) setDialog(null)
        }}
      >
        <DialogContent font="normal" className="scranton-dialog">
          <DialogTitle>START A NEW SHIFT?</DialogTitle>
          <DialogDescription>
            This replaces the saved workday, assignments and relationships in
            this browser.
          </DialogDescription>
          <div className="scranton-dialog-actions">
            <Button variant="outline" onClick={() => setDialog(null)}>
              Keep this shift
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                dispatch({
                  type: "RESTART_CONFIRM",
                  seed: Date.now() % 1000000,
                })
                setDialog(null)
              }}
            >
              Start at 9 AM
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={s.mode === "ended"} onOpenChange={() => {}}>
        <DialogContent font="normal" className="scranton-dialog event-dialog">
          <Badge>SHIFT COMPLETE · {formatTime(s.time)}</Badge>
          <DialogTitle>
            {s.ending ? endings[s.ending][0] : "The branch is closed"}
          </DialogTitle>
          <DialogDescription>
            {s.ending ? endings[s.ending][1] : "Everyone has gone home."}
          </DialogDescription>
          <div className="scranton-results">
            <div>
              <b>{completed}</b>
              <span>team deliveries</span>
            </div>
            <div>
              <b>{s.completedDepartments.length}/{departments.length}</b>
              <span>departments delivered</span>
            </div>
            <div>
              <b>{s.coworkersHelped}</b>
              <span>times you helped</span>
            </div>
            <div>
              <b>{morale}%</b>
              <span>team morale</span>
            </div>
          </div>
          <p>
            {s.completedDepartments.length === departments.length
              ? "The branch report is complete. Every department contributed."
              : `The branch report still needs ${departments.filter((d) => !s.completedDepartments.includes(d)).join(", ")}.`}
          </p>
          <Button
            onClick={() =>
              dispatch({ type: "RESTART_CONFIRM", seed: Date.now() % 1000000 })
            }
          >
            Another Monday
          </Button>
        </DialogContent>
      </Dialog>
    </main>
  )
}
function signed(n = 0) {
  return `${n > 0 ? "+" : ""}${n}`
}
