import express from "express";
import Road from "../models/Road.js";

const router = express.Router();

// CREATE road
router.post("/", async (req, res) => {
  try {
    const { from, to, distance, bidirectional = true } = req.body;

    if (from === to) {
      return res.status(400).json({ message: "from and to cannot be the same location" });
    }

    const road = await Road.create({ from, to, distance, bidirectional });
    res.status(201).json(road);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// READ all roads
router.get("/", async (req, res) => {
  try {
    const roads = await Road.find()
      .populate("from", "name type lat lng")
      .populate("to", "name type lat lng")
      .sort({ createdAt: -1 });

    res.json(roads);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE road
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Road.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Road not found" });
    res.json({ message: "Road deleted" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

export default router;
