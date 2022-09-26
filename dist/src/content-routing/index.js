import { Message, MESSAGE_TYPE } from '../message/index.js';
import parallel from 'it-parallel';
import map from 'it-map';
import { convertBuffer } from '../utils.js';
import { ALPHA } from '../constants.js';
import { pipe } from 'it-pipe';
import { queryErrorEvent, peerResponseEvent, providerEvent } from '../query/events.js';
import { logger } from '@libp2p/logger';
import { Components } from '@libp2p/components';
export class ContentRouting {
    constructor(init) {
        this.components = new Components();
        const { network, peerRouting, queryManager, routingTable, providers, lan } = init;
        this.log = logger(`libp2p:kad-dht:${lan ? 'lan' : 'wan'}:content-routing`);
        this.network = network;
        this.peerRouting = peerRouting;
        this.queryManager = queryManager;
        this.routingTable = routingTable;
        this.providers = providers;
    }
    init(components) {
        this.components = components;
    }
    /**
     * Announce to the network that we can provide the value for a given key and
     * are contactable on the given multiaddrs
     */
    async *provide(key, multiaddrs, options = {}) {
        this.log('provide %s', key);
        // Add peer as provider
        await this.providers.addProvider(key, this.components.getPeerId());
        const msg = new Message(MESSAGE_TYPE.ADD_PROVIDER, key.bytes, 0);
        msg.providerPeers = [{
                id: this.components.getPeerId(),
                multiaddrs,
                protocols: []
            }];
        let sent = 0;
        const maybeNotifyPeer = (event) => {
            return async () => {
                if (event.name !== 'FINAL_PEER') {
                    return [event];
                }
                const events = [];
                this.log('putProvider %s to %p', key, event.peer.id);
                try {
                    this.log('sending provider record for %s to %p', key, event.peer.id);
                    for await (const sendEvent of this.network.sendMessage(event.peer.id, msg, options)) {
                        if (sendEvent.name === 'PEER_RESPONSE') {
                            this.log('sent provider record for %s to %p', key, event.peer.id);
                            sent++;
                        }
                        events.push(sendEvent);
                    }
                }
                catch (err) {
                    this.log.error('error sending provide record to peer %p', event.peer.id, err);
                    events.push(queryErrorEvent({ from: event.peer.id, error: err }));
                }
                return events;
            };
        };
        // Notify closest peers
        yield* pipe(this.peerRouting.getClosestPeers(key.multihash.bytes, options), (source) => map(source, (event) => maybeNotifyPeer(event)), (source) => parallel(source, {
            ordered: false,
            concurrency: ALPHA
        }), async function* (source) {
            for await (const events of source) {
                yield* events;
            }
        });
        this.log('sent provider records to %d peers', sent);
    }
    /**
     * Search the dht for up to `K` providers of the given CID.
     */
    async *findProviders(key, options) {
        const toFind = this.routingTable.kBucketSize;
        const target = key.multihash.bytes;
        const id = await convertBuffer(target);
        const self = this; // eslint-disable-line @typescript-eslint/no-this-alias
        this.log('findProviders %c', key);
        const provs = await this.providers.getProviders(key);
        // yield values if we have some, also slice because maybe we got lucky and already have too many?
        if (provs.length > 0) {
            const providers = [];
            for (const peerId of provs.slice(0, toFind)) {
                providers.push({
                    id: peerId,
                    multiaddrs: ((await this.components.getPeerStore().addressBook.get(peerId)) ?? []).map(address => address.multiaddr),
                    protocols: []
                });
            }
            yield peerResponseEvent({ from: this.components.getPeerId(), messageType: MESSAGE_TYPE.GET_PROVIDERS, providers });
            yield providerEvent({ from: this.components.getPeerId(), providers: providers });
        }
        // All done
        if (provs.length >= toFind) {
            return;
        }
        /**
         * The query function to use on this particular disjoint path
         */
        const findProvidersQuery = async function* ({ peer, signal }) {
            const request = new Message(MESSAGE_TYPE.GET_PROVIDERS, target, 0);
            yield* self.network.sendRequest(peer, request, { signal });
        };
        const providers = new Set(provs.map(p => p.toString()));
        for await (const event of this.queryManager.run(target, this.routingTable.closestPeers(id), findProvidersQuery, options)) {
            yield event;
            if (event.name === 'PEER_RESPONSE') {
                this.log('Found %d provider entries for %c and %d closer peers', event.providers.length, key, event.closer.length);
                const newProviders = [];
                for (const peer of event.providers) {
                    if (providers.has(peer.id.toString())) {
                        continue;
                    }
                    providers.add(peer.id.toString());
                    newProviders.push(peer);
                }
                if (newProviders.length > 0) {
                    yield providerEvent({ from: event.from, providers: newProviders });
                }
                if (providers.size === toFind) {
                    return;
                }
            }
        }
    }
}
//# sourceMappingURL=index.js.map