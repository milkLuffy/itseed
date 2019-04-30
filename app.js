/**
 * app.js
 *
 * Use `app.js` to run your app without `sails lift`.
 * To start the server, run: `node app.js`.
 *
 * This is handy in situations where the sails CLI is not relevant or useful.
 *
 * For example:
 *   => `node app.js`
 *   => `forever start app.js`
 *   => `node debug app.js`
 *   => `modulus deploy`
 *   => `heroku scale`
 *
 *
 * The same command-line arguments are supported, e.g.:
 * `node app.js --silent --port=80 --prod`
 */

// Ensure we're in the project directory, so relative paths work as expected
// no matter where we actually lift from.
process.chdir(__dirname);

// Ensure a "sails" can be located:
(function() {
  var sails;
  try {
    sails = require('sails');
  } catch (e) {
    console.error('To run an app using `node app.js`, you usually need to have a version of `sails` installed in the same directory as your app.');
    console.error('To do that, run `npm install sails`');
    console.error('');
    console.error('Alternatively, if you have sails installed globally (i.e. you did `npm install -g sails`), you can use `sails lift`.');
    console.error('When you run `sails lift`, your app will still use a local `./node_modules/sails` dependency if it exists,');
    console.error('but if it doesn\'t, the app will run with the global sails instead!');
    return;
  }

  // Try to get `rc` dependency
  var rc;
  try {
    rc = require('rc');
  } catch (e0) {
    try {
      rc = require('sails/node_modules/rc');
    } catch (e1) {
      console.error('Could not find dependency: `rc`.');
      console.error('Your `.sailsrc` file(s) will be ignored.');
      console.error('To resolve this, run:');
      console.error('npm install rc --save');
      rc = function () { return {}; };
    }
  }
//   var express    = require('express');  
// var nodemailer = require("nodemailer");  
// var app        = express();  
  
// var smtpTransport = nodemailer.createTransport({  
//     service: "gmail",  
//     host: "smtp.gmail.com",  
//     auth: {  
//         user: "apple556621@gmail.com",  
//         pass: "iuhmsgkrcmivemod"  
//     }  
// });  
  
// app.get('/', function(req, res) {  
//     res.sendfile('index.html');  
// });  
  
// app.get('/sendmail2', function(req, res) {  
//     var mailOptions = {  
//         to:"apple556621@gmail.com",  
//         subject:"測試信箱寄信",  
//         html:'</div><div>Email: '+ req.query.email +'</div>'  
//     }  
//     smtpTransport.sendMail(mailOptions, function(error, response) {  
//      if(error) {  
//         res.end("error");  
//         console.log("wryyyyyy");
//      } else {  
//         res.end("sent");  
//         console.log("mudaaa");
//      }  
//    });  
// });  
  
// app.listen(3000, function() {  
//     console.log("Application started on http://localhost:3000/");  
// });  


  // Start server
  sails.lift(rc('sails'));
})();
