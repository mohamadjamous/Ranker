import { BadRequestException, Logger, UseFilters, UsePipes, ValidationPipe } from '@nestjs/common';
import {
    OnGatewayConnection, 
    OnGatewayDisconnect, 
    OnGatewayInit, 
    SubscribeMessage, 
    WebSocketGateway, 
    WebSocketServer,
    WsException} from '@nestjs/websockets';
import { Namespace, Socket } from 'socket.io';
import { Client } from 'socket.io/dist/client';
import {PollsService} from './polls.service';
import { SocketWithAuth } from './types';
import { WsBadRequestException } from 'src/exceptions/ws-exceptions';
import { WsCatchAllFilter } from 'src/exceptions/ws-catch-all-filter';


@UsePipes(new ValidationPipe())
@UseFilters(new WsCatchAllFilter())
@WebSocketGateway({
    namespace: 'polls',
})
export class PollsGateway implements
 OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {

    private readonly logger = new Logger(PollsGateway.name);
    constructor (private readonly pollsSerivce: PollsService) {}

    @WebSocketServer() io: Namespace;
    
    afterInit(): void {
        this.logger.log(`Websocket Gateway initialized.`);
    }

    handleConnection(client: SocketWithAuth) {

        const sockets = this.io.sockets;

        this.logger.log(
            `Socket connected with userID: ${client.userID}, pollID ${client.pollID}
            , and name: ${client.name}`,
        );

        this.logger.log(`WS Client with id: ${client.id} connected!`);
        this.logger.debug(`Number of connected sockets: ${sockets.size}`);

        this.io.emit('hello', `from ${client.id}`);
    }


    handleDisconnect(client: SocketWithAuth) {

        const sockets = this.io.sockets;

        this.logger.log(
            `Socket connected with userID: ${client.userID}, pollID ${client.pollID}
            , and name: ${client.name}`,
        );

        this.logger.log(`WS Client with id: ${client.id} connected!`);
        this.logger.debug(`Number of connected sockets: ${sockets.size}`);

        // remove client from poll and send participant_updated event to remaining clients 

    }

    @SubscribeMessage('test')
    async test(){
        throw new BadRequestException("string");
    }
}