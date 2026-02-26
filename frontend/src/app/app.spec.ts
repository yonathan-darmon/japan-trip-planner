import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app';
import { SeoService } from './core/services/seo.service';
import { ActivatedRoute } from '@angular/router';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

describe('AppComponent', () => {
  let seoServiceSpy: jasmine.SpyObj<SeoService>;

  beforeEach(async () => {
    seoServiceSpy = jasmine.createSpyObj('SeoService', ['updateMetaTags']);

    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideRouter([]),
        { provide: SeoService, useValue: seoServiceSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            data: of({ title: 'Test Title', description: 'Test Description' }),
            outlet: 'primary'
          }
        }
      ]
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });
});
