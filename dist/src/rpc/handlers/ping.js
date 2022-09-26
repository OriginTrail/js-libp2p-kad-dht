import { logger } from '@libp2p/logger';
const log = logger('libp2p:kad-dht:rpc:handlers:ping');
export class PingHandler {
    async handle(peerId, msg) {
        log('ping from %p', peerId);
        return msg;
    }
    init() {
    }
}
//# sourceMappingURL=ping.js.map