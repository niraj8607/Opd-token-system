const mongoose = require('mongoose');

const tokenSchema = new mongoose.Schema({
    tokenNumber: {
        type: String,
        required: true,
        unique: true
    },
    patientName: {
        type: String,
        required: true
    },
    patientAge: {
        type: Number,
        required: true
    },
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doctor',
        required: true
    },
    timeSlot: {
        startTime: String,
        endTime: String
    },
    source: {
        type: String,
        enum: ['online', 'walkin', 'priority', 'followup', 'emergency'],
        required: true
    },
    priority: {
        type: Number,
        default: 5,
        min: 1,
        max: 10
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'completed', 'cancelled', 'no_show'],
        default: 'confirmed'
    },
    estimatedTime: {
        type: Date
    },
    actualTime: {
        type: Date
    },
    isEmergency: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

tokenSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    
    // Set priority based on source
    const priorityMap = {
        'emergency': 1,
        'priority': 2,
        'followup': 3,
        'online': 4,
        'walkin': 5
    };
    
    if (priorityMap[this.source]) {
        this.priority = priorityMap[this.source];
    }
    
    next();
});

module.exports = mongoose.model('Token', tokenSchema);