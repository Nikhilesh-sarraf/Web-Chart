const mongoose = require("mongoose");
const { Schema } = mongoose;

const privateMessageSchema = new Schema(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true },
    isRead: { type: Boolean, default: false }
  },
  { timestamps: true }
);

const PrivateMessage = mongoose.model("PrivateMessage", privateMessageSchema);

module.exports = PrivateMessage;
