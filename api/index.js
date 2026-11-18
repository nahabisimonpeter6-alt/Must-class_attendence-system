// Vercel entry point. Reuses the existing Express app in src/app.js unchanged.
require('dotenv').config();
const mongoose = require('mongoose');
const app = require('../src/app');

let connecting = null; // cached between requests on a warm serverless instance

async function connect() {
  if (mongoose.connection.readyState === 1) return;
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI is not set in the Vercel environment variables.');
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is not set in the Vercel environment variables.');
  if (!connecting) {
    connecting = mongoose
      .connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 8000 })
      .catch((err) => { connecting = null; throw err; });
  }
  await connecting;
}

module.exports = async (req, res) => {
  try {
    await connect();
  } catch (err) {
    console.error('DB connection failed:', err.message);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ success: false, message: 'Database connection failed: ' + err.message }));
  }
  return app(req, res);
};
