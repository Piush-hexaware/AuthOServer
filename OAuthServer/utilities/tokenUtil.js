var config	 		= require('./../config/config.json');	
var request			= require('request');	
var logger 			=	require('./../config/winston.js');
var Q				=	require('q');
var UserSesControl 	= require('./../handlers/userSessionHandler.js');
var jwtDecode 		= require('jwt-decode');

var tokenOperations = function(client){
	this.userSesControl = new UserSesControl(client);
	return this;
}
tokenOperations.prototype.testing = function(params){
	return new Promise((resolve, reject)=>{
		try{
			console.log(params);
			this.testing2();
			
		}catch(err){
			console.log(err);
			logger.errorLog.info(err);
			//reject({code:401,resp:err});
		}
		
	});
}


tokenOperations.prototype.testing2 = function(b){
	return new Promise((resolve, reject)=>{
		console.log("testing2");
	});
}
// function for generate all resource specific token
tokenOperations.prototype.generateTokens = function(refreshToken){
	try{
		return new Promise((resolve, reject)=>{	
			console.log('inside generate tokens');
			logger.consoleLog.info('inside generateTokens');		
			let microServices = Object.keys(config.resourceScope[process.env.botName]);
			console.log('microservices',microServices)
			let tokensGenerateFuncCalls=[];
			//console.log(config.resourceScope);
			// constructing function calls for generate resource specific tokens 
			microServices.forEach((service)=>{				
				tokensGenerateFuncCalls.push(this.refreshToken(refreshToken, service));
			});
			// calling all tokens gererate function calls asynchronously
			Q.allSettled(tokensGenerateFuncCalls)
			.then( (results) => {
				let c = 0;
				let tokensJson = [];
				results.forEach( (result)=> {
					if (result.state === "fulfilled") {						
						c++;
						logger.consoleLog.info(result.value);
						tokensJson.push(result.value)
					} 
				});
				// once all tokens generated returning tokens to destination
				console.log("Micro services length = "+microServices.length, "c = "+c);
				if(microServices.length == c){
					//console.log('all tokens generated');
					resolve(tokensJson);
				}else{
					reject({statusCode:401,errMsg:'Some tokens missed'});
				}	
			})
			.catch((err)=>{
				logger.errorLog.info(err);
				reject({statusCode:401,errMsg:JSON.stringify(err)});
			})
		});
	}catch(err){
		logger.errorLog.info(err);
		reject({statusCode:401,errMsg:JSON.stringify(err)});
	}
}
//function to get user session from redis
tokenOperations.prototype.getUserSession = function(empId){
	return new Promise((resolve, reject)=>{
		logger.consoleLog.info('inside checkResourceTokensExist');
		this.userSesControl.getUserSession(empId)
		.then((resp)=>{
			resolve(resp)
		})
		.catch((err)=>{
			logger.errorLog.info(err);
			resolve(false)
		})
	});
}
	/*function for create user session in redis
		This function generate access_token, refresh_token for google and also generates resource specific tokens
		once tokens are generated, calling getEmployeeDetails ps api.
		Once employee details got, creates userInfo object and call redis createSession function 
		to store user info in redis
		*/
	
	tokenOperations.prototype.createUserSession = function(params){
		return new Promise((resolve, reject)=>{
			try{
				console.log(params);
				this.testing();
				// calling microsofts token endpoint for generate tokens for google
				logger.consoleLog.info('inside create user session');	
				let tokenUrlParams =  {
					client_id:params.client_id,
					grant_type:params.grant_type,
					redirect_uri:params.redirect_uri,
					code:params.code,
					client_secret:encodeURIComponent(params.client_secret),
					audience:encodeURIComponent(config.masterScope)					
				};		
				//let tokenUrlParams =  `client_id=${params.client_id}&grant_type=${params.grant_type}&redirect_uri=${params.redirect_uri}&code=${params.code}&client_secret=${encodeURIComponent(params.client_secret)}&audience=${encodeURIComponent(config.masterScope)}`;
				console.log(config.tokenEndpoint,tokenUrlParams);
				request.post(config.tokenEndpoint,{body:tokenUrlParams, json:true},(error,response,body)=>{
						if(error){
							reject(error)
						}else{
							logger.consoleLog.info('typeof'+typeof(body));	
						
							if(typeof(body)=='string'){
								tokensBody = JSON.parse(body);															
							}else{
								tokensBody = JSON.parse(JSON.stringify(body))
							}
							console.log('parent token status code '+response.statusCode);							
							if(response.statusCode == 200){
								console.log(tokensBody);
								let decodeJson = jwtDecode(tokensBody.access_token);
								console.log(decodeJson);
								let userInfo = {};
								let empId = (decodeJson[config.emailClaim].indexOf('@')>0)?decodeJson[config.emailClaim].split('@')[0]:decodeJson[config.emailClaim];
								// constrcuting user info object
								userInfo.displayName = decodeJson.name;
								userInfo.empid = empId;
								userInfo.mail = decodeJson.upn;
								userInfo.user_name = decodeJson.upn;
								userInfo.displayName = decodeJson.name
								logger.consoleLog.info(decodeJson);
								userInfo.tokens = {};
								logger.consoleLog.info('Employee id '+empId)
								// function call for generate resource specific tokens														
								this.generateTokens(tokensBody.refresh_token)																				
								.then((result)=>{						
									let len = result.length;	
									let scopes = Object.keys(config.resourceScope[process.env.botName]);
									for(i=0;i<len;i++)	{
										console.log('token',result[i]);
										scopes.forEach((scp)=>{
											if(result[i][scp]!=undefined){
												userInfo.tokens[scp]= result[i][scp];
											}
										})
										//userInfo.tokens = Object.assign(userInfo.tokens,result[i]);	
										console.log('userInfo',userInfo);
									}		
								/*	result.forEach((token)=>{
										userInfo.tokens = Object.assign(userInfo.tokens,token);	
									});*/
									console.log('userInfo',userInfo);
									return this.userSesControl.createUsrSession(empId, userInfo)								
								})
								.then((result)=>{								
									if(params["teamsKey"]){
										return this.userSesControl.createUsrSession(params["teamsKey"], empId)
									}else{
										return true;
									}
								})
								.then((resp)=>{
									// sending google's token generate respose to back.
									logger.consoleLog.info('final response');
									logger.consoleLog.info(resp);
									resolve({code:response.statusCode,resp:body});
								})
								.catch((err)=>{
									//console.log('error : ',err)
									reject({code:401,resp:body});
								})
							}else{
								console.log('status code not 200 because',body);
								reject({code:response.statusCode,resp:body});
							}														
						}
				});
			}catch(err){
				console.log(err);
				logger.errorLog.info(err);
				reject({code:401,resp:err});
			}
			
		});
	}
	/*
		function call for refresh all tokens 
		this function refresh all expired tokens and update tokens and user infomation in redis.
	*/
	tokenOperations.prototype.refreshAllTokens = function(params){
		return new Promise((resolve, reject)=>{
			//console.log(params);
			let tokenUrlParams =  {
				client_id:params.client_id,
				grant_type:params.grant_type,					
				"refresh_token":params.refresh_token,
				client_secret:encodeURIComponent(params.client_secret),
				audience:encodeURIComponent(config.masterScope)
			};
			//let tokenUrlParams =  `client_id=${params.client_id}&grant_type=${params.grant_type}&refresh_token=${params.refresh_token}&client_secret=${encodeURIComponent(params.client_secret)}`;
			// hitting microsofts token endpoint to refresh google's token
			request.post(config.tokenEndpoint, {body:tokenUrlParams,json:true}, (error,response,body)=>{
				if(error){
					logger.errorLog.info(error);
					reject(error)
				}else{
					logger.consoleLog.info('typeof'+typeof(body));		
					if(typeof(body)=='string'){
						tokensBody = JSON.parse(body);															
					}else{
						tokensBody = JSON.parse(JSON.stringify(body))
					}	
					//console.log('status code '+response.statusCode,body);							
					if(response.statusCode == 200){
						let decodeJson = jwtDecode(tokensBody.access_token);
						console.log('decode',decodeJson);
						console.log('refresh token body',tokensBody);
						if(tokensBody.refresh_token == undefined){
							tokensBody.refresh_token = params.refresh_token;
							body.refresh_token = params.refresh_token;
						}
						let empId = (decodeJson[config.emailClaim].indexOf('@')>0)?decodeJson[config.emailClaim].split('@')[0]:decodeJson[config.emailClaim];
						logger.consoleLog.info(decodeJson);
						logger.consoleLog.info('Employee id '+empId)
						userInfo = {};
						// function call to get user infomation from redis
						this.getUserSession(empId)
						.then((result)=>{
							//console.log(result)								
							if(result != false&&result!=null){
								userInfo = result;									
							}
							console.log('user info before generate tokens', userInfo);
							// function call to refresh resource specific tokens 
							return this.generateTokens(tokensBody.refresh_token)																																														
						})				
						.then((result)=>{
							console.log('generate tokens results',result);
							userInfo.tokens = {};	
							let len = result.length;	
							let scopes = Object.keys(config.resourceScope[process.env.botName]);
							for(i=0;i<len;i++)	{
								console.log('token',result[i]);
								scopes.forEach((scp)=>{
									if(result[i][scp]!=undefined){
										userInfo.tokens[scp]= result[i][scp];
									}
								})
								//userInfo.tokens = Object.assign(userInfo.tokens,result[i]);	
								console.log('userInfo',userInfo);
							}
							console.log('userInfo in refresh tokens',userInfo);	
							return true;						
						})							
						.then((result)=>{				
							// calling function to overwrite user session in redis
							logger.consoleLog.info('user session needs to create');																
							return this.userSesControl.createUsrSession(empId, userInfo);																															
						})														
						.then((resp)=>{
							// sending google's refreshed access token to google
							logger.consoleLog.info('final response');
							logger.consoleLog.info(resp)
							resolve({code:response.statusCode,"resp":body});
						})
						.catch((err)=>{
							logger.errorLog.info(err);
							//console.log(err)
							reject({code:401,resp:body});
						})							
					}else{
						reject({code:response.statusCode,resp:body});
					}														
				}
			});
		});
	}
	// function for refresh token
	tokenOperations.prototype.refreshToken = function(refresh_token,scope){
		logger.consoleLog.info('\nrefreshToken');
		return new Promise((resolve, reject)=>{
			console.log('scope',scope,config.resourceScope[process.env.botName][scope]);
			let tokenUrlParams =  {
				client_id:process.env.CLIENT_ID.replace('\r',''),
				grant_type:"refresh_token",					
				"refresh_token":refresh_token,
				client_secret:encodeURIComponent(process.env.CLIENT_SECRET.replace('\r','')),
				audience:encodeURIComponent(config.masterScope),
				scope:encodeURIComponent(config.resourceScope[process.env.botName][scope])				
			};
			//let tokenUrlParams =  `client_id=${process.env.CLIENT_ID.replace('\r','')}&grant_type=refresh_token&refresh_token=${refresh_token}&client_secret=${encodeURIComponent(process.env.CLIENT_SECRET.replace('\r',''))}&audience=${encodeURIComponent(config.resourceScope[scope])}`;
			console.log(tokenUrlParams);
			//console.log(config.tokenEndpoint)
			request.post(config.tokenEndpoint,{body:tokenUrlParams,json:true},(error,response,body)=>{
				console.log(body);
				logger.consoleLog.info('\nrefresh token '+JSON.stringify(error)+' '+JSON.stringify(body));
				if(error){
					logger.consoleLog.info('\nerror at refresh token '+JSON.stringify(error));
					reject(error);
				}else{
					logger.consoleLog.info('\nstatus code at refreshToken '+response.statusCode);
					if(response.statusCode==200){
						if(typeof(body)=='string'){
							body = JSON.parse(body)		
						}		
                        let tokenResp = {};
                        tokenResp[scope]=body.access_token;
						resolve(tokenResp);																	
					}else{						
						reject(false);
					}					
				}
			})
		})
	}
	


module.exports = tokenOperations
