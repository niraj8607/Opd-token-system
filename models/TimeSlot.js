const mongoose = require('mongoose');

const timeSlotSchema = new mongoose.Schema({
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doctor',
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    startTime: {
        type: String,
        required: true
    },
    endTime: {
        type: String,
        required: true
    },
    maxCapacity: {
        type: Number,
        required: true,
        min: 1
    },
    currentCount: {
        type: Number,
        default: 0
    },
    reservedEmergencySlots: {
        type: Number,
        default: 1,
        min: 0
    },
    tokens: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Token'
    }],
    status: {
        type: String,
        enum: ['available', 'full', 'completed', 'cancelled'],
        default: 'available'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('TimeSlot', timeSlotSchema);