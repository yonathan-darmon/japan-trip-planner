import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { Country } from '../countries/entities/country.entity';
import { Group } from '../groups/entities/group.entity';
import { GroupMember, GroupRole } from '../groups/entities/group-member.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { Itinerary } from '../itinerary/entities/itinerary.entity';
import { Suggestion } from '../suggestions/entities/suggestion.entity';
import { TripConfig } from '../trip-config/entities/trip-config.entity';
import { EntityManager, IsNull } from 'typeorm';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const entityManager = app.get(EntityManager);

    console.log('Starting migration...');

    // 1. Create Default Country "Japan"
    let japan = await entityManager.findOne(Country, { where: { code: 'JP' } });
    if (!japan) {
        console.log('Creating Country: Japan');
        japan = new Country();
        japan.name = 'Japan';
        japan.code = 'JP';
        await entityManager.save(japan);
    } else {
        console.log('Country Japan already exists.');
    }

    // 2. Create Legacy Group
    let group = await entityManager.findOne(Group, { where: { name: 'Voyage Japon' } });
    if (!group) {
        console.log('Creating Legacy Group: Voyage Japon');
        group = new Group();
        group.name = 'Voyage Japon';
        group.country = japan;
        await entityManager.save(group);
    } else {
        console.log('Legacy Group already exists.');
    }

    // 3. Migrate Users (Super Admin -> Group Admin, Others -> Members)
    const users = await entityManager.find(User, { relations: ['groups'] });
    console.log(`Found ${users.length} users to migrate.`);

    for (const user of users) {
        // Check if user is already in the legacy group
        const existingMember = await entityManager.findOne(GroupMember, {
            where: { user: { id: user.id }, group: { id: group.id } },
        });

        if (!existingMember) {
            console.log(`Adding user ${user.username} to group.`);
            const member = new GroupMember();
            member.user = user;
            member.group = group;
            // If user is super admin, make them group admin
            member.role = user.role === UserRole.SUPER_ADMIN ? GroupRole.ADMIN : GroupRole.MEMBER;
            await entityManager.save(member);
        }
    }

    // 4. Migrate TripConfig
    // Find the most recently updated TripConfig
    const [latestConfig] = await entityManager.find(TripConfig, {
        order: { updatedAt: 'DESC' },
        take: 1,
    });

    if (latestConfig) {
        if (!latestConfig.group) {
            console.log(`Assigning latest TripConfig (ID: ${latestConfig.id}) to Group.`);
            // We need to update the Group to point to this config (OneToOne side)
            // Check Group entity definition: Group has @OneToOne with JoinColumn, so Group owns the FK?
            // Let's check Group entity:
            // @OneToOne(() => TripConfig) @JoinColumn({ name: 'trip_config_id' }) tripConfig: TripConfig;
            // Yes, Group owns the FK.
            group.tripConfig = latestConfig;
            await entityManager.save(group);
        }
    }

    // 5. Migrate Itineraries
    const itineraries = await entityManager.find(Itinerary, { where: { groupId: IsNull() } });
    console.log(`Found ${itineraries.length} orphan itineraries.`);
    if (itineraries.length > 0) {
        for (const it of itineraries) {
            it.group = group;
        }
        await entityManager.save(itineraries);
        console.log('Assigned itineraries to group.');
    }

    // 6. Migrate Suggestions (Assign to Japan)
    const suggestions = await entityManager.find(Suggestion, { where: { countryId: IsNull() } });
    console.log(`Found ${suggestions.length} orphan suggestions.`);
    if (suggestions.length > 0) {
        for (const s of suggestions) {
            s.country = japan;
        }
        await entityManager.save(suggestions);
        console.log('Assigned suggestions to Japan.');
    }

    console.log('Migration completed successfully.');
    await app.close();
}

bootstrap();
