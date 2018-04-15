angular.module('invoiceServices', [])

.factory('Invoice', function($http) {
	invoiceFactory = {};

	//Invoice.create(regData)
	invoiceFactory.addInvoice = function(invoiceData) {
		return $http.post('/api/addinvoice', invoiceData);
	}

	//Invoice.create(regData)
	invoiceFactory.getInvoices = function() {
		return $http.get('/api/getinvoices');
	}

	invoiceFactory.deleteInvoice = function(invoiceid) {
		return $http.delete('/api/deleteinvoice/'+invoiceid);
	}

    invoiceFactory.getInvoice = function(id) {
        return $http.get('/api/editinvoice/'+id);
    };

    invoiceFactory.invoicelinklines = function(id) {
        return $http.put('/api/invoicelinklines/', id);
    };

	return invoiceFactory;
})


.factory('InvoiceLine', function($http) {
	invoiceLineFactory = {};

	invoiceLineFactory.addInvoiceLine = function(invoicelineData) {
		return $http.post('/api/addinvoiceline', invoicelineData);
	}

	//Invoice.create(regData)
	invoiceLineFactory.getInvoiceLines = function(id) {
		return $http.get('/api/getinvoicelines/'+id);
	}

	invoiceLineFactory.deleteInvoiceLine = function(invoicelineid) {
		return $http.delete('/api/deleteinvoiceline/'+invoicelineid);
	}

    invoiceLineFactory.getInvoiceLine = function(id) {
        return $http.get('/api/editinvoiceline/'+id);
    };

    invoiceLineFactory.editInvoiceLine = function(id) {
        return $http.put('/api/editinvoiceline/',id);
    };

	return invoiceLineFactory;
})