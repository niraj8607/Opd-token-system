const Doctor = require('../models/Doctor');
const TimeSlot = require('../models/TimeSlot');

exports.createDoctor = async (req, res) => {
    try {
        const { name, specialization, timeSlots, workingDays } = req.body;
        
        const doctor = new Doctor({
            name,
            specialization,
            timeSlots,
            workingDays
        });
        
        await doctor.save();
        
        res.status(201).json({
            success: true,
            message: 'Doctor created successfully',
            doctor
        });
        
    } catch (error) {
        console.error('Error creating doctor:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getAllDoctors = async (req, res) => {
    try {
        const doctors = await Doctor.find();
        
        res.json({
            success: true,
            doctors
        });
        
    } catch (error) {
        console.error('Error fetching doctors:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getDoctorSchedule = async (req, res) => {
    try {
        const { doctorId } = req.params;
        const { date } = req.query;
        
        const queryDate = date ? new Date(date) : new Date();
        
        const slots = await TimeSlot.find({
            doctorId,
            date: queryDate.toDateString()
        }).sort({ startTime: 1 });
        
        res.json({
            success: true,
            date: queryDate.toDateString(),
            slots
        });
        
    } catch (error) {
        console.error('Error fetching schedule:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.updateDoctorSlots = async (req, res) => {
    try {
        const { doctorId } = req.params;
        const { timeSlots } = req.body;
        
        const doctor = await Doctor.findById(doctorId);
        if (!doctor) {
            return res.status(404).json({ error: 'Doctor not found' });
        }
        
        doctor.timeSlots = timeSlots;
        await doctor.save();
        
        res.json({
            success: true,
            message: 'Doctor slots updated successfully',
            doctor
        });
        
    } catch (error) {
        console.error('Error updating doctor slots:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};