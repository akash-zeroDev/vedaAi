const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI);
const RubricSchema = new mongoose.Schema({ status: String }, { strict: false });
const Rubric = mongoose.model('Rubric', RubricSchema, 'rubrics');

async function run() {
  const doc = await Rubric.findById("6a2d10883ff923aaaef3231a").lean();
  console.log(JSON.stringify(doc, null, 2));
  process.exit(0);
}
run();
