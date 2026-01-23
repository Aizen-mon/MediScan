require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const QRCode = require("qrcode");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("./models/User");
const Medicine = require("./models/Medicine");
const ScanLog = require("./models/ScanLog");
const { auth, authorizeRoles } = require("./middleware/auth");

const app = express();
app.use(cors());
app.use(express.json());

// ✅ DB Connect
mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.log("❌ MongoDB Error:", err.message));

// ✅ QR Signature for tamper-proof QR
function signBatch(batchID) {
  return crypto
    .createHmac("sha256", process.env.QR_SECRET)
    .update(batchID)
    .digest("hex");
}

function isExpired(expDateStr) {
  const today = new Date();
  const exp = new Date(expDateStr);
  return today > exp;
}

/* ======================================
   ✅ AUTH
====================================== */

// ✅ Register User
app.post("/auth/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!email || !password) return res.status(400).json({ error: "Email & password required" });

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ error: "User already exists" });

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashed,
      role: role || "CUSTOMER"
    });

    res.json({
      message: "✅ User registered",
      user: { name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Login
app.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "Invalid email or password" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(400).json({ error: "Invalid email or password" });

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    res.json({ message: "✅ Login successful", token, role: user.role, name: user.name });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ======================================
   ✅ MEDICINE
====================================== */

// ✅ Register Medicine (Manufacturer Only) + Units
app.post("/medicine/register",
  auth,
  authorizeRoles("MANUFACTURER"),
  async (req, res) => {
    try {
      const { batchID, name, manufacturer, mfgDate, expDate, totalUnits } = req.body;

      if (!batchID || !totalUnits) {
        return res.status(400).json({ error: "batchID and totalUnits required" });
      }

      const units = Number(totalUnits);
      if (isNaN(units) || units <= 0) {
        return res.status(400).json({ error: "totalUnits must be a positive number" });
      }

      const exists = await Medicine.findOne({ batchID });
      if (exists) return res.status(400).json({ error: "Batch already registered" });

      const med = await Medicine.create({
        batchID,
        name,
        manufacturer,
        mfgDate,
        expDate,

        totalUnits: units,
        remainingUnits: units,

        currentOwner: req.user.email,
        status: "ACTIVE",
        ownerHistory: [
          { owner: req.user.email, role: req.user.role, action: "REGISTERED" }
        ]
      });

      res.json({ message: "✅ Medicine Registered", medicine: med });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// ✅ Transfer Ownership (Manufacturer/Distributor/Pharmacy)
app.post("/medicine/transfer/:batchID",
  auth,
  authorizeRoles("MANUFACTURER", "DISTRIBUTOR", "PHARMACY"),
  async (req, res) => {
    try {
      const batchID = req.params.batchID;
      const { newOwnerEmail, newOwnerRole } = req.body;

      if (!newOwnerEmail) return res.status(400).json({ error: "newOwnerEmail required" });

      const med = await Medicine.findOne({ batchID });
      if (!med) return res.status(404).json({ error: "Batch not found" });

      if (med.status !== "ACTIVE") {
        return res.status(400).json({ error: `Cannot transfer. Status is ${med.status}` });
      }

      if (isExpired(med.expDate)) {
        return res.status(400).json({ error: "Medicine expired, cannot transfer" });
      }

      if (med.currentOwner !== req.user.email) {
        return res.status(403).json({ error: "Only current owner can transfer" });
      }

      med.currentOwner = newOwnerEmail;
      med.ownerHistory.push({
        owner: newOwnerEmail,
        role: newOwnerRole || "UNKNOWN",
        action: "TRANSFERRED"
      });

      await med.save();

      res.json({ message: "✅ Ownership transferred", medicine: med });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// ✅ Customer Purchase Medicine (units will reduce)
app.post("/medicine/purchase/:batchID",
  auth,
  authorizeRoles("CUSTOMER"),
  async (req, res) => {
    try {
      const batchID = req.params.batchID;
      const { unitsToBuy } = req.body;

      const buyUnits = Number(unitsToBuy || 1);
      if (isNaN(buyUnits) || buyUnits <= 0) {
        return res.status(400).json({ error: "unitsToBuy must be a positive number" });
      }

      const med = await Medicine.findOne({ batchID });
      if (!med) return res.status(404).json({ error: "Batch not found" });

      if (med.status !== "ACTIVE") {
        return res.status(400).json({ error: `Cannot purchase. Status is ${med.status}` });
      }

      if (isExpired(med.expDate)) {
        return res.status(400).json({ error: "Medicine expired, cannot purchase" });
      }

      if (med.remainingUnits < buyUnits) {
        return res.status(400).json({
          error: `Not enough units available. Remaining: ${med.remainingUnits}`
        });
      }

      // ✅ reduce units
      med.remainingUnits -= buyUnits;

      // optional: make customer current owner
      med.currentOwner = req.user.email;

      med.ownerHistory.push({
        owner: req.user.email,
        role: req.user.role,
        action: "PURCHASED",
        unitsPurchased: buyUnits
      });

      // ✅ if units finished -> SOLD_OUT
      if (med.remainingUnits === 0) {
        med.status = "SOLD_OUT";
      }

      await med.save();

      res.json({
        message: `✅ Purchased ${buyUnits} unit(s) successfully`,
        medicine: med
      });

    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// ✅ Block Medicine (Admin)
app.post("/medicine/block/:batchID",
  auth,
  authorizeRoles("ADMIN"),
  async (req, res) => {
    try {
      const batchID = req.params.batchID;

      const med = await Medicine.findOne({ batchID });
      if (!med) return res.status(404).json({ error: "Batch not found" });

      med.status = "BLOCKED";
      await med.save();

      res.json({ message: "✅ Medicine BLOCKED", medicine: med });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// ✅ Generate QR (Logged-in users)
app.get("/medicine/qrcode/:batchID", auth, async (req, res) => {
  try {
    const batchID = req.params.batchID;

    const med = await Medicine.findOne({ batchID });
    if (!med) return res.status(404).json({ error: "Batch not found" });

    const sig = signBatch(batchID);

    const serverIP = process.env.SERVER_IP || "localhost";
    const qrURL = `http://${serverIP}:${process.env.PORT}/medicine/verify/${batchID}?sig=${sig}`;

    const qr = await QRCode.toDataURL(qrURL);

    res.json({ batchID, qrURL, qr });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Verify Medicine (Public) - includes expiry and units
app.get("/medicine/verify/:batchID", async (req, res) => {
  try {
    const batchID = req.params.batchID;
    const sig = req.query.sig;

    const expectedSig = signBatch(batchID);
    if (!sig || sig !== expectedSig) {
      await ScanLog.create({ batchID, result: "❌ FAKE (QR tampered)", scanner: "UNKNOWN" });
      return res.json({ batchID, result: "❌ FAKE (QR tampered/invalid)" });
    }

    const med = await Medicine.findOne({ batchID });
    if (!med) {
      await ScanLog.create({ batchID, result: "❌ FAKE (Not Registered)", scanner: "UNKNOWN" });
      return res.json({ batchID, result: "❌ FAKE (Not Registered)" });
    }

    if (med.status === "BLOCKED") {
      await ScanLog.create({ batchID, result: "❌ BLOCKED Medicine", scanner: "UNKNOWN" });
      return res.json({
        batchID,
        result: "❌ BLOCKED Medicine Detected",
        details: med,
        ownerHistory: med.ownerHistory
      });
    }

    if (isExpired(med.expDate)) {
      await ScanLog.create({ batchID, result: "⚠️ EXPIRED Medicine", scanner: "UNKNOWN" });
      return res.json({
        batchID,
        result: "⚠️ EXPIRED Medicine (Do Not Use)",
        details: med,
        ownerHistory: med.ownerHistory
      });
    }

    if (med.status === "SOLD_OUT") {
      await ScanLog.create({ batchID, result: "✅ GENUINE (Sold Out)", scanner: "UNKNOWN" });
      return res.json({
        batchID,
        result: "✅ GENUINE Medicine Verified (SOLD OUT)",
        details: med,
        ownerHistory: med.ownerHistory
      });
    }

    await ScanLog.create({ batchID, result: "✅ GENUINE Medicine", scanner: "UNKNOWN" });

    res.json({
      batchID,
      result: "✅ GENUINE Medicine Verified",
      details: med,
      ownerHistory: med.ownerHistory
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Logs (Admin)
app.get("/logs", auth, authorizeRoles("ADMIN"), async (req, res) => {
  const logs = await ScanLog.find().sort({ time: -1 });
  res.json(logs);
});

// ✅ Server start (important for phone access)
app.listen(process.env.PORT, "0.0.0.0", () => {
  console.log(`✅ Server running on http://localhost:${process.env.PORT}`);
});
