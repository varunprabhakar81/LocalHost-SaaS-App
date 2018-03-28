var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var InvoiceLinesSchema = new Schema({
  item: { type: String, required: true},
  quantity: { type: Number, required: true},
  rate: { type: Number, required: true},
  amount: { type: Number, required: true}
});


// UserSchema.methods.comparePassword = function(password) {
// 	return bcrypt.compareSync(password, this.password);
// };
module.exports = mongoose.model('InvoiceLines', InvoiceLinesSchema);