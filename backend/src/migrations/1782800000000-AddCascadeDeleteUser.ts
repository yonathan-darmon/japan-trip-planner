import { MigrationInterface, QueryRunner, TableForeignKey } from "typeorm";

export class AddCascadeDeleteUser1782800000000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. GroupMember: user_id (User)
        await this.updateForeignKey(queryRunner, "group_members", "user_id", "users", "id", "CASCADE");
        // 2. GroupMember: group_id (Group)
        await this.updateForeignKey(queryRunner, "group_members", "group_id", "groups", "id", "CASCADE");

        // 3. Suggestion: created_by (User)
        // Note: constraint name might be 'FK_...created_by'
        await this.updateForeignKey(queryRunner, "suggestions", "created_by", "users", "id", "CASCADE");

        // 4. ItineraryActivity: suggestion_id (Suggestion)
        await this.updateForeignKey(queryRunner, "itinerary_activities", "suggestion_id", "suggestions", "id", "CASCADE");

        // 5. UserPreference: user_id (User)
        await this.updateForeignKey(queryRunner, "user_preferences", "user_id", "users", "id", "CASCADE");

        // 6. UserPreference: suggestion_id (Suggestion)
        await this.updateForeignKey(queryRunner, "user_preferences", "suggestion_id", "suggestions", "id", "CASCADE");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Revert to NO ACTION (RESTRICT)
        await this.updateForeignKey(queryRunner, "group_members", "user_id", "users", "id", "NO ACTION");
        await this.updateForeignKey(queryRunner, "group_members", "group_id", "groups", "id", "NO ACTION");
        await this.updateForeignKey(queryRunner, "suggestions", "created_by", "users", "id", "NO ACTION");
        await this.updateForeignKey(queryRunner, "itinerary_activities", "suggestion_id", "suggestions", "id", "NO ACTION");
        await this.updateForeignKey(queryRunner, "user_preferences", "user_id", "users", "id", "NO ACTION");
        await this.updateForeignKey(queryRunner, "user_preferences", "suggestion_id", "suggestions", "id", "NO ACTION");
    }

    private async updateForeignKey(
        queryRunner: QueryRunner,
        tableName: string,
        columnName: string,
        referencedTable: string,
        referencedColumn: string,
        onDelete: string
    ) {
        const table = await queryRunner.getTable(tableName);
        const foreignKey = table.foreignKeys.find(fk => fk.columnNames.indexOf(columnName) !== -1);

        if (foreignKey) {
            await queryRunner.dropForeignKey(tableName, foreignKey);
        }

        await queryRunner.createForeignKey(tableName, new TableForeignKey({
            columnNames: [columnName],
            referencedColumnNames: [referencedColumn],
            referencedTableName: referencedTable,
            onDelete: onDelete
        }));
    }

}
