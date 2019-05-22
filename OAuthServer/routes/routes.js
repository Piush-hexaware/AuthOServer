var express 		= require('express');
var router			= express.Router();	 
var request			= require('request');

//var processRequest	= require("./../handlers/mainHandler_"+process.env.NODE_ENV.replace('\r','')+".js");
var TokenUtil 		=  require('./../utilities/tokenUtil.js');
		
var config			= require('./../config/config.json');	
var logger			= require('./../config/winston.js');


router.get('/redirectUri',function(req, res){
	
})
//oauth token endpoint : generates access token as well as refresh tokens 
router.post('/oauth/token',function(req, res){
	try{
		logger.consoleLog.info('body in /token');
		logger.consoleLog.info(req.body);
		let tokenFunc;
		// condition check for generate access token or refresh token
		if(req.body.code){
			logger.consoleLog.info('resource tokens generating');
			tokenFunc = "createUserSession"; // function for generate access token
		}else{
			logger.consoleLog.info('resource tokens refreshing');
			tokenFunc = "refreshAllTokens"; // function for refresh tokens
		}
		req.body.client_id = process.env.CLIENT_ID.replace('\r','');
		req.body.client_secret = process.env.CLIENT_SECRET.replace('\r','');
		router.tokenOpts[tokenFunc](req.body)
		.then(function(result){
			logger.consoleLog.info('token response to google');
			logger.consoleLog.info(result);
			res.status(result.code);
			res.send(result.resp).end();
		})
		.catch(function(err){
			//console.log('token response to google',err);
			res.status(err.code);
			res.send(err.resp).end();
		})
	}catch(err){
		//console.log(err);
	}
});

//oauth authorize endpoint 
router.get('/oauth/authorize',function(req, res){
	//console.log('auth point');
	//contructing microsoft /authorize end point
	let url = `${config.authorizeEndpoint}?client_id=${process.env.CLIENT_ID.replace('\r','')}&response_type=code&redirect_uri=${encodeURIComponent(req.query.redirect_uri)}&prompt=consent&scope=${req.query.scope}&state=${req.query.state}&connection=${config.connection}&audience=${config.masterScope}`;
	console.log(url);
	logger.consoleLog.info(req.query.client_id+' '+process.env.CLIENT_ID+' '+req.query.client_id == process.env.CLIENT_ID);			
		res.redirect(307,url);	
});











module.exports = {
	routes:router,
	setRedisClient:function(rClient){
		console.log('redis client setted');
			router.tokenOpts=new TokenUtil(rClient);
			console.log(router.tokenOpts);
	}
}




			
