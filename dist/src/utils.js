import { sha256 } from 'multiformats/hashes/sha2';
import { Key } from 'interface-datastore/key';
import { Libp2pRecord } from '@libp2p/record';
import { fromString as uint8ArrayFromString } from 'uint8arrays/from-string';
import { toString as uint8ArrayToString } from 'uint8arrays/to-string';
import { concat as uint8ArrayConcat } from 'uint8arrays/concat';
import isPrivateIp from 'private-ip';
import { peerIdFromBytes } from '@libp2p/peer-id';
import { RECORD_KEY_PREFIX } from './constants.js';
// const IPNS_PREFIX = uint8ArrayFromString('/ipns/')
const PK_PREFIX = uint8ArrayFromString('/pk/');
export function removePrivateAddresses(peer) {
    return {
        ...peer,
        multiaddrs: peer.multiaddrs.filter(multiaddr => {
            const [[type, addr]] = multiaddr.stringTuples();
            if (type !== 4 && type !== 6) {
                return false;
            }
            if (addr == null) {
                return false;
            }
            return !isPrivateIp(addr);
        })
    };
}
export function removePublicAddresses(peer) {
    return {
        ...peer,
        multiaddrs: peer.multiaddrs.filter(multiaddr => {
            const [[type, addr]] = multiaddr.stringTuples();
            if (type !== 4 && type !== 6) {
                return false;
            }
            if (addr == null) {
                return false;
            }
            return isPrivateIp(addr);
        })
    };
}
/**
 * Creates a DHT ID by hashing a given Uint8Array
 */
export async function convertBuffer(buf) {
    const multihash = await sha256.digest(buf);
    return multihash.digest;
}
/**
 * Creates a DHT ID by hashing a Peer ID
 */
export async function convertPeerId(peerId) {
    return await convertBuffer(peerId.toBytes());
}
/**
 * Convert a Uint8Array to their SHA2-256 hash
 */
export function bufferToKey(buf) {
    return new Key('/' + uint8ArrayToString(buf, 'base32'), false);
}
/**
 * Convert a Uint8Array to their SHA2-256 hash
 */
export function bufferToRecordKey(buf) {
    return new Key(`${RECORD_KEY_PREFIX}/${uint8ArrayToString(buf, 'base32')}`, false);
}
/**
 * Generate the key for a public key.
 */
export function keyForPublicKey(peer) {
    return uint8ArrayConcat([
        PK_PREFIX,
        peer.toBytes()
    ]);
}
export function isPublicKeyKey(key) {
    return uint8ArrayToString(key.subarray(0, 4)) === '/pk/';
}
export function isIPNSKey(key) {
    return uint8ArrayToString(key.subarray(0, 4)) === '/ipns/';
}
export function fromPublicKeyKey(key) {
    return peerIdFromBytes(key.subarray(4));
}
/**
 * Create a new put record, encodes and signs it if enabled
 */
export function createPutRecord(key, value) {
    const timeReceived = new Date();
    const rec = new Libp2pRecord(key, value, timeReceived);
    return rec.serialize();
}
export function debounce(callback, wait = 100) {
    let timeout;
    return () => {
        clearTimeout(timeout);
        timeout = setTimeout(() => callback(), wait);
    };
}
//# sourceMappingURL=utils.js.map