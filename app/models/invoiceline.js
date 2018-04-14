var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var invoiceLineSchema = new Schema({
  invoice: { type: Schema.Types.ObjectId, ref: 'Invoice' },
  item: { type: Schema.Types.ObjectId, ref: 'Item', required: true},
  quantity: { type: Number, required: true},
  rate: { type: Number, required: true},
  amount: { type: Number, required: true}
});

module.exports = mongoose.model('InvoiceLine', invoiceLineSchema);