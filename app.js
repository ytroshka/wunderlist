var express = require('express');
var app = express();

var bodyParser = require('body-parser');
var session = require('express-session');
var moment = require('moment');

var User = require('./app/models/user');

app.use(bodyParser());
app.use(session({
  resave: true,
  saveUninitialized: true,
  secret: 'SECRETWORD',
  cookie: {
    maxAge: 60000000
  }
}));
app.use(express.static(__dirname));

app.post('/newList', function(req, res) {
  User.findByIdAndUpdate(req.session.userId, {
    $push: {
      lists: {
        title: req.body.listName
      }
    }
  }, {
    upsert: true,
    new: true
  }, function(err, obj) {
    if(err){
      console.log(err);
    } else {
      res.send(obj.lists[obj.lists.length - 1]['_id']);
    }
  })
});

app.get('/deleteList/:id', function(req, res) {
  if(!req.session.userId){
    res.send('No login');
  } else {
    User.findOneAndUpdate({
        "_id": req.session.userId
      }, {
        $pull: {
          lists: {
            "_id": req.params.id
          }
        }
      }, function(err, result) {
        res.send(result);
      }
    )
  }
});

app.get('/getUser', function(req, res) {
  if(!req.session.userId){
    res.send('No login');
  } else {
    User.find({
      "_id": req.session.userId
    }, function(err, result) {
      res.send(result);
    })
  }
});

app.get('/lists', function(req, res) {
  if(!req.session.userId){
    res.send('No login');
  } else {
    User.find({
      "_id": req.session.userId
    }, 'lists', function(err, result) {
      res.send(result);
    })
  }
});

app.get('/logout', function(req, res) {
  if(req.session.userName){
    req.session.destroy();
    res.redirect('/');
  } else {
    res.redirect('/');
  }
});

app.post('/registration', function(req, res) {
  if(req.session.userId){
    res.send("logged in")
  } else {
    if(!req.body.email){
      res.send('Validate email error');
      return;
    }

    var email = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/;
    var checked = req.body.email.match(email);

    if(checked === null || req.body.password.length <= 6){
      res.send("Validate email error");
      return;
    }

    var registration = function() {
      var post = new User({
        email: req.body.email,
        password: req.body.password
      });

      post.save(function(err, result) {
        if(err){
          return err;
        } else {
          req.session.userName = req.body.email;
          req.session.userId = result.id;
          res.redirect('/webapp');
        }
      });
    };

    User.findOne({
      email: req.body.email
    }, function(err, users) {
      if(err){
        throw err;
      }

      if(users === null){
        registration();
      } else {
        res.send('Duplicate users');
      }
    })
  }
});

app.post('/lists/:id/newTask', function(req, res) {
  if(!req.session.userId){
    res.send('No login');
  } else {
    User.findOne({
      '_id': req.session.userId
    }, 'lists', function(err, result) {
      var list = result.lists.filter(function(list) {
        return list['_id'].toString() === req.params.id;
      }).pop();

      list.tasks.push({
        title: req.body.taskName
      });

      var listId = 0;
      for(var i = 0; i < result.lists.length; i++) {
        if(result.lists[i]['_id'] === list['_id']){
          result.lists[i] = list;
          listId = i;
        }
      }

      result.save(function(err) {
        if(err){
          return err;
        }

        res.send(result.lists[listId].tasks);
      });
    })
  }
});

app.get('/lists/:id', function(req, res) {
  if(!req.session.userId){
    res.send('No login');
  } else {
    User.find({'_id': req.session.userId}, 'lists', function(err, result) {
        for(var i = 0; i < result[0]['lists'].length; i++) {
          if(result[0]['lists'][i]['_id'].toString() === req.params.id){
            for(var j in result[0]['lists'][i].tasks) {
              result[0].lists[i].tasks[j].date = moment(new Date(result[0].lists[i].tasks[j])).format('YYYY-MM-DD');
            }

            res.send(result[0]['lists'][i].tasks);
          }
        }
      }
    )
  }
});

app.get('/lists/:listId/changeTaskState/:taskId', function(req, res) {
  if(!req.session.userId){
    res.send('No login');
  } else {
    User.findOne({
      '_id': req.session.userId
    }, 'lists', function(err, result) {
      var list = result.lists.filter(function(list) {
        return list['_id'].toString() === req.params.listId;
      }).pop();

      var task = list.tasks.filter(function(task) {
        return task['_id'].toString() === req.params.taskId;
      }).pop();

      task.status = !task.status;

      for(var i = 0; i < list.tasks.length; i++) {
        if(list.tasks[i]['_id'] === task['_id']){
          list.tasks.splice(i, 1);
        }
      }

      list.tasks.push(task);

      for(var i = 0; i < result.lists.length; i++) {
        if(result.lists[i]['_id'] === list['_id']){
          result.lists[i] = list;
        }
      }

      result.save(function(err) {
        if(err){
          return err;
        }

        res.send(result);
      });
    })
  }
});

app.get('/lists/:listId/revertTaskState/:taskId', function(req, res) {
  if(!req.session.userId){
    res.send('No login');
  } else {
    User.findOne({'_id': req.session.userId}, 'lists', function(err, result) {
      var list = result.lists.filter(function(list) {
        return list['_id'].toString() === req.params.listId;
      }).pop();

      var task = list.tasks.filter(function(task) {
        return task['_id'].toString() === req.params.taskId;
      }).pop();

      task.status = !task.status;

      var position = 0;

      for(var i = 0; i < list.tasks.length; i++) {
        if(list.tasks[i].status === false){
          position++;
        }

        if(list.tasks[i]['_id'] === task['_id']){
          list.tasks.splice(i, 1);
        }
      }

      list.tasks.splice(position, 0, task);

      for(var i = 0; i < result.lists.length; i++) {
        if(result.lists[i]['_id'] === list['_id']){
          result.lists[i] = list;
        }
      }

      result.save(function(err) {
        if(err){
          return err;
        }

        res.send(result);
      });
    })
  }
});

app.get('/', function(req, res) {
  if(req.session.userName){
    res.redirect('/webapp');
  } else {
    res.redirect('/main')
  }
});

app.get('/main', function(req, res) {
  if(req.session.userId){
    res.sendFile('app/views/main.html', {root: __dirname});
  } else {
    res.sendFile('app/views/intro.html', {root: __dirname});
  }
});

app.get('/webapp', function(req, res) {
  res.sendFile('app/views/main.html', {root: __dirname});
});

app.get('/login', function(req, res) {
  if(req.session.userId){
    res.redirect('/webapp#/lists')
  } else {
    res.sendFile('app/views/auth.html', {root: __dirname});
  }
});

app.post('/login', function(req, res) {
  if(req.session.userId){
    res.send('logged in');
  } else {
    var login = function(user) {
      var password = req.body.password || "";

      if(user.coding(password)){
        req.session.userName = req.body.email;
        req.session.userId = user._id;
        res.redirect('/webapp');
      } else {
        res.send('Invalid password');
      }
    };

    User.findOne({email: req.body.email}, function(err, users) {
      if(err){
        throw err;
      }

      if(users === null){
        res.send("No user");
      } else {
        login(users);
      }
    })
  }
});

app.get('/lists/:listId/:taskId/updateDate/:date', function(req, res) {
  if(!req.session.userId){
    res.send('No login');
  } else {
    User.findOne({'_id': req.session.userId}, 'lists', function(err, result) {
      var list = result.lists.filter(function(list) {
        return list['_id'].toString() === req.params.listId;
      }).pop();

      var task = list.tasks.filter(function(task) {
        return task['_id'].toString() === req.params.taskId;
      }).pop();

      task.date = moment(new Date(req.params.date)).format('YYYY-MM-DD');

      for(var i = 0; i < list.tasks.length; i++) {
        if(list.tasks[i]['_id'] === task['_id']){
          list.tasks[i] = task;
        }
      }

      for(var i = 0; i < result.lists.length; i++) {
        if(result.lists[i]['_id'] === list['_id']){
          result.lists[i] = list;
        }
      }

      result.save(function(err) {
        if(err){
          return err;
        }

        res.send(result);
      });
    })
  }
});

app.listen(3000);