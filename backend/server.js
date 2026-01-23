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

mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.log("❌ MongoDB Error:", err.message));

// ✅ QR Signature
function signBatch(batchID) {
  return crypto
    .createHmac("sha256", process.env.QR_SECRET)
    .update(batchID)
    .digest("hex");
}

/* ======================================
   ✅ AUTH ROUTES
====================================== */

// ✅ Register User
app.post("/auth/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ error: "User already exists" });

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashed,
      role: role || "CUSTOMER"
    });

    res.json({ message: "✅ User registered", user: { email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Login User
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
   ✅ MEDICINE ROUTES
====================================== */

// ✅ Register Medicine (ONLY Manufacturer)
app.post("/medicine/register",
  auth,
  authorizeRoles("MANUFACTURER"),
  async (req, res) => {
    try {
      const { batchID, name, manufacturer, mfgDate, expDate } = req.body;

      const exists = await Medicine.findOne({ batchID });
      if (exists) return res.status(400).json({ error: "Batch already registered" });

      const med = await Medicine.create({
        batchID,
        name,
        manufacturer,
        mfgDate,
        expDate,
        currentOwner: req.user.email,
        status: "ACTIVE",
        ownerHistory: [
          { owner: req.user.email, role: req.user.role }
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

      const med = await Medicine.findOne({ batchID });
      if (!med) return res.status(404).json({ error: "Batch not found" });

      if (med.status !== "ACTIVE") {
        return res.status(400).json({ error: "Medicine not ACTIVE" });
      }

      // ✅ Only current owner can transfer
      if (med.currentOwner !== req.user.email) {
        return res.status(403).json({ error: "Only current owner can transfer" });
      }

      med.currentOwner = newOwnerEmail;
      med.ownerHistory.push({
        owner: newOwnerEmail,
        role: newOwnerRole || "UNKNOWN"
      });

      await med.save();

      res.json({ message: "✅ Ownership transferred", medicine: med });
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

// ✅ QR Code Generation (Any logged-in user can generate)
app.get("/medicine/qrcode/:batchID", auth, async (req, res) => {
  try {
    const batchID = req.params.batchID;

    const med = await Medicine.findOne({ batchID });
    if (!med) return res.status(404).json({ error: "Batch not found" });

    const sig = signBatch(batchID);
    const qrURL = `http://localhost:${process.env.PORT}/medicine/verify/${batchID}?sig=${sig}`;

    const qr = await QRCode.toDataURL(qrURL);
    res.json({ batchID, qrURL, qr });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Verify Medicine (Public)
app.get("/medicine/verify/:batchID", async (req, res) => {
  try {
    const batchID = req.params.batchID;
    const sig = req.query.sig;

    const expectedSig = signBatch(batchID);
    if (!sig || sig !== expectedSig) {
      await ScanLog.create({
        batchID,
        result: "❌ FAKE (QR tampered)",
        scanner: "UNKNOWN"
      });
      return res.json({ batchID, result: "❌ FAKE (QR tampered/invalid)" });
    }

    const med = await Medicine.findOne({ batchID });
    if (!med) {
      await ScanLog.create({
        batchID,
        result: "❌ FAKE (Not Registered)",
        scanner: "UNKNOWN"
      });
      return res.json({ batchID, result: "❌ FAKE (Not Registered)" });
    }

    if (med.status === "BLOCKED") {
      await ScanLog.create({
        batchID,
        result: "❌ BLOCKED",
        scanner: "UNKNOWN"
      });
      return res.json({ batchID, result: "❌ BLOCKED Medicine", details: med });
    }

    await ScanLog.create({
      batchID,
      result: "✅ GENUINE",
      scanner: "UNKNOWN"
    });

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

// ✅ Get Scan Logs (Admin)
app.get("/logs", auth, authorizeRoles("ADMIN"), async (req, res) => {
  const logs = await ScanLog.find().sort({ time: -1 });
  res.json(logs);
});

app.listen(process.env.PORT, () => {
  console.log(`✅ Server running on http://localhost:${process.env.PORT}`);
});
