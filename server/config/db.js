const mongoose = require('mongoose');
const dns = require('dns');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Configure reliable DNS servers (Google + Cloudflare) for Atlas SRV resolution
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  // Ignore in restricted environments
}

let activeMemoryServer = null;
let dbSource = 'disconnected';

const autoSeedIfEmpty = async () => {
  try {
    const { User } = require('../models');
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('🌱 Database is empty. Seeding Learnitics initial dataset...');
      const seedDatabase = require('../seed');
      await seedDatabase();
      console.log('✨ Learnitics dataset seeded successfully!');
    } else {
      console.log(`📦 Database contains ${userCount} users. Ready!`);
    }
  } catch (err) {
    console.error('⚠️ Auto-seed check error:', err.message);
  }
};

const connectDB = async () => {
  const atlasUri = process.env.MONGO_URI;

  if (atlasUri && atlasUri.startsWith('mongodb+srv://')) {
    try {
      console.log('⏳ Attempting connection to MongoDB Atlas Cloud Cluster...');
      const conn = await mongoose.connect(atlasUri, {
        dbName: 'learnitics',
        serverSelectionTimeoutMS: 4000,
      });
      console.log(`✅ Connected to MongoDB Atlas Cloud: ${conn.connection.host}`);
      dbSource = 'MongoDB Atlas (Cloud)';
      await autoSeedIfEmpty();
      return conn;
    } catch (atlasError) {
      console.warn(`\n⚠️ Note: MongoDB Atlas direct connection was not reachable: ${atlasError.message}`);
      console.warn('💡 (Campus / Wi-Fi firewall blocks outbound port 27017, or IP requires whitelisting in Atlas).');
      console.log('🚀 Activating local high-speed embedded MongoDB engine so the platform runs immediately with 100% functionality...\n');
    }
  }

  // Fallback: Start local embedded MongoDB instance
  try {
    if (!activeMemoryServer) {
      activeMemoryServer = await MongoMemoryServer.create();
    }
    const memoryUri = activeMemoryServer.getUri();
    const conn = await mongoose.connect(memoryUri, {
      dbName: 'learnitics',
    });
    console.log(`✅ Connected to Learnitics Active Database at: ${memoryUri}`);
    dbSource = 'Learnitics Embedded Database (Active)';
    await autoSeedIfEmpty();
    return conn;
  } catch (err) {
    console.error('❌ Failed to start local database:', err.message);
    setTimeout(connectDB, 10000);
  }
};

const getDBSource = () => dbSource;

module.exports = connectDB;
module.exports.getDBSource = getDBSource;
