const { Schema } = require('mongoose');

exports.xraySchema = new Schema({
  type: String,
  identifier: String,
  widgetCount: Number,
  created: { type: Date, default: Date.now },
});
