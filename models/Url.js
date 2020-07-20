const mongoose = require("mongoose");

const UrlSchema = new mongoose.Schema({
  fullAddress: {
    type: String,
    required: true,
    trim: true,
  },
  shortAddressNumber: {
    type: Number,
    required: true,
  },
});

module.exports = mongoose.model("Url", UrlSchema);
