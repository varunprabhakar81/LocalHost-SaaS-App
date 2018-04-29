var User = require('../models/user');
var Chapter = require('../models/chapter')
var Member = require('../models/member')
var GLAccount = require('../models/glaccount')
var Item = require('../models/item')
var Invoice = require('../models/invoice')
var InvoiceLine = require('../models/invoiceline')
var JournalEntry = require('../models/journalentry')
var GLLine = require('../models/glline')
var PostingPeriod = require('../models/postingperiod')
var jwt = require('jsonwebtoken');
var secret = 'harryporter';
var nodemailer = require('nodemailer');
var sgTransport = require('nodemailer-sendgrid-transport');

var mongoose = require('mongoose');

const keyPublishable = 'pk_test_iJYFD9W47WsK1phAGzshsrSu';
const keySecret = 'sk_test_7G7wpThGijNoRsdqcIWlP8UV';
const stripe = require("stripe")(keySecret);


//Routes
module.exports = function(router) {

	var options = {
	  auth: {
	    api_user: 'varunprabh',
	    api_key: 'ah3VwCzMEYrTL4'
	  }
	}

	var client = nodemailer.createTransport(sgTransport(options));


	router.post("/charge", (req, res) => {
	  console.log(req.body);

	  // let amount = 500;

	  var amount = req.body.amount;
	  var description = req.body.description;
	  var currency = req.body.currency;

	  stripe.customers.create({
	    email: req.body.token.email,
	    card: req.body.token.id
	  })
	  .then(customer =>
	    stripe.charges.create({
	      amount,
	      description: description,
	      currency: currency,
	      customer: customer.id
	    }))
	  .then(charge => res.send(charge))
	  .catch(err => {
	    console.log("Error:", err);
	    res.status(500).send({error: "Purchase Failed"});
	  });
	});


	//USER REGISTRATION ROUTE
	router.post('/users',(req, res) => {
		var user = new User();
		user.username = req.body.username;
		user.password = req.body.password;
		user.email = req.body.email;
		user.name = req.body.name;
		user.temporarytoken = jwt.sign({username: user.username, email: user.email, name: user.name}, secret, {expiresIn: '24h'});;
		
		if(req.body.username == null || req.body.username == '' || req.body.password == null || req.body.password == '' || req.body.email == null || req.body.email == '' || req.body.name == null || req.body.name == ''){
			res.json({success: false, message:'Ensure Username, Password and Email are provided'})
		}
		else { 
			user.save(function(err){
				if (err) {
					if (err.errors != null) {
						if (err.errors.name) {
						res.json({success: false, message: err.errors.name.message});
						} else if (err.errors.email) {
							res.json({success: false, message: err.errors.email.message});
						} else if (err.errors.username) {
							res.json({success: false, message: err.errors.username.message});
						} else if (err.errors.password) {
							res.json({success: false, message: err.errors.password.message});
						} else {
							res.json({success: false, message: err});
						}
					} else if(err) {
						if (err.code == 11000) {
							if (err.errmsg[60] == 'u') {
							 	res.json({success: false, message: 'That username is already taken'});
							} else if (err.errmsg[60] == 'e') {
								res.json({success: false, message: 'That email is already taken'});
							} 
							
						} else {
							res.json({success: false, message: err});
						}
					}

				} 
				else {
					var email = {
					  from: 'DigitalCloud ERP Support, support@digitalclouderp.com',
					  to: user.email,
					  subject: 'Welcome to DigitalCloud ERP! Confirm Your Email',
					  text: 'Hello' + user.name +'Thank you for registering at DigitalCloud ERP. Please click on the following link to complete your activation: http://localhost:8080/activate/' + user.temporarytoken,
					  html: 'Hello<strong> ' + user.name +'</strong>, <br><br> Thank you for registering at DigitalCloud ERP. Please click on the link below to complete your activation:<br><br> <a href="http://localhost:8080/activate/' + user.temporarytoken + '">http://localhost:8080/activate</a>'
					};

					client.sendMail(email, function(err, info){
					    if (err ){
					      //console.log(error);
					    }
					    else {
					      //console.log('Message sent: ' + info.response);
					    }
					});
					res.json({success: true, message: 'Account registered! Please check your e-mail for activation link.'});
				}
			});
		}
	});

	//USER LOGIN ROUTE
	router.post('/authenticate', function(req, res) {
		User.findOne({ username: req.body.username }).select('email username password active name').exec(function(err,user) {
			if(err) throw err;

			if(req.body.username) {

				if(!user) {
					res.json({ success : false, message:'Could not authenticate user'});
				} else if (user) {	
					if(req.body.password) {
						var validPassword = user.comparePassword(req.body.password);
						if(!validPassword) {
							res.json({ success: false, message: 'Could not authenticate password'});
						} else if (!user.active) {
							res.json({ success: false, message: 'Account is not yet activated, please check your e-mail for activation link.', expired: true});
						} else {
							var token = jwt.sign({username: user.username, email: user.email, name: user.name}, secret, {expiresIn: '24h'});
							res.json({success: true, message: 'User authenticated!', token: token});
						}
					}
					else {
						res.json({ success: false, message: 'No password provided'});
					}
				}
			}
			else {
				res.json({ success : false, message:'Username not entered'});
			}
		});
	});


	//CHECK USERNAME
	router.post('/checkusername', function(req, res) {
		User.findOne({ username: req.body.username }).select('username').exec(function(err,user) {
			if(err) throw err;

			if (user) {
				res.json( { success: false, message: 'That username is already taken' });

			} else {
				res.json( { success: true, message: 'Valid username' });
			}
		});
	});

	//CHECK E-MAIL
	router.post('/checkemail', function(req, res) {
		User.findOne({ email: req.body.email }).select('email').exec(function(err,user) {
			if(err) throw err;

			if (user) {
				res.json( { success: false, message: 'That e-mail is already taken' });

			} else {
				res.json( { success: true, message: 'Valid e-mail' });
			}
		});
	});

	router.put('/activate/:token', function(req, res) {
		User.findOne({ temporarytoken: req.params.token }, function(err, user) {
			if(err) throw err;
			var token = req.params.token;

			//verify token
			jwt.verify(token, secret, function(err, decoded) {
  				if (err) {
  					res.json({ success: false, message: 'Activation link has expired.'});
  				} else if (!user){
  					res.json({ success: false, message: 'Activation link has expired.'});

  				} else {
					user.temporarytoken = false;
					user.active = true;
					user.save(function(err) {
						if(err) {
							console.log(err);
						} else {

							var email = {
								from: 'DigitalCloud ERP Support, support@digitalclouderp.com',
								to: user.email,
								subject: 'DigitalCloud ERP Account Activated',
								text: 'Hello' + user.name +'Your account has been successfully activated!',
								html: 'Hello<strong> ' + user.name +'</strong>, <br><br>Your account has been successfully activated!'
							};

							client.sendMail(email, function(err, info){
								if (err ){
									console.log(error);
								}
								else {
									console.log('Message sent: ' + info.response);
								}
							});
							res.json({ success: true, message: 'Account activated' });
						}
					});
  				}
			});

		});
	});


	//Resend activation link
	router.post('/resend', function(req, res) {
		User.findOne({ username: req.body.username }).select('username password active').exec(function(err,user) {
		
		if(err) throw err;

			if(req.body.username) {
				if(!user) {
					res.json({ success : false, message:'Could not authenticate user'});
				} else if (user) {				
					if(req.body.password) {
					 	var validPassword = user.comparePassword(req.body.password);
					}
					else {
						res.json({ success: false, message: 'No password provided'});
					}

					if(!validPassword) {
						res.json({ success: false, message: 'Could not authenticate password'});
					} else if (user.active) {
						res.json({ success: false, message: 'Account is already activated'});
					} else {
						res.json({ success: true, user: user});
					}
				}
			}
			else {
				res.json({ success : false, message:'Username not entered'});
			}
		});
	});

	router.put('/resend', function(req,res) {
		User.findOne( { username: req.body.username } ).select('username name email temporarytoken').exec(function(err,user) {
			if(err) throw err;
			user.temporarytoken = jwt.sign({username: user.username, email: user.email}, secret, {expiresIn: '24h'});;
			user.save(function(err) {
				if(err) { 
					console.log(err);
				} else {
					var email = {
					  from: 'DigitalCloud ERP Support, support@digitalclouderp.com',
					  to: user.email,
					  subject: 'DigitalCloud ERP Activation Link Request',
					  text: 'Hello' + user.name +'You recently requested new account activation link. Please click on the following link to complete your activation: http://localhost:8080/activate/' + user.temporarytoken,
					  html: 'Hello<strong> ' + user.name +'</strong>, <br><br> You recently requested new account activation link. Please click on the link below to complete your activation:<br><br> <a href="http://localhost:8080/activate/' + user.temporarytoken + '">http://localhost:8080/activate</a>'
					};

					client.sendMail(email, function(err, info){
					    if (err ){
					      console.log(error);
					    }
					    else {
					      console.log('Message sent: ' + info.response);
					    }
					});

					res.json({ success: true, message: 'Activation link has been sent to ' + user.email + '!'});

				}
			});
		});
	});

	// Route to send user's username to e-mail
	router.get('/resetusername/:email', function(req, res) {
		User.findOne({ email: req.params.email }).select('email name username').exec(function(err, user) {
			if (err) {
				res.json({ success: false, message: err }); // Error if cannot connect
			} else {
				if(!req.params.email) {
					res.json({ success: false, message: 'No e-mail was provided' }); 
				}
				else {
					if (!user) {
					res.json({ success: false, message: 'E-mail was not found' }); // Return error if e-mail cannot be found in database
					} else {
						// If e-mail found in database, create e-mail object
						var email = {
							from: 'DigitalCloud ERP Support, support@digitalclouderp.com',
							to: user.email,
							subject: 'DigitalCloud ERP Username Request',
							text: 'Hello ' + user.name + ', You recently requested your username. Please save it in your files: ' + user.username,
							html: 'Hello<strong> ' + user.name + '</strong>,<br><br>You recently requested your username. Please save it in your files: ' + user.username
						};
						// Function to send e-mail to user
						client.sendMail(email, function(err, info) {
							if (err) console.log(err); // If error in sending e-mail, log to console/terminal
						});
						res.json({ success: true, message: 'Username has been sent to e-mail! ' }); // Return success message once e-mail has been sent
					}
				}
			}
		});
	});


	// Route to send reset link to the user
	router.put('/resetpassword', function(req, res) {
		User.findOne({ username: req.body.username }).select('username active email resettoken name').exec(function(err, user) {
			if (err) throw err; // Throw error if cannot connect
			if (!user) {
				res.json({ success: false, message: 'Username was not found' }); // Return error if username is not found in database
			} else if (!user.active) {
				res.json({ success: false, message: 'Account has not yet been activated' }); // Return error if account is not yet activated
			} else {
				user.resettoken = jwt.sign({ username: user.username, email: user.email }, secret, { expiresIn: '24h' }); // Create a token for activating account through e-mail
				// Save token to user in database
				user.save(function(err) {
					if (err) {
						res.json({ success: false, message: err }); // Return error if cannot connect
					} else {
						// Create e-mail object to send to user
						var email = {
							from: 'DigitalCloud ERP Support, support@digitalclouderp.com',
							to: user.email,
							subject: 'DigitalCloud ERP Reset Password Request',
							text: 'Hello ' + user.name + ', You recently request a password reset link. Please click on the link below to reset your password:<br><br><a href="http://localhost:8080/reset/' + user.resettoken,
							html: 'Hello<strong> ' + user.name + '</strong>,<br><br>You recently request a password reset link. Please click on the link below to reset your password:<br><br><a href="http://localhost:8080/reset/' + user.resettoken + '">http://localhost:8080/reset/</a>'
						};
						// Function to send e-mail to the user
						client.sendMail(email, function(err, info) {
							if (err) console.log(err); // If error with sending e-mail, log to console/terminal
						});
						res.json({ success: true, message: 'Please check your e-mail for password reset link' }); // Return success message
					}
				});
			}
		});
	});

	// Route to verify user's e-mail activation link
	router.get('/resetpassword/:token', function(req, res) {
		User.findOne({ resettoken: req.params.token }).select().exec(function(err, user) {
			if (err) throw err; // Throw err if cannot connect
			var token = req.params.token; // Save user's token from parameters to variable
			// Function to verify token
			jwt.verify(token, secret, function(err, decoded) {
				if (err) {
					res.json({ success: false, message: 'Password link has expired' }); // Token has expired or is invalid
				} else {
					if (!user) {
						res.json({ success: false, message: 'Password link has expired' }); // Token is valid but not no user has that token anymore
					} else {
						res.json({ success: true, user: user }); // Return user object to controller
					}
				}
			});
		});
	});

	// Save user's new password to database
	router.put('/savepassword', function(req, res) {
		User.findOne({ username: req.body.username }).select('username email name password resettoken').exec(function(err, user) {
			if (err) throw err; // Throw error if cannot connect
			if (req.body.password == null || req.body.password == '') {
				res.json({ success: false, message: 'Password not provided' });
			} else {
				user.password = req.body.password; // Save user's new password to the user object
				user.resettoken = false; // Clear user's resettoken 
				// Save user's new data
				user.save(function(err) {
					if (err) {
						res.json({ success: false, message: err });
					} else {
						// Create e-mail object to send to user
						var email = {
							from: 'DigitalCloud ERP Support, support@digitalclouderp.com',
							to: user.email,
							subject: 'DigitalCloud ERP Reset Password',
							text: 'Hello ' + user.name + ', This e-mail is to notify you that your password was recently reset at digitalclouderp.com',
							html: 'Hello<strong> ' + user.name + '</strong>,<br><br>This e-mail is to notify you that your password was recently reset at digitalclouderp.com'
						};
						// Function to send e-mail to the user
						client.sendMail(email, function(err, info) {
							if (err) console.log(err); // If error with sending e-mail, log to console/terminal
						});
						res.json({ success: true, message: 'Password has been reset!' }); // Return success message
					}
				});
			}
		});
	});

	router.use(function(req, res, next) {
		var token = req.body.token || req.body.query || req.headers['x-access-token'];

		if (token) {
			//verify token
			jwt.verify(token, secret, function(err, decoded) {
  				if (err) {
  					res.json({ success: false, message: 'Token invalid'});
  				} else{
  					req.decoded = decoded;
  					next();
  				}
			});
		} else {
			res.json({ success: false, message: 'No token provided'});
		}

	});

	router.post('/me', function(req, res) {
		res.send(req.decoded);
	});


	// Route to provide the user with a new token to renew session
	router.get('/renewToken/:username', function(req, res) {
		User.findOne({ username: req.params.username }).select('username email').exec(function(err, user) {
			if (err) throw err; // Throw error if cannot connect
			// Check if username was found in database
			if (!user) {
				res.json({ success: false, message: 'No user was found' }); // Return error
			} else {
				var newToken = jwt.sign({ username: user.username, email: user.email }, secret, { expiresIn: '24h' }); // Give user a new token
				res.json({ success: true, token: newToken }); // Return newToken in JSON object to controller
			}
		});
	});

	router.get('/permission/', function(req, res) {
		User.findOne({ username: req.decoded.username }, function(err, user) {
			if (err) throw err; // Throw error if cannot connect
			// Check if username was found in database
			if (!user) {
				res.json({ success: false, message: 'No user was found' }); // Return error
			} else {
				res.json({ success: true, permission: user.permission }); // Return newToken in JSON object to controller
			}
		});
	});

	router.get('/management/', function(req, res) {
		User.find({}, function(err, users) {
			if (err) throw err; // Throw error if cannot connect

			User.findOne({ username: req.decoded.username }, function(err, mainUser) {
				if (err) throw err;
				if(!mainUser) {
					res.json({success: false, message: 'No user found'});
				} else {
					if (mainUser.permission === 'admin' || mainUser.permission == 'moderator') {
						if(!users) {
							res.json({success: false, message: 'Users not found'});
						} else {
							res.json({success: true, users: users, permission: mainUser.permission});
				
						}
					} else {
						res.json({success: false, message: 'Insufficient Permissions'});
					}
				}
			});
		});
	});


	router.delete('/management/:username', function(req, res) {
		var deletedUser = req.params.username;

		User.findOne({ username: req.decoded.username }, function(err, mainUser) {
			if (err) throw err;
			if (!mainUser) {
				res.json({success: false, message: 'No user found'});
			} else {
				if (mainUser.permission != 'admin') {
					res.json({success: false, message: 'Insufficient Permissions'});
				} else {
					User.findOneAndRemove({ username: deletedUser }, function(err, user) {
						if(err) throw err;
						res.json({success: true});
					});
				}
			}
		});
	});

    // Route to get the user that needs to be edited
    router.get('/edit/:id', function(req, res) {
        var editUser = req.params.id; // Assign the _id from parameters to variable
        User.findOne({ username: req.decoded.username }, function(err, mainUser) {
            if (err) throw err; // Throw error if cannot connect
            // Check if logged in user was found in database
            if (!mainUser) {
                res.json({ success: false, message: 'No user found' }); // Return error
            } else {
                // Check if logged in user has editing privileges
                if (mainUser.permission === 'admin' || mainUser.permission === 'moderator') {
                    // Find the user to be editted
                    User.findOne({ _id: editUser }, function(err, user) {
                        if (err) throw err; // Throw error if cannot connect
                        // Check if user to edit is in database
                        if (!user) {
                            res.json({ success: false, message: 'No user found' }); // Return error
                        } else {
                            res.json({ success: true, user: user }); // Return the user to be editted
                        }
                    });
                } else {
                    res.json({ success: false, message: 'Insufficient Permission' }); // Return access error
                }
            }
        });
    });


 	// Route to update/edit a user
    router.put('/edit', function(req, res) {
        var editUser = req.body._id; // Assign _id from user to be editted to a variable
        if (req.body.name) var newName = req.body.name; // Check if a change to name was requested
        if (req.body.username) var newUsername = req.body.username; // Check if a change to username was requested
        if (req.body.email) var newEmail = req.body.email; // Check if a change to e-mail was requested
        if (req.body.permission) var newPermission = req.body.permission; // Check if a change to permission was requested
        // Look for logged in user in database to check if have appropriate access
        User.findOne({ username: req.decoded.username }, function(err, mainUser) {
            if (err) throw err; // Throw err if cannot connnect
            // Check if logged in user is found in database
            if (!mainUser) {
                res.json({ success: false, message: "no user found" }); // Return erro
            } else {
                // Check if a change to name was requested
                if (newName) {
                    // Check if person making changes has appropriate access
                    if (mainUser.permission === 'admin' || mainUser.permission === 'moderator') {
                        // Look for user in database
                        User.findOne({ _id: editUser }, function(err, user) {
                            if (err) throw err; // Throw error if cannot connect
                            // Check if user is in database
                            if (!user) {
                                res.json({ success: false, message: 'No user found' }); // Return error
                            } else {
                                user.name = newName; // Assign new name to user in database
                                // Save changes
                                user.save(function(err) {
                                    if (err) {
                                        console.log(err); // Log any errors to the console
                                    } else {
                                        res.json({ success: true, message: 'Name has been updated!' }); // Return success message
                                    }
                                });
                            }
                        });
                    } else {
                        res.json({ success: false, message: 'Insufficient Permissions' }); // Return error
                    }
                }

                // Check if a change to username was requested
                if (newUsername) {
                    // Check if person making changes has appropriate access
                    if (mainUser.permission === 'admin' || mainUser.permission === 'moderator') {
                        // Look for user in database
                        User.findOne({ _id: editUser }, function(err, user) {
                            if (err) throw err; // Throw error if cannot connect
                            // Check if user is in database
                            if (!user) {
                                res.json({ success: false, message: 'No user found' }); // Return error
                            } else {
                                user.username = newUsername; // Save new username to user in database
                                // Save changes
                                user.save(function(err) {
                                    if (err) {
                                        console.log(err); // Log error to console
                                    } else {
                                        res.json({ success: true, message: 'Username has been updated' }); // Return success
                                    }
                                });
                            }
                        });
                    } else {
                        res.json({ success: false, message: 'Insufficient Permissions' }); // Return error
                    }
                }

                // Check if change to e-mail was requested
                if (newEmail) {
                    // Check if person making changes has appropriate access
                    if (mainUser.permission === 'admin' || mainUser.permission === 'moderator') {
                        // Look for user that needs to be editted
                        User.findOne({ _id: editUser }, function(err, user) {
                            if (err) throw err; // Throw error if cannot connect
                            // Check if logged in user is in database
                            if (!user) {
                                res.json({ success: false, message: 'No user found' }); // Return error
                            } else {
                                user.email = newEmail; // Assign new e-mail to user in databse
                                // Save changes
                                user.save(function(err) {
                                    if (err) {
                                        console.log(err); // Log error to console
                                    } else {
                                        res.json({ success: true, message: 'E-mail has been updated' }); // Return success
                                    }
                                });
                            }
                        });
                    } else {
                        res.json({ success: false, message: 'Insufficient Permissions' }); // Return error
                    }
                }

                // Check if a change to permission was requested
                if (newPermission) {
                    // Check if user making changes has appropriate access
                    if (mainUser.permission === 'admin' || mainUser.permission === 'moderator') {
                        // Look for user to edit in database
                        User.findOne({ _id: editUser }, function(err, user) {
                            if (err) throw err; // Throw error if cannot connect
                            // Check if user is found in database
                            if (!user) {
                                res.json({ success: false, message: 'No user found' }); // Return error
                            } else {
                                // Check if attempting to set the 'user' permission
                                if (newPermission === 'user') {
                                    // Check the current permission is an admin
                                    if (user.permission === 'admin') {
                                        // Check if user making changes has access
                                        if (mainUser.permission !== 'admin') {
                                            res.json({ success: false, message: 'Insufficient Permissions. You must be an admin to downgrade an admin.' }); // Return error
                                        } else {
                                            user.permission = newPermission; // Assign new permission to user
                                            // Save changes
                                            user.save(function(err) {
                                                if (err) {
                                                    console.log(err); // Long error to console
                                                } else {
                                                    res.json({ success: true, message: 'Permissions have been updated!' }); // Return success
                                                }
                                            });
                                        }
                                    } else {
                                        user.permission = newPermission; // Assign new permission to user
                                        // Save changes
                                        user.save(function(err) {
                                            if (err) {
                                                console.log(err); // Log error to console
                                            } else {
                                                res.json({ success: true, message: 'Permissions have been updated!' }); // Return success
                                            }
                                        });
                                    }
                                }
                                // Check if attempting to set the 'moderator' permission
                                if (newPermission === 'moderator') {
                                    // Check if the current permission is 'admin'
                                    if (user.permission === 'admin') {
                                        // Check if user making changes has access
                                        if (mainUser.permission !== 'admin') {
                                            res.json({ success: false, message: 'Insufficient Permissions. You must be an admin to downgrade an admin' }); // Return error
                                        } else {
                                            user.permission = newPermission; // Assign new permission
                                            // Save changes
                                            user.save(function(err) {
                                                if (err) {
                                                    console.log(err); // Log error to console
                                                } else {
                                                    res.json({ success: true, message: 'Permissions have been updated!' }); // Return success
                                                }
                                            });
                                        }
                                    } else {
                                        user.permission = newPermission; // Assign new permssion
                                        // Save changes
                                        user.save(function(err) {
                                            if (err) {
                                                console.log(err); // Log error to console
                                            } else {
                                                res.json({ success: true, message: 'Permissions have been updated!' }); // Return success
                                            }
                                        });
                                    }
                                }

                                // Check if assigning the 'admin' permission
                                if (newPermission === 'admin') {
                                    // Check if logged in user has access
                                    if (mainUser.permission === 'admin') {
                                        user.permission = newPermission; // Assign new permission
                                        // Save changes
                                        user.save(function(err) {
                                            if (err) {
                                                console.log(err); // Log error to console
                                            } else {
                                                res.json({ success: true, message: 'Permissions have been updated!' }); // Return success
                                            }
                                        });
                                    } else {
                                        res.json({ success: false, message: 'Insufficient Permissions. You must be an admin to upgrade someone to the admin level' }); // Return error
                                    }
                                }
                            }
                        });
                    } else {
                        res.json({ success: false, message: 'Insufficient Permissions' }); // Return error

                    }
                }
            }
        });
    });

	
	//Chapter Post Route
	router.post('/addchapter',(req, res) => {
		var chapter = new Chapter();
		chapter.chaptername = req.body.chaptername;
		chapter.website = req.body.website;
	
		if(req.body.chaptername == null || req.body.chaptername == '' || req.body.website == null || req.body.website == ''){
			res.json({success: false, message:'Ensure Chapter Name and Website are provided'})
		}
		else { 
			chapter.save(function(err){
				if (err) {
					if (err.errors != null) {
						if (err.errors.chaptername) {
						res.json({success: false, message: err.errors.chaptername.message});
						} else if (err.errors.website) {
							res.json({success: false, message: err.errors.website.message});
						} else {
							res.json({success: false, message: err});
						}
					} else if(err) {
						console.log(err);
						res.json({success: false, message: err.errmsg});
					}

				}
				else {
					console.log(err);
					res.json({success: true, message: 'Chapter created!'});
				}
			});
		}
	});

	router.get('/getchapters/', function(req, res) {
		Chapter.find({}, function(err, chapters) {
			if (err) throw err; // Throw error if cannot connect

			User.findOne({ username: req.decoded.username }, function(err, mainUser) {
				if (err) throw err;
				if(!mainUser) {
					res.json({success: false, message: 'No user found'});
				} else {
					if (mainUser.permission === 'admin' || mainUser.permission == 'moderator') {
						if(!chapters) {
							res.json({success: false, message: 'No chapters found'});
						} else {
							res.json({success: true, chapters: chapters, permission: mainUser.permission});
				
						}
					} else {
						res.json({success: false, message: 'Insufficient Permissions'});
					}
				}
			});
		});
	});


	router.delete('/deletechapter/:chaptername', function(req, res) {
		var deletedChapter = req.params.chaptername;

		User.findOne({ username: req.decoded.username }, function(err, mainUser) {
			if (err) throw err;
			if (!mainUser) {
				res.json({success: false, message: 'No user found'});
			} else {
				if (mainUser.permission != 'admin') {
					res.json({success: false, message: 'Insufficient Permissions'});
				} else {
					Chapter.findOneAndRemove({ chaptername: deletedChapter }, function(err, user) {
						if(err) throw err;
						res.json({success: true});
					});
				}
			}
		});
	});


    // Route to get the chapter that needs to be edited
    router.get('/editchapter/:id', function(req, res) {
        var editChapter = req.params.id; // Assign the _id from parameters to variable
        User.findOne({ username: req.decoded.username }, function(err, mainUser) {
            if (err) throw err; // Throw error if cannot connect
            // Check if logged in user was found in database
            if (!mainUser) {
                res.json({ success: false, message: 'No user found' }); // Return error
            } else {
                // Check if logged in user has editing privileges
                if (mainUser.permission === 'admin' || mainUser.permission === 'moderator') {
                    // Find the user to be editted
                    Chapter.findOne({ _id: editChapter }, function(err, chapter) {
                        if (err) throw err; // Throw error if cannot connect
                        // Check if user to edit is in database
                        if (!chapter) {
                            res.json({ success: false, message: 'No chapter found' }); // Return error
                        } else {
                            res.json({ success: true, chapter: chapter }); // Return the user to be editted
                        }
                    });
                } else {
                    res.json({ success: false, message: 'Insufficient Permissions' }); // Return access error
                }
            }
        });
    });


 	// Route to update/edit a chapter
    router.put('/editchapter', function(req, res) {
        var editChapter = req.body._id;
        if (req.body.chaptername) var newChapterName = req.body.chaptername;
        if (req.body.website) var newWebsite = req.body.website;

        User.findOne({ username: req.decoded.username }, function(err, mainUser) {
            if (err) throw err; // Throw err if cannot connnect
            // Check if logged in user is found in database

            if (!mainUser) {
                res.json({ success: false, message: "no user found" }); // Return erro
            } else {
            	if (mainUser.permission === 'admin' || mainUser.permission === 'moderator') {
					Chapter.findOne({ _id: editChapter }, function(err, chapter) {
						if (err) throw err; // Throw error if cannot connect
                        if (!chapter) {
                                res.json({ success: false, message: 'No chapter found' }); // Return error
                        } else {
                        	if (newChapterName) {
                                chapter.chaptername = newChapterName; // Assign new name to user in database
                            }

                            if (newWebsite) {
                            	chapter.website = newWebsite;
                            }
                                // Save changes
                                chapter.save(function(err) {
                                    if (err) {
                                        console.log(err); // Log any errors to the console
                                    } else {
                                        res.json({ success: true, message: 'Chapter info has been updated!' }); // Return success message
                                    }
                                });
                            }
                        });
                    } else {
                        res.json({ success: false, message: 'Insufficient Permissions' }); // Return error
                    }
                }
            });
    });

    //Member Post Route
	router.post('/addmember',(req, res) => {
		var member = new Member();
		member.membername = req.body.membername;
		member.email = req.body.email;
		member.aracct = req.body.aracct;
		member.invoiceterms = req.body.invoiceterms;
		member.chapters = req.body.chapters;
		
	
		if(req.body.membername == null || req.body.membername == '' || req.body.email == null || req.body.email == '' || req.body.chapters == null || req.body.chapters == ''){
			res.json({success: false, message:'Ensure Member Name and Email are provided'})
		}
		else { 
			member.save(function(err){
				if (err) {
					if (err.errors != null) {
						if (err.errors.membername) {
						res.json({success: false, message: err.errors.membername.message});
						} else if (err.errors.email) {
							res.json({success: false, message: err.errors.email.message});
						} else if (err.errors.aracct) {
							res.json({success: false, message: err.errors.aracct.message});
						} else if (err.errors.invoiceterms) {
							res.json({success: false, message: err.errors.invoiceterms.message});
						} else if (err.errors.chapters) {
							res.json({success: false, message: err.errors.chapters.message});
						} else {
							res.json({success: false, message: err});
						}
					} else if(err) {
						console.log(err);
						res.json({success: false, message: err.errmsg});
					}

				}
				else {
					console.log(err);
					res.json({success: true, message: 'Member created!'});
				}
			});
		}
	});

	router.get('/getmembers/', function(req, res) {
		Member.find({}).populate('aracct chapters').exec(function(err, members) {
			if (err) throw err; // Throw error if cannot connect

			User.findOne({ username: req.decoded.username }, function(err, mainUser) {
				if (err) throw err;
				if(!mainUser) {
					res.json({success: false, message: 'No user found'});
				} else {
					if (mainUser.permission === 'admin' || mainUser.permission == 'moderator') {
						if(!members) {
							res.json({success: false, message: 'No members found'});
						} else {
							res.json({success: true, members: members, permission: mainUser.permission});
				
						}
					} else {
						res.json({success: false, message: 'Insufficient Permissions'});
					}
				}
			});
		});
	});


	router.delete('/deletemember/:membername', function(req, res) {
		var deletedMember = req.params.membername;

		User.findOne({ username: req.decoded.username }, function(err, mainUser) {
			if (err) throw err;
			if (!mainUser) {
				res.json({success: false, message: 'No user found'});
			} else {
				if (mainUser.permission != 'admin') {
					res.json({success: false, message: 'Insufficient Permissions'});
				} else {
					Member.findOneAndRemove({ membername: deletedMember }, function(err, user) {
						if(err) throw err;
						res.json({success: true});
					});
				}
			}
		});
	});


    // Route to get the member that needs to be edited
    router.get('/editmember/:id', function(req, res) {
        var editMember = req.params.id; // Assign the _id from parameters to variable
        User.findOne({ username: req.decoded.username }, function(err, mainUser) {
            if (err) throw err; // Throw error if cannot connect
            // Check if logged in user was found in database
            if (!mainUser) {
                res.json({ success: false, message: 'No user found' }); // Return error
            } else {
                // Check if logged in user has editing privileges
                if (mainUser.permission === 'admin' || mainUser.permission === 'moderator') {
                    // Find the user to be editted
                    Member.findOne({ _id: editMember }).populate('aracct chapters').exec(function(err, member) {
                        if (err) throw err; // Throw error if cannot connect
                        // Check if user to edit is in database
                        if (!member) {
                            res.json({ success: false, message: 'No member found' }); // Return error
                        } else {
                            res.json({ success: true, member: member }); // Return the user to be editted
                        }
                    });
                } else {
                    res.json({ success: false, message: 'Insufficient Permissions' }); // Return access error
                }
            }
        });
    });


 	// Route to update/edit a member
    router.put('/editmember', function(req, res) {
        var editMember = req.body._id;

        if (req.body.membername) var newMemberName = req.body.membername;
        if (req.body.email) var newEmail = req.body.email;
        if (req.body.aracct) var newAracct = req.body.aracct;
        if (req.body.invoiceterms) var newInvoiceterms = req.body.invoiceterms;
        if (req.body.chapters) var newChapters = req.body.chapters;


        User.findOne({ username: req.decoded.username }, function(err, mainUser) {
            if (err) throw err; // Throw err if cannot connnect
            // Check if logged in user is found in database
            if (!mainUser) {
                res.json({ success: false, message: "no user found" }); // Return erro
            } else {
            	if (mainUser.permission === 'admin' || mainUser.permission === 'moderator') {
            		Member.findOne({ _id: editMember }).populate('aracct').exec(function(err, member){
						if (err) throw err; // Throw error if cannot connect
                        if (!member) {
                                res.json({ success: false, message: 'No Member found' }); // Return error
                        } else {
                        	if (newMemberName) {
                                member.membername = newMemberName; // Assign new name to user in database
                            }

                            if (newEmail) {
                            	member.email= newEmail;
                            }

                            if (newAracct) {
                            	member.aracct= newAracct;
                            }

                            if (newInvoiceTerms) {
                            	member.invoiceterms = newInvoiceterms;
                            }

                            if (newChapters) {
                            	member.chapters = newChapters;
                            }
                            
                            // Save changes
                            member.save(function(err) {
                                if (err) {
                                    console.log(err); // Log any errors to the console
                                } else {
                                    res.json({ success: true, message: 'Member info has been updated!' }); // Return success message
                                }
                            });
                        }
                    });
                } else {
                        res.json({ success: false, message: 'Insufficient Permissions' }); // Return error
                }
            }
        });
    });
    

    //Account Post Route
	router.post('/addglaccount',(req, res) => {
		var glaccount = new GLAccount();
		glaccount.glaccountnumber = req.body.glaccountnumber;
		glaccount.glaccountname = req.body.glaccountname;
		glaccount.glaccounttype = req.body.glaccounttype;
	
		if(req.body.glaccountnumber == null || req.body.glaccountnumber == '' || req.body.glaccountname == null || req.body.glaccountname == '' || req.body.glaccounttype == null || req.body.glaccounttype == ''){
			res.json({success: false, message:'Ensure all GL Account mandatory fields are provided'})
		}
		else { 
			glaccount.save(function(err){
				if (err) {
					if (err.errors != null) {
						if (err.errors.glaccountnumber) {
						res.json({success: false, message: err.errors.glaccountnumber.message});
						} else if (err.errors.glaccountname) {
						res.json({success: false, message: err.errors.glaccountname.message});
						} else if (err.errors.glaccounttype) {
							res.json({success: false, message: err.errors.glaccounttype.message});
						} else {
							res.json({success: false, message: err});
						}
					} else if(err) {
						console.log(err);
						res.json({success: false, message: err.errmsg});
					}

				}
				else {
					console.log(err);
					res.json({success: true, message: 'GL Account created!'});
				}
			});
		}
	});

	router.get('/getglaccounts/', function(req, res) {
		GLAccount.find({}, function(err, glaccounts) {
			if (err) throw err; // Throw error if cannot connect

			User.findOne({ username: req.decoded.username }, function(err, mainUser) {
				if (err) throw err;
				if(!mainUser) {
					res.json({success: false, message: 'No user found'});
				} else {
					if (mainUser.permission === 'admin' || mainUser.permission == 'moderator') {
						if(!glaccounts) {
							res.json({success: false, message: 'No GL Accounts found'});
						} else {
							res.json({success: true, glaccounts: glaccounts, permission: mainUser.permission});
				
						}
					} else {
						res.json({success: false, message: 'Insufficient Permissions'});
					}
				}
			});
		});
	});


	router.delete('/deleteglaccount/:glaccountnumber', function(req, res) {
		var deletedGLAccount = req.params.glaccountnumber;

		User.findOne({ username: req.decoded.username }, function(err, mainUser) {
			if (err) throw err;
			if (!mainUser) {
				res.json({success: false, message: 'No user found'});
			} else {
				if (mainUser.permission != 'admin') {
					res.json({success: false, message: 'Insufficient Permissions'});
				} else {
					GLAccount.findOneAndRemove({ glaccountnumber: deletedGLAccount }, function(err, user) {
						if(err) throw err;
						res.json({success: true});
					});
				}
			}
		});
	});


    // Route to get the glaccount that needs to be edited
    router.get('/editglaccount/:id', function(req, res) {
        var editGLAccount = req.params.id; // Assign the _id from parameters to variable
        User.findOne({ username: req.decoded.username }, function(err, mainUser) {
            if (err) throw err; // Throw error if cannot connect
            // Check if logged in user was found in database
            if (!mainUser) {
                res.json({ success: false, message: 'No user found' }); // Return error
            } else {
                // Check if logged in user has editing privileges
                if (mainUser.permission === 'admin' || mainUser.permission === 'moderator') {
                    // Find the user to be editted
                    GLAccount.findOne({ _id: editGLAccount }, function(err, glaccount) {
                        if (err) throw err; // Throw error if cannot connect
                        // Check if user to edit is in database
                        if (!glaccount) {
                            res.json({ success: false, message: 'No GL Account found' }); // Return error
                        } else {
                            res.json({ success: true, glaccount: glaccount }); // Return the user to be editted
                        }
                    });
                } else {
                    res.json({ success: false, message: 'Insufficient Permissions' }); // Return access error
                }
            }
        });
    });


 	// Route to update/edit a glaccount
    router.put('/editglaccount', function(req, res) {
        var editGLAccount = req.body._id;
        if (req.body.glaccountnumber) var newGLAccountNumber = req.body.glaccountnumber;
        if (req.body.glaccountname) var newGLAccountName = req.body.glaccountname;
        if (req.body.glaccounttype) var newGLAccountType = req.body.glaccounttype;


        User.findOne({ username: req.decoded.username }, function(err, mainUser) {
            if (err) throw err; // Throw err if cannot connnect
            // Check if logged in user is found in database
            if (!mainUser) {
                res.json({ success: false, message: "no user found" }); // Return erro
            } else {
                if (newGLAccountNumber) {
                    // Check if person making changes has appropriate access
                    if (mainUser.permission === 'admin' || mainUser.permission === 'moderator') {
						GLAccount.findOne({ _id: editGLAccount }, function(err, glaccount) {
                            if (err) throw err; // Throw error if cannot connect
                            if (!glaccount) {
                                res.json({ success: false, message: 'No GL Account found' }); // Return error
                            } else {
                                glaccount.glaccountnumber = newGLAccountNumber; // Assign new name to user in database
                                // Save changes
                                glaccount.save(function(err) {
                                    if (err) {
                                        console.log(err); // Log any errors to the console
                                    } else {
                                        res.json({ success: true, message: 'GL Account Number has been updated!' }); // Return success message
                                    }
                                });
                            }
                        });
                    } else {
                        res.json({ success: false, message: 'Insufficient Permissions' }); // Return error
                    }
                }
                if (newGLAccountName) {
                    // Check if person making changes has appropriate access
                    if (mainUser.permission === 'admin' || mainUser.permission === 'moderator') {
						GLAccount.findOne({ _id: editGLAccount }, function(err, glaccount) {
                            if (err) throw err; // Throw error if cannot connect
                            if (!glaccount) {
                                res.json({ success: false, message: 'No GL Account found' }); // Return error
                            } else {
                                glaccount.glaccountname = newGLAccountName; // Assign new name to user in database
                                // Save changes
                                glaccount.save(function(err) {
                                    if (err) {
                                        console.log(err); // Log any errors to the console
                                    } else {
                                        res.json({ success: true, message: 'GL Account Name has been updated!' }); // Return success message
                                    }
                                });
                            }
                        });
                    } else {
                        res.json({ success: false, message: 'Insufficient Permissions' }); // Return error
                    }
                }

                if (newGLAccountType) {
                    // Check if person making changes has appropriate access
                    if (mainUser.permission === 'admin' || mainUser.permission === 'moderator') {
                        // Look for user in database
                        GLAccount.findOne({ _id: editGLAccount }, function(err, glaccount) {
                            if (err) throw err; // Throw error if cannot connect
                            // Check if glaccount is in database
                            if (!glaccount) {
                                res.json({ success: false, message: 'No GL Account found' }); // Return error
                            } else {
                                glaccount.glaccounttype = newGLAccountType;
                                // Save changes
                                glaccount.save(function(err) {
                                    if (err) {
                                        console.log(err); // Log error to console
                                    } else {
                                        res.json({ success: true, message: 'GL Account Type has been updated' }); // Return success
                                    }
                                });
                            }
                        });
                    } else {
                        res.json({ success: false, message: 'Insufficient Permissions' }); // Return error
                    }
                }
            }
        });
    });

    // Route to get the glaccount that needs to be edited
    router.get('/getglaccountbytype/:type', function(req, res) {
        var GLAccountType = req.params.type; // Assign the _id from parameters to variable
        User.findOne({ username: req.decoded.username }, function(err, mainUser) {
            if (err) throw err; // Throw error if cannot connect
            // Check if logged in user was found in database
            if (!mainUser) {
                res.json({ success: false, message: 'No user found' }); // Return error
            } else {
                // Check if logged in user has editing privileges
                if (mainUser.permission === 'admin' || mainUser.permission === 'moderator') {
                    // Find the user to be editted
                    GLAccount.find({ glaccounttype: GLAccountType }, function(err, glaccount) {
                        if (err) throw err; // Throw error if cannot connect
                        // Check if user to edit is in database
                        if (!glaccount) {
                            res.json({ success: false, message: 'No GL Account found' }); // Return error
                        } else {
                            res.json({ success: true, glaccount: glaccount }); // Return the user to be editted
                        }
                    });
                } else {
                    res.json({ success: false, message: 'Insufficient Permissions' }); // Return access error
                }
            }
        });
    });

 	//Item Post Route
	router.post('/additem',(req, res) => {
		var item = new Item();
		item.itemname = req.body.itemname;
		item.incomeacct = req.body.incomeacct;
		item.rate = req.body.rate;
	
		if(req.body.itemname == null || req.body.itemname == '' || req.body.incomeacct == null || req.body.incomeacct == ''){
			res.json({success: false, message:'Ensure all Item mandatory fields are provided'})
		}
		else { 
			item.save(function(err){
				if (err) {
					if (err.errors != null) {
						if (err.errors.itemname) {
						res.json({success: false, message: err.errors.itemname.message});
						} else if (err.errors.incomeacct) {
						res.json({success: false, message: err.errors.incomeacct.message});
						} else if (err.errors.rate) {
						res.json({success: false, message: err.errors.rate.message});
						} else {
							res.json({success: false, message: err});
						}
					} else if(err) {
						console.log(err);
						res.json({success: false, message: err.errmsg});
					}

				}
				else {
					console.log(err);
					res.json({success: true, message: 'Item created!'});
				}
			});
		}
	});

	router.get('/getitems/', function(req, res) {
		Item.find({}).populate('incomeacct').exec(function(err, items) {
			if (err) throw err; // Throw error if cannot connect

			User.findOne({ username: req.decoded.username }, function(err, mainUser) {
				if (err) throw err;
				if(!mainUser) {
					res.json({success: false, message: 'No user found'});
				} else {

					if (mainUser.permission === 'admin' || mainUser.permission == 'moderator') {
						if(!items) {
							res.json({success: false, message: 'No Items found'});
						} else {
							res.json({success: true, items: items, permission: mainUser.permission});
				
						}
					} else {
						res.json({success: false, message: 'Insufficient Permissions'});
					}
				}
			});
		});
	});


	router.delete('/deleteitem/:itemname', function(req, res) {
		var deletedItem = req.params.itemname;

		User.findOne({ username: req.decoded.username }, function(err, mainUser) {
			if (err) throw err;
			if (!mainUser) {
				res.json({success: false, message: 'No user found'});
			} else {
				if (mainUser.permission != 'admin') {
					res.json({success: false, message: 'Insufficient Permissions'});
				} else {
					Item.findOneAndRemove({ itemname: deletedItem }, function(err, user) {
						if(err) throw err;
						res.json({success: true});
					});
				}
			}
		});
	});


    // Route to get the item that needs to be edited
    router.get('/edititem/:id', function(req, res) {
        var editItem = req.params.id; // Assign the _id from parameters to variable
        User.findOne({ username: req.decoded.username }, function(err, mainUser) {
            if (err) throw err; // Throw error if cannot connect
            // Check if logged in user was found in database
            if (!mainUser) {
                res.json({ success: false, message: 'No user found' }); // Return error
            } else {
                // Check if logged in user has editing privileges
                if (mainUser.permission === 'admin' || mainUser.permission === 'moderator') {
                    // Find the user to be editted
                    Item.findOne({ _id: editItem }).populate('incomeacct').exec(function(err, item) {
                        if (err) throw err; // Throw error if cannot connect
                        // Check if user to edit is in database
                        if (!item) {
                            res.json({ success: false, message: 'No Item found' }); // Return error
                        } else {
                            res.json({ success: true, item: item }); // Return the user to be editted
                        }
                    });
                } else {
                    res.json({ success: false, message: 'Insufficient Permissions' }); // Return access error
                }
            }
        });
    });


 	// Route to update/edit a item
    router.put('/edititem', function(req, res) {
    	console.log(req.body);
        var editItem = req.body._id;
        if (req.body.itemname) var newItemName = req.body.itemname;
        if (req.body.incomeacct) var newIncomeAcct= req.body.incomeacct;
        if (req.body.rate) var newRate= req.body.rate;


        User.findOne({ username: req.decoded.username }, function(err, mainUser) {
            if (err) throw err; // Throw err if cannot connnect
            // Check if logged in user is found in database
            if (!mainUser) {
                res.json({ success: false, message: "no user found" }); // Return erro
            } else {
            	if (mainUser.permission === 'admin' || mainUser.permission === 'moderator') {
					Item.findOne({ _id: editItem }).populate('incomeacct').exec(function(err, item) {
						if (err) throw err; // Throw error if cannot connect
                        if (!item) {
                                res.json({ success: false, message: 'No item found' }); // Return error
                        } else {
                        	if (newItemName) {
                                item.itemname = newItemName; // Assign new name to user in database
                            }

                            if (newIncomeAcct) {
                            	item.incomeacct= newIncomeAcct;
                            }

                            if (newRate) {
                            	item.rate = newRate;
                            }
                                // Save changes
                                item.save(function(err) {
                                    if (err) {
                                        console.log(err); // Log any errors to the console
                                    } else {
                                        res.json({ success: true, message: 'Item info has been updated!' }); // Return success message
                                    }
                                });
                            }
                        });
                    } else {
                        res.json({ success: false, message: 'Insufficient Permissions' }); // Return error
                    }
            }
        });
    });


 	//Invoice Post Route
	router.post('/addinvoice',(req, res) => {
		var invoice = new Invoice();
		invoice.amountdue = req.body.amountdue;
		invoice.amountpaid = req.body.amountpaid;
		invoice.amountremaining = req.body.amountremaining;
		invoice.aracct = req.body.aracct;
		invoice.billingemail = req.body.billingemail;
		invoice.chapter = req.body.chapter;
		invoice.invoicedate = req.body.invoicedate;
		invoice.invoiceduedate = req.body.invoiceduedate;
		invoice.invoiceterms = req.body.invoiceterms;

		// //*! FIX 
		// if(req.body.invoiceterms != null && req.body.invoiceterms !='') {
		// 	invoice.invoiceterms = req.body.invoiceterms.days;
		// }
		

		invoice.member = req.body.member;
		invoice.postingperiod = req.body.postingperiod;

		if( 
			req.body.amountdue == null || 
			req.body.amountpaid == null ||
			req.body.amountremaining == null ||
			req.body.aracct == null || req.body.aracct == '' ||
			req.body.billingemail == null || req.body.billingemail == '' ||
			req.body.chapter == null || req.body.chapter == '' ||
			req.body.invoicedate == null || req.body.invoicedate == '' ||
			req.body.invoiceduedate == null || req.body.invoiceduedate == '' ||
			req.body.invoiceterms == null || req.body.invoiceterms == '' ||
			req.body.member == null || req.body.member == '' ||
			req.body.postingperiod == null || req.body.postingperiod == '') {
			res.json({success: false, message:'Ensure all Invoice mandatory fields are provided'})
		}
		else { 
			invoice.save(function(err){
				if (err) {
					if (err.errors != null) {
						if (err.errors.amountdue) {
							res.json({success: false, message: err.errors.amountdue.message});
						} else if (err.errors.amountpaid) {
							res.json({success: false, message: err.errors.amountpaid.message});
						} else if (err.errors.amountremaining) {
							res.json({success: false, message: err.errors.amountremaining.message});
						} else if (err.errors.aracct) {
							res.json({success: false, message: err.errors.aracct.message});
						} else if (err.errors.billingemail) {
							res.json({success: false, message: err.errors.billingemail.message});
						} else if (err.errors.chapter) {
							res.json({success: false, message: err.errors.chapter.message});
						} else if (err.errors.invoicedate) {
							res.json({success: false, message: err.errors.invoicedate.message});
						} else if (err.errors.invoiceduedate) {
							res.json({success: false, message: err.errors.invoiceduedate.message});
						} else if (err.errors.invoiceterms) {
							res.json({success: false, message: err.errors.invoiceterms.message});
						} else if (err.errors.member) {
							res.json({success: false, message: err.errors.member.message});
						} else if (err.errors.postingperiod) {
							res.json({success: false, message: err.errors.postingperiod.message});
						} else if (err.errors.postingperiod) {
							res.json({success: false, message: err.errors.postingperiod.message});
						}
					} else if(err) {
						console.log(err);
						res.json({success: false, message: err.errmsg});
					}
				}
				else {
					res.json({success: true, invoice:invoice, message: 'Invoice created!'});
				}
			});
		}
	});

	router.get('/getinvoices/', function(req, res) {
		Invoice.find({}).populate('aracct chapter member lines postingperiod').exec(function(err, invoices) {
		//Invoice.find({}).exec(function(err, invoices) {
			if (err) throw err; // Throw error if cannot connect

			User.findOne({ username: req.decoded.username }, function(err, mainUser) {
				if (err) throw err;
				if(!mainUser) {
					res.json({success: false, message: 'No user found'});
				} else {

					if (mainUser.permission === 'admin' || mainUser.permission == 'moderator') {
						if(!invoices) {
							res.json({success: false, message: 'No Invoices found'});
						} else {
							res.json({success: true, invoices: invoices, permission: mainUser.permission});
				
						}
					} else {
						res.json({success: false, message: 'Insufficient Permissions'});
					}
				}
			});
		});
	});


	router.delete('/deleteinvoice/:id', function(req, res) {
		var deletedInvoice = req.params.id;

		User.findOne({ username: req.decoded.username }, function(err, mainUser) {
			if (err) throw err;
			if (!mainUser) {
				res.json({success: false, message: 'No user found'});
			} else {
				if (mainUser.permission != 'admin') {
					res.json({success: false, message: 'Insufficient Permissions'});
				} else {
					Invoice.findOneAndRemove({ _id: deletedInvoice }, function(err, user) {
						if(err) throw err;
						res.json({success: true});
					});
				}
			}
		});
	});


    // Route to get the invoice that needs to be edited
    router.get('/editinvoice/:id', function(req, res) {
        var editInvoice = req.params.id; // Assign the _id from parameters to variable

        User.findOne({ username: req.decoded.username }, function(err, mainUser) {
            if (err) throw err; // Throw error if cannot connect
            // Check if logged in user was found in database
            if (!mainUser) {
                res.json({ success: false, message: 'No user found' }); // Return error
            } else {
                // Check if logged in user has editing privileges
                if (mainUser.permission === 'admin' || mainUser.permission === 'moderator') {
                    // Find the user to be editted
                    Invoice.findOne({ _id: editInvoice }).populate('aracct chapter member lines postingperiod').exec(function(err, invoice) {
                        if (err) throw err; // Throw error if cannot connect
                        // Check if user to edit is in database
                        if (!invoice) {
                            res.json({ success: false, message: 'No Invoice found' }); // Return error
                        } else {
                            res.json({ success: true, invoice: invoice }); // Return the user to be editted
                        }
                    });
                } else {
                    res.json({ success: false, message: 'Insufficient Permissions' }); // Return access error
                }
            }
        });
    });


 	// Route to update/edit a invoice
    router.put('/invoicelinklines', function(req, res) {
        var editInvoice = req.body._id;
        var newInvoiceData = req.body;

        User.findOne({ username: req.decoded.username }, function(err, mainUser) {
            if (err) throw err; // Throw err if cannot connnect
            // Check if logged in user is found in database
            if (!mainUser) {
                res.json({ success: false, message: "no user found" }); // Return erro
            } else {
            	if (mainUser.permission === 'admin' || mainUser.permission === 'moderator') {
					Invoice.findOne({ _id: editInvoice }).populate('lines').exec(function(err, invoice) {
						if (err) throw err; // Throw error if cannot connect

                        if (!invoice) {
                                res.json({ success: false, message: 'No invoice found' }); // Return error
                        } else {
							InvoiceLine.find({ invoice: invoice }).populate('item').exec(function(err, invoicelines) {
								if(!invoicelines) {
									res.json({success: false, message: 'No Invoice lines'});
								} else {
									invoicelines.forEach(function(line) {
										invoice.lines.push(line);
									});
		                            // Save changes
		                            invoice.save(function(err) {
		                                if (err) {
		                                    console.log(err); // Log any errors to the console
		                                } else {
		                                    res.json({ success: true, message: 'Invoice info has been updated!' }); // Return success message
		                                }
		                            });
								}
	                        });
						}
                    });
                } else {
               		res.json({ success: false, message: 'Insufficient Permissions' }); // Return error
                }
            }
        });
    });

	router.post('/addinvoiceline',(req, res) => {
		var invoiceline = new InvoiceLine();
		invoiceline.invoice = req.body.invoice;
		invoiceline.item = req.body.item;
		invoiceline.quantity = req.body.quantity;
		invoiceline.rate = req.body.rate;
		invoiceline.amount = req.body.amount;
		
		if( 
			//*!! FIX Invoice Link
			//req.body.invoice == null || req.body.invoice == '' ||
			req.body.item == null || req.body.item == '' ||
			req.body.quantity == null ||
			req.body.rate == null ||
			req.body.amount == null || req.body.amount == '') {
			res.json({success: false, message:'Ensure all Invoice Line mandatory fields are provided'})
		}
		else { 
			invoiceline.save(function(err){
				if (err) {
					if (err.errors != null) {
						if (err.errors.invoice) {
							res.json({success: false, message: err.errors.invoice.message});
						} else if (err.errors.item) {
							res.json({success: false, message: err.errors.item.message});
						} else if (err.errors.quantity) {
							res.json({success: false, message: err.errors.quantity.message});
						} else if (err.errors.rate) {
							res.json({success: false, message: err.errors.rate.message});
						} else if (err.errors.amount) {
							res.json({success: false, message: err.errors.amount.message});
						} else {
							res.json({success: false, message: err});
						}
					} else if(err) {
						console.log(err);
						res.json({success: false, message: err.errmsg});
					}
				}
				else {
					res.json({success: true, invoiceline:invoiceline, message: 'Invoice line created!'});
				}
			});
		}
	});

	router.get('/getinvoicelines/:id', function(req, res) {
		var invoice = req.params.id;

		InvoiceLine.find({invoice: invoice }).populate('invoice item').exec(function(err, invoicelines) {
		//Invoice.find({}).exec(function(err, invoices) {
			if (err) throw err; // Throw error if cannot connect

			User.findOne({ username: req.decoded.username }, function(err, mainUser) {
				if (err) throw err;
				if(!mainUser) {
					res.json({success: false, message: 'No user found'});
				} else {

					if (mainUser.permission === 'admin' || mainUser.permission == 'moderator') {
						if(!invoicelines) {
							res.json({success: false, message: 'No invoice lines found'});
						} else {
							res.json({success: true, invoicelines: invoicelines, permission: mainUser.permission});
				
						}
					} else {
						res.json({success: false, message: 'Insufficient Permissions'});
					}
				}
			});
		});
	});


router.delete('/deleteinvoiceline/:id', function(req, res) {
		var deletedInvoiceLine = req.params.id;

		User.findOne({ username: req.decoded.username }, function(err, mainUser) {
			if (err) throw err;
			if (!mainUser) {
				res.json({success: false, message: 'No user found'});
			} else {
				if (mainUser.permission != 'admin') {
					res.json({success: false, message: 'Insufficient Permissions'});
				} else {
					InvoiceLine.findOneAndRemove({ _id: deletedInvoiceLine }, function(err, user) {
						if(err) throw err;
						res.json({success: true});
					});
				}
			}
		});
	});


    // Route to get the invoice that needs to be edited
    router.get('/editinvoiceline/:id', function(req, res) {
        var editInvoiceLine = req.params.id; // Assign the _id from parameters to variable

        User.findOne({ username: req.decoded.username }, function(err, mainUser) {
            if (err) throw err; // Throw error if cannot connect
            // Check if logged in user was found in database
            if (!mainUser) {
                res.json({ success: false, message: 'No user found' }); // Return error
            } else {
                // Check if logged in user has editing privileges
                if (mainUser.permission === 'admin' || mainUser.permission === 'moderator') {
                    // Find the user to be editted
                    InvoiceLine.findOne({ _id: editInvoiceLine }).populate('invoice item').exec(function(err, invoiceline) {
                        if (err) throw err; // Throw error if cannot connect
                        // Check if user to edit is in database
                        if (!invoiceline) {
                            res.json({ success: false, message: 'No Invoice Line found' }); // Return error
                        } else {
                            res.json({ success: true, invoiceline: invoiceline }); // Return the user to be editted
                        }
                    });
                } else {
                    res.json({ success: false, message: 'Insufficient Permissions' }); // Return access error
                }
            }
        });
    });


 	// // Route to update/edit a invoice
  //   router.put('/editinvoice', function(req, res) {
  //       var editInvoice = req.body._id;
  //       if (req.body.invoicename) var newInvoiceName = req.body.invoicename;
  //       if (req.body.incomeacct) var newIncomeAcct= req.body.incomeacct;


  //       User.findOne({ username: req.decoded.username }, function(err, mainUser) {
  //           if (err) throw err; // Throw err if cannot connnect
  //           // Check if logged in user is found in database
  //           if (!mainUser) {
  //               res.json({ success: false, message: "no user found" }); // Return erro
  //           } else {
  //           	if (mainUser.permission === 'admin' || mainUser.permission === 'moderator') {
		// 			Invoice.findOne({ _id: editInvoice }).populate('incomeacct').exec(function(err, invoice) {
		// 				if (err) throw err; // Throw error if cannot connect
  //                       if (!invoice) {
  //                               res.json({ success: false, message: 'No invoice found' }); // Return error
  //                       } else {
  //                       	if (newInvoiceName) {
  //                               invoice.invoicename = newInvoiceName; // Assign new name to user in database
  //                           }

  //                           if (newIncomeAcct) {
  //                           	invoice.incomeacct= newIncomeAcct;
  //                           }
  //                               // Save changes
  //                               invoice.save(function(err) {
  //                                   if (err) {
  //                                       console.log(err); // Log any errors to the console
  //                                   } else {
  //                                       res.json({ success: true, message: 'Invoice info has been updated!' }); // Return success message
  //                                   }
  //                               });
  //                           }
  //                       });
  //                   } else {
  //                       res.json({ success: false, message: 'Insufficient Permissions' }); // Return error
  //                   }
  //           }
  //       });
  //   });



 	//Journal Entry Post Route
	router.post('/addjournalentry',(req, res) => {
		var journalentry = new JournalEntry();
		journalentry.chapter = req.body.chapter;
		journalentry.date = req.body.date;
		journalentry.postingperiod = req.body.postingperiod;


		if( 
			req.body.chapter == null || req.body.chapter == '' ||
			req.body.date == null || req.body.date == '' ||
			req.body.postingperiod == null || req.body.postingperiod == '') {
			res.json({success: false, message:'Ensure all Journal Entry mandatory fields are provided'})
		}
		else { 
			journalentry.save(function(err){
				if (err) {
					if (err.errors != null) {
						if (err.errors.chapter) {
							res.json({success: false, message: err.errors.chapter.message});
						} else if (err.errors.date) {
							res.json({success: false, message: err.errors.date.message});
						} else if (err.errors.postingperiod) {
							res.json({success: false, message: err.errors.postingperiod.message});
						} else {
							res.json({success: false, message: err});
						}
					} else if(err) {
						console.log(err);
						res.json({success: false, message: err.errmsg});
					}
				}
				else {
					res.json({success: true, journalentry:journalentry, message: 'Journal Entry created!'});
				}
			});
		}
	});

	router.get('/getjournalentries/', function(req, res) {
		JournalEntry.find({}).populate('gllines').exec(function(err, journalentries) {
			if (err) throw err; // Throw error if cannot connect

			User.findOne({ username: req.decoded.username }, function(err, mainUser) {
				if (err) throw err;
				if(!mainUser) {
					res.json({success: false, message: 'No user found'});
				} else {
					if (mainUser.permission === 'admin' || mainUser.permission == 'moderator') {
						if(!journalentries) {
							res.json({success: false, message: 'No Journal Entries found'});
						} else {
							res.json({success: true, journalentries: journalentries, permission: mainUser.permission});
				
						}
					} else {
						res.json({success: false, message: 'Insufficient Permissions'});
					}
				}
			});
		});
	});


	router.delete('/deletejournalentry/:id', function(req, res) {
		var deletedJournalEntry = req.params.id;

		User.findOne({ username: req.decoded.username }, function(err, mainUser) {
			if (err) throw err;
			if (!mainUser) {
				res.json({success: false, message: 'No user found'});
			} else {
				if (mainUser.permission != 'admin') {
					res.json({success: false, message: 'Insufficient Permissions'});
				} else {
					JournalEntry.findOneAndRemove({ _id: deletedJournalEntry }, function(err, user) {
						if(err) throw err;
						res.json({success: true});
					});
				}
			}
		});
	});


    // Route to get the journalentry that needs to be edited
    router.get('/editjournalentry/:id', function(req, res) {
        var editJournalEntry = req.params.id; // Assign the _id from parameters to variable

        User.findOne({ username: req.decoded.username }, function(err, mainUser) {
            if (err) throw err; // Throw error if cannot connect
            // Check if logged in user was found in database
            if (!mainUser) {
                res.json({ success: false, message: 'No user found' }); // Return error
            } else {
                // Check if logged in user has editing privileges
                if (mainUser.permission === 'admin' || mainUser.permission === 'moderator') {
                    // Find the user to be editted
                    JournalEntry.findOne({ _id: editJournalEntry }).populate('gllines').exec(function(err, journalentry) {
                        if (err) throw err; // Throw error if cannot connect
                        // Check if user to edit is in database
                        if (!journalentry) {
                            res.json({ success: false, message: 'No Jounral Entry found' }); // Return error
                        } else {
                            res.json({ success: true, journalentry: journalentry }); // Return the user to be editted
                        }
                    });
                } else {
                    res.json({ success: false, message: 'Insufficient Permissions' }); // Return access error
                }
            }
        });
    });


    router.put('/journalentrylinkgllines', function(req, res) {

        var editJournalEntry = req.body._id;
        var newJournalEntryData = req.body;

        User.findOne({ username: req.decoded.username }, function(err, mainUser) {
            if (err) throw err; // Throw err if cannot connnect
            // Check if logged in user is found in database
            if (!mainUser) {
                res.json({ success: false, message: "no user found" }); // Return erro
            } else {
            	if (mainUser.permission === 'admin' || mainUser.permission === 'moderator') {
					JournalEntry.findOne({ _id: editJournalEntry }).populate('gllines').exec(function(err, journalentry) {
						if (err) throw err; // Throw error if cannot connect

                        if (!journalentry) {
                                res.json({ success: false, message: 'No Journal Entry found' }); // Return error
                        } else {
							GLLine.find({ journal: journalentry }).populate('glacct chapter').exec(function(err, generalledgerlines) {
								if(!generalledgerlines) {
									res.json({success: false, message: 'No GL lines'});
								} else {
									generalledgerlines.forEach(function(glline) {
										journalentry.gllines.push(glline);
									});
		                            // Save changes
		                            journalentry.save(function(err) {
		                                if (err) {
		                                    console.log(err); // Log any errors to the console
		                                } else {
		                                    res.json({ success: true, message: 'Journal Entry has been updated!' }); // Return success message
		                                }
		                            });
								}
	                        });
						}
                    });
                } else {
               		res.json({ success: false, message: 'Insufficient Permissions' }); // Return error
                }
            }
        });
    });

	router.post('/addglline',(req, res) => {
		var glline = new GLLine();
		glline.chapter = req.body.chapter;
		glline.creditamt = req.body.creditamt;
		glline.date = req.body.date;
		glline.debitamt = req.body.debitamt;
		glline.glacct = req.body.glacct;
		glline.journal = req.body.journal;
		glline.transactionsource = req.body.transactionsource;
		glline.postingperiod = req.body.postingperiod;
		
		if( 
			//*!! FIX Joural Link
			//req.body.journal == null || req.body.journal == '' ||
			req.body.chapter == null || req.body.chapter == '' ||
			req.body.date == null || req.body.date == '' ||
			req.body.glacct == null || req.body.glacct == '' ||
			req.body.postingperiod == null || req.body.postingperiod == '' ||
			req.body.transactionsource == null || req.body.transactionsource == ''
		) {
			res.json({success: false, message:'Ensure all mandatory fields for a GL line are provided'})
		}
		else { 
			glline.save(function(err){
				if (err) {
					if (err.errors != null) {
						if (err.errors.chapter) {
							res.json({success: false, message: err.errors.chapter.message});
						} else if (err.errors.date) {
							res.json({success: false, message: err.errors.date.message});
						} else if (err.errors.glacct) {
							res.json({success: false, message: err.errors.glacct.message});
						} else if (err.errors.postingperiod) {
							res.json({success: false, message: err.errors.postingperiod.message});
						} else if (err.errors.transactionsource) {
							res.json({success: false, message: err.errors.transactionsource.message});
						} else {
							res.json({success: false, message: err});
						}
					} else if(err) {
						console.log(err);
						res.json({success: false, message: err.errmsg});
					}
				}
				else {
					res.json({success: true, glline:glline, message: 'GL line created!'});
				}
			});
		}
	});

	router.get('/getgllines/:id', function(req, res) {
		var journal = req.params.id;

		GLLine.find({journal: journal }).populate('journal chapter glacct transactionsource postingperiod').exec(function(err, gllines) {
		//Invoice.find({}).exec(function(err, invoices) {
			if (err) throw err; // Throw error if cannot connect

			User.findOne({ username: req.decoded.username }, function(err, mainUser) {
				if (err) throw err;
				if(!mainUser) {
					res.json({success: false, message: 'No user found'});
				} else {

					if (mainUser.permission === 'admin' || mainUser.permission == 'moderator') {
						if(!gllines) {
							res.json({success: false, message: 'No GL lines found'});
						} else {
							res.json({success: true, gllines: gllines, permission: mainUser.permission});
				
						}
					} else {
						res.json({success: false, message: 'Insufficient Permissions'});
					}
				}
			});
		});
	});


router.delete('/deleteglline/:id', function(req, res) {
		var deletedGLLine = req.params.id;

		User.findOne({ username: req.decoded.username }, function(err, mainUser) {
			if (err) throw err;
			if (!mainUser) {
				res.json({success: false, message: 'No user found'});
			} else {
				if (mainUser.permission != 'admin') {
					res.json({success: false, message: 'Insufficient Permissions'});
				} else {
					GLLine.findOneAndRemove({ _id: deletedGLLine }, function(err, user) {
						if(err) throw err;
						res.json({success: true});
					});
				}
			}
		});
	});


    router.get('/editglline/:id', function(req, res) {
        var editGLLine = req.params.id; // Assign the _id from parameters to variable

        User.findOne({ username: req.decoded.username }, function(err, mainUser) {
            if (err) throw err; // Throw error if cannot connect
            // Check if logged in user was found in database
            if (!mainUser) {
                res.json({ success: false, message: 'No user found' }); // Return error
            } else {
                // Check if logged in user has editing privileges
                if (mainUser.permission === 'admin' || mainUser.permission === 'moderator') {
                    // Find the user to be editted
                    GLLine.findOne({ _id: editGLLine }).populate('journal chapter glacct transactionsource postingperiod').exec(function(err, glline) {
                        if (err) throw err; // Throw error if cannot connect
                        // Check if user to edit is in database
                        if (!glline) {
                            res.json({ success: false, message: 'No GL Line found' }); // Return error
                        } else {
                            res.json({ success: true, glline: glline }); // Return the user to be editted
                        }
                    });
                } else {
                    res.json({ success: false, message: 'Insufficient Permissions' }); // Return access error
                }
            }
        });
    });


 	// // Route to update/edit a invoice
  //   router.put('/editinvoice', function(req, res) {
  //       var editInvoice = req.body._id;
  //       if (req.body.invoicename) var newInvoiceName = req.body.invoicename;
  //       if (req.body.incomeacct) var newIncomeAcct= req.body.incomeacct;


  //       User.findOne({ username: req.decoded.username }, function(err, mainUser) {
  //           if (err) throw err; // Throw err if cannot connnect
  //           // Check if logged in user is found in database
  //           if (!mainUser) {
  //               res.json({ success: false, message: "no user found" }); // Return erro
  //           } else {
  //           	if (mainUser.permission === 'admin' || mainUser.permission === 'moderator') {
		// 			Invoice.findOne({ _id: editInvoice }).populate('incomeacct').exec(function(err, invoice) {
		// 				if (err) throw err; // Throw error if cannot connect
  //                       if (!invoice) {
  //                               res.json({ success: false, message: 'No invoice found' }); // Return error
  //                       } else {
  //                       	if (newInvoiceName) {
  //                               invoice.invoicename = newInvoiceName; // Assign new name to user in database
  //                           }

  //                           if (newIncomeAcct) {
  //                           	invoice.incomeacct= newIncomeAcct;
  //                           }
  //                               // Save changes
  //                               invoice.save(function(err) {
  //                                   if (err) {
  //                                       console.log(err); // Log any errors to the console
  //                                   } else {
  //                                       res.json({ success: true, message: 'Invoice info has been updated!' }); // Return success message
  //                                   }
  //                               });
  //                           }
  //                       });
  //                   } else {
  //                       res.json({ success: false, message: 'Insufficient Permissions' }); // Return error
  //                   }
  //           }
  //       });
  //   });


	router.post('/addpostingperiod',(req, res) => {
		var postingperiod = new PostingPeriod();
		postingperiod.month = req.body.month;
		postingperiod.year = req.body.year;
		postingperiod.status = req.body.status;


		if(req.body.month == null || req.body.month == '' || req.body.year == null || req.body.year == '' || req.body.status == null || req.body.status == ''){
			res.json({success: false, message:'Ensure all mandatory fields for Posting Period are provided'})
		}
		else { 
			postingperiod.save(function(err){
				if (err) {
					if (err.errors != null) {
						if (err.errors.month) {
						res.json({success: false, message: err.errors.month.message});
						} else if (err.errors.year) {
						res.json({success: false, message: err.errors.year.message});
						} else if (err.errors.status) {
						res.json({success: false, message: err.errors.status.message});
						} else {
							res.json({success: false, message: err});
						}
					} 
					else if(err) {
						console.log(err);
						if (err.code == 11000) {
							if (err.errmsg[7] == 'd' && err.errmsg[8] == 'u' && err.errmsg[9] == 'p') {
							 	res.json({success: false, message: 'Posting Year and Month Already Exist'});
							}
						} else {
							res.json({success: false, message: err.errmsg});
						}

					}

				}
				else {
					console.log(err);
					res.json({success: true, message: 'Posting Period created!'});
				}
			});
		}
	});

	router.get('/getpostingperiods/:status', function(req, res) {
		var postingperiodstatus;

		if(req.params.status == 'Open') {
			postingperiodstatus = 'Open';
		} else if(req.params.status == 'Close') {
			postingperiodstatus = 'Close';
		} else {
			postingperiodstatus = ['Open', 'Close'];
		}

		PostingPeriod.find({status: postingperiodstatus}).sort( { month: 1 } ).exec(function(err, postingperiods) {
			if (err) throw err; // Throw error if cannot connect

			User.findOne({ username: req.decoded.username }, function(err, mainUser) {
				if (err) throw err;
				if(!mainUser) {
					res.json({success: false, message: 'No user found'});
				} else {

					if (mainUser.permission === 'admin' || mainUser.permission == 'moderator') {
						if(!postingperiods) {
							res.json({success: false, message: 'No Posting Periods found'});
						} else {
							res.json({success: true, postingperiods: postingperiods, permission: mainUser.permission});
				
						}
					} else {
						res.json({success: false, message: 'Insufficient Permissions'});
					}
				}
			});
		});
	});


	router.delete('/deletepostingperiod/:id', function(req, res) {
		var deletedPostingPeriod = req.params.id;

		User.findOne({ username: req.decoded.username }, function(err, mainUser) {
			if (err) throw err;
			if (!mainUser) {
				res.json({success: false, message: 'No user found'});
			} else {
				if (mainUser.permission != 'admin') {
					res.json({success: false, message: 'Insufficient Permissions'});
				} else {
					PostingPeriod.findOneAndRemove({ _id: deletedPostingPeriod }, function(err, user) {
						if(err) throw err;
						res.json({success: true});
					});
				}
			}
		});
	});


    // Route to get the postingperiod that needs to be edited
    router.get('/editpostingperiod/:id', function(req, res) {
        var editPostingPeriod = req.params.id; // Assign the _id from parameters to variable
        User.findOne({ username: req.decoded.username }, function(err, mainUser) {
            if (err) throw err; // Throw error if cannot connect
            // Check if logged in user was found in database
            if (!mainUser) {
                res.json({ success: false, message: 'No user found' }); // Return error
            } else {
                // Check if logged in user has editing privileges
                if (mainUser.permission === 'admin' || mainUser.permission === 'moderator') {
                    // Find the user to be editted
                    PostingPeriod.findOne({ _id: editPostingPeriod }).exec(function(err, postingperiod) {
                        if (err) throw err; // Throw error if cannot connect
                        if (!postingperiod) {
                            res.json({ success: false, message: 'No Posting Period found' }); // Return error
                        } else {
                            res.json({ success: true, postingperiod: postingperiod }); // Return the user to be editted
                        }
                    });
                } else {
                    res.json({ success: false, message: 'Insufficient Permissions' }); // Return access error
                }
            }
        });
    });


 	// Route to update/edit a postingperiod
    router.put('/editpostingperiod', function(req, res) {
        var editPostingPeriod = req.body._id;
        if (req.body.year) var newPostingPeriodYear = req.body.year;
        if (req.body.month) var newPostingPeriodMonth = req.body.month;
        if (req.body.status) var newPostingPeriodStatus = req.body.status;


        User.findOne({ username: req.decoded.username }, function(err, mainUser) {
            if (err) throw err; // Throw err if cannot connnect
            // Check if logged in user is found in database
            if (!mainUser) {
                res.json({ success: false, message: "no user found" }); // Return erro
            } else {
            	if (mainUser.permission === 'admin' || mainUser.permission === 'moderator') {
					PostingPeriod.findOne({ _id: editPostingPeriod }).exec(function(err, postingperiod) {
						if (err) throw err; // Throw error if cannot connect
                        if (!postingperiod) {
                                res.json({ success: false, message: 'No Posting Period found' }); // Return error
                        } else {
                        	if (newPostingPeriodYear) {
                                postingperiod.year = newPostingPeriodYear; // Assign new name to user in database
                            }

                            if (newPostingPeriodMonth) {
                            	postingperiod.month= newPostingPeriodMonth;
                            }

                            if (newPostingPeriodStatus) {
                            	postingperiod.status= newPostingPeriodStatus;
                            }
                            // Save changes
                            postingperiod.save(function(err) {
                                if (err) {
                                    console.log(err); // Log any errors to the console
                                } else {
                                    res.json({ success: true, message: 'Posting Period info has been updated!' }); // Return success message
                                }
                            });
                        }
                    });
                } else {
                        res.json({ success: false, message: 'Insufficient Permissions' }); // Return error
                }
            }
        });
    });

	// router.post('/testrelationships',(req, res) => {

		// var author = new Individual.Individual({
		//   _id: new mongoose.Types.ObjectId(),
		//   name: 'Ian Fleming',
		//   age: 50
		// });

		// author.save(function (err) {
		//   if (err) return handleError(err);

		//   var story1 = new Story.Story({
		//     title: 'Once upon a timex',
		//     author: author._id    // assign the _id from the person
		//   });

		//   story1.save(function (err) {
		//     if (err) return handleError(err);
		//     // thats it!
		//   });

		//     //then add story to person
  // 			//author.stories.push(story1);
  // 			author.save(function (err) {
  // 				if (err) return handleError(err);
  // 				console.log(author);
  // 			});

		// });

		// // Story.Story.findOne({ title: 'Once upon a timex' }, function(error, story) {
		// //   if (error) {
		// //   	res.json({ success: true, message: 'Error!' });
		// //     return handleError(error);
		// //   }
		// //   //story.author = author;
		// //   console.log(story.author.name); // prints "Ian Fleming"
		// //   res.json({success: true, story: story});
		// // });


// Story.Story.
//   findOne({ title: 'Once upon a timex' }).
//   populate('author').
//   exec(function (err, story) {
//     if (err) return handleError(err);
//     console.log('The author is %s', story.author.name);
//     res.json({success: true, story: story});
//     // prints "The author is Ian Fleming"
//   });

		
		
// 	});



	return router;
}