angular.module('invoiceController', ['memberController', 'chapterController', 'glaccountController', 'itemController','configServices'])

.controller('invoiceCtrl', function(Member, Chapter, GLAccount, Item, $scope, Config) {
	var app = this;
	$scope.billingemail = undefined;
	$scope.invoicedate = new Date();
    app.invoiceTerms = Config.invoiceTerms;


    $scope.lines = [
    {
        'item':'',
        'quantity':'',
        'rate':'',
        'amount':'' 
    }];

    // Function: get all the chapters from database
    function getChapters() {
        // Runs function to get all the chapters from database
        Chapter.getChapters().then(function(data) {
            // Check if able to get data from database
            if (data.data.success) {
                // Check which permissions the logged in user has
                if (data.data.permission === 'admin' || data.data.permission === 'moderator') {
                    app.chapters = data.data.chapters; // Assign chapters from database to variable
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

    // Function: get all the members from database
    function getMembers() {
        // Runs function to get all the members from database
        Member.getMembers().then(function(data) {
            // Check if able to get data from database
            if (data.data.success) {
                // Check which permissions the logged in user has
                if (data.data.permission === 'admin' || data.data.permission === 'moderator') {
                    app.members = data.data.members; // Assign members from database to variable
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

    var aracctstype = "Accounts Receivable";
    
    app.araccounts = {};

    // Function: get the glaccount that needs to be edited
    GLAccount.getGLAccountByType(aracctstype).then(function(data) {
        // Check if the user's _id was found in database
        if (data.data.success) {
            app.araccounts = data.data.glaccount;
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


    getChapters(); // Invoke function to get chapters from databases
    getMembers();
    getItems(); // Invoke function to get items from databases

    app.copyBillingEmail = function() {
    	$scope.billingemail = angular.copy($scope.member.email);
    };

    app.calcInvoiceDueDate = function() {
        $scope.invoiceduedate = new Date();
        var invoicedate = angular.copy($scope.invoicedate);
        var termdays = angular.copy($scope.invoiceterms.days);
        
        var duedate = new Date();
        duedate.setDate(invoicedate.getDate() + termdays);

        $scope.invoiceduedate = duedate;

    };

    app.calcLineAmount = function(lineLength) {

        var qty = angular.copy($scope.lines[lineLength-1].quantity);
        var rate = angular.copy($scope.lines[lineLength-1].rate);

        $scope.lines[lineLength-1].amount = qty*rate;
        
    };

    app.addNewLine = function(lineLength) {
         if( lineLength == 0 || ($scope.lines[lineLength-1].item &&
             $scope.lines[lineLength-1].quantity &&
             $scope.lines[lineLength-1].rate)) {
             app.loading = false;

             $scope.lines.push({ 
                 'item': "", 
                 'quantity': "",
                 'rate': "",
             }); 
         } else {
             app.loading = false;
             //Create Errpr Message
             app.errorMsg = 'Enter all mandatory line item fields!';
         }
    };

    app.removeLine = function(){
        var newDataList=[];
        $scope.selectedAll = false;
        angular.forEach($scope.lines, function(selected){
            if(!selected.selected){
                newDataList.push(selected);
            } else if($scope.lines.length == 1) {
                newDataList.push({ 
                 'item': "", 
                 'quantity': "",
                 'rate': "",
             }); 
            }
        }); 
        $scope.lines = newDataList;
    };

    app.checkAllLines = function () {
        // if (!$scope.selectedAll) {
        //     $scope.selectedAll = true;
        // } else {
        //     $scope.selectedAll = false;
        // }
        angular.forEach($scope.lines, function(lines) {
         if(lines.item !='')
             lines.selected = $scope.selectedAll;
        });
    }; 

})