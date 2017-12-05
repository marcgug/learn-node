const mongoose = require('mongoose');
const User = mongoose.model('User');
const promisify = require('es6-promisify');

exports.loginForm = (req, res) => {
  res.render('login', {title: 'Login'});
}

exports.registerForm = (req, res) => {
  res.render('register', {title: 'Register'});
}

exports.validateRegister = (req, res, next) => {

  req.sanitizeBody('name');
  req.checkBody('name', 'You must supply a name!').notEmpty();
  req.checkBody('email', 'That email is not valid!').isEmail();
  req.sanitizeBody('email').normalizeEmail({
    gmail_remove_dots: false,
    remove_extension: false,
    gmail_remove_subaddress: false
  });

  req.checkBody('password', 'Password Cannot Be Blank!').notEmpty();
  req.checkBody('password-confirm', 'Confirmed password cannot be blank!').notEmpty();
  req.checkBody('password-confirm', 'Oops! Your passwords do not match').equals(req.body.password);

  const errors = req.validationErrors();

  if (errors) {
    req.flash('error', errors.map(err => err.msg));
    res.render('register', {title: 'Register', body: req.body, flashes: req.flash() })
    return;
  }

  next(); // there were no errors


};

// pass next because its a middleware and not the "end of the road"
exports.register = async (req, res, next) => {
  // validation was already passed
  const user = new User({
    email: req.body.email,
    name: req.body.name
  });

  const register = promisify(User.register, User);

  await register(user, req.body.password);

  //res.send("it worked");
  next();

};

exports.account = (req, res) => {
  res.render('account', {title: 'Edit your account'});
}

exports.updateAccount = async (req, res) => {
  const updates = {
    name: req.body.name,
    email: req.body.email
  };

  const user = await User.findOneAndUpdate(
    { _id : req.user._id }, 
    { $set: updates }, 
    { new: true, runValidators: true, context: 'query' }
  );

  req.flash('success', 'Updated the profile!');

  res.redirect('/account');
}








