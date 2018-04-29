var mongoose = require('mongoose');
var Schema   = mongoose.Schema;
var titlize  = require('mongoose-title-case');
var validate = require('mongoose-validator')

var nameValidator = [
  validate({
    validator: 'matches',
    arguments: /^[a-zA-Z\d\-_\s]+$/,
    message: 'Item Name must be alphanumeric'
  })
];


var itemSchema = new Schema({
  itemname: {type: String, required: true, unique: true, validate: nameValidator},
  incomeacct: { type: Schema.Types.ObjectId, ref: 'GLAccount', required: true}, 
  rate: {type: Number}
});

module.exports = mongoose.model('Item', itemSchema);

