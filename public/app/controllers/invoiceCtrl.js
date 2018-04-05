angular.module('invoiceController', ['memberController', 'chapterController', 'configServices'])

.controller('invoiceCtrl', function(Member, Chapter, $scope, Config) {
	var app = this;
	$scope.billingemail = undefined;
	$scope.invoicedate = new Date();
    app.invoiceTerms = Config.invoiceTerms;

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




    getChapters(); // Invoke function to get chapters from databases
    getMembers();

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

})