import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { Priority } from '../entities/user-preference.entity';

export class UpdatePreferenceDto {
    @IsBoolean()
    @IsOptional()
    selected?: boolean;

    @IsEnum(Priority)
    @IsOptional()
    priority?: Priority;
}
