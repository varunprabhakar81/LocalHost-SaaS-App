var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var validate = require('mongoose-validator');

var journalentrySchema = new Schema({
  chapter: { type: Schema.Types.ObjectId, ref: 'Chapter', lowercase: true, required: true},
  date: { type: Date, lowercase: true, required: true},
  postingperiod: { type: String, required: true},
  gllines: [{ type: Schema.Types.ObjectId, ref: 'GLLine'}]
  //*!! Fix transaction linking
  //transaction: {type: String, lowercase: true, required: true, validate: emailValidator},
});

module.exports = mongoose.model('JournalEntry', journalentrySchema);

