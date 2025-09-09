/**
 * Database Migration Script: Fix Phone Index Issue
 * 
 * This script fixes the MongoDB duplicate key error for the phone field
 * by dropping the existing unique index and creating a new sparse index
 * that allows multiple null values but ensures uniqueness for non-null values.
 */

const { MongoClient } = require('mongodb');

async function fixPhoneIndex() {
  const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017/khetiwala');
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    const usersCollection = db.collection('users');
    
    // Check if the problematic index exists
    const indexes = await usersCollection.indexes();
    const phoneIndex = indexes.find(index => index.name === 'phone_1');
    
    if (phoneIndex) {
      console.log('Found existing phone index:', phoneIndex);
      
      // Drop the existing unique index
      await usersCollection.dropIndex('phone_1');
      console.log('Dropped existing phone_1 index');
      
      // Create a new sparse index that allows multiple null values
      await usersCollection.createIndex(
        { phone: 1 }, 
        { 
          unique: true, 
          sparse: true,
          name: 'phone_1_sparse'
        }
      );
      console.log('Created new sparse phone index');
    } else {
      console.log('No existing phone index found');
      
      // Create a new sparse index
      await usersCollection.createIndex(
        { phone: 1 }, 
        { 
          unique: true, 
          sparse: true,
          name: 'phone_1_sparse'
        }
      );
      console.log('Created new sparse phone index');
    }
    
    // Verify the new index
    const newIndexes = await usersCollection.indexes();
    const newPhoneIndex = newIndexes.find(index => index.name === 'phone_1_sparse');
    console.log('New phone index:', newPhoneIndex);
    
    console.log('Phone index fix completed successfully!');
    
  } catch (error) {
    console.error('Error fixing phone index:', error);
    throw error;
  } finally {
    await client.close();
    console.log('Disconnected from MongoDB');
  }
}

// Run the migration
if (require.main === module) {
  fixPhoneIndex()
    .then(() => {
      console.log('Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { fixPhoneIndex };
