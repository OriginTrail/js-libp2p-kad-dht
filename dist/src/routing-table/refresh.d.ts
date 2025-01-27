import type { RoutingTable } from './index.js';
import type { PeerRouting } from '../peer-routing/index.js';
import type { Components, Initializable } from '@libp2p/components';
export interface RoutingTableRefreshInit {
    peerRouting: PeerRouting;
    routingTable: RoutingTable;
    lan: boolean;
    refreshInterval?: number;
    refreshQueryTimeout?: number;
}
/**
 * A wrapper around `k-bucket`, to provide easy store and
 * retrieval for peers.
 */
export declare class RoutingTableRefresh implements Initializable {
    private readonly log;
    private readonly peerRouting;
    private readonly routingTable;
    private readonly refreshInterval;
    private readonly refreshQueryTimeout;
    private readonly commonPrefixLengthRefreshedAt;
    private refreshTimeoutId?;
    constructor(init: RoutingTableRefreshInit);
    init(components: Components): void;
    start(): Promise<void>;
    stop(): Promise<void>;
    /**
     * To speed lookups, we seed the table with random PeerIds. This means
     * when we are asked to locate a peer on the network, we can find a KadId
     * that is close to the requested peer ID and query that, then network
     * peers will tell us who they know who is close to the fake ID
     */
    refreshTable(force?: boolean): void;
    _refreshCommonPrefixLength(cpl: number, lastRefresh: Date, force: boolean): Promise<void>;
    _getTrackedCommonPrefixLengthsForRefresh(maxCommonPrefix: number): Date[];
    _generateRandomPeerId(targetCommonPrefixLength: number): Promise<import("@libp2p/interface-peer-id").PeerId>;
    _makePeerId(localKadId: Uint8Array, randomPrefix: number, targetCommonPrefixLength: number): Promise<Uint8Array>;
    /**
     * returns the maximum common prefix length between any peer in the table
     * and the current peer
     */
    _maxCommonPrefix(): number;
    /**
     * Returns the number of peers in the table with a given prefix length
     */
    _numPeersForCpl(prefixLength: number): number;
    /**
     * Yields the common prefix length of every peer in the table
     */
    _prefixLengths(): Generator<number, void, unknown>;
}
//# sourceMappingURL=refresh.d.ts.map