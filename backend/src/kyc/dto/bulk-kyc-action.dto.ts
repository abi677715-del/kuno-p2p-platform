import { ArrayMinSize, IsArray, IsString } from 'class-validator';

export class BulkKycActionDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  ids: string[];
}
