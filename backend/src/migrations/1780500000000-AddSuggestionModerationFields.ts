import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSuggestionModerationFields1780500000000 implements MigrationInterface {
    name = 'AddSuggestionModerationFields1780500000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "suggestions" ADD "is_global" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "suggestions" ADD "group_id" integer`);

        // Set existing suggestions to is_global = true by default as they were the "base" ones
        await queryRunner.query(`UPDATE "suggestions" SET "is_global" = true`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "suggestions" DROP COLUMN "group_id"`);
        await queryRunner.query(`ALTER TABLE "suggestions" DROP COLUMN "is_global"`);
    }
}
