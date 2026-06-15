import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
dotenv.config();

const uri = process.env.MONGO_URI || "mongodb+srv://programcoderak_db_user:coder1234@cluster0.cjyosja.mongodb.net/";

async function main() {
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  
  if (!db) {
    console.log("No DB");
    return;
  }
  
  const analyses = await db.collection('analyses').find({}).limit(1).toArray();
  const rubrics = await db.collection('rubrics').find({}).limit(1).toArray();
  const summaries = await db.collection('summaries').find({}).limit(1).toArray();
  const assignments = await db.collection('assignments').find({}).limit(1).toArray();
  
  console.log('Analysis:', analyses[0]?.tokenUsage);
  console.log('Rubric:', rubrics[0]?.tokenUsage);
  console.log('Summary:', summaries[0]?.tokenUsage);
  console.log('Assignment:', assignments[0]?.tokenUsage);
  
  process.exit(0);
}

main();
