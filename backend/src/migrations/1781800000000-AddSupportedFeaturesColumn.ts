import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSupportedFeaturesColumn1781800000000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "countries" ADD "supported_features" jsonb DEFAULT '{}'`);

        // Activer les features pour le Japon par défaut
        await queryRunner.query(`
            UPDATE "countries" 
            SET "supported_features" = '{"jr_pass": true, "goshuin": true}' 
            WHERE "code" = 'JPN' OR "name" = 'Japan' OR "name" = 'Japon'
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "countries" DROP COLUMN "supported_features"`);
    }

}
