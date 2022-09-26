import { xor as uint8ArrayXor } from 'uint8arrays/xor';
import { compare as uint8ArrayCompare } from 'uint8arrays/compare';
import { convertPeerId } from '../../src/utils.js';
import all from 'it-all';
import map from 'it-map';
/**
 * Sort peers by distance to the given `kadId`
 */
export async function sortClosestPeers(peers, kadId) {
    const distances = await all(map(peers, async (peer) => {
        const id = await convertPeerId(peer);
        return {
            peer: peer,
            distance: uint8ArrayXor(id, kadId)
        };
    }));
    return distances
        .sort((a, b) => {
        return uint8ArrayCompare(a.distance, b.distance);
    })
        .map((d) => d.peer);
}
//# sourceMappingURL=sort-closest-peers.js.map