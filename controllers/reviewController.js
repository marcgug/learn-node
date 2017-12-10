const mongoose = require('mongoose');
const Store = mongoose.model('Store');
const User = mongoose.model('User');
const Review = mongoose.model('Review');

exports.createReview = async (req, res) => {
  //res.json(req.body);

  //res.send(req.params.storeId);
  //return;

  req.body.author = req.user._id;
  req.body.store = req.params.storeId;
  // save this data back to the database
  //req.body.store = 
  const review = await (new Review(req.body)).save();
  await review.save();
  req.flash('success', `Successfully created your review.`);
  console.log('It worked!');

  // get store
  const store = await Store.findOne({_id: req.params.storeId});
  res.redirect(`/stores/${store.slug}`);
};

exports.getReviews = async (req, res) => {

  const reviews = await Review.find({ store: req.params.storeId });
  res.json(reviews);

}