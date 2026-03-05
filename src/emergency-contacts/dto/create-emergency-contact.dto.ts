import { IsNumber, IsOptional, IsString } from 'class-validator';
import { SanitizeInput, TrimOnly } from '../../decorators/sanitize-input.decorator';

export class CreateEmergencyContactDto {
  @IsNumber()
  userId: number;

  @IsOptional()
  @IsString()
  @TrimOnly()
  bloodType?: string;

  @IsOptional()
  @IsString()
  @TrimOnly()
  emergencyPhone?: string;

  @IsOptional()
  @IsString()
  @SanitizeInput()
  emergencyContactName?: string;

  @IsOptional()
  @IsString()
  @TrimOnly()
  allergies?: string;
}
