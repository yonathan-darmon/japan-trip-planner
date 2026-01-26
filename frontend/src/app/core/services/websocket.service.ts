import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class WebSocketService {
    private socket: Socket;

    constructor() {
        this.socket = io(environment.wsUrl + '/sync', {
            transports: ['websocket'],
            autoConnect: true,
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 1000,
        });

        this.socket.on('connect', () => {
            console.log('🟢 Connected to WebSocket Server');
        });

        this.socket.on('disconnect', () => {
            console.log('🔴 Disconnected from WebSocket Server');
        });

        this.socket.on('connect_error', (err) => {
            console.error('⚠️ WebSocket connection error:', err);
        });
    }

    // Generic listener for any event
    on<T>(eventName: string): Observable<T> {
        return new Observable<T>(observer => {
            // Setup listener
            const handler = (data: T) => observer.next(data);
            this.socket.on(eventName, handler);

            // Cleanup
            return () => {
                this.socket.off(eventName, handler);
            };
        });
    }

    // Specific events for easier usage
    onSuggestionChange(): Observable<{ action: 'create' | 'update' | 'delete', data: any }> {
        return this.on('suggestion_change');
    }

    onVoteChange(): Observable<{ suggestionId: number, data: any }> {
        return this.on('vote_change');
    }
}
