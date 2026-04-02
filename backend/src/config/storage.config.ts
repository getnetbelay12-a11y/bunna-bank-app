import { registerAs } from '@nestjs/config';

export const storageConfig = registerAs('storage', () => ({
  provider: process.env.STORAGE_PROVIDER ?? 'local',
  uploadPath: process.env.FILE_UPLOAD_PATH ?? 'uploads/',
  awsRegion: process.env.AWS_REGION ?? '',
  s3Bucket: process.env.AWS_S3_BUCKET ?? '',
}));
