(function() {
    /*
     * GET user routes
     */
    var Utils = require('../../../../scripts/utils');
    var SynchronousBridgeNodeXmpp = require('../../../../scripts/controller/synchronous_bridge_node_xmpp');
    var ServerLog = require('../../../../scripts/controller/server_log');
    var Conf = require('../../../../scripts/controller/conf');
    var ReadCacheBeforeDBChef = require('../../../../scripts/lib/CacheHelper/read_cache_before_db_chef');
    var TenantXmppData = require('../../../../scripts/lib/CacheHelper/tenant_xmpp_data');
    var TenantData = require('../../../../scripts/lib/CacheHelper/tenant_data');
    var log = ServerLog.getInstance();
    var _conf = Conf.getInstance();
    var location = _conf.getConfData('SYSTEM_LOCATION_ROOT');
    var _product_name = _conf.getConfData('PRODUCT_NAME');
    if(_product_name == null || _product_name == ''){
        _product_name = 'cubee'; //設定値がない場合はDefaultとしてcubeeを設定
    }
    var UserAccountManager = require('../../../controller/user_account_manager');
    var _userAccountManager = UserAccountManager.getInstance();

    var AccountTypeManager = require('../../../controller/account_type_manager');

    var Paginator = require('../../../controller/pagination');

    var CsvFileManager = require('../../../controller/csv_file_manager');

    var LicenseManager = require('../../../controller/license_manager');
    var _licenseManager = LicenseManager.getInstance();  //ライセンスチェック用

    var path = require('path');

    //定数定義
    var TITLE_USER_LIST = "ユーザ一覧";
    var TITLE_USER_NEW = "ユーザ新規登録";
    var TITLE_USER_UPDATE = "ユーザ更新";
    var TITLE_CSV_REG = "ユーザ一括登録";
    var TITLE_CSV_UPD = "ユーザ一括更新";

    var ACCOUNT_LABEL = 'Account';
    var NICKNAME_LABEL = 'Nickname';
    var EMAIL_LABEL = 'Email';
    var PASSWORD_LABEL = 'Password';
    var CONFIRM_PASSWORD_LABEL = 'Confirm Password';
    var CHANGE_PASSWORD_LABEL = 'Change Password';
    var ACCOUNT_TYPE_LABEL = 'Account Type';
    var REGISTER_BUTTON_LABEL = '登録';
    var UPDATE_BUTTON_LABEL = '更新';

    var ERR_GET_USER_LIST = 'ユーザ一覧の取得に失敗しました';
    var ERR_GET_ACCOUNT_TYPE_LIST = 'アカウントタイプ一覧の取得に失敗しました';
    var CONFIRM_DELETE_USER = ' を削除します。\\nよろしいですか？';
    var PERPAGE_ITEMS = [25, 50, 100];
    var DEFAULT_PERPAGE_USER_LIST = PERPAGE_ITEMS[0];

    var ACCOUNT_FORMAT_MESSAGE = 'アカウントには(A-Z, a-z),(0-9),(_.*!#$%+-)を使用してください';

    var ERR_ACCOUNT_EMPTY = 'アカウントを入力して下さい';
    var ERR_ACCOUNT_OVER_MAX_SIZE = 'アカウントは252桁以内で入力して下さい';
    var ERR_PASSWORD_SIZE = 'パスワードは8桁以上、32桁以内で入力して下さい';
    var ERR_PASSWORD_EMPTY = 'パスワードを入力して下さい';
    var ERR_CONFIRM_PASSWORD_EMPTY = '確認用パスワードを入力して下さい';
    var ERR_NOT_MATCH_PASSWORD_AND_CONFIRM_PASSWORD = 'パスワードと確認用パスワードが一致していません';
    var ERR_EMAIL_EMPTY = 'emailを入力してください';
    var ERR_ACCOUNT_WRONG_FORMAT = 'アカウントの形式が不正です';
    var ERR_EMAIL_WRONG_FORMAT = 'emailの形式が不正です';
    var ERR_EMAIL_EXIST_USER = 'そのアカウントは利用できません';
    var ERR_EMAIL_EXIST_MAILADDRESS = 'そのemailは利用できません';
    var ERR_UNKNOWN = '予期せぬエラーが発生しました';
    var ERR_DUPLICATE_ACCOUNT_IN_CSV = 'ファイル内でアカウントが重複しています';
    var ERR_DUPLICATE_EMAIL_IN_CSV = 'ファイル内でemailが重複しています';
    var ERR_NICKNAME_SIZE = 'ニックネームは20文字以内で入力してください';
    var ERR_WRONG_CSV_FORMAT = 'CSVのフォーマットが不正です';
    var ERR_NOT_CSV_FILE = 'ファイルはCSV形式のものを指定してください';
    var ERR_SKIP_DATA = 'データがないためスキップしました';
    var ERR_FAIL_READ_CSV = 'ファイルの読み込みに失敗しました';
    var ERR_ACCOUNT_TYPE_EMPTY = 'アカウントタイプを指定してください';
    var ERR_NO_EXIST_ACCOUNT_TYPE = '指定されたアカウントタイプが存在しません';
    var ERR_REGISTER_ACCOUNT_TYPE = 'アカウントタイプの登録に失敗しました ユーザ更新画面からアカウントタイプを再設定してください';
    var ERR_REGISTER_ACCOUNT_TYPE_FOR_BATCH = 'アカウントタイプの登録に失敗したユーザが存在します。 一括更新からアカウントタイプを再設定してください。';
    var ERR_UPDATE_ACCOUNT_TYPE = 'アカウントタイプの更新に失敗しました';
    var ERR_GROUP_MAX_COUNT = '登録できる所属は5つまでです';
    var ERR_GROUP_MAX_SIZE = '所属は100文字以内で入力してください';
    var ERR_DELETE_FLG_NOT_NUMBER = '削除フラグの値が正しくありません';

    var UPLOAD_TEXT_BATCH_REG = '一括登録用のファイルを選択してください';
    var UPLOAD_TEXT_BATCH_UPDATE = '一括更新用のファイルを選択してください';
    var WARN_BATCH_EXEC_MESSAGE = 'ユーザ数が多い場合は処理に時間がかかります';
    var WARN_BATCH_REG_LIMIT_MESSAGE = '一度に登録するユーザ数を1000名以上にする場合、処理に時間がかかりサーバからの応答がタイムアウトする場合があります。1000名以内を推奨いたします。';

    var MSG_LICENSE = {
       "ERR_GET_USERINFO" : "ユーザ情報の取得に失敗しました。",
       "ERR_NO_KEYS" : "ライセンス定義ファイルに有効なライセンスキーが登録されていません。",
       "ERR_WRONG_KEY1" : "ライセンス定義ファイルに初期登録しているライセンスキーが不正です。",
       "ERR_WRONG_KEY2" : "ライセンス定義ファイルに追加登録しているライセンスキーが不正です。",
       "ERR_CREATE_USER0" : "ユーザを登録することができませんでいた。",
       "ERR_CREATE_USER1" : "最大登録ユーザ数を",
       "ERR_CREATE_USER2" : "件超えています。",
       "INFO_ENABLE_USER0" : "最大登録ユーザ数に達しています。",
       "INFO_ENABLE_USER1" : "あと",
       "INFO_ENABLE_USER2" : "人のユーザが登録可能です。"
    };

    var CSV_ROW_TEXT = '行目';

    var DOWNLOAD_CSV_FILE_TEXT = 'CSVテンプレートファイルをダウンロード';
    var DOWNLOAD_CSV_USER_LIST_UTF8 = 'ユーザ一覧CSVファイルをダウンロード(カンマ区切り、UTF-8)';
    var DOWNLOAD_CSV_USER_LIST_SJIS = 'ユーザ一覧CSVファイルをダウンロード(カンマ区切り、Shift-JIS)';

    var SUCCESS_CREATE_USER = 'ユーザの登録に成功しました';
    var SUCCESS_PROCESS = '処理に成功しました'
    var SUCCESS_RESET_PASSWORD = 'パスワードの再設定に成功しました';
    var SUCCESS_UPDATE_ACCOUNT_TYPE = 'アカウントタイプの更新に成功しました';

    var URL_QUERY_PARAM_ACCOUNT = 'account';
    var URL_QUERY_PARAM_NICKNAME = 'nickname';
    var URL_QUERY_PARAM_EMAIL = 'email';
    var URL_QUERY_PARAM_PASSWORD = 'password';
    var URL_QUERY_PARAM_CONFIRM_PASSWORD = 'confirmPassword';

    var URL_QUERY_PARAM_CHAR_CODE_VALUE_UTF8 = 'utf8';
    var URL_QUERY_PARAM_CHAR_CODE_VALUE_SJIS = 'sjis';

    var errStrArray = [];
    errStrArray[UserAccountManager.ERR_REASON_ERROR_PARAM] = ERR_UNKNOWN;
    errStrArray[UserAccountManager.ERR_REASON_ACCOUNT_EMPTY] = ERR_ACCOUNT_EMPTY;
    errStrArray[UserAccountManager.ERR_REASON_ACCOUNT_OVER_MAX_SIZE] = ERR_ACCOUNT_OVER_MAX_SIZE;
    errStrArray[UserAccountManager.ERR_REASON_PASSWORD_SIZE] = ERR_PASSWORD_SIZE;
    errStrArray[UserAccountManager.ERR_REASON_NOT_MATCH_PASSWORD_AND_CONFIRM_PASSWORD] = ERR_NOT_MATCH_PASSWORD_AND_CONFIRM_PASSWORD;
    errStrArray[UserAccountManager.ERR_REASON_EMAIL_EMPTY] = ERR_EMAIL_EMPTY;
    errStrArray[UserAccountManager.ERR_REASON_ACCOUNT_WRONG_FORMAT] = ERR_ACCOUNT_WRONG_FORMAT;
    errStrArray[UserAccountManager.ERR_REASON_EMAIL_WRONG_FORMAT] = ERR_EMAIL_WRONG_FORMAT;
    errStrArray[UserAccountManager.ERROR_REASON_EXIST_USER] = ERR_EMAIL_EXIST_USER;
    errStrArray[UserAccountManager.ERROR_REASON_EXIST_MAILADDRESS] = ERR_EMAIL_EXIST_MAILADDRESS;
    errStrArray[UserAccountManager.ERROR_REASON_INTERNAL_SERVER_ERROR] = ERR_UNKNOWN;
    errStrArray[UserAccountManager.ERROR_REASON_DUPLICATE_ACCOUNT_IN_CSV] = ERR_DUPLICATE_ACCOUNT_IN_CSV;
    errStrArray[UserAccountManager.ERROR_REASON_DUPLICATE_EMAIL_IN_CSV] = ERR_DUPLICATE_EMAIL_IN_CSV;
    errStrArray[UserAccountManager.ERR_REASON_NICKNAME_SIZE] = ERR_NICKNAME_SIZE;
    errStrArray[UserAccountManager.ERR_REASON_WRONG_CSV_FORMAT] = ERR_WRONG_CSV_FORMAT;
    errStrArray[UserAccountManager.ERR_REASON_SKIP_DATA] = ERR_SKIP_DATA;
    errStrArray[UserAccountManager.ERR_REASON_FAIL_READ_CSV] = ERR_FAIL_READ_CSV;
    errStrArray[UserAccountManager.ERR_REASON_ACCOUNT_TYPE_EMPTY] = ERR_ACCOUNT_TYPE_EMPTY;
    errStrArray[UserAccountManager.ERR_REASON_NO_EXIST_ACCOUNT_TYPE] = ERR_NO_EXIST_ACCOUNT_TYPE;
    errStrArray[UserAccountManager.ERR_REASON_FAIL_ASSIGN_ACCOUNT_TYPE] = ERR_REGISTER_ACCOUNT_TYPE_FOR_BATCH;
    errStrArray[UserAccountManager.ERR_REASON_GROUP_MAX_COUNT] = ERR_GROUP_MAX_COUNT;
    errStrArray[UserAccountManager.ERR_REASON_GROUP_MAX_SIZE] = ERR_GROUP_MAX_SIZE;
    errStrArray[UserAccountManager.ERR_REASON_DELETE_FLG_NOT_NUMBER] = ERR_DELETE_FLG_NOT_NUMBER;

    //ユーザ一覧
    exports.list = function(req, res){
        var _accessToken = req.session.accessToken;
        //ページ内表示件数
        var _perPage = req.query.perPage;
        if (!_perPage) {
            _perPage = DEFAULT_PERPAGE_USER_LIST;
        } else {
            _perPage = parseInt(_perPage);
        }
        //指定ページ
        var _pageIndex = req.query.page;
        if (!_pageIndex) {
            _pageIndex = 1;
        }
        var _allCount = req.query.allCount;
        if (_allCount) {
            _allCount = parseInt(_allCount);
        }

        //検索開始位置を取得
        var _startNum = (_pageIndex - 1) * _perPage + 1;
        if ((!_allCount) || (_startNum > _allCount)) {
            //全件数が取得できない場合、または、検索開始位置が全件数より大きい場合(存在しないページ番号を指定された場合)
            //最初のページを指定して表示する
            _pageIndex = 1;
            _startNum = 1;
        }
        log.connectionLog(7, '[user list] _startNum : ' + _startNum);
        //開始位置、ページ当たりの件数、テナント、ログインユーザ
        var _requestData = {};
        _requestData.tenantId = req.params.tid;
        _requestData.start = _startNum;
        _requestData.count = _perPage;
        var _adminAccount = _conf.getConfData('XMPP_SERVER_ADMIN_ACCOUNT');
        _requestData.except = [_adminAccount];

        var _tName = null;
        var _ldapConf = false;

        function _getUserListCallback(result, reason, extras, count, items) {
            var _locals = _getLocals('userlist', req.params.tid, _tName, TITLE_USER_LIST);
            _locals.result = result;
            _locals.confirmDelete = CONFIRM_DELETE_USER;
            _locals.currentPage = _pageIndex;

            _locals.error = false;
            var _license = _licenseManager.getLicensedUserCount(req.params.tid);
            if( _license.error == LicenseManager.ERR_NO_KEYS ) {
               _locals.message = MSG_LICENSE["ERR_NO_KEYS"];
               _locals.error = true;
            } else if( _license.error == LicenseManager.ERR_WRONG_KEY1 ) {
               _locals.message = MSG_LICENSE["ERR_WRONG_KEY1"];
               _locals.error = true;
            } else

            if (result) {
                var _accessToken = req.session.accessToken;
                _locals.accessTokenHash = Utils.sha256Hex(_accessToken);
                _locals.message = '';
                _locals.items = decodeUserListItems(items);
                _locals.selectedPerPage = _perPage;
                _locals.perPageOptions = _getOptions(PERPAGE_ITEMS, _perPage, extras.allCount, req.params.tid);
                _locals.allCount = extras.allCount;
                var pageOpts = {
                        add_args: {
                            allCount: extras.allCount,
                            perPage: _perPage
                            }
                      };
                _locals.pagination = Paginator.paginate(extras.allCount, _perPage, _pageIndex, pageOpts);

                if( _license.error == LicenseManager.ERR_WRONG_KEY2 ) {
                    _locals.message = MSG_LICENSE["ERR_WRONG_KEY2"];
                }

                var _enable_count = _license.count - extras.notDeleteCount;
                if( _enable_count <= 0 ) {
                   _locals.message += ("\n" +  MSG_LICENSE["INFO_ENABLE_USER0"]);
                } else {
                   _locals.message += ("\n" + MSG_LICENSE["INFO_ENABLE_USER1"] + _enable_count + MSG_LICENSE["INFO_ENABLE_USER2"]);
                }

            } else {
                //リスト取得失敗
                _locals.message = ERR_GET_USER_LIST;
                _locals.allCount = extras.allCount;
                _locals.items = items;
                _locals.selectedPerPage = _perPage;
                _locals.pagination = null;
                _locals.perPageOptions = null;
            }
            //結果取得処理
            _locals.updatable = _ldapConf;
            res.locals = _locals;
            res.render('main');
            //res.render('main', {
            //    locals: _locals
            //});
        }

        // Cacheからテナント名を取得
        _getTenantNameFromCache(req.params.tid, _onGetTenantName);
        // コールバック
        function _onGetTenantName(err, tenantName, updatable) {
            if (err) {
                log.connectionLog(3, 'User::list _onGetTenantName, Failed to get tenantName from cache: ' + err.message);
                res.redirect(location + '/admintool/');
                return;
            }
            _tName = tenantName;
            _ldapConf = updatable;

            //ユーザ一覧取得
            _userAccountManager.getUserList(_accessToken, _requestData, _getUserListCallback);
        }

        //optionのHTMLを作成
        function _getOptions(items, selectedValue, allCount, tid) {
            var _actionPath = location + '/admintool/tenant/' + tid + '/user';
            var _options = [];
            for (var _i = 0; _i < items.length; _i++) {
                var _selected = '';
                if (items[_i] == selectedValue) {
                    _selected = 'selected';
                }
                _options.push('<option value="' + _actionPath
                            + '?page=1&allCount=' + allCount
                            + '&perPage=' + items[_i] + '" '
                            + _selected + '>' + items[_i] + '</option>');
            }
            return _options.join();
        };
        //ユーザリスト表示項目のdecode
        function decodeUserListItems(items) {
            var _items = items;
            for (var _i = 0; _i < items.length; _i++) {
                if(_items[_i].nickName == '') {
                    _items[_i].nickName = _items[_i].loginAccount;
                } else {
                    _items[_i].nickName = decodeURIComponent(items[_i].nickName);
                }
                _items[_i].group = decodeURIComponent(items[_i].group);
            }
            return _items;
        };
    };
    //新規登録画面表示
    exports.reg = function(req, res){
        var _tName = null;
        var roleList = null;

        function _getUserCountCallback(result, reason, extras, count, items) {
            var _locals = _getCreateUserLocals(req, _tName);

            //アカウントタイプ一覧を設定
            _locals.accountTypeList = roleList;

            //ライセンスチェック
            // Variable _allCount is used like a local variable, but is missing a declaration.
            var _allCount = ( typeof extras.notDeleteCount === "undefined" )? 0 : parseInt(extras.notDeleteCount);
            var _license = _licenseManager.getLicensedUserCount(req.params.tid);
            var _cl = _checkLicense(_license, result, _allCount);
            _locals.error = _cl.error;
            _locals.message = _cl.message;

            // アクセストークンのハッシュを計算(CSRF対策)
            var _accessToken = req.session.accessToken;
            _locals.accessTokenHash = Utils.sha256Hex(_accessToken);

            res.locals = _locals;
            res.render('main');
            //res.render('main', {
            //    locals: _locals
            //});
        }

        function _onGetTenantName(err, tenantName, updatable) {
            if (err) {
                log.connectionLog(3, 'User::reg _onGetTenantName, Failed to get tenantName from cache: ' + err.message);
                res.redirect(location + '/admintool/');
                return;
            }
            _tName = tenantName;

            //アカウント一覧取得
            _getAccountTypeList(req, res, _tName)
            .then(function(value){
                roleList = value;
                //ユーザ情報取得
                _getUserCount( req, _getUserCountCallback );
            }).catch(function(err){
                var _locals = _getCreateUserLocals(req, _tName);
                _locals.error = true;
                _locals.message = err;
                res.locals = _locals;
                res.render('main');
            });
        }

        // Cacheからテナント名を取得
        _getTenantNameFromCache(req.params.tid, _onGetTenantName);
    };

    //CSV登録
    exports.csvreg = function(req, res){
        var _tName = null;

        function _getUserCountCallback(result, reason, extras, count, items) {
            var _locals = _getExecBatchCreateLocals(req, _tName, null)

            //ライセンスチェック
            // Variable _allCount is used like a local variable, but is missing a declaration.
            var _allCount = ( typeof extras.notDeleteCount === "undefined" )? 0 : parseInt(extras.notDeleteCount);
            var _license = _licenseManager.getLicensedUserCount(req.params.tid);
            var _cl = _checkLicense(_license, result, _allCount);
            _locals.error = _cl.error;
            _locals.message = _cl.message;
            // アクセストークンのハッシュを計算(CSRF対策)
            var _accessToken = req.session.accessToken;
            _locals.accessTokenHash = Utils.sha256Hex(_accessToken);

            res.locals = _locals;
            res.render('main');
            //res.render('main', {
            //    locals: _locals
            //});
        }

        function _onGetTenantName(err, tenantName, updatable) {
            if (err) {
                log.connectionLog(3, 'User::csvreg _onGetTenantName, Failed to get tenantName from cache: ' + err.message);
                res.redirect(location + '/admintool/');
                return;
            }
            _tName = tenantName;

            //ユーザ情報取得
            _getUserCount( req, _getUserCountCallback );
        }

        // Cacheからテナント名を取得
        _getTenantNameFromCache(req.params.tid, _onGetTenantName);
    };
    //CSV更新
    exports.csvupd = function(req, res){
        var _tName = null;

        function _onGetTenantName(err, tenantName, updatable) {
            if (err) {
                log.connectionLog(3, 'User::csvupd _onGetTenantName, Failed to get tenantName from cache: ' + err.message);
                res.redirect(location + '/admintool/');
                return;
            }
            _tName = tenantName;

            var _locals = _getExecBatchUpdateLocals(req, _tName, null);
            // アクセストークンのハッシュを計算(CSRF対策)
            var _accessToken = req.session.accessToken;
            _locals.accessTokenHash = Utils.sha256Hex(_accessToken);

            //LDAP 設定
            _locals.updatable = updatable;
            res.locals = _locals;
            res.render('main');
            //res.render('main', {
            //    locals: _locals
            //});
        }

        // Cacheからテナント名を取得
        _getTenantNameFromCache(req.params.tid, _onGetTenantName);

    };
    //ユーザ更新画面表示
    exports.update = function(req, res){
        var _tName = null;
        var accountType = null;
        var roleList = null;
        var _ldapConf = false;

        function _onGetTenantName(err, tenantName, updatable) {
            if (err) {
                log.connectionLog(3, 'User::update _onGetTenantName, Failed to get tenantName from cache: ' + err.message);
                res.redirect(location + '/admintool/');
                return;
            }
            _tName = tenantName;
            _ldapConf = updatable;
            // ユーザのアカウントタイプ及びアカウントタイプ一覧を取得し描画
            Promise.all([
                new Promise(
                    (resolve, reject) => {
                        AccountTypeManager
                            .getRoleAssignmentForUser(
                                req.session.accessToken, req.query.account)
                            .then((res) => {
                                resolve(res);
                            }).catch((res) => {
                                resolve(res);
                            });
                    }),
                new Promise(
                    (resolve, reject) => {
                        _getAccountTypeList(req, res, _tName)
                            .then((res) => {
                                resolve(res);
                            }).catch((res) => {
                                resolve(res);
                            });
                    })
            ]).then(function(result){
                if(result[0]['result']){
                  accountType = result[0]['role']['id']
                }
                roleList = result[1];
                renderToScreen();
            }).catch(function(err){
                _getUpdateUserLocals(req, _tName, null, function(_locals) {
                    _locals.error = true;
                    _locals.message = err;
                    res.locals = _locals;
                    res.render('main');
                    return;
                });
            })
        }

        function renderToScreen(){
            //画面変数に値を設定
            _getUpdateUserLocals(req, _tName, accountType, function(_locals) {
              //アカウントタイプ一覧を設定
              _locals.accountTypeList = roleList;
              // アクセストークンのハッシュを計算(CSRF対策)
              var _accessToken = req.session.accessToken;
              _locals.accessTokenHash = Utils.sha256Hex(_accessToken);

              // LDAP 設定
              _locals.updatable = _ldapConf;

              res.locals = _locals;
              res.render('main');
            });
        }

        // Cacheからテナント名を取得
        _getTenantNameFromCache(req.params.tid, _onGetTenantName);
    };

    //新規登録処理
    exports.createUser = function(req, res){
        //アクセストークンを取得
        var _accessToken = req.session.accessToken;
        if(!_accessToken){
            res.redirect(location + '/admintool/');
            return;
        }

        var _tName = null;
        var roleList = null;

        function _getUserCountCallback(result, reason, extras, count, items) {
            var _locals = _getCreateUserLocals(req, _tName);
            //アカウントタイプ一覧を設定
            _locals.accountTypeList = roleList;

            //ライセンスチェック
            var _allCount = ( typeof extras.notDeleteCount === "undefined" )? 0 : parseInt(extras.notDeleteCount);
            var _license = _licenseManager.getLicensedUserCount(req.params.tid);
            var _cl = _checkLicense(_license, result, _allCount);
            _locals.error = _cl.error;
            _locals.message = _cl.message;
            if ( _cl.error ) {

                res.locals = _locals;
                res.render('main');
                //res.render('main', {
                //    locals: _locals
                //});
            } else {
                _allCount = parseInt(extras.notDeleteCount); //登録ユーザ数(登録前)

                //フォームデータ取得
                var _formData = req.body;

                //ユーザ登録処理開始
                var _ret = _userAccountManager.createUser(_accessToken, _formData, _onCreateUserCallBack);
                if(!_ret.result){
                    _renderRegUser(_ret.result, _formData, _ret.reason);
                }

                // ユーザ登録後のコールバック
                function _onCreateUserCallBack(result, reason){
                    if(!result){
                        _renderRegUser(result, _formData, reason);
                    }else{
                        var _cl = _checkLicense(_license, result, _allCount+1);
                        _locals.error = _cl.error;
                        _locals.message = _cl.message;
                        _renderRegUser(result, _formData, null);
                    }
                };
                // 新規登録画面への結果応答
                function _renderRegUser(result, formData, errReason){
                    if (!result) {
                        //失敗した場合は入力値を表示
                        _locals.txtAccount = (!formData.account)? '' : formData.account;
                        _locals.txtNickname = (!formData.nickname)? '' : formData.nickname;
                        _locals.txtEmail = (!formData.email)? '' : formData.email;
                        _locals.txtGroup = (!formData.group)? '' : formData.group;
                        _setErrMessage(_locals, errReason);
                        renderToScreen();
                    }else{
                        AccountTypeManager.assignRoleToUser(_accessToken, formData.accountType, formData.account)
                            .then(function(value){
                                if(value['result'] == false){
                                    _locals.errRegisterAccountType = ERR_REGISTER_ACCOUNT_TYPE;
                                }else{
                                    _locals.successMessage = SUCCESS_CREATE_USER;
                                }
                            }).catch(function(err){
                                _locals.errRegisterAccountType = ERR_REGISTER_ACCOUNT_TYPE;
                            }).then(function(){
                                renderToScreen()
                            });
                    }

                    function renderToScreen(){
                        // アクセストークンのハッシュを計算して追加登録できるようにしておく。(CSRF対策)
                        _locals.accessTokenHash = Utils.sha256Hex(_accessToken);
                        res.locals = _locals;
                        res.render('main');
                    }
                };

                //エラーメッセージのセット
                function _setErrMessage(locals, errReason){
                    if(locals == null){
                        return;
                    }
                    if(errReason == null){
                        return;
                    }
                    if(errReason == UserAccountManager.ERR_REASON_ACCOUNT_EMPTY ||
                            errReason == UserAccountManager.ERR_REASON_ACCOUNT_OVER_MAX_SIZE ||
                            errReason == UserAccountManager.ERR_REASON_ACCOUNT_WRONG_FORMAT ||
                            errReason == UserAccountManager.ERROR_REASON_EXIST_USER){
                        //アカウントフォーム用のエラーメッセージ
                        locals.errMessageAccount = errStrArray[errReason];
                    }else if(errReason == UserAccountManager.ERR_REASON_EMAIL_EMPTY ||
                            errReason == UserAccountManager.ERR_REASON_EMAIL_WRONG_FORMAT ||
                            errReason == UserAccountManager.ERROR_REASON_EXIST_MAILADDRESS){
                        //email用のエラーメッセージ
                        locals.errMessageEmail = errStrArray[errReason];
                    }else if(errReason == UserAccountManager.ERR_REASON_PASSWORD_SIZE){
                        //password用のエラーメッセージ
                        locals.errMessagePassword = errStrArray[errReason];
                    }else if(errReason == UserAccountManager.ERR_REASON_NOT_MATCH_PASSWORD_AND_CONFIRM_PASSWORD){
                        //confirm password用のエラーメッセージ
                        locals.errMessageConfirmPassword = errStrArray[errReason];
                    }else if(errReason == UserAccountManager.ERR_REASON_GROUP_MAX_COUNT ||
                            errReason == UserAccountManager.ERR_REASON_GROUP_MAX_SIZE){
                        //confirm password用のエラーメッセージ
                        locals.errMessageGroup = errStrArray[errReason];
                    }
                }
            }
        }

        function _onGetTenantName(err, tenantName, updatable) {
            if (err) {
                log.connectionLog(3, 'User::createUser _onGetTenantName, Failed to get tenantName from cache: ' + err.message);
                res.redirect(location + '/admintool/');
                return;
            } else if (updatable == false) {
                log.connectionLog(3, 'User::createUser _onGetTenantName, updatable is false');
                res.redirect(location + '/admintool/');
                return;
            }
            _tName = tenantName;

            //ユーザ情報取得
            _getAccountTypeList(req, res, _tName)
            .then(function(value){
                roleList = value;
                _getUserCount( req, _getUserCountCallback );
            }).catch(function(err){
                var _locals = _getCreateUserLocals(req, _tName);
                _locals.error = true;
                _locals.message = err;
                res.locals = _locals;
                res.render('main');
            })
        }
        // Cacheからテナント名を取得
        _getTenantNameFromCache(req.params.tid, _onGetTenantName);

    };

    //パスワード再設定処理
    exports.updateUser = function(req, res){
        //アクセストークンを取得
        var _accessToken = req.session.accessToken;
        if(!_accessToken){
            res.redirect(location + '/admintool/');
            return;
        }
        //フォームデータ取得
        var _formData = req.body;
        var _account = encodeURIComponent(req.query.account);

        var _tName = null;
        var accountType = null;
        var roleList = null;

        function _onGetTenantName(err, tenantName, updatable) {
            if (err) {
                log.connectionLog(3, 'User::updateUser _onGetTenantName, Failed to get tenantName from cache: ' + err.message);
                res.redirect(location + '/admintool/');
                return;
            } else if (updatable == false) {
                log.connectionLog(3, 'User::createUser _onGetTenantName, updatable is false');
                res.redirect(location + '/admintool/');
                return;
            }
            _tName = tenantName;

            // ユーザのアカウントタイプ及びアカウントタイプ一覧を取得し描画
            Promise.all([
                new Promise(
                    (resolve, reject) => {
                        AccountTypeManager.getRoleAssignmentForUser(_accessToken, req.query.account)
                            .then((res) => {
                                resolve(res);
                            }).catch((res) => {
                                resolve(res);
                            });
                    }),
                new Promise(
                    (resolve, reject) => {
                        _getAccountTypeList(req, res, _tName)
                            .then((res) => {
                                resolve(res);
                            }).catch((res) => {
                                resolve(res);
                            });
                    })
            ]).then(function(result){
                if(result[0]['result']){
                  accountType = result[0]['role']['id']
                }
                roleList = result[1];
                _updatePersonInfo();
            }).catch(function(err){
                _getUpdateUserLocals(req, _tName, null, function(_locals) {
                    _locals.error = true;
                    _locals.message = err;
                    res.locals = _locals;
                    res.render('main');
                    return;
                });
            })
        }

        //ユーザ情報更新処理
        function _updatePersonInfo() {
            var _ret = _userAccountManager.checkUpdatePersonInfo(_formData);
            if (_ret.result) {
                _userAccountManager.updatePersonInfo(
                  _accessToken,
                  req.query.account,
                  _formData,
                  updatePasswordBeforeUpdateRoles)
            } else {
                _renderPassword(_ret.result, _ret.reason);
            }
        }

        //パスワード再設定処理
        function updatePasswordBeforeUpdateRoles(){
            if('confirmInput' in _formData){
                var _ret = _userAccountManager.updateUserPassword(_accessToken, _account, _formData, _onUpdatePasswordCallBack);
                if(!_ret.result){
                    _renderPassword(_ret.result, _ret.reason);
                }
            }else{
                _getUpdateUserLocals(req, _tName, accountType, function(_locals) {
                    //アカウントタイプ一覧を設定
                    _locals.accountTypeList = roleList;
                    AccountTypeManager.assignRoleToUser(_accessToken, _formData.accountType, _account)
                    .then(function(value){
                        if(!value['result']){
                            _locals.errRegisterAccountType = ERR_UPDATE_ACCOUNT_TYPE;
                        }else{
                            if (_locals.assignAccountType == _formData.accountType) {
                                _locals.successMessage = SUCCESS_PROCESS;
                            } else {
                                _locals.successMessage = SUCCESS_UPDATE_ACCOUNT_TYPE;
                            }
                            _locals.assignAccountType = _formData.accountType;
                        }
                      }).catch(function(err){
                          _locals.errRegisterAccountType = ERR_UPDATE_ACCOUNT_TYPE;
                      }).then(function(){
                        renderToScreen(_locals);
                      })
                });
            }
        }

        // Cacheからテナント名を取得
        _getTenantNameFromCache(req.params.tid, _onGetTenantName);

        // パスワード再設定後のコールバック
        function _onUpdatePasswordCallBack(result, reason){
            _renderPassword(result, reason);
        };

        // ユーザ更新画面へ応答処理
        function _renderPassword(result, reason){
            _getUpdateUserLocals(req, _tName, accountType, function(_locals) {
                //アカウントタイプ一覧を設定
                _locals.accountTypeList = roleList;
                if(!result){
                    _setErrMessage(_locals, reason);
                    _locals.txtGroup = (!_formData.group)? '' : _formData.group;
                    _locals.txtNickname = (!_formData.nickname)? '' : _formData.nickname;
                    renderToScreen(_locals);
                }else{
                    AccountTypeManager.assignRoleToUser(_accessToken, _formData.accountType, _account)
                    .then(function(value){
                        if(value['result'] == false){
                            _locals.successMessage = SUCCESS_RESET_PASSWORD;
                            _locals.errRegisterAccountType = ERR_UPDATE_ACCOUNT_TYPE;
                        }else{
                            _locals.successMessage = SUCCESS_PROCESS;
                            _locals.assignAccountType = _formData.accountType;
                        }
                      }).catch(function(err){
                          _locals.successMessage = SUCCESS_RESET_PASSWORD;
                          _locals.errRegisterAccountType = ERR_UPDATE_ACCOUNT_TYPE;
                      }).then(function(){
                          renderToScreen(_locals);
                      })
                }
            });
        };

        // 画面への描画
        function renderToScreen(locals){
            // アクセストークンのハッシュを計算(CSRF対策)
            locals.accessTokenHash = Utils.sha256Hex(_accessToken);

            res.locals = locals;
            res.render('main');
        }

        // 画面への描画（アカウント一覧取得失敗時）
        function renderToScreenForError(){
            _getUpdateUserLocals(req, _tName, null, function(_locals) {
                _locals.error = true;
                _locals.message = err;
                res.locals = _locals;
                res.render('main');
                return;
            });
        }

        //エラーメッセージのセット
        function _setErrMessage(locals, errReason){
            if(locals == null){
                return;
            }
            if(errReason == null){
                return;
            }
            if(errReason == UserAccountManager.ERR_REASON_PASSWORD_SIZE){
                //password用のエラーメッセージ
                locals.errMessagePassword = errStrArray[errReason];
            }else if(errReason == UserAccountManager.ERR_REASON_NOT_MATCH_PASSWORD_AND_CONFIRM_PASSWORD){
                //confirm password用のエラーメッセージ
                locals.errMessageConfirmPassword = errStrArray[errReason];
            }else if(errReason == UserAccountManager.ERR_REASON_GROUP_MAX_COUNT){
                //group用のエラーメッセージ
                locals.errMessageGroup = errStrArray[errReason];
            }else if(errReason == UserAccountManager.ERR_REASON_GROUP_MAX_SIZE){
                //group用のエラーメッセージ
                locals.errMessageGroup = errStrArray[errReason];
            }
        }
    };
    //一括登録処理
    exports.execBatchCreate = function(req, res){
        //アクセストークンを取得
        var _accessToken = req.session.accessToken;
        if(!_accessToken){
            res.redirect(location + '/admintool/');
            return;
        }

        var _tName = null;
        var roleList = null;

        function _getUserCountCallback(result, reason, extras, count, items) {

            //ライセンスチェック
            var _allCount = ( typeof extras.notDeleteCount === "undefined" )? 0 : parseInt(extras.notDeleteCount);
            var _license = _licenseManager.getLicensedUserCount(req.params.tid);
            var _cl = _checkLicense(_license, result, _allCount);
            if ( _cl.error ) {
                _render(null);
            } else {
                _allCount = parseInt(extras.notDeleteCount); //登録ユーザ数(登録前)

                //ファイルの取得
                var _csvfile = req.files[0];
                if (_csvfile) {
                    var _extName = path.extname(_csvfile.originalname);
                    _extName = _extName.toLowerCase();
                    log.connectionLog(7, 'file ext : ' + _extName);
                    if(_extName != '.csv'){
                        _render(_getNotCsvFileResultOutputMessage());
                        return;
                    }

                    function _toArrayFromCsvFileCallback(csvDataArray) {
                        // Variable _over is used like a local variable, but is missing a declaration.
                        var _over;
                        if(!csvDataArray) {
                           //ファイルリードエラー
                           _render( [ { "result" : false, "message" : ERR_FAIL_READ_CSV } ] );
                        } else if(( _over = _allCount + csvDataArray.length - _license.count) > 0 ) {
                           _cl.message = MSG_LICENSE["ERR_CREATE_USER0"] + "\n" + MSG_LICENSE["ERR_CREATE_USER1"] + _over + MSG_LICENSE["ERR_CREATE_USER2"];
                           _render(null);
                        } else {
                            // 一括登録処理開始
                            var _ret = _userAccountManager.execBatchCreate(_accessToken, _csvfile.path, _onExecBatchCreateCallBack, roleList);
                            if(!_ret){
                                _render(_getFailBatchOutputMessage());
                            }
                        }
                    }

                    //CSVファイルの件数をチェック
                    CsvFileManager.toArray(_csvfile.path, _toArrayFromCsvFileCallback );
                }else {
                    _render(_getFailBatchOutputMessage());
                }
                // 一括処理後のコールバック
                function _onExecBatchCreateCallBack(results){
                    log.connectionLog(7, '_onExecBatchCreateCallBack results ' + JSON.stringify(results));
                    var _createdResult = _getBatchResultOutputMessageFromItems(results);
                    log.connectionLog(3, '_onExecBatchCreateCallBack results ' + JSON.stringify(results));

                    //成功件数カウント
                    for(var _i = 0; _i < _createdResult.length; _i++ ) {
                        if( _createdResult[_i].result == true ) {
                            _allCount++;
                        }
                    }

                    _cl = _checkLicense(_license, result, _allCount);
                    _render(_createdResult);
                }
                // 描画処理
                function _render(createdResults){
                    log.connectionLog(7, 'createdResults ' + JSON.stringify(createdResults));
                    var _locals = _getExecBatchCreateLocals(req, _tName, createdResults)
                    _locals.error = _cl.error;
                    _locals.message = _cl.message;
                    // アクセストークンのハッシュを計算(CSRF対策)
                    _locals.accessTokenHash = Utils.sha256Hex(_accessToken);

                    res.locals = _locals;
                    res.render('main');
                    //res.render('main', {
                    //    locals: _locals
                    //});
                }
            }
        }

        function _onGetTenantName(err, tenantName, updatable) {
            if (err) {
                log.connectionLog(3, 'User::execBatchCreate _onGetTenantName, Failed to get tenantName from cache: ' + err.message);
                res.redirect(location + '/admintool/');
                return;
            } else if (updatable == false) {
                log.connectionLog(3, 'User::execBatchCreate _onGetTenantName, updatable is false');
                res.redirect(location + '/admintool/');
                return;
            }
            _tName = tenantName;

            // アカウントタイプ一覧の取得
            _getAccountTypeList(req, res, _tName)
            .then(function(value){
                roleList = value;
                _getUserCount( req, _getUserCountCallback );
            }).catch(function(err){
                var _locals = _getExecBatchCreateLocals(req, _tName, null);
                _locals.error = true;
                _locals.message = err;
                // アクセストークンのハッシュを計算(CSRF対策)
                _locals.accessTokenHash = Utils.sha256Hex(_accessToken);
                res.locals = _locals;
                res.render('main');
            })
        }

        _getTenantNameFromCache(req.params.tid, _onGetTenantName);

    };
    //一括更新処理
    exports.execBatchUpdate = function(req, res){
        //アクセストークンを取得
        var _accessToken = req.session.accessToken;
        if(!_accessToken){
            log.connectionLog(6, 'User::execBatchUpdate _accessToken is invalid');
            res.redirect(location + '/admintool/');
            return;
        }

        var _tName = null;
        var roleList = null;

        function _onGetTenantName(err, tenantName, updatable) {
            if (err) {
                log.connectionLog(3, 'User::execBatchUpdate _onGetTenantName, Failed to get tenantName from cache: ' + err.message);
                res.redirect(location + '/admintool/');
                return;
            } else if (updatable == false) {
                log.connectionLog(3, 'User::execBatchUpdate _onGetTenantName, updatable is false');
                res.redirect(location + '/admintool/');
                return;
            }
            _tName = tenantName;

            //ファイルの取得
            log.connectionLog(7, 'User::execBatchUpdate process start');
            var _csvfile = req.files[0];
            if (_csvfile) {
                var _extName = path.extname(_csvfile.originalname);
                _extName = _extName.toLowerCase();
                log.connectionLog(7, 'file ext : ' + _extName);
                if(_extName != '.csv'){
                    _render(_getNotCsvFileResultOutputMessage());
                    return;
                }
                _getAccountTypeList(req, res, _tName)
                .then(function(value){
                    roleList = value;
                    var _ret = _userAccountManager.execBatchUpdate(_accessToken, _csvfile.path, _onExecBatchUpdateCallBack, roleList);
                    if(!_ret){
                        _render(_getFailBatchOutputMessage());
                    }
                }).catch(function(err){
                    var _locals = _getExecBatchUpdateLocals(req, _tName, updatedResults);
                    _locals.error = true;
                    _locals.message = err;
                    res.locals = _locals;
                    res.render('main');
                    return;
                })
            }else {
                _render(_getFailBatchOutputMessage());
            }
        }

        // Cacheからテナント名を取得
        _getTenantNameFromCache(req.params.tid, _onGetTenantName);

        // 一括更新処理後のコールバック
        function _onExecBatchUpdateCallBack(results){
            log.connectionLog(7, '_onExecBatchUpdateCallBack results ' + JSON.stringify(results));
            var _updatedResult = _getBatchResultOutputMessageFromItems(results);
            _render(_updatedResult);
        }
        // 描画処理
        function _render(updatedResults){
            log.connectionLog(7, 'updatedResults ' + JSON.stringify(updatedResults));
            var _locals = _getExecBatchUpdateLocals(req, _tName, updatedResults);
            // アクセストークンのハッシュを計算(CSRF対策)
            _locals.accessTokenHash = Utils.sha256Hex(_accessToken);

            res.locals = _locals;
            res.render('main');
            //res.render('main', {
            //    locals: _locals
            //});
        }
    };
    //ユーザ一覧ファイル取得処理
    exports.getUserListCsvFile = function(req, res){
        //アクセストークンを取得
        var _accessToken = req.session.accessToken;
        var _tenantId = req.params.tid;
        if(!_accessToken){
            log.connectionLog(3, 'access token is Invalid');
            res.writeHead(404);
            res.end();
            return;
        }
        var _query = req.query;
        var _charCode = _query.ccode;
        var _charCodeNum = CsvFileManager.CHAR_CODE_NONE;
        switch(_charCode) {
            case URL_QUERY_PARAM_CHAR_CODE_VALUE_UTF8:
                _charCodeNum = CsvFileManager.CHAR_CODE_UTF8;
                break;
            case URL_QUERY_PARAM_CHAR_CODE_VALUE_SJIS:
                _charCodeNum = CsvFileManager.CHAR_CODE_SJIS;
                break;
            default:
                log.connectionLog(3, 'getUserListCsvFile :: param is Invalid');
                res.redirect(location + '/admintool/tenant/' + _tenantId + '/user/csvupd');
                return;
        }

        var _ret = _userAccountManager.getAllUserListForOutputCsv(_accessToken, _tenantId, _getAllUserListCallback);
        if(!_ret) {
            setTimeout(function() {
                _getAllUserListCallback(null);
            }, 1);
        }
        return;

        function _getAllUserListCallback(userList) {
            var _headerData = new Array();
            _headerData[0] = ['account','nickname','group','AccountType','DeleteFlag'];
            if(userList != null) {
                var _dataArray = _headerData.concat(userList);
            }
            // アカウントタイプ割り当てを取得
            var getAccountTypeList = [];
            for(var i = 1; i < _dataArray.length; i++){
                getAccountTypeList.push(
                    new Promise(
                        (resolve, reject) => {
                            AccountTypeManager
                                .getRoleAssignmentForUser(_accessToken, _dataArray[i][0])
                                .then(function(res){
                                    resolve(res);
                                });
                        })
                );
            }
            // 結果をユーザ一覧に追加する
            Promise.all(getAccountTypeList).then(function(result){
                for(var n = 0; n < result.length; n++){
                    if(result[n]['result']){
                        let del_flg = _dataArray[n + 1].pop();
                        _dataArray[n + 1].push(result[n]['role']['id'], del_flg);
                    }
                }
                res.writeHead(200, {
                    'Content-Disposition' : 'attachment; filename="' + _product_name + '-user.csv"',
                    'Content-Type' : 'application/x-csv',
                });
                var _data = CsvFileManager.createCsvData(_dataArray, _charCodeNum);
                res.end(_data);
            });
        };
    };
    //一括処理失敗時の結果
    function _getFailBatchOutputMessage(){
        var _resultData = {};
        _resultData.result = false;
        _resultData.message = ERR_UNKNOWN;
        return [ _resultData ];
    };
    //csv以外のファイルがアップロードされたときの結果
    function _getNotCsvFileResultOutputMessage(){
        var _resultData = {};
        _resultData.result = false;
        _resultData.message = ERR_NOT_CSV_FILE;
        return [ _resultData ];
    };
    //削除
    exports.deleteUser = function(req, res){
        //TODO: 処理後、一覧を現在のページから再表示する
    };
    //ユーザステータス更新処理
    exports.updateUserAccountStatus = function(req, res){
        //アクセストークンを取得
        var _accessToken = req.session.accessToken;
        if(!_accessToken){
            log.connectionLog(3, 'access token is Invalid');
            _onUpdateUserAccountStatusCallback(false);
            return;
        }
        var _status = req.body.status;
        function _onGetTenantName(err, tenantName, updatable) {
            if (err) {
                log.connectionLog(3, 'User::updateUserAccountStatus _onGetTenantName, Failed to get tenantName from cache: ' + err.message);
                res.redirect(location + '/admintool/');
                return;
            } else if (updatable == false) {
                log.connectionLog(3, 'User::updateUserAccountStatus _onGetTenantName, updatable is false');
                res.redirect(location + '/admintool/');
                return;
            }

            var _uid = req.params.uid;
            _uid = parseInt(_uid);
            var _tenantId = req.params.tid;
            _status = parseInt(_status);
            // 残り登録可能ユーザ数
            var _registable_acnt_num = 0;
            var _ret = _userAccountManager.updateUserAccountStatus(_accessToken, _uid, _tenantId, _status, _onUpdateUserAccountStatusCallback);
            if(!_ret){
                _onUpdateUserAccountStatusCallback(false);
            }

        }

        // Cacheからテナント名を取得
        _getTenantNameFromCache(req.params.tid, _onGetTenantName);
        return;

        // ユーザステータス更新処理後のコールバック
        function _onUpdateUserAccountStatusCallback(result){
            var _data = _getResponceData(result, _status);
            res.writeHead(200, {
                "Content-Type" : "application/json",
                "Access-Control-Allow-Origin": "*"
            });
            res.end(_data);
        };
        // レスポンスのJSONデータ取得
        function _getResponceData(updatedResult, status){
            var _resData = {
                    result : updatedResult,
                    content : {
                        status : status,
                    }
            };
            return JSON.stringify(_resData);
        };
    };
    //共通の画面変数をセット
    function _getLocals(content, tid, tname, title) {
        var _locals = {
                user: 'admin',
                submenu: 'user',
                maincontent: content,
                location: location,
                pageTitle: title,
                tid: tid,
                tname: tname,
                product_name: _product_name,
                error: false,
                message: '',
                updatable: true
            };
        return _locals;
    };

    /**
    * _getAccountTypeList
    * アカウントタイプ一覧を取得する。
    * エラーが発生した場合、エラーメッセージを返却する。
    *
    * @param {object} req
    * @param {object} res
    * @param {string} _tName テナント名
    *
    * @return {promise}
    */
    function _getAccountTypeList(req, res, _tName){
        var _accessToken = req.session.accessToken;
        return new Promise(function (resolve, reject) {
            AccountTypeManager.getRoleList(_accessToken)
            .then(function(value){
                resolve(value);
            }).catch(function(err){
                // アカウントタイプ一覧の取得に失敗した場合、エラーメッセージを表示
                var account_err = null;
                // TODO: マジックナンバー、エラーコードを参照できるように
                if(err==503){
                  account_err = ERR_GET_ACCOUNT_TYPE_LIST;
                }else{
                  account_err = ERR_UNKNOWN;
                };
                reject(account_err);
            });
        })
    }

    //新規登録画面変数をセット
    function _getCreateUserLocals(req, tname) {
        var _locals = _getLocals('usernew', req.params.tid, tname, TITLE_USER_NEW);
        _locals.account = ACCOUNT_LABEL;
        _locals.nickname = NICKNAME_LABEL;
        _locals.email = EMAIL_LABEL;
        _locals.password = PASSWORD_LABEL;
        _locals.confirmPassword = CONFIRM_PASSWORD_LABEL;
        _locals.register = REGISTER_BUTTON_LABEL;
        _locals.actionPath = location + '/admintool/tenant/' + req.params.tid + '/user/new';
        _locals.txtAccount = '';
        _locals.txtNickname = '';
        _locals.txtEmail = '';
        _locals.group = 'Group';
        _locals.txtGroup = '';
        _locals.errMessageGroup = '';
        _locals.errMessageAccount = '';
        _locals.errMessageNickname = '';
        _locals.errMessageEmail = '';
        _locals.errMessagePassword = '';
        _locals.errMessageConfirmPassword = '';
        _locals.warningMessage = ACCOUNT_FORMAT_MESSAGE;
        _locals.successMessage = '';
        _locals.error = false;
        _locals.message = '';
        _locals.labelAccountType = ACCOUNT_TYPE_LABEL;
        _locals.errRegisterAccountType = '';
        _locals.updatable = true;
        return _locals;
    };
    //ユーザ更新画面変数をセット
    function _getUpdateUserLocals(req, tname, accountType=null, callback) {
        var _locals = _getLocals('userupdate', req.params.tid, tname, TITLE_USER_UPDATE);
        _locals.uid = req.params.uid;
        _locals.loginAccount = req.query.account;
        _locals.actionPath = location + '/admintool/tenant/' + req.params.tid
                            + '/user/' + req.params.uid
                            + '/update?account=' + req.query.account;
        //label表示
        _locals.nickname = NICKNAME_LABEL;
        _locals.errMessageNickname = '';
        _locals.labelAccount = ACCOUNT_LABEL;
        _locals.labelPassword = PASSWORD_LABEL;
        _locals.labelConfirmPassword = CONFIRM_PASSWORD_LABEL;
        _locals.buttonLabelRegister = REGISTER_BUTTON_LABEL;
        _locals.errMessagePassword = '';
        _locals.errMessageConfirmPassword = '';
        _locals.successMessage = '';
        _locals.labelChangePassword = CHANGE_PASSWORD_LABEL;
        _locals.labelAccountType = ACCOUNT_TYPE_LABEL;
        _locals.errRegisterAccountType = '';
        _locals.assignAccountType = accountType;
        _locals.updatable = true;
        _locals.group = 'Group';
        _locals.errMessageGroup = '';

        // Get info for target user.
        _userAccountManager.getUserAccountData(parseInt(req.params.uid), tname, function(_user){
          _userAccountManager.getPersonByUserAccountData(req, _user, function(res) {
            var _txtGroup = '';
            var _nickname = '';
            if (res.content.result && res.content.items.length > 0) {
                //_txtGroup = decodeUserListItems(res.content.items[0]).group;
                _txtGroup = decodeURIComponent(res.content.items[0].group)
                _nickname = decodeURIComponent(res.content.items[0].nickName)
            }
            _locals.txtGroup = _txtGroup
            _locals.txtNickname = _nickname;
            callback(_locals);
          })
        })
    };
    //ユーザ一括登録画面変数をセット
    function _getExecBatchCreateLocals(req, tname, createdResults) {
        var _locals = _getLocals('usercsv', req.params.tid, tname, TITLE_CSV_REG);
        _locals.actionPath = location + '/admintool/tenant/' + req.params.tid + '/user/csvreg';
        _locals.resultLog = (!createdResults) ? new Array() : createdResults;
        var _batchTemplateFilePath = location + '/admintool/template/user_template.csv';
        var _downloadCsvFileText = DOWNLOAD_CSV_FILE_TEXT;
        _locals.downloadCsvFile = [{
            path : _batchTemplateFilePath,
            text : _downloadCsvFileText
        }];

        _locals.buttonLabel = REGISTER_BUTTON_LABEL;
        _locals.warningMessage = [ WARN_BATCH_EXEC_MESSAGE, ACCOUNT_FORMAT_MESSAGE, WARN_BATCH_REG_LIMIT_MESSAGE];
        _locals.uploadText = UPLOAD_TEXT_BATCH_REG;
        _locals.updatable = true;
        return _locals;
    };
    //ユーザ一括更新画面変数をセット
    function _getExecBatchUpdateLocals(req, tname, updatedResults) {
        var _locals = _getLocals('usercsv', req.params.tid, tname, TITLE_CSV_UPD);
        _locals.actionPath = location + '/admintool/tenant/' + req.params.tid + '/user/csvupd';
        _locals.resultLog = updatedResults || new Array();
        var _localtionPath = location + '/admintool/tenant/' + req.params.tid + '/user/csvuserlist?ccode=';
        var _downloadCsvFileTextSJIS = DOWNLOAD_CSV_USER_LIST_SJIS;
        var _downloadCsvFileTextUTF8 = DOWNLOAD_CSV_USER_LIST_UTF8;
        _locals.downloadCsvFile = [{
            path : _localtionPath + URL_QUERY_PARAM_CHAR_CODE_VALUE_SJIS,
            text : _downloadCsvFileTextSJIS
        },{
            path : _localtionPath + URL_QUERY_PARAM_CHAR_CODE_VALUE_UTF8,
            text : _downloadCsvFileTextUTF8
        }];
        _locals.buttonLabel = UPDATE_BUTTON_LABEL;
        _locals.warningMessage = [ WARN_BATCH_EXEC_MESSAGE ];
        _locals.uploadText = UPLOAD_TEXT_BATCH_UPDATE;
        _locals.updatable = true;
        return _locals;
    };
    //一括処理の結果出力データの取得
    //@param items
    /* 中身
    [
         {
             result : true/false,
             reasons : [],
             csvRow : csvファイルの行数(※例外発生時などはプロパティが無い場合もある)
         }
    ]
    */
    function _getBatchResultOutputMessageFromItems(items){
        var _count = items.length;
        var _ret = new Array();
        for(var _i = 0; _i < _count; _i++){
            var _item = items[_i];
            var _messageDataList = _getBatchResultMessageList(_item);
            for(var _j = 0; _j < _messageDataList.length; _j++){
                var _retObj = _messageDataList[_j];
                _ret.push(_retObj);
            }
        }
        return _ret;
    }
    //reasonArrayから一括処理の結果出力メッセージリストデータの取得
    function _getBatchResultMessageList(batchRetItem){
        var _count = batchRetItem.reasons.length;
        var _ret = new Array();
        for(var _i = 0; _i < _count; _i++){
            var _reason = batchRetItem.reasons[_i];
            var _retObj = {};
            _retObj.result = batchRetItem.result;
            _retObj.message = _getBatchResultMessage(batchRetItem.csvRow, _reason);
            _ret.push(_retObj);
        }
        return _ret;
    }
    //reasonから一括処理の結果出力メッセージリストデータの取得
    function _getBatchResultMessage(csvRow, reason){
        var _csvRowStr = '';
        if(csvRow){
            _csvRowStr = csvRow + CSV_ROW_TEXT + ' : ';
        }
        var _message = (reason == UserAccountManager.ERR_REASON_NON) ? SUCCESS_PROCESS : errStrArray[reason];
        var _reasonString = _csvRowStr + _message;
        return _reasonString;
    }

    //ユーザ登録件数の取得(既存のuserAccountManagerのgetUserListを呼ぶ)
    function _getUserCount( req, callback ) {
        //ユーザ一覧取得
        var _accessToken = req.session.accessToken;
        var _requestData = {};
        _requestData.tenantId = req.params.tid;
        _requestData.start = 1;
        _requestData.count = DEFAULT_PERPAGE_USER_LIST;
        var _adminAccount = _conf.getConfData('XMPP_SERVER_ADMIN_ACCOUNT');
        _requestData.except = [_adminAccount];
        _userAccountManager.getUserList(_accessToken, _requestData, callback);
    }

    //ライセンスチェックして表示メッセージを返す
    function _checkLicense(license, result, allcnt) {
        var _message = '';
        var _error = false;
        if( license.error == LicenseManager.ERR_NO_KEYS ) {
           _message = MSG_LICENSE["ERR_NO_KEYS"];
           _error = true;
        } else if( license.error == LicenseManager.ERR_WRONG_KEY1 ) {
           _message = MSG_LICENSE["ERR_WRONG_KEY1"];
           _error = true;
        } else if (result) {
            if( license.error == LicenseManager.ERR_WRONG_KEY2 ) {
                _message = MSG_LICENSE["ERR_WRONG_KEY2"];
            }

            var _enable_count = license.count - allcnt;
            if( _enable_count <= 0 ) {
               _message += ("\n" +  MSG_LICENSE["INFO_ENABLE_USER0"]);
               _error = true;
            } else {
               _message += ("\n" + MSG_LICENSE["INFO_ENABLE_USER1"] + _enable_count + MSG_LICENSE["INFO_ENABLE_USER2"]);
            }
        } else {
           _message = MSG_LICENSE["ERR_GET_USERINFO"];
           _error = true;
        }

        return { "error" : _error, "message" : _message };
    }

    /**
    * テナントUUIDをキーに、テナント名をキャッシュ（Redis/DB)から読み出す
    * @param {string} tenantUuid テナントUUID
    * @param {function} onGetTenantName コールバック
    */
    function _getTenantNameFromCache(tenantUuid, onGetTenantName) {
        // Redis から tenant_name を読み出す
        var _tenantName = null;
        var _tenantConf = {};
        var _updatable = true;
        var _tenantXmppData = TenantXmppData.createAsOrder(tenantUuid);
        var _chef = ReadCacheBeforeDBChef.getInstance();
        _chef.cook(_tenantXmppData, function (err, dish) {
            if (err) {
                log.connectionLog(3, 'User::_getTenantNameFromCache, Could not get tenantName from cahe : ' + err.message);
                onGetTenantName(err, null);
                return;
            }
            if (dish == null) {
                log.connectionLog(3, 'User::_getTenantNameFromCache, Could not get tenantName from cahe');
                onGetTenantName(new Error('Could not get tenantName from cache'), null);
                return;
            }
            _tenantName = dish.getTenantName();
            var _TenantData = TenantData.createAsOrder(_tenantName);
            _chef.cook(_TenantData, _getTenantConfFromCache);
            function _getTenantConfFromCache(err, dish) {
                _tenantConf = dish.getTenantConf();
                if ('disclosable' in _tenantConf && 'ldap' in _tenantConf.disclosable &&
                    'ldapEnable' in _tenantConf.disclosable.ldap &&
                    _tenantConf.disclosable.ldap.ldapEnable == true &&
                    'ldapUpdatable' in _tenantConf.disclosable.ldap &&
                    _tenantConf.disclosable.ldap.ldapUpdatable == false
                ) {
                    _updatable = false;
                }
                onGetTenantName(null, _tenantName, _updatable);
            }
        });
    }

    exports.errStrArray = errStrArray;
    exports.ACCOUNT_LABEL = ACCOUNT_LABEL;
    exports.NICKNAME_LABEL = NICKNAME_LABEL;
    exports.EMAIL_LABEL = EMAIL_LABEL;
    exports.PASSWORD_LABEL = PASSWORD_LABEL;
    exports.CONFIRM_PASSWORD_LABEL = CONFIRM_PASSWORD_LABEL;
    exports.REGISTER_BUTTON_LABEL = REGISTER_BUTTON_LABEL;
    exports.SUCCESS_CREATE_USER = SUCCESS_CREATE_USER;
    exports.URL_QUERY_PARAM_ACCOUNT = URL_QUERY_PARAM_ACCOUNT;
    exports.URL_QUERY_PARAM_NICKNAME = URL_QUERY_PARAM_NICKNAME;
    exports.URL_QUERY_PARAM_EMAIL = URL_QUERY_PARAM_EMAIL;
    exports.URL_QUERY_PARAM_CHAR_CODE_VALUE_UTF8 = URL_QUERY_PARAM_CHAR_CODE_VALUE_UTF8;
    exports.URL_QUERY_PARAM_CHAR_CODE_VALUE_SJIS = URL_QUERY_PARAM_CHAR_CODE_VALUE_SJIS;

})();
