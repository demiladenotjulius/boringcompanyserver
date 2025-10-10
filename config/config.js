import dotenv from 'dotenv';
dotenv.config();

const PORT = process.env.PORT ? Number(process.env.PORT) : 10000;
const DB_NAME = process.env.MONGODB_DB || 'boring-comapny';

export const config = {
  server: { port: PORT },
  mongodb: {
    url:
      process.env.MONGODB_URI ||
      `mongodb+srv://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}` +
      `@cluster0.gpbwmkj.mongodb.net/${DB_NAME}`
  }
};
