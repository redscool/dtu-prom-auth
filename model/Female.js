import mongoose from "mongoose";

const { ObjectId } = mongoose.Schema.Types;

const Schema = new mongoose.Schema({
  userId: {
    type: ObjectId,
    required: true,
  },
  email: {
    type: String,
  },
  outsideDTU: {
    type: Boolean,
  },
  name: {
    type: String,
  },
  college: {
    type: String,
  },
  branch: {
    type: String,
  },
  bio: {
    type: String,
  },
  company: {
    type: String,
  },
  age: {
    type: String,
  },
  instagram: {
    type: String,
  },
  linkedin: {
    type: String,
  },
  image: {
    type: String,
  },
  interest: {
    type: String,
  },
  location: {
    type: String,
  },
  regComplete: {
    type: Boolean,
    default: false,
  },
});

export default mongoose.model("Female", Schema);
