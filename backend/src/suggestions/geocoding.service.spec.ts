import { Test, TestingModule } from '@nestjs/testing';
import { GeocodingService } from './geocoding.service';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('GeocodingService', () => {
    let service: GeocodingService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [GeocodingService],
        }).compile();

        service = module.get<GeocodingService>(GeocodingService);
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('getCoordinates', () => {
        it('should append context to query', async () => {
            mockedAxios.get.mockResolvedValueOnce({
                data: {
                    features: [
                        {
                            geometry: { coordinates: [139.6917, 35.6895] },
                            properties: { name: 'Tokyo' },
                        },
                    ],
                },
            });

            await service.getCoordinates('Tokyo', 'Japan');

            expect(mockedAxios.get).toHaveBeenCalledWith(
                expect.stringContaining('photon'),
                expect.objectContaining({
                    params: expect.objectContaining({
                        q: 'Tokyo, Japan',
                    }),
                }),
            );
        });

        it('should use countrycodes=jp for Nominatim when context is Japan', async () => {
            // Fail Photon first to trigger Nominatim
            mockedAxios.get.mockRejectedValueOnce(new Error('Photon failed'));

            mockedAxios.get.mockResolvedValueOnce({
                data: [
                    {
                        lat: '35.6895',
                        lon: '139.6917',
                        display_name: 'Tokyo, Japan'
                    }
                ]
            });

            await service.getCoordinates('Tokyo', 'Japan');

            expect(mockedAxios.get).toHaveBeenCalledTimes(2); // Photon then Nominatim
            expect(mockedAxios.get).toHaveBeenNthCalledWith(2,
                expect.stringContaining('nominatim'),
                expect.objectContaining({
                    params: expect.objectContaining({
                        countrycodes: 'jp'
                    })
                })
            );
        });

        it('should NOT use countrycodes for other contexts', async () => {
            // Fail Photon first
            mockedAxios.get.mockRejectedValueOnce(new Error('Photon failed'));

            mockedAxios.get.mockResolvedValueOnce({
                data: []
            });

            await service.getCoordinates('Paris', 'France');

            expect(mockedAxios.get).toHaveBeenNthCalledWith(2,
                expect.stringContaining('nominatim'),
                expect.objectContaining({
                    params: expect.not.objectContaining({
                        countrycodes: 'jp'
                    })
                })
            );
        });
    });
});
