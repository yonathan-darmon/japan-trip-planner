import { IsString, IsNotEmpty, IsEmail, MinLength, IsOptional, IsNumber, Matches } from 'class-validator';

export class RegisterDto {
    @IsString()
    @IsNotEmpty()
    username: string;

    @IsEmail()
    @IsNotEmpty()
    @Matches(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, {
        message: 'L\'adresse email doit être au format valide (ex: nom@domaine.com)'
    })
    email: string;

    @IsString()
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, {
        message: 'Le mot de passe doit contenir au moins 1 majuscule, 1 minuscule, 1 chiffre, 1 caractère spécial, et faire 8 caractères minimum'
    })
    password: string;

    @IsNumber()
    @IsOptional()
    countryId?: number;

    @IsString()
    @IsOptional()
    newCountryName?: string;

    @IsNumber()
    @IsOptional()
    inviteGroupId?: number;
}
