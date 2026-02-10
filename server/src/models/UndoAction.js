import mongoose from "mongoose";

const undoActionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["ENQUEUE_ORDER", "CREATE_ORDER"],
      required: true,
    },
    payload: { type: Object, required: true }, // store IDs/data needed to undo
  },
  { timestamps: true }
);

export default mongoose.model("UndoAction", undoActionSchema);
