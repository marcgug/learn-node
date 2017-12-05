const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const slug = require('slugs');

const storeSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    required: 'Please enter a store name!'
  },
  slug: String,
  description: {
    type: String,
    trim: true
  },
  tags: [String],
  created: {
    type: Date,
    default: Date.now
  },
  location: {
    type: {
      type: String,
      default: 'Point'
    },
    coordinates: [{
      type: Number,
      required: 'You must supply coordinates!'
    }],
    address: {
      type: String,
      required: 'You must supply an address!'
    },
  },
  photo: String,
  author: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: 'You must supply an author'
  }
});

storeSchema.index({
  name: 'text',
  description: 'text'
});

storeSchema.pre('save', async function(next) {
  if (!this.isModified('name')) {
    next(); // skip it
    return; // stop function from running
  }
  this.slug = slug(this.name);

  // find other stores that have this slug already
  const slugRegEx = new RegExp(`^(${this.slug})((-[0-9]*$)?)$`, 'i');
  const storesWithSlug = await this.constructor.find({slug: slugRegEx});

  if (storesWithSlug.length) {
    this.slug = `${this.slug}-${storesWithSlug.length + 1}`
  }


  next();
  // TODO make slugs unique
});

// must use proper function (not arrow function) so that we can
// use this.
storeSchema.statics.getTagsList = function() {
  return this.aggregate([
    { $unwind: '$tags' },
    { $group: { _id: '$tags', count: {$sum: 1} }},
    { $sort: { count: -1 }}
  ]);
}

// if main thing exporting from a file is going to be importable, do 
// module.exports

// whereas in storeController, just export properties on the export variable

// main diff: is main thing importing a function or an object?
module.exports = mongoose.model('Store', storeSchema);