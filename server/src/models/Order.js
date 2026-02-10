import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    customerLocation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Location",
      required: true,
    },
    items: [
      {
        name: { type: String, required: true, trim: true },
        qty: { type: Number, required: true, min: 1 },
      },
    ],
    priority: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH"],
      default: "MEDIUM",
    },
    status: {
      type: String,
      enum: ["PENDING", "QUEUED", "DISPATCHED", "DELIVERED"],
      default: "PENDING",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema);
