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
    regComplete: {
        type: Boolean,
        default: false
    },
})

export default mongoose.model('User', Schema)