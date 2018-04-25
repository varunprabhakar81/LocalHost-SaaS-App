angular.module('glaccountController', ['glaccountServices'])

.controller('glaccountCtrl', function($http, $location, $timeout, $scope, GLAccount, Config) {

    var app = this;

    app.loading = true; // Start loading icon on page load
    app.accessDenied = true; // Hide table while loading
    app.errorMsg = false; // Clear any error messages
    app.editAccess = false; // Clear access on load
    app.deleteAccess = false; // CLear access on load
    app.limit = 20; // Set a default limit to ng-repeat
    app.searchLimit = undefined; // Set the default search page results limit to zero
    app.showGLAccountEditModal = false;
    app.choiceMade = false;

    $scope.GLTypes = Config.GLAccountTypes;
    
    this.addGLAccount = function(glaccountData, valid) {
        app.disabled = true;
        app.errorMsg = false;
        app.successMsg = false;
        app.loading = true;

        if (valid) {
            GLAccount.addGLAccount(app.glaccountData).then(function(data) {

            if(data.data.success){
                app.loading = false;
                //Create Success Message
                app.successMsg = data.data.message+'...Redirecting';
                //Redirect to Home Message
                $timeout(function(){
                    $location.path('/manageglaccounts');
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

    // Function: get all the glaccounts from database
    function getGLAccounts() {
        // Runs function to get all the glaccounts from database
        GLAccount.getGLAccounts().then(function(data) {
            // Check if able to get data from database
            if (data.data.success) {
                // Check which permissions the logged in user has
                if (data.data.permission === 'admin' || data.data.permission === 'moderator') {
                    app.glaccounts = data.data.glaccounts; // Assign glaccounts from database to variable
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


    getGLAccounts(); // Invoke function to get glaccounts from databases

    app.glaccountEditModal = function() {
        $("#glModal").modal({ backdrop: "static" }); // Open modal
        // Give user 10 seconds to make a decision 'yes'/'no'
        $timeout(function() {
                if (!app.choiceMade) {
                    $("#glModal").modal('hide');// If no choice is made after 10 seconds, select 'no' for them
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

    // Function: Delete a glaccount
    app.deleteGLAccount = function(glaccountname) {
        // Run function to delete a user
        GLAccount.deleteGLAccount(glaccountname).then(function(data) {
            // Check if able to delete user
            if (data.data.success) {
                getGLAccounts(); // Reset users on page
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
.controller('editGLAccountCtrl', function($scope, $routeParams, User, GLAccount, Config, $timeout, $location) {

    var app = this;
    $scope.glaccountnumberTab = 'active'; // Set the 'glaccountname' tab to the default active tab
    app.phase1 = true;
    $scope.GLTypes = Config.GLAccountTypes;

    // Function: get the glaccount that needs to be edited
    GLAccount.getGLAccount($routeParams.id).then(function(data) {
        // Check if the user's _id was found in database
        if (data.data.success) {
            $scope.newGLAccountName = data.data.glaccount.glaccountname;
            $scope.newGLAccountNumber = data.data.glaccount.glaccountnumber;
            $scope.newGLAccountType = data.data.glaccount.glaccounttype;

            app.currentGLAccount = data.data.glaccount._id; // Get user's _id for update functions
        } else {
            app.errorMsg = data.data.message; // Set error message
        }
    });

    app.glaccountnumberPhase = function() {
        $scope.glaccountnumberTab = 'active';
        $scope.glaccountnameTab = 'default';
        $scope.glaccounttypeTab = 'default';
        app.phase1 = true;
        app.phase2 = false;
        app.phase3 = false;
        app.errorMsg = false; // Clear error message
    };

    app.glaccountnamePhase = function() {
        $scope.glaccountnumberTab = 'default';
        $scope.glaccountnameTab = 'active';
        $scope.glaccounttypeTab = 'default';
        app.phase1 = false;
        app.phase2 = true;
        app.phase3 = false;
        app.errorMsg = false; // Clear error message
    };

    app.glaccounttypePhase = function() {
        $scope.glaccountnumberTab = 'default';
        $scope.glaccountnameTab = 'default';
        $scope.glaccounttypeTab = 'active';
        app.phase1 = false;
        app.phase2 = false;
        app.phase3 = true;
        app.errorMsg = false; // Clear error message
    };

    app.updateGLAccountNumber = function(newGLAccountNumber, valid) {
        app.errorMsg = false; // Clear any error messages
        app.disabled = true; // Disable form while processing


        if (valid) {
            var glaccountObject = {}; // Create a user object to pass to function
            glaccountObject._id = app.currentGLAccount; // Get _id to search database
            glaccountObject.glaccountnumber = $scope.newGLAccountNumber;

            GLAccount.editGLAccount(glaccountObject).then(function(data) {

                if (data.data.success) {
                    app.successMsg = data.data.message; // Set success message
                    // Function: After two seconds, clear and re-enable
                    $timeout(function() {
                        app.glaccountnumberForm.glaccountnumber.$setPristine();
                        app.glaccountnumberForm.glaccountnumber.$setUntouched();
                        app.successMsg = false; // Clear success message
                        app.disabled = false; // Enable form for editing
                        $location.path('/manageglaccounts');
                    }, 2000);
                } else {
                    app.errorMsg = data.data.message; // Clear any error messages
                    app.disabled = false; // Enable form for editing
                }
            });
        } else {
            app.errorMsg = 'Please ensure form is filled out properly'; // Set error message
            app.disabled = false; // Enable form for editing
        }
    };

    app.updateGLAccountName = function(newGLAccountName, valid) {
        app.errorMsg = false; // Clear any error messages
        app.disabled = true; // Disable form while processing
        if (valid) {
            var glaccountObject = {}; // Create a user object to pass to function
            glaccountObject._id = app.currentGLAccount; // Get _id to search database
            glaccountObject.glaccountname = $scope.newGLAccountName;
            GLAccount.editGLAccount(glaccountObject).then(function(data) {

                if (data.data.success) {
                    app.successMsg = data.data.message; // Set success message
                    // Function: After two seconds, clear and re-enable
                    $timeout(function() {
                        app.glaccountnameForm.glaccountname.$setPristine();
                        app.glaccountnameForm.glaccountname.$setUntouched();
                        app.successMsg = false; // Clear success message
                        app.disabled = false; // Enable form for editing
                        $location.path('/manageglaccounts');
                    }, 2000);
                } else {
                    app.errorMsg = data.data.message; // Clear any error messages
                    app.disabled = false; // Enable form for editing
                }
            });
        } else {
            app.errorMsg = 'Please ensure form is filled out properly'; // Set error message
            app.disabled = false; // Enable form for editing
        }
    };

    app.updateGLAccountType = function(newGLAccountType, valid) {
        app.errorMsg = false; // Clear any error messages
        app.disabled = true; // Disable form while processing


        if (valid) {
            var glaccountObject = {}; // Create a user object to pass to function
            glaccountObject._id = app.currentGLAccount; // Get _id to search database
            glaccountObject.glaccounttype = $scope.newGLAccountType;

            GLAccount.editGLAccount(glaccountObject).then(function(data) {

                if (data.data.success) {
                    app.successMsg = data.data.message; // Set success message
                    // Function: After two seconds, clear and re-enable
                    $timeout(function() {
                        app.glaccounttypeForm.glaccounttype.$setPristine();
                        app.glaccounttypeForm.glaccounttype.$setUntouched();
                        app.successMsg = false; // Clear success message
                        app.disabled = false; // Enable form for editing
                        $location.path('/manageglaccounts');
                    }, 2000);
                } else {
                    app.errorMsg = data.data.message; // Clear any error messages
                    app.disabled = false; // Enable form for editing
                }
            });
        } else {
            app.errorMsg = 'Please ensure form is filled out properly'; // Set error message
            app.disabled = false; // Enable form for editing
        }
    };
})


.controller('glreportCtrl', function($timeout, $location, $scope, JournalEntry, GLLine) {

    var app = this;

    var i=0;
    app.gllinestoreport = [];
    app.credittotal = 0;
    app.debittotal = 0;

    // Function: get all the chapters from database
    function getGLLines(journal) {
        // Runs function to get all the chapters from database
        GLLine.getGLLines(journal._id).then(function(data) {
            // Check if able to get data from database
            if (data.data.success) {
                // Check which permissions the logged in user has
                if (data.data.permission === 'admin' || data.data.permission === 'moderator') {
                    app.gllines = data.data.gllines;

                    angular.forEach(app.gllines, function(glline) {
                        app.gllinestoreport.push(glline);
                        app.credittotal += parseFloat(glline.creditamt);
                        app.debittotal += parseFloat(glline.debitamt);
                    });
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

    function getJournalEntries() {
        JournalEntry.getJournalEntries().then(function(data) {
            // Check if able to get data from database
            if (data.data.success) {
                // Check which permissions the logged in user has
                if (data.data.permission === 'admin' || data.data.permission === 'moderator') {
                    app.journalentries = data.data.journalentries;
                    angular.forEach(app.journalentries, function(journal) {
                        getGLLines(journal);
                    });
                    app.loading = false; // Stop loading icon
                    app.accessDenied = false; // Show table

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


    getJournalEntries();

    // Function: Show all results on page
    app.showAll = function() {
        app.limit = undefined; // Clear ng-repeat limit
        app.showMoreError = false; // Clear error message
    };

    // Function: Show more results on page
    app.showMore = function(number) {
        app.showMoreError = false; // Clear error message
        // Run function only if a valid number above zero
        console.log(number);

        if (number > 0) {
            app.limit = number; // Change ng-repeat filter to number requested by user
        } else if (number == '') {
            app.limit = undefined;
        } else {
            app.showMoreError = 'Please enter a valid number'; // Return error if number not valid
        }
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
})