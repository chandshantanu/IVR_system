import { ApiProperty } from '@nestjs/swagger';

export class AuthResponseDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT access token',
  })
  accessToken: string;

  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT refresh token',
  })
  refreshToken: string;

  @ApiProperty({
    example: {
      id: 1,
      username: 'admin',
      email: 'admin@ivr-system.com',
      role: 'super_admin',
    },
    description: 'User information',
  })
  user: {
    id: number;
    username: string;
    email: string;
    role: string;
    fullName?: string;
  };
}
