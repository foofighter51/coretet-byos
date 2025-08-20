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
