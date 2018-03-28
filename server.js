//Packages
var express = require('express');
var app = express();
var morgan = require('morgan');
var mongoose = require('mongoose');
var port = process.env.PORT || 8080; //Server Port Address
var bodyParser = require('body-parser');//Enable Parsing of JSON Objects in POST requests
var router = express.Router();
var appRoutes = require('./app/routes/api')(router);
var path = require('path');
var passport = require('passport');
var social = require('./app/passport/passport')(app, passport);

//Middleware
app.use(morgan('dev'));//Express logging module
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
app.use(express.static(__dirname+'/public'));
app.use('/api', appRoutes);

//Database Connection
mongoose.connect('mongodb://localhost:27017/meantut',(err) => {
	if(err){
		console.log('Not connected to the database: '+err);
	}
	else{
		console.log('Successfully connected to MongoDB');
	}
});

//Redirect user to front-end (angular) views
app.get('*', function(req,res){
	res.sendFile(path.join(__dirname +'/public/app/views/index.html'));
});

//Server Port
app.listen(port, () => {
	console.log ("Running the server on port "+port);
});

