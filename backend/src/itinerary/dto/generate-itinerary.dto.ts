import { IsString, IsOptional, IsInt, Min, Max } from 'class-validator';

export class GenerateItineraryDto {
    @IsString()
    @IsOptional()
    name?: string;

    @IsInt()
    @Min(1)
    @Max(10)
    @IsOptional()
    maxActivitiesPerDay?: number = 4;

    @IsInt()
    @IsOptional()
    groupId?: number;
}
