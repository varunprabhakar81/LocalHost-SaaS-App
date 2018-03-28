angular.module('userServices', [])

.factory('User', function($http) {
	userFactory = {};
	//User.create(regData)
	userFactory.create = function(regData) {
		return $http.post('/api/users', regData);
	}

	//User.checkUsername(regData)	
	userFactory.checkUsername = function(regData) {
		return $http.post('/api/checkusername', regData);
	}

	//User.checkEmail(regData)
	userFactory.checkEmail = function(regData) {
		return $http.post('/api/checkemail', regData);
	}

	//User.activateAccount(token);
	userFactory.activateAccount = function(token) {
		return $http.put('/api/activate/' + token);
	}

	//User.checkCredentials(loginData);
	userFactory.checkCredentials = function(loginData) {
		return $http.post('/api/resend', loginData);
	}

	//User.resendLink(userData);
	userFactory.resendLink = function(username) {
		return $http.put('/api/resend', username);
	}

	//User.sendUsername(userData);
	userFactory.sendUsername = function(userData) {
		return $http.get('/api/resetusername/'+ userData);
	}

	// Send password reset link to user's e-mail
	//User.sendPassword(resetData);
	userFactory.sendPassword = function(resetData) {
		return $http.put('/api/resetpassword',resetData);
	}

	//User.resetUser(token);
	userFactory.resetUser = function(token) {
		return $http.get('/api/resetpassword/'+token);
	}

    // Save user's new password
    userFactory.savePassword = function(regData) {
        return $http.put('/api/savepassword', regData)
    }

    // Provide the user with a new token
    userFactory.renewSession = function(username) {
        return $http.get('/api/renewToken/' + username);
    };

    userFactory.getPermission = function() {
        return $http.get('/api/permission/');
    };

    userFactory.getUsers = function() {
        return $http.get('/api/management/');
    };

    userFactory.getUser = function(id) {
        return $http.get('/api/edit/'+id);
    };

    userFactory.deleteUser = function(username) {
        return $http.delete('/api/management/'+ username);
    };

    userFactory.editUser = function(id) {
        return $http.put('/api/edit/',id);
    };

	return userFactory;
})

.factory('Invoice', function($http) {
	invoiceFactory = {};

	//invoice.createInvoice(invoiceData)
	invoiceFactory.create = function(invoiceData) {
	return $http.post('/api/invoice', invoiceData);
	}

	return invoiceFactory;
});