const Token = require('../models/Token');
const TimeSlot = require('../models/TimeSlot');
const Doctor = require('../models/Doctor');

class AllocationService {
    
    // Core allocation algorithm
    async allocateToken(data) {
        const { doctorId, timeSlot, source, patientName, patientAge, tokenNumber } = data;
        
        try {
            const doctor = await Doctor.findById(doctorId);
            if (!doctor) {
                return { success: false, error: 'Doctor not found' };
            }
            
            // Parse time slot
            const [startTime, endTime] = timeSlot.split('-');
            
            // Find or create time slot
            let slot = await TimeSlot.findOne({
                doctorId,
                startTime,
                endTime,
                date: new Date().toDateString()
            });
            
            if (!slot) {
                // Create new time slot for today
                const doctorSlot = doctor.timeSlots.find(s => 
                    s.startTime === startTime && s.endTime === endTime
                );
                
                if (!doctorSlot) {
                    return { 
                        success: false, 
                        error: 'Invalid time slot for this doctor',
                        suggestedSlots: doctor.timeSlots
                    };
                }
                
                slot = new TimeSlot({
                    doctorId,
                    date: new Date(),
                    startTime,
                    endTime,
                    maxCapacity: doctorSlot.maxCapacity,
                    currentCount: 0,
                    reservedEmergencySlots: 1 // Reserve 1 slot for emergencies
                });
                
                await slot.save();
            }
            
            // Check capacity
            const availableSlots = slot.maxCapacity - slot.currentCount;
            
            if (availableSlots <= 0) {
                // Try to find next available slot
                const nextSlot = await this.findNextAvailableSlot(doctorId, startTime);
                if (nextSlot) {
                    return {
                        success: false,
                        error: 'Current slot is full',
                        suggestedSlots: [nextSlot]
                    };
                }
                return { 
                    success: false, 
                    error: 'All slots are full for today' 
                };
            }
            
            // Check for emergency slot reservation
            if (source !== 'emergency' && availableSlots <= slot.reservedEmergencySlots) {
                // Reserve slots for emergencies only
                const nextSlot = await this.findNextAvailableSlot(doctorId, startTime);
                return {
                    success: false,
                    error: 'Only emergency slots available in this time slot',
                    suggestedSlots: nextSlot ? [nextSlot] : []
                };
            }
            
            // Allocate the token
            slot.currentCount += 1;
            slot.tokens.push(tokenNumber);
            
            if (slot.currentCount >= slot.maxCapacity) {
                slot.status = 'full';
            }
            
            await slot.save();
            
            // Calculate estimated time (simple calculation)
            const slotDuration = 60; // minutes
            const avgConsultationTime = slotDuration / slot.maxCapacity;
            const estimatedWaitTime = (slot.currentCount - 1) * avgConsultationTime;
            
            // Calculate estimated time
            const [startHour, startMinute] = startTime.split(':').map(Number);
            const estimatedTime = new Date();
            estimatedTime.setHours(startHour, startMinute + estimatedWaitTime, 0, 0);
            
            return {
                success: true,
                timeSlot: { startTime, endTime },
                estimatedTime,
                estimatedWaitTime
            };
            
        } catch (error) {
            console.error('Allocation error:', error);
            return { success: false, error: 'Allocation failed' };
        }
    }
    
    async findNextAvailableSlot(doctorId, currentStartTime) {
        const doctor = await Doctor.findById(doctorId);
        if (!doctor) return null;
        
        // Get today's date
        const today = new Date().toDateString();
        
        // Sort time slots by start time
        const sortedSlots = doctor.timeSlots.sort((a, b) => 
            a.startTime.localeCompare(b.startTime)
        );
        
        // Find current slot index
        const currentIndex = sortedSlots.findIndex(slot => 
            slot.startTime === currentStartTime
        );
        
        if (currentIndex === -1) return null;
        
        // Check next slots
        for (let i = currentIndex + 1; i < sortedSlots.length; i++) {
            const slot = sortedSlots[i];
            
            // Check if slot exists in database
            const existingSlot = await TimeSlot.findOne({
                doctorId,
                startTime: slot.startTime,
                endTime: slot.endTime,
                date: today
            });
            
            const availableSlots = existingSlot ? 
                slot.maxCapacity - existingSlot.currentCount : 
                slot.maxCapacity;
            
            if (availableSlots > 0) {
                return {
                    startTime: slot.startTime,
                    endTime: slot.endTime,
                    availableSlots
                };
            }
        }
        
        return null;
    }
    
    async handleEmergency(data) {
        const { doctorId, patientName, patientAge, tokenNumber } = data;
        
        try {
            const doctor = await Doctor.findById(doctorId);
            if (!doctor) {
                return { success: false, error: 'Doctor not found' };
            }
            
            // Get today's slots
            const today = new Date().toDateString();
            const todaySlots = await TimeSlot.find({
                doctorId,
                date: today,
                status: { $in: ['available', 'full'] }
            }).sort({ startTime: 1 });
            
            // Try to fit emergency patient in current or upcoming slots
            for (const slot of todaySlots) {
                // Emergency can take reserved slot or overflow
                if (slot.currentCount < slot.maxCapacity + 1) { // Allow overflow by 1 for emergency
                    slot.currentCount += 1;
                    slot.tokens.push(tokenNumber);
                    
                    if (slot.currentCount > slot.maxCapacity) {
                        // Mark as overflow
                        slot.status = 'full';
                    }
                    
                    await slot.save();
                    
                    // Calculate estimated time
                    const [startHour, startMinute] = slot.startTime.split(':').map(Number);
                    const estimatedTime = new Date();
                    estimatedTime.setHours(startHour, startMinute, 0, 0);
                    
                    // Emergency gets priority, so minimal wait time
                    const estimatedWaitTime = 0;
                    
                    return {
                        success: true,
                        timeSlot: { 
                            startTime: slot.startTime, 
                            endTime: slot.endTime 
                        },
                        estimatedTime,
                        estimatedWaitTime
                    };
                }
            }
            
            // If no slot available, suggest other doctors
            const otherDoctors = await Doctor.find({
                _id: { $ne: doctorId },
                specialization: doctor.specialization
            }).limit(3);
            
            return {
                success: false,
                error: 'No available slots for emergency',
                suggestedDoctors: otherDoctors.map(d => ({
                    id: d._id,
                    name: d.name,
                    specialization: d.specialization
                }))
            };
            
        } catch (error) {
            console.error('Emergency handling error:', error);
            return { success: false, error: 'Emergency allocation failed' };
        }
    }
    
    async handleCancellation(token) {
        try {
            const slot = await TimeSlot.findOne({
                doctorId: token.doctorId,
                startTime: token.timeSlot.startTime,
                endTime: token.timeSlot.endTime,
                date: new Date(token.createdAt).toDateString()
            });
            
            if (slot) {
                slot.currentCount = Math.max(0, slot.currentCount - 1);
                
                // Remove token from slot's token array
                slot.tokens = slot.tokens.filter(t => t !== token.tokenNumber);
                
                if (slot.currentCount < slot.maxCapacity) {
                    slot.status = 'available';
                }
                
                await slot.save();
                
                // If there are waiting patients, notify or reallocate
                await this.notifyWaitingPatients(slot);
            }
            
        } catch (error) {
            console.error('Cancellation handling error:', error);
        }
    }
    
    async handleNoShow(token) {
        // Similar to cancellation but might have different business logic
        await this.handleCancellation(token);
        
        // Additional logic for no-shows (like penalties, notifications, etc.)
        console.log(`No-show recorded for token ${token.tokenNumber}`);
    }
    
    async notifyWaitingPatients(slot) {
        // In a real system, this would send notifications to waiting patients
        console.log(`Slot ${slot.startTime}-${slot.endTime} has ${slot.maxCapacity - slot.currentCount} available slots`);
    }
    
    async reallocateTokensForDoctor(doctorId) {
        try {
            const doctor = await Doctor.findById(doctorId);
            if (!doctor) {
                return { success: false, error: 'Doctor not found' };
            }
            
            const today = new Date().toDateString();
            const tokens = await Token.find({
                doctorId,
                createdAt: { 
                    $gte: new Date(today), 
                    $lt: new Date(new Date(today).setDate(new Date(today).getDate() + 1))
                },
                status: 'confirmed'
            }).sort({ priority: 1, createdAt: 1 });
            
            // Clear all slots for today
            await TimeSlot.deleteMany({
                doctorId,
                date: today
            });
            
            // Reallocate all tokens
            let reallocatedCount = 0;
            let failedCount = 0;
            
            for (const token of tokens) {
                const result = await this.allocateToken({
                    doctorId,
                    timeSlot: `${token.timeSlot.startTime}-${token.timeSlot.endTime}`,
                    source: token.source,
                    patientName: token.patientName,
                    patientAge: token.patientAge,
                    tokenNumber: token.tokenNumber
                });
                
                if (result.success) {
                    reallocatedCount++;
                } else {
                    failedCount++;
                }
            }
            
            return {
                success: true,
                reallocatedCount,
                failedCount,
                totalTokens: tokens.length
            };
            
        } catch (error) {
            console.error('Reallocation error:', error);
            return { success: false, error: 'Reallocation failed' };
        }
    }
    
    // Prioritization logic
    getPriorityScore(source, isEmergency = false) {
        if (isEmergency) return 1;
        
        const priorityScores = {
            'emergency': 1,
            'priority': 2,    // Paid priority
            'followup': 3,    // Follow-up patients
            'online': 4,      // Online booking
            'walkin': 5       // Walk-in patients
        };
        
        return priorityScores[source] || 5;
    }
}

module.exports = new AllocationService();