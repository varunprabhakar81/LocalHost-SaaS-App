angular.module('itemServices', [])

.factory('Item', function($http) {
	itemFactory = {};

	//Item.create(regData)
	itemFactory.addItem = function(itemData) {
		return $http.post('/api/additem', itemData);
	}

	//Item.create(regData)
	itemFactory.getItems = function() {
		return $http.get('/api/getitems');
	}

	itemFactory.deleteItem = function(itemname) {
		return $http.delete('/api/deleteitem/'+itemname);
	}

    itemFactory.getItem = function(id) {
        return $http.get('/api/edititem/'+id);
    };

    itemFactory.editItem = function(id) {
        return $http.put('/api/edititem/',id);
    };

	return itemFactory;
})