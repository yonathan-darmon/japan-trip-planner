import { MigrationInterface, QueryRunner, TableForeignKey, TableColumn } from "typeorm";

export class SetNullOnUserDelete1782800000001 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Make created_by nullable
        await queryRunner.changeColumn("suggestions", "created_by", new TableColumn({
            name: "created_by",
            type: "int",
            isNullable: true
        }));

        // 2. Change FK to SET NULL
        const table = await queryRunner.getTable("suggestions");
        if (!table) return;
        const foreignKey = table.foreignKeys.find(fk => fk.columnNames.indexOf("created_by") !== -1);

        if (foreignKey) {
            await queryRunner.dropForeignKey("suggestions", foreignKey);
        }

        await queryRunner.createForeignKey("suggestions", new TableForeignKey({
            columnNames: ["created_by"],
            referencedColumnNames: ["id"],
            referencedTableName: "users",
            onDelete: "SET NULL"
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // 1. Revert FK to CASCADE (or whatever it was)
        const table = await queryRunner.getTable("suggestions");
        if (!table) return;
        const foreignKey = table.foreignKeys.find(fk => fk.columnNames.indexOf("created_by") !== -1);
        if (foreignKey) {
            await queryRunner.dropForeignKey("suggestions", foreignKey);
        }
        await queryRunner.createForeignKey("suggestions", new TableForeignKey({
            columnNames: ["created_by"],
            referencedColumnNames: ["id"],
            referencedTableName: "users",
            onDelete: "CASCADE"
        }));

        // 2. Make created_by NOT NULL (warning: this might fail if data is null)
        // We skip this in down() to avoid data loss crash
    }
}
