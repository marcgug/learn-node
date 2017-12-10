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
},{
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

storeSchema.index({
  name: 'text',
  description: 'text'
});

storeSchema.index({ location: '2dsphere' });

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

storeSchema.statics.getTopStores = function() {
  return this.aggregate([
    // 1. lookup stores and populate reviews
    // 2. filter for only items with 2 or more reviews
    // 3. add the average reviews
    // 4. sort by newest field, highest field
    // 5. limit to at most 10.
    { 
      $lookup: { 
        from: 'reviews', 
        localField: '_id', 
        foreignField: 'store', 
        as: 'reviews'
      } 
    },
    {
      $match: {
        'reviews.1': { $exists: true }
      }
    },
    {
      $addFields: {
        averageRating: { $avg: '$reviews.rating' }
      }
    },
    {
      $sort: {
        averageRating : -1
      }
    },
    {
      $limit: 10 
    }

  ]);
}

storeSchema.virtual('reviews', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'store'
});

function autopopulate(next) {
  this.populate('reviews');
  next();
}

storeSchema.pre('find', autopopulate);
storeSchema.pre('findOne', autopopulate);

// if main thing exporting from a file is going to be importable, do 
// module.exports

// whereas in storeController, just export properties on the export variable

// main diff: is main thing importing a function or an object?
module.exports = mongoose.model('Store', storeSchema);