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

const _log = require("../server_log").getInstance();

exports.getTagsArrayFromCodecBody = (body) => {
    _log.connectionLog(7, 'do func hashtag.utils.getTagsArrayFromCodecBody(...');
    const bodyStr = decodeURIComponent(body);
    return getTagsArrayFromBody(bodyStr);
};

const getTagsArrayFromBody = (bodyStr) => {
    _log.connectionLog(7, 'do func hashtag.utils.getTagsArrayFromBody(...');
    const tags = [];
    bodyStr.replace(/(#[^ -\/:-@\[-`{-~\s]+?)(\s|$|>)/g,
                    (arg,p1,p2,offset,str)=>{
                        if(str.indexOf(p1) >= 0){
                            let lastw = str.substr(0,str.indexOf(p1));
                            if(lastw.match(/(^|\s)$/) && p2 != '>'){
                                tags.push(p1);
                                return arg;
                            }
                            else if(lastw.match(/</i) && str.match(/>/i)){
                                tags.push(p1);
                                return arg;
                            }
                        }
                        return arg;
                    });
    let taglist = [];
    if(tags != null && typeof tags == "object" && tags.length > 0){
        for (let i=0;i<tags.length;i++){
            let tag = tags[i].replace(/^\s+/,"");
            tag = tag.replace(/\s+$/,"");
            if(Array.from(tag).length > 31){
                continue;
            }
            taglist.push(encodeURIComponent(tag));
        }
    }
    return taglist;
};
