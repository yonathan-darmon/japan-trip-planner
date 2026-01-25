import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from './users/users.service';
import { UserRole } from './users/entities/user.entity';
import { AuthService } from './auth/auth.service';

@Injectable()
export class AppService implements OnModuleInit {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
    private authService: AuthService,
  ) { }

  async onModuleInit() {
    // Create super admin user if it doesn't exist
    const superAdminUsername = this.configService.get('SUPER_ADMIN_USERNAME');
    const superAdminPassword = this.configService.get('SUPER_ADMIN_PASSWORD');

    if (superAdminUsername && superAdminPassword) {
      try {
        // Check if user exists
        const existing = await this.usersService.findByUsername(superAdminUsername);

        if (!existing) {
          await this.usersService.create({
            username: superAdminUsername,
            password: superAdminPassword,
            role: UserRole.SUPER_ADMIN,
          });
          console.log('✅ Super admin user created successfully');
        }
      } catch (error) {
        // User already exists, that's fine
        if (error.status !== 409) {
          console.error('Error creating super admin:', error.message);
        }
      }
    }
  }

  getHello(): string {
    return 'Japan Trip Planner API is running! 🗾';
  }
}
