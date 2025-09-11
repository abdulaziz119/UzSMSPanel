import { ApiProperty } from '@nestjs/swagger';
export class FileUploadResponseDto {
  @ApiProperty({
    example: true,
    description: 'Success status',
  })
  success: boolean;

  @ApiProperty({
    example: 'File uploaded successfully',
    description: 'Response message',
  })
  message: string;

  @ApiProperty({
    type: 'object',
    properties: {
      url: {
        type: 'string',
        example: '/public/uuid-generated-name.jpg',
      },
    },
  })
  data: {
    url: string;
  };
}
