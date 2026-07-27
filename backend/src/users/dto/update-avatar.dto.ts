import { IsString, MaxLength, Matches } from 'class-validator';

export class UpdateAvatarDto {
  @IsString()
  @MaxLength(700000, { message: 'Image is too large' })
  @Matches(/^data:image\/(png|jpeg|jpg|webp);base64,/, {
    message: 'Avatar must be a base64 image data URI',
  })
  avatar: string;
}
