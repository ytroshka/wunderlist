var authApp = angular.module('authApp', []);

authApp.controller('AuthController', function($scope, $http, $location) {

  $scope.auth = true;
  $scope.error = '';
  $scope.buttonName = "Sign up";

  $scope.login = function(user) {
    $http({
      method: 'POST',
      url: '/login',
      data: user
    }).then(function(res) {
      if(res.data === "No user"
        || res.data === "Invalid password"){
        $scope.error = res.data;
      } else {
        window.location.replace("/main#/lists");
      }
    }, function error(res) {
      throw new Error('Error!');
    });
  };

  $scope.register = function(user) {
    $http({
      method: 'POST',
      url: '/registration',
      data: user
    }).then(function(res) {
      if(res.data === "Validate email error"
        || res.data === "Duplicate users"){
        $scope.error = res.data;
      } else {
        window.location.replace("/main#/lists")
      }
    }, function error(res) {
      throw new Error('Error!');
    });
  };

  $scope.change = function() {
    $scope.error = '';
    if($scope.auth){
      $scope.auth = false;
      $scope.buttonName = 'Log In'
    } else {
      $scope.auth = true;
      $scope.buttonName = "Sign up";
    }
  }
});