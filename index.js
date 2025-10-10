import dotenv from 'dotenv'
dotenv.config()
import express from 'express'
import { connectToDB } from './database/db.js'
import { handleErrors } from './middlewares/errorHandler.js'
import { authRoutes } from './routes/auth-routes.js'
// import { authRoutes } from './routes/auth-routes.js'
import  adminRouter  from './routes/admin-routes.js'
// import  adminRouter  from './routes/admin-routes.js'
import  trackingRouter  from './routes/tracking-routes.js'
import helmet from 'helmet'
import cors from 'cors'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'
// import swaggerUi from 'swagger-ui-express';
// import swaggerFile from './swagger/swagger-output.json';
import Admin from "./models/adminModel.js";

import { startStatusScheduler } from './controllers/scheduledTasks.js';


const app = express()
const port = process.env.PORT || 4500;
// helmet to secure app by setting http response headers
app.use(helmet());                                        
app.use(morgan('tiny'))

let limiter = rateLimit({
  max: 1000,
  windowMs: 60 * 60 * 1000,
  message: "We have received too many requests from this IP. Please try again after one hour."
})

// middlewares
app.use('/api', limiter)
app.use(express.json())
app.use(express.urlencoded({extended: true}))

// cors config
const allowedOrigins = [
  'http://localhost:5177',
  'http://localhost:5175',
  'https://boringcompmay-front.vercel.app',
  'https://boringcompmay-front.vercel.app',
  'https://boringcompany.vip',
  'https://www.boringcompany.vip',


];

const corsOptions = {
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps, curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

// routes
app.use('/api/v1/auth', authRoutes)
app.use('/api/v1/admin', adminRouter)
app.use('/api/v1/tracking', trackingRouter);




// Serve Swagger docs on '/api-docs' route
// app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerFile));

// home
app.get('/', (req, res) => {
  res.json({success: true, message: 'Backend Connected Successfully'})
})

// not found
app.get('*', (req, res) => {
  res.json({success: false, message: "Request Not found!"})
})

// error handler
app.use(handleErrors)

// connect to database
await connectToDB()

async function cleanupIndexes() {
  try {
    await Admin.collection.dropIndex("username_1");
    console.log("Dropped username index successfully");
  } catch (error) {
    if (error.code === 27) {
      console.log("Index already doesn't exist");
    } else {
      console.error("Error dropping index:", error);
    }
  }
}

await cleanupIndexes();
startStatusScheduler();



const server = app.listen(port, () => {
  console.log(`Server running on port ${server.address().port}`)
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    // If the specified port is in use, let the OS assign an available port
    console.log(`Port ${port} is busy, trying another port...`);
    const server = app.listen(0, () => {
      const newPort = server.address().port;
      console.log(`Server running on port ${newPort}`);
    });
  } else {
    console.error('Failed to start server:', err);
  }
});