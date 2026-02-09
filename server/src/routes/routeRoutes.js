import express from "express";
import Location from "../models/Location.js";
import { buildAdjacencyList } from "../services/graphService.js";
import { dijkstra } from "../services/dijkstra.js";

const router = express.Router();

// GET /api/routes/shortest?from=<id>&to=<id>
router.get("/shortest", async (req, res) => {
  try {
    const { from, to } = req.query;

    if (!from || !to) {
      return res.status(400).json({ message: "from and to query params are required" });
    }

    const adjacency = await buildAdjacencyList();

    if (!adjacency[from] || !adjacency[to]) {
      return res.status(400).json({ message: "Invalid from/to (not in graph)" });
    }

    const result = dijkstra(adjacency, from, to);

    if (result.distance === Infinity) {
      return res.json({ distance: null, path: [], message: "No path found" });
    }

    // Convert path IDs -> location objects for frontend
    const locations = await Location.find({ _id: { $in: result.path } }).lean();
    const map = new Map(locations.map((l) => [String(l._id), l]));
    const pathLocations = result.path.map((id) => map.get(String(id)));

    res.json({
      distance: result.distance,
      path: pathLocations,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
