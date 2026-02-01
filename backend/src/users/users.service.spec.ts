import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { AuthService } from '../auth/auth.service';
import { S3Service } from '../storage/s3.service';

describe('UsersService', () => {
    let service: UsersService;
    let s3Service: S3Service;

    const mockUserRepository = {
        findOneBy: jest.fn(),
        update: jest.fn(),
        save: jest.fn(),
    };

    const mockAuthService = {
        hashPassword: jest.fn(),
    };

    const mockS3Service = {
        uploadFile: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UsersService,
                {
                    provide: getRepositoryToken(User),
                    useValue: mockUserRepository,
                },
                {
                    provide: AuthService,
                    useValue: mockAuthService,
                },
                {
                    provide: S3Service,
                    useValue: mockS3Service,
                },
            ],
        }).compile();

        service = module.get<UsersService>(UsersService);
        s3Service = module.get<S3Service>(S3Service);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('uploadAvatar', () => {
        it('should upload file and update user avatar url', async () => {
            const userId = 1;
            const file = { buffer: Buffer.from('test') } as any;
            const avatarUrl = 'https://s3.example.com/avatar.jpg';

            mockS3Service.uploadFile.mockResolvedValue(avatarUrl);
            mockUserRepository.update.mockResolvedValue({ affected: 1 });
            mockUserRepository.findOneBy.mockResolvedValue({ id: 1, avatarUrl });

            const result = await service.uploadAvatar(userId, file);

            expect(mockS3Service.uploadFile).toHaveBeenCalledWith(file);
            expect(mockUserRepository.update).toHaveBeenCalledWith(userId, { avatarUrl });
            expect(result.avatarUrl).toEqual(avatarUrl);
        });

        it('should throw error if upload fails', async () => {
            mockS3Service.uploadFile.mockResolvedValue('');

            await expect(service.uploadAvatar(1, {} as any)).rejects.toThrow('Image upload failed');
        });
    });
});
