angular.module('userApp',['appRoutes', 'emailController', 'userControllers','userServices', 'ngAnimate', 'maincontroller', 'authServices','managementController','chapterController','chapterServices', 'memberController','memberServices',
	'invoiceController', 'invoiceServices', 'configServices','configController', 'glaccountController','glaccountServices','itemController','itemServices',
	'paymentController', 'journalentryController', 'journalentryServices', 'postingperiodController','postingperiodServices', 'ngRoute'])
.config(function($httpProvider) {
	$httpProvider.interceptors.push('AuthInterceptors');
});