export declare const storageConfig: (() => {
    provider: string;
    uploadPath: string;
    awsRegion: string;
    s3Bucket: string;
}) & import("@nestjs/config").ConfigFactoryKeyHost<{
    provider: string;
    uploadPath: string;
    awsRegion: string;
    s3Bucket: string;
}>;
