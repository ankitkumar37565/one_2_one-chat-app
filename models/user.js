const mongoose = require("mongoose");
const userSchema = mongoose.Schema({
  username: {
    type: String,
    unique: true,
    required: true,
  },
  password: String,

});
module.exports = mongoose.model("Users", userSchema);
