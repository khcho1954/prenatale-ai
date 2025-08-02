import { Router } from "express";
import bcrypt from "bcryptjs";
import { storage } from "../storage";

const router = Router();

// Change password endpoint
router.put("/password", async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.session?.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Current password and new password are required" });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: "New password must be at least 8 characters" });
    }

    // Get user from storage
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if user has Google account (no password)
    if (user.googleId) {
      return res.status(400).json({ error: "Google accounts cannot change password" });
    }

    // Verify current password
    if (!user.password) {
      return res.status(400).json({ error: "No password set for this account" });
    }

    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ error: "Current password is incorrect" });
    }



    // Update password in storage (password will be hashed automatically in storage method)
    await storage.updateUserPassword(userId, newPassword);

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Password change error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Forgot password endpoint (placeholder)
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    // Check if user exists
    const user = await storage.getUserByEmail(email);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // For now, just return success (in production, you'd send an actual email)
    console.log(`Password reset requested for email: ${email}`);
    
    res.json({ message: "Password reset email sent" });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;