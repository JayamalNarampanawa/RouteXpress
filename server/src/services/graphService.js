import Road from "../models/Road.js";

export async function buildAdjacencyList() {
  const roads = await Road.find().lean();

  const adjacency = {};

  const ensure = (id) => {
    if (!adjacency[id]) adjacency[id] = [];
  };

  for (const r of roads) {
    const from = String(r.from);
    const to = String(r.to);

    ensure(from);
    ensure(to);

    adjacency[from].push({ to, weight: r.distance });

    if (r.bidirectional) {
      adjacency[to].push({ to: from, weight: r.distance });
    }
  }

  return adjacency;
}
