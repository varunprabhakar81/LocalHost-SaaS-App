angular.module('glaccountServices', [])

.factory('GLAccount', function($http) {
	glaccountFactory = {};

	//Chapter.create(regData)
	glaccountFactory.addGLAccount = function(glaccountData) {
		return $http.post('/api/addglaccount', glaccountData);
	}

	//GLAccount.create(regData)
	glaccountFactory.getGLAccounts = function() {
		return $http.get('/api/getglaccounts');
	}

	glaccountFactory.deleteGLAccount = function(glaccountnumber) {
		return $http.delete('/api/deleteglaccount/'+glaccountnumber);
	}

    glaccountFactory.getGLAccount = function(id) {
        return $http.get('/api/editglaccount/'+id);
    };

    glaccountFactory.editGLAccount = function(id) {
        return $http.put('/api/editglaccount/',id);
    };

    glaccountFactory.getGLAccountByType = function(type) {
        return $http.get('/api/getglaccountbytype/'+type);
    };

	return glaccountFactory;
})