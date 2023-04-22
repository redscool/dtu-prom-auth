import mongoose from "mongoose";

const { ObjectId } = mongoose.Schema.Types;

const Schema = new mongoose.Schema({
  userId: {
    type: ObjectId,
    required: true,
  },
  name: {
    type: String,
  },
});

export default mongoose.model("Female", Schema);
