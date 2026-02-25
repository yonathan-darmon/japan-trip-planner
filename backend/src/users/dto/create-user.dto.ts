import {
    IsString,
    IsNotEmpty,
    IsEnum,
    IsOptional,
    Matches,
    IsEmail,
} from 'class-validator';
import { UserRole } from '../entities/user.entity';

export class CreateUserDto {
    @IsString()
    @IsNotEmpty()
    username: string;

    @IsString()
    @IsNotEmpty()
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, {
        message: 'Le mot de passe doit contenir au moins 1 majuscule, 1 minuscule, 1 chiffre, 1 caractère spécial, et faire 8 caractères minimum'
    })
    password: string;

    @IsEmail()
    @IsNotEmpty()
    @IsOptional()
    @Matches(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, {
        message: 'L\'adresse email doit être au format valide (ex: nom@domaine.com)'
    })
    email?: string;

    @IsEnum(UserRole)
    @IsOptional()
    role?: UserRole;
}
