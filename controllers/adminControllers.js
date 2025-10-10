import Admin from "../models/adminModel.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
// import Tracking from "../models/trackingModel.js";
// import Status from "../models/statusModel.js";

dotenv.config();

export const registerInitialAdmin = async (req, res) => {
    try {
      // Check if any admin exists
      const adminCount = await Admin.countDocuments();
      
      // If admins already exist, prevent registration
      if (adminCount > 4) {
        return res.status(403).json({ 
          success: false,
          message: "Two admin accounts already exist. No more admins can be registered."
        });
      }
      
      // Validate request body
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: "Please provide email and password"
        });
      }
      
      // Create the admin
      const admin = new Admin({
        email,
        password,
        role: 'superadmin',
        isActive: true
      });
      
      await admin.save();
      
      // Generate token
      const token = jwt.sign(
        { id: admin._id, role: admin.role },
        process.env.SECRET,
        { expiresIn: "24h" }
      );
      
      return res.status(201).json({
        success: true,
        message: "Admin created successfully",
        data: {
          admin: {
            id: admin._id,
            // username: admin.username,
            email: admin.email,
            role: admin.role
          },
          token
        }
      });
      
    } catch (error) {
      console.error("Error creating admin:", error);
      return res.status(500).json({
        success: false,
        message: "Error creating admin account",
        error: error.message
      });
    }
  };


  export const loginAdmin = async (req, res) => {
    try {
      console.log("Login attempt with body:", req.body);
      const { email, password } = req.body;
  
      // Validation
      if (!email || !password) {
        console.log("Missing email or password");
        return res.status(400).json({
          success: false,
          message: "Please provide email and password",
        });
      }
  
      // Find admin by email
      console.log("Looking for admin with email:", email);
      const admin = await Admin.findOne({ email });
      console.log("Admin lookup result:", admin ? "Found" : "Not found");
  
      if (!admin) {
        return res.status(401).json({
          success: false,
          message: "Invalid credentials",
        });
      }
  
      // Check if account is active
      console.log("Admin active status:", admin.isActive);
      if (!admin.isActive) {
        return res.status(403).json({
          success: false,
          message: "Account is inactive. Please contact system administrator.",
        });
      }
  
      // Verify password
      console.log("Attempting password verification");
      try {
        const isMatch = await admin.comparePassword(password);
        console.log("Password match result:", isMatch);
        
        if (!isMatch) {
          return res.status(401).json({
            success: false,
            message: "Invalid credentials",
          });
        }
      } catch (pwError) {
        console.error("Password comparison error:", pwError);
        throw pwError;
      }
  
      // Generate token
      console.log("Generating JWT token");
      const token = jwt.sign(
        { id: admin._id, role: admin.role },
        process.env.SECRET,
        { expiresIn: "24h" }
      );
  
      // Update last login time
      admin.lastLogin = new Date();
      await admin.save();
  
      console.log("Login successful");
      res.status(200).json({
        success: true,
        message: "Login successful",
        data: {
          admin: {
            id: admin._id,
            // username: admin.username,
            email: admin.email,
            role: admin.role,
          },
          token,
        },
      });
    } catch (error) {
      console.error("Error in admin login:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  };

// Get admin profile
export const getAdminProfile = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin._id).select("-password");

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    res.status(200).json({
      success: true,
      data: {
        admin,
      },
    });
  } catch (error) {
    console.error("Error fetching admin profile:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Change admin password
// Change admin password
// Change admin password
// Change admin password - fixed version
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Please provide current and new password",
      });
    }

    // Find the admin
    const admin = await Admin.findById(req.admin._id);

    // Verify current password
    const isMatch = await admin.comparePassword(currentPassword);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    // Update the password and let the pre-save middleware handle hashing
    admin.password = newPassword;
    await admin.save();

    res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};
