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
        required: true,
    },
    token: {
        type: String,
        required: true,
    },
    expireAt: {
        type: Date,
        expires: '5min',
        default: Date.now
    }
})

export default mongoose.model('TempToken', Schema)