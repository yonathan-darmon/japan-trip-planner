import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSuperAdminChangelog1772044777840 implements MigrationInterface {
    name = 'AddSuperAdminChangelog1772044777840'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
      INSERT INTO "changelogs" ("version", "content", "published_at")
      VALUES (
        'v1.7.4',
        '🛡️ Nouveautés Administrateur et Correctifs Mobiles

🛡️ GESTION UTILISATEURS SUPER ADMIN
• Les Super Administrateurs peuvent désormais supprimer des comptes membres.
• Vos données d''itinéraires restent protégées en base même si le compte créateur est effacé.

📱 CORRECTIFS ET DESIGN SUR MOBILE
• Carte Itinéraire : La barre de chargement et de sélection ne passe plus par dessus vos boutons de navigations.
• Liste Publique : Optimisation complète de l''en-tête (mise en page mieux empilée) pour faciliter la consultation sur téléphones.',
        NOW()
      )
    `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DELETE FROM "changelogs" WHERE "version" = 'v1.7.4'`);
    }
}
