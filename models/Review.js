const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const slug = require('slugs');

const reviewSchema = new mongoose.Schema({
  text: {
    type: String,
    trim: true,
    required: 'Please enter a review!'
  },
  rating: {
    type: Number,
    required: 'You must select a rating',
    min: 1,
    max: 5
  },
  store: {
    type: mongoose.Schema.ObjectId,
    ref: 'Store',
    required: 'You must supply a store'
  },
  author: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: 'You must supply an author'
  },
  created: {
    type: Date,
    default: Date.now
  }
});

function autopopulate(next) {
  this.populate('author');
  next();
}

reviewSchema.pre('find', autopopulate);
reviewSchema.pre('findOne', autopopulate);

module.exports = mongoose.model('Review', reviewSchema);