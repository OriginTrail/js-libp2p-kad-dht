import { Message } from '../../message/index.js';
import type { DHTMessageHandler } from '../index.js';
import type { Providers } from '../../providers.js';
import type { PeerRouting } from '../../peer-routing/index.js';
import type { PeerId } from '@libp2p/interface-peer-id';
import type { PeerInfo } from '@libp2p/interface-peer-info';
import { Components, Initializable } from '@libp2p/components';
export interface GetProvidersHandlerInit {
    peerRouting: PeerRouting;
    providers: Providers;
    lan: boolean;
}
export declare class GetProvidersHandler implements DHTMessageHandler, Initializable {
    private components;
    private readonly peerRouting;
    private readonly providers;
    private readonly lan;
    constructor(init: GetProvidersHandlerInit);
    init(components: Components): void;
    handle(peerId: PeerId, msg: Message): Promise<Message>;
    _getAddresses(peerId: PeerId): Promise<import("@multiformats/multiaddr").Multiaddr[]>;
    _getPeers(peerIds: PeerId[]): Promise<PeerInfo[]>;
}
//# sourceMappingURL=get-providers.d.ts.map