---
description: Rule for mandatory unit tests on file modification
---
// turbo-all
# Mandatory Unit Tests Rule

For every file that is modified (Backend or Frontend), you MUST ensure that a corresponding unit test file exists and is updated to reflect the changes.

## Steps:
1.  **Identify**: When a file is modified (e.g., `feature.service.ts`), check for its spec file (`feature.service.spec.ts`).
2.  **Create/Update**:
    *   If it doesn't exist, **create it** with basic coverage.
    *   If it exists, **update it** to test the new logic or bug fix.
3.  **Verify**: Run the test to ensure it passes (`npm run test -- path/to/file.spec.ts` for Backend, or `ng test` for Frontend).
4.  **No Regressions**: Ensure existing tests still pass.
