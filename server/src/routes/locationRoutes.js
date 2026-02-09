import express from "express";
import Location from "../models/Location.js";

const router = express.Router();

// CREATE location
router.post("/", async (req, res) => {
  try {
    const location = await Location.create(req.body);
    res.status(201).json(location);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// READ all locations
router.get("/", async (req, res) => {
  try {
    const locations = await Location.find().sort({ createdAt: -1 });
    res.json(locations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE location
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Location.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Location not found" });
    res.json({ message: "Location deleted" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

export default router;
