import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTransportCategory1769944191629 implements MigrationInterface {
    name = 'AddTransportCategory1769944191629'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."suggestions_category_enum" RENAME TO "suggestions_category_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."suggestions_category_enum" AS ENUM('Restaurant', 'Temple', 'Musée', 'Nature', 'Shopping', 'Activité', 'Hébergement', 'Transport', 'Autre')`);
        await queryRunner.query(`ALTER TABLE "suggestions" ALTER COLUMN "category" TYPE "public"."suggestions_category_enum" USING "category"::"text"::"public"."suggestions_category_enum"`);
        await queryRunner.query(`DROP TYPE "public"."suggestions_category_enum_old"`);
        await queryRunner.query(`INSERT INTO "changelogs" ("version", "content") VALUES ('v1.3.11', '🚅 Nouveautés : Ajoutez désormais vos billets de train et eSIM grâce aux nouvelles catégories ''Transport'' et ''Autre'' !')`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DELETE FROM "changelogs" WHERE "version" = 'v1.3.11'`);
        await queryRunner.query(`CREATE TYPE "public"."suggestions_category_enum_old" AS ENUM('Restaurant', 'Temple', 'Musée', 'Nature', 'Shopping', 'Activité', 'Hébergement')`);
        await queryRunner.query(`ALTER TABLE "suggestions" ALTER COLUMN "category" TYPE "public"."suggestions_category_enum_old" USING "category"::"text"::"public"."suggestions_category_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."suggestions_category_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."suggestions_category_enum_old" RENAME TO "suggestions_category_enum"`);
    }

}
