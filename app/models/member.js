var mongoose = require('mongoose');
var Schema   = mongoose.Schema;
var titlize  = require('mongoose-title-case');
var validate = require('mongoose-validator')

var membernameValidator = [
  validate({
    validator: 'matches',
    arguments: /^[a-zA-Z\d\-_\s]+$/,
    message: 'Member name must be alphanumeric'
  })
];

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

var termsSchema = new Schema({
  name: {type: String},
  days: { type: Number }
});

var MemberSchema = new Schema({
  membername: {type: String, required: true, unique: true, validate: membernameValidator},
  email: {type: String, lowercase: true, required: true, unique: true, validate: emailValidator},
  aracct: { type: Schema.Types.ObjectId, ref: 'GLAccount'},
  invoiceterms: termsSchema,
  chapters: [{ type: Schema.Types.ObjectId, ref: 'Chapter'}]
});

module.exports = mongoose.model('Member', MemberSchema);


