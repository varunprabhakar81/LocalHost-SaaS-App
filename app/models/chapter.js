var mongoose = require('mongoose');
var Schema   = mongoose.Schema;
var titlize  = require('mongoose-title-case');
var validate = require('mongoose-validator')

var chapternameValidator = [
  validate({
    validator: 'matches',
    arguments: /^[a-zA-Z\d\-_\s]+$/,
    message: 'Chapter name must be alphanumeric'
  })
];

var websiteValidator = [
  validate({
    validator: 'matches',
    arguments: /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[-;:&=\+\$,\w]+@)?[A-Za-z0-9.-]+|(?:www.|[-;:&=\+\$,\w]+@)[A-Za-z0-9.-]+)((?:\/[\+~%\/.\w-_]*)?\??(?:[-\+=&;%@.\w_]*)#?(?:[\w]*))?)/,
    message: 'Is not a valid website'
  }),
  validate({
    validator: 'isLength',
    arguments: [3, 40],
    message: 'Website should be between {ARGS[0]} and {ARGS[1]} characters'
  })
];

var ChapterSchema = new Schema({
  chaptername: {type: String, required: true, unique: true, validate: chapternameValidator},
  website: {type: String, required: true, validate: websiteValidator}
});

module.exports = mongoose.model('Chapter', ChapterSchema);


