import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDefined,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { FileCategory, FileType, FileVisibility } from '../enum/file.enum';

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

export class FileCreateBodyDto {
  @ApiProperty({ enum: FileCategory, description: 'File type' })
  @IsEnum(FileCategory)
  file_category: FileCategory;
}

export class FileUploadDto {
  @ApiProperty({ example: 1 })
  @IsDefined()
  id: number;

  @ApiProperty({ example: 'test' })
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  original_name: string;

  @ApiProperty({ example: 'test' })
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  file_name: string;

  @ApiProperty({ example: 'test' })
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  file_path: string;

  @ApiProperty({ example: 'test' })
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  mime_typem: string;

  @ApiProperty({ example: 'test' })
  @IsOptional()
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  download_count: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsNotEmpty()
  @IsBoolean()
  public?: boolean;

  @ApiPropertyOptional({ example: 'test' })
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  public_url?: string;

  @ApiProperty({ example: 'test' })
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  file_extension: string;

  @ApiProperty({ enum: FileType, description: 'File type' })
  @IsOptional()
  @IsNotEmpty()
  @IsEnum(FileType)
  file_type: FileType;

  @ApiProperty({ enum: FileCategory, description: 'File Category' })
  @IsOptional()
  @IsNotEmpty()
  @IsEnum(FileCategory)
  file_category: FileCategory;

  @ApiProperty({ example: 1 })
  @IsOptional()
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  file_size: number;

  @ApiPropertyOptional({ enum: FileVisibility, description: 'File visibility' })
  @IsOptional()
  @IsNotEmpty()
  @IsEnum(FileVisibility)
  visibility?: FileVisibility;
}

// export class FileFilterDto {
//   @ApiPropertyOptional({ description: 'Uploaded by user ID' })
//   @IsOptional()
//   @IsUUID()
//   uploaded_by?: string;
//
//   @ApiPropertyOptional({ enum: FileType, description: 'File type' })
//   @IsOptional()
//   @IsEnum(FileType)
//   file_type?: FileType;
//
//   @ApiPropertyOptional({ enum: FileCategory, description: 'File categories' })
//   @IsOptional()
//   @IsEnum(FileCategory)
//   categories?: FileCategory;
//
//   @ApiPropertyOptional({ enum: FileStatus, description: 'File status' })
//   @IsOptional()
//   @IsEnum(FileStatus)
//   status?: FileStatus;
//
//   @ApiPropertyOptional({ enum: FileVisibility, description: 'File visibility' })
//   @IsOptional()
//   @IsEnum(FileVisibility)
//   visibility?: FileVisibility;
//
//   @ApiPropertyOptional({ description: 'Search query' })
//   @IsOptional()
//   @IsString()
//   search?: string;
//
//   @ApiPropertyOptional({ description: 'Tags to filter by' })
//   @IsOptional()
//   @IsArray()
//   @IsString({ each: true })
//   tags?: string[];
//
//   @ApiPropertyOptional({ description: 'Minimum file size' })
//   @IsOptional()
//   @IsNumber()
//   @Min(0)
//   min_size?: number;
//
//   @ApiPropertyOptional({ description: 'Maximum file size' })
//   @IsOptional()
//   @IsNumber()
//   @Min(0)
//   max_size?: number;
//
//   @ApiPropertyOptional({ description: 'Start date' })
//   @IsOptional()
//   start_date?: Date;
//
//   @ApiPropertyOptional({ description: 'End date' })
//   @IsOptional()
//   end_date?: Date;
//
//   @ApiPropertyOptional({ description: 'Is temporary' })
//   @IsOptional()
//   @IsBoolean()
//   is_temporary?: boolean;
//
//   @ApiPropertyOptional({ description: 'Page number', default: 1 })
//   @IsOptional()
//   @IsNumber()
//   @Min(1)
//   page?: number = 1;
//
//   @ApiPropertyOptional({ description: 'Items per page', default: 20 })
//   @IsOptional()
//   @IsNumber()
//   @Min(1)
//   @Max(100)
//   limit?: number = 20;
//
//   @ApiPropertyOptional({ description: 'Sort by field', default: 'created_at' })
//   @IsOptional()
//   @IsString()
//   sort_by?: string = 'created_at';
//
//   @ApiPropertyOptional({ description: 'Sort order', default: 'DESC' })
//   @IsOptional()
//   @IsString()
//   sort_order?: 'ASC' | 'DESC' = 'DESC';
// }
//
// export class BulkFileOperationDto {
//   @ApiProperty({ description: 'File IDs', type: [String] })
//   @IsArray()
//   @IsUUID('all', { each: true })
//   file_ids: string[];
//
//   @ApiProperty({ description: 'Operation type' })
//   @IsEnum([
//     'delete',
//     'update_visibility',
//     'update_status',
//     'add_tags',
//     'remove_tags',
//   ])
//   operation:
//     | 'delete'
//     | 'update_visibility'
//     | 'update_status'
//     | 'add_tags'
//     | 'remove_tags';
//
//   @ApiPropertyOptional({ description: 'Operation data' })
//   @IsOptional()
//   @IsObject()
//   data?: Record<string, any>;
// }
//
// export class FileStatsDto {
//   @ApiPropertyOptional({ description: 'Start date' })
//   @IsOptional()
//   start_date?: Date;
//
//   @ApiPropertyOptional({ description: 'End date' })
//   @IsOptional()
//   end_date?: Date;
//
//   @ApiPropertyOptional({ description: 'Group by period (day, week, month)' })
//   @IsOptional()
//   @IsString()
//   group_by?: 'day' | 'week' | 'month';
//
//   @ApiPropertyOptional({ description: 'User ID for user-specific stats' })
//   @IsOptional()
//   @IsUUID()
//   user_id?: string;
// }
//
// export class FileUploadConfigDto {
//   @ApiProperty({ description: 'Maximum file size in bytes' })
//   @IsNumber()
//   @Min(1)
//   max_file_size: number;
//
//   @ApiProperty({ description: 'Allowed file types' })
//   @IsArray()
//   @IsString({ each: true })
//   allowed_types: string[];
//
//   @ApiProperty({ description: 'Allowed MIME types' })
//   @IsArray()
//   @IsString({ each: true })
//   allowed_mime_types: string[];
//
//   @ApiPropertyOptional({ description: 'Image quality for compression (1-100)' })
//   @IsOptional()
//   @IsNumber()
//   @Min(1)
//   @Max(100)
//   image_quality?: number;
//
//   @ApiPropertyOptional({ description: 'Generate thumbnails' })
//   @IsOptional()
//   @IsBoolean()
//   generate_thumbnails?: boolean;
//
//   @ApiPropertyOptional({ description: 'Thumbnail sizes' })
//   @IsOptional()
//   @IsArray()
//   thumbnail_sizes?: { width: number; height: number; suffix: string }[];
// }
//
// export class ChunkedUploadDto {
//   @ApiProperty({ description: 'Chunk number' })
//   @IsNumber()
//   @Min(0)
//   chunk_number: number;
//
//   @ApiProperty({ description: 'Total chunks' })
//   @IsNumber()
//   @Min(1)
//   total_chunks: number;
//
//   @ApiProperty({ description: 'Chunk size' })
//   @IsNumber()
//   @Min(1)
//   chunk_size: number;
//
//   @ApiProperty({ description: 'Total file size' })
//   @IsNumber()
//   @Min(1)
//   total_size: number;
//
//   @ApiProperty({ description: 'Upload session ID' })
//   @IsString()
//   upload_session_id: string;
//
//   @ApiProperty({ description: 'File name' })
//   @IsString()
//   file_name: string;
//
//   @ApiPropertyOptional({ description: 'File hash for verification' })
//   @IsOptional()
//   @IsString()
//   file_hash?: string;
// }
