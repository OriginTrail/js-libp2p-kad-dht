import type { QueryEvent, QueryOptions } from '@libp2p/interface-dht';
import type { PeerRouting } from '../peer-routing/index.js';
import type { QueryManager } from '../query/manager.js';
import type { RoutingTable } from '../routing-table/index.js';
import type { Network } from '../network.js';
import type { Providers } from '../providers.js';
import type { CID } from 'multiformats/cid';
import type { AbortOptions } from '@libp2p/interfaces';
import type { Multiaddr } from '@multiformats/multiaddr';
import { Components, Initializable } from '@libp2p/components';
export interface ContentRoutingInit {
    network: Network;
    peerRouting: PeerRouting;
    queryManager: QueryManager;
    routingTable: RoutingTable;
    providers: Providers;
    lan: boolean;
}
export declare class ContentRouting implements Initializable {
    private readonly log;
    private components;
    private readonly network;
    private readonly peerRouting;
    private readonly queryManager;
    private readonly routingTable;
    private readonly providers;
    constructor(init: ContentRoutingInit);
    init(components: Components): void;
    /**
     * Announce to the network that we can provide the value for a given key and
     * are contactable on the given multiaddrs
     */
    provide(key: CID, multiaddrs: Multiaddr[], options?: AbortOptions): AsyncGenerator<import("@libp2p/interface-dht").SendingQueryEvent | import("@libp2p/interface-dht").PeerResponseEvent | import("@libp2p/interface-dht").QueryErrorEvent | import("@libp2p/interface-dht").ProviderEvent | import("@libp2p/interface-dht").ValueEvent | import("@libp2p/interface-dht").AddingPeerEvent | import("@libp2p/interface-dht").DialingPeerEvent, void, undefined>;
    /**
     * Search the dht for up to `K` providers of the given CID.
     */
    findProviders(key: CID, options: QueryOptions): AsyncGenerator<QueryEvent, void, unknown>;
}
//# sourceMappingURL=index.d.ts.map