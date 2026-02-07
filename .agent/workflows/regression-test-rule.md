---
description: Rule for mandatory regression testing before deployment
---
// turbo-all
# Mandatory Regression Testing Rule

For every feature implementation or bug fix, you MUST perform regression tests to ensure that existing functionality is not broken.

## Steps:

1. **Identify Impact Zone**: Determine which existing features might be affected by your changes.
   - Example: If modifying `SuggestionsService`, check `ItineraryService`, `GroupsController`, etc.

2. **Run Full Test Suites**:
   - **Backend**: `npm run test` (all tests)
   - **Frontend**: `ng test` (all tests)
   - Ensure ALL existing tests pass, not just the new ones.

3. **Manual Verification** (if applicable):
   - Test critical user flows in the browser:
     - Authentication (login/logout)
     - CRUD operations (create/read/update/delete)
     - Navigation between pages
     - Role-based access (Super Admin, Group Admin, User)

4. **Document Regression Tests**:
   - In `walkthrough.md`, include a section "🧪 Regression Testing" listing:
     - Test suites executed
     - Critical flows manually verified
     - Any issues found and resolved

5. **No Deployment Without Green Tests**:
   - If ANY test fails, you MUST fix it before committing.
   - Regressions are blocking issues.

> [!CAUTION]
> Never skip regression testing, even for "small" changes. A single line can break multiple features.
