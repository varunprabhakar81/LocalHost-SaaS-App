var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt-nodejs');

var InvoiceSchema = new Schema({
  member: { type: String, lowercase: true, required: true},
  invoicedate: { type: Date, lowercase: true, required: true},
  invoiceduedate: { type: Date, lowercase: true, required: true},
  chapter: { type: String, lowercase: true, required: true},
  totalamountdue: { type: Number, required: true}
});


InvoiceSchema.pre('save', function(next) {
  var user = this;
  bcrypt.hash(user.password, null, null, function(err, hash) {
    if(err) return next(err);
    user.password = hash;
    next();
  });
});

// UserSchema.methods.comparePassword = function(password) {
// 	return bcrypt.compareSync(password, this.password);
// };

module.exports = mongoose.model('Invoice', InvoiceSchema);