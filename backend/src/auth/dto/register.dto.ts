import { IsString, IsNotEmpty, IsEmail, MinLength, IsOptional, IsNumber } from 'class-validator';

export class RegisterDto {
    @IsString()
    @IsNotEmpty()
    username: string;

    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsString()
    @MinLength(6)
    password: string;

    @IsNumber()
    @IsOptional()
    countryId?: number;

    @IsString()
    @IsOptional()
    newCountryName?: string;
}
