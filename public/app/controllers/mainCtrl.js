angular.module('maincontroller', ['authServices', 'userServices'])

.controller('mainCtrl', function(Auth, $timeout, $location, $rootScope, $window, $interval, User, AuthToken, $scope, $route) {
	var app = this;
	app.loadme = false;

	//Need to figure out filling contacts dynamically
	$scope.member_list = {
    langs: [
      {value: 'ABC Construction', contact: 'John Someone', billing_email: 'john@gmail.com', ar_account_number: '1100', ar_account_name: 'Accounts Receivable'},
      {value: 'Big Roads Company', contact: 'Big Guy', billing_email: 'big@gmail.com', ar_account_number: '1200', ar_account_name: 'Other Accounts Receivable'},
      {value: 'Speciality Contractor', contact: 'Random Person', billing_email: 'rand@gmail.com', ar_account_number: '1200', ar_account_name: 'Other Accounts Receivable'},
      {value: 'Buildings Unlimited', contact: 'Billing Person', billing_email: 'bill@gmail.com', ar_account_number: '1100', ar_account_name: 'Accounts Receivable'},
      {value: 'Robby and Sons', contact: 'Son of Roby', billing_email: 'soroby@gmail.com', ar_account_number: '1100', ar_account_name: 'Accounts Receivable'}
    ]};

	$scope.contacts_list = {
    langs: [
      {value: 'John Someone'},
      {value: 'Big Guy'},
      {value: 'Random Person'},
      {value: 'Billing Person'},
      {value: 'Son of Roby'}
    ]};

    $scope.chapter_list = {
    langs: [
      {value: 'East Florida'},
      {value: 'South Dakota'},
      {value: 'Washington DC'},
      {value: 'Nevada'},
      {value: 'Houston'}
    ]};


    $scope.items_list = {
    langs: [
      {value: 'Membership Dues'},
      {value: 'PAC Contribution'},
      {value: 'Donation to Education Fund'},
      {value: 'Golf Event Ticket'},
      {value: 'T-Shirts'}
    ]};

    $scope.accounting_terms_list = {
    langs: [
      {value: 'Net 30', days: 30},
      {value: 'Net 60', days: 60},
      {value: 'Due on Receipt', days: 0}
    ]};

    $scope.coa_list = {
    langs: [
      {acct_number: '1100', acct_name:'Accounts Receivable'},
      {acct_number: '1200', acct_name:'Other Accounts Receivable'},
    ]};


    app.checkSession = function() {
    	if(Auth.isLoggedIn()) {
    		app.checkingSession = true;
    		var interval = $interval(function() {
    			var token = $window.localStorage.getItem('token');
    			if (token == null) {
    				$interval.cancel(interval);
    			} else {
					// Parse JSON Web Token using AngularJS for timestamp conversion
					self.parseJwt = function(token) {
						var base64Url = token.split('.')[1];
						var base64 = base64Url.replace('-', '+').replace('_', '/');
						return JSON.parse($window.atob(base64));
					}
					var expireTime = self.parseJwt(token); // Save parsed token into variable
					
					var timeStamp = Math.floor(Date.now() / 1000); // Get current datetime timestamp
					var timeCheck = expireTime.exp - timeStamp; // Subtract to get remaining time of token

					// Check if token has less than 30 minutes till expiration
					if (timeCheck <= 1800) {
						showModal(1); // Open bootstrap modal and let user decide what to do
						$interval.cancel(interval); // Stop interval
					} else {
						//token still valid
					}
				}
			}, 30000);
    	}
	};

    app.checkSession(); // Ensure check is ran check, even if user refreshes


	// Function to open bootstrap modal		
	var showModal = function(option) {
		app.choiceMade = false; // Clear choiceMade on startup
		app.modalHeader = undefined; // Clear modalHeader on startup
		app.modalBody = undefined; // Clear modalBody on startup
		app.hideButton = false; // Clear hideButton on startup

		// Check which modal option to activate	(option 1: session expired or about to expire; option 2: log the user out)		
		if (option === 1) {
			app.modalHeader = 'Timeout Warning'; // Set header
			app.modalBody = 'Your session will expire in 30 minutes. Would you like to renew your session?'; // Set body
			$("#myModal").modal({ backdrop: "static" }); // Open modal
			// Give user 10 seconds to make a decision 'yes'/'no'
			$timeout(function() {
				if (!app.choiceMade) app.endSession(); // If no choice is made after 10 seconds, select 'no' for them
			}, 10000);
		} else if (option === 2) {
			app.choiceMade = true;
			app.hideButton = true; // Hide 'yes'/'no' buttons
			app.modalHeader = 'Logging Out'; // Set header
			$("#myModal").modal({ backdrop: "static" }); // Open modal
			// After 1000 milliseconds (2 seconds), hide modal and log user out
			$timeout(function() {
				Auth.logout(); // Logout user
				$location.path('/logout'); // Change route to clear user object
				hideModal(); // Close modal
				app.disabled = false;
				$route.reload();
			}, 800);
		}
	};


	// Function that allows user to renew their token to stay logged in (activated when user presses 'yes')
	app.renewSession = function() {
		app.choiceMade = true; // Set to true to stop 10-second check in option 1
		// Function to retrieve a new token for the user
		User.renewSession(app.username).then(function(data) {
			// Check if token was obtained
			if (data.data.success) {
				AuthToken.setToken(data.data.token); // Re-set token
				app.checkSession(); // Re-initiate session checking
			} else {
				app.modalBody = data.data.message; // Set error message
			}
		});
		hideModal(); // Close modal
	};

	// Function to expire session and logout (activated when user presses 'no)
	app.endSession = function() {
		app.choiceMade = true; // Set to true to stop 10-second check in option 1
		hideModal(); // Hide modal
		// After 1 second, activate modal option 2 (log out)
		$timeout(function() {
			showModal(2); // logout user
		}, 1500);
	};

	// Function to hide the modal
	var hideModal = function() {
		$("#myModal").modal('hide'); // Hide modal once criteria met
	};

	$rootScope.$on('$routeChangeStart', function() {

		if(!app.checkingSession) app.checkSession();

		if(Auth.isLoggedIn()) {
			app.isLoggedIn = true;
			Auth.getUser().then(function(data) {
				app.name = data.data.name;
				app.username = data.data.username;
				app.useremail = data.data.email;

				User.getPermission().then(function(data) {
					if(data.data.permission == 'admin' || data.data.permission =='moderator') {
						app.authorized = true;
					}
					app.loadme = true;
				});
				
			})
		} else {
			app.isLoggedIn = false;
			app.username = '';
			app.loadme = true;
		}
		if ($location.hash() == '_=_') $location.hash(null);
	});

	this.facebook = function() {
		app.disabled = true;
		$window.location = $window.location.protocol +'//' + $window.location.host + '/auth/facebook';
	};

	this.twitter = function() {
		app.disabled = true;
		$window.location = $window.location.protocol +'//' + $window.location.host + '/auth/twitter';
	};

	this.google = function() {
		app.disabled = true;
		$window.location = $window.location.protocol +'//' + $window.location.host + '/auth/google';
	};

	this.doLogin = function(loginData) {
		app.errorMsg = false;
		app.successMsg = false;
		app.loading = true;
		app.expired = false;
		app.disabled = true;

		Auth.login(app.loginData).then(function(data) {

			if(data.data.success){
				app.loading = false;
				//Create Success Message
				app.successMsg = data.data.message+'...Redirecting';
				//Redirect to Home Message
				$timeout(function(){
					$location.path('/about');
					app.loginData = '';
					app.successMsg = false;
					app.errorMsg = false;
					app.checkSession();
				},1500);
				
			}else {
				if(data.data.expired) {				
					//Create Error Message
					app.loading = false;
					app.expired = true;
					app.errorMsg = data.data.message;

				} else {
					//Create Error Message
					app.disabled = false;
					app.loading = false;
					app.errorMsg = data.data.message;
				}
			}
		});
	};

	app.logout = function () {
		app.disabled = false;
		showModal(2); // Activate modal that logs out user
	};
});
