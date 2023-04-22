import mongoose from "mongoose";

const Schema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  token: {
    type: String,
    required: true,
  },
  expireAt: {
    type: Date,
    expires: "10m",
    default: Date.now,
  },
});

export default mongoose.model("TempLink", Schema);
