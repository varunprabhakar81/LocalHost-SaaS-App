var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var glLineSchema = new Schema({
  chapter: { type: Schema.Types.ObjectId, ref: 'Chapter', lowercase: true, required: true},
  creditamt: { type: Number}, 
  date: { type: Date, lowercase: true, required: true},
  debitamt: { type: Number},
  glacct: { type: Schema.Types.ObjectId, ref: 'GLAccount', required: true},
  journal: { type: Schema.Types.ObjectId, ref: 'JournalEntry'},
  transactionsource: { type: Schema.Types.ObjectId},
  postingperiod: { type: Schema.Types.ObjectId, ref: 'PostingPeriod', required: true}
});

module.exports = mongoose.model('GLLine', glLineSchema);