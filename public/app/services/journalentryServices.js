angular.module('journalentryServices', [])

.factory('JournalEntry', function($http) {
	journalentryFactory = {};

	journalentryFactory.addJournalEntry = function(journalentryData) {
		return $http.post('/api/addjournalentry', journalentryData);
	}

	journalentryFactory.getJournalEntries = function() {
		return $http.get('/api/getjournalentries');
	}

	journalentryFactory.deleteJournalEntry = function(journalentryid) {
		return $http.delete('/api/deletejournalentry/'+journalentryid);
	}

    journalentryFactory.getJournalEntry = function(id) {
        return $http.get('/api/editjournalentry/'+id);
    };

    journalentryFactory.journalentrylinkgllines = function(id) {
        return $http.put('/api/journalentrylinkgllines/', id);
    };

	return journalentryFactory;
})


.factory('GLLine', function($http) {
	glLineFactory = {};

	glLineFactory.addGLLine = function(gllineData) {
		return $http.post('/api/addglline', gllineData);
	}

	glLineFactory.getGLLines = function(id) {
		return $http.get('/api/getgllines/'+id);
	}

	glLineFactory.deleteGLLine = function(gllineid) {
		return $http.delete('/api/deleteglline/'+gllineid);
	}

    glLineFactory.getGLLine = function(id) {
        return $http.get('/api/editglline/'+id);
    };

    glLineFactory.editGLLine = function(id) {
        return $http.put('/api/editglline/',id);
    };

	return glLineFactory;
})