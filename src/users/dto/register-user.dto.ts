import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { SanitizeInput, TrimOnly } from '../../decorators/sanitize-input.decorator';

export class RegisterUserDto {
  @IsNotEmpty()
  @IsString()
  @SanitizeInput()
  name: string;

  @IsNotEmpty()
  @IsString()
  @TrimOnly()
  cpf: string;

  @IsNotEmpty()
  @IsEmail()
  @TrimOnly()
  email: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password: string;

  @IsOptional()
  @IsString()
  @TrimOnly()
  cellphone?: string;

  @IsOptional()
  agreeStatute?: boolean;

  @IsOptional()
  agreeRI?: boolean;

  @IsOptional()
  agreeLGPD?: boolean;
}
