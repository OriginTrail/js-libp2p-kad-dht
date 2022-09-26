import { DualKadDHT } from '../../src/dual-kad-dht.js';
import type { KadDHTInit } from '../../src/index.js';
export declare class TestDHT {
    private readonly peers;
    constructor();
    spawn(options?: Partial<KadDHTInit>, autoStart?: boolean): Promise<DualKadDHT>;
    connect(dhtA: DualKadDHT, dhtB: DualKadDHT): Promise<void>;
    teardown(): Promise<void>;
}
//# sourceMappingURL=test-dht.d.ts.map