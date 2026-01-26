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
        synchronize: true, // Set to false in production
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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
