# Emergency Procedures

## AI Workflow Recovery

The AI tools have created problematic code. I need to:

**Immediate Assessment:**
1. What's broken that was working before?
2. Which AI tool likely caused the issue?
3. Can we git revert to a known good state?

**Recovery Plan:**
1. Minimal fixes to restore functionality
2. Mark problematic patterns with `// FIXME:`
3. Document what went wrong in AI_GUIDELINES.md

**Prevention:**
1. What prompt or setting change would prevent this?
2. Should we adjust the task division?
3. Need for additional code review step?

Current issue: [DESCRIBE]
Last known good commit: [HASH]

---

## Performance Crisis - AI Code Review

The application has severe performance issues. Need immediate analysis:

**Quick Profiling:**
1. Which operations are slowest?
2. Any obvious inefficiencies in recent AI-generated code?
3. Memory leaks or excessive re-renders?

**Triage:**
1. Can we disable features temporarily?
2. Quick wins without major refactoring?
3. Critical path optimizations only

**Mark for Later:**
1. Add `// TODO: Optimize` markers
2. Document performance baseline
3. Plan systematic improvement

Focus only on changes that can be deployed within [TIMEFRAME].