import { IsEmail, IsOptional, IsString } from 'class-validator';
import { SanitizeInput, TrimOnly } from '../../decorators/sanitize-input.decorator';

export class UpdatePilotProfileDto {
  @IsOptional()
  @IsString()
  @SanitizeInput()
  name?: string;

  @IsOptional()
  @IsString()
  @TrimOnly()
  cellphone?: string;

  @IsOptional()
  @IsEmail()
  @TrimOnly()
  email?: string;

  @IsOptional()
  @IsString()
  @TrimOnly()
  photoUrl?: string;
}
