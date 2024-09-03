import mongoose from "mongoose";

const faucetSchema = new mongoose.Schema(
  {
    owner_id: { type: String, required: true },
    owner_username: { type: String, required: true },
    amount: { type: Number, required: true },
    uses: { type: Number, required: true },
    maxUses: { type: Number, required: true },
    claimers_ids: [{ type: String, required: true }],
    closed: { type: Boolean, required: false },
  },
  { timestamps: true }
);

export default mongoose.models.faucets ||
  mongoose.model("faucets", faucetSchema);
