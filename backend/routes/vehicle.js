const express = require('express');
const router = express.Router();
const Vehicle = require('../models/Vehicle');

// Get all vehicles
router.get('/', async (req, res) => {
    try {
        const vehicles = await Vehicle.find().sort({ createdAt: -1 });
        res.json(vehicles);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Add a vehicle
router.post('/', async (req, res) => {
    try {
        const { shuttleId, driverName, route, status } = req.body;

        let vehicle = await Vehicle.findOne({ shuttleId });
        if (vehicle) {
            return res.status(400).json({ msg: 'Vehicle with this Shuttle ID already exists' });
        }

        vehicle = new Vehicle({
            shuttleId,
            driverName,
            route,
            status: status || 'Active'
        });

        await vehicle.save();
        res.json(vehicle);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Update a vehicle
router.put('/:id', async (req, res) => {
    try {
        const { shuttleId, driverName, route, status } = req.body;

        let vehicle = await Vehicle.findById(req.params.id);
        if (!vehicle) {
            return res.status(404).json({ msg: 'Vehicle not found' });
        }

        vehicle.shuttleId = shuttleId || vehicle.shuttleId;
        vehicle.driverName = driverName || vehicle.driverName;
        vehicle.route = route || vehicle.route;
        vehicle.status = status || vehicle.status;

        await vehicle.save();
        res.json(vehicle);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Delete a vehicle
router.delete('/:id', async (req, res) => {
    try {
        const vehicle = await Vehicle.findById(req.params.id);
        if (!vehicle) {
            return res.status(404).json({ msg: 'Vehicle not found' });
        }

        await vehicle.deleteOne();
        res.json({ msg: 'Vehicle removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
