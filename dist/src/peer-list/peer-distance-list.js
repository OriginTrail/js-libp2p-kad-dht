import * as utils from '../utils.js';
import { compare as uint8ArrayCompare } from 'uint8arrays/compare';
import { xor as uint8ArrayXor } from 'uint8arrays/xor';
/**
 * Maintains a list of peerIds sorted by distance from a DHT key.
 */
export class PeerDistanceList {
    constructor(originDhtKey, capacity) {
        this.originDhtKey = originDhtKey;
        this.capacity = capacity;
        this.peerDistances = [];
    }
    /**
     * The length of the list
     */
    get length() {
        return this.peerDistances.length;
    }
    /**
     * The peerIds in the list, in order of distance from the origin key
     */
    get peers() {
        return this.peerDistances.map(pd => pd.peerId);
    }
    /**
     * Add a peerId to the list.
     */
    async add(peerId) {
        if (this.peerDistances.find(pd => pd.peerId.equals(peerId)) != null) {
            return;
        }
        const dhtKey = await utils.convertPeerId(peerId);
        const el = {
            peerId,
            distance: uint8ArrayXor(this.originDhtKey, dhtKey)
        };
        this.peerDistances.push(el);
        this.peerDistances.sort((a, b) => uint8ArrayCompare(a.distance, b.distance));
        this.peerDistances = this.peerDistances.slice(0, this.capacity);
    }
    /**
     * Indicates whether any of the peerIds passed as a parameter are closer
     * to the origin key than the furthest peerId in the PeerDistanceList.
     */
    async anyCloser(peerIds) {
        if (peerIds.length === 0) {
            return false;
        }
        if (this.length === 0) {
            return true;
        }
        const dhtKeys = await Promise.all(peerIds.map(utils.convertPeerId));
        const furthestDistance = this.peerDistances[this.peerDistances.length - 1].distance;
        for (const dhtKey of dhtKeys) {
            const keyDistance = uint8ArrayXor(this.originDhtKey, dhtKey);
            if (uint8ArrayCompare(keyDistance, furthestDistance) < 0) {
                return true;
            }
        }
        return false;
    }
}
//# sourceMappingURL=peer-distance-list.js.map