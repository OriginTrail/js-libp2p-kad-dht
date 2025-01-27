import { RoutingTable } from './routing-table/index.js';
import { RoutingTableRefresh } from './routing-table/refresh.js';
import { Network } from './network.js';
import { ContentFetching } from './content-fetching/index.js';
import { ContentRouting } from './content-routing/index.js';
import { PeerRouting } from './peer-routing/index.js';
import { Providers } from './providers.js';
import { QueryManager } from './query/manager.js';
import { RPC } from './rpc/index.js';
import { TopologyListener } from './topology-listener.js';
import { QuerySelf } from './query-self.js';
import { removePrivateAddresses, removePublicAddresses } from './utils.js';
import { logger } from '@libp2p/logger';
import { CustomEvent, EventEmitter } from '@libp2p/interfaces/events';
import { Components } from '@libp2p/components';
import { validators as recordValidators } from '@libp2p/record/validators';
import { selectors as recordSelectors } from '@libp2p/record/selectors';
import { symbol } from '@libp2p/interface-peer-discovery';
import { PROTOCOL_DHT, PROTOCOL_PREFIX, LAN_PREFIX } from './constants.js';
export const DEFAULT_MAX_INBOUND_STREAMS = 32;
export const DEFAULT_MAX_OUTBOUND_STREAMS = 64;
/**
 * A DHT implementation modelled after Kademlia with S/Kademlia modifications.
 * Original implementation in go: https://github.com/libp2p/go-libp2p-kad-dht.
 */
export class KadDHT extends EventEmitter {
    /**
     * Create a new KadDHT
     */
    constructor(init) {
        super();
        this.components = new Components();
        const { kBucketSize, clientMode, validators, selectors, querySelfInterval, lan, protocolPrefix, pingTimeout, pingConcurrency, maxInboundStreams, maxOutboundStreams } = init;
        this.running = false;
        this.lan = Boolean(lan);
        this.log = logger(`libp2p:kad-dht:${lan === true ? 'lan' : 'wan'}`);
        this.protocol = `${protocolPrefix ?? PROTOCOL_PREFIX}${lan === true ? LAN_PREFIX : ''}${PROTOCOL_DHT}`;
        this.kBucketSize = kBucketSize ?? 20;
        this.clientMode = clientMode ?? true;
        this.maxInboundStreams = maxInboundStreams ?? DEFAULT_MAX_INBOUND_STREAMS;
        this.maxOutboundStreams = maxOutboundStreams ?? DEFAULT_MAX_OUTBOUND_STREAMS;
        this.routingTable = new RoutingTable({
            kBucketSize,
            lan: this.lan,
            pingTimeout,
            pingConcurrency,
            protocol: this.protocol
        });
        this.providers = new Providers();
        this.validators = {
            ...recordValidators,
            ...validators
        };
        this.selectors = {
            ...recordSelectors,
            ...selectors
        };
        this.network = new Network({
            protocol: this.protocol,
            lan: this.lan
        });
        this.queryManager = new QueryManager({
            // Number of disjoint query paths to use - This is set to `kBucketSize/2` per the S/Kademlia paper
            disjointPaths: Math.ceil(this.kBucketSize / 2),
            lan
        });
        // DHT components
        this.peerRouting = new PeerRouting({
            routingTable: this.routingTable,
            network: this.network,
            validators: this.validators,
            queryManager: this.queryManager,
            lan: this.lan
        });
        this.contentFetching = new ContentFetching({
            validators: this.validators,
            selectors: this.selectors,
            peerRouting: this.peerRouting,
            queryManager: this.queryManager,
            routingTable: this.routingTable,
            network: this.network,
            lan: this.lan
        });
        this.contentRouting = new ContentRouting({
            network: this.network,
            peerRouting: this.peerRouting,
            queryManager: this.queryManager,
            routingTable: this.routingTable,
            providers: this.providers,
            lan: this.lan
        });
        this.routingTableRefresh = new RoutingTableRefresh({
            peerRouting: this.peerRouting,
            routingTable: this.routingTable,
            lan: this.lan
        });
        this.rpc = new RPC({
            routingTable: this.routingTable,
            providers: this.providers,
            peerRouting: this.peerRouting,
            validators: this.validators,
            lan: this.lan
        });
        this.topologyListener = new TopologyListener({
            protocol: this.protocol,
            lan: this.lan
        });
        this.querySelf = new QuerySelf({
            peerRouting: this.peerRouting,
            interval: querySelfInterval,
            lan: this.lan
        });
        // handle peers being discovered during processing of DHT messages
        this.network.addEventListener('peer', (evt) => {
            const peerData = evt.detail;
            this.onPeerConnect(peerData).catch(err => {
                this.log.error('could not add %p to routing table', peerData.id, err);
            });
            this.dispatchEvent(new CustomEvent('peer', {
                detail: peerData
            }));
        });
        // handle peers being discovered via other peer discovery mechanisms
        this.topologyListener.addEventListener('peer', (evt) => {
            const peerId = evt.detail;
            Promise.resolve().then(async () => {
                const multiaddrs = await this.components.getPeerStore().addressBook.get(peerId) ?? [];
                const protocols = await this.components.getPeerStore().protoBook.get(peerId) ?? [];
                const peerData = {
                    id: peerId,
                    multiaddrs: multiaddrs.map(addr => addr.multiaddr),
                    protocols: protocols
                };
                await this.onPeerConnect(peerData);
            }).catch(err => {
                this.log.error('could not add %p to routing table', peerId, err);
            });
        });
    }
    get [symbol]() {
        return true;
    }
    get [Symbol.toStringTag]() {
        return '@libp2p/kad-dht';
    }
    init(components) {
        this.components = components;
        this.routingTable.init(components);
        this.providers.init(components);
        this.network.init(components);
        this.queryManager.init(components);
        this.peerRouting.init(components);
        this.contentFetching.init(components);
        this.contentRouting.init(components);
        this.routingTableRefresh.init(components);
        this.rpc.init(components);
        this.topologyListener.init(components);
        this.querySelf.init(components);
    }
    async onPeerConnect(peerData) {
        this.log('peer %p connected with protocols %s', peerData.id, peerData.protocols);
        if (this.lan) {
            peerData = removePublicAddresses(peerData);
        }
        else {
            peerData = removePrivateAddresses(peerData);
        }
        if (peerData.multiaddrs.length === 0) {
            this.log('ignoring %p as they do not have any %s addresses in %s', peerData.id, this.lan ? 'private' : 'public', peerData.multiaddrs.map(addr => addr.toString()));
            return;
        }
        try {
            await this.routingTable.add(peerData.id);
        }
        catch (err) {
            this.log.error('could not add %p to routing table', peerData.id, err);
        }
    }
    /**
     * Is this DHT running.
     */
    isStarted() {
        return this.running;
    }
    /**
     * If 'server' this node will respond to DHT queries, if 'client' this node will not
     */
    async getMode() {
        return this.clientMode ? 'client' : 'server';
    }
    /**
     * If 'server' this node will respond to DHT queries, if 'client' this node will not
     */
    async setMode(mode) {
        await this.components.getRegistrar().unhandle(this.protocol);
        if (mode === 'client') {
            this.log('enabling client mode');
            this.clientMode = true;
        }
        else {
            this.log('enabling server mode');
            this.clientMode = false;
            await this.components.getRegistrar().handle(this.protocol, this.rpc.onIncomingStream.bind(this.rpc), {
                maxInboundStreams: this.maxInboundStreams,
                maxOutboundStreams: this.maxOutboundStreams
            });
        }
    }
    /**
     * Start listening to incoming connections.
     */
    async start() {
        this.running = true;
        // Only respond to queries when not in client mode
        await this.setMode(this.clientMode ? 'client' : 'server');
        await Promise.all([
            this.providers.start(),
            this.queryManager.start(),
            this.network.start(),
            this.routingTable.start(),
            this.topologyListener.start(),
            this.querySelf.start()
        ]);
        await this.routingTableRefresh.start();
    }
    /**
     * Stop accepting incoming connections and sending outgoing
     * messages.
     */
    async stop() {
        this.running = false;
        await Promise.all([
            this.providers.stop(),
            this.queryManager.stop(),
            this.network.stop(),
            this.routingTable.stop(),
            this.routingTableRefresh.stop(),
            this.topologyListener.stop(),
            this.querySelf.stop()
        ]);
    }
    /**
     * Store the given key/value pair in the DHT
     */
    async *put(key, value, options = {}) {
        yield* this.contentFetching.put(key, value, options);
    }
    /**
     * Get the value that corresponds to the passed key
     */
    async *get(key, options = {}) {
        yield* this.contentFetching.get(key, options);
    }
    // ----------- Content Routing
    /**
     * Announce to the network that we can provide given key's value
     */
    async *provide(key, options = {}) {
        yield* this.contentRouting.provide(key, this.components.getAddressManager().getAddresses(), options);
    }
    /**
     * Search the dht for providers of the given CID
     */
    async *findProviders(key, options = {}) {
        yield* this.contentRouting.findProviders(key, options);
    }
    // ----------- Peer Routing -----------
    /**
     * Search for a peer with the given ID
     */
    async *findPeer(id, options = {}) {
        yield* this.peerRouting.findPeer(id, options);
    }
    /**
     * Kademlia 'node lookup' operation
     */
    async *getClosestPeers(key, options = {}) {
        yield* this.peerRouting.getClosestPeers(key, options);
    }
    async refreshRoutingTable() {
        await this.routingTableRefresh.refreshTable(true);
    }
}
//# sourceMappingURL=kad-dht.js.map