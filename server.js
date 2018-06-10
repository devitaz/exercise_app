var express = require('express');
var bodyParser = require('body-parser');
var mysql = require('mysql');
var path = require('path');
var pool = mysql.createPool({
  connectionLimit : 10,
  host            : 'localhost',
  user            : 'devitaz',
  password        : '********',
  database        : 'cs490'
});

var app = express();
var handlebars = require('express-handlebars').create({defaultLayout:'main'});

app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');
app.set('port', 8081);
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'client')));

app.get('/', function(req, res){
	res.render('home');
});

app.get('/tasks', function(req, res){
	var context = {};
	if(!req.query.id){
		pool.query('SELECT *, DATE_FORMAT(date, "%m-%d-%y") AS date FROM exercises', 
		function(err, rows, fields){
			if(err){
				console.log(err);
				return;
			}
			context.results = JSON.stringify(rows);
			res.send(context);
		});
	}else{
		pool.query('SELECT *, DATE_FORMAT(date, "%m-%d-%y") AS date FROM exercises WHERE id = ' + req.query.id, 
		function(err, rows, fields){
			if(err){
				console.log(err);
				return;
			}
			context.results = JSON.stringify(rows);
			res.send(context);
		});
	}
});

app.put('/tasks', function(req, res){
	var name = req.query.name;
	var reps = req.query.reps;
	var weight = req.query.weight;
	var date = req.query.date;
	var units = req.query.units === 'kg' ? 0 : 1;
	var id = req.query.id;
	pool.query('UPDATE exercises SET name=?, reps=?, weight=?, date=?, units=? WHERE id=? ', 
	[name, reps, weight, date, units, id], 
	function(err, result){
		if(err){
			console.log(err);
			return;
		}
		res.render('home');
	});
});

app.post('/tasks', function(req, res){
	var name = req.body.name === '' ? null : req.body.name;
	var reps = req.body.reps;
	var weight = req.body.weight;
	var date = req.body.date;
	var units = req.body.units === 'kg' ? 0 : 1;
	var values = "'" + name + "'," + reps + ',' + weight + ",'" + date + "'," + units;
	pool.query('INSERT INTO exercises(name, reps, weight, date, units) VALUES (' + values + ');', 
	function(err, rows, fields){
		if(err){
			console.log(err);
			return;
		}
		var data = JSON.stringify(rows);
		res.send(data);
	});
});

app.post('/', function(req, res){
	res.render('home');
});

app.delete('/tasks', function(req, res){
	var context = {};
	pool.query('DELETE FROM exercises WHERE id = ' + req.query.id, function(err, rows, fields){
		if(err){
			next(err);
			return;
		}
		context.results = JSON.stringify(rows);
		res.send(context);
	});
});

app.get('/reset-table',function(req,res,next){
	var context = {};
	pool.query("DROP TABLE IF EXISTS exercises", function(err){
		var createString = "CREATE TABLE exercises(" +
		"id INT PRIMARY KEY AUTO_INCREMENT," +
		"name VARCHAR(255) NOT NULL," +
		"reps INT," +
		"weight INT," +
		"date DATE," +
		"units BOOLEAN)";
		pool.query(createString, function(err){
			context.results = "Table reset";
			res.render('home',context);
		})
	});
});

app.use(function(req,res){
	res.status(404);
	res.render('404');
});

app.use(function(err, req, res, next){
	console.error(err.stack);
	res.status(500);
	res.render('500');
});

app.listen(app.get('port'), function(){
	console.log('Express started on http://localhost:' + app.get('port') + '; press Ctrl-C to terminate.');
});