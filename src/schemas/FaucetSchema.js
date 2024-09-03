import mongoose from "mongoose";

const faucetSchema = new mongoose.Schema(
  {
    owner_id: { type: String, required: true },
    owner_username: { type: String, required: true },
    amount: { type: Number, required: true },
    maxUses: { type: Number, required: true },
    claimersIds: [{ type: String, required: true }],
    channelId: { type: String, required: false },
    messageId: { type: String, required: false },
    closed: { type: Boolean, required: false },
  },
  { timestamps: true }
);

export default mongoose.models.faucets ||
  mongoose.model("faucets", faucetSchema);
