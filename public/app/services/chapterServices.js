angular.module('chapterServices', [])

.factory('Chapter', function($http) {
	chapterFactory = {};

	//Chapter.create(regData)
	chapterFactory.addChapter = function(chapterData) {
		return $http.post('/api/addchapter', chapterData);
	}

	//Chapter.create(regData)
	chapterFactory.getChapters = function() {
		return $http.get('/api/getchapters');
	}

	chapterFactory.deleteChapter = function(chaptername) {
		return $http.delete('/api/deletechapter/'+chaptername);
	}

    chapterFactory.getChapter = function(id) {
        return $http.get('/api/editchapter/'+id);
    };

    chapterFactory.editChapter = function(id) {
        return $http.put('/api/editchapter/',id);
    };

	return chapterFactory;
})