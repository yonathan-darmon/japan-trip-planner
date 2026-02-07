---
description: Mandatory planning before implementation
---
// turbo-all
# Mandatory Planning Rule

For every new feature, bug fix, or significant modification, you MUST create or update an `implementation_plan.md` artifact BEFORE making any changes to the codebase.

## Steps:
1.  **Analyze**: Understand the requirements and the existing code.
2.  **Draft**: Write a clear plan in `implementation_plan.md` detailing:
    *   The goal and rationale.
    *   Specific files to be modified ([MODIFY], [NEW], [DELETE]).
    *   The verification strategy.
3.  **Language**: All planning artifacts (`implementation_plan.md`, `task.md`, `walkthrough.md`) MUST be written in **French** to maintain consistency with project documentation.
4.  **Validate**: Use `notify_user` to present the plan to the USER.
5.  **Wait**: You MUST receive explicit approval from the USER before proceeding to the EXECUTION phase.

> [!IMPORTANT]
> No code modifications (except for exploration/debugging) should be committed before the plan is approved.
