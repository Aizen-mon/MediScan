const { clerkClient } = require("@clerk/clerk-sdk-node");

/**
 * Clerk Authentication Middleware
 * Verifies the session token and attaches user info to req.user
 */
async function clerkAuth(req, res, next) {
  try {
    const sessionToken = req.headers.authorization?.replace("Bearer ", "");
    
    if (!sessionToken) {
      return res.status(401).json({ error: "No session token provided" });
    }

    // Verify the session token with Clerk
    const session = await clerkClient.sessions.verifySession(sessionToken);
    
    if (!session) {
      return res.status(401).json({ error: "Invalid session token" });
    }

    // Get user details from Clerk
    const user = await clerkClient.users.getUser(session.userId);
    
    // Attach user info to request
    req.user = {
      id: user.id,
      email: user.emailAddresses[0]?.emailAddress,
      name: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.firstName || user.username || 'User',
      role: user.publicMetadata?.role || "CUSTOMER" // Role stored in Clerk user metadata
    };

    next();
  } catch (err) {
    console.error("Clerk auth error:", err);
    return res.status(401).json({ error: "Authentication failed", details: err.message });
  }
}

/**
 * Role-based authorization middleware
 * @param {...string} allowedRoles - Roles that are allowed to access the route
 */
function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: "Access denied", 
        message: `Required roles: ${allowedRoles.join(", ")}. Your role: ${req.user.role}` 
      });
    }
    next();
  };
}

module.exports = { clerkAuth, authorizeRoles };
