angular.module('memberServices', [])

.factory('Member', function($http) {
	memberFactory = {};

	//Member.create(regData)
	memberFactory.addMember = function(memberData) {
		return $http.post('/api/addmember', memberData);
	}

	//Member.create(regData)
	memberFactory.getMembers = function() {
		return $http.get('/api/getmembers');
	}

	memberFactory.deleteMember = function(membername) {
		return $http.delete('/api/deletemember/'+membername);
	}

    memberFactory.getMember = function(id) {
        return $http.get('/api/editmember/'+id);
    };

    memberFactory.editMember = function(id) {
        return $http.put('/api/editmember/',id);
    };

	return memberFactory;
})