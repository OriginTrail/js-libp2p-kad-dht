import type { PeerId } from '@libp2p/interface-peer-id';
/**
 * Maintains a list of peerIds sorted by distance from a DHT key.
 */
export declare class PeerDistanceList {
    /**
     * The DHT key from which distance is calculated
     */
    private readonly originDhtKey;
    /**
     * The maximum size of the list
     */
    private readonly capacity;
    private peerDistances;
    constructor(originDhtKey: Uint8Array, capacity: number);
    /**
     * The length of the list
     */
    get length(): number;
    /**
     * The peerIds in the list, in order of distance from the origin key
     */
    get peers(): PeerId[];
    /**
     * Add a peerId to the list.
     */
    add(peerId: PeerId): Promise<void>;
    /**
     * Indicates whether any of the peerIds passed as a parameter are closer
     * to the origin key than the furthest peerId in the PeerDistanceList.
     */
    anyCloser(peerIds: PeerId[]): Promise<boolean>;
}
//# sourceMappingURL=peer-distance-list.d.ts.map