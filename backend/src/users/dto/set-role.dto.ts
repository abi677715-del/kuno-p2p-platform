import { IsIn } from 'class-validator';

/**
 * Deliberately excludes ADMIN — promoting someone to full admin isn't
 * something this endpoint should be able to do; that stays a manual/
 * bootstrap-only action so there's no API path to mint new admins.
 */
export class SetRoleDto {
  @IsIn(['USER', 'SUPPORT'])
  role: 'USER' | 'SUPPORT';
}
