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

function TooltipView() {
};(function() {
    TooltipView.prototype = $.extend({}, ViewCore.prototype);
    var _super = ViewCore.prototype;
    var _proto = TooltipView.prototype;

    var _tooltipView = new TooltipView();
    TooltipView.getInstance = function() {
        return _tooltipView;
    };

    TooltipView.TYPE_UNKNOWN = 0;
    TooltipView.TYPE_PUBLIC = 1;
    TooltipView.TYPE_PUBLIC_REPLY = 2;
    TooltipView.TYPE_TASK = 3;
    TooltipView.TYPE_CHAT = 4;
    TooltipView.TYPE_SYSTEM_MESSAGE_ASSIGNED_TASK = 5;
    TooltipView.TYPE_ASSIGNED_TASK = 6;
    TooltipView.TYPE_USER_AVATAR = 7;
    TooltipView.TYPE_INBOX = 8;
    TooltipView.TYPE_PARENT_TASK = 9;
    TooltipView.TYPE_PARENT_TASK_CANCEL = 10;
    TooltipView.TYPE_CHILD_TASK = 11;
    TooltipView.TYPE_PUBLIC_REPLY_CAN_DELETE = 12;
    TooltipView.TYPE_CHAT_CAN_DELETE = 13;
    TooltipView.TYPE_INNER_MESSAGE_CHILD_TASK_ACTION = 14;
    TooltipView.TYPE_INNER_MESSAGE_CHILD_ASSIGNED_TASK_ACTION = 15;
    TooltipView.TYPE_INNER_MESSAGE_CHILD_ASSIGNED_MY_TASK_ACTION = 16;
    TooltipView.TYPE_QUESTIONNAIRE = 17;

    var TOOLTIP_SHOW_TIME = 0;
    var TOOLTIP_HIDE_TIME = 0;
    var LIST_AREA_TOOLTIP_ZINDEX = 100000;
    var LIST_AREA_TOOLTIP_MAX_WIDTH = '80%';
    var COLUMN_TITLE_TOOLTIP_MAX_WIDTH = '80%';
    var MAIL_MESSAGE_SUBJECT_TOOLTIP_MAX_WIDTH = '80%';

     TooltipView.displayedActionToolTipTargetElem = null;

    _proto.setActionToolTip = function(type, owner, tooltipElem, isShowConversation) {
        if (_validation({'type' : type, 'owner' : owner}) == false) {
            return false;
        }
        if(isShowConversation != false) {
            isShowConversation = true;
        }
        var _selector = null;
        switch(type) {
          case TooltipView.TYPE_PUBLIC:
            _selector = '#tooltipTimelineMessageActionBar';
            break;
          case TooltipView.TYPE_PUBLIC_REPLY:
            _selector = '#tooltipReplyMessageActionBar';
            break;
          case TooltipView.TYPE_PUBLIC_REPLY_CAN_DELETE:
            _selector = '#tooltipReplyMessageActionCanDeleteBar'
            break;
          case TooltipView.TYPE_TASK:
            _selector = '#tooltipTaskMessageAction';
            break;
          case TooltipView.TYPE_CHILD_TASK:
            _selector = '#tooltipChildTaskMessageAction';
            break;
          case TooltipView.TYPE_CHAT:
            _selector = '#tooltipChatMessageActionBar';
            break;
          case TooltipView.TYPE_CHAT_CAN_DELETE:
            _selector = '#tooltipChatMessageActionCanDeleteBar';
            break;
          case TooltipView.TYPE_SYSTEM_MESSAGE_ASSIGNED_TASK:
            _selector = '#tooltipSystemMessageTaskAction';
            break;
          case TooltipView.TYPE_ASSIGNED_TASK:
            _selector= '#tooltipTaskMessageAssignedTaskAction';
            break;
          case TooltipView.TYPE_INBOX:
            _selector = '#tooltipInboxMessageAction';
            break;
          case TooltipView.TYPE_PARENT_TASK:
            _selector = '#tooltipParentTaskMessageAction';
            break;
          case TooltipView.TYPE_PARENT_TASK_CANCEL:
            _selector = '#tooltipParentTaskMessageCancelAction';
              break;
          case TooltipView.TYPE_INNER_MESSAGE_CHILD_TASK_ACTION:
              _selector= '#tooltipInnerMesasgeChildTaskAction';
              break;
          case TooltipView.TYPE_INNER_MESSAGE_CHILD_ASSIGNED_TASK_ACTION:
              _selector= '#tooltipInnerMesasgeChildAssignedTaskAction';
              break;
          case TooltipView.TYPE_INNER_MESSAGE_CHILD_ASSIGNED_MY_TASK_ACTION:
              _selector= '#tooltipInnerMesasgeChildAssignedMyTaskAction';
              break;
          case TooltipView.TYPE_QUESTIONNAIRE:
              _selector= '#tooltipQuestionnaireMessageAction';
              break;
          default:
            break;
        }
        if (!_selector) {
          return false;
        }
        if(tooltipElem.find(".popup_menu.msg_menu").length != 0){
            tooltipElem.find(".popup_menu.msg_menu").append($(_selector).html());
        }else{
            tooltipElem.append($(_selector).html());
        }
        owner.append(tooltipElem);
        return true;
    };


    _proto.setActionToolTipEvent = function(subData, elem) {
        var innerActionRejectElem = elem.find('.action-Reject-task_child');
        if (innerActionRejectElem.length == 1) {
            innerActionRejectElem.on('click', function() {
                $(this).parent().hide();
                var _message = subData.childTask;
                var _updateTaskMessage = new TaskMessage();
                _updateTaskMessage.copy(_message);
                _updateTaskMessage.setStatus(TaskMessage.STATUS_REJECTED);
                function updateTaskCallback(result) {
                    console.log("update task : " + result);
                };
                if (CubeeController.getInstance().updateTask(_updateTaskMessage, updateTaskCallback) == false) {
                    console.log("faild to update task");
                }
            });
        }
        var innerActionNewTaskElem = elem.find('.action-accept-new-task_child');
        if(innerActionNewTaskElem.length == 1) {
            innerActionNewTaskElem.on('click', function() {
                $(this).parent().hide();
                var _message = subData.childTask;
                var _updateTaskMessage = new TaskMessage();
                _updateTaskMessage.copy(_message);
                _updateTaskMessage.setStatus(TaskMessage.STATUS_NEW);
                function updateTaskCallback(result) {
                    console.log("update task : " + result);
                };
                if (CubeeController.getInstance().updateTask(_updateTaskMessage, updateTaskCallback) == false) {
                    console.log("faild to update task");
                }
            });
        }
        var innerActionDoingElem = elem.find('.action-doing-task_child');
        if (innerActionDoingElem.length == 1) {
            innerActionDoingElem.on('click', function() {
                $(this).parent().hide();
                var _message = subData.childTask;
                var _updateTaskMessage = new TaskMessage();
                _updateTaskMessage.copy(_message);
                _updateTaskMessage.setStatus(TaskMessage.STATUS_DOING);
                function updateTaskCallback(result) {
                    console.log("update task : " + result);
                };
                if (CubeeController.getInstance().updateTask(_updateTaskMessage, updateTaskCallback) == false) {
                    console.log("faild to update task");
                }
            });
        }
        var innerActionFinishElem = elem.find('.action-finish-task_child');
        if (innerActionFinishElem.length == 1) {
            innerActionFinishElem.on('click', function() {
                $(this).parent().hide();
                var _message = subData.childTask;
                var _updateTaskMessage = new TaskMessage();
                _updateTaskMessage.copy(_message);
                _updateTaskMessage.setStatus(TaskMessage.STATUS_FINISHED);
                function updateTaskCallback(result) {
                    console.log("update task : " + result);
                };
                if (CubeeController.getInstance().updateTask(_updateTaskMessage, updateTaskCallback) == false) {
                    console.log("faild to update task");
                }
            });
        }
    };
    _proto._setMessageInnerActionToolTip = function(type, owner, tooltipElem, subData) {
        if (_validation({'type' : type, 'owner' : owner}) == false) {
            return false;
        }
        var _self = this;
        var _toolTipSetting = _self._getActionToolTipSetting(owner);
        _self._setExclusionControlActionToolTip(owner, tooltipElem, _toolTipSetting);

        switch(type) {
            case TooltipView.TYPE_INNER_MESSAGE_CHILD_TASK_ACTION:
                _toolTipSetting.content = $('#tooltipInnerMesasgeChildTaskAction').html();
                _toolTipSetting.spacing = [-110, -30];
                break;
            case TooltipView.TYPE_INNER_MESSAGE_CHILD_ASSIGNED_TASK_ACTION:
                _toolTipSetting.content = $('#tooltipInnerMesasgeChildAssignedTaskAction').html();
                _toolTipSetting.spacing = [-55, -30];
                break;
            case TooltipView.TYPE_INNER_MESSAGE_CHILD_ASSIGNED_MY_TASK_ACTION:
                _toolTipSetting.content = $('#tooltipInnerMesasgeChildAssignedMyTaskAction').html();
                _toolTipSetting.spacing = [-82, -30];
                break;
            default:
                _toolTipSetting = null;
                break;
        }
        if (_toolTipSetting == null) {
            return false;
        }
        if (ViewUtils.isIE8()) _toolTipSetting.updateOn = 'dummy';
        var mTipElem = owner.children('.mTip:last');
        var innerActionDoingElem = mTipElem.find('.action-doing-inner-task');
        if (innerActionDoingElem.length == 1) {
            innerActionDoingElem.on('click', function() {
                $(this).parent().hide();
                var _message = subData.childTask;
                var _updateTaskMessage = new TaskMessage();
                _updateTaskMessage.copy(_message);
                _updateTaskMessage.setStatus(TaskMessage.STATUS_DOING);
                function updateTaskCallback(result) {
                    console.log("update task : " + result);
                };
                if (CubeeController.getInstance().updateTask(_updateTaskMessage, updateTaskCallback) == false) {
                    console.log("faild to update task");
                }
            });
        }
        var innerActionFinishElem = mTipElem.find('.action-finish-inner-task');
        if (innerActionFinishElem.length == 1) {
            innerActionFinishElem.on('click', function() {
                $(this).parent().hide();
                var _message = subData.childTask;
                var _updateTaskMessage = new TaskMessage();
                _updateTaskMessage.copy(_message);
                _updateTaskMessage.setStatus(TaskMessage.STATUS_FINISHED);
                function updateTaskCallback(result) {
                    console.log("update task : " + result);
                };
                if (CubeeController.getInstance().updateTask(_updateTaskMessage, updateTaskCallback) == false) {
                    console.log("faild to update task");
                }
            });
        }
        var innerActionRejectElem = mTipElem.find('.action-reject-inner-task');
        if (innerActionRejectElem.length == 1) {
            innerActionRejectElem.on('click', function() {
                $(this).parent().hide();
                var _message = subData.childTask;
                var _updateTaskMessage = new TaskMessage();
                _updateTaskMessage.copy(_message);
                _updateTaskMessage.setStatus(TaskMessage.STATUS_REJECTED);
                function updateTaskCallback(result) {
                    console.log("update task : " + result);
                };
                if (CubeeController.getInstance().updateTask(_updateTaskMessage, updateTaskCallback) == false) {
                    console.log("faild to update task");
                }
            });
        }

        var innerActionNewTaskElem = mTipElem.find('.action-accept-new-inner-task');
        if(innerActionNewTaskElem.length == 1) {
            innerActionNewTaskElem.on('click', function() {
                $(this).parent().hide();
                var _message = subData.childTask;
                var _updateTaskMessage = new TaskMessage();
                _updateTaskMessage.copy(_message);
                _updateTaskMessage.setStatus(TaskMessage.STATUS_NEW);
                function updateTaskCallback(result) {
                    console.log("update task : " + result);
                };
                if (CubeeController.getInstance().updateTask(_updateTaskMessage, updateTaskCallback) == false) {
                    console.log("faild to update task");
                }
            });
        }

        return true;
    };

    _proto._getActionToolTipSetting = function(owner) {
        return {
            showOn : 'showOn',
            hideOn : 'hideOn',
            align : "top right",
            holder : owner,
            delay : [TOOLTIP_SHOW_TIME, TOOLTIP_HIDE_TIME]
        };
    };
    _proto._setExclusionControlActionToolTip = function(owner, tooltipElem, toolTipSetting) {
        $(tooltipElem).on("click", function(e) {
            var _targetElem = $(this);

            if($(owner).children('.mTip:last').eq(0).css("display") == "block"){
                _targetElem.trigger(toolTipSetting.hideOn);
                TooltipView.displayedActionToolTipTargetElem = null;
            }else{
                if(TooltipView.displayedActionToolTipTargetElem){
                    TooltipView.displayedActionToolTipTargetElem.trigger(toolTipSetting.hideOn);
                }
                _targetElem.trigger(toolTipSetting.showOn);
                TooltipView.displayedActionToolTipTargetElem = _targetElem;
            }
        });
    };
    _proto.setAvatarToolTip = function(type, owner, isToolTipOwner, options) {
        var _jid = owner.attr('jid');
        if (_validation({'type' : type, 'owner' : owner, 'isToolTipOwner' : isToolTipOwner, 'jid' : _jid}) == false) {
            return false;
        }
        if (owner.find('.black.mTip').length > 0) {
            return true;
        }

        var tipHtml = '<div class="black mTip mTip-bottom-right"></div>';
        if (owner.hasClass("block-avatar")) {
            owner.append(tipHtml);
        } else {
            owner.parent().children('.block-avatar').append(tipHtml);
        }
        owner.on('mouseenter', function(e) {
            if ($(this).find('.change').length == 0) {
                TooltipView.getInstance().updateAvatarToolTip(owner);
            }
        });
        owner.on('mouseenter', function () {
            var top = $(this).offset().top;
            var windowH = $(window).outerHeight();
            var elmH = $(this).outerHeight();
            if ($(this).parent().hasClass("emotionAvatarList")) {
            $(this).children('.mTip').css({'top': 'auto', 'bottom': elmH + 'px'}).addClass('hover');
            return;
            }
            if(top > windowH / 1.5) {
            $(this).children('.mTip').css({'top': 'auto', 'bottom': elmH + 'px'}).addClass('hover');
            } else {
            $(this).children('.mTip').css({'top': elmH + 'px', 'bottom': 'auto'}).addClass('hover');
            }
            if ($(this).find('.change').length == 0) {
                TooltipView.getInstance().updateAvatarToolTip(owner);
            }
        });
        owner.on('mouseleave', function () {
            $(this).children('.mTip').removeClass('hover');
            if ($(this).find('.change').length == 1) {
                $(this).find('.change').removeClass('change')
            }
        });

        return true;
    };
    _proto.updateAvatarToolTip = function(owner, callback){
        var _jid = owner.attr('jid');
        if (_validation({'jid' : _jid}) == false) {
            return false;
        }
        var _onGetPersonDataCallback = function(result){
            if(!result || !result.get(0)){
                owner.find("div.black.mTip").hide();
                return;
            }
            var _person = result.get(0);
            var rankingId = Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
            owner.find("div.black.mTip").show();
            owner.find("div.black.mTip").empty();
            owner.find("div.black.mTip").append(ViewUtils.createAvatarToolTipHtml(_person, rankingId));
            var _myjid = LoginUser.getInstance().getJid();
            owner.find("div.black.mTip .followee-count");
            getFolloweeCount(owner.find('.followee-count'));
            function getFolloweeCount(_followeeAllUser) {
                if(_jid == _myjid) {
                    var _followeeUser = LoginUser.getInstance().getFolloweeList().getCount();
                    $('.followee-count').html(_followeeUser);
                }else{
                    CubeeController.getInstance().getFolloweeList(_jid)
                    .then(function(result) {
                        var _followeeUser = result.getCount();
                        $('.followee-count').html(_followeeUser);
                    })
                }
            };
            owner.find("div.black.mTip .follower-count");
            getFollowerCount(owner.find('.follower-count'));
            function getFollowerCount(_followerAllUser) {
                if(_jid == _myjid) {
                    var _followerUser = LoginUser.getInstance().getFollowerList().getCount();
                    $('.follower-count').html(_followerUser);
                }else{
                    CubeeController.getInstance().getFollowerList(_jid)
                    .then(function(result) {
                        var _followerUser = result.getCount();
                        $('.follower-count').html(_followerUser);
                    })
                }
            };
            owner.find("div.black.mTip .followeeList");
            var _followeeMenu = owner.find('.followeelist');
            _followeeMenu.on('click', function() {
                CubeeController.getInstance().getFolloweeList(_jid)
                .then(function() {
                    var _followeeDialogView = new DialogFolloweeListView(_jid);
                    _followeeDialogView.showDialog();
                }).catch(function(err){
                });
            });
            owner.find("div.black.mTip .followerList");
            var _followerMenu = owner.find('.followerlist');
            _followerMenu.on('click', function() {
                CubeeController.getInstance().getFollowerList(_jid)
                .then(function() {
                    var _followerDialogView = new DialogFollowerListView(_jid);
                    _followerDialogView.showDialog();
                }).catch(function(err){
                });
            });
            var _change = 'follow';
            if (owner.find('button').hasClass('follow-btn')){
                _change = 'follow';
            } else {
                _change = 'unfollow';
            }
            addBtnEvent(owner.find('.follow-btn, .unfollow-btn'), _change);
            function addBtnEvent(_btnObj, _change) {
                if(_change == 'follow') {
                    _btnObj.on('click', function() {
                        CubeeController.getInstance().addUserFollow(_jid)
                        .then(function(){
                            _btnObj.off('click');
                            _btnObj.addClass('unfollow-btn change');
                            _btnObj.removeClass('follow-btn');
                            _btnObj.text(Resource.getMessage('del_followee_text'));
                            addBtnEvent(_btnObj, 'unfollow');
                            var a = owner.find('.follower-count')[0].textContent;
                            var list = Number(a) + 1 ;
                            owner.find('.follower-count').text(list);
                        }).catch(function(err){
                        })
                    })
                }
                if(_change == 'unfollow') {
                    _btnObj.on('click', function() {
                        CubeeController.getInstance().delUserFollow(_jid)
                        .then(function(){
                            _btnObj.off('click');
                            _btnObj.addClass('follow-btn change');
                            _btnObj.removeClass('unfollow-btn');
                            _btnObj.text(Resource.getMessage('add_followee_text'));
                            addBtnEvent(_btnObj, 'follow');
                            var b = owner.find('.follower-count')[0].textContent;
                            var list = Number(b) - 1 ;
                            owner.find('.follower-count').text(list);
                        }).catch(function(err){
                        })
                    })
                }
            }
            owner.find("div.black.mTip .murmur-btn");
            var _murmurColumn = owner.find('.murmur-btn');
            _murmurColumn.on('click', function() {
                ColumnManager.getInstance().addMurmurColumn(_jid,true,false,false);
            });
            if(callback && typeof callback == 'function'){
                callback();
            }
            var sidebarGjTp = null;
            sidebarGjTp = new Vue({
                el: '#sidebar-gj-tp-' + rankingId,
                data: {
                    total: {
                        goodjob_count: 0,
                        goodjob_all_count: "-",
                        thanks_count: 0,
                        thanks_all_count: "-",
                    }
                },
                methods: {
                    setGoodJobCount: function(count) {
                        this.total.goodjob_count = count;
                    },
                    setThanksPointsCount: function(count) {
                        this.total.thanks_count = count;
                    },
                    setGoodJobAllCount: function(count) {
                        this.total.goodjob_all_count = count;
                    },
                    setThanksPointsAllCount: function(count) {
                        this.total.thanks_all_count = count;
                    }
                }
            })
            updateGoodJobCount(_jid, sidebarGjTp);
            updateGoodJobAllCount(_jid, sidebarGjTp);
            updateThanksPointsCount(_jid, sidebarGjTp);
            updateThanksPointsAllCount(_jid, sidebarGjTp);
            owner.find('[data-toggle="tooltip"]').tooltip({
              trigger: 'hover'
            });
        };
        var _person = CubeeController.getInstance().getPersonDataByJidFromServer(_jid, _onGetPersonDataCallback);
    };

    function updateGoodJobCount(jid, vueInstance) {
        var _self = this;
        var fiscalYearDate = getDate(getFiscalYear());

        CubeeController.getInstance().getGoodJobTotal(jid, fiscalYearDate)
        .then(function(result){
            var point = result.content.items[0].points;
            if (typeof point == 'number') {
                vueInstance.setGoodJobCount(point);
            }
        }).catch(function(err){
            vueInstance.setGoodJobCount("-");
        })
    };

    function updateGoodJobAllCount(jid, vueInstance) {
        CubeeController.getInstance().getGoodJobTotal(jid, "")
        .then(function(result){
            var point = result.content.items[0].points;
            if (typeof point == 'number') {
                vueInstance.setGoodJobAllCount(point);
            }
        }).catch(function(err){
            vueInstance.setGoodJobAllCount("-");
        })
    }

    function updateThanksPointsCount(jid, vueInstance) {
        var _self = this;
        var fiscalYearDate = getDate(getFiscalYear());

        CubeeController.getInstance().getThanksPointsTotal(jid, fiscalYearDate)
        .then(function(result){
            var point = result.content.items[0].points;
            var rank = result.content.items[0].rank;
            if (typeof point == 'number') {
                vueInstance.setThanksPointsCount(point);
            }
        }).catch(function(err){
            vueInstance.setThanksPointsCount("-");
        })
    }

    function updateThanksPointsAllCount(jid, vueInstance) {
        CubeeController.getInstance().getThanksPointsTotal(jid,  "")
        .then(function(result){
            var point = result.content.items[0].points;
            if (typeof point == 'number') {
                vueInstance.setThanksPointsAllCount(point);
            }
        }).catch(function(err){
            vueInstance.setThanksPointsAllCount("-");
        })
    }

    function getFiscalYear() {
        var dt = new Date();
        dt.setMonth(dt.getMonth()-3);
        dt.setMonth(3);
        dt.setDate(1)
        return dt;
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

    _proto.setUserNameNickNameToolTip = function(owner, contentHtmlString, isToolTipOwner) {
        if (_validation({'owner' : owner, 'contentHtmlString' : contentHtmlString, 'isToolTipOwner' : isToolTipOwner}) == false) {
            return false;
        }
        var _align = 'top';
        var _nickNameTipHtml = Utils.convertEscapedHtml(contentHtmlString, true);
        var _toolTipSetting = {
                showOn : 'longtap',
                hideOn : 'touchend touchmove touchcancel',
                content : _nickNameTipHtml,
                align : _align,
                spacing : [0, 0],
                delay : [TOOLTIP_SHOW_TIME, TOOLTIP_HIDE_TIME],
                css : {
                    'z-index' : LIST_AREA_TOOLTIP_ZINDEX,
                    'max-width' : LIST_AREA_TOOLTIP_MAX_WIDTH
                    },
                className : 'black break-word'
            };
        if (ViewUtils.isIE8()) _toolTipSetting.updateOn = 'dummy';
        if (isToolTipOwner) {
            _toolTipSetting.holder = owner;
        }
        if (_toolTipSetting == null) {
            return false;
        }
        if(owner.data('mTip') == null) {
            owner.mTip(_toolTipSetting);
        } else {
            if(owner.data('mTip').tip){
                owner.data('mTip').tip.html(_nickNameTipHtml);
            }
        }
        return true;
    };
    _proto.setMyMemoToolTip = function(owner, jid, isToolTipOwner, myMemo) {
        if (_validation({'owner' : owner, 'jid' : jid, 'isToolTipOwner' : isToolTipOwner}) == false) {
            return false;
        }
        var _myMemo = myMemo ? myMemo : '';
        var _personData = CubeeController.getInstance().getPersonData(jid);
        if (_personData != null) {
            _myMemo = _personData.getMyMemo();
        }
        var _myMemoTipHtml = Utils.convertEscapedHtml(_myMemo, true);
        var _align = 'top';
        var _toolTipSetting = {
                showOn : 'longtap',
                hideOn : 'touchend touchmove touchcancel',
                content : _myMemoTipHtml,
                align : _align,
                spacing : [0, 0],
                delay : [TOOLTIP_SHOW_TIME, TOOLTIP_HIDE_TIME],
                css : {
                    'z-index' : LIST_AREA_TOOLTIP_ZINDEX,
                    'max-width' : LIST_AREA_TOOLTIP_MAX_WIDTH
                    },
                className : 'black break-word'
            };
        if (ViewUtils.isIE8()) _toolTipSetting.updateOn = 'dummy';
        if (isToolTipOwner) {
            _toolTipSetting.holder = owner;
        }
        if (_toolTipSetting == null) {
            return false;
        }
        if(owner.data('mTip') == null) {
            owner.mTip(_toolTipSetting);
        } else {
            if(owner.data('mTip').tip){
                owner.data('mTip').tip.html(_myMemoTipHtml);
            }
        }
        return true;
    };
    _proto.setColumnIconToolTip = function(owner, contentHtmlString, isToolTipOwner) {
        if (_validation({'owner' : owner, 'contentHtmlString' : contentHtmlString, 'isToolTipOwner' : isToolTipOwner}) == false) {
            return false;
        }
        var _align = 'bottom right';
        var _toolTipSetting = {
                showOn : 'longtap',
                hideOn : 'touchend touchmove touchcancel',
                content : contentHtmlString,
                align : _align,
                spacing : [40, 0],
                delay : [TOOLTIP_SHOW_TIME, TOOLTIP_HIDE_TIME],
                css : {"z-index" : 100000}
            };
        if (ViewUtils.isIE8()) _toolTipSetting.updateOn = 'dummy';
        if (isToolTipOwner) {
            _toolTipSetting.holder = owner;
        }
        if (_toolTipSetting == null) {
            return false;
        }
        if(owner.data('mTip') == null) {
            owner.mTip(_toolTipSetting);
        } else {
            if(owner.data('mTip').tip){
                owner.data('mTip').tip.html(contentHtmlString);
            }
        }
        return true;
    };
    _proto.removeNotificationTooltipMessage = function(owner, message) {
    };
    _proto.updateActionToolTip = function(owner, type) {
        if (_validation({'type' : type, 'owner' : owner}) == false) {
            return false;
        }
        var _toolTipContent = '';
        switch(type) {
        case TooltipView.TYPE_PARENT_TASK:
            _toolTipContent = $('#tooltipParentTaskMessageAction').html();
            break;
        case TooltipView.TYPE_PARENT_TASK_CANCEL:
            _toolTipContent = $('#tooltipParentTaskMessageCancelAction').html();
            break;
        default:
            break;
        }

        if(owner.find(".popup_menu.msg_menu").length == 0 || _toolTipContent == '') {
            return false;
        } else {
            owner.find(".popup_menu.msg_menu ul.popup_list").find("a").off();
            owner.find(".popup_menu.msg_menu ul.popup_list").remove();
            owner.find(".popup_menu.msg_menu").append(_toolTipContent);
        }
        return true;
    };
    _proto.createGoodJobTooltip = function(owner, goodJobList, isToolTipOwner) {
        if (_validation({'owner' : owner}) == false) {
            return false;
        }

        var _toolTipContent = '';

        if (goodJobList.getCount() <= 0) {

            return false;
        }
        var _toolTipContent = '<div class="black mTip mTip-top-right">'
        _toolTipContent += _getGoodJobTooltipHtml(goodJobList);
        _toolTipContent += '</div>';

        var _owner = owner.find(".good-job-counter");
        _owner.children(".mTip").remove();
        _owner.append(_toolTipContent);

        return true;
    };
    _proto.createSiblingTaskTooltip = function(owner, siblingList) {
        if (_validation({'owner' : owner, 'siblingList' : siblingList}) == false) {
            return false;
        }
        if (siblingList.getCount() <= 0) {
            return false;
        }
        var _toolTipContent = '<div class="black mTip mTip-top-right">'
        _toolTipContent += _getSiblingTaskTooltipHtml(siblingList);
        _toolTipContent += '</div>';

        owner.children(".mTip").remove();
        owner.append(_toolTipContent);

        return true;
    };
    _proto.createConfigMenuTooltip = function(owner, contentHtmlString) {
        if (_validation({'owner' : owner, 'contentHtmlString' : contentHtmlString}) == false) {
            return null;
        }
        var _toolTipSetting = {
            showOn : 'click touchend',
            holder : owner.parent(),
            spacing : [-60, 0],
            content : contentHtmlString,
            delay : [TOOLTIP_SHOW_TIME, TOOLTIP_HIDE_TIME]
        };
        if (ViewUtils.isIE8()) _toolTipSetting.updateOn = 'dummy';
        owner.mTip(_toolTipSetting);
        return owner.mTip('get');
    };
    _proto.createColumnOptionMenuTooltip = function(owner, contentHtmlString) {
        if (_validation({'owner' : owner, 'contentHtmlString' : contentHtmlString}) == false) {
            return null;
        }
        return owner.append(contentHtmlString);
    };
    _proto.createColumnTitleTooltip = function(owner, contentHtmlString, isToolTipOwner) {
        if (_validation({'owner' : owner, 'contentHtmlString' : contentHtmlString, 'isToolTipOwner' : isToolTipOwner}) == false) {
            return false;
        }
        var _toolTipSetting = {
            showOn : 'touchend',
            holder : owner,
            align : 'bottom center',
            spacing : [0, 0],
            content : contentHtmlString,
            delay : [TOOLTIP_SHOW_TIME, TOOLTIP_HIDE_TIME],
            css : {
                'max-width' : COLUMN_TITLE_TOOLTIP_MAX_WIDTH
                }
        };
        if (ViewUtils.isIE8()) _toolTipSetting.updateOn = 'dummy';
        if(isToolTipOwner){
            _toolTipSetting.holder = owner;
        }
        owner.mTip(_toolTipSetting);
        return true;
    };
    _proto.createMailMessageSubjectToolTip = function(owner, contentHtmlString, isToolTipOwner) {
        if (_validation({'owner' : owner, 'contentHtmlString' : contentHtmlString, 'isToolTipOwner' : isToolTipOwner}) == false) {
            return false;
        }
        var _toolTipSetting = {
            showOn : 'touchend',
            holder : owner,
            align : 'bottom center',
            spacing : [0, 0],
            content : contentHtmlString,
            delay : [TOOLTIP_SHOW_TIME, TOOLTIP_HIDE_TIME],
            css : {
                'max-width' : MAIL_MESSAGE_SUBJECT_TOOLTIP_MAX_WIDTH
                }
        };
        if (ViewUtils.isIE8()) _toolTipSetting.updateOn = 'dummy';
        if(isToolTipOwner){
            _toolTipSetting.holder = owner;
        }
        if(owner.data('mTip') == null) {
            owner.mTip(_toolTipSetting);
        } else {
            if(owner.data('mTip').tip){
                owner.data('mTip').tip.html(contentHtmlString);
            }
        }
        return true;
    };
    _proto.setGroupChatNameToolTip = function(owner, contentHtmlString, isToolTipOwner) {
        var _self = this;
        return null;
    };
    _proto.setCommunityNameToolTip = function(owner, contentHtmlString, isToolTipOwner) {
        var _self = this;
        return null;
    };
    _proto.setRoomNameToolTip = function(owner, contentHtmlString, isToolTipOwner) {
        if (_validation({'owner' : owner, 'contentHtmlString' : contentHtmlString, 'isToolTipOwner' : isToolTipOwner}) == false) {
            return false;
        }
        var _align = 'top';
        var _groupChatNameTipHtml = Utils.convertEscapedHtml(contentHtmlString, true);
        var _toolTipSetting = {
                showOn : 'longtap',
                hideOn : 'touchend touchmove touchcancel',
                content : _groupChatNameTipHtml,
                align : _align,
                spacing : [0, 0],
                delay : [TOOLTIP_SHOW_TIME, TOOLTIP_HIDE_TIME],
                css : {
                    'z-index' : LIST_AREA_TOOLTIP_ZINDEX,
                    'max-width' : LIST_AREA_TOOLTIP_MAX_WIDTH
                    },
                className : 'black break-word'
            };
        if (ViewUtils.isIE8()) _toolTipSetting.updateOn = 'dummy';
        if (isToolTipOwner) {
            _toolTipSetting.holder = owner;
        }
        if (_toolTipSetting == null) {
            return false;
        }
        if(owner.data('mTip') == null) {
            owner.mTip(_toolTipSetting);
        } else {
            if(owner.data('mTip').tip){
                owner.data('mTip').tip.html(_groupChatNameTipHtml);
            }
        }
        return true;
    };
    _proto.setCommunitySettingToolTip = function(owner, content, isToolTipOwner) {
        if (_validation({'owner' : owner, 'content' : content, 'isToolTipOwner' : isToolTipOwner}) == false) {
            return null;
        }
        var _align = 'bottom,right';
        var _toolTipSetting = {
                showOn : 'click touchend',
                content : content,
                align : _align,
                spacing : [-44, -5],
                delay : [TOOLTIP_SHOW_TIME, TOOLTIP_HIDE_TIME],
                css : {
                    'z-index' : LIST_AREA_TOOLTIP_ZINDEX,
                    'max-width' : LIST_AREA_TOOLTIP_MAX_WIDTH
                    },
                className : 'black break-word'
            };
        if (ViewUtils.isIE8()) _toolTipSetting.updateOn = 'dummy';
        if (isToolTipOwner) {
            _toolTipSetting.holder = owner;
        }
        owner.mTip(_toolTipSetting);
        return owner.mTip('get');
    };
    function _getGoodJobTooltipHtml(goodJobList) {
        if (_validation({'goodJobList' : goodJobList}) == false) {
            return '';
        }
        var _allCount = goodJobList.getCount();
        var _lastIdx = _allCount - 1;
        var _displayCount = Conf.getVal('GOODJOB_USER_TOOLTIP_DISPLAY_COUNT');
        var _limitIdx = _lastIdx - _displayCount;
        var _htmlString = '<div class="goodJob_list">';
        for (var _i = _lastIdx; _i > _limitIdx; _i--) {
            _htmlString += _getGoodJobTooltipMessageHtml(goodJobList.get(_i));
        }
        _htmlString += _getOtherUserCountTooltipHtml(_allCount, _displayCount);
        _htmlString += '</div>';
        return _htmlString;
    }

    function _getGoodJobTooltipMessageHtml(goodJobData) {
        if (_validation({'goodJobData' : goodJobData}) == false) {
            return '';
        }
        var _jid = goodJobData.getJid();
        var _person = new Person();
        _person.setJid(_jid);
        _person.setLoginAccount(goodJobData.getLoginAccount());
        _person.setUserName(goodJobData.getNickName());
        _person.setAvatarType(goodJobData.getAvatarType());
        _person.setAvatarData(goodJobData.getAvatarData());
        _person.setStatus(goodJobData.getStatus());
        var _htmlString = _getUserListItemTooltipMessageHtml(_person);
        return _htmlString;
    }

    _proto.createMessageExistingReaderTooltip = function(owner, messageExistingReaderInfo, isToolTipOwner) {
        if (_validation({'owner' : owner}) == false) {
            return false;
        }
        if(isToolTipOwner != false) {
            isToolTipOwner = true;
        }
        var _toolTipContent = '';
        if (messageExistingReaderInfo == null || typeof messageExistingReaderInfo != 'object' ) {
             return false;
        }

        _toolTipContent += '<div class="black mTip mTip-top-right">';
        _toolTipContent += _getMessageExistingReaderTooltipHtml(messageExistingReaderInfo);
        _toolTipContent += '</div>';

        owner.children(".mTip").off().remove();
        owner.children('span').append(_toolTipContent);
        owner.find(".mTip").on('click',function(e){
            e.stopPropagation();
        });

        return true;
    };

    function _getMessageExistingReaderTooltipHtml(messageExistingReaderInfo) {
        if (messageExistingReaderInfo == null || typeof messageExistingReaderInfo != 'object' ) {
            return '';
       }
        var _readerItemList = messageExistingReaderInfo.getExistingReaderItemList();
        var _count = _readerItemList.getCount();
        var _htmlString = '<div class="existing_user_list">';
        for (var _i = 0; _i < _count; _i++) {
             var _readerItem = _readerItemList.get(_i);
             var _person = _readerItem.getPerson();
            _htmlString += _getUserListItemTooltipMessageHtml(_person);
        }
        var _allCount = messageExistingReaderInfo.getAllCount();
        _htmlString += _getOtherUserCountTooltipHtml(_allCount, _count);
        _htmlString += '</div>';
        return _htmlString;
    };

    function _getUserListItemTooltipMessageHtml(person){
        if (_validation({'person' : person}) == false) {
            return '';
        }
        var HAS_NO_AVATAR = 'images/user_noimage.png';
        var _person = person;
        var _jid = _person.getJid();
        var _avatarName = _person.getUserName();
        if(_avatarName == null || _avatarName == ''){
            _avatarName = ViewUtils.getUserName(_jid);
        }
        var _avatarSrc = ViewUtils.getAvatarUrl(_person);
        var _accountStatus = Person.PROFILE_STATUS_ACTIVE;
        if (_person != null) {
            _accountStatus = _person.getStatus();
        }

        var _htmlString =  '<div class="user-tooltip-item text-abbreviation" jid="' + _jid + '">';
        if (_avatarSrc == HAS_NO_AVATAR) {
            _htmlString += '<span class="tooltip_avatar ico ico_user">'
            _htmlString += ViewUtils.getDefaultAvatarHtml(person);
            _htmlString += '</span>';
        } else {
            _htmlString += '<img class="tooltip_avatar" src="' + _avatarSrc + '">';
        }
        _htmlString += '<h>' + Utils.convertEscapedHtml(_avatarName) + ViewUtils.getUserStatusString(_accountStatus) + '</h>'
        _htmlString += '</div>';

        return _htmlString;
    }

    function _getOtherUserCountTooltipHtml(allCount, displayCount){
        if (allCount == null || typeof allCount != 'number' ) {
            return '';
        }
        if (displayCount == null || typeof displayCount != 'number' ) {
            return '';
        }
        var _diff = allCount - displayCount;
        if(allCount - displayCount <= 0){
            return '';
        }
        return '<div class="text-align-right">' + Resource.getMessage('existing_reader_other') + _diff + Resource.getMessage('existing_reader_count') + '</div>';
    }

    function _getSiblingTaskTooltipHtml(siblingList) {
        if (_validation({'siblingList' : siblingList}) == false) {
            return '';
        }
        var _count = siblingList.getCount();
        var _htmlString = '<div id="sibling_list" class="sibling_list box-border olient-vertical">';
        for (var _i = 0; _i < _count; _i++) {
            _htmlString += _getSiblingTaskTooltipDataHtml(siblingList.get(_i));
        }
        _htmlString += '</div>';
        return _htmlString;
    };

    function _getSiblingTaskTooltipDataHtml(siblingTaskData) {
        if (_validation({'siblingTaskData' : siblingTaskData}) == false) {
            return '';
        }
        var HAS_NO_AVATAR = 'images/user_noimage.png';
        var _siblingOwnerJid = siblingTaskData.getSiblingOwnerJid();

        var _avatarName = siblingTaskData.getNickName();
        if(_avatarName == null || _avatarName == ''){
            _avatarName = ViewUtils.getUserName(_siblingOwnerJid);
        }
        var _person = new Person();
        _person.setJid(_siblingOwnerJid);
        _person.setAvatarType(siblingTaskData.getAvatarType());
        _person.setAvatarData(siblingTaskData.getAvatarData());
        _person.setUserName(siblingTaskData.getNickName());
        _person.setLoginAccount(siblingTaskData.getLoginAccount());
        _person.setStatus(siblingTaskData.getStatus());

        var _avatarSrc = ViewUtils.getAvatarUrl(_person);
        var _accountStatus = Person.PROFILE_STATUS_ACTIVE;
        if (_person != null) {
            _accountStatus = _person.getStatus();
        }
        var _status = siblingTaskData.getSiblingTaskStatus();
        var _statusClassName = '';
        switch(_status) {
            case TaskMessage.STATUS_ASSIGNING:
                _statusClassName = 'task-status-icon-color-assigning';
                break;
            case TaskMessage.STATUS_NEW:
                _statusClassName = 'task-status-icon-color-new';
                break;
            case TaskMessage.STATUS_DOING:
                _statusClassName = 'task-status-icon-color-doing';
                break;
            case TaskMessage.STATUS_FINISHED:
                _statusClassName = 'task-status-icon-color-finished';
                break;
            case TaskMessage.STATUS_REJECTED:
                _statusClassName = 'task-status-icon-color-rejected';
                break;
            default:
                break;
        }
        var _htmlString = '<div class="tooltip-sibling-list-item box-border olient-horizontal" jid="' + _siblingOwnerJid + '">';
        var _statusString = _getSiblingTaskTooltipStatusHtml(_status, _statusClassName);
        if (ViewUtils.isIE89()) _htmlString += _statusString;
        _htmlString += '<div class="tooltip-sibling-owner box-border-for-abbreviation flex1">'
        if (_avatarSrc == HAS_NO_AVATAR) {
            _htmlString += '<span class="tooltip_avatar ico ico_user">'
            _htmlString += ViewUtils.getDefaultAvatarHtml(_person);
            _htmlString += '</span>';
        } else {
            _htmlString += '<img class="tooltip_avatar" src="' + _avatarSrc + '">';
        }
        _htmlString += Utils.convertEscapedHtml(_avatarName) + ViewUtils.getUserStatusString(_accountStatus) + '</div>';
        if (!ViewUtils.isIE89()) _htmlString += _statusString;
        _htmlString += '</div>';
        return _htmlString;
    };
    function _getSiblingTaskTooltipStatusHtml(taskStatus, statusClassName) {
        var _htmlString = '';
        if(statusClassName != '') {
            if(taskStatus == TaskMessage.STATUS_REJECTED) {
                _htmlString += '  <div class="tooltip-sibling-task-status box-border ' + statusClassName + '">' + Resource.getMessage('task_statuc_reject') + '</div>';
            } else {
                _htmlString += '  <div class="tooltip-sibling-task-status box-border ' + statusClassName + '">' + Resource.getMessage('task_statuc_other') + '</div>';
            }
        }
        return _htmlString;
    };

    function _validation(args) {
        for (var p in args) {
            if (p == 'type') {
                if (args[p] == null || typeof args[p] != 'number') {return false;}
            } else if (p == 'owner' || p == 'message' || p == 'goodJobList' || p == 'goodJobData' || p == 'siblingList' || p == 'siblingTaskData' || p == 'htmlElement' || p == 'toolTipIconElm') {
                if (args[p] == null || typeof args[p] != 'object') {return false;}
            } else if (p == 'isToolTipOwner' || p == 'isReadMore') {
                if (args[p] == null || typeof args[p] != 'boolean') {return false;}
            } else if (p == 'jid') {
                if (args[p] == null || args[p] == '') {return false;}
            } else if (p == 'contentHtmlString') {
                if (args[p] == null || typeof args[p] != 'string') {return false;}
            } else if (p == 'content') {
                if (args[p] == null || typeof args[p] != 'object') {return false;}
            } else if (p == 'person') {
                if (args[p] == null || typeof args[p] != 'object') {return false;}
            }
        }
        return true;
    };

    $(function() {
        function getMessageFromToolTipIcon(toolTipIconElm) {
            var _msgObj = _getMessageObjectFromToolTipIcon(toolTipIconElm);
            if (_msgObj == null) {
                return null;
            }
            return _msgObj.getMessage();
        };

        function _getMessageObjectFromToolTipIcon(toolTipIconElm) {
            var _columnObj = _getColumObjectFromToolTipIcon(toolTipIconElm);
            if (_columnObj == null) {
                return null;
            }
            var _itemId = _getMessageItemIdFromToolTipIcon(toolTipIconElm);
            if (_itemId == null) {
                return null;
            } else if (_itemId == '') {
                return null;
            }
            return _columnObj.getMsgObjByItemId(_itemId);
        };

        function showTaskDialogFromMessage(message) {
            if (_validation({'message' : message}) == false) {
                return;
            }
            var _taskDialog = new DialogTaskView(message, TaskDialog.MODE_ADD);
            _taskDialog.showDialog();
        };

        function showTaskRegisterViewFromMessage(htmlElement, message, title) {
            if (_validation({'message' : message, 'htmlElement' : htmlElement}) == false) {
                return;
            }
            var _taskRegisterColumn = new TaskRegisterView(htmlElement, title, null);
            _taskRegisterColumn.appear(message);
        };

        function _getColumObjectFromToolTipIcon(toolTipIconElm) {
            if (_validation({'toolTipIconElm' : toolTipIconElm}) == false) {
                return null;
            }
            var _selfColumn = _getColumElementFromToolTipIcon(toolTipIconElm);
            var _columnRoot = _selfColumn.parent();
            var _selfColumnIndex = _columnRoot.children('.card.col_card.chat_card').index(_selfColumn);
            if(_selfColumnIndex == -1 && $(toolTipIconElm).closest("#side-bar-recent").length){
                return SideMenuRecentView.getInstance();
            }else if(_selfColumnIndex == -1 && $(toolTipIconElm).closest("#side-bar-murmur").length){
                return SideMenuMurmurView.getInstance();
            }else{
                var _columnObjList = ColumnManager.getInstance().getColumnObjList();
                return _columnObjList.get(_selfColumnIndex);
            }
        };

        function _getMessageItemIdFromToolTipIcon(toolTipIconElm) {
            var _targetElm = _getParentElem(toolTipIconElm).parent();
            if(_targetElm.attr('itemid') != undefined){
                return _targetElm.attr('itemid');
            }
            if (_targetElm.parent().hasClass('thread-message')) {
                _targetElm = _targetElm.parent();
                if(_targetElm.attr('itemid') != undefined){
                    return _targetElm.attr('itemid');
                }
            }
            if (_targetElm.parent().parent().hasClass('search-message')) {
                _targetElm = _targetElm.parent().parent();
                if(_targetElm.attr('itemid') != undefined){
                    return _targetElm.attr('itemid');
                }
            }
            if(_targetElm.parent().hasClass('task-message')){
                _targetElm = _targetElm.parent();
                if(_targetElm.attr('itemid') != undefined){
                    return _targetElm.attr('itemid');
                }
            }
            if(_targetElm.hasClass('search-message-info')){
                _targetElm = _targetElm.find(".questionnaire-message-header > .message-info");
                if(_targetElm.attr('itemid') != undefined){
                    return _targetElm.attr('itemid');
                }
            }
            return null;
        }

        function _getColmunTypeFromToolTipIcon(toolTipIconElm) {
            var _type = ColumnInformation.TYPE_COLUMN_UNKNOWN;
            var _columnObject = _getColumObjectFromToolTipIcon(toolTipIconElm);
            if (_columnObject == null) {
                return _type;
            }
            _type = _columnObject.getType();
            return _type;
        };

        function _getColumElementFromToolTipIcon(toolTipIconElm) {
            if (_validation({'toolTipIconElm' : toolTipIconElm}) == false) {
                return null;
            }
            var _selfColumn = $(toolTipIconElm).parentsUntil('.card.col_card.chat_card');
             return _selfColumn.parent();
        };

        $(document).on('click', 'li a.action-add-inbox-task', function() {
            var _message = getMessageFromToolTipIcon(this);
            if (_message == null) {
                return;
            }
            if (_message.getDeleteFlag() == 2){
                if (_message.getMessage() === "deleted_by_admin") {
                    _message.setMessage(Resource.getMessage('deleted_message_body_by_admin'));
                } else {
                    _message.setMessage(Resource.getMessage('deleted_message_body'));
                }
            }
            var _taskMsg = new TaskMessage();
            _taskMsg.setMessage(_message.getMessage());
            _taskMsg.setReferenceMessageItemId(_message.getItemId());
            _taskMsg.setReplyTo(_message.getFrom());
            var _loginUserJid = LoginUser.getInstance().getJid();
            _taskMsg.setOwnerJid(_loginUserJid);
            _taskMsg.setStatus(TaskMessage.STATUS_INBOX);
            _taskMsg.setQuotationItem(_message.getQuotationItem());
            if (_message.getType() == Message.TYPE_MAIL) {
                _taskMsg.setClient(_loginUserJid);
            } else {
                _taskMsg.setClient(_message.getFrom());
            }
            if(_message.getType() == Message.TYPE_COMMUNITY){
                _taskMsg.setCommunityId(_message.getTo());
            }
            var _ret = CubeeController.getInstance().addTask(_taskMsg, function(result) {
                console.log("add to INBOX : " + result);
            });
            if (_ret != true) {
                console.log("faild to add to INBOX");
            }
        });
        $(document).on('click', 'li a.action-add-new-task', function() {
            var _messageViewObj = _getMessageObjectFromToolTipIcon(this);
            if(_messageViewObj == null) {
                return;
            }
            var _messageViewObj = _getMessageObjectFromToolTipIcon(this);
            if(_messageViewObj == null) {
                return;
            }
            if (_messageViewObj.getMessage().getDeleteFlag() == 2){
                if (_messageViewObj.getMessage().getMessage() === "deleted_by_admin") {
                    _messageViewObj.getMessage().setMessage(Resource.getMessage('deleted_message_body_by_admin'));
                } else {
                    _messageViewObj.getMessage().setMessage(Resource.getMessage('deleted_message_body'));
                }
            }
            _messageViewObj.onClickTaskAdd();

        });
        $(document).on('click', 'a.action-accept-new-task', function() {
            var _message = getMessageFromToolTipIcon(this);
            if (_message == null) {
                return;
            }
            var _updateTaskMessage = new TaskMessage();
            _updateTaskMessage.copy(_message);
            _updateTaskMessage.setStatus(TaskMessage.STATUS_NEW);
            var _ret = CubeeController.getInstance().updateTask(_updateTaskMessage, function(result) {
                console.log("task was accepted : " + result);
            });
            if (_ret != true) {
                console.log("task was not accepted");
            }
        });
        $(document).on('click', 'a.action-Reject-task', function() {
            var _message = getMessageFromToolTipIcon(this);
            if (_message == null) {
                return;
            }
            var _updateTaskMessage = new TaskMessage();
            _updateTaskMessage.copy(_message);
            _updateTaskMessage.setStatus(TaskMessage.STATUS_REJECTED);
            var _ret = CubeeController.getInstance().updateTask(_updateTaskMessage, function(result) {
                console.log("task was rejected : " + result);
            });
            if (_ret != true) {
                console.log("task was not rejected");
            }
        });

        $(document).on('click', 'li a.action-delete-message', function() {
            var _message = getMessageFromToolTipIcon(this);
            if (_message == null) {
                return;
            }
            var _deleteMessage = _message;

            var _deleteCheckDialogView = new DialogDeleteCheckView(_deleteMessage);
            _deleteCheckDialogView.showDialog();
        });

        $(document).on('click', 'li a.action-update-thread-title', function() {
            var _message = getMessageFromToolTipIcon(this);
            if (_message == null) {
                return;
            }
            var _DialogThreadTitleUpdateView = new DialogThreadTitleUpdateView(_message);
            _DialogThreadTitleUpdateView.showDialog();

        });

        $(document).on('click', 'li a.action-update-message', function() {
            var _message = getMessageFromToolTipIcon(this);
            var _column = _getColumObjectFromToolTipIcon(this);
            if (_message == null || _column == null) {
                return;
            }
            var _DialogUpdateMessageView = new DialogUpdateMessageView(_message, _column);
            _DialogUpdateMessageView.showDialog();

        });

        $(document).on('click', 'li a.action-quote-message', function() {
            var _message = getMessageFromToolTipIcon(this);
            var _column = _getColumObjectFromToolTipIcon(this);
            if (_message == null || _column == null) {
                return;
            }
            if (_message.getType() == Message.TYPE_GROUP_CHAT &&
                _column.getType() != ColumnInformation.TYPE_COLUMN_GROUP_CHAT) {
                CubeeController.getInstance().getRoomInfo(_message.getTo(), _callbackGC);
                function _callbackGC(_chatRoomInfo) {
                    var _DialogQuoteMessageView = new DialogQuoteMessageView(_message, _column, _chatRoomInfo.getPrivacyType());
                    _DialogQuoteMessageView.showDialog();
                }
            } else if (_message.getType() == Message.TYPE_COMMUNITY &&
                       _column.getType() != ColumnInformation.TYPE_COLUMN_COMMUNITY_FEED) {
                CubeeController.getInstance().getCommunityInfo(_message.getTo(), _callbackPJ);
                function _callbackPJ(_projectInfo) {
                    var _DialogQuoteMessageView = new DialogQuoteMessageView(_message, _column, _projectInfo.getPrivacyType());
                    _DialogQuoteMessageView.showDialog();
                }
            } else {
                var _DialogQuoteMessageView = new DialogQuoteMessageView(_message, _column);
                _DialogQuoteMessageView.showDialog();
            }
        });

        $(document).on('click', 'li a.action-move-message-room', function(event) {
            var _message = getMessageFromToolTipIcon(this);
            var _column = _getColumObjectFromToolTipIcon(this);
            if (_message == null || _column == null) {
                return;
            }
            SideMenuRecentView.getInstance().close();
            var _columnManager = ColumnManager.getInstance();
            switch (_message.getType()) {
                case Message.TYPE_PUBLIC:
                    if (TabManager.getInstance().isActiveMyWorkplace()) {
                        _columnManager.addColumnInfo(Message.TYPE_PUBLIC, true, false, _column);
                    } else {
                        TabManager.getInstance().activeMyWorkplaceTab(function(){
                            _columnManager.addColumnInfo(Message.TYPE_PUBLIC, true, false, _column);
                        })
                    }
                    break;
                case Message.TYPE_CHAT:
                    var chatJid = _message.getTo();
                    if (LoginUser.getInstance().getJid() == chatJid) {
                        chatJid = _message.getFrom();
                    }
                    _columnManager.addChatColumn(chatJid, true, false, _column);
                    break;
                case Message.TYPE_GROUP_CHAT:
                    if (TabManager.getInstance().isActiveMyWorkplace()) {
                        _columnManager.addGroupChatColumn(_message.getTo(), true, false, _column);
                    }else{
                        var pjInfo = TabManager.getInstance().getCommunityInfo();
                        if(_message.getParentRoomId() &&
                           _message.getParentRoomId() == pjInfo.getRoomId()){
                            _columnManager.addGroupChatColumn(_message.getTo(), true, false, _column);
                        }else{
                            TabManager.getInstance().activeMyWorkplaceTab(function(){
                                _columnManager.addGroupChatColumn(_message.getTo(), true, false, _column);
                            })
                        }
                    }
                    break;
                case Message.TYPE_COMMUNITY:
                    if(_message.getTo()){
                        if(_message.getParentRoomId() &&
                           _message.getParentRoomId() == pjInfo.getRoomId()){
                            _columnManager.addCommunityFeedColumn(_message.getTo(), true, false, _column);
                        }else{
                            function _callback(communityInfo) {
                                TabManager.getInstance().selectOrAddTabByCommunityInfo(communityInfo.getRoomId(), communityInfo, function(){});
                            }
                            CubeeController.getInstance().getCommunityInfo(_message.getTo(), _callback);
                        }
                    }
                    SideMenuMurmurView.getInstance().close();
                    break;
                case Message.TYPE_MURMUR:
                    let ownJid = _message.getTo();
                    if(TabManager.getInstance().getCurrentTabInfo().type ==
                        ColumnInformation.TYPE_COLUMN_TIMELINE){
                        _columnManager.addMurmurColumn(ownJid, true, false, _column);
                    }else{
                        TabManager.getInstance().selectOrAddTabByCommunityInfo("myworkplace", null, ()=>{
                            _columnManager.addMurmurColumn(ownJid, true, false, _column);
                        });
                    }
                    break;
                default:
                    break;
            }
        })

        $(document).on('click', 'li a.action-assign-note', function() {
            var _message = getMessageFromToolTipIcon(this);
            var _DialogAssignNoteView = new DialogAssignNoteView(_message);
            _DialogAssignNoteView.showDialog();
        });

        $(document).on('click', 'a.action-edit-task', function() {
            var _messageViewObj = _getMessageObjectFromToolTipIcon(this);
            if(_messageViewObj == null) {
                return;
            }
            _messageViewObj.onClickTaskEdit();
        });
        $(document).on('click', 'a.action-finish-task', function() {
            var _message = getMessageFromToolTipIcon(this);
            var _updateTaskMessage = new TaskMessage();
            _updateTaskMessage.copy(_message);
            _updateTaskMessage.setStatus(TaskMessage.STATUS_FINISHED);
            function updateTaskCallback(result) {
                console.log("update task : " + result);
            };
            if (CubeeController.getInstance().updateTask(_updateTaskMessage, updateTaskCallback) == false) {
                console.log("faild to update task");
            }
        });
        $(document).on('click', 'a.action-doing-task', function() {
            var _message = getMessageFromToolTipIcon(this);
            var _updateTaskMessage = new TaskMessage();
            _updateTaskMessage.copy(_message);
            _updateTaskMessage.setStatus(TaskMessage.STATUS_DOING);
            function updateTaskCallback(result) {
                console.log("update task : " + result);
            };
            if (CubeeController.getInstance().updateTask(_updateTaskMessage, updateTaskCallback) == false) {
                console.log("faild to update task");
            }
        });
        $(document).on('click', 'a.action-demand-task', function() {
            var _message = getMessageFromToolTipIcon(this);
            var _itemId = _message.getItemId();
            if (_message.getItemId() == null || _message.getItemId() == '') {
                return null;
            }
            var _childrenTaskItemIds = CubeeController.getInstance().getChildrenTaskItemIds(_message.getItemId());
            if(_childrenTaskItemIds == null || _childrenTaskItemIds.getCount() == 0){
                return null;
            }
            function demandTaskCallback(result) {
                console.log("demand task : " + result);
            };
            for (var _i = 0; _i < _childrenTaskItemIds.getCount(); _i++) {
                var _childTask = CubeeController.getInstance().getMessage(_childrenTaskItemIds.get(_i));
                if (_childTask == null) {
                    continue;
                }
                if (!ViewUtils.isFinishedTask(_childTask)) {
                    if (CubeeController.getInstance().sendDemandTask(_childrenTaskItemIds.get(_i), demandTaskCallback) == false) {
                        console.log("faild to demand task");
                    }
                }
            }
        });
        $(document).on('click', 'a.action-clear-demanded-task', function() {
            var _message = getMessageFromToolTipIcon(this);
            var _itemId = _message.getItemId();
            if (_message.getItemId() == null || _message.getItemId() == '') {
                return null;
            }
            var _demandTaskList = ViewUtils.getDemandTaskListByMessage(_message);
            if (_demandTaskList.getCount() > 0) {
                function clearDemandedTaskCallback(result) {
                    console.log("clear demand task : " + result);
                };
                for (var _i = 0; _i < _demandTaskList.getCount(); _i++) {
                    if (CubeeController.getInstance().sendClearDemandedTask(_demandTaskList.get(_i).getItemId(), clearDemandedTaskCallback) == false) {
                        console.log("faild to clear demand task");
                    }
                }
            }
        });
        $(document).on('click', 'a.action-reply', function() {
            _toolTipHide(this);
            $('#columnContainer div.column div.column-content div.wrap-frm-message-reply').hide();
            var _elm = _getParentElem(this).parent().parent().children('div.message-info').eq(0);
            if (ViewUtils.isIE89()) {
                _elm = $(this).parent().parent().nextAll('div.message-info').eq(0);
            }
            var _editElm = $('div.wrap-frm-message-reply', _elm);
            var _messageViewObj = _getMessageObjectFromToolTipIcon(this);
            if (!_messageViewObj) {
                _editElm.show();
                throw 'TooltipView:: message object is null.';
            }
            var _messageType = _messageViewObj.getMessage().getType();
            var _baseElm = null;
            if (_editElm.length == 0) {
                var closeStr = Resource.getMessage('dialog_close_title');
                var _editField = '';
                _editField += '<div class="ui-widget-content wrap-frm-message-reply frm-message">';
                _editField += '<div class="frm-message">';
                _editField += '<a class="ico_btn" id="reply_close_button" data-original-title="'+ closeStr +'" data-toggle="tooltip">';
                _editField += '<i class="fa fa-close"></i></a>'

                var _autoCompleteInfo = _getAutoCompleteAttribute($(this));
                if(_messageType == Message.TYPE_GROUP_CHAT ||
                   _messageType == Message.TYPE_COMMUNITY){
                    _editField += '<a class="menthion-dialog-btn-replay fa fa-at" data-original-title="'
                                + Resource.getMessage('menthion_icon_title')
                                + '" data-toggle="tooltip"></a>';
                }
                _editField += '<textarea class="message-input-area ui-corner-all input-message-reply autoresize-textarea ' + _autoCompleteInfo.autoCompleteType + '" ' + _autoCompleteInfo.roomIdAttribute + ' placeholder="' + Resource.getMessage('reply_placeholder') + '"></textarea>';
                var _columnType = _getColmunTypeFromToolTipIcon(this);
                _editField += ColumnFileUploadPartsView.getFormHtml();
                _editField += ViewUtils.getCharCounterHtml('char-counter-reply');
                _editField += '<button id="reply_button" data-toggle="tooltip" data-placement="bottom" data-original-title="' + Resource.getMessage('reply_button') + '">' + Resource.getMessage('reply_button') + '</button>';
                _editField += '<div style="position:relative; display: inline-block;">'
                _editField += '<a class="list_add ico_btn emojibtn" data-container="body" data-toggle="tooltip" data-placement="bottom" title="" data-target="addgroup_modal" data-original-title="'+Resource.getMessage('stamp_name')+'" style="top: 0px;right: 0px;"><i class="fa fa-smile-o"></i></a>'
                _editField += '</div>'
                _editField += '</div>';
                _editField += '</div>';
                _elm.append(_editField);
                var _replyElm = $('div.wrap-frm-message-reply', _elm);
                var _messageElm = _replyElm.find('div.frm-message');
                _messageElm.find('button').button();
                ViewUtils.setCharCounter(_messageElm.find('textarea'), _messageElm.find('span.' + ViewUtils.CHAR_COUNTER_CLASSNAME), ColumnView.TEXTAREA_MAX_LENGTH);
                _editElm = _replyElm.eq(0);
                var _fileUploadElement = _messageElm.find('div.file-inputs');
                $.data(_editElm, 'fileUpload', new ColumnFileUploadPartsView(_fileUploadElement));
                $.data(_editElm, 'uploading', false);
                var _progressBarElement = _editElm.find('div.submit-message-progress');
                $.data(_editElm, 'progressBar', new ProgressBarView(_progressBarElement, false));
                _elm.find('[data-toggle="tooltip"]').tooltip({
                    trigger: 'hover'
                });

                var _linkElm = $(_elm.parent().parent()).children('a.box-border');
                if (_linkElm.length == 0) {
                    _linkElm = $(_elm.parent().parent().parent()).children('a.box-border');
                }
                new ColumnLinkView(_linkElm);
                var _inputElm = $('textarea.input-message-reply', _editElm);
                new ColumnReplyTextAreaView(_inputElm);
                var _baseElm = _editElm.parent().prev('div.message-header');
                var _replyJid = $('div.block-avatar', _baseElm).attr("jid");
                var _loginUserJid = LoginUser.getInstance().getJid();
                var _replyDefString = '';
                if (_messageType != Message.TYPE_CHAT) {
                    _replyDefString = _getReplyString(_messageViewObj.getMessage(), _replyJid, _loginUserJid);
                }
                _inputElm.val(_replyDefString);
                _inputElm.autosize();
                ViewUtils.setCursorEndOfLineForText(_inputElm);
                _inputElm.focus();
                _inputElm.siblings('button#reply_button').mousedown(function() {
                    _editElm.show();
                    var _messageBody = _inputElm.val();
                    if (!ViewUtils.isValidInputTextLength(_messageBody)) {
                        return false;
                    }
                    var _uploading = $.data(_editElm, "uploading");
                    if (_uploading == true) {
                        return false;
                    }
                    var _messageInfoElm = $('div.message-info', _baseElm);
                    if (_messageInfoElm == null) {
                        return false;
                    }
                    var _replyId = _messageInfoElm.attr('itemid');

                    var _fileUpload = $.data(_editElm, 'fileUpload');
                    var _progressBar = $.data(_editElm, 'progressBar');
                    function _sendMessage(message) {
                        var _ret;
                        if(_messageType == Message.TYPE_PUBLIC){
                            _ret = CubeeController.getInstance().sendPublicMessage(message, _replyId);
                        }else if(_messageType == Message.TYPE_GROUP_CHAT){
                            _ret = _sendGroupChatReplyMessage(message, _messageViewObj.getMessage());
                        }else if(_messageType == Message.TYPE_CHAT){
                            _ret = _sendChatReplyMessage(message, _messageViewObj.getMessage());
                        }else if(_messageType == Message.TYPE_COMMUNITY){
                            _ret = _sendCommunityMessageReplyMessage(message, _messageViewObj.getMessage());
                        }else if(_messageType == Message.TYPE_MURMUR){
                            _ret = _sendMurmurMessageReplyMessage(message, _messageViewObj.getMessage());
                        }else{
                            throw 'TooltipView:: tooltip action-reply _ invalid column type :' + _columnType;
                        }
                        if (_ret) {
                            _inputElm.val(_replyDefString);
                            _inputElm.trigger('autosize.resize');
                            if (_fileUpload != undefined) {
                                if (_fileUpload != null) {
                                    _fileUpload.clearFileUpload();
                                }
                            }
                            _editElm.hide();
                        } else {
                            throw 'faild to send Message:' + _columnType;
                        }
                    };

                    if(!ViewUtils.isIE89()){
                        if (_fileUpload == undefined || _fileUpload == null) {
                            _sendMessage(_messageBody);
                            return;
                        }
                        var _files = _fileUpload.getFilesObject();
                        if (_files == null) {
                            _sendMessage(_messageBody);
                            return;
                        }
                        if (_files.length <= 0) {
                            _sendMessage(_messageBody);
                            return;
                        }
                    } else {
                        var _fileform = _fileUpload.getFileForm();
                        if(_fileform == null){
                            _sendMessage(_messageBody);
                            return;
                        }
                        if(_fileform.value == "") {
                            _sendMessage(_messageBody);
                            return;
                        }
                    }

                    function onUploadResult(result) {
                        if (result.result != "success") {
                            $.data(_editElm, 'uploading', false);
                            if(!ViewUtils.isIE89()){
                                ViewUtils.switchAttachmentArea(_editElm, true);
                                _progressBar.progressClear();
                            } else {
                                ViewUtils.hideLoadingIcon(_inputElm);
                                ViewUtils.showErrorMessageIE(_inputElm, Resource.getMessage('error_file_up_request'));
                            }
                            return;
                        }
                        _messageBody += '\n' + result.path;
                        _sendMessage(_messageBody);
                        $.data(_editElm, 'uploading', false);
                        if(!ViewUtils.isIE89()){
                            ViewUtils.switchAttachmentArea(_editElm, true);
                            _progressBar.progressComplete();
                        } else {
                            ViewUtils.hideLoadingIcon(_inputElm);
                            ViewUtils.hideErrorMessageIE(_inputElm);
                        }
                    };

                    function onUploadProgress(progress) {
                        _progressBar.setProgressValue(progress);
                    };

                    $.data(_editElm, 'uploading', true);

                    if(!ViewUtils.isIE89()){
                        _progressBar.visibleProgressBar();
                        ViewUtils.switchAttachmentArea(_editElm, false);
                        var _file = _files[0];
                        return CubeeController.getInstance().uploadFile(_file, onUploadResult, onUploadProgress);
                    } else {
                        ViewUtils.showLoadingIcon(_inputElm);
                        return CubeeController.getInstance().uploadFileIE(_fileform, onUploadResult);
                    }
                });
                _inputElm.siblings('a#reply_close_button').mousedown(function() {
                    _editElm.hide();
                });
                $('button#reply_button').find('[data-toggle="tooltip"]').tooltip({
                    trigger: 'hover'
                });
                $('a.menthion-dialog-btn-replay', _editElm).on('click', ColumnView.mentionIconEvent);
            } else {
                _editElm.show();
                var _inputElm = $('textarea.input-message-reply', _editElm);
                _inputElm.trigger('autosize.resize');
                _inputElm.focus();
            }
        });

        function _createShowConversationColumnTitle(msg){
            var _type = msg.getType();
            var _columnTitle = '';
            switch(_type){
            case Message.TYPE_PUBLIC:
                _columnTitle = ColumnView.DISPLAY_NAME_TIMELINE;
                 break;
            case Message.TYPE_CHAT:
                var _partnerJid = msg.getFrom();
                if (_partnerJid == LoginUser.getInstance().getJid()) {
                    _partnerJid = msg.getTo();
                }
                var _partnerName = '';
                var _profileMap = msg.getProfileMap();
                if(_profileMap && typeof _profileMap == 'object'){
                    var _profile = _profileMap.getByKey(_partnerJid);
                    if(_profile && typeof _profile == 'object'){
                        _partnerName = _profile.getNickName();
                    }
                }
                _columnTitle = _partnerName;
                break;
            case Message.TYPE_GROUP_CHAT:
                var _roomName = msg.getRoomName();
                _columnTitle = _roomName;
                break;
            case Message.TYPE_COMMUNITY:
                var _roomName = msg.getRoomName();
                _columnTitle = _roomName;
                break;
            case Message.TYPE_MURMUR:
                if(LoginUser.getInstance().getJid() == msg.getTo()){
                    _columnTitle = Resource.getMessage('Murmur');
                    break;
                }
                var _partnerJid = msg.getTo();
                var _partnerName = '';
                var _profileMap = msg.getProfileMap();
                if(_profileMap && typeof _profileMap == 'object'){
                    var _profile = _profileMap.getByKey(_partnerJid);
                    if(_profile && typeof _profile == 'object'){
                        _partnerName = _profile.getNickName();
                    }
                }
                let cName = msg.getColumnName();
                if(!cName){
                   cName = Resource.getMessage('Murmur');
                }
                _columnTitle = cName;
                break;
            }
            return _columnTitle;
        }

        $(document).on('click', 'a.action-show-conversation', function() {
            SideMenuRecentView.getInstance().close();
            _toolTipHide(this);
            var _message = getMessageFromToolTipIcon(this);
            if (_message == null) {
                return;
            }
            var _itemId = _message.getItemId();
            if (_itemId == null) {
                return null;
            } else if (_itemId == '') {
                return null;
            }

            var _showConversationColumnInfo = new ShowConversationColumnInfomation();
            _showConversationColumnInfo.setItemId(_itemId);

            var _parentColumnObj = _getColumObjectFromToolTipIcon(this);
            if (_parentColumnObj == null) {
                return null;
            }
            var _parentItemId = _parentColumnObj._getRootReplyItemId(_message);
            if(_parentItemId != ""){
                _itemId = _parentItemId;
            }

            _showConversationColumnInfo.setParentItemId(_itemId);
            var _columnTitle = _createShowConversationColumnTitle(_message);
            _showConversationColumnInfo.setSourceColumnDisplayName(_columnTitle);

            var _sourceColumnInfo = _parentColumnObj.getColumnInfo();
            var _sourceColumnType = _sourceColumnInfo.getColumnType();
            var _beginningColumnType = null;
            var _isEdit = false;
            if(_sourceColumnType == ColumnInformation.TYPE_COLUMN_CUSTOM_FILTER) {
                _sourceColumnType = _sourceColumnInfo.getSourceColumnType();
                if(_sourceColumnType == ColumnInformation.TYPE_COLUMN_FILTER) {
                    _beginningColumnType = _sourceColumnInfo.getBeginningColumnType();
                }
                _isEdit = true;
            } else {
                if(_sourceColumnType == ColumnInformation.TYPE_COLUMN_FILTER) {
                    _beginningColumnType = _sourceColumnInfo.getSourceColumnType();
                }
            }

            _showConversationColumnInfo.setSourceColumnType(_sourceColumnType);
            if(_beginningColumnType != null) {
                _showConversationColumnInfo.setSourceColumnType(_beginningColumnType);
            }

            var _subData = {};
            if(_isEdit) {
                _subData = _sourceColumnInfo.getSubData();
            } else {
                if(_sourceColumnType == ColumnInformation.TYPE_COLUMN_CHAT) {
                    _subData.partner = _sourceColumnInfo.getFilterCondition();
                } else if(_sourceColumnType == ColumnInformation.TYPE_COLUMN_GROUP_CHAT) {
                    var _roomInfo = _sourceColumnInfo.getChatRoomInfomation();
                    var _roomId = _roomInfo.getRoomId();
                    _subData.roomId = _roomId;
                } else if(_sourceColumnType == ColumnInformation.TYPE_COLUMN_COMMUNITY_FEED){
                    var _roomInfo = _sourceColumnInfo.getCommunityInfomation();
                    var _roomId = _roomInfo.getRoomId();
                    _subData.roomId = _roomId;
                } else if(_sourceColumnType == ColumnInformation.TYPE_COLUMN_SEARCH || _sourceColumnType == ColumnInformation.TYPE_COLUMN_FILTER) {
                    _subData = CustomFilterColumnInfomation.copySubData(_sourceColumnInfo.getSubData());
                }
            }

            var _columnFilter;
            if(_sourceColumnType == ColumnInformation.TYPE_COLUMN_SEARCH || _sourceColumnType == ColumnInformation.TYPE_COLUMN_FILTER) {
                var _keywordStr = _sourceColumnInfo.getKeyword();
                var _narrowFilterCondition = null;
                if(_sourceColumnType == ColumnInformation.TYPE_COLUMN_SEARCH) {
                    var _srcSourceColumnTypeList = _sourceColumnInfo.getSourceColumnTypeList();
                    var _dstSourceColumnTypeList = new ArrayList;
                    var _srcSourceColumnTypeListCount = _srcSourceColumnTypeList.getCount();
                    for(var _i = 0; _i < _srcSourceColumnTypeListCount; _i++) {
                        _dstSourceColumnTypeList.add(_srcSourceColumnTypeList.get(_i));
                    }
                    if(_subData != null && _subData.roomId != null && _subData.roomId != '') {
                        _narrowFilterCondition = ColumnFilterManager.getColumnFilterForCommunity(_dstSourceColumnTypeList, _subData);
                    } else {
                        _narrowFilterCondition = ColumnFilterManager.getColumnFilterList(_dstSourceColumnTypeList);
                    }
                } else {
                    _narrowFilterCondition = ColumnFilterManager.getColumnFilter(_beginningColumnType, _subData);
                }
                var _searchKeywordFilter = ViewUtils.getKeywordFilterFromKeywordInputString(_keywordStr);
                _columnFilter = new AndCondition();
                _columnFilter.addChildCondition(_narrowFilterCondition);
                _columnFilter.addChildCondition(_searchKeywordFilter);
            } else {
                _columnFilter = ColumnFilterManager.getColumnFilter(_sourceColumnType, _subData);
            }

            var _columnSort = new ColumnSortCondition();
            var _columnSearchCondition = new ColumnSearchCondition(_columnFilter, _columnSort);
            _showConversationColumnInfo.setSearchCondition(_columnSearchCondition);

            ColumnManager.getInstance().insertAfterColumn(_showConversationColumnInfo, _parentColumnObj, true, true);
        });
        function _sendChatReplyMessage(messageText, fromMessage){
            var _chatMessage = new ChatMessage();
            var _jid = LoginUser.getInstance().getJid();
            _chatMessage.setFrom(_jid);
            _chatMessage.setReplyItemId(fromMessage.getItemId());
            var _to = fromMessage.getTo();
            if (_jid == _to) {
                _to = fromMessage.getFrom();
            }
            _chatMessage.setTo(_to);
            _chatMessage.setMessage(messageText);
            _chatMessage.setDirection(ChatMessage.DIRECTION_SEND);
            return CubeeController.getInstance().sendChatMessage(_chatMessage);
        };
        function _sendGroupChatReplyMessage(messageText, fromMessage){
            var _groupChatMessage = new GroupChatMessage();
            _groupChatMessage.setFrom(LoginUser.getInstance().getJid());
            _groupChatMessage.setReplyItemId(fromMessage.getItemId());
            _groupChatMessage.setTo(fromMessage.getTo());
            _groupChatMessage.setMessage(messageText);
            _groupChatMessage.setDirection(ChatMessage.DIRECTION_SEND);
            return CubeeController.getInstance().sendGroupChatMessage(_groupChatMessage);
        };
        function _sendCommunityMessageReplyMessage(messageText, fromMessage){
            var _communityMessage = new CommunityMessage();
            _communityMessage.setFrom(LoginUser.getInstance().getJid());
            _communityMessage.setReplyItemId(fromMessage.getItemId());
            _communityMessage.setTo(fromMessage.getTo());
            _communityMessage.setMessage(messageText);
            _communityMessage.setDirection(ChatMessage.DIRECTION_SEND);
            return CubeeController.getInstance().sendCommunityMessage(_communityMessage, function(){});
        };

        function _sendMurmurMessageReplyMessage(messageText, fromMessage){
            var _murmurMessage = new MurmurMessage();
            _murmurMessage.setFrom(LoginUser.getInstance().getJid());
            _murmurMessage.setReplyItemId(fromMessage.getItemId());
            _murmurMessage.setTo(fromMessage.getTo());
            _murmurMessage.setMessage(messageText);
            _murmurMessage.setDirection(ChatMessage.DIRECTION_SEND);
            return CubeeController.getInstance().sendMurmurMessage(_murmurMessage, function(){});
        };

        function _getReplyString(messageData, replyUserJid, loginUserJid) {
            var _replyString = '';
            var _arrayReplyAccount = [];
            _arrayReplyAccount = _getReplyJidList(messageData, replyUserJid, loginUserJid);
            _replyString = _createReplyStringFromReplyUserList(_arrayReplyAccount);
            return _replyString;
        };
        function _getReplyJidList(messageData, replyUserJid, loginUserJid) {
            var _replyUserId = "";
            var _loginUserId =  LoginUser.getInstance().getLoginAccount();
            var _profileMap = messageData.getProfileMap();
            if(_profileMap && typeof _profileMap == 'object'){
                var _clientProfile = _profileMap.getByKey(replyUserJid);
                if(_clientProfile && typeof _clientProfile == 'object'){
                    _replyUserId = _clientProfile.getLoginAccount();
                }
            }
            var _rObj = new RegExp('@([0-9A-Za-z]|-|[\'\'_.*!#$%&*+\\/=?^`{|}])+', 'g');
            var _messageBody = messageData.getMessage();
            var _ret = [];
            const mentionMatchWithHtml = /(@[\w-+%$#!~\*\.']+?)(\s|$)/g;
            const mentionPrefixBFMatch = /(^|\s)$/;
            _messageBody.replace(mentionMatchWithHtml,
                                 (arg,p1,p2,offset,str) => {
                                     if(str.indexOf(p1) >= 0 && p1.length <= 31){
                                         let lastw = str.substr(0,str.indexOf(p1));
                                         if(lastw.match(mentionPrefixBFMatch)){
                                             _ret.push(p1);
                                             return p1;
                                         }
                                     }
                                     return "";
                                 });

            var _arrayReplyAccount = [];

            if (_replyUserId != "" && _replyUserId != _loginUserId ) {
                _arrayReplyAccount.push(_replyUserId);
            }

            if (_ret != null) {
                for (var i = 0; i < _ret.length; i++) {
                    var _userId = _ret[i].replace(/(^[\s　]+)|([\s　]+$)/g, "");
                    _userId = _userId.replace("@", "");
                    if (_userId != "") {
                        if (_replyUserId != _userId && _loginUserId != _userId ) {
                          _arrayReplyAccount = _addArrayUniqueOnly(_arrayReplyAccount, _userId);
                        }
                    }
                }
            }
            return _arrayReplyAccount;
        };
        function _createReplyStringFromReplyUserList(replyUserList) {
            var _replyString = '';
            if (replyUserList != null) {
                for (var i = 0; i < replyUserList.length; i++) {
                    _replyString = _replyString + '@' + replyUserList[i] + ' ';
                }
            }
            return _replyString;
        };
        function _addArrayUniqueOnly(array, str) {
            if( !_checkDuplicate(array, str) ) {
                array.push(str);
            }
            return array;
        };
        function _checkDuplicate(array, str) {
             for(var i =0; i < array.length; i++){
                 if(str == array[i]){
                     return true;
                 }
             }
             return false;
        };

        $("#columnContainer").on("scroll", function(e){
            var _elem = TooltipView.displayedActionToolTipTargetElem;
            if(_elem){
                _elem.trigger("hideOn");
                _elem = null;
            }
        });

        function _getAutoCompleteAttribute(toolTipElem){
            var _message = getMessageFromToolTipIcon(toolTipElem);
            var _autoCompleteType = 'autocomplete';
            var _roomIdAttribute = '';
            var _msgType = _message.getType();

            switch(_msgType){
                case Message.TYPE_GROUP_CHAT:
                    _autoCompleteType = 'autocomplete-for-chatroom';
                    _roomIdAttribute = 'groupId="' + _message.getTo() + '"';
                    break;
                case Message.TYPE_COMMUNITY:
                    _autoCompleteType = 'autocomplete-for-community';
                    _roomIdAttribute = 'groupId="' + _message.getTo() + '"';
                    break;
            }

            return {
                autoCompleteType: _autoCompleteType,
                roomIdAttribute: _roomIdAttribute
            }
        }

        function _getParentElem(toolTipElem) {
            var _parentElem = $(toolTipElem).parentsUntil('.message-header').parent();
            if (!_parentElem.hasClass('message-header')) {
                _parentElem = $(toolTipElem).parentsUntil('.message-info').parent();
            }
            if (!_parentElem.hasClass('message-header') && !_parentElem.hasClass('message-info')) {
                _parentElem = $(toolTipElem).parentsUntil('.message-footer');
            }
            return _parentElem;
        }

        function _toolTipHide(toolTipElem) {
            if ($(toolTipElem).parent().hasClass('mTip')) {
                $(toolTipElem).parent().hide();
            }
        }

    });

})();
