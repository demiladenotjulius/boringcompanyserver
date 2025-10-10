// import mongoose from "mongoose";
// import dotenv from "dotenv";
// import Admin from "../../models/adminModel.js";
// import bcrypt from "bcrypt";

// // Load environment variables
// dotenv.config();

// // Get database name
// const db_path = "product_tracking";

// // Set up MongoDB connection string
// const mongoURI = process.env.MONGODB_URI ||
//   `mongodb+srv://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@cluster0.gpbwmkj.mongodb.net/${db_path}`;

// // Connect to MongoDB
// mongoose.connect(mongoURI)
//   .then(() => console.log('Connected to MongoDB for seeding'))
//   .catch(err => console.error('MongoDB connection error:', err));

// const createSuperAdmin = async () => {
//   try {
//     // Check if super admin already exists
//     const existingAdmin = await Admin.findOne({ role: 'superadmin' });
    
//     if (existingAdmin) {
//       console.log('Super admin already exists, skipping creation');
//       return;
//     }
    
//     // Hash the password
//     const salt = await bcrypt.genSalt(10);
//     const hashedPassword = await bcrypt.hash('AdminPass123!', salt);
    
//     // Create new super admin with hashed password
//     const superAdmin = new Admin({
//       username: 'superadmin',
//       email: 'admin@example.com',
//       password: 'AdminPass123!',
//       role: 'superadmin',
//       isActive: true
//     });
    
//     await superAdmin.save();
    
//     console.log('Super admin created successfully');
//     console.log('Username: superadmin');
//     console.log('Email: admin@example.com');
//     console.log('Password: AdminPass123!');
//     console.log('IMPORTANT: Change this password immediately after first login');
    
//   } catch (error) {
//     console.error('Error creating super admin:', error);
//   } finally {
//     // Close the database connection
//     mongoose.connection.close();
//   }
// };

// // Run the function
// createSuperAdmin();