import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { AuthService } from '../auth/auth.service';
import { CreateUserDto } from './dto/create-user.dto';

import { S3Service } from '../storage/s3.service';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>,
        private authService: AuthService,
        private s3Service: S3Service,
    ) { }

    async uploadAvatar(userId: number, file: Express.Multer.File): Promise<User> {
        const avatarUrl = await this.s3Service.uploadFile(file);
        if (!avatarUrl) throw new BadRequestException('Image upload failed');

        await this.usersRepository.update(userId, { avatarUrl });
        const updatedUser = await this.findOne(userId);
        if (!updatedUser) throw new Error('User not found after update');
        return updatedUser;
    }

    async countAll(): Promise<number> {
        return this.usersRepository.count();
    }

    async findAll(): Promise<User[]> {
        return this.usersRepository.find();
    }

    async findOne(id: number): Promise<User | null> {
        return this.usersRepository.findOneBy({ id });
    }

    async findByUsername(username: string): Promise<User | null> {
        return this.usersRepository.findOneBy({ username });
    }

    async create(createUserDto: CreateUserDto): Promise<User> {
        await this.checkUserAvailability(createUserDto.username, createUserDto.email);

        const passwordHash = await this.authService.hashPassword(createUserDto.password);

        const newUser = this.usersRepository.create({
            username: createUserDto.username,
            passwordHash: passwordHash,
            role: createUserDto.role || undefined
        });

        return this.usersRepository.save(newUser);
    }

    async remove(id: number): Promise<void> {
        if (id === 1) {
            throw new BadRequestException('Cannot delete the primary super admin account');
        }
        await this.usersRepository.delete(id);
    }

    async update(id: number, updateDto: { username?: string; email?: string }): Promise<User> {
        await this.checkUserAvailability(updateDto.username, updateDto.email, id);

        const user = await this.findOne(id);
        if (!user) throw new Error('User not found');

        if (updateDto.username) user.username = updateDto.username;
        if (updateDto.email) user.email = updateDto.email;

        return this.usersRepository.save(user);
    }

    private async checkUserAvailability(username?: string, email?: string, excludeUserId?: number): Promise<void> {
        if (username) {
            const query = this.usersRepository.createQueryBuilder('user')
                .where('user.username = :username', { username });
            if (excludeUserId) query.andWhere('user.id != :id', { id: excludeUserId });

            const existing = await query.getOne();
            if (existing) {
                throw new BadRequestException('Ce nom d\'utilisateur est déjà utilisé');
            }
        }

        if (email) {
            const query = this.usersRepository.createQueryBuilder('user')
                .where('user.email = :email', { email });
            if (excludeUserId) query.andWhere('user.id != :id', { id: excludeUserId });

            const existing = await query.getOne();
            if (existing) {
                throw new BadRequestException('Cette adresse email est déjà utilisée');
            }
        }
    }

    async updateLastViewedChangelog(userId: number): Promise<User> {
        const user = await this.findOne(userId);
        if (!user) throw new Error('User not found');
        user.lastViewedChangelogAt = new Date();
        return this.usersRepository.save(user);
    }
}
