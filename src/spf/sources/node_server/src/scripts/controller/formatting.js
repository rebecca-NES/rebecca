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

const Log = require('./server_log').getInstance();

exports.exTrim = (value) => {
    Log.connectionLog(7, 'do func Fotmatting.exTrim(...');
    if(value == undefined ||
       value == null ||
       typeof value != "string" ||
       value.length == 0){
        return value;
    }
    let _value;
    try{
        _value = decodeURIComponent(value.trim());
    }catch(e){
        Log.connectionLog(5,"Fotmatting.exTrim error decodeURIComponent undecode data inputed.");
         _value = value;
    }
    return encodeURIComponent(_value.trim());
}

