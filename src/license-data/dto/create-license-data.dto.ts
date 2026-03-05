import { IsDate, IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { SanitizeInput, TrimOnly } from '../../decorators/sanitize-input.decorator';

export class CreateLicenseDataDto {
  @IsNumber()
  userId: number;

  @IsOptional()
  @IsString()
  @TrimOnly()
  civl?: string;

  @IsOptional()
  @IsString()
  @SanitizeInput()
  pilotLevel?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  cbvlExpiration?: Date;

  @IsOptional()
  @IsString()
  @TrimOnly()
  imgCbvl?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  anacExpiration?: Date;

  @IsOptional()
  @IsString()
  @TrimOnly()
  imgAnac?: string;
}
