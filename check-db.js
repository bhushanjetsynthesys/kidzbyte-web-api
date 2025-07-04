const mongoose = require('mongoose');
require('dotenv').config();

async function checkDatabase() {
  try {
    await mongoose.connect(process.env.MONGO_URL || 'mongodb://localhost:27017/kidzbyte', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✓ Connected to database');
    
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    console.log('All collections:', collections.map(c => c.name));
    
    // Check schoolDetails collection specifically
    const schoolDetailsCollection = db.collection('schoolDetails');
    const schoolCount = await schoolDetailsCollection.countDocuments();
    console.log('Schools in "schoolDetails" collection:', schoolCount);
    
    if (schoolCount > 0) {
      const sampleSchool = await schoolDetailsCollection.findOne();
      console.log('Sample school:', sampleSchool.name);
    }
    
    // Check with lowercase
    const schooldetailsCollection = db.collection('schooldetails');
    const schoolCount2 = await schooldetailsCollection.countDocuments();
    console.log('Schools in "schooldetails" collection:', schoolCount2);
    
    if (schoolCount2 > 0) {
      const sampleSchool2 = await schooldetailsCollection.findOne();
      console.log('Sample school 2:', sampleSchool2.name);
    }
    
  } catch (error) {
    console.error('Database check error:', error);
  } finally {
    mongoose.connection.close();
  }
}

checkDatabase();
