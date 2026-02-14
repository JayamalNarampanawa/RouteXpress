import express from "express";
import Location from "../models/Location.js";

const router = express.Router();

router.get("/real", async (req, res) => {
  try {
    const { from, to } = req.query;
    if (!from || !to) return res.status(400).json({ message: "from and to are required" });

    const fromLoc = await Location.findById(from).lean();
    const toLoc = await Location.findById(to).lean();

    if (!fromLoc || !toLoc) {
      return res.status(404).json({ message: "Location not found" });
    }

    const url = "https://api.openrouteservice.org/v2/directions/driving-car/geojson";

    const orsRes = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: process.env.ORS_API_KEY, // ORS uses Authorization header with API key
      },
      body: JSON.stringify({
        // IMPORTANT: ORS expects [lon, lat]
        coordinates: [
          [fromLoc.lng, fromLoc.lat],
          [toLoc.lng, toLoc.lat],
        ],
      }),
    });

    const data = await orsRes.json();

    if (!orsRes.ok) {
      return res.status(orsRes.status).json({
        message: "ORS routing failed",
        ors: data,
      });
    }

    // geojson format: FeatureCollection -> features[0]
    const feature = data.features?.[0];
    const summary = feature?.properties?.summary;

    res.json({
      distance_m: summary?.distance ?? null,
      duration_s: summary?.duration ?? null,
      geometry: feature?.geometry ?? null, // LineString coordinates in [lon,lat]
      raw: data,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
