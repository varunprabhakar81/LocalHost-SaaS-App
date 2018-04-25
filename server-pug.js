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
var globalconfig = require('./config/config.global');

const keyPublishable = 'pk_test_iJYFD9W47WsK1phAGzshsrSu';
const keySecret = 'sk_test_7G7wpThGijNoRsdqcIWlP8UV';

const stripe = require("stripe")(keySecret);

app.set("view engine", "pug");
app.use(require("body-parser").urlencoded({extended: false}));


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



// app.get("/", (req, res) =>
//   res.render("index.pug", {'pk_test_iJYFD9W47WsK1phAGzshsrSu'});


app.get("/", (req, res) =>
  res.render("index.pug", {keyPublishable}));

app.post("/charge", (req, res) => {
  let amount = 500;

  stripe.customers.create({
     email: req.body.stripeEmail,
    source: req.body.stripeToken
  })
  .then(customer =>
    stripe.charges.create({
      amount,
      description: "Sample Charge",
         currency: "usd",
         customer: customer.id
    }))
  .then(charge => res.render("charge.pug"));
});


//Server Port
app.listen(port, () => {
	console.log ("Running the server on port "+port);
});

