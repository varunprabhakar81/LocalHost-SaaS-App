var mongoose = require('mongoose');
var Schema   = mongoose.Schema;
var titlize  = require('mongoose-title-case');
var validate = require('mongoose-validator')


var individualSchema = new Schema({
  _id: Schema.Types.ObjectId,
  name: String,
  age: Number
});

var storySchema = new Schema({
  author: { type: Schema.Types.ObjectId, ref: 'Individual' },
  title: {type: String}
});


var Story = mongoose.model('Story', storySchema);
var Individual = mongoose.model('Individual', individualSchema);


module.exports = {
    Story: Story,
    Individual: Individual
};


