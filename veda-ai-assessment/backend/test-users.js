const mongoose = require('mongoose');
require('dotenv').config();

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const users = await mongoose.connection.collection('users').find({}, { projection: { email: 1, _id: 1 } }).toArray();
  console.log('Users:', users);
  const assignments = await mongoose.connection.collection('assignments').find({}, { projection: { userId: 1, title: 1 } }).toArray();
  console.log('Assignments:', assignments);
  process.exit(0);
}
run();
