import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import * as bcrypt from 'bcrypt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { AuthService } from '../auth/auth.service';
import { S3Service } from '../storage/s3.service';

jest.mock('bcrypt', () => ({
    compare: jest.fn(),
}));

describe('UsersService', () => {
    let service: UsersService;
    let s3Service: S3Service;

    const mockUserRepository = {
        findOne: jest.fn(),
        findOneBy: jest.fn(),
        update: jest.fn(),
        save: jest.fn(),
        delete: jest.fn(),
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

    describe('remove', () => {
        it('should delete a user for id != 1', async () => {
            mockUserRepository.delete = jest.fn().mockResolvedValue({ affected: 1 });
            await service.remove(2);
            expect(mockUserRepository.delete).toHaveBeenCalledWith(2);
        });

        it('should block deleting the primary super admin account (id: 1)', async () => {
            await expect(service.remove(1)).rejects.toThrow('Cannot delete the primary super admin account');
        });
    });

    describe('updatePassword', () => {
        const updatePasswordDto = { oldPassword: 'old', newPassword: 'new' };

        afterEach(() => {
            jest.restoreAllMocks();
        });

        it('should throw if user not found', async () => {
            mockUserRepository.findOneBy.mockResolvedValue(null);
            await expect(service.updatePassword(99, updatePasswordDto)).rejects.toThrow('Utilisateur introuvable.');
        });

        it('should throw if old password does not match', async () => {
            mockUserRepository.findOneBy.mockResolvedValue({ id: 1, passwordHash: 'hashedOld' });
            (bcrypt.compare as jest.Mock).mockResolvedValue(false);

            await expect(service.updatePassword(1, updatePasswordDto)).rejects.toThrow('L\'ancien mot de passe est incorrect.');
        });

        it('should update password and hash the new one', async () => {
            mockUserRepository.findOneBy.mockResolvedValue({ id: 1, passwordHash: 'hashedOld' });
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);
            mockAuthService.hashPassword.mockResolvedValue('hashedNew');
            mockUserRepository.update.mockResolvedValue({ affected: 1 });

            await service.updatePassword(1, updatePasswordDto);

            expect(mockAuthService.hashPassword).toHaveBeenCalledWith('new');
            expect(mockUserRepository.update).toHaveBeenCalledWith(1, { passwordHash: 'hashedNew' });
        });
    });
});
