import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        private configService: ConfigService,
        @InjectRepository(User)
        private usersRepository: Repository<User>,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get('JWT_SECRET') || 'default-secret-key',
        });
    }

    async validate(payload: any) {
        // Find user to check token version
        const user = await this.usersRepository.findOneBy({ id: payload.sub });

        if (!user || user.tokenVersion !== payload.version) {
            throw new UnauthorizedException('Session expirée ou réinitialisée');
        }

        return {
            id: payload.sub,
            username: payload.username,
            role: payload.role,
        };
    }
}
