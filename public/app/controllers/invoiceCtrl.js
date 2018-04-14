angular.module('invoiceController', ['memberController', 'chapterController', 'glaccountController', 'itemController','configServices'])

.controller('invoiceCtrl', function(Member, Chapter, GLAccount, Item, Invoice, InvoiceLine, $timeout, $location,$scope, Config) {
	var app = this;
	
    $scope.invoiceData = {};
    $scope.invoiceData.billingemail = undefined;

	$scope.invoiceData.invoicedate = new Date();
    $scope.invoiceData.invoiceduedate = new Date();
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
             // console.log(data.data.message); // Set error message
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

    app.copyBillingEmail = function(member) {
    	$scope.invoiceData.billingemail = member.email;
    };

    app.calcInvoiceDueDate = function(invoiceData) {
        var invoicedate = angular.copy($scope.invoiceData.invoicedate);
        var termdays = angular.copy($scope.invoiceData.invoiceterms.days);
        
        var duedate = new Date();

        if(invoicedate != null && termdays != null) {
            duedate.setTime( invoicedate.getTime() + termdays * 86400000 );
            invoiceData.invoiceduedate = duedate;
            
            //*!!NEEDS TO BE FIXED
            invoiceData.postingperiod= '04-2018';
        }

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

    app.total = function(){
        var total = 0;
        
        angular.forEach($scope.lines, function(item){
             total += item.amount;
            });
        return total;
    };


    app.createInvoiceLines = function(lines, invoice, valid) {
        app.disabled = true;
        app.errorMsg = false;
        app.successMsg = false;
        app.loading = true;
        app.newlines = [];

        if (valid) {
            if(lines.length != 0 && lines[0].item !='') {
                angular.forEach(lines, function(line){
                    line.invoice = invoice;
                    InvoiceLine.addInvoiceLine(line).then(function(data) {
                        if(data.data.success){
                            //console.log(data.data);
                            app.loading = false;
                            app.newlines.push(data.data.invoiceline);
                            // //Create Success Message
                            // app.successMsg = data.data.message+'...Redirecting';
                            // //Redirect to Home Message
                            // $timeout(function(){
                            //     $location.path('/');
                            // },2000);
                            
                        }else {
                            //console.log(data.data);
                            app.disabled = false;
                            app.loading = false;
                            //Create Error Message
                            app.errorMsg = data.data.message;
                        }
                    });
                });
            } else {
                //Create an error message
                app.loading = false;
                app.disabled = false;     
                app.errorMsg = 'Please enter at least one line';
            }
        }
        else {
            //Create an error message
            app.loading = false;
            app.disabled = false;     
            app.errorMsg = 'Please ensure form is filled out properly';
        }
        return (app.errorMsg);
    };

    app.createInvoice = function(invoiceData,lines,valid) {
        app.disabled = true;
        app.errorMsg = false;
        app.successMsg = false;
        app.loading = true;


        // if(linescreated) {

            //*!! FIX HARD CODED VALUES
            invoiceData.amountpaid = 0;
            invoiceData.amountremaining = invoiceData.amountdue ;

            if (valid) {
                Invoice.addInvoice(invoiceData).then(function(data) {
                if(data.data.success){

                    var lineserr = app.createInvoiceLines(lines, data.data.invoice, true);

                    if(!lineserr) {

                        invoiceData._id = data.data.invoice._id;

                        Invoice.invoicelinklines(invoiceData).then(function(data) {
                            // Check if able to edit the user's name
                            if (data.data.success) {
                                //*!! FIX - Do something on successful link of invoice to lines
                            } else {
                                app.disabled = false;
                                app.loading = false;
                                //Create Error Message
                                app.errorMsg = data.data.message;
                            }
                        });

                        app.loading = false;
                        //Create Success Message
                        app.successMsg = data.data.message+'...Redirecting';
                        //Redirect to Home Message
                        $timeout(function(){
                            $location.path('/');
                        },2000);
                    }
                    //console.log(data.data);
                    
                }else {
                    //console.log(data.data);
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
        // }

    };

})