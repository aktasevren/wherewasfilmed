/**
 * Aranan/görüntülenen film kaydı — az yer kaplayacak şekilde kısa alan adları.
 * m: movieId (tt...), t: title (liste için, opsiyonel), at: createdAt
 */
const mongoose = require('mongoose');

const schema = new mongoose.Schema(
  {
    m: { type: String, required: true, index: true },   // movieId (tt...)
    t: { type: String, maxlength: 80, default: '' },    // title (liste için)
    at: { type: Date, default: Date.now, index: true }, // createdAt
  },
  {
    _id: true,
    id: false,
    minimize: true,
    strict: true,
  }
);

// Son arananlar: at'e göre azalan (m ve at zaten field index: true ile var)
schema.index({ at: -1 });

const SearchRecord = mongoose.models?.SearchRecord || mongoose.model('SearchRecord', schema);

module.exports = SearchRecord;
