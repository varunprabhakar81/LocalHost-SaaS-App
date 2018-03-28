angular.module('userApp',['appRoutes', 'emailController', 'userControllers','userServices', 'ngAnimate', 'maincontroller', 'authServices','managementController', 'invoiceController','ngRoute'])

.config(function($httpProvider) {
	$httpProvider.interceptors.push('AuthInterceptors');
});