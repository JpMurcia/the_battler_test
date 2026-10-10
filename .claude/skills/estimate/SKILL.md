---
name: estimate
description: "Estimate task effort from complexity, dependencies, velocity, risk. Structured estimate with confidence levels."
argument-hint: "[task-description]"
user-invocable: true
allowed-tools: Read, Glob, Grep
model: sonnet
---

<!--
Adapted from Donchitos/Claude-Code-Game-Studios (MIT, see LICENSE in this folder).
Changes for battle-cats-web: design docs come from specs/NNN-*/; velocity comes from
the spec history (tasks.md + git log) instead of production/sprints/; follow-ups point
to Spec Kit skills.
-->

# Estimate

## Phase 1: Understand the Task

Read the task description from the argument. If the description is too vague to estimate meaningfully, ask for clarification before proceeding.

Read `README.md` (and `CLAUDE.md` if it exists) for project context: tech stack (React, PixiJS, Zustand, Dexie, Vitest), coding standards, architectural patterns, and any estimation guidelines.

Read the relevant `specs/NNN-*/spec.md`, `plan.md` and `data-model.md` if the task relates to a documented feature or system.

---

## Phase 2: Scan Affected Code

Identify files and modules that would need to change:

- Assess complexity (size, dependency count, cyclomatic complexity)
- Identify integration points with other systems
- Check for existing test coverage in the affected areas
- Read past work for similar completed tasks and historical velocity: the `tasks.md` of earlier specs under `specs/` (size and shape of comparable specs) and `git log --stat` for how long comparable commits touched.
  **If there is none**, say so under Notes and Assumptions — "No comparable history found;
  this estimate is not calibrated to the team's velocity" — and treat that as a risk
  in the confidence level, not as a silent padding of the figures.

---

## Phase 3: Analyze Complexity Factors

**Code Complexity:**
- Lines of code in affected files
- Number of dependencies and coupling level
- Whether this touches core/engine code vs leaf/feature code
- Whether existing patterns can be followed or new patterns are needed

**Scope:**
- Number of systems touched
- New code vs modification of existing code
- Amount of new test coverage required
- Data migration or configuration changes needed

**Risk:**
- New technology or unfamiliar libraries
- Unclear or ambiguous requirements
- Dependencies on unfinished work
- Cross-system integration complexity
- Performance sensitivity

---

## Phase 4: Generate the Estimate

```markdown
## Task Estimate: [Task Name]
Generated: [Date]

### Task Description
[Restate the task clearly in 1-2 sentences]

### Complexity Assessment

| Factor | Assessment | Notes |
|--------|-----------|-------|
| Systems affected | [List] | [Core, gameplay, UI, etc.] |
| Files likely modified | [Count] | [Key files listed below] |
| New code vs modification | [Ratio] | |
| Integration points | [Count] | [Which systems interact] |
| Test coverage needed | [Low / Medium / High] | |
| Existing patterns available | [Yes / Partial / No] | |

**Key files likely affected:**
- `[path/to/file1]` -- [what changes here]

### Effort Estimate

| Scenario | Days | Assumption |
|----------|------|------------|
| Optimistic | [X] | Everything goes right, no surprises |
| Expected | [Y] | Normal pace, minor issues, one round of review |
| Pessimistic | [Z] | Significant unknowns surface, blocked for a day |

**Recommended budget: [Y days]**

### Confidence: [High / Medium / Low]

[Explain which factors drive the confidence level for this specific task.]

### Risk Factors

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|

### Dependencies

| Dependency | Status | Impact if Delayed |
|-----------|--------|-------------------|

### Suggested Breakdown

| # | Sub-task | Estimate | Notes |
|---|----------|----------|-------|
| 1 | [Research / spike] | [X days] | |
| 2 | [Core implementation] | [X days] | |
| 3 | [Testing and validation] | [X days] | |
| | **Total** | **[Y days]** | |

### Notes and Assumptions
- [Key assumption that affects the estimate]
- [Any caveats about scope boundaries]
```

Output the estimate with a brief summary: recommended budget, confidence level, and the single biggest risk factor.

This skill is read-only — no files are written. Verdict: **COMPLETE** — estimate generated.

---

## Phase 5: Next Steps

- If confidence is Low: recommend a time-boxed spike before committing, or resolve the open questions with `/speckit-clarify`.
- If the task is > 10 days: recommend splitting it into smaller specs, using `/speckit-specify` for each.
- To schedule the task: write it up with `/speckit-specify`, then `/speckit-plan` and `/speckit-tasks`.

### Guidelines

- Always give a range (optimistic / expected / pessimistic), never a single number
- The recommended budget should be the expected estimate, not the optimistic one
- Round to half-day increments — estimating in hours implies false precision for tasks longer than a day
- Do not pad estimates silently — call out risk explicitly so the team can decide
- Confidence is Low whenever the approach is undecided or the core requirements are still TBD — a range built on an unmade decision is a guess
