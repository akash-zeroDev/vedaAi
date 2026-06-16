import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
dotenv.config();

const uri = process.env.MONGO_URI || "mongodb+srv://programcoderak_db_user:coder1234@cluster0.cjyosja.mongodb.net/";

async function main() {
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  
  if (!db) return;
  
  const analyses = await db.collection('analyses').find({}).toArray();
  const rubrics = await db.collection('rubrics').find({}).toArray();
  const summaries = await db.collection('summaries').find({}).toArray();
  const assignments = await db.collection('assignments').find({}).toArray();
  
  let tA = 0, tR = 0, tS = 0, tAssign = 0;
  analyses.forEach(a => { tA += (a.tokenUsage || 0); if(a.tokenUsage) console.log('Found Analysis tokens:', a.tokenUsage); });
  rubrics.forEach(r => { tR += (r.tokenUsage || 0); if(r.tokenUsage) console.log('Found Rubric tokens:', r.tokenUsage); });
  summaries.forEach(s => { tS += (s.tokenUsage || 0); if(s.tokenUsage) console.log('Found Summary tokens:', s.tokenUsage); });
  assignments.forEach(a => { tAssign += (a.tokenUsage || 0); if(a.tokenUsage) console.log('Found Assignment tokens:', a.tokenUsage); });
  
  console.log('Total Analysis:', tA);
  console.log('Total Rubric:', tR);
  console.log('Total Summary:', tS);
  console.log('Total Assignment:', tAssign);
  
  process.exit(0);
}

main();
