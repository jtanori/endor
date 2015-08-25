angular
	.module('jound.directives')
	.directive('integer', function(){
	    return {
	        require: 'ngModel',
	        link: function(scope, ele, attr, ctrl){
	            ctrl.$parsers.unshift(function(viewValue){
	                return parseInt(viewValue, 10);
	            });
	        }
	    };
	})
	.directive('focusOn', function() {
	   return function(scope, elem, attr) {
	      scope.$on('focusOn', function(e, name) {
	        if(name === attr.focusOn) {
	          elem[0].focus();
	        }
	      });
	   };
	})
	.directive('blurOn', function() {
	   return function(scope, elem, attr) {
	      scope.$on('blurOn', function(e, name) {
	        if(name === attr.focusOn) {
	          elem[0].blur();
	        }
	      });
	   };
	})
	.factory('focus', function ($rootScope, $timeout) {
	  return function(name) {
	    $timeout(function (){
	      $rootScope.$broadcast('focusOn', name);
	    });
	  }
	})
	.factory('blur', function ($rootScope, $timeout) {
	  return function(name) {
	    $timeout(function (){
	      $rootScope.$broadcast('blurOn', name);
	    });
	  }
	});