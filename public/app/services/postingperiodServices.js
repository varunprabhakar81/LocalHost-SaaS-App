angular.module('postingperiodServices', [])

.factory('PostingPeriod', function($http) {
	postingperiodFactory = {};

	postingperiodFactory.addPostingPeriod = function(postingperiodData) {
		return $http.post('/api/addpostingperiod', postingperiodData);
	}

	postingperiodFactory.getPostingPeriods = function(status) {
		return $http.get('/api/getpostingperiods/'+status);
	}

	postingperiodFactory.deletePostingPeriod = function(id) {
		return $http.delete('/api/deletepostingperiod/'+id);
	}

    postingperiodFactory.getPostingPeriod = function(id) {
        return $http.get('/api/editpostingperiod/'+id);
    };

    postingperiodFactory.editPostingPeriod = function(id) {
        return $http.put('/api/editpostingperiod/',id);
    };

	return postingperiodFactory;
})