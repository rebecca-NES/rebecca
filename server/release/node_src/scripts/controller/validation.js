/**
 * API入力値のバリデーションチェックを行うためのメソッドを定義
 *
 * 以下、定義済みバリデーション対象の一覧
 * user: アカウント名。 60文字以下、半角のみ
 * nickName: ニックネーム。 20文字以下、半角のみ（URIエンコードされていること）
 * password: パスワード。 8-32文字、半角のみ
 * group: 所属。 配列、アイテム数5以内、100文字以下、半角のみ（URIエンコードされていること）
 * mailAddress: メールアドレス。 256文字以下。半角のみ
 * staus: ユーザアカウントのステータス。 intのみ、0（利用中） or 2（利用停止）のみ許容する
 * expect: 検索結果に含めないユーザ(openfireアカウント名)。64文字以下、半角のみ
 * start: 取得開始件数。 intのみ、1以上であること
 * count: 取得件数。 intのみ、1以上であること
 * privacyType 公開タイプ（0=公開, 1=非公開, 2=秘密）の値を通す。
 *      グループチャットとコミュニティーにそれぞれ存在するが20180731時点でグループチャットのみ
 *      ここの関数を使用する。
 *
 * @module  src/scripts/controller/validation
 */

'use strict';

const _ = require('underscore');
const Log = require('./server_log').getInstance();
const API_STATUS = require('./const').API_STATUS;

const ERROR_PASSWORD_COMPLEXITY_CHECK = 32;
/**
 * userValidationCheck
 *
 * APIに入力された`user`のバリデーションチェック
 * 満たしている場合はtrue、満たしていない場合はfalseを返却する
 * string、60文字以下、半角のみ
 *
 * @param {string} _user - 入力されたuserの値
 * @param {boolean} require - 必須パラメータかどうかを判断する。
 *
 * @return {boolean}
 */
exports.userValidationCheck = (_user, require=false) => {
    const _userLength = 60;
    // 指定された引数がnull かつ 必須パラメータでない場合はtrue
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

/**
 * nickNameValidationCheck
 *
 * APIに入力された`nickName`のバリデーションチェック
 * 満たしている場合はtrue、満たしていない場合はfalseを返却する
 * string、20文字以下、半角のみ（URIエンコードされていること）
 *
 * @param {string} _nickName - 入力されたnickNameの値
 * @param {boolean} require - 必須パラメータかどうかを判断する。
 *
 * @return {boolean}
 */
exports.nickNameValidationCheck = (_nickName, require=false) => {
    const _nickNameLength = 20;
    // 指定された引数がnull かつ 必須パラメータでない場合はtrue
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

/**
 * passwordValidationCheck
 *
 * APIに入力された`password`のバリデーションチェック
 * 満たしている場合はtrue、満たしていない場合はfalseを返却する
 * string、8-32文字、半角のみ
 *
 * @param {string} _password - 入力されたpasswordの値
 * @param {boolean} require - 必須パラメータかどうかを判断する。
 *
 * @return {boolean}
 */
exports.passwordValidationCheck = (_password, require=false) => {
    const _passwordLength_min = 8;
    const _passwordLength_max = 32;
    // 指定された引数がnull かつ 必須パラメータでない場合はtrue
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

/**
 * groupValidationCheck
 *
 * APIに入力された`group`のバリデーションチェック
 * 満たしている場合はtrue、満たしていない場合はfalseを返却する
 * 配列、5アイテム以下、100文字以下、半角のみ（URIエンコードされていることが前提）
 *
 * @param {string} _group - 入力されたgroupの値
 *
 * @return {boolean}
 */
exports.groupValidationCheck = (_group, require=false) => {
    // 指定された引数がnull かつ 必須パラメータでない場合はtrue
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

/**
 * mailAddressValidationCheck
 *
 * APIに入力された`mailAddress`のバリデーションチェック
 * 満たしている場合はtrue、満たしていない場合はfalseを返却する
 * string、256文字以下(URIデコードされている状態)、半角のみ(URIエンコードされていること)
 * 最低限のメールアドレスの定義を満たしていること（isMailAddressを満たしていること）
 *
 * @param {string} _mailAddress - 入力されたmailAddressの値
 *
 * @return {boolean}
 */
exports.mailAddressValidationCheck = (_mailAddress, require=false) => {
    // 指定された引数がnull かつ 必須パラメータでない場合はtrue
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

/**
 * statusValidationCheck
 *
 * APIに入力された`status`のバリデーションチェック
 * statusはユーザの利用状況を指す。(0:利用可能、2:利用停止中)
 * 満たしている場合はtrue、満たしていない場合はfalseを返却する
 * int、0 or 2 のみ許可
 *
 * @param {string} _status - 入力されたstatusの値
 * @param {boolean} require - 必須パラメータかどうかを判断する。
 *
 * @return {boolean}
 */
exports.statusValidationCheck = (_status, require=false) => {
    // 指定された引数がnull かつ 必須パラメータでない場合はtrue
    if(_status === null && !require){
        return true;
    }
    if(!Number.isInteger(_status) ||
        !(_status == 0 || _status == 2)) {
        return false;
    }
    return true;
};

/**
 * exceptValidationCheck
 *
 * APIに入力された`except`のバリデーションチェック
 * 満たしている場合はtrue、満たしていない場合はfalseを返却する
 * 配列であること、64文字以下、半角のみ
 *
 * @param {string} _except - 入力されたexceptの値
 * @param {boolean} require - 必須パラメータかどうかを判断する。
 *
 * @return {boolean}
 */
exports.exceptValidationCheck = (_except, require=false) => {
    const _exceptLength = 64;
    // 指定された引数がnull かつ 必須パラメータでない場合はtrue
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

/**
 * startValidationCheck
 *
 * APIに入力された`start`のバリデーションチェック
 * 満たしている場合はtrue、満たしていない場合はfalseを返却する
 * intのみ、1以上であること
 *
 * @param {string} _start - 入力されたstartの値
 * @param {boolean} require - 必須パラメータかどうかを判断する。
 *
 * @return {boolean}
 */
exports.startValidationCheck = (_start, require=false) => {
    // 指定された引数がnull かつ 必須パラメータでない場合はtrue
    if(_start === null && !require){
        return true;
    }
    if (!Number.isInteger(_start) ||
        _start <= 0) {
        return false;
    }
    return true;
};

/**
 * countValidationCheck
 *
 * APIに入力された`count`のバリデーションチェック
 * 満たしている場合はtrue、満たしていない場合はfalseを返却する
 * intのみ、1以上であること
 *
 * @param {string} _count - 入力されたcountの値
 * @param {boolean} require - 必須パラメータかどうかを判断する。
 *
 * @return {boolean}
 */
exports.countValidationCheck = (_count, require=false) => {
    // 指定された引数がnull かつ 必須パラメータでない場合はtrue
    if(_count === null && !require){
        return true;
    }
    if (!Number.isInteger(_count) ||
        _count <= 0) {
        return false;
    }
    return true;
};


/**
 * privacyTypeValidationCheck
 *
 * APIに入力された`privacyType`のバリデーションチェック
 * グループチャット、コミュニティーの属性として使用
 * 満たしている場合はtrue、満たしていない場合はfalseを返却する
 * 値は、公開タイプ（0=公開, 1=非公開, 2=秘密）の値を通す。
 * ※負の値は値更新時の未定義な意味の値に使うので拡張時は正の値で拡張のこと。
 *
 * @param {string} _mailAddress - 入力されたmailAddressの値
 *
 * @return {boolean}
 */
exports.privacyTypeValidationCheck = (privacytype, require=false) => {
    // 指定された引数がundefined=値が設定されていない,またはnull かつ 必須パラメータでない場合はtrue
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

/**
 * listTypeValidationCheck
 *
 * APIに入力された`privacyType`が公開=0の時,
 * 実行者がリストに(非所属=0)か、(所属=1),(非所属＋所属=2),を選択する値
 * のバリデーションチェック
 * グループチャット、コミュニティーの属性として使用
 * 満たしている場合はtrue、満たしていない場合はfalseを返却する
 * 値は、検索時自分が属しているか（非所属=0, 所属=1, 非所属＋所属=2）の値を通す。
 *
 * @param {string} _mailAddress - 入力されたmailAddressの値
 *
 * @return {boolean}
 */
exports.listTypeValidationCheck = (privacytype, require=false) => {
    // 指定された引数がundefined=値が設定されていない,またはnull かつ 必須パラメータでない場合はtrue
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


/**
 * threadTitle ValidationCheck
 *
 * APIに入力された`threadTitle`のバリデーションチェック
 *
 * 満たしている場合はtrue、満たしていない場合はfalseを返却する
 * 文字数制限はサロゲートカウントなども含め多めの倍+タイトルカテゴリもあるので文字数制限を大幅に拡大
 * UI側で基本の文字数は絞るが、ここでも文字カウントはDB、サーバ内での値として制限をかけるため
 * ※ 値のチェックではデフォルトで空文字も許容する
 * ※ 半角英数字と「-+%!~*.()'_」の特殊記号を通す
 *
 * @param {string} threadTitle - 入力されたthreadTitleの値
 * @param {string} require - 入力された省略不可かどうかの値
 *
 * @return {boolean}
 */
exports.threadTitleValidationCheck = (threadTitle, require=false) => {
    Log.connectionLog(7, 'do func Validation.threadTitleValidationCheck(...');
    // 指定された引数がundefined=値が設定されていない,またはnull かつ 必須パラメータでない場合はtrue
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

/**
 * itemId ValidationCheck
 *
 * APIに入力された`itemId`のバリデーションチェック
 *
 * 満たしている場合はtrue、満たしていない場合はfalseを返却する
 * UI側で基本の文字数は絞るが、ここでも文字カウントはDB、サーバ内での値として制限をかけるため
 * ※ 半角英数字と半角スペース「-+%&$#!~*.'_」の特殊記号を通す1文字以上必須
 *
 * @param {string} itemId - 入力されたitemIdの値
 * @param {string} require - 入力された省略不可かどうかの値
 *
 * @return {boolean}
 */
exports.itemIdValidationCheck = (itemId, require=false) => {
    Log.connectionLog(7, 'do func Validation.itemIdValidationCheck(...');
    // 指定された引数がundefined=値が設定されていない,またはnull かつ 必須パラメータでない場合はtrue
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

/**
 * roomId ValidationCheck
 *
 * APIに入力された`roomId`のバリデーションチェック
 *
 * 満たしている場合はtrue、満たしていない場合はfalseを返却する
 * UI側で基本の文字数は絞るが、ここでも文字カウントはDB、サーバ内での値として制限をかけるため
 * ※ 半角英数字と半角スペース「-+%&$#!~*.'_」の特殊記号を通す1文字以上必須
 *
 * @param {string} roomId - 入力されたitemIdの値
 * @param {string} require - 入力された省略不可かどうかの値
 *
 * @return {boolean}
 */
exports.roomIdValidationCheck = (roomId, require=false) => {
    Log.connectionLog(7, 'do func Validation.roomIdValidationCheck(...');
    // 指定された引数がundefined=値が設定されていない,またはnull かつ 必須パラメータでない場合はtrue
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

/**
 * tenant uuid ValidationCheck
 * spf-dckr-of-aa944196-e5d5-11e5-84b4-000c29690167-01
 *
 * APIに入力された`tenantId`のバリデーションチェック
 *
 * 満たしている場合はtrue、満たしていない場合はfalseを返却する
 * UI側で基本の文字数は絞るが、ここでも文字カウントはDB、サーバ内での値として制限をかけるため
 * ※ 半角英数字と半角スペース「-+%&$#!~*.'_」の特殊記号を通す1文字以上必須
 *
 * @param {string} roomId - 入力されたitemIdの値
 * @param {string} require - 入力された省略不可かどうかの値
 *
 * @return {boolean}
 */
exports.tenantIdValidationCheck = (tenantId, require=false) => {
    Log.connectionLog(7, 'do func Validation.tenantIdValidationCheck(...');
    // 指定された引数がundefined=値が設定されていない,またはnull かつ 必須パラメータでない場合はtrue
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

/**
 * msgTo ValidationCheck
 *
 * APIに入力された`roomId`のバリデーションチェック
 *
 * 満たしている場合はtrue、満たしていない場合はfalseを返却する
 * UI側で基本の文字数は絞るが、ここでも文字カウントはDB、サーバ内での値として制限をかけるため
 * ※ 半角英数字と半角スペース「-+%&$#!~*.'_」の特殊記号を通す1文字以上必須
 *
 * @param {string} roomId - 入力されたitemIdの値
 * @param {string} require - 入力された省略不可かどうかの値
 *
 * @return {boolean}
 */
exports.msgToValidationCheck = (msgTo, require=false) => {
    Log.connectionLog(7, 'do func Validation.msgToValidationCheck(...');
    // 指定された引数がundefined=値が設定されていない,またはnull かつ 必須パラメータでない場合はtrue
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

/**
 * type ValidationCheck
 *
 * APIに入力された`type`のバリデーションチェック
 *
 * 満たしている場合はtrue、満たしていない場合はfalseを返却する
 * UI側で基本の文字数は絞るが、ここでも文字カウントはDB、サーバ内での値として制限をかけるため
 *
 * @param {string} type - 入力されたtypeの値
 * @param {string} require - 入力された省略不可かどうかの値
 *
 * @return {boolean}
 */
exports.messageTypeValidationCheck = (type, require=false) => {
    Log.connectionLog(7, 'do func Validation.messageTypeValidationCheck(...');
    // 指定された引数がundefined=値が設定されていない,またはnull かつ 必須パラメータでない場合はtrue
    if((type === undefined || type === null) && !require){
        return true;
    }
    if (typeof type != 'string' ||
        ! type.match(/^(Public|Chat|GroupChat|Community|Task|Murmur)$/)){
        return false;
    }
    return true;
};

/**
 * jid ValidationCheck
 *
 * APIに入力された`type`のバリデーションチェック
 *
 * 満たしている場合はtrue、満たしていない場合はfalseを返却する
 * UI側で基本の文字数は絞るが、ここでも文字カウントはDB、サーバ内での値として制限をかけるため
 * ※ 半角英数字と半角スペース「-+@/:%&$#!~*.()'_」の特殊記号を通す
 *
 * @param {string} jid - 入力されたjidの値
 * @param {string} require - 入力された省略不可かどうかの値
 *
 * @return {boolean}
 */
exports.jidValidationCheck = (jid, require=false) => {
    Log.connectionLog(7, 'do func Validation.jidValidationCheck(...');
    // 指定された引数がundefined=値が設定されていない,またはnull かつ 必須パラメータでない場合はtrue
    if((jid === undefined || jid === null) && !require){
        return true;
    }
    if (typeof jid != 'string' ||
        ! jid.match(/^[\w-+@\/:%&$#!~\*\.\(\)'\s]+$/)){
        return false;
    }
    return true;
};

/**
 * 日付(2000/02/02) ValidationCheck
 *
 * APIに入力された`type`のバリデーションチェック
 *
 * 満たしている場合はtrue、満たしていない場合はfalseを返却する
 *
 * @param {string} date - 入力された日付の値
 * @param {string} require - 入力された省略不可かどうかの値
 *
 * @return {boolean}
 */
exports.dateValidationCheck = (date, require=false) => {
    Log.connectionLog(7, 'do func Validation.dateValidationCheck(...');
    // 指定された引数がundefined=値が設定されていない,またはnull かつ 必須パラメータでない場合はtrue
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

/**
 * goodjob拡張感情ポイントValidationCheck
 *
 * APIに入力された`emotionPoint`のバリデーションチェック
 * 満たしている場合はtrue、満たしていない場合はfalseを返却する
 * 値は、公開タイプ（-1 から 6までの整数）の値を通すが
 * ※未来では99くらいの2桁程度までは使う可能性あり
 * 特出値(-1:データ削除されたとする値, 0は初期実装のGoodJobと同等の扱い）
 *
 * @param {string} _emotionPoint - 感情ポイントの値
 *
 * @return {boolean}
 */
exports.emotionPointValidationCheck = (emotionPoint, require=false) => {
    // 指定された引数がundefined=値が設定されていない,またはnull かつ 必須パラメータでない場合はtrue
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

/**
 * Note Title ValidationCheck
 *
 * APIに入力された`Note Title`のバリデーションチェック
 *
 * 満たしている場合はtrue、満たしていない場合はfalseを返却する
 * 文字数制限はサロゲートカウントなども含め多めの倍の100で設定
 * UI側で基本の文字数は絞るが、ここでも文字カウントはDB、サーバ内での値として制限をかけるため
 * ※ 値のチェックではデフォルトで空文字も許容する
 * ※ 半角英数字と「-+%!~*.()'_」の特殊記号を通す
 *
 * @param {string} title - 入力されたNoteTitleの値
 * @param {string} require - 入力された省略不可かどうかの値
 *
 * @return {boolean}
 */
exports.noteTitleValidationCheck = (title, require=false) => {
    Log.connectionLog(7, 'do func Validation.noteTitleValidationCheck(...');
    // 指定された引数がundefined=値が設定されていない,またはnull かつ 必須パラメータでない場合はtrue
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

/**
 * AccsessToken ValidationCheck
 *
 * APIに入力された`AccsessToken`のバリデーションチェック
 *
 * ※ 文字長は16文字
 * ※ 値のチェックではデフォルトで空文字も許容する
 * ※ 半角英数字と「-_」の記号を通す
 *
 * @param {string} threadTitle - 入力されたthreadTitleの値
 * @param {string} require - 入力された省略不可かどうかの値
 *
 * @return {boolean}
 */
exports.accessTokenValidationCheck = (token, require=false) => {
    Log.connectionLog(7, 'do func Validation.accessTokenValidationCheck(...');
    // 指定された引数がundefined=値が設定されていない,またはnull かつ 必須パラメータでない場合はtrue
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

/**
 * NoteID ValidationCheck
 *
 * APIに入力された`NoteID`のバリデーションチェック
 *
 * ※ 文字長は16以上128以下
 * ※ 値のチェックではデフォルトで空文字も許容する
 * ※ 半角英数字と「-_」の記号を通す
 *
 * @param {string} noteId - 入力されたNoteIDの値
 * @param {string} require - 入力された省略不可かどうかの値
 *
 * @return {boolean} */
exports.noteIdValidationCheck = (noteId, require=false) => {
    Log.connectionLog(7, 'do func Validation.noteIdValidationCheck(...');
    // 指定された引数がundefined=値が設定されていない,またはnull かつ 必須パラメータでない場合はtrue
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

/**
 * JSONデータのvalueの値を正規表現でチェック
 *
 * @param {json} json - JSONデータ
 * @param {string} regexp - 正規表現
 *
 * @return {boolean}
 */
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


/**
 * http[s]のURL値チェック
 *
 * @param {string} string
 *
 * @return {boolean}
 */
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

/**
 * bodyType値チェック
 * (メッセージ自体がスタンプ=1だけを意味するときに使う)
 *
 * @param {string} string
 *
 * @return {boolean}
 */
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

/**
 * affiliation値チェック
 * (DBには所属ごとにurl encode 化され、1所属100文字5つ以内の、配列値、全角のみなのでエンコード)
 *
 * @param {array} val
 *
 * @return {boolean}
 */
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

/**
 * murmurRoomNameValidationCheck
 *
 * APIに入力された`roomName`のバリデーションチェック
 * 満たしている場合はtrue、満たしていない場合はfalseを返却する
 * string、20文字以下、半角のみ（URIエンコードされていること）
 *
 * @param {string} _roomName - 入力されたroomNameの値
 * @param {boolean} require - 必須パラメータかどうかを判断する。
 *
 * @return {boolean}
 */
exports.murmurColumnNameValidationCheck = (_roomName, require=false) => {
    const _roomNameLength = 20;
    // 指定された引数がnull かつ 必須パラメータでない場合はtrue
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

/**
 * isAscii
 * 指定された文字列が反核文字かを判定する。
 *
 * @param {string} string
 *
 * @return {boolean}
 */
function isAscii(string){ return string.match(/^[\x20-\x7e]+$/); }

/**
 * isMiailAddress
 * 指定された文字列がメールアドレスかを判定する。
 * 半角文字の繰り返し + @ + 半角文字の繰り返し + . + 半角文字の繰り返し
 *
 * @param {string} string
 *
 * @return {boolean}
 */
function isMailAddress(string){
    return string.match(/^.+[@].+[\.].+$/);
}

/**
 * checkDecodeURI
 * 入力された文字列をURIデコードした際にエラーとならないことをチェックする
 *
 * @param {string} string
 *
 * @return {boolean}
 */
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

/**
 * 複雑性チェックを実施する。
 * @param  {string} newPassword   API の request でわたってきた新しい方のパスワード
 * @param  {object} tenantConf    キャッシュから取得したテナント情報
 * @return {int}                  複雑性チェックを実施。(チェックを行わない、問題が無い場合は0、複雑性チェックにかかった場合は、対応する reason 番号を返却)
 */
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
        // 複雑性チェックのパターンが増える場合、ここに追加する。
        // web/js/dialog_password_view.js に追加したパターンのエラーメッセージ表示処理を追加と合わせて実施。
        switch (_complexityNumber){
        case 32:
            if ((/[0-9]/.test(newPassword) && /[A-Za-z]/.test(newPassword) 
                && /[!-/:-@\[-\`\{-\~]/.test(newPassword)) == false) {
                // パスワードの強度不足
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

