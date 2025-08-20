# Daily Startup Prompts

## Daily Session Initialization

I'm starting a new development session with both Claude Code and GitHub Copilot configured. 

**Step 1: Load Previous Session**
First, verify today's date by running: `date +"%Y-%m-%d"` 
Confirm this matches your system date before proceeding.

Now find and read the most recent EOD file:
1. List all files in `./docs/eod-status/` sorted by date
2. Identify the most recent file matching pattern `YYYY-MM-DD-eod.md`
3. Confirm the file date is reasonable (not future-dated, not too old)
4. Read and analyze that file

From the most recent EOD file, extract and summarize:
1. Completed tasks from last session
2. Outstanding/carried-over tasks
3. Known issues or blockers
4. Work in progress that was stashed
5. Any specific notes for today

**Step 2: Acknowledge Working Principles**
1. Code Quality > Quantity - Fix and refactor before adding
2. Minimal Changes - Smallest possible changes to achieve goals
3. Preserve Working Code - Don't modify functioning code without explicit permission
4. DRY Principle - Eliminate duplication, suggest shared utilities
5. Clear Communication - Explain what, why, and impacts before changes

**Step 3: AI Integration Setup**
- GitHub Copilot: ENABLED for autocomplete and boilerplate
- Claude Code: Leading architecture and review decisions
- Both following: .eslintrc.json and .prettierrc configurations
- Code markers in use: TODO, FIXME, AI-REVIEW, COPILOT-GEN

**Step 4: Generate Today's Plan**
Based on the EOD status file, propose:
1. Top 3 priorities for today (considering carryover tasks)
2. Realistic time estimates for each
3. Any blockers that need addressing first
4. Suggested order of operations

Please provide the summary and wait for my confirmation or adjustments before we begin.

---

## Fresh Session Initialization (No Previous EOD)

No previous EOD status file found in `./docs/eod-status/`. Let's establish context:

**Step 0: Verify Date**
Run: `date +"%Y-%m-%d"` and confirm this is today's actual date.

**Step 1: Codebase Analysis**
Please scan the project for:
1. Recent commits (last 5) to understand recent work
2. Current TODO/FIXME markers in code
3. Open files in the workspace (if any)
4. Test suite status
5. Any uncommitted changes

**Step 2: Project Context**
- Project: [PROJECT NAME]
- Tech Stack: [AUTO-DETECT OR CONFIRM]
- Current branch: [git branch --show-current]

**Step 3: Create Initial Task List**
Based on your analysis, suggest:
1. Obvious issues that need attention
2. Incomplete implementations (look for TODO markers)
3. Tests that are failing or skipped
4. Code marked with AI-REVIEW

**Step 4: Initialize EOD Tracking**
Create directory: `./docs/eod-status/`
We'll create our first EOD file at the end of this session.

Please provide your analysis and suggested priorities.
