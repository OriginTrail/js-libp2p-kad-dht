import { pipe } from 'it-pipe';
import * as lp from 'it-length-prefixed';
import { logger } from '@libp2p/logger';
import { Message, MESSAGE_TYPE } from '../message/index.js';
import { AddProviderHandler } from './handlers/add-provider.js';
import { FindNodeHandler } from './handlers/find-node.js';
import { GetProvidersHandler } from './handlers/get-providers.js';
import { GetValueHandler } from './handlers/get-value.js';
import { PingHandler } from './handlers/ping.js';
import { PutValueHandler } from './handlers/put-value.js';
export class RPC {
    constructor(init) {
        const { providers, peerRouting, validators, lan } = init;
        this.log = logger('libp2p:kad-dht:rpc');
        this.routingTable = init.routingTable;
        this.handlers = {
            [MESSAGE_TYPE.GET_VALUE]: new GetValueHandler({ peerRouting }),
            [MESSAGE_TYPE.PUT_VALUE]: new PutValueHandler({ validators }),
            [MESSAGE_TYPE.FIND_NODE]: new FindNodeHandler({ peerRouting, lan }),
            [MESSAGE_TYPE.ADD_PROVIDER]: new AddProviderHandler({ providers }),
            [MESSAGE_TYPE.GET_PROVIDERS]: new GetProvidersHandler({ peerRouting, providers, lan }),
            [MESSAGE_TYPE.PING]: new PingHandler()
        };
    }
    init(components) {
        for (const handler of Object.values(this.handlers)) {
            handler.init(components);
        }
    }
    /**
     * Process incoming DHT messages
     */
    async handleMessage(peerId, msg) {
        try {
            await this.routingTable.add(peerId);
        }
        catch (err) {
            this.log.error('Failed to update the kbucket store', err);
        }
        // get handler & execute it
        const handler = this.handlers[msg.type];
        if (handler == null) {
            this.log.error(`no handler found for message type: ${msg.type}`);
            return;
        }
        return await handler.handle(peerId, msg);
    }
    /**
     * Handle incoming streams on the dht protocol
     */
    onIncomingStream(data) {
        Promise.resolve().then(async () => {
            const { stream, connection } = data;
            const peerId = connection.remotePeer;
            try {
                await this.routingTable.add(peerId);
            }
            catch (err) {
                this.log.error(err);
            }
            const self = this; // eslint-disable-line @typescript-eslint/no-this-alias
            await pipe(stream, lp.decode(), async function* (source) {
                for await (const msg of source) {
                    // handle the message
                    const desMessage = Message.deserialize(msg);
                    self.log('incoming %s from %p', desMessage.type, peerId);
                    const res = await self.handleMessage(peerId, desMessage);
                    // Not all handlers will return a response
                    if (res != null) {
                        yield res.serialize();
                    }
                }
            }, lp.encode(), stream);
        })
            .catch(err => {
            this.log.error(err);
        });
    }
}
//# sourceMappingURL=index.js.map