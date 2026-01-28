
const mongoose = require('mongoose');
const connectDB = async () => {
    try {
        const mongoURI = 'mongodb://127.0.0.1:27017/opd_system';
        
        await mongoose.connect(mongoURI);
        console.log(' MongoDB Connected Successfully!');
        
    } catch (error) {
        console.error(' MongoDB Connection Failed:', error.message);
        console.log(' Tip: Make sure MongoDB is running (run: mongod)');
        process.exit(1); 
    }
};
module.exports = connectDB;