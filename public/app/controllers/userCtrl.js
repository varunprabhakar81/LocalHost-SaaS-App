angular.module('userControllers', ['userServices'])

.controller('regCtrl', function($http, $location, $timeout, User) {

	var app = this;
	
	this.regUser = function(regData, valid, confirmed) {
		app.disabled = true;
		app.errorMsg = false;
		app.successMsg = false;
		app.loading = true;

		if (valid && confirmed) {

			User.create(app.regData).then(function(data) {

			if(data.data.success){
				app.loading = false;
				//Create Success Message
				app.successMsg = data.data.message+'...Redirecting';
				//Redirect to Home Message
				$timeout(function(){
					$location.path('/');
				},2000);
				
			}else {
				app.disabled = false;
				app.loading = false;
				//Create Error Message
				app.errorMsg = data.data.message;
			}
		});
		} else {
			//Create an error message
			app.loading = false;
			app.disabled = false;
			app.errorMsg = 'Please ensure form is filled out properly';
		}

	};

	// checkUsername(regData);
	this.checkUsername = function(regData) {
		app.checkingUsername = true;
		app.usernameMsg = false;
		app.usernameInvalid = false;

		User.checkUsername(app.regData).then(function(data) {
			app.checkingUsername = false;

			if (data.data.success) { 
				app.usernameInvalid = false;
				app.usernameMsg = data.data.message;
			} else {
				app.usernameInvalid = true;
				app.usernameMsg = data.data.message;
			}
		});

	};

	// checkEmail(regData);
	this.checkEmail = function(regData) {
		app.checkingEmail = true;
		app.emailMsg = false;
		app.emailInvalid = false;

		User.checkEmail(app.regData).then(function(data) {
			app.checkingEmail = false;

			if (data.data.success) { 
				app.emailInvalid = false;
				app.emailMsg = data.data.message;
			} else {
				app.emailInvalid = true;
				app.emailMsg = data.data.message;
			}
		});

	};

})

.directive('match', function() {
	  return {
	    restrict: 'A',
	    controller: function($scope) { 

	    	$scope.confirmed = false;

	    	$scope.doConfirm = function (values) {
	    		values.forEach(function(ele) {

	    			if ($scope.confirm == ele) { 

	    				$scope.confirmed = true;

	    			} else {
	    				$scope.confirmed = false;
	    			}
	    		});
	    			
	    	}
	    },

	    link: function(scope, element, attrs) {
	    	attrs.$observe('match', function() {
	    		scope.matches = JSON.parse(attrs.match);
	    		scope.doConfirm(scope.matches);
	    	});

	    	scope.$watch('confirm', function() {
	    		scope.matches = JSON.parse(attrs.match);
	    		scope.doConfirm(scope.matches);
	    	});
	    }
	  };
})

.controller('facebookCtrl', function($routeParams, Auth, $location, $window) {
	var app = this;
	app.errorMsg = false;
	app.expired = false;
	app.disabled = true;

	if($window.location.pathname == '/facebookerror') {
		app.errorMsg = 'Facebook e-mail not found in database';
	} else if($window.location.pathname == '/facebook/inactive/error') {
		app.expired = true;
		app.errorMsg = 'Account is not yet activated, please check your e-mail for activation link.';
	} else {
		Auth.facebook($routeParams.token);
		$location.path('/');		
	}

})

.controller('twitterCtrl', function($routeParams, Auth, $location, $window) {
	var app = this;
	app.errorMsg = false;
	app.expired = false;
	app.disabled = true;

	if($window.location.pathname == '/twittererror') {
		app.errorMsg = 'Twitter e-mail not found in database';
	} else if($window.location.pathname == '/twitter/inactive/error') {
		app.expired = true;
		app.errorMsg = 'Account is not yet activated, please check your e-mail for activation link.';
	} else {
		Auth.facebook($routeParams.token);
		$location.path('/');		
	}

})

.controller('googleCtrl', function($routeParams, Auth, $location, $window) {
	var app = this;
	app.errorMsg = false;
	app.expired = false;
	app.disabled = true;

	if($window.location.pathname == '/googleerror') {
		app.errorMsg = 'Google e-mail not found in database';
	} else if($window.location.pathname == '/google/inactive/error') {
		app.expired = true;
		app.errorMsg = 'Account is not yet activated, please check your e-mail for activation link.';
	} else {
		Auth.facebook($routeParams.token);
		$location.path('/');		
	}

})

// .controller('invoiceCtrl', function($http, $location, $timeout, Invoice, $scope) {

// 	var app = this;

// 	this.createInvoice = function(invoiceData) {
// 		app.errorMsg = false;
// 		app.successMsg = false;
// 		app.loading = true;

// 		Invoice.create(app.invoiceData).then(function(data) {
// 			if(data.data.success){
// 				app.loading = false;
// 				//Create Success Message
// 				app.successMsg = data.data.message+'...Redirecting';
// 				//Redirect to Home Message
// 				$timeout(function(){
// 					$location.path('/');
// 				},1500);
				
// 			}else {
// 				app.loading = false;
// 				//Create Errpr Message
// 				app.errorMsg = data.data.message;
// 			}
// 		});
// 	};
// })

// .controller('ListController', function($scope, Invoice, $timeout, $location) {

// 	var app = this;
// 	var total = 0;

//     $scope.personalDetails = [
//         {
//             'item':'',
//             'quantity':'',
//             'rate':'',
//             'amount':'', 
//         }];
    
//         $scope.addNew = function(personalDetail){
//         	var app = this;
//         	app.errorMsg = false;
//         	app.successMsg = false;
//         	app.loading = true;

//         	console.log($scope.personalDetails.length);

//         	if( $scope.personalDetails.length == 0 || ($scope.personalDetails[$scope.personalDetails.length-1].item &&
//         		$scope.personalDetails[$scope.personalDetails.length-1].quantity &&
//         		$scope.personalDetails[$scope.personalDetails.length-1].rate)) {
//         		app.loading = false;
//         		//Create Success Message
// 				//app.successMsg = data.data.message+'...Redirecting';

// 	        	$scope.personalDetails.push({ 
// 	                'item': "", 
// 	                'quantity': "",
// 	                'rate': "",
// 	                'amount': ""
// 	            });	
//         	} else {
//         		app.loading = false;
//         		//Create Errpr Message
// 				app.errorMsg = 'Enter all mandatory line item fields!';
//         	}
            
//         };

//         $scope.createinvalert = function(invoiceData){

//         	var app = this;
			
// 			app.errorMsg = false;
//         	app.successMsg = false;
//         	app.loading = true;

//         	//var invAmount = $scope.total();

//         	Invoice.create(invoiceData).then(function(data) {
//         		if(data.data.success){
//         		app.loading = false;
// 				//Create Success Message
// 				app.successMsg = data.data.message+'...Redirecting';

// 				//Redirect to Home Message
// 				$timeout(function(){
// 					$location.path('/');
// 				},1500);
				
// 				}else {
// 					app.loading = false;
// 					//Create Errpr Message
// 					app.errorMsg = data.data.message;
// 				}
// 			});

//         };
        
//         $scope.total = function(){
//         	var total = 0;
//         	// console.log($scope.personalDetails);
//             angular.forEach($scope.personalDetails, function(item){
// 				total += item.amount;
//             });
//             // console.log(total);
//             return total;
//         };

//         $scope.remove = function(){
//             var newDataList=[];
//             $scope.selectedAll = false;
//             angular.forEach($scope.personalDetails, function(selected){
//                 if(!selected.selected){
//                     newDataList.push(selected);
//                 }
//             }); 
//             $scope.personalDetails = newDataList;
//         };
    
//     	$scope.checkAll = function () {
//         // if (!$scope.selectedAll) {
//         //     $scope.selectedAll = true;
//         // } else {
//         //     $scope.selectedAll = false;
//         // }
//         angular.forEach($scope.personalDetails, function(personalDetail) {
//         	if(personalDetail.item !='')
//             	personalDetail.selected = $scope.selectedAll;
//         });
//     };    
//  });