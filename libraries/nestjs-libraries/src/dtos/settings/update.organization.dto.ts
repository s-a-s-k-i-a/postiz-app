import { IsString, MinLength, ValidateIf } from 'class-validator';

export class UpdateOrganizationDto {
  @ValidateIf((_, value) => value !== undefined)
  @IsString()
  @MinLength(2)
  name?: string;

  @ValidateIf((_, value) => value !== undefined && value !== null)
  @IsString()
  logo?: string | null;
}
