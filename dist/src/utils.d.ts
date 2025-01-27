import { Key } from 'interface-datastore/key';
import type { PeerInfo } from '@libp2p/interface-peer-info';
import type { PeerId } from '@libp2p/interface-peer-id';
export declare function removePrivateAddresses(peer: PeerInfo): PeerInfo;
export declare function removePublicAddresses(peer: PeerInfo): PeerInfo;
/**
 * Creates a DHT ID by hashing a given Uint8Array
 */
export declare function convertBuffer(buf: Uint8Array): Promise<Uint8Array>;
/**
 * Creates a DHT ID by hashing a Peer ID
 */
export declare function convertPeerId(peerId: PeerId): Promise<Uint8Array>;
/**
 * Convert a Uint8Array to their SHA2-256 hash
 */
export declare function bufferToKey(buf: Uint8Array): Key;
/**
 * Convert a Uint8Array to their SHA2-256 hash
 */
export declare function bufferToRecordKey(buf: Uint8Array): Key;
/**
 * Generate the key for a public key.
 */
export declare function keyForPublicKey(peer: PeerId): Uint8Array;
export declare function isPublicKeyKey(key: Uint8Array): boolean;
export declare function isIPNSKey(key: Uint8Array): boolean;
export declare function fromPublicKeyKey(key: Uint8Array): PeerId;
/**
 * Create a new put record, encodes and signs it if enabled
 */
export declare function createPutRecord(key: Uint8Array, value: Uint8Array): Uint8Array;
export declare function debounce(callback: () => void, wait?: number): () => void;
//# sourceMappingURL=utils.d.ts.map