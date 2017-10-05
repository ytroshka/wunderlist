var mongoose = require('mongoose');
var db = mongoose.connect('mongodb://user:123@ds139985.mlab.com:39985/wunderlist_db');
var sha1 = require('sha1');

var userSchema = new mongoose.Schema({
  email: String,
  password: String,
  lists: [{
    title: String,
    tasks: [{
      title: String,
      date: {
        type: Date,
        default: new Date()
      },
      status: {
        type: Boolean,
        default: false
      },
      subtask: [{
        title: String,
        status: Boolean
      }]
    }]
  }]
});

userSchema.pre('save', function(next) {
  if(this.isNew){
    this.password = sha1(this.password);
  }
  next();
});

userSchema.methods = {
  coding: function(plainText) {
    return sha1(plainText) === this.password;
  }
};

module.exports = db.model('user', userSchema);
