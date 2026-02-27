import { IsInt, IsNotEmpty, IsString, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class ConfirmPaymentDto {
  @IsNotEmpty()
  @IsString()
  ref_year: string;

  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  ref_month: number;
}
