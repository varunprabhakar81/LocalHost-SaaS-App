angular.module('invoiceController', ['memberController', 'chapterController', 'glaccountController', 'itemController','configServices', 'journalentryServices'])

.controller('invoiceCtrl', function(Member, Chapter, GLAccount, Item, Invoice, InvoiceLine, $timeout, $location, 
    $scope, $routeParams, Config, JournalEntry, GLLine) {
	var app = this;
    app.enableedit = false;

    if($routeParams.id == null) {
        app.view = false;
        app.enableedit = false;
        app.create = true;
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

        app.calcLineAmount = function(line) {
            var qty = angular.copy(line.quantity);
            var rate = angular.copy(line.rate);

            line.amount = qty*rate;
            
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

            angular.forEach($scope.lines, function(line){
                if(line.amount) {
                    total += parseFloat(line.amount);
                }
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
            return (!app.errorMsg);
        };


        app.createGLLines = function(journal, invoice, invoicelines) {
            app.disabled = true;
            app.errorMsg = false;
            app.successMsg = false;
            app.loading = true;

            //Create Credit Lines
            if(invoicelines.length != 0 && invoicelines[0].item !='') {
                angular.forEach(invoicelines, function(invoiceline){
                    var newline = {};

                    newline.chapter = journal.chapter;
                    newline.date = journal.date;
                    newline.journal = journal;
                    newline.postingperiod = journal.postingperiod;
                    newline.transactionsource = invoice;

                    
                    newline.glacct = invoiceline.item.incomeacct;
                    newline.creditamt = invoiceline.amount;
                    newline.debitamt = 0;



                    GLLine.addGLLine(newline).then(function(data) {
                        if(data.data.success){
                            //console.log(data.data);
                            app.loading = false;
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

                var newline = {};
                newline.chapter = journal.chapter;
                    newline.date = journal.date;
                    newline.journal = journal;
                    newline.postingperiod = journal.postingperiod;
                    newline.transactionsource = invoice;


                //Create Debit Line
                newline.glacct = invoice.aracct;
                newline.debitamt = invoice.amountdue;
                newline.creditamt = 0;

                GLLine.addGLLine(newline).then(function(data) {
                    if(data.data.success){
                        //console.log(data.data);
                        app.loading = false;
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

            } else {
                //Create an error message
                app.loading = false;
                app.disabled = false;     
                app.errorMsg = 'Please enter at least one line';
            }

            return (!app.errorMsg);
        };

        app.createGLPosting = function(invoiceData, invoicelines) {
            var JournalEntryData = {};

            app.disabled = true;
            app.errorMsg = false;
            app.successMsg = false;
            app.loading = true;

            JournalEntryData.chapter = invoiceData.chapter;
            JournalEntryData.date = invoiceData.invoicedate;
            JournalEntryData.postingperiod = invoiceData.postingperiod;


            JournalEntry.addJournalEntry(JournalEntryData).then(function(data) {
                if(data.data.success){

                    var GLLinesCreated = app.createGLLines(data.data.journalentry, invoiceData, invoicelines);

                    if(GLLinesCreated) {

                        JournalEntryData._id = data.data.journalentry._id;

                        JournalEntry.journalentrylinkgllines(JournalEntryData).then(function(data) {
                            // Check if able to edit the user's name
                            if (data.data.success) {
                                //*!! FIX - Do something on successful link of GL Lines to Journal Entry
                            } else {
                                app.disabled = false;
                                app.loading = false;
                                //Create Error Message
                                app.errorMsg = data.data.message;
                            }
                        });

                        app.loading = false;
                        //Create Success Message
                        app.successMsg = 'Invoice & ' + data.data.message + '...Redirecting';
                        //Redirect to Home Message
                        $timeout(function(){
                            $location.path('/reports/invoicereport');
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

                        var InvoiceLinesCreated = app.createInvoiceLines(lines, data.data.invoice, true);

                        if(InvoiceLinesCreated) {

                            invoiceData._id = data.data.invoice._id;

                            Invoice.invoicelinklines(invoiceData).then(function(data) {
                                // Check if able to edit the user's name
                                if (data.data.success) {
                                    //*!! FIX - Do something on successful link of invoice to lines
                                    var GLPosted = app.createGLPosting(invoiceData, lines);
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
                                $location.path('/reports/invoicereport');
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

    } else {
        app.view = true;
        app.create = false;

        // $scope.invoiceData = {};
        // Function: get the chapter that needs to be edited
        Invoice.getInvoice($routeParams.id).then(function(data) {
        // Check if the user's _id was found in database
        if (data.data.success) {
            // console.log($scope.invoiceData);
            // $scope.invoiceData = data.data.invoice; // Display chapter name in scope
            $scope.invoiceData.chapter = data.data.invoice.chapter;
            $scope.invoiceData.member = data.data.invoice.member;
            $scope.invoiceData.billingemail = data.data.invoice.billingemail;
            $scope.invoiceData.invoicedate = new Date(data.data.invoice.invoicedate.valueOf());
            $scope.invoiceData.invoiceterms = data.data.invoice.invoiceterms;
            $scope.invoiceData.invoiceduedate = new Date(data.data.invoice.invoiceduedate.valueOf());
            $scope.invoiceData.postingperiod = data.data.invoice.postingperiod;
            $scope.invoiceData.aracct = data.data.invoice.aracct;
            // $scope.lines = data.data.invoice.lines;

            InvoiceLine.getInvoiceLines($routeParams.id).then(function(lines) {
                if (lines.data.success) {
                    // console.log(lines.data.invoicelines);
                    // console.log($scope.invoiceData);
                    $scope.lines = lines.data.invoicelines; // Display chapter name in scope

                } else {
                    app.errorMsg = data.data.message; // Set error message
                }

            });

            // $scope.invoiceData.invoicedate.setDate( (data.data.invoice.invoicedate).getDate());
            
        } else {
            app.errorMsg = data.data.message; // Set error message
        }
    });

    }

    app.editInvoice = function(){
        app.enableedit = true;
    };
	
   

})

.controller('invoicereportCtrl', function(Member, Chapter, GLAccount, Item, Invoice, InvoiceLine, $timeout, $location,$scope, Config) {

    var app = this;

    
    // $scope.invoiceData = {};
    // $scope.invoiceData.billingemail = undefined;

    // $scope.invoiceData.invoicedate = new Date();
    // $scope.invoiceData.invoiceduedate = new Date();
    // app.invoiceTerms = Config.invoiceTerms;

    // $scope.lines = [
    // {
    //     'item':'',
    //     'quantity':'',
    //     'rate':'',
    //     'amount':'' 
    // }];
        // Function: get all the chapters from database
    function getInvoices() {
        // Runs function to get all the chapters from database
        Invoice.getInvoices().then(function(data) {
            // Check if able to get data from database
            if (data.data.success) {
                // Check which permissions the logged in user has
                if (data.data.permission === 'admin' || data.data.permission === 'moderator') {
                    app.invoices = data.data.invoices; // Assign chapters from database to variable
                    app.total = 0;
                    angular.forEach(app.invoices, function(invoice) {
                        app.total += parseFloat(invoice.amountremaining);
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


    getInvoices(); // Invoke function to get chapters from databases

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

.controller('viewinvoiceCtrl', function($scope, $routeParams, User, Chapter, $timeout, $location) {
})