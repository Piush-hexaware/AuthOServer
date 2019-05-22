var winston = require('winston');
  require('winston-daily-rotate-file');

var transport = new (winston.transports.DailyRotateFile)({
	filename: './logs/oAuth-%DATE%.log',
	datePattern: 'YYYY-MM-DD',
	zippedArchive: true,
	maxSize: '5m',
	maxFiles: '14d'
});
var errorLogs = new (winston.transports.DailyRotateFile)({
	filename: './logs/oAuth-errorLogs-%DATE%.log',
	datePattern: 'YYYY-MM-DD',
	zippedArchive: true,
	maxSize: '5m',
	maxFiles: '14d'
});


errorLogs.on('rotate', function(oldFilename, newFilename) {
	
});

transport.on('rotate', function(oldFilename, newFilename) {
	
});

module.exports = {
	errorLog:winston.createLogger({
		format: winston.format.combine(
				winston.format.timestamp(),
				winston.format.json(),
				winston.format.prettyPrint(),
			),
		transports: [
		  errorLogs
		]
	}),
	consoleLog:winston.createLogger({
					format: winston.format.combine(
							winston.format.timestamp(),
							winston.format.json(),
							winston.format.prettyPrint(),
						),
					transports: [
					  transport
					]
				})
}