import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { Country } from '../countries/entities/country.entity';
import { Group } from '../groups/entities/group.entity';
import { GroupMember, GroupRole } from '../groups/entities/group-member.entity';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>,
        @InjectRepository(Country)
        private countriesRepository: Repository<Country>,
        @InjectRepository(Group)
        private groupsRepository: Repository<Group>,
        @InjectRepository(GroupMember)
        private groupMembersRepository: Repository<GroupMember>,
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
            version: user.tokenVersion || 1,
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

    async register(registerDto: RegisterDto) {
        // 1. Check if user exists (specific messages)
        const userByUsername = await this.usersRepository.findOneBy({ username: registerDto.username });
        if (userByUsername) {
            throw new BadRequestException('Ce nom d\'utilisateur est déjà utilisé');
        }

        const userByEmail = await this.usersRepository.findOneBy({ email: registerDto.email });
        if (userByEmail) {
            throw new BadRequestException('Cette adresse email est déjà utilisée');
        }

        // 2. Create User
        const passwordHash = await this.hashPassword(registerDto.password);
        const user = new User();
        user.username = registerDto.username;
        user.email = registerDto.email;
        user.passwordHash = passwordHash;
        const savedUser = await this.usersRepository.save(user);

        // 3. Handle Country
        let country: Country | null = null;
        if (registerDto.countryId) {
            country = await this.countriesRepository.findOneBy({ id: registerDto.countryId });
            if (!country) throw new BadRequestException('Invalid Country ID');
        } else if (registerDto.newCountryName) {
            // Check if exists by name
            country = await this.countriesRepository.findOneBy({ name: registerDto.newCountryName });
            if (!country) {
                const newCountry = new Country();
                newCountry.name = registerDto.newCountryName;
                newCountry.code = registerDto.newCountryName.substring(0, 3).toUpperCase(); // Simple code generation
                country = await this.countriesRepository.save(newCountry);
            }
        } else {
            // Fallback to Japan
            country = await this.countriesRepository.findOneBy({ name: 'Japan' });
            if (!country) throw new BadRequestException('Default country "Japan" not found. Please select a country.');
        }

        // 4. Create Group
        const group = new Group();
        group.name = `Voyage ${country.name}`;
        group.country = country;
        const savedGroup = await this.groupsRepository.save(group);

        // 5. Assign User as Admin
        const member = new GroupMember();
        member.user = savedUser;
        member.group = savedGroup;
        member.role = GroupRole.ADMIN;
        await this.groupMembersRepository.save(member);

        return this.login({ username: savedUser.username, password: registerDto.password });
    }

    async hashPassword(password: string): Promise<string> {
        const salt = await bcrypt.genSalt(10);
        return bcrypt.hash(password, salt);
    }
}
