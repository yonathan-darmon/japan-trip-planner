import { IsInt, IsArray, ArrayMinSize } from 'class-validator';

export class ReorderActivitiesDto {
    @IsInt()
    dayNumber: number;

    @IsArray()
    @ArrayMinSize(1)
    newOrder: number[]; // Array of suggestion IDs in new order
}
