import type { PeerId } from '@libp2p/interface-peer-id';
/**
 * A list of unique peers.
 */
export declare class PeerList {
    private readonly list;
    constructor();
    /**
     * Add a new peer. Returns `true` if it was a new one
     */
    push(peerId: PeerId): boolean;
    /**
     * Check if this PeerInfo is already in here
     */
    has(peerId: PeerId): boolean;
    /**
     * Get the list as an array
     */
    toArray(): PeerId[];
    /**
     * Remove the last element
     */
    pop(): PeerId | undefined;
    /**
     * The length of the list
     */
    get length(): number;
}
//# sourceMappingURL=index.d.ts.map