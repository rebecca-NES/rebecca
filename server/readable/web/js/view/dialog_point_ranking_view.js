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
function DialogPointRankingView(point) {
    this._dialogAreaElement = $('#modal_area');
    this._dialogInnerElement = null;
    this._point = point
    this._weekRankingList = null;
    this._monthRankingList = null;
    this._yearRankingList = null;
    DialogOkCancelView.call(this);

};(function() {
    DialogPointRankingView.prototype = $.extend({}, DialogOkCancelView.prototype);
    var _super = DialogOkCancelView.prototype;
    var _proto = DialogPointRankingView.prototype;

    _proto._init = function() {
        var _self = this;

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
        })

        _self._dialogInnerElement.find('.modal_btn').on('click', function(){
            _super.cleanup.call(_self);
            _self.cleanup();
            ViewUtils.modal_allexit();
        })

        _self.showMonthRanking();

        _self._dialogAreaElement.on('change', 'input[name="ranking-period"]:radio', function(){
            _self._dialogInnerElement.find('.scroll_content').off();
            $('#rankingList').children().remove();
            _self.ps.update();
            _self._dialogInnerElement.find('#dialog-error').text('')
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

    function cleanUp(_self) {
        _self._dialogAreaElement = null;
        _self._displayAllProjects = null;
        _self._weekRankingList = null;
        _self._monthRankingList = null;
        _self._yearRankingList = null;
        _self._point = null;
    }

    _proto.getFrame = function() {
        var _self = this;
        var _ret = "";
        _ret = '<div id="pointranking_modal" class="card modal_card">';
        _ret += '<div class="card_title">';
        if (_self._point == 0) {
            _ret += '  <p>' + Resource.getMessage('dialog_goodjob_point_ranking') + '</p>';
        } else {
            _ret += '  <p>' + Resource.getMessage('dialog_thanks_point_ranking') + '</p>';
        }
        _ret += '</div>';
        _ret += '    <div class="modal_content_wrapper">';
        _ret += '      <p class="modal_title">' + Resource.getMessage('dialog_select_ranking_period') + ':</p>';
        _ret += '<div class="select-ranking-period">\
                  <label for="period-week" class="radio">\
                    <input type="radio" name="ranking-period" id="period-week">\
                    <span></span>' + Resource.getMessage('dialog_ranking_week') + '\
                  </label>\
                  <label for="period-month" class="radio">\
                    <input type="radio" name="ranking-period" id="period-month" checked="">\
                    <span></span>' + Resource.getMessage('dialog_ranking_month') + '\
                  </label>\
                  <label for="period-year" class="radio">\
                    <input type="radio" name="ranking-period" id="period-year">\
                    <span></span>' + Resource.getMessage('dialog_ranking_year') + '\
                  </label>\
                </div>'
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
        var _self = this;
        var dt = new Date();
        dt.setDate(dt.getDate()-7);
        var weekAgo = getDate(dt);

        if (_self._weekRankingList) {
            _self._dialogAreaElement.find('#rankingList').append(setRankingListFrame(_self,_self._weekRankingList));
            return;
        }

        var getWeekRanking = null;
        if (_self._point == 0) {
            getWeekRanking = CubeeController.getInstance().getGoodJobRanking(weekAgo, 100, 0 ,100);
        } else {
            getWeekRanking = CubeeController.getInstance().getThanksPointsRanking(weekAgo, 100, 0 ,100);
        }
        getWeekRanking.then(function(result){
            if (result.errorCode == 0 && result.content.itemCount) {
                _self.weekRankingList = null;
                _self._weekRankingList = result.content.items;
                _self._dialogAreaElement.find('#rankingList').append(setRankingListFrame(_self,_self._weekRankingList));
            } else if (result.content.itemCount == 0) {
                _self._dialogInnerElement.find('#dialog-error').text(Resource.getMessage('dialog_error_nothing_ranking'))
            }
        }).catch(function(err){
            _self._dialogInnerElement.find('#dialog-error').text(Resource.getMessage('dialog_error_get_ranking'))
        })
    }

    _proto.showMonthRanking = function() {
        var _self = this;
        var dt = new Date();
        dt.setMonth(dt.getMonth()-1);
        var monthAgo = getDate(dt);

        if (_self._monthRankingList) {
            _self._dialogAreaElement.find('#rankingList').append(setRankingListFrame(_self,_self._monthRankingList));
            return;
        }

        var getMonthRanking = null;
        if (_self._point == 0) {
            getMonthRanking = CubeeController.getInstance().getGoodJobRanking(monthAgo, 100, 0 ,100);
        } else {
            getMonthRanking = CubeeController.getInstance().getThanksPointsRanking(monthAgo, 100, 0 ,100);
        }
        getMonthRanking.then(function(result){
            if (result.errorCode == 0 && result.content.itemCount) {
                _self._monthRankingList = null;
                _self._monthRankingList = result.content.items;
                _self._dialogAreaElement.find('#rankingList').append(setRankingListFrame(_self,_self._monthRankingList));
            } else if (result.content.itemCount == 0) {
                _self._dialogInnerElement.find('#dialog-error').text(Resource.getMessage('dialog_error_nothing_ranking'))
            }
        }).catch(function(err){
            _self._dialogInnerElement.find('#dialog-error').text(Resource.getMessage('dialog_error_get_ranking'))
        })
    }

    _proto.showYearRanking = function() {
        var _self = this;
        var dt = new Date();
        dt.setYear(dt.getFullYear()-1);
        var yearAgo = getDate(dt);

        if (_self._yearRankingList) {
            _self._dialogAreaElement.find('#rankingList').append(setRankingListFrame(_self,_self._yearRankingList));
            return;
        }

        var getYearRanking = null;
        if (_self._point == 0) {
            getYearRanking = CubeeController.getInstance().getGoodJobRanking(yearAgo, 100, 0 ,100);
        } else {
            getYearRanking = CubeeController.getInstance().getThanksPointsRanking(yearAgo, 100, 0 ,100);
        }
        getYearRanking.then(function(result){
            if (result.errorCode == 0 && result.content.itemCount) {
                _self._yearRankingList = null;
                _self._yearRankingList = result.content.items;
                _self._dialogAreaElement.find('#rankingList').append(setRankingListFrame(_self,_self._yearRankingList));
            } else if (result.content.itemCount == 0) {
                _self._dialogInnerElement.find('#dialog-error').text(Resource.getMessage('dialog_error_nothing_ranking'))
            }
        }).catch(function(err){
            _self._dialogInnerElement.find('#dialog-error').text(Resource.getMessage('dialog_error_get_ranking'))
        })
    }

    function setRankingListFrame(_self, _rankingList) {
        var _rankingCount= _rankingList.length;

        if(_rankingCount == 0){
            showErrMessage(_self._dialogMessageToPage, Resource.getMessage('dialog_error_nothing_ranking'));
            return;
        }

        var _ret = "";
        for(var i = 0; i< _rankingCount; i++) {
            var _rank = _rankingList[i].rank;
            var _point = _rankingList[i].points;
            var _jid = _rankingList[i].jid;
            var _nickname = Utils.urldecode(Utils.getSafeStringData(_rankingList[i].nickname));
            var _account = Utils.urldecode(Utils.getSafeStringData(ViewUtils.getCubeeAccountName(_jid)));
            var _group = Utils.urldecode(Utils.getSafeStringData(_rankingList[i].affiliation.join(",")));

            var _person = new Person();
            _person.setJid(_rankingList[i].jid);
            _person.setUserName(Utils.urldecode(Utils.getSafeStringData(_rankingList[i].nickname)));
            var _groups = Utils.getSafeArrayData(_rankingList[i].affiliation);
            var _groupList = [];
            for(var j=0; j<_groups.length; j++){
                _groupList.push(Utils.urldecode(_groups[j]));
            }
            _person.setGroup(_groupList);
            _person.setAvatarType(Utils.getSafeStringData(_rankingList[i].avatartype));
            _person.setAvatarData(Utils.getSafeStringData(_rankingList[i].avatardata));
            _person.setLoginAccount(Utils.urldecode(Utils.getSafeStringData(ViewUtils.getCubeeAccountName(_jid))));

            var avatarHtml = '';
            if (ViewUtils.getAvatarUrl(_person) == ViewUtils.DEFAULT_USER_AVATAR_SRC) {
              avatarHtml = ViewUtils.getDefaultAvatarHtml(_person);
            } else {
              avatarHtml = ViewUtils.getAvatarDataHtmlFromPerson(_person)
            }

            if (LoginUser.getInstance().getJid() == _jid) {
                _ret += '<li jid="' + _jid + '">';
            } else {
                _ret += '<li jid="' + _jid + '">';
            }
            _ret += '  <a title="' + Utils.convertEscapedHtml(_nickname) + '  ' + Utils.convertEscapedHtml(_group) + '">';
            _ret += '    <div style="display:inline-block; width:150px">';
            _ret += '    <span>' + _rank + '位：' + _point + 'ポイント</span>';
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
        var resultDate = "";
        if (_date.getFullYear()) {
            var y = _date.getFullYear();
            var m = ("00" + (_date.getMonth()+1)).slice(-2);
            var d = ("00" + _date.getDate()).slice(-2);
            resultDate = y + "/" + m + "/" + d;
        }
        return resultDate;
    }

});
