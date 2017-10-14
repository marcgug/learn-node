const mongoose = require('mongoose');
const Store = mongoose.model('Store');


exports.homepage = (req, res) => {
	console.log(req.name);
	res.render('index');
};

exports.addStore = (req, res) => {
	res.render('editStore', {title: 'Add Store'});
};

exports.createStore = async (req, res) => {
  // save this data back to the database
  const store = await (new Store(req.body)).save();
  await store.save();
  req.flash('success', `Successfully created ${store.name}. Care to leave a review?`);
  console.log('It worked!');
  res.redirect(`/store/${store.slug}`);
};

exports.updateStore = async (req, res) => {
  // 1. find and update store
  // 2. redirect to store page and tell them it worked

  req.body.location.type = 'Point';
  
  const q = {
    _id: req.params.id
  };
  const data = req.body;
  const options = {
    new: true, // return the new store instead of the old one
    runValidators: true
  };

  const store = await Store.findOneAndUpdate(q, data, options).exec();

  req.flash('success', `Successfully updated <strong>${store.name}</strong>. <a href="/stores/${store.slug}">View Store 👉</a>`);
  res.redirect(`/stores/${store._id}/edit`);
};

exports.editStore = async (req, res) => {
  // 1. find the store given the id
  // 2. confirm they are the OWNER of the store
  // 3. render out edit form so user can update the store
  const store = await Store.findOne({_id: req.params.id});
  //res.json(store);

  res.render('editStore', {title: `Edit ${store.name}`, store: store});

}

exports.getStores = async (req, res) => {
  // 1. query db for all stores
  const stores = await Store.find();
  console.log(stores);

  res.render('stores', {title: `Stores`, stores: stores}); 
}
