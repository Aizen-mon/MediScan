
const mongoose = require('mongoose');
const Medicine = require('./models/Medicine');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URL || "mongodb://localhost:27017/mediscan";

async function fixTransfers() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Find all medicines
    const allMedicines = await Medicine.find({});
    console.log(`\nTotal medicines in DB: ${allMedicines.length}\n`);
    
    // Find all medicines with transfers
    const medicines = await Medicine.find({
      'ownerHistory.action': 'TRANSFERRED'
    });

    console.log(`\nFound ${medicines.length} medicines with transfers\n`);

    // Show all medicines
    for (const med of allMedicines) {
      console.log(`\n📦 ${med.batchID} - ${med.name}`);
      console.log(`   Current owner: ${med.currentOwner}`);
      console.log(`   Remaining units: ${med.remainingUnits}`);
      console.log(`   Total units: ${med.totalUnits}`);
      console.log(`   Status: ${med.status}`);
      console.log(`   Owner history:`, JSON.stringify(med.ownerHistory, null, 2));
    }
    
    console.log('\n\n=== Fixing transfers ===\n');
    
    for (const med of medicines) {
      console.log(`\n📦 Processing ${med.batchID} - ${med.name}`);
      console.log(`   Current owner: ${med.currentOwner}`);
      console.log(`   Current remainingUnits: ${med.remainingUnits}`);
      
      // Find the last transfer to the current owner
      const transfers = med.ownerHistory.filter(h => h.action === 'TRANSFERRED');
      
      if (transfers.length === 0) {
        console.log(`   ⚠️  No transfers found, skipping`);
        continue;
      }

      // Get the most recent transfer (last one in array)
      const lastTransfer = transfers[transfers.length - 1];
      
      console.log(`   Last transfer: ${lastTransfer.unitsPurchased} units to ${lastTransfer.owner}`);
      
      // Check if current owner matches the last transfer recipient
      if (med.currentOwner.toLowerCase() === lastTransfer.owner.toLowerCase()) {
        // Set remaining units to the transferred amount
        const oldRemaining = med.remainingUnits;
        med.remainingUnits = lastTransfer.unitsPurchased;
        
        // Update status
        if (med.remainingUnits === 0) {
          med.status = 'SOLD_OUT';
        } else {
          med.status = 'ACTIVE';
        }
        
        await med.save();
        
        console.log(`   ✅ Fixed: ${oldRemaining} → ${med.remainingUnits} units`);
        console.log(`   Status: ${med.status}`);
      } else {
        console.log(`   ⚠️  Current owner doesn't match last transfer, skipping`);
      }
    }

    console.log('\n✅ All transfers fixed!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixTransfers();
