require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const QRCode = require("qrcode");
const crypto = require("crypto");
const { clerkClient } = require("@clerk/clerk-sdk-node");

const Medicine = require("./models/Medicine");
const ScanLog = require("./models/ScanLog");
const { clerkAuth, authorizeRoles } = require("./middleware/clerkAuth");

const app = express();

// CORS configuration - adjust origins for production
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true
}));

app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => {
    console.error("❌ MongoDB Error:", err.message);
    process.exit(1); // Exit if database connection fails
  });

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ 
    status: "ok", 
    message: "MediScan API is running",
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? "connected" : "disconnected"
  });
});

// ✅ QR Signature - Creates a signed QR code to prevent tampering
function signBatch(batchID) {
  return crypto
    .createHmac("sha256", process.env.QR_SECRET)
    .update(batchID)
    .digest("hex");
}

/* ======================================
   ✅ USER PROFILE ROUTES (Clerk-based)
====================================== */

// Get current user profile from Clerk
app.get("/auth/profile", clerkAuth, async (req, res) => {
  try {
    res.json({ 
      success: true,
      user: {
        id: req.user.id,
        email: req.user.email,
        name: req.user.name,
        role: req.user.role
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update user role (requires Clerk Dashboard or Admin API)
app.put("/auth/role", clerkAuth, authorizeRoles("ADMIN"), async (req, res) => {
  try {
    const { userId, role } = req.body;
    
    if (!userId || !role) {
      return res.status(400).json({ error: "userId and role are required" });
    }

    const validRoles = ["MANUFACTURER", "DISTRIBUTOR", "PHARMACY", "CUSTOMER", "ADMIN"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: `Invalid role. Must be one of: ${validRoles.join(", ")}` });
    }

    // Update user metadata in Clerk
    await clerkClient.users.updateUser(userId, {
      publicMetadata: { role }
    });

    res.json({ 
      success: true,
      message: "User role updated successfully",
      userId,
      role
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ======================================
   ✅ MEDICINE ROUTES
====================================== */

// ✅ Get all medicines (with optional filtering)
app.get("/medicine/list", clerkAuth, async (req, res) => {
  try {
    const { status, owner } = req.query;
    
    let filter = {};
    if (status) filter.status = status;
    if (owner) filter.currentOwner = owner;
    
    const medicines = await Medicine.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, count: medicines.length, medicines });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Register Medicine (ONLY Manufacturer)
app.post("/medicine/register",
  clerkAuth,
  authorizeRoles("MANUFACTURER"),
  async (req, res) => {
    try {
      const { batchID, name, manufacturer, mfgDate, expDate } = req.body;

      // Validate required fields
      if (!batchID || !name || !manufacturer || !mfgDate || !expDate) {
        return res.status(400).json({ 
          error: "Missing required fields",
          required: ["batchID", "name", "manufacturer", "mfgDate", "expDate"]
        });
      }

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

      res.status(201).json({ 
        success: true,
        message: "✅ Medicine Registered", 
        medicine: med 
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// ✅ Transfer Ownership (Manufacturer/Distributor/Pharmacy)
app.post("/medicine/transfer/:batchID",
  clerkAuth,
  authorizeRoles("MANUFACTURER", "DISTRIBUTOR", "PHARMACY"),
  async (req, res) => {
    try {
      const batchID = req.params.batchID;
      const { newOwnerEmail, newOwnerRole } = req.body;

      // Validate input
      if (!newOwnerEmail || !newOwnerRole) {
        return res.status(400).json({ 
          error: "Missing required fields",
          required: ["newOwnerEmail", "newOwnerRole"]
        });
      }

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

      res.json({ 
        success: true,
        message: "✅ Ownership transferred", 
        medicine: med 
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// ✅ Block Medicine (Admin)
app.post("/medicine/block/:batchID",
  clerkAuth,
  authorizeRoles("ADMIN"),
  async (req, res) => {
    try {
      const batchID = req.params.batchID;

      const med = await Medicine.findOne({ batchID });
      if (!med) return res.status(404).json({ error: "Batch not found" });

      med.status = "BLOCKED";
      await med.save();

      res.json({ 
        success: true,
        message: "✅ Medicine BLOCKED", 
        medicine: med 
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// ✅ QR Code Generation (Any logged-in user can generate)
app.get("/medicine/qrcode/:batchID", clerkAuth, async (req, res) => {
  try {
    const batchID = req.params.batchID;

    const med = await Medicine.findOne({ batchID });
    if (!med) return res.status(404).json({ error: "Batch not found" });

    const sig = signBatch(batchID);
    const baseURL = process.env.FRONTEND_URL || `http://localhost:${process.env.PORT}`;
    const qrURL = `${baseURL}/medicine/verify/${batchID}?sig=${sig}`;

    const qr = await QRCode.toDataURL(qrURL);
    res.json({ 
      success: true,
      batchID, 
      qrURL, 
      qr 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Verify Medicine (Public - no auth required)
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
      return res.json({ 
        success: false,
        batchID, 
        result: "❌ FAKE (QR tampered/invalid)" 
      });
    }

    const med = await Medicine.findOne({ batchID });
    if (!med) {
      await ScanLog.create({
        batchID,
        result: "❌ FAKE (Not Registered)",
        scanner: "UNKNOWN"
      });
      return res.json({ 
        success: false,
        batchID, 
        result: "❌ FAKE (Not Registered)" 
      });
    }

    if (med.status === "BLOCKED") {
      await ScanLog.create({
        batchID,
        result: "❌ BLOCKED",
        scanner: "UNKNOWN"
      });
      return res.json({ 
        success: false,
        batchID, 
        result: "❌ BLOCKED Medicine", 
        details: med 
      });
    }

    await ScanLog.create({
      batchID,
      result: "✅ GENUINE",
      scanner: "UNKNOWN"
    });

    res.json({
      success: true,
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
app.get("/logs", clerkAuth, authorizeRoles("ADMIN"), async (req, res) => {
  try {
    const logs = await ScanLog.find().sort({ time: -1 });
    res.json({ 
      success: true,
      count: logs.length,
      logs 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Error handling middleware
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({ 
    error: "Internal server error",
    message: err.message 
  });
});

// ✅ 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: "Route not found",
    path: req.path 
  });
});

const PORT = process.env.PORT || 5000;

console.log(`📝 Attempting to start server on port ${PORT}...`);

try {
  const server = app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`✅ Server listening on port ${PORT}`);
    console.log(`✅ Server address:`, server.address());
  });

  server.on('error', (error) => {
    console.error('❌ Server failed to start:', error.message);
    if (error.code === 'EADDRINUSE') {
      console.error(`❌ Port ${PORT} is already in use. Please use a different port.`);
    }
    process.exit(1);
  });

  server.on('listening', () => {
    console.log('✅ Server is now listening for connections');
  });
} catch (error) {
  console.error('❌ Fatal error starting server:', error);
  process.exit(1);
}
