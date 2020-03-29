/*
Copyright 2020 NEC Solution Innovators, Ltd.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/
"use strict";

const ogs = require('open-graph-scraper');
const rp = require('request-promise');
const SessionDataMannager = require("../session_data_manager");
const Validation = require('../validation');
const Const = require("../const");
const redis = require('redis');
let   log = require("../server_log").getInstance();
const Conf = require('../conf').getInstance();



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
    if(request.body.url.replace(/\?[^?\s]*$/,'')
                       .match(new RegExp(/\.(pdf|txt|xlsx|png|jpg|jpeg)$/,"i"))){
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
            let cashtime = 60 * 60 * 24 * 7;
            const _cashtime = Conf.getConfData('OGP_CASH_TIME_LIFE');
            if(_cashtime != null &&
               /^\d+$/.test(_cashtime)){
                cashtime = parseInt(_cashtime);
            }
            new Promise((resolve, reject)=>{
                redisclient.get(
                    "OGP_" + encodeURIComponent(request.body.url),
                    (err, data)=>{
                        if(err){
                            reject(data);
                            log.connectionLog(1,"ogp.api.js getOGP - redis error:" + err);
                            return;
                        }
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
                    response.json(ogp_cash.results);
                    redisclient.quit();
                    return;
                }else{
                    log.connectionLog(7,"ogp.api.js getOGP - not in cash data:" + request.body.url
                                      + ", val:" + ogp_cash_str);
                }
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
