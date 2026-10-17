# TeamFlow AI — AI Assistant & Workflows

## OpenRouter Integration & Models
TeamFlow AI leverages OpenRouter's API supporting free and open-source models:
- Default: `meta-llama/llama-3.3-70b-instruct:free`
- Alternates: `google/gemini-2.0-flash-exp:free`, `mistralai/mistral-7b-instruct:free`

## Core AI Features

### 1. AI Project Planner (`POST /api/ai/project-plan`)
- Converts user descriptions (e.g., "Build an e-commerce website with React and FastAPI") into structured milestones and actionable tasks.
- Returns estimated hours, suggested engineering roles, and priorities.
- User can review and click **Create Tasks** to bulk create records.

### 2. AI Task Decomposition (`POST /api/ai/task-breakdown`)
- Breaks any high-level task into 4–6 granular subtasks with estimated hours and priorities.
- Human-in-the-loop approval before insertion into the Kanban board.

### 3. AI Sprint Planner (`POST /api/ai/sprint-plan`)
- Evaluates backlog tasks, priority weights, estimated effort, and member capacity.
- Generates balanced Sprint 1 workload allocations per contributor.

### 4. Live Deadline Risk Detection (`POST /api/ai/risk-analysis`)
- Compares remaining task effort against available capacity and remaining days to deadline.
- Emits risk ratings (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`) with prescriptive recommendations.

### 5. Meeting Intelligence (`POST /api/ai/meeting-summary`)
- Extracts executive summaries, key decisions, and structured action items with assignees and due dates.
- 1-click conversion from action items to real tasks.

### 6. Project Q&A & Search (`POST /api/ai/chat`)
- Answers contextual questions (e.g. "What should I work on next?", "What did we decide about authentication?") with citations from meeting notes, task cards, and project docs.
