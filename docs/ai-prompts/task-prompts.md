# Task-Specific Prompts

Quick reference for different development tasks. Copy the relevant prompt based on your current work.

---

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

## Refactoring Focus

Let's refactor [specific file/function/component]. Goals:

1. Improve readability without changing functionality
2. Extract repeated code into reusable functions
3. Simplify complex conditions
4. Add clear comments only where necessary
5. Ensure all existing tests still pass

Make changes incrementally and explain each refactoring decision.
Don't refactor unrelated code even if you notice issues - mark with `// TODO:` for later.

## Performance Optimization Request

Let's optimize [specific area] for performance:

1. Measure/identify the actual bottleneck first
2. Make minimal changes for maximum impact
3. Don't optimize prematurely
4. Keep code readable despite optimizations
5. Document why specific optimizations were made

Focus on measurable improvements, not theoretical ones.
Provide before/after metrics where possible.

## Test Creation/Update Request

Need tests for [specific function/component/feature]:

1. Review existing test patterns in the codebase
2. Write tests that follow our established style
3. Cover edge cases and error conditions
4. Use descriptive test names that explain the scenario
5. Ensure tests are isolated and don't depend on execution order

For Copilot-generated code, ensure tests verify actual business logic, not just implementation details.

## Bug Fix Request

**Bug Report:** [DESCRIPTION]
**Reproduction Steps:** [HOW TO REPRODUCE]
**Expected Result:** [WHAT SHOULD HAPPEN]
**Actual Result:** [WHAT HAPPENS INSTEAD]

Approach:
1. Reproduce the bug first
2. Write a failing test that captures the bug
3. Implement minimal fix
4. Verify test now passes
5. Check for similar issues elsewhere in codebase
6. Add `// FIXED:` comment with issue reference

Keep fix focused - don't refactor surrounding code unless directly related.

## Documentation Request

Update documentation for [component/feature/API]:

1. Check existing documentation style and follow it
2. Include code examples where helpful
3. Document why, not just what
4. Add any breaking changes clearly marked
5. Update both inline comments and external docs if needed

For AI-generated code sections, ensure documentation explains the business logic, not just the code structure.

