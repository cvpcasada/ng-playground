(function(ng,rand){
    'use strict';
    var mainApp = ng.module('main',['ngLodash','ngTable']);

    // Run app will run when main Application is initialized
    mainApp.run(['$rootScope','appConfig',function($rootScope,appConfig){
        appConfig.configure();
    }]);

    // scopes, assignments, etc
    mainApp.controller('mainCtrl',['$scope','userDAO','ngTableParams','$filter',function($scope,userDAO,ngTableParams,$filter){
        userDAO.fetchUsers(800).then(function(result) {
            $scope.users = result;
        });

        $scope.data = {
            users : []
        };

        $scope.params = new ngTableParams({
            page: 1,
            count: 10

        }, {
            total: 0,
            getData : function($defer,params) {
                if ($scope.data.users.length === 0) {
                    userDAO.fetchUsers(800).then(function(result) {

                        result = params.filter ? $filter('filter')(result,params.filter()) : result;

                        $scope.data.users = result;
                        params.total(result.length);
                        $defer.resolve($scope.data.users.slice((params.page() - 1) * params.count(), params.page() * params.count()));
                    });
                } else {
                    $defer.resolve($scope.data.users.slice((params.page() - 1) * params.count(), params.page() * params.count()));
                }
            }
        });


    }]);

    // services/dao anything that fetches data (JSON) from remote location

    //
    mainApp.service('appConfig', ['$location', function($location) {
        this.initialize = function() {
            this.$location = $location;
            this.isMock = false;
        };

        // read the parameters passed to app, looking for 'useMocks'
        this.configure = function() {
            var params = $location.search();

            if (params.isMock) {
                this.isMock = true;
                console.log('mocks enabled');
            }
        };

        this.initialize();
    }]);

    mainApp.service('fakeUserService',['$q','$timeout',function($q,$timeout){
        this.fetchUsers = function(size){
            var deferred = $q.defer();

            // fake a server response by adding a timeout
            $timeout(function() {
                var users = [];
                if (typeof size === 'undefined' || !size) {
                    size = rand.n(500,2);
                }

                for (var i = 0; i < size; i++) {
                    users.push(
                        {
                            id: i,
                            username: rand.name(),
                            firstname: rand.name(1),
                            lastname: rand.name(1),
                            email: rand.chars(6,10,-3) + '@' + rand.chars(6,10,-3) + '.' + rand.site(0),
                            birthday: rand.date({yearRange:-60})
                        }
                    );
                }

                deferred.resolve(users);

            },rand.n(1000,-5));

            return deferred.promise;
        }
    }]);

    // good explanation of service vs factory: http://stackoverflow.com/a/21900284
    mainApp.factory('userDAO',['fakeUserService','appConfig','$q',function(fakeUserService,appConfig,$q) {
        if (appConfig.isMock) {
            return fakeUserService;
        }
        // this comes from real server
        else {
            return {
                fetchUsers: function(size) {
                    var later = $q.defer();
                    later.resolve([]);
                    return later.promise;
                }
            }
        }

    }]);

})(window.angular,window.rand);