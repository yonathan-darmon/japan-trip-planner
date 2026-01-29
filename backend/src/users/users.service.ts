import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { AuthService } from '../auth/auth.service';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>,
        private authService: AuthService,
    ) { }

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
        const passwordHash = await this.authService.hashPassword(createUserDto.password);

        const newUser = this.usersRepository.create({
            username: createUserDto.username,
            passwordHash: passwordHash,
            role: createUserDto.role || undefined
        });

        return this.usersRepository.save(newUser);
    }

    async remove(id: number): Promise<void> {
        await this.usersRepository.delete(id);
    }

    async update(id: number, updateDto: { username?: string; email?: string }): Promise<User> {
        const user = await this.findOne(id);
        if (!user) throw new Error('User not found');

        if (updateDto.username) user.username = updateDto.username;
        if (updateDto.email) user.email = updateDto.email;

        return this.usersRepository.save(user);
    }

    async updateLastViewedChangelog(userId: number): Promise<User> {
        const user = await this.findOne(userId);
        if (!user) throw new Error('User not found');
        user.lastViewedChangelogAt = new Date();
        return this.usersRepository.save(user);
    }
}
