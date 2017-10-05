var listApp = angular.module('listApp', []);

window.addEventListener('resize', function() {
  if(window.innerWidth > 768){
    document.getElementsByClassName('lists')[0].style.display = 'block';
  }
}, true);

function openList() {
  document.getElementsByClassName('lists')[0].style.display = 'none';
}

function backToLists() {
  document.getElementsByClassName('lists')[0].style.display = 'block';
}

listApp.controller('listController', function($scope, $http, $location) {

  var hideLists = false;
  var currentListId;

  var parseUrl = function() {
    var expr = /(?:\/lists)[\/]([\w]{5,})/;
    var find = $location.path().match(expr);
    currentListId = find;
    if(find !== null){
      for(var i = 0; i < $scope.lists.length; i++) {
        if($scope.lists[i]['_id'].toString() === find[1]){
          $scope.loadTask(find[1], i);
          $scope.lists[i]['style'] = 'active';
          $scope.currentList = $scope.lists[i].title;
        }
      }
    }
  };

  var loadAllLists = function() {
    $http({
      method: 'GET',
      url: '/lists'
    }).then(function(res) {
      if(res.data === "No login"){
        window.location.replace("/login");
      }
      $scope.lists = res.data[0].lists;
      parseUrl();
    }, function(res) {
      throw new Error('Error!');
    });
  };
  loadAllLists();

  $http({
    method: 'GET',
    url: '/getUser'
  }).then(function(res) {
    $scope.userEmail = res['data'][0]['email'];
  }, function(res) {
    throw new Error('Error!');
  });

  $scope.showTaskInfo = true;
  $scope.createList = true;

  $scope.loadTask = function(task, index) {
    for(var i in $scope.lists) {
      $scope.lists[i]['style'] = '';
    }

    $scope.finishedTasks = [];
    $scope.lists[index]['style'] = 'active';
    $scope.currentList = $scope.lists[index].title;

    currentListId = task;
    hideLists = false;

    $location.path('lists/' + task);

    $http({
      method: 'GET',
      url: $location.path()
    }).then(function(res) {
      $scope.tasks = [];
      if(res.data[0]){
        res.data.forEach(function(i) {
          var newTask = i;
          newTask['style'] = '';
          if(newTask.status){
            newTask['state'] = true;
            newTask.status = true;
            $scope.finishedTasks.push(newTask);
          } else {
            $scope.tasks.push(newTask);
          }
        });
      }
      $scope.currentTask = $scope.tasks[0] || $scope.finishedTasks[0];
    }, function(res) {
      throw new Error('Error!');
    });
  };

  $scope.addTask = function(task) {
    if($location.path() === '/lists' || $location.path() === '/lists/'){
      alert('Choose the list before adding to-do');
      return false;
    }

    document.getElementsByClassName('addTaskButton')[0].value = '';

    $http({
      method: 'POST',
      url: $location.path() + '/newTask',
      data: task
    }).then(function(res) {
      $scope.tasks.push(res.data[res.data.length - 1]);
    }, function(res) {
      throw new Error('Error!');
    });
  };

  $scope.addList = function(list) {
    document.getElementsByClassName('addListField')[0].value = '';
    if(list){
      $http({
        method: 'POST',
        url: '/newList',
        data: list
      }).then(function(res) {
        $location.path('lists/' + res.data);

        currentListId = res.data;
        $scope.finishedTasks = [];
        $scope.tasks = [];

        $scope.lists.push({
          'title': list.listName,
          '_id': res.data
        });

        $scope.createList = true;

        for(var i in $scope.lists) {
          $scope.lists[i]['style'] = '';
        }

        $scope.lists[$scope.lists.length - 1]['style'] = 'active';
        $scope.currentList = $scope.lists[$scope.lists.length - 1].title;
      });
    } else {
      $scope.createList = false;
    }
  };

  $scope.removeList = function(list) {
    $http({
      method: 'GET',
      url: '/deleteList/' + list
    }).then(function(res) {
      loadAllLists();
      $scope.tasks = [];
      $scope.finishedTasks = [];
      $location.path('/lists');
      $scope.currentList = ''
    }, function(res) {
      throw new Error('Error!');
    });
  };

  $scope.closeAddList = function() {
    document.getElementsByClassName('addListField')[0].value = '';
    $scope.createList = true;
  };

  $scope.changeTaskState = function(index) {
    var obj = $scope.tasks.splice(index, 1)[0];
    obj['state'] = !hideLists;
    obj.status = true;

    $http({
      method: 'GET',
      url: /lists/ + currentListId + '/changeTaskState/' + obj['_id']
    }).then(function(res) {
      $scope.finishedTasks.push(obj);
    }, function(res) {
      throw new Error('Error!');
    });
  };

  $scope.changeFinishedTaskState = function(index) {
    var obj = $scope.finishedTasks.splice(index, 1)[0];

    $http({
      method: 'GET',
      url: /lists/ + currentListId + '/revertTaskState/' + obj['_id']
    }).then(function(res) {
      delete obj.state;
      $scope.tasks.push(obj);
    }, function(res) {
      throw new Error('Error!');
    });
  };

  $scope.showCompleted = function() {
    hideLists = !hideLists;
    for(var task in $scope.finishedTasks) {
      $scope.finishedTasks[task].state = !$scope.finishedTasks[task].state;
    }
  };

  $scope.showInfo = function(task, index) {
    $scope.currentTaskId = index;
    $scope.currentTask = task;

    document.getElementsByClassName('dateButton')[0].value = task.date.slice(0, 10);

    for(var task in $scope.tasks) {
      $scope.tasks[task].style = '';
    }

    for(var task in $scope.finishedTasks) {
      $scope.finishedTasks[task].style = '';
    }

    if($scope.currentTask.state === undefined){
      $scope.tasks[index].style = ' active';
    } else {
      $scope.finishedTasks[index].style = ' active';
    }

    $scope.showTaskInfo = false;
    $location.path('/tasks/' + $scope.currentTask['_id']);
  };

  $scope.closeShowTaskInfo = function() {
    $location.path('/lists/' + currentListId);
    $scope.showTaskInfo = true;

    for(var task in $scope.tasks) {
      $scope.tasks[task].style = '';
    }

    for(var task in $scope.finishedTasks) {
      $scope.finishedTasks[task].style = '';
    }
  };

  $scope.setDate = function(task, date) {
    $http({
      method: 'GET',
      url: '/lists/' + currentListId + '/' + task['_id'] + '/updateDate/' + date
    }).then(function(res) {
      $scope.showTaskInfo = true;
      $scope.loadTask(currentListId, $scope.currentTaskId);

      if($scope.currentTask.state === undefined){
        $scope.tasks[$scope.currentTaskId].style = ' active';
      } else {
        $scope.finishedTasks[$scope.currentTaskId].style = ' active';
      }

    }, function(res) {
      throw new Error('Error!');
    })
  }
});