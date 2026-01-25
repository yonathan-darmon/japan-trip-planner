import {
    IsString,
    IsNotEmpty,
    IsOptional,
    IsNumber,
    IsEnum,
    Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SuggestionCategory } from '../entities/suggestion.entity';

export class CreateSuggestionDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    location: string;

    @IsString()
    @IsOptional()
    description?: string;

    @Type(() => Number)
    @IsNumber()
    @Min(0)
    @IsOptional()
    price?: number;

    @IsEnum(SuggestionCategory)
    @IsNotEmpty()
    category: SuggestionCategory;
}
