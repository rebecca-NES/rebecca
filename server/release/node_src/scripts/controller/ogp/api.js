"use strict";

const ogs = require('open-graph-scraper');
const rp = require('request-promise');
const SessionDataMannager = require("../session_data_manager");
const Validation = require('../validation');
const Const = require("../const");
const redis = require('redis');
let   log = require("../server_log").getInstance();
const Conf = require('../conf').getInstance();



/**
 * Open Graph Protocolの値をJSONで取得する関数。
 * 内部でRedisにキャッシュし、一定期間はWebサイトに問い合わせずに値を返却する。
 * requestには
 *  .body.accessToken＝accsessToken,
 *  .body.url=OGPを取得するURL
 *
 * @param request
 * @param response
 *
 * @return レスポンスは正しく実行されればブラウザーへJsonが返される。
 */
exports.getOGP = (request, response) => {
    log.connectionLog(7,"do func  ogp.api.js getOGP(...");
    let _accessToken;
    if(!Validation.accessTokenValidationCheck(request.body.accessToken, true)){
        response.json({
            result: false,
            reason: Const.API_STATUS.BAD_REQUEST
        });
        return;
    }
    if(!Validation.urlCheck(request.body.url, true)){
        response.json({
            result: false,
            reason: Const.API_STATUS.BAD_REQUEST
        });
        return;
    }
    //URL拡張子からOGP取得しないもをを弾く
    if(request.body.url.replace(/\?[^?\s]*$/,'')
                       .match(new RegExp(/\.(pdf|txt|xlsx|png|jpg|jpeg)$/,"i"))){
        //no ogp link
        response.json({
            result: true,
            reason: Const.API_STATUS.SUCCESS,
            data: {}
        });
        return;
    }
    _accessToken = request.body.accessToken;
    let _sessionDataMannager = SessionDataMannager.getInstance();
    let _sessionData = _sessionDataMannager.get(_accessToken);
    //ログイン済みユーザー
    if(_sessionData){
        try{
            const redisclient = redis.createClient({
                host: Conf.getConfData('REDIS_SERVER_HOST'),
                port: parseInt(Conf.getConfData('REDIS_PORT')),
                password : Conf.getConfData('REDIS_PW'),
                db       : 3,
                tls      : false,
                connect_timeout : Conf.getConfData('REDIS_CONNECT_TIMEOUT')
            });
            //単位は秒
            let cashtime = 60 * 60 * 24 * 7;
            const _cashtime = Conf.getConfData('OGP_CASH_TIME_LIFE');
            if(_cashtime != null &&
               /^\d+$/.test(_cashtime)){
                cashtime = parseInt(_cashtime);
            }
            // Redisにキャッシュが無いか問い合わせ
            new Promise((resolve, reject)=>{
                redisclient.get(
                    "OGP_" + encodeURIComponent(request.body.url),
                    (err, data)=>{
                        if(err){
                            reject(data);
                            log.connectionLog(1,"ogp.api.js getOGP - redis error:" + err);
                            return;
                        }
                        //値が見つからない場合はnullが戻される
                        resolve(data);
                        return;
                    });
            }).then((ogp_cash_str)=>{
                let ogp_cash = null;
                if(ogp_cash_str){
                    ogp_cash = JSON.parse(ogp_cash_str);
                    log.connectionLog(7,"ogp.api.js getOGP - redis found ogp_cash:" + ogp_cash_str);
                }
                if(ogp_cash &&
                   typeof ogp_cash == 'object'){
                    log.connectionLog(7,"ogp.api.js getOGP - in cash data:" + request.body.url
                                      + ", val:" + ogp_cash_str);
                    //キャッシュ期間なのでキャッシュを返す
                    response.json(ogp_cash.results);
                    redisclient.quit();
                    return;
                }else{
                    log.connectionLog(7,"ogp.api.js getOGP - not in cash data:" + request.body.url
                                      + ", val:" + ogp_cash_str);
                }
                //OGPを取ってくる
                let options = {
                    'url': request.body.url,
                    'strictSSL': false,
                    'timeout': 4000,
                    'followAllRedirects': true,
                    'maxRedirects': 20
                };
                const ogp_use_proxy = Conf.getConfData('OGP_USE_PROXY');
                if(ogp_use_proxy != null &&
                   typeof ogp_use_proxy == "string" &&
                   Validation.urlCheck(ogp_use_proxy,true)){
                    options["proxy"] = ogp_use_proxy;
                    log.connectionLog(6,"ogp.api.js getOGP - set OGP ACCSESS VIA PROXY :" + options["proxy"]);
                }
                log.connectionLog(7,"ogp.api.js getOGP - do rp");
                rp(options)
                    .then((body) => {
                        log.connectionLog(7,"ogp.api.js getOGP body.length:"+body.length);
                        //1000k以上のHTML
                        if(body.length > 1000000 || !body.match(/^\s*\</)){
                            log.connectionLog(7,"ogp.api.js getOGP - urldata over 1000k : " + body.length);
                            redisclient.set("OGP_" + encodeURIComponent(request.body.url), JSON.stringify({results:{}}),'EX', cashtime);
                            response.json({
                                result: true,
                                reason: Const.API_STATUS.SUCCESS,
                                data: {}
                            });
                            redisclient.quit();
                        }else{
                            log.connectionLog(7,"ogp.api.js getOGP - get ogp");
                            ogs(options,
                                function (error, results) {
                                    if(error || !results.success){
                                        response.json({
                                            result: false,
                                            reason: Const.API_STATUS.NOT_FOUND,
                                            data: {}
                                        });
                                        redisclient.quit();
                                    }else{
                                        delete results["success"];
                                        results = jsonStringValuesFilter(
                                            results,
                                            (val) => {
                                                return encodeURIComponent(val);
                                            });
                                        results["result"] = true;
                                        results["reason"] = Const.API_STATUS.SUCCESS;
                                        response.json(results);

                                        let redis_val = JSON.stringify({
                                            results : results
                                        });
                                        redisclient.set("OGP_" + results.requestUrl, redis_val,'EX', cashtime);
                                        log.connectionLog(7,"ogp.api.js getOGP - set cash redis redis_val:"+redis_val);
                                        redisclient.quit();
                                    }
                                });
                        }
                    })
                    .catch((e)=>{
                        log.connectionLog(3,"ogp.api.js getOGP get request error:"+e);
                        response.json({
                            result: false,
                            reason: Const.API_STATUS.INTERNAL_SERVER_ERROR
                        });
                        redisclient.quit();
                        return;
                    });
            }).catch((e)=>{
                //redisの問い合わせエラー
                log.connectionLog(1,"ogp.api.js getOGP - redis server error:"+e);
                response.json({
                    result: false,
                    reason: Const.API_STATUS.INTERNAL_SERVER_ERROR
                });
                redisclient.quit();
                return;
            });
        }catch(e){
            log.connectionLog(1,"ogp.api.js getOGP - redis err catch:"+e);
            response.json({
                result: false,
                reason: Const.API_STATUS.INTERNAL_SERVER_ERROR
            });
            return;
        }
    }else{
        //accessTokenがないとき
        log.connectionLog(1,"ogp.api.js getOGP - not found accessToken:" + request.body.accessToken);
        response.json({
            result: false,
            reason: Const.API_STATUS.UNAUTHORIZED
        });
        return;
    }
};

const jsonStringValuesFilter = (json, filterfunction) => {
    if (typeof filterfunction !== 'function') {
        return json;
    }
    for (let k in json) {
        if (typeof json[k] === 'object') {
            json[k] = jsonStringValuesFilter(json[k], filterfunction);
        } else if (typeof json[k] === 'string') {
            let value = json[k];
            json[k] = filterfunction(value);
        }
    }
    return json;
};
