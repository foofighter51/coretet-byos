# VS Code AI Development Workflow - Complete Setup & Daily Operations

## Part 1: Initial Setup Checklist

### 1.1 Required VS Code Extensions

Install these extensions via Command Palette (`Cmd/Ctrl + P`) by typing `ext install`:

```bash
# Code Quality & Linting
ext install dbaeumer.vscode-eslint
ext install esbenp.prettier-vscode
ext install SonarSource.sonarlint-vscode
ext install usernamehw.errorlens

# Code Understanding
ext install aaron-bond.better-comments
ext install kisstkondoros.vscode-codemetrics
ext install wix.vscode-import-cost
ext install eamodio.gitlens

# Testing & Validation
ext install firsttris.vscode-jest-runner
ext install vitest.explorer
ext install rangav.vscode-thunder-client
ext install ritwickdey.LiveServer

# Documentation
ext install oouo-diogo-perdigao.docthis
ext install yzhang.markdown-all-in-one

# AI Integration
ext install GitHub.copilot
ext install GitHub.copilot-chat
```

### 1.2 Project Configuration Files

Create these files in your project root:

#### `.vscode/settings.json`
```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "github.copilot.enable": {
    "*": true,
    "markdown": false,
    "plaintext": false,
    "json": true
  },
  "github.copilot.advanced": {
    "inlineSuggestCount": 1,
    "length": "short"
  },
  "editor.inlineSuggest.enabled": true,
  "editor.suggestSelection": "first",
  "errorLens.enabled": true,
  "errorLens.fontWeight": "bold",
  "sonarlint.rules": {
    "javascript:S3776": {
      "level": "on",
      "parameters": {
        "threshold": 15
      }
    }
  },
  "betterComments.tags": [
    {
      "tag": "!",
      "color": "#FF2D00",
      "backgroundColor": "transparent"
    },
    {
      "tag": "TODO",
      "color": "#FF8C00",
      "backgroundColor": "transparent"
    },
    {
      "tag": "FIXME",
      "color": "#FF2D00",
      "backgroundColor": "transparent"
    },
    {
      "tag": "AI-REVIEW",
      "color": "#3498DB",
      "backgroundColor": "transparent"
    }
  ]
}
```

#### `.vscode/keybindings.json`
```json
[
  {
    "key": "alt+c",
    "command": "github.copilot.toggleCopilot",
    "when": "editorTextFocus"
  },
  {
    "key": "alt+r",
    "command": "editor.action.formatDocument",
    "when": "editorTextFocus"
  },
  {
    "key": "alt+a",
    "command": "workbench.action.terminal.focus"
  },
  {
    "key": "alt+t",
    "command": "testing.runAll"
  }
]
```

#### `AI_GUIDELINES.md`
```markdown
# AI Development Guidelines

## Core Principles (Both Claude Code & Copilot)
1. **Minimize code changes** - Fix rather than replace
2. **Follow existing patterns** - Consistency over perfection
3. **Document why, not what** - Focus on intent
4. **Test before committing** - Verify all changes
5. **Clean as you go** - Refactor incrementally

## Task Division

### Claude Code Responsibilities
- Architecture decisions & design patterns
- Complex debugging & root cause analysis
- Code reviews & refactoring strategies
- Performance optimization planning
- Security considerations
- Breaking down complex requirements

### GitHub Copilot Responsibilities
- Auto-complete function implementations
- Generate boilerplate code
- Complete repetitive patterns
- Suggest variable/function names
- Fill in test assertions
- Complete documentation blocks

## Workflow States

### FOCUS MODE (Alt+C to toggle Copilot OFF)
Use when: Planning, architecting, reviewing
Lead tool: Claude Code

### FLOW MODE (Copilot ON)
Use when: Implementing, coding routine logic
Lead tool: GitHub Copilot

### REVIEW MODE
Use when: Checking quality, refactoring
Lead tool: Claude Code reviewing both human and Copilot code

## Code Markers
- `// TODO:` - Pending tasks
- `// FIXME:` - Known issues
- `// AI-REVIEW:` - Needs Claude Code review
- `// COPILOT-GEN:` - Copilot generated, needs review
- `// CLAUDE-APPROVED:` - Reviewed and approved
```

#### `.eslintrc.json`
```json
{
  "env": {
    "browser": true,
    "es2021": true,
    "node": true
  },
  "extends": [
    "eslint:recommended"
  ],
  "parserOptions": {
    "ecmaVersion": "latest",
    "sourceType": "module"
  },
  "rules": {
    "complexity": ["warn", 10],
    "max-depth": ["warn", 4],
    "max-lines-per-function": ["warn", 50],
    "no-duplicate-imports": "error",
    "no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
    "prefer-const": "error"
  }
}
```

#### `.prettierrc`
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "bracketSpacing": true,
  "arrowParens": "always"
}
```

---

## Part 2: Daily Operations Prompts

### 2.1 Morning Startup Sequence

```markdown
## Daily Session Initialization

I'm starting a new development session with both Claude Code and GitHub Copilot configured. 

**Step 1: Load Previous Session**
Please read and analyze the EOD status file: `./docs/eod-status/[YESTERDAY'S DATE]-eod.md`
(or the most recent file in that directory if yesterday's doesn't exist)

From that file, extract and summarize:
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
```

### 2.1.1 Alternative Startup (No Previous EOD File)

```markdown
## Fresh Session Initialization 

No previous EOD status file found. Let's establish context:

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
```

### 2.2 Task-Specific Prompts

#### New Feature Implementation
```markdown
## Feature Implementation Request

**Feature:** [FEATURE NAME]
**Priority:** [HIGH/MEDIUM/LOW]

Before implementing:
1. Review existing codebase for reusable components
2. Identify integration points with current architecture
3. Plan minimal implementation approach
4. List any new dependencies needed

**Copilot Integration Note:** I'll use Copilot for routine implementations. Please review any sections marked with `// COPILOT-GEN:` for architectural consistency.

Outline your implementation approach before we begin coding.
```

#### Debugging Session
```markdown
## Debugging Focus

**Issue:** [DESCRIBE BUG]
**Affected Areas:** [LIST FILES/FUNCTIONS]
**Expected vs Actual:** [DESCRIBE BOTH]

Approach:
1. Identify root cause without assumptions
2. Propose minimal fix
3. Preserve all working functionality
4. Add `// FIXME:` comments for related issues discovered
5. Verify fix doesn't introduce new issues

Note: Copilot is DISABLED (Alt+C) for this debugging session to maintain focus.
```

#### Code Review Request
```markdown
## Code Review - Mixed AI Sources

Please review recent changes in [FILES/FOLDERS]. This includes:
- Human-written code
- Copilot-generated sections (marked with `// COPILOT-GEN:`)
- Previous Claude Code suggestions

Review for:
1. **Consistency:** Does all code follow our established patterns?
2. **Quality:** Any code smells or anti-patterns?
3. **Efficiency:** Unnecessary duplication or complexity?
4. **Safety:** Potential bugs or edge cases?
5. **Documentation:** Are AI-generated sections properly documented?

Mark approved sections with `// CLAUDE-APPROVED:` and issues with `// AI-REVIEW:`.
```

### 2.3 End of Day Procedures

#### Daily Wrap-up Prompt
```markdown
## End of Day Status Generation

Please create an EOD status report by:

**Step 1: Analyze Today's Work**
1. Review git diff for all changes made today
2. List commits made (git log --oneline --since="today")
3. Check current branch status
4. Identify any uncommitted work

**Step 2: Task Accounting**
Review today's planned tasks (from morning session) and categorize:
- ✅ Completed tasks (with commit references)
- 🔄 In Progress (with current state)
- ⏸️ Blocked (with reason)
- 📝 New tasks discovered today
- 🐛 Bugs found but not fixed

**Step 3: Code Quality Summary**
- New TODO/FIXME markers added
- AI-REVIEW sections pending
- Complexity warnings introduced
- Test coverage impact

**Step 4: Generate EOD Markdown**
Create file: `./docs/eod-status/[YYYY-MM-DD]-eod.md`

Use this template:
```

# EOD Status - [DATE]

## Session Summary
- **Duration**: [START] - [END]
- **Primary Focus**: [MAIN AREA WORKED ON]
- **Branch**: [CURRENT BRANCH]

## Completed Tasks
- [x] [TASK 1] - [COMMIT HASH or PR#]
- [x] [TASK 2] - [COMMIT HASH or PR#]

## In Progress
- [ ] [TASK] - [STATUS: % complete, what's left]
  - Current state: [DESCRIPTION]
  - Next steps: [WHAT NEEDS TO BE DONE]

## Blocked Items
- [ ] [TASK] - Blocked by: [REASON]
  - Required to unblock: [WHAT'S NEEDED]

## New Discoveries
### Tasks Added
- [ ] [NEW TASK 1] - Priority: [HIGH/MED/LOW]
- [ ] [NEW TASK 2] - Priority: [HIGH/MED/LOW]

### Issues Found
- 🐛 [BUG DESCRIPTION] - Severity: [HIGH/MED/LOW]
  - Location: [FILE:LINE]
  - Temporary workaround: [IF ANY]

## Code Health Metrics
- **Files Modified**: [COUNT]
- **Lines Added/Removed**: +[X] -[Y]
- **Test Coverage**: [X]% ([CHANGE])
- **New Tech Debt**:
  - TODO markers: [COUNT]
  - FIXME markers: [COUNT]
  - AI-REVIEW pending: [COUNT]

## Tomorrow's Recommended Priorities
1. [HIGHEST PRIORITY TASK] - Est: [TIME]
2. [SECOND PRIORITY] - Est: [TIME]
3. [THIRD PRIORITY] - Est: [TIME]

## Notes for Next Session
- [ANY IMPORTANT CONTEXT]
- [STASHED CHANGES INFO]
- [ENVIRONMENT SETUP NEEDS]

## AI Tool Performance
- **Copilot Effectiveness**: [1-5 rating] - [BRIEF NOTE]
- **Claude Code Effectiveness**: [1-5 rating] - [BRIEF NOTE]
- **Coordination Issues**: [ANY CONFLICTS OR PROBLEMS]

---
*Generated: [TIMESTAMP]*
*Next session should run startup prompt with this file*
```

Save this file and confirm creation.
```

#### Weekly Rollup Prompt
```markdown
## Weekly Status Consolidation

Every Friday, after creating daily EOD:

**Step 1: Aggregate Week's EOD Files**
Read all EOD files from `./docs/eod-status/` for this week

**Step 2: Create Weekly Summary**
Generate `./docs/eod-status/weekly/[YYYY-WW]-weekly-summary.md`:

1. **Week Overview**
   - Total tasks completed
   - Tasks carried over to next week
   - Major achievements
   - Persistent blockers

2. **Metrics Trends**
   - Daily productivity chart
   - Code health trajectory
   - Test coverage changes

3. **AI Workflow Insights**
   - Most effective prompts
   - Tool coordination patterns
   - Suggested process improvements

4. **Next Week Setup**
   - Priority task queue
   - Technical debt to address
   - Learning items identified

Please generate both the daily EOD and weekly summary.
```

### 2.4 Maintenance Prompts

#### Sprint/Project Checkpoint
```markdown
## Project Status Deep Dive

Run this bi-weekly or at sprint boundaries:

**Step 1: Historical Analysis**
Analyze all EOD files since last checkpoint for:
- Velocity trends
- Recurring blockers
- Task estimation accuracy
- Unplanned work percentage

**Step 2: Codebase Health**
- Technical debt accumulation rate
- Test coverage trends
- Complexity hotspots evolution
- Dependency updates needed

**Step 3: AI Workflow Optimization**
Based on EOD "AI Tool Performance" sections:
- Average effectiveness ratings
- Common coordination issues
- Successful prompt patterns
- Recommended adjustments

**Step 4: Generate Checkpoint Report**
Create comprehensive report with:
- Executive summary
- Detailed metrics
- Recommendations
- Updated AI_GUIDELINES.md suggestions

Save as: `./docs/eod-status/checkpoints/[DATE]-checkpoint.md`
```

#### Sprint Retrospective
```markdown
## Sprint AI Workflow Retrospective

Reviewing AI tool effectiveness for [SPRINT NAME]:

1. **What worked well:**
   - Which Claude Code prompts were most effective?
   - Where did Copilot save the most time?
   - Successful AI coordination examples?

2. **What needs improvement:**
   - Where did AI tools create more work?
   - Any conflicting suggestions between tools?
   - Prompts that didn't yield good results?

3. **Process adjustments:**
   - Should we modify task division between tools?
   - Any new code markers needed?
   - Keybinding or setting adjustments?

Suggest 3 specific improvements for next sprint.
```

### 2.5 Quick Intervention Prompts

#### Mid-Day Status Check
```markdown
## Mid-Day Progress Review

Quick progress check against this morning's plan:

1. Review the morning priorities from today's startup
2. Check current task status
3. Identify any new blockers
4. Adjust afternoon priorities if needed
5. Note any items for today's EOD file

Are we on track for today's goals? What needs to be adjusted?
```

#### Over-Engineering Reset
```markdown
## STOP - Complexity Reset

The current approach is becoming over-engineered. Let's reset:

1. What's the core problem we're solving?
2. What's the absolute minimal change needed?
3. Can we fix instead of replace?
4. Are we adding unnecessary abstractions?

Provide a simpler solution that:
- Uses existing code where possible
- Adds maximum 20 lines of new code
- Requires no new dependencies
- Can be implemented in under 30 minutes

Note this reset in today's EOD for process improvement.
```

#### AI Conflict Resolution
```markdown
## AI Suggestion Conflict

Copilot suggested:
```[PASTE COPILOT CODE]```

Previous Claude Code guidance was:
```[PASTE CLAUDE GUIDANCE]```

Please:
1. Explain the tradeoffs between approaches
2. Recommend which to use in this context
3. Suggest how to prevent this conflict pattern
4. Update our guidelines if needed
```

---

## Part 3: Implementation Prompts

### 3.1 For New Projects

```markdown
## New Project Setup with AI Workflow

I'm starting a new project. Please help me:

1. **Create the VS Code configuration:**
   - Generate appropriate .vscode/settings.json
   - Set up .eslintrc.json for my tech stack
   - Configure .prettierrc for consistency
   - Create initial AI_GUIDELINES.md

2. **Project Structure:**
   - Recommend folder structure for [PROJECT TYPE]
   - Create `./docs/eod-status/` directory structure
   - Create `./docs/eod-status/checkpoints/` for milestone tracking
   - Create `./docs/eod-status/weekly/` for summaries
   - Set up initial test configuration
   - Create README with AI workflow notes

3. **Git Configuration:**
   - .gitignore including AI markers and EOD files
   - Pre-commit hooks for linting
   - PR template mentioning AI review
   - Consider if EOD files should be committed (team decision)

4. **Initial EOD Template:**
   - Create `./docs/eod-status/TEMPLATE-eod.md`
   - Customize for project-specific metrics
   - Set up automation hints

Tech Stack: [LIST]
Project Type: [WEB APP/API/LIBRARY/etc]
Team Size: [NUMBER]

Generate all configuration files with AI workflow best practices built in.
```

### 3.2 For Existing Projects - Enhanced Integration

```markdown
## Existing Project - AI Workflow Integration with EOD Analysis

I need to add the AI workflow to an existing project. 

**Step 1: Discover Existing Documentation**
First, search for and analyze any existing status documentation:
- Look for any existing EOD/status files
- Check for README, CHANGELOG, or similar docs
- Find any TODO.md or task tracking files
- Review recent commit messages for context

**Step 2: Import Historical Context**
If I have existing EOD or status files:
1. Read all available status documentation
2. Extract recurring patterns and tasks
3. Build a comprehensive task backlog
4. Identify long-standing blockers
5. Create initial prioritized list

**Step 3: Analyze Current State**
- Review current folder structure
- Identify existing linting/formatting configs
- Check for conflicting settings
- Scan for TODO/FIXME markers in code
- Assess test coverage

**Step 4: Migration Plan**
- Phase 1: Set up `./docs/eod-status/` structure
- Phase 2: Import/convert existing documentation
- Phase 3: Create first comprehensive EOD baseline
- Phase 4: Add configuration files (non-breaking)
- Phase 5: Systematic code review and marking

**Step 5: Generate Baseline EOD**
Create `./docs/eod-status/baseline-[DATE]-eod.md` with:
- Complete inventory of known issues
- All TODO/FIXME markers found
- Test coverage baseline
- Complexity hotspots
- Prioritized improvement roadmap

Current Setup:
- Framework: [SPECIFY]
- Existing Docs Location: [PATH IF ANY]
- Team Size: [NUMBER]

Let's start by analyzing existing documentation, then create our baseline.
```

### 3.3 Team Onboarding - With EOD Workflow

```markdown
## Team AI Workflow Onboarding

Help me create onboarding materials for my team:

1. **EOD Workflow Training:**
   - Importance of daily status tracking
   - How to read morning summaries
   - Contributing to EOD files
   - Using historical data for planning

2. **Quick Start Guide:**
   ```
   Daily Routine:
   1. Start: Run morning prompt → Reviews yesterday's EOD
   2. Work: Use appropriate AI tools
   3. Mid-day: Quick progress check
   4. End: Run EOD prompt → Creates today's status
   ```

3. **Team Coordination:**
   - Shared EOD repository setup
   - Merge conflict resolution for EOD files
   - Rotating "scrum master" for weekly rollups
   - Using EOD data in standups

4. **Metrics & Visibility:**
   - Dashboard from EOD data
   - Velocity tracking
   - Blocker patterns
   - AI tool effectiveness scores

Please generate:
- Onboarding checklist
- First week guide
- EOD best practices doc
- Team dashboard template
```

---

## Part 4: Emergency Procedures

### 4.1 When Things Go Wrong

```markdown
## AI Workflow Recovery

The AI tools have created problematic code. I need to:

1. **Immediate Assessment:**
   - What's broken that was working before?
   - Which AI tool likely caused the issue?
   - Can we git revert to a known good state?

2. **Recovery Plan:**
   - Minimal fixes to restore functionality
   - Mark problematic patterns with `// FIXME:`
   - Document what went wrong in AI_GUIDELINES.md

3. **Prevention:**
   - What prompt or setting change would prevent this?
   - Should we adjust the task division?
   - Need for additional code review step?

Current issue: [DESCRIBE]
Last known good commit: [HASH]
```

### 4.2 Performance Emergency

```markdown
## Performance Crisis - AI Code Review

The application has severe performance issues. Need immediate analysis:

1. **Quick Profiling:**
   - Which operations are slowest?
   - Any obvious inefficiencies in recent AI-generated code?
   - Memory leaks or excessive re-renders?

2. **Triage:**
   - Can we disable features temporarily?
   - Quick wins without major refactoring?
   - Critical path optimizations only

3. **Mark for Later:**
   - Add `// TODO: Optimize` markers
   - Document performance baseline
   - Plan systematic improvement

Focus only on changes that can be deployed within [TIMEFRAME].
```

---

## Part 5: Metrics & Reporting - Automated from EOD Data

### 5.1 Automated Weekly Metrics

```markdown
## Weekly AI Workflow Metrics from EOD Files

Generate a report by analyzing `./docs/eod-status/` directory:

1. **Parse All Week's EOD Files:**
   - Extract completed task counts
   - Sum lines added/removed
   - Track test coverage trajectory
   - Count AI-REVIEW resolutions

2. **Calculate Productivity Metrics:**
   - Average daily task completion
   - Task carry-over rate
   - Blocker resolution time
   - Unplanned work percentage

3. **AI Tool Effectiveness:**
   - Average daily ratings from EOD files
   - Correlation between ratings and productivity
   - Most common coordination issues
   - Tool usage patterns

4. **Generate Insights:**
   - Best performing days (and why)
   - Recurring blockers pattern
   - Technical debt accumulation rate
   - Suggested process improvements

Format as dashboard: `./docs/eod-status/weekly/[YYYY-WW]-metrics.md`
```

### 5.2 Monthly Trend Analysis

```markdown
## Monthly Trend Analysis from EOD Data

Analyze all EOD files from the past month:

1. **Velocity Trends:**
   - Week-over-week completion rates
   - Sprint burndown accuracy
   - Estimation improvement

2. **Code Health Evolution:**
   - Technical debt markers trend
   - Test coverage progression
   - Complexity score changes

3. **AI Workflow Maturity:**
   - Tool effectiveness ratings trend
   - Prompt refinement success
   - Time saved estimates

4. **Recommendations:**
   - Process adjustments
   - Tool configuration changes
   - Training needs identified

Generate visual charts where applicable and actionable insights.
```

---

## Quick Reference Card - Updated

### Daily Workflow with EOD
```
1. Morning: Run startup prompt (reads yesterday's EOD)
2. Planning: Claude Code reviews and prioritizes
3. Working: Copilot ON for implementation
4. Mid-day: Progress check against morning plan
5. End of Day: Generate EOD status file
6. Weekly: Friday rollup and metrics
```

### EOD File Structure
```
./docs/eod-status/
├── YYYY-MM-DD-eod.md      # Daily files
├── TEMPLATE-eod.md         # Template
├── baseline-DATE-eod.md   # Project baseline
├── weekly/
│   ├── YYYY-WW-summary.md # Weekly summaries
│   └── YYYY-WW-metrics.md # Weekly metrics
└── checkpoints/
    └── DATE-checkpoint.md  # Sprint/milestone reviews
```

### Essential Daily Prompts
```
Morning: "Read and analyze the EOD status file"
Mid-day: "Quick progress check against morning plan"
Evening: "Create EOD status report"
Friday: "Generate weekly rollup"
```

### Git Decisions for EOD Files
```
Option A: Commit EOD files (team visibility)
- Add to repo, use for team standups
- Good for remote/async teams

Option B: Local only (personal workflow)
- Add /docs/eod-status/ to .gitignore
- Good for solo developers

Option C: Separate repo (archive)
- Keep main repo clean
- Sync to documentation repo
```