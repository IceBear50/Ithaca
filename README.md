# Ithaca

> **The journey to the person you're becoming.**

Ithaca is an **AI-powered personal operating system** designed to help people turn long-term goals into meaningful daily actions.

Instead of functioning as another to-do list, Ithaca connects a user's **long-term destination, daily tasks, behavior, reflection, and future possibilities** into one adaptive system.

The core idea is simple:

> You define where you want to go. Ithaca helps you understand where you are, decide what to do next, and continuously adapt the journey.

---

## Why Ithaca?

Most productivity applications focus on completing tasks.

Ithaca focuses on something deeper:

**Are your daily actions actually moving you toward the person you want to become?**

A user may have goals such as:

* Become a better software engineer
* Prepare for placements
* Build a startup
* Learn a new skill
* Improve physical fitness
* Develop a consistent meditation practice

But long-term goals often fail because they are disconnected from everyday behavior.

Ithaca creates a continuous loop between **vision → action → reflection → adaptation**.

```text
Long-Term Goals
      ↓
Daily Planning
      ↓
Actual Behavior
      ↓
Reflection
      ↓
AI Analysis
      ↓
Adaptive Planning
      ↓
Long-Term Goals
```

---

# Core Concept

The name **Ithaca** comes from Homer's *Odyssey*.

Ithaca represents the destination that gives the journey meaning.

In the same way, Ithaca treats a user's long-term aspirations as their **destination**, while helping them navigate the everyday journey toward it.

---

# Core Experience

Ithaca is organized around several interconnected concepts.

## 1. Ithaca

Your long-term destination.

Users define:

* Long-term goals
* Major milestones
* Personal aspirations
* The person they want to become

Example:

```text
Ithaca:
Become a strong software engineer.

Milestones:
├── Master Data Structures & Algorithms
├── Build 3 production projects
├── Learn system design
└── Secure a software engineering role
```

---

## 2. Voyage

The user's daily journey.

Voyage transforms long-term goals into concrete daily actions.

Example:

```text
Goal:
Master DSA

Today's Voyage:

09:00 → Solve 2 graph problems
11:00 → Review Dijkstra's algorithm
16:00 → Implement Dijkstra from scratch
20:00 → Review mistakes
```

The user can track planned activities and what actually happened.

---

## 3. Sirens

Distractions that pull users away from their intended path.

Instead of simply labeling distractions as "bad," Ithaca uses behavioral data to understand patterns.

Example:

```text
Planned:
Study DSA for 2 hours

Actual:
45 min DSA
35 min YouTube
20 min Instagram
```

Ithaca can identify recurring patterns and help the user understand what is interfering with their goals.

---

## 4. Mirror

A reflection system that compares **intention vs reality**.

```text
          PLANNED        ACTUAL

DSA       2 hours   →    1.2 hours
Exercise  45 min    →    45 min
Reading   30 min    →    10 min
```

The purpose isn't simply to show statistics.

The system asks:

* What went well?
* What didn't?
* Where did time go?
* Which goals are progressing?
* What should change tomorrow?

---

## 5. Atlas

Atlas represents the user's evolving behavioral map.

It identifies patterns across time, such as:

```text
Strong patterns
├── High productivity in mornings
├── Consistent exercise
└── Strong completion of planned coding sessions

Weak patterns
├── Reduced focus after 8 PM
├── Frequently postpones difficult tasks
└── Long unplanned breaks
```

This gives the AI a deeper understanding of how the user actually operates.

---

## 6. Forks

Forks allow users to explore possible futures.

Instead of asking only:

> "What should I do today?"

Ithaca can help explore:

> "Where could this path lead?"

Example:

```text
Current Path
      │
      ├── Focus heavily on DSA
      │        ↓
      │   Strong interview preparation
      │
      ├── Focus on projects
      │        ↓
      │   Strong portfolio
      │
      └── Balance both
               ↓
          Broader preparation
```

Forks make long-term decisions easier to reason about.

---

# Navigator

**Navigator is Ithaca's AI agent.**

It acts as the intelligence layer connecting the user's goals, behavior, tasks, reflections, and future plans.

Navigator can:

* Understand long-term goals
* Break goals into actionable tasks
* Analyze behavioral patterns
* Identify inconsistencies between plans and actions
* Suggest adjustments
* Help prioritize tasks
* Generate reflections
* Adapt future plans based on previous behavior

The goal isn't to make decisions for the user.

The goal is to provide better information and guidance so the user can make better decisions.

---

# AI Adaptation Loop

Ithaca follows a continuous:

```text
OBSERVE
   ↓
REASON
   ↓
PLAN
   ↓
REFLECT
   ↓
ADAPT
   ↓
OBSERVE
```

### Observe

Collect information about:

* Goals
* Tasks
* Sessions
* Completion
* Behavior
* Reflections

### Reason

Navigator analyzes the current state.

### Plan

The system generates or adjusts actionable tasks.

### Reflect

The user reviews what actually happened.

### Adapt

Future recommendations change based on the accumulated context.

---

# Features

### Authentication

* User signup
* User login
* Persistent user sessions
* User-specific data

### Goal Management

* Create long-term goals
* Define milestones
* Track progress
* Connect daily actions to goals

### Task Management

* Create tasks
* Track task status
* Track planned vs actual activity
* Organize daily work

### Voyage Dashboard

A central view of the user's current journey.

Displays:

* Today's tasks
* Progress
* Goals
* Activity
* Daily priorities

### Mirror

Provides planned-vs-actual analysis and reflection.

### Navigator AI

AI-powered planning and behavioral guidance.

### Atlas

Builds an evolving representation of user behavior.

### Forks

Explores potential future paths based on different decisions.

---

# Architecture

```text
                    ┌──────────────────────┐
                    │      User            │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │   React Frontend     │
                    │                      │
                    │  Voyage              │
                    │  Mirror              │
                    │  Atlas               │
                    │  Forks               │
                    │  Goals & Tasks       │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │      Supabase        │
                    │                      │
                    │  Authentication      │
                    │  PostgreSQL Database │
                    │  User Data           │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │    Navigator AI      │
                    │                      │
                    │ Goal Reasoning       │
                    │ Task Planning        │
                    │ Reflection           │
                    │ Adaptation            │
                    └──────────────────────┘
```

---

# Tech Stack

## Frontend

* React
* TypeScript / JavaScript
* Vite
* Tailwind CSS
* React Router

## Backend / Data

* Supabase
* PostgreSQL
* Supabase Authentication
* Row Level Security

## AI

* Navigator AI
* LLM-powered reasoning
* Goal decomposition
* Behavioral analysis
* Adaptive planning

---

# Project Structure

```text
ithaca/
│
├── src/
│   ├── components/
│   ├── pages/
│   ├── contexts/
│   ├── lib/
│   ├── hooks/
│   └── App.*
│
├── public/
│
├── supabase/
│
├── .env
├── package.json
├── vite.config.*
└── README.md
```

---

# Getting Started

## 1. Clone the repository

```bash
git clone <repository-url>
cd ithaca
```

## 2. Install dependencies

```bash
npm install
```

## 3. Configure environment variables

Create a `.env` file:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

Do not commit private API keys or secrets to GitHub.

## 4. Start the development server

```bash
npm run dev
```

The application will be available at:

```text
http://localhost:5173
```

---

# Product Philosophy

Ithaca is built around one principle:

> **A goal is only useful when it changes what you do today.**

Traditional productivity tools often separate:

```text
Goals
Tasks
Habits
Reflection
Planning
```

Ithaca connects them.

```text
                LONG-TERM VISION
                       │
                       ▼
                    GOALS
                       │
                       ▼
                 DAILY ACTIONS
                       │
                       ▼
                    BEHAVIOR
                       │
                       ▼
                   REFLECTION
                       │
                       ▼
                 AI ADAPTATION
                       │
                       └──────────→ Better Goals & Actions
```

---

# Target Users

Ithaca is designed primarily for people who are actively working toward long-term personal or professional goals.

Examples include:

* Students
* Young professionals
* Founders
* Developers
* Creators
* People building new skills
* Anyone pursuing a long-term personal objective

---

# Roadmap

* [x] Authentication
* [x] Goal management
* [x] Milestones
* [x] Task management
* [x] Voyage dashboard
* [x] Planned vs actual tracking
* [x] Mirror concept
* [ ] Advanced Navigator reasoning
* [ ] Behavioral Atlas
* [ ] Fork simulations
* [ ] Long-term behavioral memory
* [ ] More personalized AI adaptation
* [ ] Deeper analytics
* [ ] Mobile experience

---

# Vision

Ithaca is not intended to become another application that tells users to:

> "Complete your tasks."

The larger vision is to build an **adaptive personal operating system** that understands the relationship between:

```text
Who you want to become
        ↓
What you do
        ↓
What actually happens
        ↓
What you learn
        ↓
What you should do next
```

The destination provides direction.

The journey provides experience.

**Ithaca connects the two.**

---

## License

This project is currently intended for educational, research, and demonstration purposes.
