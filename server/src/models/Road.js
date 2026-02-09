import mongoose from "mongoose";

const roadSchema = new mongoose.Schema(
  {
    from: { type: mongoose.Schema.Types.ObjectId, ref: "Location", required: true },
    to: { type: mongoose.Schema.Types.ObjectId, ref: "Location", required: true },
    distance: { type: Number, required: true, min: 0 },
    bidirectional: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("Road", roadSchema);
