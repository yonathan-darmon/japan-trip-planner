import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateUserCascades1772044303693 implements MigrationInterface {
    name = 'UpdateUserCascades1772044303693'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "trip_config" DROP CONSTRAINT "FK_882a1e98a980b51d0d3aa5a2a48"`);
        await queryRunner.query(`ALTER TABLE "itineraries" DROP CONSTRAINT "FK_4e7416dc6959241ece8696ab356"`);
        await queryRunner.query(`ALTER TABLE "itineraries" ALTER COLUMN "created_by" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "trip_config" ADD CONSTRAINT "FK_882a1e98a980b51d0d3aa5a2a48" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "itineraries" ADD CONSTRAINT "FK_4e7416dc6959241ece8696ab356" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "itineraries" DROP CONSTRAINT "FK_4e7416dc6959241ece8696ab356"`);
        await queryRunner.query(`ALTER TABLE "trip_config" DROP CONSTRAINT "FK_882a1e98a980b51d0d3aa5a2a48"`);
        await queryRunner.query(`ALTER TABLE "itineraries" ALTER COLUMN "created_by" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "itineraries" ADD CONSTRAINT "FK_4e7416dc6959241ece8696ab356" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "trip_config" ADD CONSTRAINT "FK_882a1e98a980b51d0d3aa5a2a48" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
