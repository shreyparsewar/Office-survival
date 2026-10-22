export type Department =
  "Management" | "Sales" | "Accounting" | "Operations" | "People"
export type Employee = {
  id: string
  name: string
  role: string
  department: Department
  room: string
  home: [number, number]
  skin: string
  hair: string
  shirt: string
  tie: string
  style?: "glasses" | "long" | "bald" | "beard"
  task: string
  duration: number
  greeting: string
  advice: string
  response: string
  hobby: string
}
// Ten central coworkers share one interactive office scene.
export const employees: Employee[] = [
  {
    id: "michael",
    name: "Michael Scott",
    role: "Regional manager",
    department: "Management",
    room: "Manager's office",
    home: [10.85, 4.35],
    skin: "#dcaa83",
    hair: "#3b2d24",
    shirt: "#eeeadb",
    tie: "#b26848",
    task: "Approve the branch budget",
    duration: 35,
    greeting:
      "A good manager makes everyone feel included. Especially the manager.",
    advice:
      "Let people finish their work before calling another meeting. I am learning this.",
    response: "Okay. A short meeting. With a very long introduction.",
    hobby: "Plan a tiny office celebration",
  },
  {
    id: "dwight",
    name: "Dwight Schrute",
    role: "Sales · assistant to the regional manager",
    department: "Sales",
    room: "Bullpen",
    home: [7, 8],
    skin: "#e1b991",
    hair: "#775731",
    shirt: "#c4b351",
    tie: "#67412c",
    style: "glasses",
    task: "Verify the client inventory",
    duration: 40,
    greeting:
      "I have already assessed the exits. Now we can assess the inventory.",
    advice:
      "Double-check the counts. A discrepancy is an invitation to disaster.",
    response:
      "I accept. I will require a clipboard and absolutely no interference from Jim.",
    hobby: "Inspect the office safety kit",
  },
  {
    id: "jim",
    name: "Jim Halpert",
    role: "Sales representative",
    department: "Sales",
    room: "Bullpen",
    home: [3, 7],
    skin: "#e7b88f",
    hair: "#5b4030",
    shirt: "#d4e5e4",
    tie: "#35475f",
    task: "Renew the Henderson account",
    duration: 45,
    greeting:
      "The trick is making the calls before Dwight starts his safety inspection.",
    advice:
      "Give clients one clear offer. Then actually listen to their answer.",
    response: "Sure. I'll make the call. The prank can wait until after lunch.",
    hobby: "Set up a harmless desk prank",
  },
  {
    id: "pam",
    name: "Pam Beesly",
    role: "Reception · office administrator",
    department: "Operations",
    room: "Reception",
    home: [14, 7],
    skin: "#efc3a1",
    hair: "#ab7851",
    shirt: "#c6a2ae",
    tie: "#ece2ca",
    style: "long",
    task: "Organize the visitor schedule",
    duration: 30,
    greeting:
      "I've got the phone, the calendar, and about six sticky notes. What do you need?",
    advice:
      "Write down who's responsible. Otherwise every request ends up at reception.",
    response: "I can do that. Thank you for giving me an actual brief.",
    hobby: "Sketch the conference room",
  },
  {
    id: "ryan",
    name: "Ryan Howard",
    role: "Temp · business development",
    department: "Operations",
    room: "Annex",
    home: [14, 12],
    skin: "#dbaf89",
    hair: "#302b25",
    shirt: "#b9b7b0",
    tie: "#713f45",
    task: "Clean the customer database",
    duration: 55,
    greeting: "I think this could be a platform. For now, it's a spreadsheet.",
    advice:
      "Start with the duplicate records. We don't need to reinvent the whole company.",
    response: "I'll handle it. Can we call this a pilot?",
    hobby: "Draft an unnecessarily ambitious pitch",
  },
  {
    id: "andy",
    name: "Andy Bernard",
    role: "Sales representative",
    department: "Sales",
    room: "Bullpen",
    home: [3.7, 4.3],
    skin: "#efbb94",
    hair: "#9a7048",
    shirt: "#b9c9b8",
    tie: "#a15953",
    task: "Prepare the client presentation",
    duration: 50,
    greeting: "Presentation ready. Vocal warm-up also ready, if that helps.",
    advice: "Rehearse the pitch once. Preferably without the harmony track.",
    response: "Consider it done. One tasteful flourish, maximum.",
    hobby: "Rehearse a sales jingle",
  },
  {
    id: "stanley",
    name: "Stanley Hudson",
    role: "Sales representative",
    department: "Sales",
    room: "Bullpen",
    home: [3, 11],
    skin: "#895a3e",
    hair: "#342a24",
    shirt: "#ada291",
    tie: "#725140",
    style: "bald",
    task: "Close the monthly renewals",
    duration: 40,
    greeting: "Give me the account list and let me get on with it.",
    advice:
      "A clear deadline and a quiet desk. That's the whole productivity strategy.",
    response: "Fine. No meeting about the meeting afterward.",
    hobby: "Finish the crossword",
  },
  {
    id: "kevin",
    name: "Kevin Malone",
    role: "Accountant",
    department: "Accounting",
    room: "Accounting",
    home: [7, 11.5],
    skin: "#e0ac8a",
    hair: "#62452f",
    shirt: "#8b9a90",
    tie: "#895b43",
    style: "bald",
    task: "Reconcile the expense receipts",
    duration: 60,
    greeting: "I sorted the receipts. The food ones are together. Obviously.",
    advice: "Check the totals with Oscar before sending them to Angela.",
    response: "Okay. I'm going to use the calculator for this one.",
    hobby: "Share the lunch menu",
  },
  {
    id: "angela",
    name: "Angela Martin",
    role: "Senior accountant",
    department: "Accounting",
    room: "Accounting",
    home: [11, 11.5],
    skin: "#e8c09e",
    hair: "#d2b176",
    shirt: "#b8baa6",
    tie: "#6c7072",
    style: "long",
    task: "Audit the quarterly ledger",
    duration: 45,
    greeting: "There is a filing order. It exists for a reason.",
    advice:
      "Attach the receipt, check the total, and do not decorate the ledger.",
    response: "I will do it properly. Please keep the desk clear.",
    hobby: "Organize the party budget",
  },
  {
    id: "oscar",
    name: "Oscar Martinez",
    role: "Accountant",
    department: "Accounting",
    room: "Accounting",
    home: [11, 8],
    skin: "#c69772",
    hair: "#2d2e28",
    shirt: "#a7bbc2",
    tie: "#745359",
    task: "Check the branch forecast",
    duration: 35,
    greeting:
      "We should probably look at the actual numbers before discussing the forecast.",
    advice:
      "Check the assumptions as well as the arithmetic. Both can be wrong.",
    response: "I'll verify the figures and leave a clear explanation.",
    hobby: "Explain the budget over coffee",
  },
]
export const departments: Department[] = [
  "Management",
  "Sales",
  "Accounting",
  "Operations",
]
export const employeeById = (id: string) => employees.find((e) => e.id === id)!
