const express = require('express');
const router = express.Router();
const storeController = require ('../controllers/storeController')
// destructuring - creates a variable called catchErrors by importing only the method we need
const { catchErrors } = require('../handlers/errorHandlers');

// Do work here
router.get('/', catchErrors(storeController.getStores));
router.get('/stores', catchErrors(storeController.getStores));
router.get('/add', storeController.addStore);

// handle when user presses add on store create function
router.post('/add', 
  storeController.upload, 
  catchErrors(storeController.resize),
  catchErrors(storeController.createStore)
);

router.post('/add/:id', 
  storeController.upload,
  catchErrors(storeController.resize),
  catchErrors(storeController.updateStore)
);
router.get('/stores/:id/edit', catchErrors(storeController.editStore));

router.get('/stores/:slug', catchErrors(storeController.getStoreBySlug));

module.exports = router;
