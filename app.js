var express = require("express"),
	bodyParser = require("body-parser"),
	methodOverride = require("method-override"),
	mongoose = require("mongoose");

var app = express();

app.use(bodyParser.urlencoded({
	extended: true
}));

app.use(methodOverride("_method"));

mongoose.connect(process.env.MONGOLAB_URI || "mongodb://localhost/hangar_db");

// Schema
var Schema = mongoose.Schema;

var AircraftSchema = new Schema({
	id: Schema.Types.ObjectId,
	name: String,
	description: String,
	type: String,
	tail: String,
	owner: String,
	hangar: { type: Schema.ObjectId, ref: "Hangar" }
});

var HangarSchema = new Schema({
	id: Schema.Types.ObjectId,
	name: String,
	description: String,
	location: String,
	size: { type: Number, min: 0 },
	capacity: { type: Number, min: 0 },
	aircraft: [AircraftSchema]
});

var AircraftModel = mongoose.model('Aircraft', AircraftSchema);
var HangarModel = mongoose.model('Hangar', HangarSchema);

app.get('/', function (req, res) {
	res.redirect("/api");
});

app.get('/api', function(req, res) {
	HangarModel.find(function(err, hangars) {
		if (!err) {
			return res.send(hangars);
		} else{
			return res.send(err);
		}
	});
});

// CREATE - HANGAR
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

// CREATE - AIRCRAFT
app.post('/api/aircraft', function(req, res) {
	aircraft = new AircraftModel({
		name: req.body.name,
		description: req.body.description,
		type: req.body.type,
		tail: req.body.tail,
		owner: req.body.owner,
		hangar: req.body.hangar
	});

	aircraft.save(function(err) {
		if(!err) {
			console.log("Created aircraft "+aircraft._id);
			// Add aircraft to hangar
			HangarModel
				.findOne({_id: req.body.hangar})
				.exec(function (err, hangar) {
					if (err) {
						return console.log(err);
					}
					hangar.aircraft.push(aircraft);
					hangar.save();
					console.log("Added aircraft to hangar "+hangar._id);
				});
		} else {
			return console.log(err);
		}
	});

	return res.send(aircraft);
});


// READ - HANGAR
app.get('/api/hangar/:id', function (req, res) {
	HangarModel.findById(req.params.id, function (err, hangar) {
		if (!err) {
			return res.send(hangar);
		} else {
			return console.log(err);
		}
	});
	
});
app.get('/api/aircraft/:id', function (req, res) {
	AircraftModel.findById(req.params.id, function (err, aircraft) {
		if (!err) {
			return res.send(aircraft);
		} else {
			return console.log(err);
		}
	});
	
});
app.get('/api/aircraft', function (req, res) {
	AircraftModel.find(function (err, aircraft) {
		if (!err) {
			return res.send(aircraft);
		} else {
			return console.log(err);
		}
	});
	
});

// UPDATE
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
app.put('/api/aircraft/:id', function (req, res) {
	AircraftModel.findById(req.params.id, function (err, aircraft) {
		aircraft.name = req.body.name;
		aircraft.description = req.body.description;
		aircraft.location = req.body.type;
		aircraft.size = req.body.tail;
		aircraft.capacity = req.body.owner;

		if (aircraft.hangar != req.body.hangar) {
			console.log("Changing hangar for aircraft "+aircraft._id+" from "+aircraft.hangar)
			var old_hangar = aircraft.hangar;
			var new_hangar = req.body.hangar;

			// Remove aircraft from old hangar
			HangarModel
				.findOne({ _id: old_hangar })
				.exec(function (err, hangar) {
					if (err) {
						return console.log(err);
					}
					for (var i=0; i<hangar.aircraft.length; i++) {
						
						if (hangar.aircraft[i]._id.equals(aircraft._id)) {
							hangar.aircraft.splice(i, 1);
							hangar.save();
							console.log("Removed aircraft from "+old_hangar)
						}
					}
				});

			// Add aircraft to new hangar
			HangarModel
				.findOne({_id: new_hangar})
				.exec(function (err, hangar) {
					if (err) {
						return console.log(err);
					}
					hangar.aircraft.push(aircraft);
					hangar.save();
					console.log("Added aircraft to hangar "+hangar._id);
				});

			aircraft.hangar = new_hangar;
		}

		aircraft.save(function (err) {
			if (!err) {
				res.send(aircraft);
			} else {
				console.log(err);
			}
		});
	});
});
// DELETE -- Hangar
app.delete('/api/hangar/:id', function (req, res) {
	HangarModel.findById(req.params.id, function (err, hangar) {
		var hangarId = hangar._id;
		hangar.remove(function (err) {
			if(!err) {
				console.log("Removed hangar "+hangarId);
				res.send('');
			} else {
				console.log(err);
			}
		});
	});
});

// DELETE -- Aircraft
app.delete('/api/aircraft/:id', function (req, res) {
	AircraftModel.findById(req.params.id, function (err, aircraft) {
		var aircraftId = aircraft._id;
		// Remove aircraft from hangar
		HangarModel
			.findOne({ _id: aircraft.hangar })
			.exec(function (err, hangar) {
				if (err) {
					return console.log(err);
				}
				for (var i=0; i<hangar.aircraft.length; i++) {
					
					if (hangar.aircraft[i]._id.equals(aircraftId)) {
						hangar.aircraft.splice(i, 1);
						hangar.save();
						console.log("Removed aircraft from hangar "+hangar._id)
					}
				}
			});

		aircraft.remove(function (err) {
			if(!err) {
				console.log("Removed aircraft "+aircraftId);
				res.send('');
			} else {
				console.log(err);
			}
		});
	});
});

app.listen(process.env.PORT || 3000);