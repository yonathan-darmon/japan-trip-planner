import {
    WebSocketGateway,
    WebSocketServer,
    OnGatewayInit,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
    cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:4200',
        credentials: true,
    },
    namespace: 'sync',
})
export class SyncGateway
    implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private logger: Logger = new Logger('SyncGateway');

    afterInit(server: Server) {
        this.logger.log('SyncGateway Initialized! 🔌');
    }

    handleConnection(client: Socket, ...args: any[]) {
        this.logger.log(`Client connected: ${client.id}`);
    }

    handleDisconnect(client: Socket) {
        this.logger.log(`Client disconnected: ${client.id}`);
    }

    // --- Broadcast Methods ---

    sendSuggestionUpdate(action: 'create' | 'update' | 'delete', data: any) {
        this.logger.log(`Broadcasting suggestion ${action}: ${data.id}`);
        this.server.emit('suggestion_change', { action, data });
    }

    sendVoteUpdate(suggestionId: number, data: any) {
        this.logger.log(`Broadcasting vote update for suggestion: ${suggestionId}`);
        this.server.emit('vote_change', { suggestionId, data });
    }

    sendPreferencesUpdate(userId: number, data: any) {
        // Optionally target specific room for user, but global for now is fine for MVP group trip
        this.server.emit('preference_change', { userId, data });
    }
}
