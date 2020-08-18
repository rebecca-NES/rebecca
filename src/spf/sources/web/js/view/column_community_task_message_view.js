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

function ColumnCommunityTaskMessageView(parent, msg) {
    ColumnTaskMessageView.call(this, parent, msg);
};(function() {

    ColumnCommunityTaskMessageView.prototype = $.extend({}, ColumnTaskMessageView.prototype);
    var _super = ColumnTaskMessageView.prototype;
    var _proto = ColumnCommunityTaskMessageView.prototype;

    _proto.hasTaskClient = function(myJid) {
        var _self = this;
        var _message = _self.getMessage();

        var _clientJid = _message.getClient();
        if(myJid === _clientJid) {
            return true;
        }

        return false;
    };

    _proto.hasTaskContractor = function(myJid) {
        var _self = this;
        var _messageElem = _self.getHtmlElement();
        var _message = _self.getMessage();

        var _childrenTaskItemIds = CubeeController.getInstance().getChildrenTaskItemIds(_message.getItemId());
        if(_childrenTaskItemIds == null) {
            return false;
        }
        var _childCount = _childrenTaskItemIds.getCount();
        if(_childCount <= 0) {
            return false;
        }

        var _childrenTaskElem = _messageElem.find('.children-task-assign');
        if(_childrenTaskElem.length <= 0) {
            return false;
        }

        var _childTaskElems = _childrenTaskElem.find('div.child-task-owner-jid');
        for(var _i = 0; _i < _childTaskElems.length; _i++) {
            var _childTaskElem = _childTaskElems.eq(_i);
            var _contractorJid = _childTaskElem.attr('ownerjid');
            if(myJid === _contractorJid) {
                return true;
            }
        }

        return false;
    };

    _proto.setMessageInnerActionToolTip = function() {
        var _self = this;
        var _messageElem = _self.getHtmlElement();
        var _message = _self.getMessage();
        if(_messageElem == null || _message == null) {
            return;
        }
        var _childrenTaskItemIds = CubeeController.getInstance().getChildrenTaskItemIds(_message.getItemId());
        if(_childrenTaskItemIds == null) {
            return;
        }
        var _childCount = _childrenTaskItemIds.getCount();
        if(_childCount <= 0) {
            return;
        }

        var _childrenTaskElem = _messageElem.find('.children-task-assign');
        if(_childrenTaskElem.length <= 0) {
            return;
        }

        var _communityId = _message.getCommunityId();
        if(!_communityId) {
            return;
        }

        CubeeController.getInstance().getCommunityMemberInfo(_communityId, _onGetCommunityInfo);

        function _onGetCommunityInfo(communityInfo) {
            if (!communityInfo) {
                return;
            }
            var _loginUserJid = LoginUser.getInstance().getJid();

            var _communityAdmin = false;
            var _taskClient = false;
            var _taskContractor = false;
            _communityAdmin = communityInfo.hasOwner(_loginUserJid);
            _taskClient = _self.hasTaskClient(_loginUserJid);
            _taskContractor = _self.hasTaskContractor(_loginUserJid);
            if(!_communityAdmin && !_taskClient && !_taskContractor) {
                return;
            }

            var _childTaskElems = _childrenTaskElem.find('div.child-task-owner-jid');
            for(var _i = 0; _i < _childTaskElems.length; _i++) {
                var _childTaskElem = _childTaskElems.eq(_i);
                var _hasChildTaskToolTipElem = _childTaskElem.find('.childTaskActionToolTip').length;
                if(_hasChildTaskToolTipElem == 0){
                    var _childTaskItemId = _childTaskElem.attr('itemid');
                    if(_childTaskItemId == null || _childTaskItemId == '') {
                        continue;
                    }
                    var _childTask = CubeeController.getInstance().getMessage(_childTaskItemId);
                    if(_childTask == null) {
                        continue;
                    }
                    var _childTaskContractorJid = _childTaskElem.attr('ownerjid');
                    var _actionToolTipType = TooltipView.TYPE_UNKNOWN;
                    var _childTaskStatus = _childTask.getStatus();
                    if(_childTaskStatus == TaskMessage.STATUS_ASSIGNING) {
                        if(_communityAdmin) {
                            _actionToolTipType = TooltipView.TYPE_INNER_MESSAGE_CHILD_ASSIGNED_MY_TASK_ACTION;
                        } else {
                            if(_taskClient) {
                                if(_loginUserJid === _childTaskContractorJid) {
                                    _actionToolTipType = TooltipView.TYPE_INNER_MESSAGE_CHILD_ASSIGNED_MY_TASK_ACTION;
                                } else {
                                    _actionToolTipType = TooltipView.TYPE_INNER_MESSAGE_CHILD_ASSIGNED_TASK_ACTION;
                                }
                            } else {
                                if(_loginUserJid === _childTaskContractorJid) {
                                    _actionToolTipType = TooltipView.TYPE_INNER_MESSAGE_CHILD_ASSIGNED_MY_TASK_ACTION;
                                } else {
                                    continue;
                                }
                            }
                        }
                    } else if(_childTaskStatus > TaskMessage.STATUS_ASSIGNING) {
                        if(_communityAdmin) {
                            _actionToolTipType = TooltipView.TYPE_INNER_MESSAGE_CHILD_TASK_ACTION;
                        } else {
                            if(_taskClient) {
                                if(_loginUserJid === _childTaskContractorJid) {
                                    _actionToolTipType = TooltipView.TYPE_INNER_MESSAGE_CHILD_TASK_ACTION;
                                } else {
                                    _actionToolTipType = TooltipView.TYPE_INNER_MESSAGE_CHILD_ASSIGNED_TASK_ACTION;
                                }
                            } else {
                                if(_loginUserJid === _childTaskContractorJid) {
                                    _actionToolTipType = TooltipView.TYPE_INNER_MESSAGE_CHILD_TASK_ACTION;
                                } else {
                                    continue;
                                }
                            }
                        }
                    } else {
                        continue;
                    }

                    var _childTaskActionToolTipHtml = '<div class="childTaskActionToolTip" ><span title="' + Resource.getMessage("show_Action_ToolTip_button") + '" class="showActionTooltipButton ui-icon ui-icon-circle-triangle-w"/></div>';
                    if(ViewUtils.isIE89()){
                        var _ie89Html = '<td>' + _childTaskActionToolTipHtml + '</td>';
                        _childTaskElem.find('td:last').eq(0).before(_ie89Html);
                    } else {
                        _childTaskElem.children('div.child-task-status-view').eq(0).before(_childTaskActionToolTipHtml);
                    }
                    var _childTaskActionToolTipOwner = _childTaskElem;
                    var _showToolTipElem = _childTaskElem.find('.childTaskActionToolTip span').eq(0);

                    var _subData  = {
                        childTask : _childTask
                    };
                    
                    TooltipView.getInstance().setActionToolTip(_actionToolTipType, _childTaskElem, $('<div class="popup_menu msg_menu inner_task"><a class="msg_btn msg_menu_btn popup_btn ico_btn"><i class="fa fa-ellipsis-v"></i></a></div>'), false);
                    TooltipView.getInstance().setActionToolTipEvent(_subData, _childTaskElem.find('.inner_task'))
                }
            }
        };

    };

})();
