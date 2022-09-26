/* eslint-env mocha */
import { expect } from 'aegir/chai';
import { Message, MESSAGE_TYPE } from '../../../src/message/index.js';
import { PingHandler } from '../../../src/rpc/handlers/ping.js';
import { fromString as uint8ArrayFromString } from 'uint8arrays/from-string';
import { createPeerId } from '../../utils/create-peer-id.js';
const T = MESSAGE_TYPE.PING;
describe('rpc - handlers - Ping', () => {
    let sourcePeer;
    let handler;
    beforeEach(async () => {
        sourcePeer = await createPeerId();
    });
    beforeEach(async () => {
        handler = new PingHandler();
    });
    it('replies with the same message', async () => {
        const msg = new Message(T, uint8ArrayFromString('hello'), 5);
        const response = await handler.handle(sourcePeer, msg);
        expect(response).to.be.deep.equal(msg);
    });
});
//# sourceMappingURL=ping.spec.js.map