import {
    IsString,
    IsNotEmpty,
    MinLength,
    IsEnum,
    IsOptional,
} from 'class-validator';
import { UserRole } from '../entities/user.entity';

export class CreateUserDto {
    @IsString()
    @IsNotEmpty()
    username: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(6)
    password: string;

    @IsEnum(UserRole)
    @IsOptional()
    role?: UserRole;
}
