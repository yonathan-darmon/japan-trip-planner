---
description: Rule for mandatory unit tests on file modification (Back & Front)
---
// turbo-all
# Mandatory Unit Tests Rule

For **every** single change mapped in the application (whether it is a Backend service/controller modification or a Frontend component/template modification), you MUST ensure that a corresponding unit test file exists and is updated to reflect the changes.

## Steps:
1.  **Identify**: When any file is modified or created (e.g., `feature.service.ts` or `feature.component.ts`), check for its spec file (`feature.service.spec.ts`, `feature.component.spec.ts`).
2.  **Create/Update**:
    *   If the spec file doesn't exist, **create it** with basic and meaningful coverage.
    *   If it exists, **update it** to test the new logic, visual behavior, or bug fix.
3.  **Verify**: Run the test to ensure it passes (`npm run test -- path/to/file.spec.ts` for Backend, or `npm run test` for Frontend).
4.  **No Regressions**: Ensure all existing tests in the suite still pass before considering the work done.
