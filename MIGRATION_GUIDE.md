# Migration Guide for Medicine Registration Fix

## Overview
This update fixes the critical bug where medicine registration was failing due to missing required fields (`totalUnits` and `remainingUnits`). It also adds enhanced features for stock management and purchase tracking.

## Breaking Changes

### Database Schema
The `Medicine` model now requires two additional fields:
- `totalUnits` (Number, required) - Total number of units in the batch
- `remainingUnits` (Number, required) - Current number of available units

### Migration Steps

#### For New Installations
No migration needed. The system will work out of the box.

#### For Existing Installations with Data

If you have existing medicine records in your MongoDB database, you need to update them to include the required fields:

```javascript
// Run this in MongoDB shell or using MongoDB Compass

// Update all existing medicines to add default values
db.medicines.updateMany(
  { totalUnits: { $exists: false } },
  { 
    $set: { 
      totalUnits: 1000,      // Set a default value
      remainingUnits: 1000   // Set same as totalUnits initially
    } 
  }
)
```

Or use this Node.js script:

```javascript
// migration.js
require('dotenv').config();
const mongoose = require('mongoose');

async function migrate() {
  await mongoose.connect(process.env.MONGO_URL);
  
  const Medicine = mongoose.model('Medicine', require('./models/Medicine').schema);
  
  const result = await Medicine.updateMany(
    { totalUnits: { $exists: false } },
    { 
      $set: { 
        totalUnits: 1000,
        remainingUnits: 1000
      } 
    }
  );
  
  console.log(`Updated ${result.modifiedCount} medicine records`);
  await mongoose.disconnect();
}

migrate();
```

## New Features

### 1. Stock Management
- Display total units and remaining units in medicine lists
- Stock status indicators (In Stock, Low Stock, Out of Stock)
- Low stock warnings when remaining units < 20% of total

### 2. Purchase/Sale Functionality
Pharmacies and distributors can now:
- Process sales and reduce stock
- Track customer purchases
- Automatically update medicine status to SOLD_OUT when stock reaches zero

**Access:** Go to Dashboard → "Process Sale" tab (visible for PHARMACY and DISTRIBUTOR roles)

### 3. Enhanced Validation
- Manufacturing date cannot be in the future
- Expiry date must be after manufacturing date
- Batch ID format validation (alphanumeric and hyphens only)
- Total units must be between 1 and 1,000,000

## API Changes

### Updated Endpoint: `POST /medicine/register`

**Old Request:**
```json
{
  "batchID": "BATCH-001",
  "name": "Aspirin 100mg",
  "manufacturer": "PharmaCorp",
  "mfgDate": "2024-01-01",
  "expDate": "2026-01-01"
}
```

**New Request (with totalUnits):**
```json
{
  "batchID": "BATCH-001",
  "name": "Aspirin 100mg",
  "manufacturer": "PharmaCorp",
  "mfgDate": "2024-01-01",
  "expDate": "2026-01-01",
  "totalUnits": 1000
}
```

### New Endpoint: `POST /medicine/purchase/:batchID`

Process a sale and reduce stock.

**Authentication:** Required (Clerk token)
**Authorization:** PHARMACY, DISTRIBUTOR, or MANUFACTURER role

**Request:**
```json
{
  "unitsPurchased": 50,
  "customerEmail": "customer@example.com"  // Optional
}
```

**Response:**
```json
{
  "success": true,
  "message": "✅ 50 units sold",
  "medicine": { /* updated medicine object */ }
}
```

## Testing the Changes

### 1. Test Medicine Registration
1. Login as a MANUFACTURER
2. Go to "Register Medicine" tab
3. Fill in all fields including "Total Units" (new field)
4. Submit the form
5. Verify the medicine appears in the overview with stock information

### 2. Test Purchase Functionality
1. Login as a PHARMACY or DISTRIBUTOR
2. Go to "Process Sale" tab
3. Select a medicine batch you own
4. Enter units to sell
5. Optionally add customer email
6. Submit and verify stock is reduced

### 3. Test Stock Display
1. Check the Overview tab
2. Verify medicines show "Stock: X/Y units" with status badges
3. Test verification with a batch ID
4. Verify stock information appears in verification results

## Troubleshooting

### Medicine Registration Fails
**Error:** "Missing required fields"
**Solution:** Ensure you're filling in the "Total Units" field

### Cannot Process Sale
**Error:** "Only current owner can process sales"
**Solution:** You can only sell medicines you currently own. Check the owner email matches your account.

### Low Stock Warning
**Info:** Medicines with < 20% stock show "Low Stock" badge
**Action:** Consider re-ordering or transferring more stock

## Rollback Instructions

If you need to rollback this update:

1. Checkout the previous commit
2. The old code will work, but new medicines won't be registrable
3. You'll need to manually set totalUnits/remainingUnits in the database for any records created during the update

## Support

For issues or questions:
1. Check the logs in browser console (F12)
2. Check backend logs in the terminal
3. Verify Clerk authentication is working
4. Ensure MongoDB is connected
5. Check that user roles are properly set in Clerk Dashboard metadata
