import { IsNotEmpty, IsInt, IsString, Min, Max, IsOptional, IsArray, ValidateNested, IsNumber, IsEnum, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { TrimOnly } from '../../decorators/sanitize-input.decorator';

export class ConfirmPaymentDto {
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  userId: number;

  @IsNotEmpty()
  @IsString()
  @TrimOnly()
  ref_year: string;

  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  ref_month: number;
}

export class ConfirmPaymentBatchItemDto {
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  userId: number;

  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  ref_year: number;

  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  ref_month: number;
}

export class ConfirmPaymentBatchDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConfirmPaymentBatchItemDto)
  payments: ConfirmPaymentBatchItemDto[];
}

export class CreatePaymentMonthlyDto {
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  userId: number;

  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  ref_month: number;

  @IsNotEmpty()
  @IsString()
  @IsEnum(['mensal', 'trimestral', 'semestral', 'anual'])
  type: string;

  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  ref_year: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  date?: string;
}

export class SendReceiptEmailDto {
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  paymentId: number;

  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  userId: number;

  @IsNotEmpty()
  @IsString()
  email: string;

  @IsOptional()
  @IsString()
  pilotName?: string;

  @IsOptional()
  @IsString()
  selectedYear?: string;
}
