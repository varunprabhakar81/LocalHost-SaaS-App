angular.module('userApp',['appRoutes', 'emailController', 'userControllers','userServices', 'ngAnimate', 'maincontroller', 'authServices','managementController','chapterController','chapterServices', 'memberController','memberServices','invoiceController','configServices','configController', 'glaccountController','glaccountServices','ngRoute'])
.config(function($httpProvider) {
	$httpProvider.interceptors.push('AuthInterceptors');
});