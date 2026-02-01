import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCurrencyColumns1781900000000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "countries" ADD "currency_code" character varying(3) DEFAULT 'EUR'`);
        await queryRunner.query(`ALTER TABLE "countries" ADD "currency_symbol" character varying(5) DEFAULT '€'`);

        // Japon
        await queryRunner.query(`
            UPDATE "countries" 
            SET "currency_code" = 'JPY', "currency_symbol" = '¥' 
            WHERE "code" = 'JPN' OR "name" = 'Japan' OR "name" = 'Japon'
        `);

        // France (déjà par défaut via DEFAULT mais explicite pour sûreté si données existantes)
        await queryRunner.query(`
            UPDATE "countries" 
            SET "currency_code" = 'EUR', "currency_symbol" = '€' 
            WHERE "code" = 'FRA' OR "name" = 'France'
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "countries" DROP COLUMN "currency_symbol"`);
        await queryRunner.query(`ALTER TABLE "countries" DROP COLUMN "currency_code"`);
    }

}
