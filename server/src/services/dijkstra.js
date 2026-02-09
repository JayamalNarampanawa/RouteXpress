// Dijkstra using a simple O(V^2) approach (easy to explain in viva)

export function dijkstra(adjacency, startId, endId) {
  const dist = {};
  const prev = {};
  const visited = new Set();

  // init
  for (const nodeId of Object.keys(adjacency)) {
    dist[nodeId] = Infinity;
    prev[nodeId] = null;
  }
  dist[startId] = 0;

  while (true) {
    // pick unvisited node with smallest dist
    let current = null;
    let best = Infinity;

    for (const nodeId of Object.keys(adjacency)) {
      if (!visited.has(nodeId) && dist[nodeId] < best) {
        best = dist[nodeId];
        current = nodeId;
      }
    }

    if (current === null) break; // no reachable nodes
    if (current === endId) break; // reached destination

    visited.add(current);

    for (const edge of adjacency[current]) {
      const alt = dist[current] + edge.weight;
      if (alt < dist[edge.to]) {
        dist[edge.to] = alt;
        prev[edge.to] = current;
      }
    }
  }

  if (dist[endId] === Infinity) {
    return { distance: Infinity, path: [] };
  }

  // rebuild path
  const path = [];
  let cur = endId;
  while (cur) {
    path.push(cur);
    cur = prev[cur];
  }
  path.reverse();

  return { distance: dist[endId], path };
}
