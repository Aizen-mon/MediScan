const mongoose = require("mongoose");

const ScanLogSchema = new mongoose.Schema({
  batchID: String,
  result: String,
  scanner: String, // user email
  time: { type: Date, default: Date.now }
});

module.exports = mongoose.model("ScanLog", ScanLogSchema);
