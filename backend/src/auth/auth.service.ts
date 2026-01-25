import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>,
        private jwtService: JwtService,
    ) { }

    async validateUser(username: string, password: string): Promise<any> {
        const user = await this.usersRepository.findOne({ where: { username } });

        if (!user) {
            return null;
        }

        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

        if (!isPasswordValid) {
            return null;
        }

        const { passwordHash, ...result } = user;
        return result;
    }

    async login(loginDto: LoginDto) {
        const user = await this.validateUser(loginDto.username, loginDto.password);

        if (!user) {
            throw new UnauthorizedException('Identifiants invalides');
        }

        const payload = {
            username: user.username,
            sub: user.id,
            role: user.role,
        };

        return {
            access_token: this.jwtService.sign(payload),
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
            },
        };
    }

    async hashPassword(password: string): Promise<string> {
        const salt = await bcrypt.genSalt(10);
        return bcrypt.hash(password, salt);
    }
}
