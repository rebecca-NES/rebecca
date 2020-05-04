'use strict';

const _log = require("../server_log").getInstance();

/**
 * URLエンコードされているテキスト内からハッシュタグの取得する
 *
 * @param body URLエンコードされたメッセージbody
 *
 * @return 
 */
exports.getTagsArrayFromCodecBody = (body) => {
    _log.connectionLog(7, 'do func hashtag.utils.getTagsArrayFromCodecBody(...');
    const bodyStr = decodeURIComponent(body);
    return getTagsArrayFromBody(bodyStr);
};

/**
 * プレーンなテキスト内からハッシュタグの取得する
 *
 * @param bodyStr メッセージbody
 */
const getTagsArrayFromBody = (bodyStr) => {
    _log.connectionLog(7, 'do func hashtag.utils.getTagsArrayFromBody(...');
    //行頭かスペース後の＃からは始まる空文字ではない文字までの値
    const tags = [];
    bodyStr.replace(/(#[^ -\/:-@\[-`{-~\s]+?)(\s|$|>)/g,
                    (arg,p1,p2,offset,str)=>{
                        if(str.indexOf(p1) >= 0){
                            let lastw = str.substr(0,str.indexOf(p1));
                            if(lastw.match(/(^|\s)$/) && p2 != '>'){//スタンプふきだし以外は「>」を持たないため
                                tags.push(p1);
                                return arg;
                            }//タグの前が「＜」で行末が「＞」の場合はスタンプ吹出メッセージ内の文頭のタグ
                            //その他文中のタグは条件式内で処理
                            else if(lastw.match(/</i) && str.match(/>/i)){
                                tags.push(p1);
                                return arg;
                            }
                        }
                        return arg;
                    });
    let taglist = [];
    // Variable 'tags' is of type object, but it is compared to an expression of type null.
    // if(tags != null && typeof tags == "object" && tags.length > 0){
    if(typeof tags == "object" && tags.length > 0){
        for (let i=0;i<tags.length;i++){
            //タグ前に上のマッチでスペースを含むので削除
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
