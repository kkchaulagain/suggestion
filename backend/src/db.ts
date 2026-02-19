const mongoose = require('mongoose');

async function connect() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/suggestion';
  await mongoose.connect(uri);
}

async function disconnect() {
  await mongoose.disconnect();
}

module.exports = { connect, disconnect };
