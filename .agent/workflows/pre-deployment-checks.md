---
description: Mandatory checks before any deployment (commit/push)
---
# Pre-Deployment Checks

Before committing and asking to push to production, you MUST follow this checklist:

1. **Review Rules**: Re-read all active workflows (e.g., `/unit-test-rule`, `/regression-test-rule`, `/changelog-rule`, `/planning-rule`) to ensure no requirement was missed during implementation.
2. **Verify Compliance**:
    - Are all unit tests present and passing for modified files?
    - Have regression tests been executed and passed (all test suites green)?
    - Is the changelog updated (with emojis and French description)?
    - Is the `README.md` updated if this feature impacts installation, configuration, or features list?
    - Is the code buildable (`npm run build` for frontend AND backend passed)?
3. **Commit**:
    - If all checks pass, proceed to `git add .` and `git commit -m "<type>: <description>"`.
4. **Push to Production**:
    - If checks pass and changes are committed, you MAY run `git push` automatically.
    - Notify the user: "✅ All checks passed, changes committed & pushed to production."
