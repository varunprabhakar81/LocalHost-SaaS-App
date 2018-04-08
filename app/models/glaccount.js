var mongoose = require('mongoose');
var Schema   = mongoose.Schema;
var titlize  = require('mongoose-title-case');
var validate = require('mongoose-validator')

var nameValidator = [
  validate({
    validator: 'matches',
    arguments: /^[a-zA-Z\d\-_\s]+$/,
    message: 'Gl Account Name must be alphanumeric'
  })
];

var numberValidator = [
  validate({
    validator: 'matches',
    arguments: /^[0-9]+$/,
    message: 'GL Account number must only contain digits'
  }),
  validate({
    validator: 'isLength',
    arguments: [3, 40],
    message: 'Account number should be between {ARGS[0]} and {ARGS[1]} characters'
  })
];

var glaccountSchema = new Schema({
  glaccountname: {type: String, required: true, unique: true, validate: nameValidator},
  glaccountnumber: {type: String, required: true, unique: true, validate: numberValidator},
  glaccounttype: {type: String, required: true}
});

module.exports = mongoose.model('GLAccount', glaccountSchema);


