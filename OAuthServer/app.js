const express 		= require('express');
let app 			= express();
const request 		= require('request');
const bodyParser 	= require('body-parser');
console.log('./config/config');
const config	 	= require('./config/config.json')
var Routes			= require('./routes/routes.js');

var CacheClient 	= require("./cacheController/"+config.userSesControl+"/connection.js");

const port = process.env.PORT || 4000;

app.use(function (err, req, res, next) {
	console.error(err.stack)
	res.status(401).json({error:"Authorization error",error_description:"It seems you are not aurthorized resource",});
  })

app.use(bodyParser.urlencoded({
    extended: false
}));

app.use(bodyParser.json());
Routes.setRedisClient(new CacheClient()); 
//routes.setCacheClient(new CacheClient())
app.use(Routes.routes);

let server = app.listen(port, function () {	
		console.log("\nApplication started listening port test " + port);
});

process.on('unhandledRejection', function(err, promise) {
	console.log('Unhandled rejection (promise: ', promise, ', reason: ', err, ').');
});



process.on('unCaughtException', function(err){
	console.log(err);
	cacheClient.close();
	process.exit(1);
});




