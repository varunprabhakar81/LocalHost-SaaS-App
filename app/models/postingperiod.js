var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var monthSchema = new Schema({
	id: {type: Number},
    name: {type: String}
});

var postingPeriodSchema = new Schema({
  month: monthSchema,
  year: { type: String, required: true},
  status: { type: String, required: true, enum: ['Open', 'Close']}
});

postingPeriodSchema.index({"year": 1, "month.name": 1},{unique: true});

module.exports = mongoose.model('PostingPeriod', postingPeriodSchema);