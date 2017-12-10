const mongoose = require('mongoose');
const Store = mongoose.model('Store');
const multer = require('multer');
const jimp = require('jimp');
const uuid = require('uuid');
const User = mongoose.model('User');

const multerOptions = {
  // where to store?
  storage: multer.memoryStorage(),
  fileFilter (req, file, next) {
    const isPhoto = file.mimetype.startsWith('image/');
    if (isPhoto) {
      next(null, true);
    } else {
      next({ message: 'That filetype isn\'t allowed' }, false);
    }
  }
  // what kinds of follows allowed?
};


exports.homepage = (req, res) => {
	console.log(req.name);
	res.render('index');
};

exports.addStore = (req, res) => {
	res.render('editStore', {title: 'Add Store'});
};

// middleware to handle upload
exports.upload = multer(multerOptions).single('photo');

exports.resize = async (req, res, next) => {
  // if no file..
  if (!req.file) {
    next();
    return;
  }
  console.log(req.file);
  const extension = req.file.mimetype.split('/')[1];

  // get info ready for createStore
  req.body.photo = `${uuid.v4()}.${extension}`;

  // resize
  const photo = await jimp.read(req.file.buffer)
  await photo.resize(800, jimp.AUTO);

  // save it
  await photo.write(`./public/uploads/${req.body.photo}`);

  // once it is saved to filesystem, keep going..
  next();
}

exports.createStore = async (req, res) => {
  req.body.author = req.user._id;
  // save this data back to the database
  const store = await (new Store(req.body)).save();
  await store.save();
  req.flash('success', `Successfully created ${store.name}. Care to leave a review?`);
  console.log('It worked!');
  res.redirect(`/stores/${store.slug}`);
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

const confirmOwner = (store, user) => {
  if (!store.author.equals(user._id)) {
    throw Error('You must own a store in order to edit it!');
  }
}

exports.editStore = async (req, res) => {
  // 1. find the store given the id
  const store = await Store.findOne({_id: req.params.id});
  // 2. confirm they are the OWNER of the store

  // 3. render out edit form so user can update the store
  confirmOwner(store, req.user);


  //res.json(store);

  res.render('editStore', {title: `Edit ${store.name}`, store: store});

}

exports.getStores = async (req, res) => {
  // 1. query db for all stores
  const page = req.params.page || 1;
  const limit = 4;
  const skip = (page * limit) - limit;

  const storesPromise = Store
    .find()
    .skip(skip)
    .limit(limit)
    .sort({created: 'desc'});

  const countPromise = Store.count();

  const [stores, count] = await Promise.all([storesPromise, countPromise]);
  //console.log(stores);

  const pages = Math.ceil(count / limit);

  if (!stores.length && skip) {
    req.flash('info', `Hey! You asked for page ${page} that doesn't exist, so I put you on page ${pages}`)
    res.redirect(`/stores/page/${pages}`);
    return;
  }

  res.render('stores', {title: `Stores`, stores, page, pages, count}); 
}

exports.getHeartedStores = async (req, res) => {
  
  // find stores hearted by this user

  const stores = await Store.find({
    _id : {
      $in : req.user.hearts
    }
  });

  res.render('stores', {title: `Hearted Stores`, stores: stores});

}

exports.getStoreBySlug = async (req, res, next) => {
  const store = await Store.findOne({ slug: req.params.slug })
    .populate('author');


  if (!store) {
    return next();
  }

  res.render('store', {store: store, title: store.name});
  //res.json(store);
  //res.send('it works');

}

exports.getStoresByTag = async (req, res) => {
  const tag = req.params.tag;

  const tagQuery = tag || { $exists: true };

  const tagsPromise = Store.getTagsList();
  const storesPromise = Store.find({ tags: tagQuery });

  // wait for multiple promises to return
  const [tags, stores] = await Promise.all([tagsPromise, storesPromise]);

  res.render('tag', { tags: tags, title: 'Tags', tag : tag, stores: stores});

}

exports.searchStores = async (req, res) => {
  const stores = await Store
  .find({
    $text: {
      $search: req.query.q,

    }
  }, {
    score: { $meta: 'textScore' }

  })
  .sort({
    score: { $meta: 'textScore' }
  })
  // limit to 
  .limit(5);
  res.json(stores);
}

exports.mapStores = async(req, res) => {
  const coordinates = [req.query.lng, req.query.lat].map(parseFloat);
  //res.json(coordinates);

  //make a query
  const q = {
    location: {
      $near : {
        $geometry : {
          type: 'Point',
          coordinates: coordinates
        },
        $maxDistance: 10000 // 10km
      }
    }
  };

  const stores = await Store.find(q).select('slug name description location photo').limit(10);
  res.json(stores);

}

exports.mapPage = (req, res) => {
  res.render('map', {title: 'Map'});
}

exports.heartStore = async (req, res) => {
  const hearts = req.user.hearts.map(obj => obj.toString());

  const operator = hearts.includes(req.params.id) ? '$pull' : '$addToSet';
  const user = await User.findByIdAndUpdate(req.user._id, 
    { [operator]: { hearts: req.params.id }},
    { new: true }
  );

  console.log(hearts);
  res.json(user);
}

exports.getTopStores = async (req, res) => {
  const stores = await Store.getTopStores();
  //res.json(stores);
  res.render('topStores', {stores, title: '⭐ Top Stores!'});
}