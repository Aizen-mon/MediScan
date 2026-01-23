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

    // Verify the session token with Clerk using verifyToken
    let verifiedToken;
    try {
      verifiedToken = await clerkClient.verifyToken(sessionToken);
    } catch (verifyError) {
      // Provide more specific error messages
      if (verifyError.message?.includes('expired')) {
        return res.status(401).json({ error: "Session token expired", message: "Please sign in again" });
      }
      if (verifyError.message?.includes('invalid')) {
        return res.status(401).json({ error: "Invalid session token", message: "Authentication failed" });
      }
      throw verifyError; // Re-throw unknown errors
    }
    
    if (!verifiedToken || !verifiedToken.sub) {
      return res.status(401).json({ error: "Invalid session token" });
    }

    // Get user details from Clerk
    const user = await clerkClient.users.getUser(verifiedToken.sub);
    
    // Safely determine the user's primary email address
    const primaryEmail =
      (Array.isArray(user.emailAddresses) &&
        user.emailAddresses.length > 0 &&
        user.emailAddresses[0] &&
        user.emailAddresses[0].emailAddress) ||
      (user.primaryEmailAddress && user.primaryEmailAddress.emailAddress) ||
      null;

    if (!primaryEmail) {
      return res.status(400).json({
        error: "User email not found",
        message: "No email address is associated with this account",
      });
    }
    
    // Attach user info to request
    req.user = {
      id: user.id,
      email: primaryEmail,
      name: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.firstName || user.username || 'User',
      role: user.publicMetadata?.role || "CUSTOMER" // Role stored in Clerk user metadata
    };

    next();
  } catch (err) {
    console.error("Clerk auth error:", err);
    return res.status(401).json({ 
      error: "Authentication failed", 
      message: err.message || "Unable to verify session"
    });
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
