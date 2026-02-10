import express from "express";
import DispatchQueue from "../models/DispatchQueue.js";
import Order from "../models/Order.js";
import UndoAction from "../models/UndoAction.js";

const router = express.Router();

async function getMainQueue() {
  let q = await DispatchQueue.findOne({ name: "main" });
  if (!q) q = await DispatchQueue.create({ name: "main", orderIds: [] });
  return q;
}

// GET current queue (with order details)
router.get("/", async (req, res) => {
  try {
    const q = await getMainQueue();

    const populated = await DispatchQueue.findById(q._id).populate({
      path: "orderIds",
      populate: { path: "customerLocation", select: "name type lat lng" },
    });

    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ENQUEUE orderId (FIFO)
router.post("/enqueue/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    const q = await getMainQueue();

    // prevent duplicates
    if (q.orderIds.some((id) => String(id) === String(orderId))) {
      return res.status(400).json({ message: "Order already in queue" });
    }

    // add to queue
    q.orderIds.push(orderId);
    await q.save();

    // update order status
    order.status = "QUEUED";
    await order.save();

    // push undo action (STACK)
    await UndoAction.create({
      type: "ENQUEUE_ORDER",
      payload: { orderId: String(orderId) },
    });

    res.json({ message: "Enqueued", queueSize: q.orderIds.length });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DEQUEUE next order (Dispatch next)
router.post("/next", async (req, res) => {
  try {
    const q = await getMainQueue();

    if (q.orderIds.length === 0) {
      return res.json({ message: "Queue empty", next: null });
    }

    const nextId = q.orderIds.shift(); // FIFO dequeue
    await q.save();

    const nextOrder = await Order.findById(nextId).populate(
      "customerLocation",
      "name type lat lng"
    );

    if (nextOrder) {
      nextOrder.status = "DISPATCHED";
      await nextOrder.save();
    }

    res.json({ message: "Dispatched next order", next: nextOrder });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
