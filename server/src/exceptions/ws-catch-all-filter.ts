import { ArgumentsHost, BadRequestException, Catch, ExceptionFilter } from '@nestjs/common';
import { SocketWithAuth } from 'src/polls/types';
import { WsBadRequestException, WsTypeException, WsUnknownException } from './ws-exceptions';

@Catch()
export class WsCatchAllFilter implements ExceptionFilter {
    catch(exception: unknown, host: ArgumentsHost) {
        const socket: SocketWithAuth = host.switchToWs().getClient();

        if (exception instanceof BadRequestException) {
            const exceptionData = exception.getResponse();

            const exceptionMessage =
                (typeof exceptionData === 'object' && exceptionData !== null && 'message' in exceptionData ? exceptionData['message'] : null) ?? exceptionData ?? exception.name;

            const wsException = new WsBadRequestException(exceptionMessage);

            socket.emit('exception', wsException.getError());
            return;
        }

        const msg = exception instanceof Error ? exception.message : 'Unknown error';


        if (exception instanceof WsTypeException){
            socket.emit('exception', exception.getError());
            return;
        }

        const wsException = new WsUnknownException(msg);
        socket.emit('exception', wsException.getError());
    }
}