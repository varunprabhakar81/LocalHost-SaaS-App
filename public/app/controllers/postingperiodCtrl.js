angular.module('postingperiodController', ['postingperiodServices'])

.controller('postingperiodCtrl', function($http, $location, $timeout, $scope, PostingPeriod, GLAccount, Config) {

    var app = this;

    app.loading = true; // Start loading icon on page load
    app.accessDenied = true; // Hide table while loading
    app.errorMsg = false; // Clear any error messages
    app.editAccess = false; // Clear access on load
    app.deleteAccess = false; // CLear access on load
    app.limit = 20; // Set a default limit to ng-repeat
    app.searchLimit = undefined; // Set the default search page results limit to zero
    app.showPostingPeriodEditModal = false;
    app.choiceMade = false;

    app.postingperiodmonths = Config.calMonths;
    app.postingperidstatuses = Config.postingperidstatuses;

    app.postingperiodyears = [];
    for (var i = 2017; i < 2022; i++) {
        (app.postingperiodyears).push(i);
    }

    app.postingperiodmonths = Config.calMonths;


    this.addPostingPeriod = function(postingperiodData, valid) {
        app.disabled = true;
        app.errorMsg = false;
        app.successMsg = false;
        app.loading = true;

        if (valid) {

            PostingPeriod.addPostingPeriod(app.postingperiodData).then(function(data) {

            if(data.data.success){
                app.loading = false;
                //Create Success Message
                app.successMsg = data.data.message+'...Redirecting';
                //Redirect to Home Message
                $timeout(function(){
                    $location.path('/managepostingperiods');
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

    // Function: get all the postingperiods from database
    function getPostingPeriods() {
        // Runs function to get all the postingperiods from database
        PostingPeriod.getPostingPeriods().then(function(data) {
            // Check if able to get data from database
            if (data.data.success) {
                // Check which permissions the logged in user has
                if (data.data.permission === 'admin' || data.data.permission === 'moderator') {
                    app.postingperiods = data.data.postingperiods; // Assign postingperiods from database to variable

                    app.loading = false; // Stop loading icon
                    app.accessDenied = false; // Show table

                    // Check if logged in user is an admin or moderator
                    if (data.data.permission === 'admin') {
                        app.editAccess = true; // Show edit button
                        app.deleteAccess = true; // Show delete button
                    } else if (data.data.permission === 'moderator') {
                        app.editAccess = true; // Show edit button
                    }
                } else {
                    app.errorMsg = 'Insufficient Permissions'; // Reject edit and delete options
                    app.loading = false; // Stop loading icon
                }
            } else {
                app.errorMsg = data.data.message; // Set error message
                app.loading = false; // Stop loading icon
            }
        });
    }


    getPostingPeriods(); // Invoke function to get postingperiods from databases

    app.postingperiodEditModal = function() {
        $("#postingperiodModal").modal({ backdrop: "static" }); // Open modal
        // Give user 10 seconds to make a decision 'yes'/'no'
        $timeout(function() {
                if (!app.choiceMade) {
                    $("#postingperiodModal").modal('hide');// If no choice is made after 10 seconds, select 'no' for them
                }
            }, 2500);
    };



    // Function: Show more results on page
    app.showMore = function(number) {
        app.showMoreError = false; // Clear error message
        // Run function only if a valid number above zero
        if (number > 0) {
            app.limit = number; // Change ng-repeat filter to number requested by user
        } else if (number == '') {
            app.limit = undefined;
        } else {
            app.showMoreError = 'Please enter a valid number'; // Return error if number not valid
        }
    };

    // Function: Show all results on page
    app.showAll = function() {
        app.limit = undefined; // Clear ng-repeat limit
        app.showMoreError = false; // Clear error message
    };

    // Function: Delete a postingperiod
    app.deletePostingPeriod = function(id) {
        // Run function to delete a user
        PostingPeriod.deletePostingPeriod(id).then(function(data) {
            // Check if able to delete user
            if (data.data.success) {
                getPostingPeriods(); // Reset users on page
            } else {
                app.showMoreError = data.data.message; // Set error message
            }
        });
    };

    // Function: Perform a basic search function
    app.search = function(searchKeyword, number) {
        // Check if a search keyword was provided
        if (searchKeyword) {
            // Check if the search keyword actually exists
            if (searchKeyword.length > 0) {
                app.limit = 0; // Reset the limit number while processing
                $scope.searchFilter = searchKeyword; // Set the search filter to the word provided by the user
                app.limit = number; // Set the number displayed to the number entered by the user
            } else {
                $scope.searchFilter = undefined; // Remove any keywords from filter
                app.limit = 0; // Reset search limit
            }
        } else {
            $scope.searchFilter = undefined; // Reset search limit
            app.limit = undefined; // Set search limit to zero
        }
    };

    // Function: Clear all fields
    app.clear = function() {
        $scope.number = undefined; // Set the filter box to 'Clear'
        app.limit = undefined; // Clear all results
        $scope.searchKeyword = undefined; // Clear the search word
        $scope.searchFilter = undefined; // Clear the search filter
        app.showMoreError = false; // Clear any errors
        $scope.advancedSearchFilter = {};
        $scope.searchByUsername = undefined;
        $scope.searchByEmail = undefined;
        $scope.searchByName = undefined;
    };

    // Function: Perform an advanced, criteria-based search
    app.advancedSearch = function(searchByUsername, searchByEmail, searchByName) {
        // Ensure only to perform advanced search if one of the fields was submitted
        if (searchByUsername || searchByEmail || searchByName) {
            $scope.advancedSearchFilter = {}; // Create the filter object
            if (searchByUsername) {
                $scope.advancedSearchFilter.username = searchByUsername; // If username keyword was provided, search by username
            }
            if (searchByEmail) {
                $scope.advancedSearchFilter.email = searchByEmail; // If email keyword was provided, search by email
            }
            if (searchByName) {
                $scope.advancedSearchFilter.name = searchByName; // If name keyword was provided, search by name
            }
            app.searchLimit = undefined; // Clear limit on search results
        } else {
            app.searchLimit = undefined; // Clear limit on search results
            $scope.advancedSearchFilter = {};
        }
    };

    // Function: Set sort order of results
    app.sortOrder = function(order) {
        app.sort = order; // Assign sort order variable requested by user
    };
})

// Controller: Used to edit users
.controller('editPostingPeriodCtrl', function($scope, $routeParams, User, PostingPeriod, $timeout, $location, GLAccount, Config) {

    var app = this;
    $scope.PrimaryInfoTab = 'active';
    app.phase1 = true;

    $scope.newPrimaryInfo = {};

    $scope.statuses = Config.postingperidstatuses;
    
    PostingPeriod.getPostingPeriod($routeParams.id).then(function(data) {
        if (data.data.success) {
            $scope.newPrimaryInfo.year = data.data.postingperiod.year;
            $scope.newPrimaryInfo.month = data.data.postingperiod.month;
            $scope.newPrimaryInfo.status = data.data.postingperiod.status;

            app.currentPostingPeriod = data.data.postingperiod._id;
        } else {
            app.errorMsg = data.data.message;
        }
    });

    app.PrimaryInfoPhase = function() {
        $scope.PrimaryInfoTab = 'active';
        $scope.AdditionalInfoTab = 'default';
        app.phase1 = true;
        app.phase2 = false;
        app.errorMsg = false;
    };

    app.AdditionalInfoPhase = function() {
        $scope.PrimaryInfoTab = 'default'; 
        $scope.AdditionalInfoTab = 'active'; 
        app.phase1 = false;
        app.phase2 = true;
        app.errorMsg = false;
    };

    app.updatePrimaryInfo = function(newPrimaryInfo, valid) {
        app.errorMsg = false;
        app.disabled = true; 
        
        if (valid) {
            var postingperiodObject = {};
            postingperiodObject._id = app.currentPostingPeriod;
            postingperiodObject.status = newPrimaryInfo.status;

            
            PostingPeriod.editPostingPeriod(postingperiodObject).then(function(data) {
               
                if (data.data.success) {
                    app.successMsg = data.data.message;
                    
                    $timeout(function() {
                        app.successMsg = false;
                        app.disabled = false;
                        $location.path('/managepostingperiods');
                    }, 2000);
                } else {
                    app.errorMsg = data.data.message;
                    app.disabled = false;
                }
            });
        } else {
            app.errorMsg = 'Please ensure form is filled out properly';
            app.disabled = false;
        }
    };

    app.updateAdditionalInfo = function(newAdditionalInfo, valid) {
        console.log('Additional Info Placeholder');
    };

});