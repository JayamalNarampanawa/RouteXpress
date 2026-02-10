import mongoose from "mongoose";

const dispatchQueueSchema = new mongoose.Schema(
  {
    name: { type: String, default: "main", unique: true },
    orderIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Order" }],
  },
  { timestamps: true }
);

export default mongoose.model("DispatchQueue", dispatchQueueSchema);
