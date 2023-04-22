import mongoose from 'mongoose'

const Schema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        enum: ["M", "F"],
        required: true,
    },
})

export default mongoose.model('User', Schema)