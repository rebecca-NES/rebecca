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

$(function(){
    var _tableObj = $('table');

    _tableObj.on('click', 'input[type=checkbox]', function(){
        $(this).prop('disabled',true);
        _updateUserAccountStatus($(this));
    });

    _tableObj.on('suspend', 'input[type=checkbox]', function(){
        var _userItemElm = $(this).parent().parent();
        _makeUserItemSuspend(_userItemElm);
    });

    _tableObj.on('active', 'input[type=checkbox]', function(){
        var _userItemElm = $(this).parent().parent();
        _makeUserItemElmActive(_userItemElm);
    });


    function _updateUserAccountStatus(checkBoxElm){
        var _url = checkBoxElm.attr('action');
        var _accessTokenHash = checkBoxElm.attr('ATH');
        var _responseDataType = 'json';
        var _check = checkBoxElm.prop('checked');
        var _reqJsonData = _getReqJsonDataForUpdateStatus(_check, _accessTokenHash);
        $.post(_url, _reqJsonData, _onUpdateStatusCallBack, _responseDataType);
        return;

        function _onUpdateStatusCallBack(data){
            var _result = data.result;
            if(!_result){
                _rollback();
                return;
            }
            var _content = data.content;
            var _status = _content.status;
            _onUpdateUserAccountStatus(_status, checkBoxElm);

            location.reload();
            return;
        }

        function _rollback(){
            var _rollbackStatus = _getStatus(!_check);
            _onUpdateUserAccountStatus(_rollbackStatus, checkBoxElm);
            return;
        }
    }

    function _getReqJsonDataForUpdateStatus(flg, accessTokenHash){
        return {
            status : _getStatus(flg),
            ATH : accessTokenHash
        }
    }

    function _getStatus(flg){
        return (!flg)? 0 : 2;
    }


    function _onUpdateUserAccountStatus(status, checkBoxElm){
        if(status == 2){
            checkBoxElm.trigger('suspend');
        }else{
            checkBoxElm.trigger('active');
        }
    }

    function _makeUserItemElmActive(userItemElm){
        var _accountElm = $(userItemElm).children('td.user-list-account');
        var _nicknameElm = $(userItemElm).children('td.user-list-nickname');
        var _stausElm = $(userItemElm).children('td.user-list-status').children('input[type=checkbox]');
        _accountElm.removeClass('line-through');
        _nicknameElm.removeClass('line-through');
        _stausElm.prop('checked',false);
        _stausElm.prop('disabled',false);
    }

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
