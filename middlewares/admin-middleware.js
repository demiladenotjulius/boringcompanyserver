// Authenticate Admin
import jwt from 'jsonwebtoken'
import Admin from '.././models/adminModel.js'

export const authenticateAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization']
    
    // Check if the authorization header exists
    if (!authHeader) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authorization header is missing!' 
      })
    }
    
    const token = authHeader.split(' ')[1]
    
    if (!token) {
      return res.status(404).json({ 
        success: false, 
        message: 'Token not found!' 
      })
    }
    
    jwt.verify(token, process.env.SECRET, async (err, decodedToken) => {
      if (err) {
        return res.status(401).json({ 
          success: false, 
          message: 'Unauthorized: Invalid or expired token' 
        })
      }
      
      // Find the admin by ID from token
      const admin = await Admin.findById(decodedToken.id)
      
      if (!admin || !admin.isActive) {
        return res.status(403).json({ 
          success: false, 
          message: 'Unauthorized: Admin account not found or inactive' 
        })
      }
      
      // Set admin in request object
      req.admin = admin
      
      // Update last login time
      admin.lastLogin = new Date()
      await admin.save()
      
      next()
    })
  } catch (err) {
    console.log(err.message)
    return res.status(500).json({ 
      success: false, 
      message: 'Server error during authentication' 
    })
  }
}