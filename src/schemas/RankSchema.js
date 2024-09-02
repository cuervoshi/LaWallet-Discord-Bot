import mongoose from "mongoose";

const rankingSchema = new mongoose.Schema(
  {
    discord_id: { type: String, required: true },
    type: { type: String, required: true },
    amount: { type: Number, required: true },
  },
  { timestamps: true }
);

export default mongoose.models.ranking ||
  mongoose.model("ranking", rankingSchema);
