var User = require('../models/user');
var Chapter = require('../models/chapter')
var Member = require('../models/member')
var GLAccount = require('../models/glaccount')
// var Invoice = require('../models/invoice');
// var InvoiceLines = require('../models/invoice-lines');
var jwt = require('jsonwebtoken');
var secret = 'harryporter';
var nodemailer = require('nodemailer');
var sgTransport = require('nodemailer-sendgrid-transport');


//Routes
module.exports = function(router) {

	var options = {
	  auth: {
	    api_user: 'varunprabh',
	    api_key: 'ah3VwCzMEYrTL4'
	  }
	}

	var client = nodemailer.createTransport(sgTransport(options));


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
					  text: 'Hello' + user.name +'Thank you for registering at DigitalCloud ERP. Please click on the following link to complete your activation: http://peaceful-oasis-54965.herokuapp.com/activate/' + user.temporarytoken,
					  html: 'Hello<strong> ' + user.name +'</strong>, <br><br> Thank you for registering at DigitalCloud ERP. Please click on the link below to complete your activation:<br><br> <a href="http://peaceful-oasis-54965.herokuapp.com/activate/' + user.temporarytoken + '">http://peaceful-oasis-54965.herokuapp.com/activate</a>'
					};

					client.sendMail(email, function(err, info){
					    if (err ){
					      console.log(error);
					    }
					    else {
					      console.log('Message sent: ' + info.response);
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
				res.json( { success: false, message: 'That username is alreay taken' });

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
				res.json( { success: false, message: 'That e-mail is alreay taken' });

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
					  text: 'Hello' + user.name +'You recently requested new account activation link. Please click on the following link to complete your activation: http://peaceful-oasis-54965.herokuapp.com/activate/' + user.temporarytoken,
					  html: 'Hello<strong> ' + user.name +'</strong>, <br><br> You recently requested new account activation link. Please click on the link below to complete your activation:<br><br> <a href="http://peaceful-oasis-54965.herokuapp.com/activate/' + user.temporarytoken + '">http://peaceful-oasis-54965.herokuapp.com/activate</a>'
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
							text: 'Hello ' + user.name + ', You recently request a password reset link. Please click on the link below to reset your password:<br><br><a href="http://peaceful-oasis-54965.herokuapp.com/reset/' + user.resettoken,
							html: 'Hello<strong> ' + user.name + '</strong>,<br><br>You recently request a password reset link. Please click on the link below to reset your password:<br><br><a href="http://peaceful-oasis-54965.herokuapp.com/reset/' + user.resettoken + '">http://peaceful-oasis-54965.herokuapp.com/reset/</a>'
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
				console.log('account add');
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
                if (newChapterName) {
                    // Check if person making changes has appropriate access
                    if (mainUser.permission === 'admin' || mainUser.permission === 'moderator') {
						Chapter.findOne({ _id: editChapter }, function(err, chapter) {
                            if (err) throw err; // Throw error if cannot connect
                            if (!chapter) {
                                res.json({ success: false, message: 'No chapter found' }); // Return error
                            } else {
                                chapter.chaptername = newChapterName; // Assign new name to user in database
                                // Save changes
                                chapter.save(function(err) {
                                    if (err) {
                                        console.log(err); // Log any errors to the console
                                    } else {
                                        res.json({ success: true, message: 'Chapter Name has been updated!' }); // Return success message
                                    }
                                });
                            }
                        });
                    } else {
                        res.json({ success: false, message: 'Insufficient Permissions' }); // Return error
                    }
                }

                if (newWebsite) {
                    // Check if person making changes has appropriate access
                    if (mainUser.permission === 'admin' || mainUser.permission === 'moderator') {
                        // Look for user in database
                        Chapter.findOne({ _id: editChapter }, function(err, chapter) {
                            if (err) throw err; // Throw error if cannot connect
                            // Check if chapter is in database
                            if (!chapter) {
                                res.json({ success: false, message: 'No user found' }); // Return error
                            } else {
                                chapter.website = newWebsite;
                                // Save changes
                                chapter.save(function(err) {
                                    if (err) {
                                        console.log(err); // Log error to console
                                    } else {
                                        res.json({ success: true, message: 'Website has been updated' }); // Return success
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

    //Member Post Route
	router.post('/addmember',(req, res) => {
		var member = new Member();
		member.membername = req.body.membername;
		member.email = req.body.email;
	
		if(req.body.membername == null || req.body.membername == '' || req.body.email == null || req.body.email == ''){
			res.json({success: false, message:'Ensure Member Name and Website are provided'})
		}
		else { 
			member.save(function(err){
				if (err) {
					if (err.errors != null) {
						if (err.errors.membername) {
						res.json({success: false, message: err.errors.membername.message});
						} else if (err.errors.email) {
							res.json({success: false, message: err.errors.email.message});
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
		Member.find({}, function(err, members) {
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
                    Member.findOne({ _id: editMember }, function(err, member) {
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

        User.findOne({ username: req.decoded.username }, function(err, mainUser) {
            if (err) throw err; // Throw err if cannot connnect
            // Check if logged in user is found in database
            if (!mainUser) {
                res.json({ success: false, message: "no user found" }); // Return erro
            } else {
                if (newMemberName) {
                    // Check if person making changes has appropriate access
                    if (mainUser.permission === 'admin' || mainUser.permission === 'moderator') {
						Member.findOne({ _id: editMember }, function(err, member) {
                            if (err) throw err; // Throw error if cannot connect
                            if (!member) {
                                res.json({ success: false, message: 'No member found' }); // Return error
                            } else {
                                member.membername = newMemberName; // Assign new name to user in database
                                // Save changes
                                member.save(function(err) {
                                    if (err) {
                                        console.log(err); // Log any errors to the console
                                    } else {
                                        res.json({ success: true, message: 'Member Name has been updated!' }); // Return success message
                                    }
                                });
                            }
                        });
                    } else {
                        res.json({ success: false, message: 'Insufficient Permissions' }); // Return error
                    }
                }

                if (newEmail) {
                    // Check if person making changes has appropriate access
                    if (mainUser.permission === 'admin' || mainUser.permission === 'moderator') {
                        // Look for user in database
                        Member.findOne({ _id: editMember }, function(err, member) {
                            if (err) throw err; // Throw error if cannot connect
                            // Check if member is in database
                            if (!member) {
                                res.json({ success: false, message: 'No user found' }); // Return error
                            } else {
                                member.email = newEmail;
                                // Save changes
                                member.save(function(err) {
                                    if (err) {
                                        console.log(err); // Log error to console
                                    } else {
                                        res.json({ success: true, message: 'Email has been updated' }); // Return success
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

	return router;
}