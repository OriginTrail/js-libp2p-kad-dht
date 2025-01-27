import { Libp2pRecord } from '@libp2p/record';
import { Message as PBMessage } from './dht.js';
import type { PeerInfo } from '@libp2p/interface-peer-info';
import type { Uint8ArrayList } from 'uint8arraylist';
export declare const MESSAGE_TYPE: typeof PBMessage.MessageType;
export declare const CONNECTION_TYPE: typeof PBMessage.ConnectionType;
export declare const MESSAGE_TYPE_LOOKUP: string[];
/**
 * Represents a single DHT control message.
 */
export declare class Message {
    type: PBMessage.MessageType;
    key: Uint8Array;
    private clusterLevelRaw;
    closerPeers: PeerInfo[];
    providerPeers: PeerInfo[];
    record?: Libp2pRecord;
    constructor(type: PBMessage.MessageType, key: Uint8Array, level: number);
    /**
     * @type {number}
     */
    get clusterLevel(): number;
    set clusterLevel(level: number);
    /**
     * Encode into protobuf
     */
    serialize(): Uint8Array;
    /**
     * Decode from protobuf
     */
    static deserialize(raw: Uint8ArrayList | Uint8Array): Message;
}
//# sourceMappingURL=index.d.ts.map