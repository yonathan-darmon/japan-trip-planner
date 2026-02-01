---
description: Mandatory checks before any deployment (commit/push)
---
# Pre-Deployment Checks

Before committing and asking to push to production, you MUST follow this checklist:

1. **Review Rules**: Re-read all active workflows (e.g., `/unit-test-rule`, `/changelog-rule`, `/planning-rule`) to ensure no requirement was missed during implementation.
2. **Verify Compliance**:
    - Are all unit tests present and passing for modified files?
    - Is the changelog updated (with emojis and French description)?
    - Is the code buildable (`ng build` or `npm build` passed)?
3. **Commit**:
    - If all checks pass, proceed to `git add .` and `git commit -m "<type>: <description>"`.
4. **Ask for Push**:
    - **DO NOT** run `git push` automatically.
    - Notify the user: "✅ All checks passed & changes committed. Ready to push to production?"
