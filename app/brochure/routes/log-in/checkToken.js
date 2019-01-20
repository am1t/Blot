var User = require("user");
var authenticate = require("./authenticate");
var LogInError = require('./logInError');

// The purpose of this function is to check to see if the
// user has requested the log in page with a one-time access
// token. If so, validate it, then redirect the user to the
// appropriate page: the dashboard homepage or somewhere specified
// in the query 'then'.
module.exports = function checkToken(req, res, next) {
  var token, then, redirect;

  // There is no token,  then proceed to the next middleware.
  if (!req.query || !req.query.token) return next();

  token = req.query.token;

  // I had previously introduced a bug caused by the fact
  // decodeURIComponent(undefined) === 'undefined'
  // First check that there is 'then' query before attempting to decode
  if (req.query.then) then = decodeURIComponent(req.query.then);

  // First we make sure that the access token passed is valid.
  User.checkAccessToken(token, function(err, uid) {
    if (err || !uid) return next(new LogInError("BADTOKEN"));

    // Then we load the user associated with the access token.
    // Tokens are stored against UIDs in the database.
    User.getById(uid, function(err, user) {
      if (err || !user) return next(new LogInError("NOUSER"));

      // Store the valid user'd ID in the session.
      authenticate(req, user);

      // If the user does not need to be redirected to another page
      // send them to the dashboard's homepage. Users will be redirected
      // elsewhere when they attempt to visit private pages, or when they
      // request a link to reset their password.
      if (then !== "/account/set-password") return res.redirect("/");

      User.generateAccessToken(uid, function(err, token) {
        if (err) return next(err);

        redirect = then + "?token=" + token;

        res.redirect(redirect);
      });
    });
  });
};