/**
 * Count how many peers are in b but are not in a
 */
export function countDiffPeers(a, b) {
    const s = new Set();
    a.forEach((p) => s.add(p.toString()));
    return b.filter((p) => !s.has(p.toString())).length;
}
//# sourceMappingURL=index.js.map