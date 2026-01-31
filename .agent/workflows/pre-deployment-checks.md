---
description: Mandatory checks before any deployment
---
Before deploying or pushing to the main branch, strict adherence to the following checks is required:

1. **Unit Tests**:
   - Run ALL backend unit tests: `npm run test` (in backend).
   - Verify 100% pass rate.

2. **Build Verification**:
   - Run Frontend Build: `ng build` (in frontend).
   - Run Backend Build: `npm run build` (in backend).
   - Verify both builds complete without errors.

// turbo-all
3. **If any check fails**:
   - STOP. Do not push.
   - Fix the errors.
   - Re-run checks.
