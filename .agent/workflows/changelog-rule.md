---
description: Rule for mandatory changelog updates
---
// turbo-all
# Mandatory Changelog Rule

For every meaningful change to the application (new features, visual redesign, security updates), a new changelog entry must be created via a database migration.

## Steps:
1. Identify the version increment (e.g., v1.3.0 -> v1.3.1).
2. Create a new migration file in `backend/src/migrations/` with a descriptive name.
3. Insert the new version and description into the `changelogs` table.
4. Descriptive content should be in French and use emojis to be consistent with the app's style.
