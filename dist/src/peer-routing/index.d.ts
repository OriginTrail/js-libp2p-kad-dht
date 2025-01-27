import type { DHTRecord, QueryOptions, Validators } from '@libp2p/interface-dht';
import type { RoutingTable } from '../routing-table/index.js';
import type { QueryManager } from '../query/manager.js';
import type { Network } from '../network.js';
import type { AbortOptions } from '@libp2p/interfaces';
import type { PeerInfo } from '@libp2p/interface-peer-info';
import type { PeerId } from '@libp2p/interface-peer-id';
import { Components, Initializable } from '@libp2p/components';
export interface PeerRoutingInit {
    routingTable: RoutingTable;
    network: Network;
    validators: Validators;
    queryManager: QueryManager;
    lan: boolean;
}
export declare class PeerRouting implements Initializable {
    private components;
    private readonly log;
    private readonly routingTable;
    private readonly network;
    private readonly validators;
    private readonly queryManager;
    constructor(init: PeerRoutingInit);
    init(components: Components): void;
    /**
     * Look if we are connected to a peer with the given id.
     * Returns its id and addresses, if found, otherwise `undefined`.
     */
    findPeerLocal(peer: PeerId): Promise<PeerInfo | undefined>;
    /**
     * Get a value via rpc call for the given parameters
     */
    _getValueSingle(peer: PeerId, key: Uint8Array, options?: AbortOptions): AsyncGenerator<import("@libp2p/interface-dht").SendingQueryEvent | import("@libp2p/interface-dht").PeerResponseEvent | import("@libp2p/interface-dht").QueryErrorEvent | import("@libp2p/interface-dht").DialingPeerEvent, void, unknown>;
    /**
     * Get the public key directly from a node
     */
    getPublicKeyFromNode(peer: PeerId, options?: AbortOptions): AsyncGenerator<import("@libp2p/interface-dht").SendingQueryEvent | import("@libp2p/interface-dht").PeerResponseEvent | import("@libp2p/interface-dht").QueryErrorEvent | import("@libp2p/interface-dht").ValueEvent | import("@libp2p/interface-dht").DialingPeerEvent, void, unknown>;
    /**
     * Search for a peer with the given ID
     */
    findPeer(id: PeerId, options?: QueryOptions): AsyncGenerator<import("@libp2p/interface-dht").QueryEvent, void, unknown>;
    /**
     * Kademlia 'node lookup' operation on a key, which could be a the
     * bytes from a multihash or a peer ID
     */
    getClosestPeers(key: Uint8Array, options?: QueryOptions): AsyncGenerator<import("@libp2p/interface-dht").QueryEvent, void, unknown>;
    /**
     * Query a particular peer for the value for the given key.
     * It will either return the value or a list of closer peers.
     *
     * Note: The peerStore is updated with new addresses found for the given peer.
     */
    getValueOrPeers(peer: PeerId, key: Uint8Array, options?: AbortOptions): AsyncGenerator<import("@libp2p/interface-dht").SendingQueryEvent | import("@libp2p/interface-dht").PeerResponseEvent | import("@libp2p/interface-dht").QueryErrorEvent | import("@libp2p/interface-dht").DialingPeerEvent, void, unknown>;
    /**
     * Verify a record, fetching missing public keys from the network.
     * Throws an error if the record is invalid.
     */
    _verifyRecordOnline(record: DHTRecord): Promise<void>;
    /**
     * Get the nearest peers to the given query, but if closer
     * than self
     */
    getCloserPeersOffline(key: Uint8Array, closerThan: PeerId): Promise<PeerInfo[]>;
}
//# sourceMappingURL=index.d.ts.map