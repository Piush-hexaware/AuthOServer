var config 	= require('./../config/config.json');	
var logger		=	require('./../config/winston.js');

var userSessionController = function(client){
    this.cacheClient = client;
};



userSessionController.prototype.createUsrSession = function(key, userSession){
	return new Promise((resolve, reject)=>{
		logger.consoleLog.info("\inside redis createUserSession")
		logger.consoleLog.info(userSession);
		logger.consoleLog.info("\n redis port "+parseInt(process.env.REDIS_PORT)+' ');			
		logger.consoleLog.info('userSession');
		logger.consoleLog.info(userSession);
		if(typeof(userSession)!="string"){
			userSession = JSON.stringify(userSession)
		}
        this.cacheClient.set(key, userSession)
        .then(function(redisResp){
            resolve(redisResp);
        })
        .catch(function(err){
            reject({statusCode:404,errMsg:err});
        })	
	});
}
userSessionController.prototype.updateTokensIntoRedis = function(newTokens, empId){
	return new Promise((resolve, reject)=>{
        this.cacheClient.get(key)
        .then((redisResp)=>{
            //console.log('redisResp',redisResp);
            //console.log('newtokens',newTokens);
            if(redisResp == null){
                redisResp = "{empId:{}}";
            }
            redisResp = JSON.parse(redisResp);				
            keys = Object.keys(newTokens);
            keys.forEach(function(rsc){
                redisResp[rsc]=newTokens[rsc];
            });
            //console.log('new resp',redisResp);
            return this.cacheClient.set(empId, JSON.stringify(redisResp));
        })
        .then(function(userSession){
            resolve(userSession);
        })
        .catch(function(err){
            reject({statusCode:404,errMsg:err});
        });
	});
}

userSessionController.prototype.updateUserSession=function(key, userSession){
	return new Promise((resolve, reject)=>{
        this.cacheClient.get(key)
        .then((redisResp)=>{
            redisResp = JSON.parse(redisResp);
            redisResp = Object.assign(redisResp, userSession);
            return this.cacheClient.set(key, JSON.stringify(redisResp));
        })
        .then(function(userSession){
            resolve(userSession);
        })
        .catch(function(err){
            reject({statusCode:404,errMsg:err});
        })			
	});
}

userSessionController.prototype.getUserSession=function(key){	
	return new Promise((resolve, reject)=>{
        this.cacheClient.get(key)
        .then((redisResp)=>{
            resolve(JSON.parse(redisResp));
        })
        .catch(function(err){
            reject({statusCode:404,errMsg:err});
        })
	});
}

userSessionController.prototype.deleteUserSession = function(key){
	return new Promise((resolve, reject)=>{
        this.cacheClient.remove(key)
        .then(function(redisResp){
            resolve(JSON.parse(redisResp));
        })
        .catch(function(err){
            reject({statusCode:404,errMsg:err});
        })
	})
}
module.exports = userSessionController;
