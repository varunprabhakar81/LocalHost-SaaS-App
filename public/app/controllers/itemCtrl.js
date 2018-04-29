angular.module('itemController', ['itemServices'])

.controller('itemCtrl', function($http, $location, $timeout, $scope, Item, GLAccount) {

    var app = this;

    app.loading = true; // Start loading icon on page load
    app.accessDenied = true; // Hide table while loading
    app.errorMsg = false; // Clear any error messages
    app.editAccess = false; // Clear access on load
    app.deleteAccess = false; // CLear access on load
    app.limit = 20; // Set a default limit to ng-repeat
    app.searchLimit = undefined; // Set the default search page results limit to zero
    app.showItemEditModal = false;
    app.choiceMade = false;
    
    //Item.addTest();

    // Item.addTest().then(function(data) {
    //         // Check if able to get data from database
    //         if (data.data.success) {
    //             console.log(data.data.story.author.name);
    //         }
    // });

    this.addItem = function(itemData, valid) {
        app.disabled = true;
        app.errorMsg = false;
        app.successMsg = false;
        app.loading = true;

        if (valid) {

            Item.addItem(app.itemData).then(function(data) {

            if(data.data.success){
                app.loading = false;
                //Create Success Message
                app.successMsg = data.data.message+'...Redirecting';
                //Redirect to Home Message
                $timeout(function(){
                    $location.path('/manageitems');
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

    var incomeaccountstype = "Income";
    
    app.incomeaccounts = {};

    // Function: get the glaccount that needs to be edited
    GLAccount.getGLAccountByType(incomeaccountstype).then(function(data) {
        // Check if the user's _id was found in database
        if (data.data.success) {
            app.incomeaccounts = data.data.glaccount;
        } else {
             console.log(data.data.message); // Set error message
        }
    });

    // Function: get all the items from database
    function getItems() {
        // Runs function to get all the items from database
        Item.getItems().then(function(data) {
            // Check if able to get data from database
            if (data.data.success) {
                // Check which permissions the logged in user has
                if (data.data.permission === 'admin' || data.data.permission === 'moderator') {
                    app.items = data.data.items; // Assign items from database to variable

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


    getItems(); // Invoke function to get items from databases

    app.itemEditModal = function() {
        $("#itemModal").modal({ backdrop: "static" }); // Open modal
        // Give user 10 seconds to make a decision 'yes'/'no'
        $timeout(function() {
                if (!app.choiceMade) {
                    $("#itemModal").modal('hide');// If no choice is made after 10 seconds, select 'no' for them
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

    // Function: Delete a item
    app.deleteItem = function(itemname) {
        // Run function to delete a user
        Item.deleteItem(itemname).then(function(data) {
            // Check if able to delete user
            if (data.data.success) {
                getItems(); // Reset users on page
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
.controller('editItemCtrl', function($scope, $routeParams, User, Item, $timeout, $location, GLAccount) {

    var app = this;
    $scope.PrimaryInfoTab = 'active'; // Set the 'itemname' tab to the default active tab
    app.phase1 = true; // Set the 'itemname' tab to default view

    $scope.newPrimaryInfo = {};

    var incomeaccountstype = "Income";
    
    app.incomeaccounts = {};

    // Function: get the glaccount that needs to be edited
    GLAccount.getGLAccountByType(incomeaccountstype).then(function(data) {
        // Check if the user's _id was found in database
        if (data.data.success) {
            app.incomeaccounts = data.data.glaccount;
        } else {
             console.log(data.data.message); // Set error message
        }
    });


    // Function: get the item that needs to be edited
    Item.getItem($routeParams.id).then(function(data) {
        // Check if the user's _id was found in database
        if (data.data.success) {
            $scope.newPrimaryInfo.itemname = data.data.item.itemname;
            $scope.newPrimaryInfo.incomeacct = data.data.item.incomeacct;
            $scope.newPrimaryInfo.rate = data.data.item.rate;

            app.currentItem = data.data.item._id; // Get user's _id for update functions
        } else {
            app.errorMsg = data.data.message; // Set error message
        }
    });

    app.PrimaryInfoPhase = function() {
        $scope.PrimaryInfoTab = 'active'; // Set item name list to active
        $scope.AdditionalInfoTab = 'default'; // Clear website tab
        app.phase1 = true; // Set itemname tab active
        app.phase2 = false; // Set website tab inactive
        app.errorMsg = false; // Clear error message
    };

    app.AdditionalInfoPhase = function() {
        $scope.PrimaryInfoTab = 'default'; // Set item name list to active
        $scope.AdditionalInfoTab = 'active'; // Clear website tab
        app.phase1 = false; // Set itemname tab active
        app.phase2 = true; // Set website tab inactive
        app.errorMsg = false; // Clear error message
    };

    app.updatePrimaryInfo = function(newPrimaryInfo, valid) {
        app.errorMsg = false; // Clear any error messages
        app.disabled = true; // Disable form while processing
        // Check if the itemname being submitted is valid
        if (valid) {
            var itemObject = {}; // Create a user object to pass to function
            itemObject._id = app.currentItem; // Get _id to search database
            itemObject.itemname = newPrimaryInfo.itemname; // Set the new name to the user
            itemObject.incomeacct = newPrimaryInfo.incomeacct; // Set the new name to the user
            itemObject.rate = newPrimaryInfo.rate; // Set the new name to the user

            // Runs function to update the user's name
            Item.editItem(itemObject).then(function(data) {
                // Check if able to edit the user's name
                if (data.data.success) {
                    app.successMsg = data.data.message; // Set success message
                    // Function: After two seconds, clear and re-enable
                    $timeout(function() {
                        // $scope.PrimaryInfoForm.itemname.$setPristine();
                        // $scope.PrimaryInfoForm.itemname.$setUntouched();
                        // $scope.PrimaryInfoForm.incomeacct.$setPristine();
                        // $scope.PrimaryInfoForm.incomeacct.$setUntouched();
                        app.successMsg = false; // Clear success message
                        app.disabled = false; // Enable form for editing
                        $location.path('/manageitems');
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

    app.updateAdditionalInfo = function(newAdditionalInfo, valid) {
        console.log('Additional Info Placeholder');
    };

});