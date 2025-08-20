# Daily Wrap-up Prompts

## End of Day Status Generation

**CRITICAL: Date Verification**
Before creating any EOD file:
1. Run: `date +"%Y-%m-%d %H:%M:%S %Z"` 
2. Confirm this matches your actual local date/time
3. If there's any discrepancy, use the system date, not your assumed date
4. The filename should be: `./docs/eod-status/[SYSTEM-DATE]-eod.md`

**Step 1: Analyze Today's Work**
1. Review git diff for all changes made today
2. List commits made (git log --oneline --since="midnight")
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
Create file with TODAY'S ACTUAL DATE (from step 1): `./docs/eod-status/[YYYY-MM-DD]-eod.md`

Use the template below for the file content.

**Step 5: Verification**
After creating the file:
1. List the docs/eod-status/ directory to confirm the file was created
2. Verify the date in the filename matches today's actual date
3. Confirm no duplicate or future-dated files were created

Save this file and confirm creation with: `ls -la ./docs/eod-status/ | tail -5`

# EOD Status - [ACTUAL SYSTEM DATE]

## Session Summary
- **Date Generated**: [Output of: date +"%Y-%m-%d %H:%M:%S %Z"]
- **Duration**: [START TIME] - [END TIME]
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
*Generated: [EXACT OUTPUT OF: date +"%Y-%m-%d %H:%M:%S %Z"]*
*File verified date: Confirmed system date before creation*
*Next session should run startup prompt to find this file*

## Weekly Status Consolidation

Every Friday, after creating daily EOD:

**Step 0: Date Verification**
Run: `date +"%Y-%m-%d %V"` to confirm today's date and week number.

**Step 1: Aggregate Week's EOD Files**
List all EOD files from this week, sorted by date:
- Run: `ls -la ./docs/eod-status/*-eod.md | grep -v TEMPLATE | sort`
- Read the files from this week (ignore any with suspicious future dates)

**Step 2: Create Weekly Summary**
Generate `./docs/eod-status/weekly/[YYYY-WW]-weekly-summary.md`:
(Use actual year and week number from Step 0)

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