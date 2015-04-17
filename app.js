var express = require("express"),
	bodyParser = require("body-parser"),
	methodOverride = require("method-override"),
	mongoose = require("mongoose");
//	autoIncrement = require("mongoose-auto-increment");

var app = express();

app.use(bodyParser.urlencoded({
	extended: true
}));

app.use(methodOverride("_method"));

mongoose.connect(process.env.MONGOLAB_URI || "mongodb://localhost/hangar_db");
//var connection = mongoose.createConnection('mongodb://localhost/hangar_db');
//autoIncrement.initialize(connection);

// Schema
var Schema = mongoose.Schema;

var AircraftSchema = new Schema({
	id: Schema.Types.ObjectId,
	name: String,
	description: String,
	type: String,
	tail: Number,
	owner: String
});

var	HangarSchema = new Schema({
	//id: {type: Schema.Types.ObjectId, ref: 'ID'},
	id: Schema.Types.ObjectId,
	name: String,
	description: String,
	location: String,
	size: { type: Number, min: 0 },
	capacity: { type: Number, min: 0 },
	aircraft: [AircraftSchema]
});

//HangarSchema.plugin(autoIncrement.plugin, 'ID');

var AircraftModel = mongoose.model('Aircraft', AircraftSchema);
var HangarModel = mongoose.model('Hangar', HangarSchema);


app.get('/api', function(req, res) {
	HangarModel.find(function(err, hangars) {
		if (!err) {
			return res.send(hangars);
		} else{
			return res.send(err);
		}
	});
});

app.post('/api/hangar', function(req, res) {
	hangar = new HangarModel({
		name: req.body.name,
		description: req.body.description,
		location: req.body.location,
		size: req.body.size,
		capacity: req.body.capacity
	});

	hangar.save(function(err) {
		if(!err) {
			
		} else {
			console.log(err);
		}
	});

	return res.send(hangar);
});

app.get('/api/hangar/:id', function (req, res) {
	HangarModel.findById(req.params.id, function (err, hangar) {
		if (!err) {
			return res.send(hangar);
		} else {
			return console.log(err);
		}
	});
});

app.put('/api/hangar/:id', function (req, res) {
	HangarModel.findById(req.params.id, function (err, hangar) {
		hangar.name = req.body.name;
		hangar.description = req.body.description;
		hangar.location = req.body.location;
		hangar.size = req.body.size;
		hangar.capacity = req.body.capacity;

		hangar.save(function (err) {
			if (!err) {
				res.send(hangar);
			} else {
				console.log(err);
			}
		});
	});
});

app.delete('/api/hangar/:id', function (req, res) {
	HangarModel.findById(req.params.id, function (err, hangar) {
		hangar.remove(function (err) {
			if(!err) {
				res.send('');
			} else {
				console.log(err);
			}
		});
	});
});

app.listen(process.env.PORT || 3000);