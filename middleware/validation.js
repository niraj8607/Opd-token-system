
// Validate token creation request
exports.validateToken = (req, res, next) => {
    const { patientName, patientAge, doctorId, timeSlot, source } = req.body;
    
    let errors = [];
    
    // Check required fields
    if (!patientName || patientName.trim() === '') {
        errors.push('Patient name is required');
    }
    
    if (!patientAge || patientAge < 0 || patientAge > 150) {
        errors.push('Valid patient age (0-150) is required');
    }
    
    if (!doctorId) {
        errors.push('Doctor ID is required');
    }
    
    if (!timeSlot) {
        errors.push('Time slot is required');
    } else if (!timeSlot.includes('-')) {
        errors.push('Time slot should be in format "HH:MM-HH:MM"');
    }
    
    const validSources = ['online', 'walkin', 'priority', 'followup', 'emergency'];
    if (source && !validSources.includes(source)) {
        errors.push(`Source must be one of: ${validSources.join(', ')}`);
    }
    
    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            errors: errors
        });
    }
    
    next();
};

// Validate doctor creation request
exports.validateDoctor = (req, res, next) => {
    const { name, specialization, timeSlots } = req.body;
    
    let errors = [];
    
    if (!name || name.trim() === '') {
        errors.push('Doctor name is required');
    }
    
    if (!specialization || specialization.trim() === '') {
        errors.push('Specialization is required');
    }
    
    if (!timeSlots || !Array.isArray(timeSlots) || timeSlots.length === 0) {
        errors.push('At least one time slot is required');
    } else {
        // Validate each time slot
        timeSlots.forEach((slot, index) => {
            if (!slot.startTime || !slot.endTime) {
                errors.push(`Time slot ${index + 1}: startTime and endTime are required`);
            }
            
            if (!slot.maxCapacity || slot.maxCapacity < 1) {
                errors.push(`Time slot ${index + 1}: maxCapacity must be at least 1`);
            }
        });
    }
    
    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            errors: errors
        });
    }
    
    next();
};

// Validate emergency token
exports.validateEmergency = (req, res, next) => {
    const { patientName, doctorId } = req.body;
    
    let errors = [];
    
    if (!patientName || patientName.trim() === '') {
        errors.push('Patient name is required');
    }
    
    if (!doctorId) {
        errors.push('Doctor ID is required');
    }
    
    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            errors: errors
        });
    }
    
    next();
};

exports.validateId = (req, res, next) => {
    const { id } = req.params;
    
    if (!id || id.length < 10) {
        return res.status(400).json({
            success: false,
            error: 'Invalid ID format'
        });
    }
    
    next();
};