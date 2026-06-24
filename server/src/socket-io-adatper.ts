import { INestApplicationContext, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { Server, ServerOptions } from 'socket.io';
import { SocketWithAuth } from './polls/types';
import { Socket } from 'socket.io';

export class SocketIOAdapter extends IoAdapter {
  private readonly logger = new Logger(SocketIOAdapter.name);
  constructor(
    private app: INestApplicationContext,
    private configService: ConfigService,
  ) {
    super(app);
  }

  createIOServer(port: number, options?: ServerOptions) {
    const clientPort = parseInt(this.configService.get<string>('CLIENT_PORT') ?? '0', 10);

    const cors = {
      origin: [
        `http://localhost:${clientPort}`,
        new RegExp(`/^http:\/\/192\.168\.1\.([1-9]|[1-9]\d):${clientPort}$/`),
      ],
    };

    this.logger.log('Configuring SocketIO server with custom CORS options', {
      cors,
    });

    const optionsWithCORS = {
      ...(options as ServerOptions),
      cors,
    } as ServerOptions;

    const jwtService = this.app.get(JwtService);
    const server: Server = super.createIOServer(port, optionsWithCORS);

    server.of('polls').use(createTokenMiddleware(jwtService, this.logger));

    return server;
  }
}


const createTokenMiddleware =
  (jwtService: JwtService, logger: Logger) =>
    (socket: Socket, next: (err?: Error) => void) => {

      try {
        const token =
          socket.handshake.auth.token ||
          socket.handshake.headers['token'];

        logger.debug(`Validating auth token before connection: ${token}`);

        const payload = jwtService.verify(token);

        const authSocket = socket as SocketWithAuth;

        authSocket.userID = payload.sub;
        authSocket.pollID = payload.pollID;
        authSocket.name = payload.name;

        next();
      } catch {
        next(new Error('FORBIDDEN'));
      }
    };
