import { Libp2pRecord } from '@libp2p/record';
import type { Validators, Selectors, ValueEvent, QueryOptions } from '@libp2p/interface-dht';
import type { PeerRouting } from '../peer-routing/index.js';
import type { QueryManager } from '../query/manager.js';
import type { RoutingTable } from '../routing-table/index.js';
import type { Network } from '../network.js';
import type { AbortOptions } from '@libp2p/interfaces';
import { Components, Initializable } from '@libp2p/components';
export interface ContentFetchingInit {
    validators: Validators;
    selectors: Selectors;
    peerRouting: PeerRouting;
    queryManager: QueryManager;
    routingTable: RoutingTable;
    network: Network;
    lan: boolean;
}
export declare class ContentFetching implements Initializable {
    private readonly log;
    private components;
    private readonly validators;
    private readonly selectors;
    private readonly peerRouting;
    private readonly queryManager;
    private readonly routingTable;
    private readonly network;
    constructor(init: ContentFetchingInit);
    init(components: Components): void;
    putLocal(key: Uint8Array, rec: Uint8Array): Promise<void>;
    /**
     * Attempt to retrieve the value for the given key from
     * the local datastore
     */
    getLocal(key: Uint8Array): Promise<Libp2pRecord>;
    /**
     * Send the best record found to any peers that have an out of date record
     */
    sendCorrectionRecord(key: Uint8Array, vals: ValueEvent[], best: Uint8Array, options?: AbortOptions): AsyncGenerator<import("@libp2p/interface-dht").SendingQueryEvent | import("@libp2p/interface-dht").PeerResponseEvent | import("@libp2p/interface-dht").QueryErrorEvent | import("@libp2p/interface-dht").DialingPeerEvent, void, unknown>;
    /**
     * Store the given key/value pair in the DHT
     */
    put(key: Uint8Array, value: Uint8Array, options?: AbortOptions): AsyncGenerator<import("@libp2p/interface-dht").SendingQueryEvent | import("@libp2p/interface-dht").PeerResponseEvent | import("@libp2p/interface-dht").QueryErrorEvent | import("@libp2p/interface-dht").ProviderEvent | ValueEvent | import("@libp2p/interface-dht").AddingPeerEvent | import("@libp2p/interface-dht").DialingPeerEvent, void, undefined>;
    /**
     * Get the value to the given key
     */
    get(key: Uint8Array, options?: QueryOptions): AsyncGenerator<import("@libp2p/interface-dht").QueryEvent, void, unknown>;
    /**
     * Get the `n` values to the given key without sorting
     */
    getMany(key: Uint8Array, options?: QueryOptions): AsyncGenerator<import("@libp2p/interface-dht").QueryEvent, void, unknown>;
}
//# sourceMappingURL=index.d.ts.map