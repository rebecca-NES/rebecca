$(function(){
    //tableエレメント取得
    var _tableObj = $('table');

    //利用停止チェックボックスのclickイベント登録
    _tableObj.on('click', 'input[type=checkbox]', function(){
        $(this).prop('disabled',true);
        _updateUserAccountStatus($(this));
    });

    //利用停止チェックボックスのsuspendイベント登録(独自イベント)
    _tableObj.on('suspend', 'input[type=checkbox]', function(){
        var _userItemElm = $(this).parent().parent();
        _makeUserItemSuspend(_userItemElm);
    });

    //利用停止チェックボックスのactiveイベント登録(独自イベント)
    _tableObj.on('active', 'input[type=checkbox]', function(){
        var _userItemElm = $(this).parent().parent();
        _makeUserItemElmActive(_userItemElm);
    });


    //ユーザアカウントステータスの更新
    function _updateUserAccountStatus(checkBoxElm){
        var _url = checkBoxElm.attr('action');
        var _accessTokenHash = checkBoxElm.attr('ATH');
        var _responseDataType = 'json';
        var _check = checkBoxElm.prop('checked');
        var _reqJsonData = _getReqJsonDataForUpdateStatus(_check, _accessTokenHash);
        $.post(_url, _reqJsonData, _onUpdateStatusCallBack, _responseDataType);
        return;

        //ステータス更新応答のコールバック
        function _onUpdateStatusCallBack(data){
            var _result = data.result;
            if(!_result){
                _rollback();
                return;
            }
            var _content = data.content;
            var _status = _content.status;
            _onUpdateUserAccountStatus(_status, checkBoxElm);

            //ステータス変更による登録可能ユーザの表示変更処理
            location.reload();
            return;
        }

        //チェックボックスの表示をロールバックする
        function _rollback(){
            var _rollbackStatus = _getStatus(!_check);
            _onUpdateUserAccountStatus(_rollbackStatus, checkBoxElm);
            return;
        }
    }

    //リクエスト用のJSONデータ取得
    function _getReqJsonDataForUpdateStatus(flg, accessTokenHash){
        return {
            status : _getStatus(flg),
            ATH : accessTokenHash
        }
    }

    //ステータスの値を取得
    function _getStatus(flg){
        return (!flg)? 0 : 2;
    }


    //利用停止ステータス変更のコールバック
    function _onUpdateUserAccountStatus(status, checkBoxElm){
        if(status == 2){
            checkBoxElm.trigger('suspend');
        }else{
            checkBoxElm.trigger('active');
        }
    }

    //ユーザ一覧の要素をアクティブ化する
    function _makeUserItemElmActive(userItemElm){
        var _accountElm = $(userItemElm).children('td.user-list-account');
        var _nicknameElm = $(userItemElm).children('td.user-list-nickname');
        var _stausElm = $(userItemElm).children('td.user-list-status').children('input[type=checkbox]');
        _accountElm.removeClass('line-through');
        _nicknameElm.removeClass('line-through');
        _stausElm.prop('checked',false);
        _stausElm.prop('disabled',false);
    }

    //ユーザをユーザ一覧の要素を休止化する
    function _makeUserItemSuspend(userItemElm){
        var _accountElm = $(userItemElm).children('td.user-list-account');
        var _nicknameElm = $(userItemElm).children('td.user-list-nickname');
        var _stausElm = $(userItemElm).children('td.user-list-status').children('input[type=checkbox]');
        _accountElm.addClass('line-through');
        _nicknameElm.addClass('line-through');
        _stausElm.prop('checked',true);
        _stausElm.prop('disabled',false);
    }

});
