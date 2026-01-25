import { IsNumber, IsDateString, IsOptional, Min, Max } from 'class-validator';

export class UpdateTripConfigDto {
    @IsNumber()
    @IsOptional()
    @Min(1)
    @Max(365) // Max 1 year
    durationDays?: number;

    @IsDateString()
    @IsOptional()
    startDate?: string;

    @IsDateString()
    @IsOptional()
    endDate?: string;
}
