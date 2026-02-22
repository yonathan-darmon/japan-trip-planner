import { MigrationInterface, QueryRunner } from "typeorm";

export class WeatherFeatureChangelog1771783118350 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `INSERT INTO changelogs (version, content, published_at) 
             VALUES (
               'v0.12.0', 
               '🌤️ **Météo & Saisons**\n\nPréparez au mieux votre valise ! La météo s''invite dans votre planificateur :\n\n- 📅 **Véritable Prévision** : Pour les jours à venir (14 prochains jours), l''itinéraire affichera la prévision météo exacte !\n- ⏳ **Tendance Saisonnière** : Si vous planifiez plus loin, découvrez les températures typiques de la saison en vous basant sur l''historique de l''an passé.\n- ⚙️ **Interface Simplifiée** : La gestion de la configuration de votre groupe a également été centralisée et simplifiée.', 
               CURRENT_TIMESTAMP
             )`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DELETE FROM changelogs WHERE version = 'v0.12.0'`);
    }

}
