const Token = require('../models/Token');
const TimeSlot = require('../models/TimeSlot');
const Doctor = require('../models/Doctor');
const { v4: uuidv4 } = require('uuid');
const allocationService = require('../services/allocationService');

exports.createToken = async (req, res) => {
    try {
        const { patientName, patientAge, doctorId, timeSlot, source } = req.body;
        
        // Check if doctor exists
        const doctor = await Doctor.findById(doctorId);
        if (!doctor) {
            return res.status(404).json({ error: 'Doctor not found' });
        }
        
        // Generate token number
        const tokenNumber = `TKN-${Date.now()}-${uuidv4().slice(0, 8)}`;
        
        // Allocate token using the allocation service
        const allocationResult = await allocationService.allocateToken({
            doctorId,
            timeSlot,
            source,
            patientName,
            patientAge,
            tokenNumber
        });
        
        if (!allocationResult.success) {
            return res.status(400).json({ 
                error: allocationResult.error,
                suggestedSlots: allocationResult.suggestedSlots 
            });
        }
        
        // Create token
        const token = new Token({
            tokenNumber,
            patientName,
            patientAge,
            doctorId,
            timeSlot: allocationResult.timeSlot,
            source,
            estimatedTime: allocationResult.estimatedTime,
            isEmergency: source === 'emergency'
        });
        
        await token.save();
        
        res.status(201).json({
            success: true,
            message: 'Token created successfully',
            token: {
                ...token.toObject(),
                estimatedWaitTime: allocationResult.estimatedWaitTime
            }
        });
        
    } catch (error) {
        console.error('Error creating token:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.cancelToken = async (req, res) => {
    try {
        const { tokenId } = req.params;
        
        const token = await Token.findById(tokenId);
        if (!token) {
            return res.status(404).json({ error: 'Token not found' });
        }
        
        if (token.status === 'cancelled') {
            return res.status(400).json({ error: 'Token already cancelled' });
        }
        
        // Update token status
        token.status = 'cancelled';
        await token.save();
        
        // Free up the slot
        await allocationService.handleCancellation(token);
        
        res.json({
            success: true,
            message: 'Token cancelled successfully'
        });
        
    } catch (error) {
        console.error('Error cancelling token:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.markNoShow = async (req, res) => {
    try {
        const { tokenId } = req.params;
        
        const token = await Token.findById(tokenId);
        if (!token) {
            return res.status(404).json({ error: 'Token not found' });
        }
        
        token.status = 'no_show';
        await token.save();
        
        // Optionally free up the slot for emergency cases
        await allocationService.handleNoShow(token);
        
        res.json({
            success: true,
            message: 'Marked as no show'
        });
        
    } catch (error) {
        console.error('Error marking no show:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getTokensByDoctor = async (req, res) => {
    try {
        const { doctorId } = req.params;
        const { date, status } = req.query;
        
        let query = { doctorId };
        
        if (date) {
            const startDate = new Date(date);
            startDate.setHours(0, 0, 0, 0);
            const endDate = new Date(date);
            endDate.setHours(23, 59, 59, 999);
            
            query.createdAt = { $gte: startDate, $lte: endDate };
        }
        
        if (status) {
            query.status = status;
        }
        
        const tokens = await Token.find(query)
            .sort({ priority: 1, createdAt: 1 })
            .populate('doctorId', 'name specialization');
        
        res.json({
            success: true,
            tokens
        });
        
    } catch (error) {
        console.error('Error fetching tokens:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.addEmergencyToken = async (req, res) => {
    try {
        const { doctorId, patientName, patientAge } = req.body;
        
        // Check if doctor exists
        const doctor = await Doctor.findById(doctorId);
        if (!doctor) {
            return res.status(404).json({ error: 'Doctor not found' });
        }
        
        // Generate token number
        const tokenNumber = `EMG-${Date.now()}-${uuidv4().slice(0, 8)}`;
        
        // Allocate emergency token
        const allocationResult = await allocationService.handleEmergency({
            doctorId,
            patientName,
            patientAge,
            tokenNumber
        });
        
        if (!allocationResult.success) {
            return res.status(400).json({ 
                error: allocationResult.error,
                suggestedDoctors: allocationResult.suggestedDoctors 
            });
        }
        
        // Create emergency token
        const token = new Token({
            tokenNumber,
            patientName,
            patientAge,
            doctorId,
            timeSlot: allocationResult.timeSlot,
            source: 'emergency',
            priority: 1, // Highest priority
            isEmergency: true,
            estimatedTime: allocationResult.estimatedTime
        });
        
        await token.save();
        
        res.status(201).json({
            success: true,
            message: 'Emergency token created successfully',
            token: {
                ...token.toObject(),
                estimatedWaitTime: allocationResult.estimatedWaitTime
            }
        });
        
    } catch (error) {
        console.error('Error adding emergency token:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.reallocateTokens = async (req, res) => {
    try {
        const { doctorId } = req.params;
        
        const result = await allocationService.reallocateTokensForDoctor(doctorId);
        
        res.json({
            success: true,
            message: 'Tokens reallocated successfully',
            stats: result
        });
        
    } catch (error) {
        console.error('Error reallocating tokens:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};