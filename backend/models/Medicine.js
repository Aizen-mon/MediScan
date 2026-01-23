const mongoose = require("mongoose");

const MedicineSchema = new mongoose.Schema({
  batchID: { type: String, unique: true, required: true },
  name: String,
  manufacturer: String,
  mfgDate: String,
  expDate: String,

  currentOwner: String,
  status: { type: String, default: "ACTIVE" }, // ACTIVE / BLOCKED / SOLD

  ownerHistory: [
    {
      owner: String,
      role: String,
      time: { type: Date, default: Date.now }
    }
  ],

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Medicine", MedicineSchema);
