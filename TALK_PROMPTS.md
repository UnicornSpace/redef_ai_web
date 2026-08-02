# /talk — Prompt → Tool Combinations

A reference for what the assistant in `/app/talk` can do today and what
tools each kind of user prompt should trigger. Read this as a spec:
each row is "this class of prompt → these tools get called → this data
comes back."

Domains available: **tasks · habits · challenges · calendar · deep work · finance · personalization/memory**

Every tool below already exists in `src/lib/ai-sdk-tools/` OR is queued
under **Missing** at the end of this file — filed as follow-ups so the
model can call them the moment they land.

---

## Reading key

- **User says →** something a real user would type (paraphrased).
- **Tool(s) →** the tool the model should call. Multi-tool rows chain them.
- **Args →** the concrete parameter values the tool should receive.
- **Returns →** what the tool gives back for the model to phrase.

---

## Tasks

| User says | Tool(s) | Args | Returns |
| --- | --- | --- | --- |
| "What are my tasks for today?" | `getTasks` | `{ isCompleted: false }` | Open task list grouped by category |
| "What have I finished today?" | `getTasks` | `{ isCompleted: true }` | Completed task list |
| "Add a task: call Ahmed at 5pm" | `addNewTask` | `{ name: "Call Ahmed at 5pm" }` | New task id + confirmation |
| "Add 'Buy groceries' due tomorrow" | `addNewTask` | `{ name: "Buy groceries", dueDate: "<tomorrow ISO>" }` | New task id | *[Missing: dueDate arg]* |
| "Mark 'buy groceries' as done" | `getTasks` → `markTaskAsCompleted` | 1) `{ isCompleted: false }` to find id, 2) `{ taskId }` | Completion confirmation |
| "What am I supposed to do this week?" | `getTasks` | `{ isCompleted: false }` + client-side week filter | Weekly plan |

## Habits

| User says | Tool(s) | Args | Returns |
| --- | --- | --- | --- |
| "How are my habits going?" | `getHabits` *[Missing]* | `{}` | Every active habit + streak |
| "Did I do namaz today?" | `getHabits` *[Missing]* | `{ name: "namaz", date: "<today>" }` | Boolean |
| "Mark today's gym as done" | `getHabits` → `markHabitDate` *[Missing]* | 1) find gym habit id, 2) `{ habitId, date: "<today>" }` | Streak after toggle |
| "What was my longest streak on water?" | `getHabits` *[Missing]* | `{ name: "water" }` | Longest run |
| "Start a new habit: read 20 pages a day" | `addHabit` *[Missing]* | `{ name: "Read 20 pages", startedAt: "<today>" }` | New habit id |

## Deep work

| User says | Tool(s) | Args | Returns |
| --- | --- | --- | --- |
| "How much deep work have I done today?" | `pomodoroHours` | `{}` | Total focus hours today |
| "How much this week?" | `pomodoroHours` *[Missing: range arg]* | `{ range: "week" }` | Total focus hours this week |
| "Log 2h of deep work today on Redef" | `logDeepWork` *[Missing]* | `{ projectId?, durationMinutes: 120, occurredOn: "<today>" }` | Session id |
| "I worked from 2pm to 4pm on the Amazon migration" | `logDeepWork` *[Missing]* | `{ startTime, endTime, projectName: "Amazon migration" }` | Session id (auto-creates project if new) |
| "What have I worked on this week?" | `listDeepWorkSessions` *[Missing]* | `{ range: "week" }` | Sessions grouped by project |

## Calendar

| User says | Tool(s) | Args | Returns |
| --- | --- | --- | --- |
| "What's on my calendar this week?" | `getCalendarEvents` *[Missing]* | `{ from: "<mon>", to: "<sun>" }` | Tasks by due_date + habit checkmarks + deep work |
| "What's due today?" | `getTasks` | `{ isCompleted: false }` filtered by `due_date === today` | Today's due tasks |
| "What did I do on August 12?" | `getDaySummary` *[Missing]* | `{ date: "2026-08-12" }` | tasks/habits/deep-work/finance for that day |

## Personal finance

| User says | Tool(s) | Args | Returns |
| --- | --- | --- | --- |
| "I spent 300 on groceries today" | `addTransaction` *[Missing]* | `{ type: "expense", amount: 300, category: "Groceries", occurredOn: "<today>" }` | Transaction id |
| "I got my salary today" | `addTransaction` *[Missing]* | `{ type: "income", amount: <ask user>, category: "Salary" }` | Transaction id (may ask amount first) |
| "How much did I spend this month?" | `getFinanceSummary` *[Missing]* | `{ range: "month", type: "expense" }` | Total + top categories |
| "What's my net this month?" | `getFinanceSummary` *[Missing]* | `{ range: "month" }` | Income - expense + rolling burn |
| "Where did I spend the most on my Japan trip?" | `getFinanceSummary` *[Missing]* | `{ space: "Japan trip" }` | Space-scoped breakdown |

## Challenges

| User says | Tool(s) | Args | Returns |
| --- | --- | --- | --- |
| "What challenges am I in?" | `listChallenges` *[Missing]* | `{}` | Active challenges w/ your rank |
| "How am I doing in the gym challenge?" | `getChallenge` *[Missing]* | `{ name: "gym" }` | Leaderboard + your streak |
| "Mark today's gym for the challenge" | `getChallenge` → `markChallengeDate` *[Missing]* | 1) find id, 2) `{ challengeId, date: "<today>" }` | New rank |

## Memory / personalization

| User says | Tool(s) | Args | Returns |
| --- | --- | --- | --- |
| "Call me Faiz from now on" | `updateMemory` | `{ memorySummary: "<merged summary incl. 'prefers being called Faiz'>" }` | Confirmation |
| "Remember I'm allergic to peanuts" | `updateMemory` | `{ memorySummary: "<merged summary incl. peanut allergy>" }` | Confirmation |
| "I'm a software engineer" | `updateMemory` | `{ memorySummary: "<merged summary incl. profession>" }` | Confirmation |
| "What do you know about me?" | `getUserPreferences` *[Missing as a tool]* | `{}` | Reads the personalization+memory record |

---

## Cross-domain combinations (where /talk really shines)

These are the questions that unlock the product — they touch 2+ tools
in one turn.

| User says | Chain | Rationale |
| --- | --- | --- |
| "What should I focus on today?" | `getTasks({isCompleted:false})` + `getHabits()` *[Missing]* + `pomodoroHours()` | Combines open work + un-done habits + how much focus time is already spent to recommend a next block. |
| "How was my week?" | `getTasks({isCompleted:true})` + `getHabits()` + `pomodoroHours({range:"week"})` + `getFinanceSummary({range:"week"})` | Full weekly reflection. |
| "Am I keeping up with my habits and challenges?" | `getHabits()` + `listChallenges()` | Personal + social streaks in one answer. |
| "Log that I worked 3h on the finance app and add a task to write the release notes" | `logDeepWork()` + `addNewTask()` | Session + a follow-up todo in one turn. |
| "I bought a $60 book, log it and add 'read it in 2 weeks' as a task" | `addTransaction()` + `addNewTask()` | Money out + intention captured together. |
| "Move all today's un-done tasks to tomorrow" | `getTasks({isCompleted:false})` + repeated `updateTaskDueDate` *[Missing as a tool]* | Bulk reschedule. |

---

## Prompting rules the assistant should follow

1. **When the user gives a fuzzy time reference ("today", "this week", "yesterday"), always resolve it to an absolute date on the model side and pass the ISO string into the tool.** Never leave date arithmetic to the tool.
2. **When adding data, mirror it back in the user's words.** "Added *Buy groceries* for tomorrow" > "Task created."
3. **When something goes wrong (tool returns `{ error }`), surface it plainly** — don't hide it, and offer the smallest next action ("Want me to try again with less detail?").
4. **When learning a durable fact, call `updateMemory` — pass the FULL updated summary, not the delta.** The tool replaces, not appends.
5. **Only ask a clarifying question if the answer changes the tool arguments.** "What amount?" is worth asking; "which category?" usually isn't (default to a sensible bucket).
6. **Prefer chaining tools inside one turn over asking follow-up questions.** If the user says "mark 'buy groceries' as done", the model runs `getTasks` internally and then `markTaskAsCompleted` — it doesn't come back with "which one did you mean?" unless there really are multiple matches.

---

## Missing tools (follow-up work)

These are called out throughout the tables above as *[Missing]*. They
need to be added under `src/lib/ai-sdk-tools/` and registered in
`src/app/api/chat/route.ts`. Priorities are ordered by how often the
combinations above depend on them.

**High priority:**
- `getHabits` — list habits with today's status + current streak
- `markHabitDate` — toggle a date on a habit
- `addHabit` — create a habit
- `logDeepWork` — create a session from natural language (start/end OR duration)
- `addTransaction` — create an expense/income
- `getFinanceSummary` — month/week/space aggregations

**Medium priority:**
- `getCalendarEvents` — merged calendar across tasks/habits/deep-work
- `getDaySummary` — per-day cross-domain summary
- `updateTaskDueDate` — reschedule a task by natural language
- `pomodoroHours({range})` — extend the existing tool to accept a range arg

**Lower priority:**
- `listChallenges`, `getChallenge`, `markChallengeDate` — social/leaderboard interactions
- `getUserPreferences` — read-only counterpart to `updateMemory`, so the model can answer "what do you know about me"
