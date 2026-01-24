const mongoose = require("mongoose");

const MedicineSchema = new mongoose.Schema({
  batchID: { type: String, unique: true, required: true },
  name: String,
  manufacturer: String,
  mfgDate: String,
  expDate: String,

  // ✅ Units stock per batch
  totalUnits: { type: Number, required: true },
  remainingUnits: { type: Number, required: true },

  currentOwner: String,

  // ACTIVE / BLOCKED / SOLD_OUT
  status: { type: String, default: "ACTIVE" },

  ownerHistory: [
    {
      owner: String,
      role: String,
      action: String, // REGISTERED / TRANSFERRED / PURCHASED
      unitsPurchased: { type: Number, default: 0 },
      from: String, // Who transferred/sold this (for tracking outgoing transfers/sales)
      time: { type: Date, default: Date.now }
    }
  ],

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Medicine", MedicineSchema);
