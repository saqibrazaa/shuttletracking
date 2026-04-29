const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
    shuttleId: {
        type: String,
        required: true,
        unique: true
    },
    driverName: {
        type: String,
        required: true
    },
    route: {
        type: String,
        required: true
    },
    energyGrid: {
        type: Number,
        default: 88
    },
    status: {
        type: String,
        default: 'Active',
        enum: ['Active', 'Inactive', 'Maintenance', 'Delayed']
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Vehicle', vehicleSchema);
