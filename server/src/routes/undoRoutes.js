import express from "express";
import UndoAction from "../models/UndoAction.js";
import DispatchQueue from "../models/DispatchQueue.js";
import Order from "../models/Order.js";

const router = express.Router();

async function getMainQueue() {
  let q = await DispatchQueue.findOne({ name: "main" });
  if (!q) q = await DispatchQueue.create({ name: "main", orderIds: [] });
  return q;
}

// POST /api/undo  -> undo last action (LIFO)
router.post("/", async (req, res) => {
  try {
    const last = await UndoAction.findOne().sort({ createdAt: -1 });
    if (!last) return res.json({ message: "Nothing to undo", undone: null });

    if (last.type === "ENQUEUE_ORDER") {
      const { orderId } = last.payload;

      // Remove from queue if present
      const q = await getMainQueue();
      q.orderIds = q.orderIds.filter((id) => String(id) !== String(orderId));
      await q.save();

      // Set order back to PENDING if exists
      const order = await Order.findById(orderId);
      if (order && order.status === "QUEUED") {
        order.status = "PENDING";
        await order.save();
      }

      await UndoAction.findByIdAndDelete(last._id);
      return res.json({ message: "Undid enqueue", undone: last.type, orderId });
    }

    if (last.type === "CREATE_ORDER") {
      const { orderId } = last.payload;

      // Delete order
      await Order.findByIdAndDelete(orderId);

      // Also remove from queue if it was queued later
      const q = await getMainQueue();
      q.orderIds = q.orderIds.filter((id) => String(id) !== String(orderId));
      await q.save();

      await UndoAction.findByIdAndDelete(last._id);
      return res.json({ message: "Undid create order", undone: last.type, orderId });
    }

    res.status(400).json({ message: "Unknown undo type" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
