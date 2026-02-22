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

## ⚠️ Critical: Column Naming in Raw SQL
The `changelogs` table uses **snake_case** column names in SQL. Always use `published_at`, never `publishedAt`.

Use this exact template for the migration:

```typescript
import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddXxxChangelog<timestamp> implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            INSERT INTO changelogs (version, content, published_at) 
            VALUES (
                'vX.Y.Z',
                'French description with emojis',
                NOW()
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DELETE FROM changelogs WHERE version = 'vX.Y.Z'`);
    }
}
```

> Note: The column is `published_at` (snake_case) in PostgreSQL, even though the TypeORM entity uses `publishedAt` (camelCase). Always use snake_case in raw SQL queries.

