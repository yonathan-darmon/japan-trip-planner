import { IsArray, ValidateNested, IsInt, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';

class DayActivitiesDto {
    @IsInt()
    dayNumber: number;

    @IsArray()
    activities: {
        suggestionId: number;
        orderInDay: number;
    }[];
}

export class ReorderAllDaysDto {
    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type(() => DayActivitiesDto)
    days: DayActivitiesDto[];
}
