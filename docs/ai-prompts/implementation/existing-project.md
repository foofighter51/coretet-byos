## Existing Project - AI Workflow Integration with EOD Analysis

I need to add the AI workflow to an existing project. 

**Step 0: Date and Environment Check**
First, verify the current date: `date +"%Y-%m-%d %H:%M:%S %Z"`
This ensures all new files will have correct timestamps.

**Step 1: Discover Existing Documentation**
Search for and analyze any existing status documentation:
- Find any existing EOD or status files: `find . -type f -name "*eod*" -o -name "*status*" -o -name "*daily*" 2>/dev/null | head -20`
- Check for existing EOD directory: `ls -la ./docs/eod-status/ 2>/dev/null || echo "No EOD directory yet"`
- Look for README, CHANGELOG, or similar docs
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