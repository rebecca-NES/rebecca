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
function DialogMurmurListView() {
    this._dialogAreaElement = $('#modal_area');
    this._dialogInnerElement = null;
    this._weekRankingList = null;
    this._monthRankingList = null;
    this._yearRankingList = null;
    DialogOkCancelView.call(this);

};(function() {
    DialogMurmurListView.prototype = $.extend({}, DialogOkCancelView.prototype);
    let _super = DialogOkCancelView.prototype;
    let _proto = DialogMurmurListView.prototype;

    _proto._init = function() {
        let _self = this;

        _self._dialogAreaElement.html(_self.getFrame());
        _self._dialogInnerElement = _self._dialogAreaElement.children();

        _self.ps = new PerfectScrollbar(_self._dialogInnerElement.find('.scroll_content')[0], {
            suppressScrollX: true
        });
        dlg_scr.push(_self.ps);

        _self._dialogInnerElement.on('click', ".modal_exit", function() {
            _super.cleanup.call(_self);
            _self.cleanup();
            ViewUtils.modal_allexit();
            return false;
        })

        _self._dialogInnerElement.find('.modal_btn').on('click', function(){
            _super.cleanup.call(_self);
            _self.cleanup();
            ViewUtils.modal_allexit();
            return false;
        })

        _self.showMonthRanking();

        _self._dialogAreaElement.on('change', 'input[name="ranking-period"]:radio', function(){
            _self._dialogInnerElement.find('.scroll_content').off();
            $('#rankingList').children().remove();
            _self.ps.update();
            _self._dialogInnerElement.find('#dialog-error').text('');
            switch ($(this).attr('id')) {
                case 'period-week':
                    _self.showWeekRanking();
                    break;
                case 'period-month':
                    _self.showMonthRanking();
                    break;
                case 'period-year':
                    _self.showYearRanking();
                    break;
                default:
                    break;
            }
        });
    };

    /* Unused function cleanUp.
    function cleanUp(_self) {
        _self._dialogAreaElement = null;
        _self._displayAllProjects = null;
        _self._weekRankingList = null;
        _self._monthRankingList = null;
        _self._yearRankingList = null;
    } */

    _proto.getFrame = function() {
        let _self = this;
        let _ret = "";
        _ret = '<div id="murmurlist_modal" class="card modal_card">';
        _ret += '<div class="card_title">';
        _ret += '  <p>' + Resource.getMessage('dialog_murmur_list') + '</p>';
        _ret += '</div>';
        _ret += '<div class="list_wrapper scroll_content">';
        _ret += '  <ul class="modal_list" id="rankingList">';
        _ret += '  </ul>';
        _ret += '</div>';
        _ret += '    <div class="btn_wrapper">';
        _ret += '      <p id="dialog-error" class="ui-state-error-text dialog_error_footer"></p>';
        _ret += '      <button type="button" class="modal_btn success_btn ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only" role="button" aria-disabled="false"><span class="ui-button-text">' + Resource.getMessage('dialog_label_ok') + '</span></button>';
        _ret += '    </div>';
        _ret += '<a class="modal_exit modal_exit_btn ico_btn ui-dialog-titlebar-close ui-corner-all" role="button"><i class="fa fa-times"></i></a>';
        _ret += '</div>';
        return _ret;
    };

    _proto.showWeekRanking = function() {
        let _self = this;
        let dt = new Date();
        dt.setDate(dt.getDate()-7);
        let weekAgo = getDate(dt);

        if (_self._weekRankingList) {
            _self._dialogAreaElement.find('#rankingList').append(setRankingListFrame(_self,_self._weekRankingList));
            return;
        }

        let getWeekRanking = null;
        getWeekRanking = CubeeController.getInstance().getMurmurRanking(weekAgo, 100, 0 ,100);
        getWeekRanking.then(function(result){
            if (result.errorCode == 0 && result.content.data.items.length) {
                _self.weekRankingList = null;
                _self._weekRankingList = result.content.data.items;
                _self._dialogAreaElement.find('#rankingList').append(setRankingListFrame(_self,_self._weekRankingList)).click((event)=>{
                    let jid = $(event.target).closest("li").attr("jid");
                    ColumnManager.getInstance().addMurmurColumn(jid,true,false,false);
                    ViewUtils.modal_allexit();
                });
            } else if (result.content.data.items.length == 0) {
                _self._dialogInnerElement.find('#dialog-error').text(Resource.getMessage('dialog_error_nothing_ranking'))
            }
        }).catch(function(err){
            _self._dialogInnerElement.find('#dialog-error').text(Resource.getMessage('dialog_error_get_ranking'))
        })
    }

    _proto.showMonthRanking = function() {
        let _self = this;
        let dt = new Date();
        dt.setMonth(dt.getMonth()-1);
        let monthAgo = getDate(dt);

        if (_self._monthRankingList) {
            _self._dialogAreaElement.find('#rankingList').append(setRankingListFrame(_self,_self._monthRankingList));
            return;
        }

        let getMonthRanking = null;
        getMonthRanking = CubeeController.getInstance().getMurmurRanking(monthAgo, 100, 0 ,100);
        getMonthRanking.then(function(result){
            if (result.errorCode == 0 && result.content.data.items.length) {
                _self._monthRankingList = null;
                _self._monthRankingList = result.content.data.items;
                _self._dialogAreaElement.find('#rankingList').append(setRankingListFrame(_self,_self._monthRankingList)).click((event)=>{
                    let jid = $(event.target).closest("li").attr("jid");
                    ColumnManager.getInstance().addMurmurColumn(jid,true,false,false);
                    ViewUtils.modal_allexit();
                });
            } else if (result.content.data.items.length == 0) {
                _self._dialogInnerElement.find('#dialog-error').text(Resource.getMessage('dialog_error_nothing_ranking'))
            }
        }).catch(function(err){
            _self._dialogInnerElement.find('#dialog-error').text(Resource.getMessage('dialog_error_get_ranking'))
        })
    }

    _proto.showYearRanking = function() {
        let _self = this;
        let dt = new Date();
        dt.setYear(dt.getFullYear()-1);
        let yearAgo = getDate(dt);

        if (_self._yearRankingList) {
            _self._dialogAreaElement.find('#rankingList').append(setRankingListFrame(_self,_self._yearRankingList));
            return;
        }

        let getYearRanking = null;
        getYearRanking = CubeeController.getInstance().getMurmurRanking(yearAgo, 100, 0 ,100);
        getYearRanking.then(function(result){
            if (result.errorCode == 0 && result.content.data.items.length) {
                _self._yearRankingList = null;
                _self._yearRankingList = result.content.data.items;
                _self._dialogAreaElement.find('#rankingList').append(setRankingListFrame(_self,_self._yearRankingList)).click((event)=>{
                    let jid = $(event.target).closest("li").attr("jid");
                    ColumnManager.getInstance().addMurmurColumn(jid,true,false,false);
                    ViewUtils.modal_allexit();
                });
            } else if (result.content.data.items.length == 0) {
                _self._dialogInnerElement.find('#dialog-error').text(Resource.getMessage('dialog_error_nothing_ranking'))
            }
        }).catch(function(err){
            _self._dialogInnerElement.find('#dialog-error').text(Resource.getMessage('dialog_error_get_ranking'))
        })
    }

    function setRankingListFrame(_self, _rankingList) {
        let _rankingCount= _rankingList.length;

        if(_rankingCount == 0){
            showErrMessage(_self._dialogMessageToPage, Resource.getMessage('dialog_error_nothing_murmur'));
            return;
        }

        let _ret = "";
        for(let i = 0; i< _rankingCount; i++) {
            let _jid = _rankingList[i].jid;
            let _nickname = Utils.urldecode(Utils.getSafeStringData(_rankingList[i].nickName));
            let _account = Utils.urldecode(Utils.getSafeStringData(ViewUtils.getCubeeAccountName(_jid)));
            let _group = Utils.urldecode(Utils.getSafeStringData(_rankingList[i].affiliation.join(",")));

            let _person = new Person();
            _person.setJid(_rankingList[i].jid);
            _person.setUserName(Utils.urldecode(Utils.getSafeStringData(_rankingList[i].nickName)));
            let _groups = Utils.getSafeArrayData(_rankingList[i].affiliation);
            let _groupList = [];
            for(let j=0; j<_groups.length; j++){
                _groupList.push(Utils.urldecode(_groups[j]));
            }
            _person.setGroup(_groupList);
            _person.setAvatarType(Utils.getSafeStringData(_rankingList[i].avatartype));
            _person.setAvatarData(Utils.getSafeStringData(_rankingList[i].avatardata));
            _person.setLoginAccount(Utils.urldecode(Utils.getSafeStringData(ViewUtils.getCubeeAccountName(_jid))));

            let avatarHtml = '';
            if (ViewUtils.getAvatarUrl(_person) == ViewUtils.DEFAULT_USER_AVATAR_SRC) {
              avatarHtml = ViewUtils.getDefaultAvatarHtml(_person);
            } else {
              avatarHtml = ViewUtils.getAvatarDataHtmlFromPerson(_person);
            }

            _ret += '<li jid="' + _jid + '">';
            _ret += '  <a title="' + Utils.convertEscapedHtml(_nickname) + '  ' + Utils.convertEscapedHtml(_group) + '">';
            _ret += '    <div style="display:inline-block">';
            _ret += '    </div>';
            _ret += '    <span class="ico ico_user">';
            _ret += avatarHtml;
            _ret += '    </span>';
            _ret += '    <span class="name">' + Utils.convertEscapedHtml(_nickname) + '</span>';
            _ret += '    <span class="group">' + Utils.convertEscapedHtml(_group) + '</span>';
            _ret += '</a></li>';
        }
        return _ret;
    }

    function getDate(_date) {
        let resultDate = "";
        if (_date.getFullYear()) {
            let y = _date.getFullYear();
            let m = ("00" + (_date.getMonth()+1)).slice(-2);
            let d = ("00" + _date.getDate()).slice(-2);
            resultDate = y + "/" + m + "/" + d;
        }
        return resultDate;
    }

})();
