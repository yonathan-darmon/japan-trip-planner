import { Injectable } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';

@Injectable({
    providedIn: 'root'
})
export class SeoService {
    constructor(private title: Title, private meta: Meta) { }

    /**
     * Updates standard and social media tags for SEO purposes.
     * @param title The page title
     * @param description The page description
     * @param imageUrl Optional image URL for social sharing
     */
    updateMetaTags(title: string, description: string, imageUrl?: string): void {
        // Standard tags
        this.title.setTitle(`Japan Trip Planner - ${title}`);
        this.meta.updateTag({ name: 'description', content: description });

        // Open Graph (Facebook/LinkedIn)
        this.meta.updateTag({ property: 'og:title', content: `Japan Trip Planner - ${title}` });
        this.meta.updateTag({ property: 'og:description', content: description });
        this.meta.updateTag({ property: 'og:type', content: 'website' });
        if (imageUrl) {
            this.meta.updateTag({ property: 'og:image', content: imageUrl });
        }

        // Twitter Card
        this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
        this.meta.updateTag({ name: 'twitter:title', content: `Japan Trip Planner - ${title}` });
        this.meta.updateTag({ name: 'twitter:description', content: description });
        if (imageUrl) {
            this.meta.updateTag({ name: 'twitter:image', content: imageUrl });
        }
    }
}
