import { Server } from 'ws';
import { Subject } from 'rxjs';
import { Logger } from '@nestjs/common';
import * as moment from 'moment';
export const LogSubscribe = new Subject<string>();
export const SocketProviders = [
    {
        provide: 'SOCKET_CONNECTION',
        useFactory: async () => {
            const logger = new Logger();
            logger.log('Start socket successfully!', 'Socket');
            const connection = new Server({
                port: 3002,
            });

            connection.on('connection', ws => {
                console.log('CLIENT CONNECTED');
                ws.on('message', data => {
                    // console.log(data);
                });
                LogSubscribe.subscribe(data => {
                    // console.log(data);
                    ws.send(moment().format('DD-MM-YYYY HH:mm') + ' - ' + data);
                });
            });
        },
    },
];
