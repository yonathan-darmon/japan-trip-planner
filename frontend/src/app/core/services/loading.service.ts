import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class LoadingService {
    private loadingSubject = new BehaviorSubject<boolean>(false);
    private requestCount = 0;

    loading$ = this.loadingSubject.asObservable();

    show() {
        this.requestCount++;
        if (this.requestCount === 1) {
            this.loadingSubject.next(true);
        }
    }

    hide() {
        this.requestCount--;
        if (this.requestCount <= 0) {
            this.requestCount = 0;
            this.loadingSubject.next(false);
        }
    }

    forceHide() {
        this.requestCount = 0;
        this.loadingSubject.next(false);
    }
}
