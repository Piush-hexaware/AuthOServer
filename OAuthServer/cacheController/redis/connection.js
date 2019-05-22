//import redis from 'redis';
var logger		=	require('./../../config/winston.js');
var redis 	= require("redis");

class Redis {
    constructor(){
        console.log('redis connection establishing...');
        this.client = redis.createClient(parseInt(process.env.REDIS_PORT));
		this.client.auth(process.env.REDIS_KEY.replace("\r",""));
		this.client.on('connect', function() {
            console.log('redis connection restablished');
			logger.consoleLog.info("\nredis Client was connected")
		})
		this.client.on("error", function (err) {
            logger.errorLog.info("error in redis")
			logger.errorLog.info(err);
		});
    }

    get(key) {
        return new Promise((resolve, reject)=>{
            this.client.get(key, function(err,resp){
                if(err){
                    logger.errorLog.info('Error in redis get');
                    logger.errorLog.info(err);
                    reject('User session not found for '+key);
                }else{	
                    resolve(resp);			
                }			
            })
        })
    }

    set(key, keyValue) {
        return new Promise((resolve, reject)=>{
            this.client.set(key, JSON.stringify(keyValue),function(err, reply){
                if(err){
                    logger.errorLog.info('Error in redis set');
                    logger.errorLog.info(err);
                    reject(JSON.stringify(err));
                }else{
                    resolve(keyValue);						
                }
            });
        });
    }

    remove(key){
        return new Promise((resolve, reject)=>{
           this.client.del(key, function(err, resp){
                if(err){
                    logger.errorLog.info('Error in redis delete');
                    logger.errorLog.info(err);
                    reject('User session not found for '+key);
                }else{
                    resolve(resp);
                }
            });
        })
    }
    close(){
        this.client.quit();
    }
}

module.exports = Redis;
//export default Redis;