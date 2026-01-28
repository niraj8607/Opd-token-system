const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

// Simulation configuration
const DOCTORS = [
    {
        name: 'Dr. Smith',
        specialization: 'Cardiology',
        timeSlots: [
            { startTime: '09:00', endTime: '10:00', maxCapacity: 5 },
            { startTime: '10:00', endTime: '11:00', maxCapacity: 5 },
            { startTime: '11:00', endTime: '12:00', maxCapacity: 5 },
            { startTime: '14:00', endTime: '15:00', maxCapacity: 5 },
            { startTime: '15:00', endTime: '16:00', maxCapacity: 5 }
        ],
        workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
    },
    {
        name: 'Dr. Johnson',
        specialization: 'Orthopedics',
        timeSlots: [
            { startTime: '09:00', endTime: '10:00', maxCapacity: 6 },
            { startTime: '10:00', endTime: '11:00', maxCapacity: 6 },
            { startTime: '11:00', endTime: '12:00', maxCapacity: 6 },
            { startTime: '14:00', endTime: '15:00', maxCapacity: 6 },
            { startTime: '15:00', endTime: '16:00', maxCapacity: 6 }
        ],
        workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
    },
    {
        name: 'Dr. Williams',
        specialization: 'Pediatrics',
        timeSlots: [
            { startTime: '09:00', endTime: '10:00', maxCapacity: 8 },
            { startTime: '10:00', endTime: '11:00', maxCapacity: 8 },
            { startTime: '11:00', endTime: '12:00', maxCapacity: 8 },
            { startTime: '14:00', endTime: '15:00', maxCapacity: 8 },
            { startTime: '15:00', endTime: '16:00', maxCapacity: 8 }
        ],
        workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
    }
];

const PATIENTS = [
    { name: 'John Doe', age: 35, source: 'online' },
    { name: 'Jane Smith', age: 28, source: 'walkin' },
    { name: 'Robert Johnson', age: 45, source: 'priority' },
    { name: 'Emily Davis', age: 32, source: 'followup' },
    { name: 'Michael Brown', age: 60, source: 'online' },
    { name: 'Sarah Wilson', age: 25, source: 'walkin' },
    { name: 'David Miller', age: 50, source: 'priority' },
    { name: 'Lisa Taylor', age: 40, source: 'online' },
    { name: 'James Anderson', age: 55, source: 'walkin' },
    { name: 'Maria Thomas', age: 30, source: 'followup' }
];

async function simulateOPD() {
    console.log('=== OPD Simulation Started ===\n');
    
    try {
        // Step 1: Create Doctors
        console.log('1. Creating doctors...');
        const doctorIds = [];
        
        for (const doctorData of DOCTORS) {
            const response = await axios.post(`${BASE_URL}/doctors`, doctorData);
            doctorIds.push(response.data.doctor._id);
            console.log(`   Created: ${doctorData.name} (${doctorData.specialization})`);
        }
        
        // Step 2: Create Tokens
        console.log('\n2. Creating tokens...');
        
        const tokens = [];
        let tokenCount = 0;
        
        for (let i = 0; i < 15; i++) {
            const doctorIndex = i % doctorIds.length;
            const patientIndex = i % PATIENTS.length;
            const slotIndex = Math.floor(i / 3) % 5; // Distribute across slots
            
            const doctorId = doctorIds[doctorIndex];
            const patient = PATIENTS[patientIndex];
            const timeSlot = `${DOCTORS[doctorIndex].timeSlots[slotIndex].startTime}-${DOCTORS[doctorIndex].timeSlots[slotIndex].endTime}`;
            
            try {
                const response = await axios.post(`${BASE_URL}/tokens`, {
                    patientName: patient.name,
                    patientAge: patient.age,
                    doctorId,
                    timeSlot,
                    source: patient.source
                });
                
                tokens.push(response.data.token.tokenNumber);
                tokenCount++;
                console.log(`   Created token ${response.data.token.tokenNumber} for ${patient.name} (${patient.source})`);
                
            } catch (error) {
                console.log(`   Failed to create token: ${error.response?.data?.error || error.message}`);
            }
        }
        
        // Step 3: Add Emergency Patient
        console.log('\n3. Adding emergency patient...');
        
        try {
            const emergencyResponse = await axios.post(`${BASE_URL}/tokens/emergency`, {
                doctorId: doctorIds[0],
                patientName: 'Emergency Patient',
                patientAge: 65
            });
            
            console.log(`   Emergency token created: ${emergencyResponse.data.token.tokenNumber}`);
            tokens.push(emergencyResponse.data.token.tokenNumber);
            
        } catch (error) {
            console.log(`   Emergency failed: ${error.response?.data?.error || error.message}`);
        }
        
        // Step 4: Simulate Cancellations
        console.log('\n4. Simulating cancellations...');
        
        if (tokens.length > 0) {
            // Cancel first token
            try {
                const cancelResponse = await axios.put(`${BASE_URL}/tokens/${tokens[0]}/cancel`);
                console.log(`   Cancelled token: ${tokens[0]}`);
            } catch (error) {
                console.log(`   Cancellation failed: ${error.message}`);
            }
        }
        
        // Step 5: Simulate No-Show
        console.log('\n5. Simulating no-show...');
        
        if (tokens.length > 1) {
            try {
                const noShowResponse = await axios.put(`${BASE_URL}/tokens/${tokens[1]}/no-show`);
                console.log(`   Marked as no-show: ${tokens[1]}`);
            } catch (error) {
                console.log(`   No-show marking failed: ${error.message}`);
            }
        }
        
        // Step 6: Check Doctor Schedules
        console.log('\n6. Checking doctor schedules...');
        
        for (let i = 0; i < doctorIds.length; i++) {
            try {
                const scheduleResponse = await axios.get(`${BASE_URL}/doctors/${doctorIds[i]}/schedule`);
                const slots = scheduleResponse.data.slots;
                
                console.log(`\n   ${DOCTORS[i].name}'s Schedule:`);
                slots.forEach(slot => {
                    console.log(`   ${slot.startTime}-${slot.endTime}: ${slot.currentCount}/${slot.maxCapacity} patients`);
                });
                
            } catch (error) {
                console.log(`   Failed to get schedule: ${error.message}`);
            }
        }
        
        // Step 7: Reallocate Tokens
        console.log('\n7. Reallocating tokens...');
        
        try {
            const reallocateResponse = await axios.post(`${BASE_URL}/tokens/reallocate/${doctorIds[0]}`);
            console.log(`   Reallocation result: ${reallocateResponse.data.message}`);
            console.log(`   Stats: ${JSON.stringify(reallocateResponse.data.stats)}`);
        } catch (error) {
            console.log(`   Reallocation failed: ${error.message}`);
        }
        
        console.log('\n=== OPD Simulation Completed ===');
        console.log(`Total tokens created: ${tokenCount}`);
        console.log(`Emergency cases: 1`);
        console.log(`Cancellations: 1`);
        console.log(`No-shows: 1`);
        
    } catch (error) {
        console.error('Simulation error:', error.message);
    }
}

// Run simulation
simulateOPD();