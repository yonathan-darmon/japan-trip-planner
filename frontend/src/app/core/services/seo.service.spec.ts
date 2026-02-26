import { TestBed } from '@angular/core/testing';
import { SeoService } from './seo.service';
import { Title, Meta } from '@angular/platform-browser';

describe('SeoService', () => {
    let service: SeoService;
    let titleService: jasmine.SpyObj<Title>;
    let metaService: jasmine.SpyObj<Meta>;

    beforeEach(() => {
        const titleSpy = jasmine.createSpyObj('Title', ['setTitle']);
        const metaSpy = jasmine.createSpyObj('Meta', ['updateTag']);

        TestBed.configureTestingModule({
            providers: [
                SeoService,
                { provide: Title, useValue: titleSpy },
                { provide: Meta, useValue: metaSpy }
            ]
        });
        service = TestBed.inject(SeoService);
        titleService = TestBed.inject(Title) as jasmine.SpyObj<Title>;
        metaService = TestBed.inject(Meta) as jasmine.SpyObj<Meta>;
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should update title and meta tags', () => {
        service.updateMetaTags('Test Page', 'Test Description');

        expect(titleService.setTitle).toHaveBeenCalledWith('Japan Trip Planner - Test Page');
        expect(metaService.updateTag).toHaveBeenCalledWith({ name: 'description', content: 'Test Description' });
        expect(metaService.updateTag).toHaveBeenCalledWith({ property: 'og:title', content: 'Japan Trip Planner - Test Page' });
    });

    it('should update image tags if imageUrl is provided', () => {
        service.updateMetaTags('Test Page', 'Test Description', 'http://example.com/image.png');

        expect(metaService.updateTag).toHaveBeenCalledWith({ property: 'og:image', content: 'http://example.com/image.png' });
        expect(metaService.updateTag).toHaveBeenCalledWith({ name: 'twitter:image', content: 'http://example.com/image.png' });
    });
});
