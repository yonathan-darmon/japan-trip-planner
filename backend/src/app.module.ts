import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { SuggestionsModule } from './suggestions/suggestions.module';
import { PreferencesModule } from './preferences/preferences.module';
import { TripConfigModule } from './trip-config/trip-config.module';
import { ItineraryModule } from './itinerary/itinerary.module';
import { SyncModule } from './sync/sync.module';
import { CountriesModule } from './countries/countries.module';
import { GroupsModule } from './groups/groups.module';
import { ChangelogModule } from './changelog/changelog.module';
import { AdminModule } from './admin/admin.module';
import { StorageModule } from './storage/storage.module';

@Module({
  imports: [
    // Configuration module
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../.env',
    }),

    // Database configuration
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DATABASE_HOST'),
        port: configService.get('DATABASE_PORT'),
        username: configService.get('DATABASE_USER'),
        password: configService.get('DATABASE_PASSWORD'),
        database: configService.get('DATABASE_NAME'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        migrations: [__dirname + '/migrations/*{.ts,.js}'],
        migrationsRun: true, // Run migrations automatically on startup
        synchronize: process.env.NODE_ENV !== 'production', // Disable in production
        logging: true,
        ssl: process.env.DATABASE_HOST !== 'localhost' ? { rejectUnauthorized: false } : false,
      }),
      inject: [ConfigService],
    }),

    // Feature modules
    AuthModule,
    UsersModule,
    SuggestionsModule,
    PreferencesModule,
    TripConfigModule,
    ItineraryModule,
    SyncModule,
    CountriesModule,
    GroupsModule,
    ChangelogModule,
    ChangelogModule,
    AdminModule,
    StorageModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
