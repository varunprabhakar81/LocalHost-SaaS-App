angular.module('paymentController', [])

.controller('paymentCtrl', function($scope) {

	var app = this;

	const currency = 'usd';
	const description = 'Membership';

	var handler = StripeCheckout.configure({
	  key: 'pk_test_iJYFD9W47WsK1phAGzshsrSu',
	  image: 'https://stripe.com/img/documentation/checkout/marketplace.png',
	  locale: 'auto',
	  token: function(token) {
	    // You can access the token ID with `token.id`.
	    // Get the token ID to your server-side code for use.
	    
	  }
	});


	document.getElementById('customButton').addEventListener('click', function(e) {
		// Open Checkout with further options:
		handler.open({
	    name: 'Digital Cloud ERP',
	    description: 'Membership',
	    amount: parseFloat($scope.amount)*100,
	    token: handletoken
		});
	  	
	  	e.preventDefault();

	  	function handletoken(token) {
		  	fetch("/api/charge", {
		  		method: "POST",
		  		headers: {"Content-Type": "application/json"},
		  		body: JSON.stringify({amount:parseFloat($scope.amount)*100, currency: currency, description: description, token})
		  	})
		  	.then(response => {
		  		if (!response.ok)
		  			throw response;
		  		return response.json();
		  	})
		  	.then(output => {
		  		console.log("Purchase succeeded:", output);
		  	})
		  	.catch(err => {
		  		console.log("Purchase failed:", err);
		  	})
	  	}
	});



	// Close Checkout on page navigation:
	window.addEventListener('popstate', function() {
	  handler.close();
	});

})