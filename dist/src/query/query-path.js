import Queue from 'p-queue';
import { xor } from 'uint8arrays/xor';
import { toString } from 'uint8arrays/to-string';
import defer from 'p-defer';
import errCode from 'err-code';
import { convertPeerId, convertBuffer } from '../utils.js';
import { TimeoutController } from 'timeout-abort-controller';
import { anySignal } from 'any-signal';
import { queryErrorEvent } from './events.js';
const MAX_XOR = BigInt('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF');
/**
 * Walks a path through the DHT, calling the passed query function for
 * every peer encountered that we have not seen before
 */
export async function* queryPath(options) {
    const { key, startingPeer, ourPeerId, signal, query, alpha, pathIndex, numPaths, cleanUp, queryFuncTimeout, log, peersSeen } = options;
    // Only ALPHA node/value lookups are allowed at any given time for each process
    // https://github.com/libp2p/specs/tree/master/kad-dht#alpha-concurrency-parameter-%CE%B1
    const queue = new Queue({
        concurrency: alpha
    });
    // perform lookups on kadId, not the actual value
    const kadId = await convertBuffer(key);
    /**
     * Adds the passed peer to the query queue if it's not us and no
     * other path has passed through this peer
     */
    function queryPeer(peer, peerKadId) {
        if (peer == null) {
            return;
        }
        peersSeen.add(peer);
        const peerXor = BigInt('0x' + toString(xor(peerKadId, kadId), 'base16'));
        queue.add(async () => {
            let timeout;
            const signals = [signal];
            if (queryFuncTimeout != null) {
                timeout = new TimeoutController(queryFuncTimeout);
                signals.push(timeout.signal);
            }
            const compoundSignal = anySignal(signals);
            try {
                for await (const event of query({
                    key,
                    peer,
                    signal: compoundSignal,
                    pathIndex,
                    numPaths
                })) {
                    if (compoundSignal.aborted) {
                        return;
                    }
                    // if there are closer peers and the query has not completed, continue the query
                    if (event.name === 'PEER_RESPONSE') {
                        for (const closerPeer of event.closer) {
                            if (peersSeen.has(closerPeer.id)) { // eslint-disable-line max-depth
                                log('already seen %p in query', closerPeer.id);
                                continue;
                            }
                            if (ourPeerId.equals(closerPeer.id)) { // eslint-disable-line max-depth
                                log('not querying ourselves');
                                continue;
                            }
                            const closerPeerKadId = await convertPeerId(closerPeer.id);
                            const closerPeerXor = BigInt('0x' + toString(xor(closerPeerKadId, kadId), 'base16'));
                            // only continue query if closer peer is actually closer
                            if (closerPeerXor > peerXor) { // eslint-disable-line max-depth
                                log('skipping %p as they are not closer to %b than %p', closerPeer.id, key, peer);
                                continue;
                            }
                            log('querying closer peer %p', closerPeer.id);
                            queryPeer(closerPeer.id, closerPeerKadId);
                        }
                    }
                    // TODO: we have upgraded to p-queue@7, this should no longer be necessary
                    queue.emit('completed', event);
                }
                timeout?.clear();
            }
            catch (err) {
                if (signal.aborted) {
                    // TODO: we have upgraded to p-queue@7, this should no longer be necessary
                    queue.emit('error', err);
                }
                else {
                    // TODO: we have upgraded to p-queue@7, this should no longer be necessary
                    queue.emit('completed', queryErrorEvent({
                        from: peer,
                        error: err
                    }));
                }
            }
            finally {
                timeout?.clear();
            }
        }, {
            // use xor value as the queue priority - closer peers should execute first
            // subtract it from MAX_XOR because higher priority values execute sooner
            // @ts-expect-error this is supposed to be a Number but it's ok to use BigInts
            // as long as all priorities are BigInts since we won't mix BigInts and Number
            // values in arithmetic operations
            priority: MAX_XOR - peerXor
        }).catch(err => {
            log.error(err);
        });
    }
    // begin the query with the starting peer
    queryPeer(startingPeer, await convertPeerId(startingPeer));
    // yield results as they come in
    yield* toGenerator(queue, signal, cleanUp, log);
}
async function* toGenerator(queue, signal, cleanUp, log) {
    let deferred = defer();
    let running = true;
    const results = [];
    const cleanup = () => {
        if (!running) {
            return;
        }
        log('clean up queue, results %d, queue size %d, pending tasks %d', results.length, queue.size, queue.pending);
        running = false;
        queue.clear();
        results.splice(0, results.length);
    };
    queue.on('completed', result => {
        results.push(result);
        deferred.resolve();
    });
    queue.on('error', err => {
        log('queue error', err);
        cleanup();
        deferred.reject(err);
    });
    queue.on('idle', () => {
        log('queue idle');
        running = false;
        deferred.resolve();
    });
    // clear the queue and throw if the query is aborted
    signal.addEventListener('abort', () => {
        log('abort queue');
        const wasRunning = running;
        cleanup();
        if (wasRunning) {
            deferred.reject(errCode(new Error('Query aborted'), 'ERR_QUERY_ABORTED'));
        }
    });
    // the user broke out of the loop early, ensure we resolve the deferred result
    // promise and clear the queue of any remaining jobs
    cleanUp.addEventListener('cleanup', () => {
        cleanup();
        deferred.resolve();
    });
    while (running) { // eslint-disable-line no-unmodified-loop-condition
        await deferred.promise;
        deferred = defer();
        // yield all available results
        while (results.length > 0) {
            const result = results.shift();
            if (result != null) {
                yield result;
            }
        }
    }
    // yield any remaining results
    yield* results;
}
//# sourceMappingURL=query-path.js.map