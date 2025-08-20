# AI Prompt Library Quick Reference

## Daily Workflow
1. **Morning**: Use `daily-startup.md`
2. **Tasks**: Refer to `task-prompts.md` 
3. **Mid-day Check**: Use `intervention-prompts.md` → Mid-Day Progress
4. **Issues**: Check `intervention-prompts.md`
5. **Evening**: Use `daily-wrapup.md` → EOD Generation
6. **Friday**: Use `daily-wrapup.md` → Weekly Consolidation

## Periodic Maintenance
- **Bi-weekly**: `maintenance-prompts.md` → Sprint Checkpoint
- **Monthly**: `maintenance-prompts.md` → Trend Analysis

## Project Setup
- **New**: `implementation/new-project.md`
- **Existing**: `implementation/existing-project.md`
- **Team**: `implementation/team-onboarding.md`

## When Things Go Wrong
- **Emergency**: `emergency-procedures.md`
- **Over-engineering**: `intervention-prompts.md` → Complexity Reset
- **AI Conflicts**: `intervention-prompts.md` → AI Conflict Resolution

## Quick Commands
# Find most recent EOD
ls -lt ./docs/eod-status/*-eod.md | grep -v TEMPLATE | head -1

# Verify date
date +"%Y-%m-%d %H:%M:%S %Z"
