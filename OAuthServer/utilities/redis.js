var config 	= require('./../config/config.json');	
var redis 	= require("redis");
var logger		=	require('./../config/winston.js');

var redisOpts = {};
redisOpts.createUserSession = function(userSession, key){
	return new Promise(function(resolve, reject){
		logger.consoleLog.info("\inside redis createUserSession")
		logger.consoleLog.info(userSession);
		logger.consoleLog.info("\n redis port "+parseInt(process.env.REDIS_PORT)+' ');
		client 		= redis.createClient(parseInt(process.env.REDIS_PORT));
		client.auth(process.env.REDIS_KEY.replace("\r",""));
		client.on('connect', function() {
			logger.consoleLog.info("\nredis Client was connected")
		})
		client.on("error", function (err) {
			//console.log(err);
			reject({statusCode:401,errMsg:'redis connection error updateUserSession'});
		});						
		logger.consoleLog.info('userSession');
		logger.consoleLog.info(userSession);
		if(typeof(userSession)!="string"){
			userSession = JSON.stringify(userSession)
		}
		
		client.set(key, userSession ,function(err, reply){
			if(err){
				reject({statusCode:401,errMsg:'redis connection error updateUserSession'});
			}else{
				resolve(userSession);
			}
		});			
	});
}
redisOpts.updateTokensIntoRedis = function(newTokens, empId){
	return new Promise(function(resolve, reject){
		logger.consoleLog.info("\n redis port "+parseInt(process.env.REDIS_PORT)+' ');
		client 		= redis.createClient(parseInt(process.env.REDIS_PORT));
		client.auth(process.env.REDIS_KEY.replace("\r",""));
		let userSession = {}
		client.on('connect', function() {
			logger.consoleLog.info("\nredis Client was connected")
		})
		client.on("error", function (err) {
			//console.log(err);
			reject({statusCode:401,errMsg:'redis connection error updateUserSession'});
		});
		client.get(empId,function(err,resp){
			if(err){
				reject({statusCode:401,errMsg:'User session not found for this key'});
			}else{				
				//console.log('resp',resp);
				//console.log('newtokens',newTokens);
				if(resp == null){
					resp = "{empId:{}}";
				}
					resp = JSON.parse(resp);				
					keys = Object.keys(newTokens);
					keys.forEach(function(rsc){
						resp[rsc]=newTokens[rsc];
					});
					//console.log('new resp',resp);
					client.set(empId, JSON.stringify(resp),function(err, reply){
						if(err){
							reject({statusCode:401,errMsg:'redis connection error updateUserSession'});
						}else{
							client.quit();
							resolve(userSession);						
						}
					});
				
									
			}			
		})
	});
}
redisOpts.updateUserSession=function(key, userSession){
	return new Promise(function(resolve, reject){
		logger.consoleLog.info("\n redis port "+parseInt(process.env.REDIS_PORT)+' ');
		client 		= redis.createClient(parseInt(process.env.REDIS_PORT));
		client.auth(process.env.REDIS_KEY.replace("\r",""));
		client.on('connect', function() {
			logger.consoleLog.info("\nredis Client was connected")
		})
		client.on("error", function (err) {
			//console.log(err);
			reject({statusCode:401,errMsg:'redis connection error updateUserSession'});
		});
		client.get(key,function(err,resp){
			if(err){
				reject({statusCode:401,errMsg:'User session not found for this key'});
			}else{
				resp = JSON.parse(resp);
				resp = Object.assign(resp, userSession);
				client.set(key, JSON.stringify(resp),function(err, reply){
					if(err){
						reject({statusCode:401,errMsg:'redis connection error updateUserSession'});
					}else{
						client.quit();
						resolve(userSession);						
					}
				});					
			}			
		})				
	});
}

redisOpts.getUserSession=function(key){	
	return new Promise(function(resolve, reject){
		logger.consoleLog.info("\n redis port"+parseInt(process.env.REDIS_PORT)+' ');
		logger.consoleLog.info("\n redis key"+key);
		client 		= redis.createClient(parseInt(process.env.REDIS_PORT));	
		client.auth(process.env.REDIS_KEY.replace("\r",""));
		client.on('connect', function() {
			logger.consoleLog.info("\nredis Client was connected")
		})
		client.on("error", function (err) {
			reject({statusCode:401,errMsg:'redis connection error getUserSession'});
		});
		client.get(key,function(err,resp){
			if(err){
				reject({statusCode:401,errMsg:'User session not found for this key'});
			}else{
				logger.consoleLog.info('\nredis Response'+resp);
				resolve(JSON.parse(resp));
			}
			client.quit();
		})
	});
}

redisOpts.deleteUserSession = function(key){
	return new Promise(function(resolve, reject){
		logger.consoleLog.info("\n redis port"+parseInt(process.env.REDIS_PORT)+' ');
		logger.consoleLog.info("\n redis key"+key);
		client 		= redis.createClient(parseInt(process.env.REDIS_PORT));	
		client.auth(process.env.REDIS_KEY.replace("\r",""));
		client.on('connect', function() {
			logger.consoleLog.info("\nredis Client was connected")
		})
		client.on("error", function (err) {
			reject({statusCode:401,errMsg:'redis connection error getUserSession'});
		});
		client.del(key,function(err, resp){
			if(err){
				reject({statusCode:401,errMsg:'User session not found for this key'});
			}else{
				logger.consoleLog.info('\nredis Response'+resp);
				resolve({statusCode:200,Obj:JSON.parse(resp)});
			}
			client.quit();
		});
	})
}
module.exports = redisOpts;
