var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var validate = require('mongoose-validator');

var emailValidator = [
  validate({
    validator: 'isEmail',
    arguments: /^(([a-zA-Z]{3,30})+[ ]+([a-zA-Z]{3,30}))+$/,
    message: 'Is not a valid e-mail'
  }),
  validate({
    validator: 'isLength',
    arguments: [3, 40],
    message: 'Email should be between {ARGS[0]} and {ARGS[1]} characters'
  })
];

var invoiceSchema = new Schema({
  amountdue: { type: Number, required: true}, 
  amountpaid: { type: Number, required: true},
  amountremaining: { type: Number, required: true},
  aracct: { type: Schema.Types.ObjectId, ref: 'GLAccount', required: true},
  billingemail: {type: String, lowercase: true, required: true, validate: emailValidator},
  chapter: { type: Schema.Types.ObjectId, ref: 'Chapter', lowercase: true, required: true},
  invoicedate: { type: Date, lowercase: true, required: true},
  invoiceduedate: { type: Date, lowercase: true, required: true},
  invoiceterms: { type: Number, lowercase: true, required: true},
  member: { type: Schema.Types.ObjectId, ref: 'Member', required: true},
  postingperiod: { type: String, required: true},
  lines: [{ type: Schema.Types.ObjectId, ref: 'InvoiceLine'}]
});


module.exports = mongoose.model('Invoice', invoiceSchema);

