(function() {
    var GlobalSNSManagerDbConnector = require('../../scripts/lib/DbHelper/global_sns_manager_db_connector');
    var UserAccountData = require('../../scripts/model/user_account_data');
    var ServerLog = require('../../scripts/controller/server_log');
    // Unused variable RequestData.
    // var RequestData = require('../../scripts/model/request_data').RequestData;
    var PersonData = require('../../scripts/model/person_data');
    var RegisteredContactData = require('../../scripts/model/registered_contact_data');
    var Utils = require('../../scripts/utils');
    var SynchronousBridgeNodeXmpp = require('../../scripts/controller/synchronous_bridge_node_xmpp');
    var Conf = require('../../scripts/controller/conf');
    var CsvFileManager = require('./csv_file_manager');
    var AccountTypeManager = require('./account_type_manager');

    var _log = ServerLog.getInstance();
    var _conf = Conf.getInstance();

    /**
     * UserAccountManagerコンストラクタ
     */
    function UserAccountManager() {
    };

    // 定数
    // Unused variable COLUMN_ID_NAME...
    // var COLUMN_ID_NAME = "id";
    // var COLUMN_LOGIN_ACCOUNT_NAME = "login_account";
    // var COLUMN_OPENFIRE_ACCOUNT_NAME = "openfire_account";
    // var COLUMN_XMPP_SERVER_NAME = "xmpp_server_name";
    // var COLUMN_UPDATE_TIME_NAME = "update_time";
    // var COLUMN_DELETE_FLG_NAME = "delete_flg";

    var ERR_REASON_NON = 0;
    var ERR_REASON_ERROR_PARAM = 1;
    var ERR_REASON_ACCOUNT_EMPTY = 2;
    var ERR_REASON_ACCOUNT_OVER_MAX_SIZE = 3;
    var ERR_REASON_PASSWORD_SIZE = 4;
    var ERR_REASON_NOT_MATCH_PASSWORD_AND_CONFIRM_PASSWORD = 5;
    var ERR_REASON_EMAIL_EMPTY = 6;
    var ERR_REASON_ACCOUNT_WRONG_FORMAT = 7;
    var ERR_REASON_EMAIL_WRONG_FORMAT = 8;
    var ERROR_REASON_EXIST_USER = 9;
    var ERROR_REASON_EXIST_MAILADDRESS = 10;
    var ERROR_REASON_INTERNAL_SERVER_ERROR = 11;
    var ERROR_REASON_DUPLICATE_ACCOUNT_IN_CSV = 12;
    var ERROR_REASON_DUPLICATE_EMAIL_IN_CSV = 13;
    var ERR_REASON_NICKNAME_SIZE = 14;
    var ERR_REASON_WRONG_CSV_FORMAT = 15;
    var ERR_REASON_SKIP_DATA = 16;
    var ERR_REASON_FAIL_READ_CSV = 17;
    var ERR_REASON_ACCOUNT_TYPE_EMPTY = 18;
    var ERR_REASON_NO_EXIST_ACCOUNT_TYPE = 19;
    var ERR_REASON_FAIL_ASSIGN_ACCOUNT_TYPE = 20;
    var ERR_REASON_GROUP_MAX_COUNT = 21;
    var ERR_REASON_GROUP_MAX_SIZE = 22;
    var ERR_REASON_DELETE_FLG_NOT_NUMBER = 23;

    var ACCOUNT_MAX_SIZE = 252;
    var PASSWORD_MIN_SIZE = 8;  //2015/9/10 V3 - パスワードの長さの最小桁数を 3 → 8 にする
    var PASSWORD_MAX_SIZE = 32;
    var NICKNAME_MAX_SIZE = 20;

    // Unused variable LOGIN_ACCOUNT_NAME_MAX_LENGTH.
    // var LOGIN_ACCOUNT_NAME_MAX_LENGTH = 252;

    var _proto = UserAccountManager.prototype;

    /**
     * ログインユーザ詳細情報取得
     * @param {object} request リクエスト情報
     * @param {object} target 対象ユーザの情報
     * @param {function} callback コールバック関数
     * @returns {object} ログインユーザ詳細情報
     */
    _proto.getPersonByUserAccountData = function(request, target, callback) {
        return SynchronousBridgeNodeXmpp.getInstance().getPersonByUserAccountData(
          request.session.accessToken,
          target,
          callback)
    };

    /**
     * ユーザ一覧
     * @param {String} loginAccount cubeeのログインアカウント
     * @returns {String} Openfireのアカウント文字列
     */
    _proto.getUserList = function(accessToken, requestData, getUserListCallback) {
        var _synchronousBridgeNodeXmpp = SynchronousBridgeNodeXmpp.getInstance();
        if(requestData.except == null) {
            // 表示除外設定がされていない場合は空とする
            requestData.except = [];
            _log.connectionLog(7, 'except is null... so except is nothing');
        }
        var _syncRet = _synchronousBridgeNodeXmpp.getUserListForAdmintool(
            accessToken, requestData.tenantId, requestData.except, requestData.start, requestData.count, _getUserListCallBackFanc);
        //一覧取得
        function _getUserListCallBackFanc(responseData){
            var _result = responseData.content.result;
            var _reason = responseData.content.reason;
            var _extras = responseData.content.extras;
            var _count = responseData.content.count;
            var items = responseData.content.items;
            getUserListCallback(_result, _reason, _extras, _count, items);
        }
    };
    /**
     * 新規登録処理
     * @param {RequestData} formData ユーザ登録画面からのリクエストデータ
     *                        formData.account           :  アカウント
     *                        formData.nickname          :  ニックネーム
     *                        formData.email             :  メール
     *                        formData.password          :  パスワード
     *                        formData.confirmPassword   :  確認用パスワード
     * @param {function} onCreateUserCallBack ユーザ登録のコールバック関数
     * @returns {object} 処理開始成功 :true / 処理失敗 : false
     */
    _proto.createUser = function(accessToken,formData,onCreateUserCallBack) {
        var _ret = {};
        _ret.result = false;
        _ret.reason = ERR_REASON_ERROR_PARAM;
        if (accessToken == null || typeof accessToken != 'string') {
            _log.connectionLog(4, 'accessToken is invalid');
            return _ret;
        }
        if (formData == null || typeof formData != 'object') {
            _log.connectionLog(4, 'formData is invalid');
            return _ret;
        }
        if (onCreateUserCallBack == null || typeof onCreateUserCallBack != 'function') {
            _log.connectionLog(4, 'onCreateUserCallBack is invalid');
            return _ret;
        }
        var _self = this;
        _ret = _checkRegformData(formData);
        if(!_ret.result){
            return _ret;
        }
        var _personData = PersonData.create();
        _personData.setUserName(formData.account);
        //_personData.setMail(formData.email);
        //step2-sprint12ではメールアドレスの登録をしないため、固定で空をセット
        _personData.setMail('');
        formData.nickname = Utils.excludeControleCharacters(formData.nickname);
        _personData.setNickName(encodeURIComponent(formData.nickname));
        var _password = formData.password;
        var _registeredContactData = RegisteredContactData.create();
        _registeredContactData.setType(RegisteredContactData.TYPE_NONE);

        var _retGroups = new Array();
        // チェック時と共通のデータの取り出しをする
        var _groupArray = getGroupArrayFromFormData(formData.group);
        // 通信用に、URIエンコードする
        _groupArray.forEach((_groupName) => {
            _retGroups.push(encodeURIComponent(_groupName));
        });
        _personData.setGroup(_retGroups);

        var _synchronousBridgeNodeXmpp = SynchronousBridgeNodeXmpp.getInstance();
        var _syncRet = _synchronousBridgeNodeXmpp.registerUser(accessToken, _personData, _password, _registeredContactData, _createUserCallBackFanc);
        if(!_syncRet){
            _ret.result = false;
            _ret.reason = ERR_REASON_ERROR_PARAM;
        }else{
            _ret.result = true;
            _ret.reason = ERR_REASON_NON;
        }
        return _ret;

        //登録処理後のコールバック
        function _createUserCallBackFanc(result, reason, personData, password, registeredContactData){
            var _reason = _getReasonFromSynchronousResponceReason(reason);
            onCreateUserCallBack(result, _reason);
        }
        //フォーム内容のチェック
        function _checkRegformData(formData){
            var _ret = {};
            _ret.result = false;
            _ret.reason = ERR_REASON_ERROR_PARAM;
            if(formData == null || typeof formData != 'object') {
                _log.connectionLog(3, 'UserAccountManager#_checkformtData :: formData is null');
                return _ret;
            }
            if(!_checkAccountRequired(formData.account)){
                _log.connectionLog(3, 'UserAccountManager#_checkformtData :: formData.account is invalid');
                _ret.reason = ERR_REASON_ACCOUNT_EMPTY;
                return _ret;
            }
            if(!_checkAccountSize(formData.account)){
                _log.connectionLog(3, 'UserAccountManager#_checkformtData :: formData.account is over size 252');
                _ret.reason = ERR_REASON_ACCOUNT_OVER_MAX_SIZE;
                return _ret;
            }
            if(!_checkAccountFormat(formData.account)){
                _log.connectionLog(3, 'UserAccountManager#_checkformtData :: formData.account is wrong format');
                _ret.reason = ERR_REASON_ACCOUNT_WRONG_FORMAT;
                return _ret;
            }
            if(formData.nickname == undefined){
                _log.connectionLog(3, 'UserAccountManager#_checkformtData :: formData.nickname is invalid');
                return _ret;
            }
            //step2-sprint12ではメールの登録を行わないためコメントアウト
            /*
            if(!_checkEmailRequired(formData.email)){
                _log.connectionLog(3, 'UserAccountManager#_checkformtData :: formData.email is invalid');
                _ret.reason = ERR_REASON_EMAIL_EMPTY;
                return _ret;
            }
            if(!_checkEmaiFormat(formData.email)){
                _log.connectionLog(3, 'UserAccountManager#_checkformtData :: formData.email is invalid');
                _ret.reason = ERR_REASON_EMAIL_WRONG_FORMAT;
                return _ret;
            }
            */
            if(!_checkPasswordSize(formData.password)){
                _log.connectionLog(3, 'UserAccountManager#_checkformtData :: formData.password is invalid');
                _ret.reason = ERR_REASON_PASSWORD_SIZE;
                return _ret;
            }
            if(formData.confirmPassword != formData.password){
                _log.connectionLog(3, 'UserAccountManager#_checkformtData :: formData.password does not match formData.confirmPassword');
                _ret.reason = ERR_REASON_NOT_MATCH_PASSWORD_AND_CONFIRM_PASSWORD;
                return _ret;
            }
            _ret = checkPersonInfo(formData);
            if (!_ret.result) {
                _log.connectionLog(3, 'UserAccountManager#_checkformtData :: formData.group is invalid');
                return _ret;
            }
            _ret.result = true;
            _ret.reason = ERR_REASON_NON;
            return _ret;
        }
    };
    //Synchronousのreasonから(本クラスで扱う)reasonを取得する
    function _getReasonFromSynchronousResponceReason(synchronousResponceReason){
        var _reason = ERROR_REASON_INTERNAL_SERVER_ERROR;
        if(synchronousResponceReason == SynchronousBridgeNodeXmpp.ERROR_EXIST_USER){
            _reason = ERROR_REASON_EXIST_USER;
        }else if(synchronousResponceReason == SynchronousBridgeNodeXmpp.ERROR_EXIST_MAILADDRESS){
            _reason = ERROR_REASON_EXIST_MAILADDRESS;
        }else if(synchronousResponceReason == SynchronousBridgeNodeXmpp.ERROR_NOT_FOUND_USER){
            _reason = ERR_REASON_SKIP_DATA;
        }else if(synchronousResponceReason == SynchronousBridgeNodeXmpp.DISCCONECT_REASON_NO){
            _reason = ERR_REASON_NON;
        }
        return _reason;
    }
    // アカウントの必須チェック
    function _checkAccountRequired(account){
        if(account == null){
            return false;
        }
        if(account == ''){
            return false;
        }
        return true;
    };
    // アカウントのサイズチェック
    function _checkAccountSize(account){
        if(account == null){
            return false;
        }
        if(account.length > ACCOUNT_MAX_SIZE){
            return false;
        }
        return true;
    };
    // アカウントのフォーマットチェック
    function _checkAccountFormat(account){
        if(account == null){
            return false;
        }
        // Character ''' is repeated here in the same character class.
        // ' と　* が重複
        if(!Utils.checkRegExp(account, /^([0-9A-Za-z]|-|['_.*!#$%&+/=?^`{|}])+$/i)) {
            return false;
        }
        return true;
    };
    // メールの必須チェック
    function _checkEmailRequired(email){
        if(email == null){
            return false;
        }
        if(email == ''){
            return false;
        }
        return true;
    };
    // メールアドレスのフォーマットチェック
    function _checkEmaiFormat(email){
        if(email == null){
            return false;
        }
        // @が含まれていて、最後が .(ドット)でないなら正しいとする
        // Character ''' is repeated here in the same character class.
        // ' と　* が重複
        return Utils.checkRegExp(email, /([0-9A-Za-z]|-|['_.!#$%&*+/=?^`{|}])+@+[a-z0-9]+.+[^.]$/i);
    };
    // パスワードのサイズチェック
    function _checkPasswordSize(password){
        if(password == null){
            return false;
        }
        if(password == ''){
            return false;
        }
        if(password.length < PASSWORD_MIN_SIZE || password.length > PASSWORD_MAX_SIZE){
            return false;
        }
        return true;
    };
    // ニックネームのサイズチェック
    function _checkNicknameSize(nickname){
        if(nickname == null){
            return true;
        }
        if(nickname.length > NICKNAME_MAX_SIZE){
            return false;
        }
        return true;
    };

    // 指定されたアカウントタイプが存在しているか
    function _checkAccountTypeExist(type, typelist){
      for( var i in typelist){
        if(i == type){
          return true;
        }
      }
      return false;
    };

    /**
     * パスワード再設定処理
     * @param {String} accessToken アクセストークン
     * @param {String} account cubeeのログインアカウント
     * @param {RequestData} formData パスワード再設定画面からのリクエストデータ
     *                      formData.password          :  パスワード
     *                      formData.confirmPassword   :  確認用パスワード
     * @param {function} onUpdatePasswordCallBack パスワード再設定のコールバック関数
     * @returns {object} 処理開始成功 :true / 処理失敗 : false
     */
    _proto.updateUserPassword = function(accessToken, account, formData, onUpdatePasswordCallBack) {
        var _ret = {};
        _ret.result = false;
        _ret.reason = ERR_REASON_ERROR_PARAM;
        if (accessToken == null || typeof accessToken != 'string') {
            _log.connectionLog(4, 'accessToken is invalid');
            return _ret;
        }
        if (account == null || typeof account != 'string') {
            _log.connectionLog(4, 'account is invalid');
            return _ret;
        }
        if (formData == null || typeof formData != 'object') {
            _log.connectionLog(4, 'formData is invalid');
            return _ret;
        }
        if (onUpdatePasswordCallBack == null || typeof onUpdatePasswordCallBack != 'function') {
            _log.connectionLog(4, 'onUpdatePasswordCallBack is invalid');
            return _ret;
        }
        var _self = this;
        _ret = _checkPassowrd(formData);
        if(!_ret.result){
            return _ret;
        }

        var _synchronousBridgeNodeXmpp = SynchronousBridgeNodeXmpp.getInstance();
        var _syncRet = _synchronousBridgeNodeXmpp.updateUserPassword(accessToken, account, formData.password, _updateUserPasswordCallBackFanc);
        _log.connectionLog(7, '[DEUBG][updateUserPassword] _syncRet: ' + _syncRet);
        if(!_syncRet){
            _ret.result = false;
            _ret.reason = ERR_REASON_ERROR_PARAM;
        }else{
            _ret.result = true;
            _ret.reason = ERR_REASON_NON;
        }
        return _ret;

        //登録処理後のコールバック
        function _updateUserPasswordCallBackFanc(result, reason){
            var _reason = ERROR_REASON_INTERNAL_SERVER_ERROR;
            if(reason == SynchronousBridgeNodeXmpp.ERROR_EXIST_USER){
                _reason = ERROR_REASON_EXIST_USER;
            }else if(reason == SynchronousBridgeNodeXmpp.ERROR_EXIST_MAILADDRESS){
                _reason = ERROR_REASON_EXIST_MAILADDRESS;
            }else if(reason == SynchronousBridgeNodeXmpp.DISCCONECT_REASON_NO){
                _reason = ERR_REASON_NON;
            }
            onUpdatePasswordCallBack(result, _reason);
        }

        //フォーム内容のチェック
        function _checkPassowrd(formData){
            var _ret = {};
            _ret.result = false;
            _ret.reason = ERR_REASON_ERROR_PARAM;
            if(formData == null || typeof formData != 'object') {
                _log.connectionLog(3, 'UserAccountManager#_checkformtData :: formData is null');
                return _ret;
            }
            if(!_checkPasswordSize(formData.password)){
                _log.connectionLog(3, 'UserAccountManager#_checkformtData :: formData.password is invalid');
                _ret.reason = ERR_REASON_PASSWORD_SIZE;
                return _ret;
            }
            if(formData.confirmPassword != formData.password){
                _log.connectionLog(3, 'UserAccountManager#_checkformtData :: formData.password does not match formData.confirmPassword');
                _ret.reason = ERR_REASON_NOT_MATCH_PASSWORD_AND_CONFIRM_PASSWORD;
                return _ret;
            }
            _ret.result = true;
            _ret.reason = ERR_REASON_NON;
            return _ret;
        };
        return _ret;
    };

    /*
     * 入力情報整理
     *
     * @param {String} accessToken アクセストークン
     * @param {object} account ユーザ情報
     * @param {object} formData 入力情報
     * @param {function} callback コールバック関数
     * @returns {object} 更新処理結果
     */
    _proto.updatePersonInfo = function(accessToken, account, formData, callback) {
        var _groups = new Array();
        // チェック時と共通のデータの取り出しをする
        var _groupArray = getGroupArrayFromFormData(formData.group);
        // 通信用に、URIエンコードする
        _groupArray.forEach((_groupName) => {
            _groups.push(encodeURIComponent(_groupName));
        });
        formData.nickname = Utils.excludeControleCharacters(formData.nickname);
        if (!formData.nickname.match(/\S/g)) {
            formData.nickname = '';
        }
        var _personInfo = {
            account: account,
            nickname : encodeURIComponent(formData.nickname),
            group: _groups
        }
        return SynchronousBridgeNodeXmpp.getInstance().execBatchUpdate(
            accessToken, [_personInfo], callback
        );
    };

    /**
     * 更新情報確認処理
     * @param {object} formData 更新情報
     * @returns {object} 入力値チェック結果
     */
    _proto.checkUpdatePersonInfo = function(formData) {
        return checkPersonInfo(formData);
    };

    /**
     * フォームにおける所属を、空文字（全角空白含む）のトリムを施し、重複を排除した配列として整形し、返却する。
     * @param  {string} groupString フォームに指定された所属の文字列
     * @return {object}             加工後の配列
     */
    function getGroupArrayFromFormData(groupString) {
        var _groupArray = [];
        if (groupString && typeof groupString == 'string') {
            _groupArray = groupString.split(',');
            _groupArray = _groupArray.map(Utils.trim).filter(function (x, i, self) {
                return self.indexOf(x) === i && x != '';
            });
        }
        return _groupArray;
    }

    /**
     * 入力情報確認処理
     * @param {object} formData 更新情報
     * @returns {object} チェック結果
     */
    function checkPersonInfo(formData){
        var _ret = {};
        _ret.result = true;
        _ret.reason = ERR_REASON_NON;
        if (formData.group) {
            // 更新時と共通のデータの取り出しをする
            var _groupArray = getGroupArrayFromFormData(formData.group);
            // 数のチェック
            if (_groupArray.length > 5) {
                _ret.result = false;
                _ret.reason = ERR_REASON_GROUP_MAX_COUNT;
                return _ret;
            }
            // 各所属の長さのチェック
            for (var idx = 0; idx < _groupArray.length; ++idx) {
                if (_groupArray[idx].length > 100) {
                    _ret.result = false;
                    _ret.reason = ERR_REASON_GROUP_MAX_SIZE;
                    return _ret;
                }
            };
        }
        return _ret;
    }

    /**
     * 一括登録処理
     * @param {String} accessToken アクセストークン
     * @param {String} csvFilePath csvのファイルパス
     * @param {function} onExecBatchCreateCallBack ユーザ登録のコールバック関数
     * @param {object} roleList アカウントタイプ一覧
     * @returns {String} Openfireのアカウント文字列
     */
    _proto.execBatchCreate = function(accessToken, csvFilePath, onExecBatchCreateCallBack, roleList=null) {
        if (accessToken == null || typeof accessToken != 'string') {
            _log.connectionLog(4, 'accessToken is invalid');
            return false;
        }
        if (csvFilePath == null || typeof csvFilePath != 'string') {
            _log.connectionLog(4, 'csvFilePath is invalid');
            return false;
        }
        if (onExecBatchCreateCallBack == null || typeof onExecBatchCreateCallBack != 'function') {
            _log.connectionLog(4, 'onExecBatchCreateCallBack is invalid');
            return false;
        }
        //登録処理結果格納用の内部変数
        //中身
        /*
        [
             {
                 result : true/false,
                 csvRow : csvファイルの行数,
                 reasons : []
             }
        ]
        */
        var _resultList = new Array();

        // CSVファイルの解析
        CsvFileManager.toArray(csvFilePath, _onToArrayFromCsvFile);
        return true;

        // CSVファイル解析後のコールバック
        function _onToArrayFromCsvFile(csvDataArray){
            //ユーザ登録要求処理
            _requestCreateUser(csvDataArray);
        }

        //ユーザ登録要求処理
        function _requestCreateUser(csvDataArray){
            if(!csvDataArray){
                //csvの読み込み失敗とし
                //コールバックを呼ぶ
                _log.connectionLog(4, 'csvDataArray is invalid');
                onExecBatchCreateCallBack(_getFailReadCsvResult());
                return;
            }
            //CSVファイルの整形
            for(var _idx = 0; _idx < csvDataArray.length; _idx++){
                var _csvData = csvDataArray[_idx];
                _csvData.account = _csvData.account || '';
                _csvData.password = _csvData.password || '';
                _csvData.nickname = Utils.excludeControleCharacters(_csvData.nickname) || '';
                //_csvData.email = _csvData.email || '';
                //step2-sprint12ではメールアドレスの登録をしないため、固定で空をセット
                _csvData.email = '';
                _csvData.group = _csvData.group || '';
                _csvData.AccountType = _csvData.AccountType || '';
            }
            //_createUserDataListの要素数が0のときは
            //csvのフォーマット不正とし
            //コールバックを呼ぶ
            if(csvDataArray.length == 0){
                _log.connectionLog(4, 'csvDataArray is invalid');
                onExecBatchCreateCallBack(_getWrongFormatCsvResult());
                return;
            }
            //登録処理結果格納用の内部変数
            //初期値はデフォルトでfalse
            var _errorReasonDefault = [ERR_REASON_ERROR_PARAM];
            for(var _i = 0; _i < csvDataArray.length; _i++){
                var _retObj = {};
                _retObj.result = false;
                _retObj.reasons = _errorReasonDefault;
                _retObj.csvRow = _i + 2;
                _resultList.push(_retObj);
            }

            //バリデーションチェックを行い、ユーザ登録から除外するユーザハッシュマップを取得
            var _notApplicableIndexToErrorReasonsMap = _getNotApplicableIndexMap(csvDataArray, roleList);
            var _notApplicableIndexMapCount = 0;
            //上記の登録除外ユーザを_resultListにマージする
            for(var _indexStr in _notApplicableIndexToErrorReasonsMap){
                var _index = +_indexStr;    // 数値化
                _resultList[_index].result = false;
                _resultList[_index].reasons = _notApplicableIndexToErrorReasonsMap[_index];
                _notApplicableIndexMapCount++;
            }
            //登録除外のマップと_createUserDataListの要素数が同じ場合は移行の処理はしない
            if(csvDataArray.length == _notApplicableIndexMapCount){
                onExecBatchCreateCallBack(_resultList);
                return;
            }
            //SynchronousBridgeNodeXmppへ送る登録対象ユーザのマップを作成
            var _createTargetUserList = _getCreateTargetUserDataList(csvDataArray, _notApplicableIndexToErrorReasonsMap);

            //SynchronousBridgeNodeXmppへ登録要求を送る
            var _synchronousBridgeNodeXmpp = SynchronousBridgeNodeXmpp.getInstance();
            var _syncRet = _synchronousBridgeNodeXmpp.execBatchRegistration(accessToken,_createTargetUserList,_onExecBatchRegistrationCallBack);
            if(!_syncRet){
                _log.connectionLog(3, 'UserAccountManager#_requestCreateUser _syncRet is invalid');
                onExecBatchCreateCallBack(_getFailBatchResult());
            }

            //SynchronousBridgeNodeXmppからの登録のコールバック
            function _onExecBatchRegistrationCallBack(result, reason, extras, count, items){
                _log.connectionLog(7, 'UserAccountManager#_onExecBatchRegistrationCallBack items ' + JSON.stringify(items));
                if(!result){
                    _log.connectionLog(3, 'UserAccountManager#_onExecBatchRegistrationCallBack responce error');
                    onExecBatchCreateCallBack(_getFailBatchResult());
                    return;
                }
                // 呼び出し元へ返すレスポンスデータを作成
                _setResponseDataToResultList(items, _resultList, _notApplicableIndexToErrorReasonsMap);
                if(!_resultList){
                    _log.connectionLog(7, 'UserAccountManager#_onExecBatchRegistrationCallBack _resultList is invaild');
                    _resultList = _getFailBatchResult();
                }
                var assignRoleToUserResult = [];
                var listLength = _createTargetUserList.length;
                for(var i = 0; i < listLength; i++){
                    assignRoleToUserResult.push(
                        AccountTypeManager.assignRoleToUser(
                            accessToken, _createTargetUserList[i]['AccountType'], _createTargetUserList[i]['personData']['_userName']
                        )
                    );
                }
                Promise.all(assignRoleToUserResult)
                .then(function(result){
                    for(var i = 0; i < result.length; i++){
                        if(result[i]['result'] == false){
                            var assignRoleErr = {};
                            assignRoleErr.result = false;
                            assignRoleErr.reasons = [ ERR_REASON_FAIL_ASSIGN_ACCOUNT_TYPE ];
                            _resultList.push(assignRoleErr);
                            break;
                        }
                    }
                    onExecBatchCreateCallBack(_resultList);
                });
            }
        }
        //CSVデータから登録対象ユーザのハッシュマップを作成
        //中身
        /*
         * @return {Array}
        [
            {
                account : アカウント名,
                nickname : ニックネーム(UTF-8でURIエンコード済み),
                group : [グルーム名1(UTF-8でURIエンコード済み),...]
            },
            ...
        ]
        */
        function _getCreateTargetUserDataList(csvDataArray, notApplicableIndexToErrorReasonsMap){
            var _ret = [];
            if (csvDataArray == null || typeof csvDataArray != 'object') {
                _log.connectionLog(4, 'UserAccountManager#_getCreateTargetUserDataList :: csvDataArray is invalid');
                return _ret;
            }
            if (notApplicableIndexToErrorReasonsMap == null || typeof notApplicableIndexToErrorReasonsMap != 'object') {
                _log.connectionLog(4, 'UserAccountManager#_getCreateTargetUserDataList :: notApplicableIndexToErrorReasonsMap is invalid');
                return _ret;
            }
            //登録対象ユーザのリストを作成
            var _targetCount = csvDataArray.length;
            for(var _j = 0; _j < _targetCount; _j++){
                //登録除外ユーザに含まれている場合は処理しない
                if(notApplicableIndexToErrorReasonsMap['' + _j]){
                    continue;
                }
                var _targetData = csvDataArray[_j];
                var _personData = PersonData.create();
                var _account = _targetData.account;
                _personData.setUserName(_targetData.account);
                _personData.setMail(_targetData.email);
                var _nickName = (!_targetData.nickname) ? '' : _targetData.nickname;
                _personData.setNickName(encodeURIComponent(_nickName));
                var _groupStr = _targetData.group;
                var _groupArray = _groupStr.split( /\n/g );
                var _retGroups = new Array();
                //エンコード
                for(var _k = 0; _k < _groupArray.length; _k++){
                    var _groupName = Utils.trim(_groupArray[_k]);
                    if(_groupName == '') {
                        continue;
                    }
                    _retGroups.push(encodeURIComponent(_groupName));
                }
                _personData.setGroup(_retGroups);
                var _password = _targetData.password;
                var _registeredContactData = RegisteredContactData.create();
                _registeredContactData.setType(RegisteredContactData.TYPE_NONE);
                var _requestData = {};
                _requestData.personData = _personData;
                _requestData.password = _password;
                _requestData.registeredContactData = _registeredContactData;
                _requestData.AccountType = _targetData.AccountType;
                _requestData.delete_flg = _targetData.delete_flg;
                _ret.push(_requestData);
            }
            return _ret;
        }

        //ユーザ登録から除外するユーザハッシュマップを作成
        //return
        /*
        {
            csvDataArrayのindex番号を文字列化したもの: {
                [除外理由1,除外理由2...]
            }
        }
        */
        function _getNotApplicableIndexMap(csvDataArray, roleList=null){
            //ユーザ登録から除外するユーザリスト
            var _notApplicableIndexMap = {};
            if(!csvDataArray){
                return _notApplicableIndexMap;
            }

            //CSVの1行分のデータのバリデーションチェック
            var _count = csvDataArray.length;
            for(var _i = 0; _i < _count; _i++){
                var _csvRowData = csvDataArray[_i];
                var _checkRet = _checkCsvRowData(_csvRowData, roleList);
                if(!_checkRet.result){
                    var _reasonsCount = _checkRet.reasons.length
                    for(var _k = 0; _k < _reasonsCount; _k++){
                        var _errReason = _checkRet.reasons[_k];
                        _setResultToHashMap(_notApplicableIndexMap, '' + _i, _errReason)
                    }
                }
            }

            //CSV内のアカウントの重複チェック
            var _checkAccountResult = _getDuplicateAccountIndexListFromCsvDataArray(csvDataArray);
            //CSV内のメールアドレスの重複チェック
            //step2-sprint12ではメールの登録を行わないためコメントアウト
            //var _checkEmailResult = _getDuplicateEmailIndexListFromCsvDataArray(csvDataArray);

            //アカウントの重複チェック結果とマージ
            for(var _j = 0; _j < _checkAccountResult.length; _j++){
                var _duplicateAccount = _checkAccountResult[_j];
                _setResultToHashMap(_notApplicableIndexMap, '' + _duplicateAccount, ERROR_REASON_DUPLICATE_ACCOUNT_IN_CSV)
            }
            //メールアドレスの重複チェック結果とマージ
            //step2-sprint12ではメールの登録を行わないためコメントアウト
            /*
            for(var _l = 0; _l < _checkEmailResult.length; _l++){
                var _duplicateEmail = _checkEmailResult[_l];
                _setResultToHashMap(_notApplicableIndexMap, '' + _duplicateEmail, ERROR_REASON_DUPLICATE_EMAIL_IN_CSV)
            }
            */

            return _notApplicableIndexMap;

            //reasonを引数のリストにセットする
            function _setResultToHashMap(baseHashMap, key, reason){
                if (baseHashMap == null) {
                    return;
                }
                baseHashMap[key] = baseHashMap[key] || [];
                baseHashMap[key].push(reason);
            }
        }
        //【未使用】CSV内のメールアドレスの重複チェック
        /*
         * return メールアドレスが重複しているindexのリスト [【csvDataArrayのindex番号】,...]
        [
             【csvDataArrayのindex番号】
        ]
        */
        function _getDuplicateEmailIndexListFromCsvDataArray(csvDataArray){
            if(!csvDataArray){
                return null;
            }
            // メールアドレスが重複しているcsvDataArrayのindexを格納する変数
            var _resultCheckDuplicateEmailList = new Array();
            var _accountArray = new Array();
            // メールアドレス毎に出現回数を格納
            var _checkHash = {};
            var _count = csvDataArray.length;
            for(var _i = 0; _i < _count; _i++){
                var _csvData = csvDataArray[_i];
                var _email = _csvData.email;
                if(_email == '') {
                    continue;
                }
                if(_checkHash[_email]){
                    // アカウントが重複しているので、返却値に追加
                    if(_checkHash[_email].isFirst) {
                        _resultCheckDuplicateEmailList.push(_checkHash[_email].firstIndex);
                        _checkHash[_email].isFirst = false;
                        _log.connectionLog(3, 'UserAccountManager#_getDuplicateEmailIndexListFromCsvDataArray (Create) :: csvData.email is duplicate. account : ' + _email + ' : ' + _checkHash[_email].firstIndex);
                    }
                    _resultCheckDuplicateEmailList.push(_i);
                    _log.connectionLog(3, 'UserAccountManager#_getDuplicateEmailIndexListFromCsvDataArray (Create) :: csvData.email is duplicate ' + _email + ' : ' + _i);
                }else{
                    _checkHash[_email] = {firstIndex: _i, isFirst: true};
                }
            }
            return _resultCheckDuplicateEmailList;
        }
        //CSVの1行分のデータのバリデーションチェック
        /* return
        {
              result : true/false,
              reasons : []
        }
        */
        function _checkCsvRowData(csvRowData, roleList=null){
            var _ret = {};
            _ret.result = true;
            _ret.reasons = new Array();
            if(csvRowData == null || typeof csvRowData != 'object') {
                _log.connectionLog(3, 'UserAccountManager#_checkCsvRowData :: csvData is null');
                _ret.result = false;
                _ret.reason.push(ERR_REASON_ERROR_PARAM);
                return _ret;
            }
            if(!_checkAccountFormat(csvRowData.account)){
                _log.connectionLog(3, 'UserAccountManager#_checkCsvRowData :: csvRowData.account is wrong format');
                _ret.result = false;
                _ret.reasons.push(ERR_REASON_ACCOUNT_WRONG_FORMAT);
            }
            if(!_checkAccountSize(csvRowData.account)){
                _log.connectionLog(3, 'UserAccountManager#_checkCsvRowData :: csvData.account is over size 252');
                _ret.result = false;
                _ret.reasons.push(ERR_REASON_ACCOUNT_OVER_MAX_SIZE);
            }
            //step2-sprint12ではメールの登録を行わないためコメントアウト
            /*
            if(!_checkEmaiFormat(csvRowData.email)){
                _log.connectionLog(3, 'UserAccountManager#_checkCsvRowData :: csvData.email is wrong format');
                _ret.result = false;
                _ret.reasons.push(ERR_REASON_EMAIL_WRONG_FORMAT);
            }
            */
            if(!_checkPasswordSize(csvRowData.password)){
                _log.connectionLog(3, 'UserAccountManager#_checkCsvRowData :: csvData.password is invalid');
                _ret.result = false;
                _ret.reasons.push(ERR_REASON_PASSWORD_SIZE);
            }
            if(!_checkNicknameSize(csvRowData.nickname)){
                _log.connectionLog(3, 'UserAccountManager#_checkCsvRowData :: csvData.nickname is invalid');
                _ret.result = false;
                _ret.reasons.push(ERR_REASON_NICKNAME_SIZE);
            }
            if(csvRowData.AccountType == ""){
              _log.connectionLog(3, 'UserAccountManager#_checkCsvRowData :: csvData.AccountType is invalid');
              _ret.result = false;
              _ret.reasons.push(ERR_REASON_ACCOUNT_TYPE_EMPTY);
            }else if(!_checkAccountTypeExist(csvRowData.AccountType, roleList)){
              _log.connectionLog(3, 'UserAccountManager#_checkCsvRowData :: csvData.AccountType is invalid');
              _ret.result = false;
              _ret.reasons.push(ERR_REASON_NO_EXIST_ACCOUNT_TYPE);
            }
            if(_ret.result){
                _ret.reasons = [ ERR_REASON_NON ];
            }
            return _ret;
        }
    };

    /**
     * 一括更新処理
     * @param {String} accessToken アクセストークン
     * @param {String} csvFilePath csvのファイルパス
     * @param {function} onExecBatchUpdateCallBack ユーザ一括更新のコールバック関数
     * @param {object} roleList アカウントタイプ一覧
     * @returns {boolean} Openfireのアカウント文字列
     */
    _proto.execBatchUpdate = function(accessToken, csvFilePath, onExecBatchUpdateCallBack, roleList=null) {
        var _ret = false;
        if (accessToken == null || typeof accessToken != 'string') {
            _log.connectionLog(4, 'UserAccountManager.execBatchUpdate::accessToken is invalid');
            return false;
        }
        if (csvFilePath == null || typeof csvFilePath != 'string') {
            _log.connectionLog(4, 'UserAccountManager.csvFilePath is invalid');
            return false;
        }
        if (onExecBatchUpdateCallBack == null || typeof onExecBatchUpdateCallBack != 'function') {
            _log.connectionLog(4, 'UserAccountManager.onExecBatchUpdateCallBack is invalid');
            return false;
        }
        //更新処理結果格納用の内部変数（一括登録の結果内容の形式と同じ）
        //中身
        /*
        [
             {
                 result : true/false,
                 csvRow : csvファイルの行数,
                 reasons : []
             }
        ]
        */
        var _resultList = new Array();

        // CSVファイルの解析
        CsvFileManager.toArray(csvFilePath, _onToArrayFromCsvFile);
        return true;

        // CSVファイル解析後のコールバック
        function _onToArrayFromCsvFile(csvDataArray){
            //ユーザ登録要求処理
            _requestUpdateUser(csvDataArray);
        };

        //ユーザ更新要求処理
        function _requestUpdateUser(csvDataArray){
            if(!csvDataArray){
                //csvの読み込み失敗とし
                //コールバックを呼ぶ
                _log.connectionLog(4, 'csvDataArray is invalid');
                onExecBatchUpdateCallBack(_getFailReadCsvResult());
                return;
            }
            //CSVファイルの整形
            for(var _idx = 0; _idx < csvDataArray.length; _idx++){
                var _csvData = csvDataArray[_idx];
                _csvData.account = _csvData.account || '';
                _csvData.nickname = Utils.excludeControleCharacters(_csvData.nickname) || '';
                _csvData.group = _csvData.group || '';
                _csvData.AccountType = _csvData.AccountType || '';
                _csvData.delete_flg = _csvData.DeleteFlag || 0;
            }
            //csvDataArrayの要素数が0のときは
            //csvのフォーマット不正としコールバックを呼ぶ
            if(csvDataArray.length == 0){
                _log.connectionLog(4, 'csvDataArray is invalid');
                onExecBatchUpdateCallBack(_getWrongFormatCsvResult());
                return;
            }

            //登録処理結果格納用の内部変数
            //初期値はデフォルトでfalse
            var _errorReasonDefault = [ERR_REASON_ERROR_PARAM];
            for(var _i = 0; _i < csvDataArray.length; _i++){
                var _retObj = {};
                _retObj.result = false;
                _retObj.reasons = _errorReasonDefault;
                _retObj.csvRow = _i + 2;
                _resultList.push(_retObj);
            }

            //バリデーションチェックを行い、ユーザ登録から除外するユーザハッシュマップを取得
            var _notApplicableIndexToErrorReasonsMap = _getNotApplicableIndexMap(csvDataArray, roleList);
            var _notApplicableIndexMapCount = 0;
            //上記の登録除外ユーザを_resultListにマージする
            for(var _indexStr in _notApplicableIndexToErrorReasonsMap){
                var _index = +_indexStr;    // 数値化
                _resultList[_index].result = false;
                _resultList[_index].reasons = _notApplicableIndexToErrorReasonsMap[_indexStr];
                _notApplicableIndexMapCount++;
            }

            //登録除外のマップとcsvDataArrayの要素数が同じ場合は以降の処理はしない
            if(csvDataArray.length == _notApplicableIndexMapCount){
                onExecBatchUpdateCallBack(_resultList);
                return;
            }

            //SynchronousBridgeNodeXmppへ送る更新対象ユーザの配列を作成
            var _updateTargetUserList = _getUpdateTargetUserDataList(csvDataArray, _notApplicableIndexToErrorReasonsMap);

            //SynchronousBridgeNodeXmppへ更新要求を送る
            var _synchronousBridgeNodeXmpp = SynchronousBridgeNodeXmpp.getInstance();
            var _syncRet = _synchronousBridgeNodeXmpp.execBatchUpdate(accessToken, _updateTargetUserList, _onExecBatchUpdateCallBack);
            if(!_syncRet){
                _log.connectionLog(3, 'UserAccountManager#_requestCreateUser _syncRet is invalid');
                onExecBatchUpdateCallBack(_getFailBatchResult());
            }

            //SynchronousBridgeNodeXmppからの更新のコールバック
            function _onExecBatchUpdateCallBack(result, reason, extras, count, items){
                _log.connectionLog(7, 'UserAccountManager#_onExecBatchUpdateCallBack items ' + JSON.stringify(items));
                if(!result){
                    _log.connectionLog(3, 'UserAccountManager#_onExecBatchUpdateCallBack responce error. reason : ' + reason);
                    onExecBatchUpdateCallBack(_getFailBatchResult());
                    return;
                }
                // 呼び出し元へ返すレスポンスデータを作成
                _setResponseDataToResultList(items, _resultList, _notApplicableIndexToErrorReasonsMap);
                if(!_resultList){
                    _log.connectionLog(7, 'UserAccountManager#_onExecBatchUpdateCallBack _resultList is invaild');
                    _resultList = _getFailBatchResult();
                }
                var assignRoleToUserResult = [];
                for(var i = 0; i < _updateTargetUserList.length; i++){
                  assignRoleToUserResult.push(
                    AccountTypeManager.assignRoleToUser(
                      accessToken, _updateTargetUserList[i]['AccountType'], _updateTargetUserList[i]['account']
                    )
                  );
                }
                Promise.all(assignRoleToUserResult).then(function(result){
                  for(var i = 0; i < result.length; i++){
                    if(result[i]['result'] == false){
                      var assignRoleErr = {};
                      assignRoleErr.result = false;
                      assignRoleErr.reasons = [ ERR_REASON_FAIL_ASSIGN_ACCOUNT_TYPE ];
                      _resultList.push(assignRoleErr);
                      break;
                    }
                  }
                  onExecBatchUpdateCallBack(_resultList);
                });
            };
        };

        //ユーザ一括更新データから除外するデータのハッシュマップを作成
        //return
        /*
        {
            csvDataArrayのindex番号を文字列化したもの: {
                [除外理由1,除外理由2...]
            }
        }
        */
        function _getNotApplicableIndexMap(csvDataArray, roleList=null){
            //ユーザ登録から除外するユーザリスト
            var _notApplicableIndexToReasonsMap = {};
            if(!csvDataArray){
                return _notApplicableIndexToReasonsMap;
            }

            //CSVの1行分のデータのバリデーションチェック
            for(var _i = 0; _i < csvDataArray.length; _i++){
                var _csvRowData = csvDataArray[_i];
                var _checkRet = _checkCsvRowData(_csvRowData, roleList);
                if(!_checkRet.result){
                    _notApplicableIndexToReasonsMap['' + _i] = _checkRet.reasons;
                }
            }

            //CSV内のアカウントの重複チェック
            var _duplicateAccountIndexList = _getDuplicateAccountIndexListFromCsvDataArray(csvDataArray);

            //アカウントの重複チェック結果とマージ
            for(var _j = 0; _j < _duplicateAccountIndexList.length; _j++){
                var _duplicateAccountIndex = _duplicateAccountIndexList[_j];
                var _indexStr = '' + _duplicateAccountIndex;
                _notApplicableIndexToReasonsMap[_indexStr] = _notApplicableIndexToReasonsMap[_indexStr] || [];
                _notApplicableIndexToReasonsMap[_indexStr].push(ERROR_REASON_DUPLICATE_ACCOUNT_IN_CSV);
            }
            return _notApplicableIndexToReasonsMap;
        };

        /* CSVの1行分のデータのバリデーションチェック
         * return {object} { result : true/false, reasons : [理由1, 理由2,...]}
         */
        function _checkCsvRowData(csvRowData, roleList=null){
            var _ret = {};
            _ret.result = true;
            _ret.reasons = new Array();
            if(csvRowData == null || typeof csvRowData != 'object') {
                _log.connectionLog(3, 'UserAccountManager#_checkCsvRowData(Update) :: csvData is null');
                _ret.result = false;
                _ret.reason.push(ERR_REASON_ERROR_PARAM);
                return _ret;
            }
            if(csvRowData.account == '' && csvRowData.nickname == '' && csvRowData.group == '') {
                _ret.result = false;
                _ret.reasons.push(ERR_REASON_SKIP_DATA);
                return _ret;
            }
            if(!_checkAccountFormat(csvRowData.account)){
                _log.connectionLog(3, 'UserAccountManager#_checkCsvRowData (Update) :: csvRowData.account is wrong format. account : ' + csvRowData.account);
                _ret.result = false;
                _ret.reasons.push(ERR_REASON_ACCOUNT_WRONG_FORMAT);
            }
            if(!_checkAccountSize(csvRowData.account)){
                _log.connectionLog(3, 'UserAccountManager#_checkCsvRowData (Update) :: csvData.account is over size 252. account : ' + csvRowData.account);
                _ret.result = false;
                _ret.reasons.push(ERR_REASON_ACCOUNT_OVER_MAX_SIZE);
            }
            if(!_checkNicknameSize(csvRowData.nickname)){
                _log.connectionLog(3, 'UserAccountManager#_checkCsvRowData (Update) :: csvData.nickname is invalid. account : ' + csvRowData.nickname);
                _ret.result = false;
                _ret.reasons.push(ERR_REASON_NICKNAME_SIZE);
            }
            if(csvRowData.AccountType == ""){
              _log.connectionLog(3, 'UserAccountManager#_checkCsvRowData :: csvData.AccountType is invalid');
              _ret.result = false;
              _ret.reasons.push(ERR_REASON_ACCOUNT_TYPE_EMPTY);
            }else if(!_checkAccountTypeExist(csvRowData.AccountType, roleList)){
              _log.connectionLog(3, 'UserAccountManager#_checkCsvRowData :: csvData.AccountType is invalid');
              _ret.result = false;
              _ret.reasons.push(ERR_REASON_NO_EXIST_ACCOUNT_TYPE);
            }
            if(csvRowData.delete_flg != 0 &&
               csvRowData.delete_flg != 2 &&
               csvRowData.delete_flg != ""){
              _log.connectionLog(3, 'UserAccountManager#_checkCsvRowData :: csvData.delete_flg is invalid');
              _ret.result = false;
              _ret.reasons.push(ERR_REASON_DELETE_FLG_NOT_NUMBER);
            }
            if(_ret.result){
                _ret.reasons = [ ERR_REASON_NON ];
            }
            return _ret;
        };

        /** CSVデータから更新対象ユーザのリストを作成
         * @return {Array}
        [
            {
                account : アカウント名,
                nickname : ニックネーム(UTF-8でURIエンコード済み),
                group : [グルーム名1(UTF-8でURIエンコード済み),...]
            },
            ...
        ]
        **/
        function _getUpdateTargetUserDataList(csvDataArray, notApplicableIndexToErrorReasonsMap){
            var _ret = [];
            if (csvDataArray == null || typeof csvDataArray != 'object') {
                _log.connectionLog(4, 'UserAccountManager#_getUpdateTargetUserDataList (Update) :: csvDataArray is invalid');
                return _ret;
            }
            if (notApplicableIndexToErrorReasonsMap == null || typeof notApplicableIndexToErrorReasonsMap != 'object') {
                _log.connectionLog(4, 'UserAccountManager#_getUpdateTargetUserDataList (Update) :: notApplicableIndexToErrorReasonsMap is invalid');
                return _ret;
            }

            //登録対象ユーザのリストを作成
            var _targetCount = csvDataArray.length;
            for(var _i = 0; _i < _targetCount; _i++){
                //登録除外ユーザに含まれている場合は処理しない
                if(notApplicableIndexToErrorReasonsMap['' + _i]){
                    continue;
                }
                var _userData = {};
                var _targetData = csvDataArray[_i];
                _userData.account = _targetData.account;
                _userData.nickname = encodeURIComponent(_targetData.nickname);
                var _groupStr = _targetData.group;
                var _groupArray = _groupStr.split( /\n/g );
                var _retGroups = new Array();
                //エンコード
                for(var _j = 0; _j < _groupArray.length; _j++){
                    var _groupName = Utils.trim(_groupArray[_j]);
                    if(_groupName == '') {
                        continue;
                    }
                    _retGroups.push(encodeURIComponent(_groupName));
                }
                _userData.group = _retGroups;
                _userData.AccountType = _targetData.AccountType;
                _userData.delete_flg = _targetData.delete_flg;
                _ret.push(_userData);
            }
            return _ret;
        };
    };
    //一括処理失敗時の結果
    function _getFailBatchResult(){
        var _resultData = {};
        _resultData.result = false;
        _resultData.reasons = [ ERROR_REASON_INTERNAL_SERVER_ERROR ];
        return [ _resultData ];
    };
    //CSVファイル読み込み失敗時の結果
    function _getFailReadCsvResult(){
        var _resultData = {};
        _resultData.result = false;
        _resultData.reasons = [ ERR_REASON_FAIL_READ_CSV ];
        return [ _resultData ];
    };
    //CSVファイルフォーマット不正の結果
    function _getWrongFormatCsvResult(){
        var _resultData = {};
        _resultData.result = false;
        _resultData.reasons = [ ERR_REASON_WRONG_CSV_FORMAT ];
        return [ _resultData ];
    };
    /* CSV内の重複アカウントの取得
     * return アカウントが重複しているindexのリスト [【csvDataArrayのindex番号】,...]
    */
    function _getDuplicateAccountIndexListFromCsvDataArray(csvDataArray){
        if(!csvDataArray){
            return null;
        }
        // アカウントが重複しているcsvDataArrayのindexを格納する変数
        var _resultCheckDuplicateAccountList = new Array();
        var _accountArray = new Array();
        //アカウント毎に出現回数を格納
        var _checkHash = {};
        var _count = csvDataArray.length;
        for(var _i = 0; _i < _count; _i++){
            var _csvData = csvDataArray[_i];
            var _account = _csvData.account;
            if(_account == '') {
                continue;
            }
            if(_checkHash[_account]){
                // アカウントが重複しているので、返却値に追加
                if(_checkHash[_account].isFirst) {
                    _resultCheckDuplicateAccountList.push(_checkHash[_account].firstIndex);
                    _checkHash[_account].isFirst = false;
                    _log.connectionLog(3, 'UserAccountManager#_getDuplicateAccountIndexListFromCsvDataArray (Update) :: csvData.account is duplicate. account : ' + _account + ' : ' + _checkHash[_account].firstIndex);
                }
                _resultCheckDuplicateAccountList.push(_i);
                _log.connectionLog(3, 'UserAccountManager#_getDuplicateAccountIndexListFromCsvDataArray (Update) :: csvData.account is duplicate ' + _account + ' : ' + _i);
            }else{
                _checkHash[_account] = {firstIndex: _i, isFirst: true};
            }
        }
        return _resultCheckDuplicateAccountList;
    };
    //レスポンスデータに結果をマージする(一括登録・更新用)
    /* return
    [
          {
             result : true/false,
             reasons : []
          }
    ]
    */
    function _setResponseDataToResultList(items, resultList, notApplicableIndexToErrorReasonsMap){
        if (items == null || typeof items != 'object') {
            _log.connectionLog(4, 'UserAccountManager#_setResponseDataToResultList :: items is invalid');
            return;
        }
        if (resultList == null || typeof resultList != 'object') {
            _log.connectionLog(4, 'UserAccountManager#_setResponseDataToResultList :: resultList is invalid');
            return;
        }
        if (notApplicableIndexToErrorReasonsMap == null || typeof notApplicableIndexToErrorReasonsMap != 'object') {
            _log.connectionLog(4, 'UserAccountManager#_setResponseDataToResultList :: notApplicableIndexToErrorReasonsMap is invalid');
            return;
        }
        var _itemsCount = items.length;
        var _nextIndex = 0;
        for(var _i = 0; _i < _itemsCount; _i++){
            var _item = items[_i];
            var _j = _nextIndex;
            for( ; _j < resultList.length; _j++) {
                if(!notApplicableIndexToErrorReasonsMap['' + _j]){
                    _nextIndex = _j;
                    break;
                }
            }
            if(_j == resultList.length) {
                // マージデータの上限を超えた（要求データの個数と結果データの個数の不一致が起こっている）
                _log.connectionLog(4, 'UserAccountManager#_setResponseDataToResultList (Update) :: merge data invalid');
                break;
            }
            resultList[_nextIndex].result = _item.result;
            resultList[_nextIndex].reasons = [ _getReasonFromSynchronousResponceReason(_item.reason) ];
            _nextIndex++;
        }
    };
    /**
     * 削除
     * @param {String} loginAccount cubeeのログインアカウント
     * @returns {String} Openfireのアカウント文字列
     */
    _proto.deleteUser = function(loginAccount) {
    };
    /**
     * ユーザアカウントデータの取得
     * @param {number} id ユーザ管理テーブルのID
     * @param {string} tenantId テナントID
     * @returns {boolean} 処理開始成功 : true / 処理開始失敗 : false
     */
    _proto.getUserAccountData = function(id, tenantId, onGetUserAccountDataCallBack) {
        if (id == null || typeof id != 'number') {
            _log.connectionLog(4, 'id is invalid');
            return false;
        }
        if (tenantId == null || typeof tenantId != 'string') {
            _log.connectionLog(4, 'tenantId is invalid');
            return false;
        }
        if (onGetUserAccountDataCallBack == null || typeof onGetUserAccountDataCallBack != 'function') {
            _log.connectionLog(4, 'onGetUserAccountDataCallBack is invalid');
            return false;
        }
        var _globalSNSManagerDbConnector = GlobalSNSManagerDbConnector.getInstance();
        return _globalSNSManagerDbConnector.getConnection(_onGetConnectionCallBack);

        function _onGetConnectionCallBack(err, connection){
            if(err){
                _log.connectionLog(3,'UserAccountManager#getUserAccountData : ' + err);
                onGetUserAccountDataCallBack(null);
                return;
            }
            var _sql = 'SELECT * FROM user_account_store WHERE id = ' + id;
            //TODO: テナントIDの仕様が決定した場合はここでテナントをしぼるようにする
            connection.query(_sql,_onGetUserAccountData);

            function _onGetUserAccountData(err, result){
                connection.end(function(endErr){
                    if(endErr){
                        _log.connectionLog(3,'UserAccountManager#getUserAccountData : DB disconect err :: ' + endErr);
                    }
                    if(err){
                        _log.connectionLog(3,'UserAccountManager#getUserAccountData : ' + err.name + ':: ' + err.message);
                        _log.connectionLog(3,'UserAccountManager#getUserAccountData _sql : ' + _sql);
                        onGetUserAccountDataCallBack(null);
                        return;
                    }
                    var _userAcountData = null;
                    if(result && result.length > 0){
                        _userAcountData = UserAccountData.create(result[0]);
                    }
                    onGetUserAccountDataCallBack(_userAcountData);
                });
            };
        };
    };

    /**
     * 全てのユーザアカウントデータの取得(CSVファイル出力用)
     * @patam {string} accessToken アクセストークン
     * @param {string} tenantId テナントID(テナント指定せずに全ての場合はnull)
     * @param {function} getAllUserListCallback コールバック関数
     * @returns {boolean} 処理開始成功 : true / 処理開始失敗 : false
     */
    _proto.getAllUserListForOutputCsv = function(accessToken, tenantId, getAllUserListCallback) {
        if(getAllUserListCallback == null || typeof getAllUserListCallback != 'function') {
            _log.connectionLog(3,'UserAccountManager#getAllUserList : getAllUserListCallback is not a function.');
            return false;
        }
        var _synchronousBridgeNodeXmpp = SynchronousBridgeNodeXmpp.getInstance();
        return _synchronousBridgeNodeXmpp.getAllUserListForAdmin(
            accessToken, _getAllUserListCallBackFanc, tenantId);
        function _getAllUserListCallBackFanc(result, reason, extras, items) {
            var _ret = null;
            if(!result) {
                getAllUserListCallback(_ret);
            }
            var _openFireUserDataMap = {};
            var _itemCount = items.length;
            for(var _i = 0; _i < _itemCount; _i++) {
                var _item = items[_i];
                _openFireUserDataMap[_item.jid] = _item;
            }

            var _globalSNSManagerDbConnector = GlobalSNSManagerDbConnector.getInstance();
            var _dbConnection = null;
            _globalSNSManagerDbConnector.getConnection(_onGetConnectionCallBack);
            function _onGetConnectionCallBack(err, connection){
                if(err){
                    _log.connectionLog(3,'UserAccountManager#getAllUserList : ' + err);
                    getAllUserListCallback(_ret);
                    return;
                }
                _dbConnection = connection;
                var _sql = 'SELECT login_account, openfire_account, xmpp_server_name, delete_flg FROM user_account_store';
                if(tenantId) {
                    _sql += ' WHERE tenant_uuid = \'' + tenantId + '\'';
                }
                _sql += ' ORDER BY login_account';
                _dbConnection.query(_sql, _onGetUserList);
            }
            function _onGetUserList(err, result){
                _dbConnection.end(function(endErr) {
                    if(endErr){
                        _log.connectionLog(3,'UserAccountManager#getAllUserList : DB disconect err :: ' + endErr);
                    }
                    _dbConnection = null;
                    if(err){
                        _log.connectionLog(3,'UserAccountManager#getAllUserList : ' + err);
                        _log.connectionLog(3,'UserAccountManager#getAllUserList _sql : ' + _sql);
                        getAllUserListCallback(_ret);
                        return;
                    }
                    var _userAcountDataList = new Array();
                    var _count = result.length;
                    // サーバ管理者のJID
                    var _xmppAdminAccount = _conf.getConfData('XMPP_SERVER_ADMIN_ACCOUNT');
                    for(var _i = 0; _i < _count; _i++) {
                        var _userAccountData = UserAccountData.create(result[_i]);
                        var _jid = _userAccountData.getOpenfireAccount() + '@' + _userAccountData.getXmppServerName();
                        var _adminJid = _xmppAdminAccount + '@' + _userAccountData.getXmppServerName();
                        // サーバ管理者アカウントは除外する
                        if(_jid == _adminJid) {
                            continue;
                        }
                        // ハッシュから取り出す
                        var _openFireUserData = _openFireUserDataMap[_jid];
                        if(_openFireUserData == null) {
                            _log.connectionLog(7,'UserAccountManager#getAllUserList : _openFireUserData is null. jid : ' + _jid);
                            continue;
                        }
                        var _userData = new Array();
                        // アカウント
                        _userData.push(_userAccountData.getLoginAccount());
                        // ニックネーム
                        var _nickName = decodeURIComponent(_openFireUserData.nickName);
                        if(_nickName == '') {
                            _nickName = _userAccountData.getLoginAccount();
                        }
                        _userData.push(_nickName);
                        // グループ
                        var _groupArray = _openFireUserData.group;
                        var _groupDataString = '';
                        for(var _j = 0; _j < _groupArray.length; _j++) {
                            if(_j > 0) {
                                _groupDataString += '\r\n';
                            }
                            _groupDataString += decodeURIComponent(_groupArray[_j]);
                        }
                        _userData.push(_groupDataString);
                        // 削除フラグ
                        _userData.push(_userAccountData.getDeleteFlg());
                        // データを配列に追加
                        _userAcountDataList.push(_userData);
                    }
                    getAllUserListCallback(_userAcountDataList);
                });
            };
        };
    };

    /**
     * ユーザアカウントのステータス更新
     * @param {string} accessToken アクセストークン
     * @param {number} uid ユーザID
     * @param {string} tenantId テナントID(テナント指定せずに全ての場合はnull)
     * @param {number} accountStatus ステータス(0:アクティブ、1:削除済み、2:休止)
     * @param {function} onUpdatePasswordCallBack パスワード再設定のコールバック関数
     * @returns {boolean} 処理開始成功 : true / 処理開始失敗 : false
     */
    _proto.updateUserAccountStatus = function(accessToken, uid, tenantId, accountStatus, onUpdateUserAccountStatusCallback) {
        var _self = this;
        // 引数チェック
        if (accessToken == null || typeof accessToken != 'string') {
            _log.connectionLog(4, 'accessToken is invalid');
            return false;
        }
        if (uid == null || typeof uid != 'number') {
            _log.connectionLog(4, 'uid is invalid');
            return false;
        }
        if (tenantId == null || typeof tenantId != 'string') {
            _log.connectionLog(4, 'tenantId is invalid');
            return false;
        }
        if (accountStatus == null || typeof accountStatus != 'number') {
            _log.connectionLog(4, 'accountStatus is invalid');
            return false;
        }
        if (onUpdateUserAccountStatusCallback == null || typeof onUpdateUserAccountStatusCallback != 'function') {
            _log.connectionLog(4, 'onUpdateUserAccountStatusCallback is invalid');
            return false;
        }
        //ユーザアカウントデータの取得
        return _self.getUserAccountData(uid, tenantId, _onGetUserAccountDataCallBack);

        //ユーザアカウントデータ取得後のコールバック
        function _onGetUserAccountDataCallBack(userAccountData){
            if(!userAccountData){
                _log.connectionLog(3,'UserAccountManager#updateUserAccountStatus : UserNotFound uid :: ' + uid);
                onUpdateUserAccountStatusCallback(false);
                return;
            }
            var _loginAccount = userAccountData.getLoginAccount();
            var _synchronousBridgeNodeXmpp = SynchronousBridgeNodeXmpp.getInstance();
            var _ret = _synchronousBridgeNodeXmpp.updateUserAccountStatus(accessToken, _loginAccount, accountStatus, _updateUserAccountStatusCallBackFanc);
            if(!_ret){
                _log.connectionLog(3,'UserAccountManager#updateUserAccountStatus#_onGetUserAccountDataCallBack : fail update status / uid : ' + uid);
                onUpdateUserAccountStatusCallback(false);
            }
        }
        //ステータス更新後のコールバック
        function _updateUserAccountStatusCallBackFanc(result, reason){
            if(!result){
                _log.connectionLog(3,'UserAccountManager#updateUserAccountStatus : fail reason from SynchronousBridgeNodeXmpp :: ' + reason);
            }
            onUpdateUserAccountStatusCallback(result);
        }
    };

    var _userAccountManager = new UserAccountManager();

    UserAccountManager.getInstance = function() {
        return _userAccountManager;
    };
    exports.getInstance = UserAccountManager.getInstance;
    exports.ERR_REASON_NON = ERR_REASON_NON;
    exports.ERR_REASON_ERROR_PARAM = ERR_REASON_ERROR_PARAM;
    exports.ERR_REASON_ACCOUNT_EMPTY = ERR_REASON_ACCOUNT_EMPTY;
    exports.ERR_REASON_ACCOUNT_OVER_MAX_SIZE = ERR_REASON_ACCOUNT_OVER_MAX_SIZE;
    exports.ERR_REASON_PASSWORD_SIZE = ERR_REASON_PASSWORD_SIZE;
    exports.ERR_REASON_NOT_MATCH_PASSWORD_AND_CONFIRM_PASSWORD = ERR_REASON_NOT_MATCH_PASSWORD_AND_CONFIRM_PASSWORD;
    exports.ERR_REASON_EMAIL_EMPTY = ERR_REASON_EMAIL_EMPTY;
    exports.ERR_REASON_ACCOUNT_WRONG_FORMAT = ERR_REASON_ACCOUNT_WRONG_FORMAT;
    exports.ERR_REASON_EMAIL_WRONG_FORMAT = ERR_REASON_EMAIL_WRONG_FORMAT;
    exports.ERROR_REASON_EXIST_USER = ERROR_REASON_EXIST_USER;
    exports.ERROR_REASON_EXIST_MAILADDRESS = ERROR_REASON_EXIST_MAILADDRESS;
    exports.ERROR_REASON_INTERNAL_SERVER_ERROR = ERROR_REASON_INTERNAL_SERVER_ERROR;
    exports.ERROR_REASON_DUPLICATE_ACCOUNT_IN_CSV = ERROR_REASON_DUPLICATE_ACCOUNT_IN_CSV;
    exports.ERROR_REASON_DUPLICATE_EMAIL_IN_CSV = ERROR_REASON_DUPLICATE_EMAIL_IN_CSV;
    exports.ERR_REASON_NICKNAME_SIZE = ERR_REASON_NICKNAME_SIZE;
    exports.ERR_REASON_WRONG_CSV_FORMAT = ERR_REASON_WRONG_CSV_FORMAT;
    exports.ERR_REASON_SKIP_DATA = ERR_REASON_SKIP_DATA;
    exports.ERR_REASON_FAIL_READ_CSV = ERR_REASON_FAIL_READ_CSV;
    exports.ERR_REASON_ACCOUNT_TYPE_EMPTY = ERR_REASON_ACCOUNT_TYPE_EMPTY;
    exports.ERR_REASON_NO_EXIST_ACCOUNT_TYPE = ERR_REASON_NO_EXIST_ACCOUNT_TYPE;
    exports.ERR_REASON_FAIL_ASSIGN_ACCOUNT_TYPE = ERR_REASON_FAIL_ASSIGN_ACCOUNT_TYPE;
    exports.ERR_REASON_GROUP_MAX_COUNT = ERR_REASON_GROUP_MAX_COUNT;
    exports.ERR_REASON_GROUP_MAX_SIZE = ERR_REASON_GROUP_MAX_SIZE;
    exports.ERR_REASON_DELETE_FLG_NOT_NUMBER = ERR_REASON_DELETE_FLG_NOT_NUMBER;

})();
