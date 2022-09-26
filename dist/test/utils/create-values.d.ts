import { CID } from 'multiformats/cid';
export interface Value {
    cid: CID;
    value: Uint8Array;
}
export declare function createValues(length: number): Promise<Value[]>;
//# sourceMappingURL=create-values.d.ts.map