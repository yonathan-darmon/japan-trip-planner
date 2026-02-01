import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class S3Service {
    private s3Client: S3Client;
    private bucketName: string;

    constructor(private configService: ConfigService) {
        this.bucketName = this.configService.get('SCALEWAY_BUCKET_NAME') || '';

        this.s3Client = new S3Client({
            region: this.configService.get('SCALEWAY_REGION') || '',
            endpoint: this.configService.get('SCALEWAY_ENDPOINT') || '',
            credentials: {
                accessKeyId: this.configService.get('SCALEWAY_ACCESS_KEY') || '',
                secretAccessKey: this.configService.get('SCALEWAY_SECRET_KEY') || '',
            },
            forcePathStyle: true, // Needed for Scaleway
        });
    }

    async uploadFile(file: Express.Multer.File): Promise<string> {
        if (!file) return '';

        // Check if Scaleway is configured
        const accessKey = this.configService.get('SCALEWAY_ACCESS_KEY');
        const secretKey = this.configService.get('SCALEWAY_SECRET_KEY');

        if (!accessKey || !secretKey || accessKey.includes('your-scaleway-access-key')) {
            console.warn('⚠️ Scaleway credentials not configured. Skipping S3 upload.');
            // Return a placeholder image for testing
            return 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=2070&auto=format&fit=crop';
        }

        const fileExtension = file.originalname.split('.').pop();
        const fileName = `${uuidv4()}.${fileExtension}`;

        try {
            await this.s3Client.send(
                new PutObjectCommand({
                    Bucket: this.bucketName,
                    Key: fileName,
                    Body: file.buffer,
                    ContentType: file.mimetype,
                    ACL: 'public-read', // Make file publicly accessible
                }),
            );

            // Construct public URL
            const region = this.configService.get('SCALEWAY_REGION');
            const endpoint = this.configService.get('SCALEWAY_ENDPOINT').replace('https://', '');
            return `https://${this.bucketName}.${endpoint}/${fileName}`;
        } catch (error) {
            console.error('S3 Upload Error:', error);
            // Don't crash the request if image upload fails
            return '';
        }
    }
}
