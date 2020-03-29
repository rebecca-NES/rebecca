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

'use strict';

const _ = require('underscore');
const Log = require('./server_log').getInstance();
const API_STATUS = require('./const').API_STATUS;

const ERROR_PASSWORD_COMPLEXITY_CHECK = 32;
exports.userValidationCheck = (_user, require=false) => {
    const _userLength = 60;
    if(_user === null && !require){
        return true;
    }
    if(typeof _user != 'string' ||
        _user.length > _userLength ||
        !_user.match(/^[A-Za-z0-9_.*!#$%&*+-]+$/)) {
        return false;
    }
    return true;
};

exports.nickNameValidationCheck = (_nickName, require=false) => {
    const _nickNameLength = 20;
    if(_nickName === null && !require){
        return true;
    }
    if(typeof _nickName != 'string' ||
        !checkDecodeURI(_nickName) ||
        decodeURIComponent(_nickName).length > _nickNameLength ||
        !isAscii(_nickName)) {
        return false;
    }
    return true;
};

exports.passwordValidationCheck = (_password, require=false) => {
    const _passwordLength_min = 8;
    const _passwordLength_max = 32;
    if(_password === null && !require){
        return true;
    }
    if(typeof _password != 'string' ||
        _password.length < _passwordLength_min ||
        _password.length > _passwordLength_max ||
        !isAscii(_password)) {
        return false;
    }
    return true;
};

exports.groupValidationCheck = (_group, require=false) => {
    if(_group === null && !require){
        return true;
    }
    const _group_keys = 5;
    const _group_length = 100;
    if (!_.isArray(_group)){
        return false;
    }
    if (_group.length > _group_keys){
        return false;
    }
    for(const i of _group) {
        if (!checkDecodeURI(i) ||
            decodeURIComponent(i).length > _group_length ||
            !isAscii(i)){
            return false;
        }
    }
    return true;
};

exports.mailAddressValidationCheck = (_mailAddress, require=false) => {
    if(_mailAddress === null && !require){
        return true;
    }
    const _mailAddressLength = 256;
    if (typeof _mailAddress != 'string' ||
        !checkDecodeURI(_mailAddress) ||
        decodeURIComponent(_mailAddress).length > _mailAddressLength ||
        !isMailAddress(decodeURIComponent(_mailAddress))){
        return false;
    }
    return true;
};

exports.statusValidationCheck = (_status, require=false) => {
    if(_status === null && !require){
        return true;
    }
    if(!Number.isInteger(_status) ||
        !(_status == 0 || _status == 2)) {
        return false;
    }
    return true;
};

exports.exceptValidationCheck = (_except, require=false) => {
    const _exceptLength = 64;
    if(_except === null && !require){
        return true;
    }
    if (!_.isArray(_except)){
        return false;
    }
    for(const i of _except) {
        if (!isAscii(i) ||
            i.length > _exceptLength){
            return false;
        }
    }

    return true;
};

exports.startValidationCheck = (_start, require=false) => {
    if(_start === null && !require){
        return true;
    }
    if (!Number.isInteger(_start) ||
        _start <= 0) {
        return false;
    }
    return true;
};

exports.countValidationCheck = (_count, require=false) => {
    if(_count === null && !require){
        return true;
    }
    if (!Number.isInteger(_count) ||
        _count <= 0) {
        return false;
    }
    return true;
};


exports.privacyTypeValidationCheck = (privacytype, require=false) => {
    if((privacytype === undefined || privacytype === null) && !require){
        return true;
    }
    if (typeof privacytype != 'number' ||
        privacytype < 0 ||
        privacytype > 2 ){
        return false;
    }
    return true;
};

exports.listTypeValidationCheck = (privacytype, require=false) => {
    if((privacytype === undefined || privacytype === null) && !require){
        return true;
    }
    if (typeof privacytype != 'number' ||
        privacytype < 0 ||
        privacytype > 2 ){
        return false;
    }
    return true;
};


exports.threadTitleValidationCheck = (threadTitle, require=false) => {
    Log.connectionLog(7, 'do func Validation.threadTitleValidationCheck(...');
    if((threadTitle === undefined || threadTitle === null) && !require){
        return true;
    }
    if (typeof threadTitle != 'string' ||
        ! threadTitle.match(/^[\w-+%!~\*\.\(\)'_]*$/) ||
        decodeURIComponent(threadTitle).length > 250){
        return false;
    }
    return true;
};

exports.itemIdValidationCheck = (itemId, require=false) => {
    Log.connectionLog(7, 'do func Validation.itemIdValidationCheck(...');
    if((itemId === undefined || itemId === null) && !require){
        return true;
    }
    if (typeof itemId != 'string' ||
        ! itemId.match(/^[\w-+%&$#!~\*\.'_]+$/) ||
        itemId.length > 139){
        return false;
    }
    return true;
};

exports.roomIdValidationCheck = (roomId, require=false) => {
    Log.connectionLog(7, 'do func Validation.roomIdValidationCheck(...');
    if((roomId === undefined || roomId === null) && !require){
        return true;
    }
    if (typeof roomId != 'string' ||
        ! roomId.match(/^[\w-+%&$#!~\*\.'_]+$/) ||
        roomId.length > 139){
        return false;
    }
    return true;
};

exports.tenantIdValidationCheck = (tenantId, require=false) => {
    Log.connectionLog(7, 'do func Validation.tenantIdValidationCheck(...');
    if((tenantId === undefined || tenantId === null) && !require){
        return true;
    }
    if (typeof tenantId != 'string' ||
        ! tenantId.match(/^[a-z0-9\-]+$/) ||
        tenantId.length > 256){
        return false;
    }
    return true;
};

exports.msgToValidationCheck = (msgTo, require=false) => {
    Log.connectionLog(7, 'do func Validation.msgToValidationCheck(...');
    if((msgTo === undefined || msgTo === null) && !require){
        return true;
    }
    if (!this.roomIdValidationCheck(msgTo, true) &&
        !this.jidValidationCheck(msgTo, true) &&
        !this.tenantIdValidationCheck(msgTo, true)){
        return false;
    }
    return true;
};

exports.messageTypeValidationCheck = (type, require=false) => {
    Log.connectionLog(7, 'do func Validation.messageTypeValidationCheck(...');
    if((type === undefined || type === null) && !require){
        return true;
    }
    if (typeof type != 'string' ||
        ! type.match(/^(Public|Chat|GroupChat|Community|Task|Murmur)$/)){
        return false;
    }
    return true;
};

exports.jidValidationCheck = (jid, require=false) => {
    Log.connectionLog(7, 'do func Validation.jidValidationCheck(...');
    if((jid === undefined || jid === null) && !require){
        return true;
    }
    if (typeof jid != 'string' ||
        ! jid.match(/^[\w-+@\/:%&$#!~\*\.\(\)'\s]+$/)){
        return false;
    }
    return true;
};

exports.dateValidationCheck = (date, require=false) => {
    Log.connectionLog(7, 'do func Validation.dateValidationCheck(...');
    if((date === undefined || date === null) && !require){
        return true;
    }
    if (typeof date != 'string' ||
        ! date.match(/^(\d{4})\/([0-1]\d)\/([0-3]\d)$/)||
        new Date(RegExp.$1 + '-' + RegExp.$2 + '-' + RegExp.$3).getDate() != RegExp.$3){
        return false;
    }
    return true;
};

exports.emotionPointValidationCheck = (emotionPoint, require=false) => {
    if((emotionPoint === undefined || emotionPoint === null) && !require){
        return true;
    }
    if(typeof emotionPoint == 'string' &&
       emotionPoint.match(/^[0-5]$/) ){
        return true;
    }
    if (typeof emotionPoint == 'number' &&
        emotionPoint >= 0 &&
        emotionPoint <= 5 ){
        return true;
    }
    return false;
};

exports.noteTitleValidationCheck = (title, require=false) => {
    Log.connectionLog(7, 'do func Validation.noteTitleValidationCheck(...');
    if((title === undefined || title === null) && !require){
        return true;
    }
    if (typeof title != 'string' ||
        ! title.match(/^[\w-+%!~\*\.\(\)'_]*$/) ||
        decodeURIComponent(title).length > 100){
        return false;
    }
    return true;
};

exports.accessTokenValidationCheck = (token, require=false) => {
    Log.connectionLog(7, 'do func Validation.accessTokenValidationCheck(...');
    if((token === undefined || token === null) && !require){
        return true;
    }
    if (typeof token != 'string' ||
        ! token.match(/^[\w-_]+$/) ||
        token.length != 16){
        return false;
    }
    return true;
};

exports.noteIdValidationCheck = (noteId, require=false) => {
    Log.connectionLog(7, 'do func Validation.noteIdValidationCheck(...');
    if((noteId === undefined || noteId === null) && !require){
        return true;
    }
    if (typeof noteId != 'string' ||
        ! noteId.match(/^[\w-_]+$/) ||
        noteId.length < 16 ||
        noteId.length > 128){
        return false;
    }
    return true;
};

exports.jsonValueRegExpValidation = (json, regexp) => {
    Log.connectionLog(7, 'do func Validation.jsonValueRegExpValidation(...');
    for (let k in json) {
        if (typeof json[k] === 'object') {
            json[k] = this.jsonValueRegExpValidation(json[k], regexp);
        } else if (typeof json[k] === 'string') {
            if(!json[k].match(regexp)){
                Log.connectionLog(7, ' Validation.jsonValueRegExpValidation false string:' +  json[k]);
                return false;
            }
        }
    }
    return true;
};


exports.urlCheck = (url, require=false) => {
    Log.connectionLog(7, 'do func Validation.urlCheck(...');
    if((url === undefined || url === null) && !require){
        return true;
    }
    if(url == null ||
       !/^https?:\/\/[\w-]+\.[\w-\.\:\/\?%&=]+$/.test(url)){
        return false;
    }
    return true;
};

exports.bodyTypeCheck = (val, require=false) => {
    Log.connectionLog(7, 'do func Validation.bodyTypeCheck(...');
    if((val === undefined || val === null) && !require){
        return true;
    }
    if(val == null ||
       typeof val != 'number' ||
       (val != 0 && val != 1) ){
        return false;
    }
    return true;
};

exports.affiliationCheck = (val, require=false) => {
    Log.connectionLog(7, 'do func Validation.affiliationCheck(...');
    if((val === undefined || val === null) && !require){
        return true;
    }
    if(val == null ||
       !Array.isArray(val)||
       val.length > 5){
        return false;
    }
    for(let i=0;i<val.length;i++){
        if(!val[i].match(/^(%[0-9a-fA-F]{2})+$/) ||
           decodeURIComponent(val[i]).length > 100){
            return false;
        }
    }
    return true;
};

exports.murmurColumnNameValidationCheck = (_roomName, require=false) => {
    const _roomNameLength = 20;
    if(_roomName === null && !require){
        return true;
    }
    if(typeof _roomName != 'string' ||
       (_roomName.length > 0 && !checkDecodeURI(_roomName)) ||
        decodeURIComponent(_roomName).length > _roomNameLength) {
        return false;
    }
    return true;
};

function isAscii(string){ return string.match(/^[\x20-\x7e]+$/); }

function isMailAddress(string){
    return string.match(/^.+[@].+[\.].+$/);
}

function checkDecodeURI(string){
    if(!isAscii(string)){
        return false;
    }
    try{
        decodeURIComponent(string);
    }catch(e){
        return false;
    }
    return true;
}

exports.checkComplexity = (newPassword, tenantConf) => {
    let _haveToPolicyEnable = false;
    let _complexityNumber = 0;
    if (tenantConf != null && typeof tenantConf == 'object') {
        if (_.has(tenantConf, 'disclosable') && _.has(tenantConf.disclosable, 'passwordPolicy')) {
            if (_.has(tenantConf.disclosable.passwordPolicy, 'complexityNumber')) {
                _complexityNumber = tenantConf.disclosable.passwordPolicy.complexityNumber;
                if (_complexityNumber != 0) {
                    _haveToPolicyEnable = true;
                }
            }
        }
    }
    if (_haveToPolicyEnable) {
        switch (_complexityNumber){
        case 32:
            if ((/[0-9]/.test(newPassword) && /[A-Za-z]/.test(newPassword) 
                && /[!-/:-@\[-\`\{-\~]/.test(newPassword)) == false) {
                Log.connectionLog(4, 'newPassword has a lack of complexity');
                return ERROR_PASSWORD_COMPLEXITY_CHECK;
            }
            break;
        default:
            Log.connectionLog(4, 'Unsupported complexityNumber has been defined in tenant_store.conf' );
            return API_STATUS.BAD_REQUEST;
        }
    }

    return 0;
};

