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
function MessageObjectIndex(msgObj) {
    this._msgObj = msgObj;
    this._children = new ArrayList();
};MessageObjectIndex.prototype = {
    getMsgObj : function() {
        return this._msgObj;
    },
    getChildren : function() {
        return this._children;
    },
    getChildrenCount : function() {
        return this._children.getCount();
    },
    cleanup : function() {
        this._msgObj.cleanup();
        this._children = null;
    }
};
function ColumnView(columnInfo) {
    var _self = this;
    _self._columnContentObj = null;
    if (!columnInfo || typeof columnInfo != 'object') {
        _self._info = null;
        _self._type = 0;
        _self._SendMessageRight = '';
        _self._ViewMessageRight = '';
     } else {
        _self._info = columnInfo;
        _self._type = this._info.getColumnType();
        _self._SendMessageRight = this._info.getRightToSendMessage();
        _self._ViewMessageRight = this._info.getRightToViewMessage();
    }
    _self._className = '';
    _self._idName = '';
    _self._displayName = '';
    _self._htmlElement = '';
    _self._closable = true;
    _self._msgObjHash = {};
    _self._msgObjIndexList = new ArrayList();
    _self._width = 0;
    _self._currentLoadedItemId = 0;
    _self._allMessageReceived = false;
    _self._uploading = false;
    _self._inputAreaHeight = 0;
    _self._disableBottomEvent = false;
    _self._pergeMessageTimerId = null;
};(function() {
    ColumnView.INSERT_MESSAGE_UNKNOWN = 0;
    ColumnView.INSERT_MESSAGE_BEFORE = 1;
    ColumnView.INSERT_MESSAGE_AFTER = 2;
    ColumnView.INSERT_MESSAGE_APPEND = 3;
    ColumnView.INSERT_MESSAGE_PREPEND = 4;
    ColumnView.CLASS_SEL_COLUMN = 'column';
    ColumnView.CLASS_SEL_TIMELINE = 'column-timeline';
    ColumnView.CLASS_SEL_MENTION = 'column-mention';
    ColumnView.CLASS_SEL_TOME = 'column-tome';
    ColumnView.CLASS_SEL_CHAT = 'column-chat';
    ColumnView.CLASS_SEL_TASK = 'column-task';
    ColumnView.CLASS_SEL_INBOX = 'column-inbox';
    ColumnView.CLASS_SEL_SEARCH = 'column-search';
    ColumnView.CLASS_SEL_FILTER = ColumnView.CLASS_SEL_SEARCH;
    ColumnView.CLASS_SEL_GROUP_CHAT = 'column-group-chat';
    ColumnView.CLASS_SEL_MAIL= 'column-mail';
    ColumnView.CLASS_SEL_RECENT= 'column-recent';
    ColumnView.CLASS_SEL_COMMUNITY_FEED = 'column-community-feed';
    ColumnView.CLASS_SEL_COMMUNITY_TASK = 'column-community-task';
    ColumnView.CLASS_SEL_SHOW_CONVERSATION = 'column-show-conversation';
    ColumnView.CLASS_SEL_QUESTIONNAIRE = 'column-questionnaire';
    ColumnView.CLASS_SEL_MURMUR = 'column-murmur';
    ColumnView.RECENT_REPLY_SHOW_COUNT = 1;
    ColumnView.HIDDEN_REPLY_CLS_NAME = 'target-hidden';
    ColumnView.TOGGLE_REPLY_CLS_NAME = 'toggle_reply';
    ColumnView.DISPLAY_NAME_TIMELINE = Resource.getMessage('MyFeed');
    ColumnView.DISPLAY_NAME_CHAT = Resource.getMessage('Chat');
    ColumnView.DISPLAY_NAME_MENTION = Resource.getMessage('Mention');
    ColumnView.DISPLAY_NAME_TOME = Resource.getMessage('ToMe');
    ColumnView.DISPLAY_NAME_TASK = Resource.getMessage('Task');
    ColumnView.DISPLAY_NAME_MY_TASK = Resource.getMessage('MyTask');
    ColumnView.DISPLAY_NAME_INBOX = Resource.getMessage('Inbox');
    ColumnView.DISPLAY_NAME_SEARCH = Resource.getMessage('Search');
    ColumnView.DISPLAY_NAME_GROUP_CHAT = Resource.getMessage('GroupChat');
    ColumnView.DISPLAY_NAME_MAIL = Resource.getMessage('Mail');
    ColumnView.DISPLAY_NAME_RECENT = Resource.getMessage('RecentPostedMessages');
    ColumnView.DISPLAY_NAME_COMMUNITY_FEED = Resource.getMessage('CommunityFeed');
    ColumnView.DISPLAY_NAME_COMMUNITY_TASK = Resource.getMessage('CommunityTask');
    ColumnView.DISPLAY_NAME_SHOW_CONVERSATION = Resource.getMessage('ShowConversation');
    ColumnView.DISPLAY_NAME_QUESTIONNAIRE = Resource.getMessage('MyQuestionnaire');
    ColumnView.DISPLAY_NAME_MURMUR = Resource.getMessage('Murmur');
    ColumnView.READ_MESSAGE_CONTROL_HREF_HEDER_STRING = '#ancer_';
    ColumnView.TEXTAREA_MAX_LENGTH = Conf.getVal('MESSAGE_BODY_MAX_LENGTH');
    ColumnView.THREAD_TITLE_MAX_LENGTH = Conf.getVal('THREAD_TITLE_BODY_MAX_LENGTH');
    ColumnView.prototype = $.extend({}, ViewCore.prototype);
    var _proto = ColumnView.prototype;

    _proto.createView = function() {
        var _self = this;
        var columnInfo = _self.getColumnInfo();
        if (_validation({'object' : columnInfo}) == false) {
            return;
        }
        var _columnType = _self.getType();
        columnInfo.setDisplayName(_self._displayName);
        var _autoCompleteInfo = ViewUtils.getSourceColumnTypeAndRoomIdFromColumnInfo(columnInfo, _columnType);
        var FormAreaHtml = '';
        FormAreaHtml += ColumnTextAreaView.getHtml(_columnType, _autoCompleteInfo, _self._SendMessageRight); 
        switch(_columnType) {
            case ColumnInformation.TYPE_COLUMN_TIMELINE :
            case ColumnInformation.TYPE_COLUMN_COMMUNITY_FEED :
            case ColumnInformation.TYPE_COLUMN_GROUP_CHAT :
            case ColumnInformation.TYPE_COLUMN_MURMUR :
                if (_self._ViewMessageRight == true) {
                     FormAreaHtml += _self.createFormAreaHtml(_columnType);
                }
            break;
        default:
            FormAreaHtml += _self.createFormAreaHtml(_columnType);
            break;
        }
        _self.createHtml(FormAreaHtml);
    };
    _proto.createFormAreaHtml = function(columnType) {
        var _ret = '';
        if (checkColumnTypeOnFormArea(columnType)) {
            _ret += '<div style="height: 32px; text-align: left; float: left; padding-left: 10px">';
            _ret += '<a class="ico_btn attach-toggle-btn" data-toggle="tooltip" data-placement="right"><i class="fa fa-ellipsis-h"></i></a>';
            _ret += '</div>';
            _ret += ColumnTextAreaView.getCharCounterHtml(columnType, this._SendMessageRight); 
            _ret += ColumnSubmitButtonView.getHtml(columnType); 
            _ret += '<div style="position:relative; display: inline-block;">'
            _ret += '<a class="list_add ico_btn emojibtn" data-container="body" data-toggle="tooltip" data-placement="bottom" title="" data-target="addgroup_modal" data-original-title="'+Resource.getMessage('stamp_name')+'" style="top: 0px;right: 0px;"><i class="fa fa-smile-o"></i></a>'
            _ret += '</div>'
            _ret += '<div class="message-attachment-area" style="display:none">'
            _ret += ColumnFileUploadPartsView.getHtml(columnType); 
            _ret += CodiMdViewUtils.getAttachmentHtmlElement();
            _ret += '</div>'
        } else {
            _ret += ColumnFileUploadPartsView.getHtml(columnType); 
            _ret += ColumnTextAreaView.getCharCounterHtml(columnType, this._SendMessageRight); 
            _ret += ColumnSubmitButtonView.getHtml(columnType); 
        }
        return _ret;
    };

    function checkColumnTypeOnFormArea(columnType) {
        switch(columnType) {
            case ColumnInformation.TYPE_COLUMN_TIMELINE:
            case ColumnInformation.TYPE_COLUMN_CHAT:
            case ColumnInformation.TYPE_COLUMN_GROUP_CHAT:
            case ColumnInformation.TYPE_COLUMN_COMMUNITY_FEED:
            case ColumnInformation.TYPE_COLUMN_MURMUR:
                return true;
                break;
            default :
                return false;
                break;
        }
        return false;
    }

    _proto._createHtml = function(FormAreaHtml) {
        var _ret = '';
        var _self = this;
        var _columnTypeClassString = _self._className;
        var _columnDisplayName = _self._displayName;
        var _closable = _self._closable;
        var _formAreaHtml = FormAreaHtml;
        var _columnType = _self.getType();
        // Unused variable columnInfo.
        // var columnInfo = _self.getColumnInfo();

        _ret += '<div class="card col_card chat_card ' + _columnTypeClassString + '-wrapper">';
        _ret += '<div class="box-border olient-vertical ui-widget-content ';
        _ret += ColumnView.CLASS_SEL_COLUMN + ' ' + _columnTypeClassString;
        _ret += '"';
        if(_self._idName != null && _self._idName != '') {
            _ret += ' roomid="' + _self._idName + '"';
        }else if(_columnType == ColumnInformation.TYPE_COLUMN_MURMUR){
            const partnerJid = MurmurColumnInformation.getOwnJidFromSearchCondition(_self._info);
            _ret += ' jid="' + partnerJid + '"';
        }
        _ret += '>';

        _ret += '<div class="box-border olient-horizontal ui-widget-header column-header">';
        _ret += '<a class="column-toggle col_btn col_input_btn popup_btn ico_btn" data-toggle="tooltip" data-placement="bottom" data-original-title="' + Resource.getMessage('column_btn_message_area_open_close') + '"><i class="fa fa-caret-down"></i></a>';
        if (_columnType == ColumnInformation.TYPE_COLUMN_GROUP_CHAT) {
            _ret += '<a class="group-member-btn col_btn popup_btn ico_btn" data-toggle="tooltip" data-placement="bottom" data-original-title="' + "メンバーの表示" + '"><i class="fa fa-users"></i></a>';
        }
        _ret += '<div class="flex1 text-overflow-ellipsis column-header-title" title="' + Utils.convertEscapedTag(_columnDisplayName) + '"><img src="" class="tab-icon">';
        _ret += Utils.convertEscapedHtml(_columnDisplayName);
        _ret += '</div>';
        if (_columnType != ColumnInformation.TYPE_COLUMN_TIMELINE || _self._ViewMessageRight != false) {
            _ret += '<div class="column-option popup_menu col_menu"'+ (!_closable ? ' style="right: 5px;"' : '') +'>';
            _ret += '<a class="col_btn col_menu_btn popup_btn ico_btn"><i class="fa fa-ellipsis-v"></i></a>';
            _ret += '</div>';
        }
        if (_closable) {
            _ret += '<a class="col_btn col_close_btn ico_btn" data-toggle="tooltip" data-placement="bottom" data-original-title="' + Resource.getMessage('column_btn_close') + '"><i class="fa fa-close"></i></a>';
        }

        _ret += '</div>';

        switch(_columnType) {
            case ColumnInformation.TYPE_COLUMN_TIMELINE :
            case ColumnInformation.TYPE_COLUMN_COMMUNITY_FEED :
            case ColumnInformation.TYPE_COLUMN_GROUP_CHAT :
                if (_self._SendMessageRight == true) {
                    _ret += '<div class="box-border ui-widget-content wrap-frm-message">';
                } else {
                    _ret += '<div class="box-border ui-widget-content wrap-frm-message  display-none">';
                }
                break;
            case ColumnInformation.TYPE_COLUMN_MURMUR :
                if (_self._ViewMessageRight == true) {
                    const partnerJid = MurmurColumnInformation.getOwnJidFromSearchCondition(_self._info);
                    if(LoginUser.getInstance().getJid() == partnerJid){
                        _ret += '<div class="box-border ui-widget-content wrap-frm-message">';
                    }else{
                        _ret += '<div class="box-border ui-widget-content wrap-frm-message" style="overflow: hidden; display:none; height:0px;">';
                    }
                } else {
                    _ret += '<div class="box-border ui-widget-content wrap-frm-message  display-none" >';
                }
                break;
            default:
                _ret += '<div class="box-border ui-widget-content wrap-frm-message">';
                break;
        }

        _ret += '<div class="flex1 frm-message ' + _columnTypeClassString + '-frm-message">';
        _ret += _formAreaHtml;
        _ret += '</div>';
        _ret += '</div>';

        _ret += '<div class="box-border-for-abbreviation olient-vertical column-content scroll_content"></div> <!-- .flex1 -->';
        _ret += '</div>';
        _ret += '</div>';
        return(_ret);
    };
    _proto.createHtml = function(FormAreaHtml) {
        var _self = this;
        const _ret = _self._createHtml(FormAreaHtml);
        _self._htmlElement = $(_ret);
        _self.viewWillAppear();
    };
    _proto.viewWillAppear = function() {
        var _self = this;
        _self._createSubForms();
        if (_self._htmlElement) {
            _self._createEventHandler();
            var _inputAreaElement = _self._htmlElement.children('div').children('div.wrap-frm-message');
            _self._inputAreaHeight = _inputAreaElement.height();
        }
        _self._LoadingIcon('div.wrap-frm-message');

        _self.getHistoryMessage();
        _self._startPergeMessageIntarval();
    };
    _proto._createSubForms = function() {
        var _self = this;
        var _targetColumnElem = _self.getHtmlElement();
        if(_targetColumnElem == null) {
            return;
        }
        var _columnType = _self.getType();
        if (_columnType == ColumnInformation.TYPE_COLUMN_UNKNOWN) {
            return;
        }
        var _textareaElement = _targetColumnElem.find('div.frm-message textarea.message-input-area');
        _self._textarea = new ColumnTextAreaView(_textareaElement, _self, Resource.getMessage('default_placeholder'));
        var titleTextElement = _targetColumnElem.find(('div.frm-message > textarea.message-input-area-title'));
        if (titleTextElement)  {
            _self._textTitleArea = new ColumnTextAreaView(titleTextElement, _self, Resource.getMessage('title_placeholder'));
        }
        if(_columnType == ColumnInformation.TYPE_COLUMN_TIMELINE) {
            if (_self._ViewMessageRight == false) {
                _self._textarea = new ColumnTextAreaView(_textareaElement, _self, Resource.getMessage('not_view_to_feed_err_placeholder'));
            } else if (_self._SendMessageRight == false) {
                _self._textarea = new ColumnTextAreaView(_textareaElement, _self, Resource.getMessage('not_send_to_feed_err_placeholder'));
            }
        }
        if(_columnType == ColumnInformation.TYPE_COLUMN_COMMUNITY_FEED) {
            if (_self._SendMessageRight == false) {
                _self._textarea = new ColumnTextAreaView(_textareaElement, _self, Resource.getMessage('not_send_to_community_err_placeholder'));
            }
        }
        if(_columnType == ColumnInformation.TYPE_COLUMN_GROUP_CHAT) {
            if (_self._SendMessageRight == false) {
                _self._textarea = new ColumnTextAreaView(_textareaElement, _self, Resource.getMessage('not_send_to_groupchat_err_placeholder'));
            }
        }
        if(_columnType == ColumnInformation.TYPE_COLUMN_MURMUR) {
            if (_self._ViewMessageRight == false) {
                _self._textarea = new ColumnTextAreaView(_textareaElement, _self, Resource.getMessage('not_view_to_murmur_err_placeholder'));
            }
        }
        var _btnElement = _targetColumnElem.find('div.frm-message > button');
        _self._button = new ColumnSubmitButtonView(_btnElement,
                                                   _self,
                                                   Resource.getMessage('column_btn_submit'),
                                                   Resource.getMessage('column_btn_submit-tooltip'));
        ViewUtils.setCharCounter(_textareaElement,
                                 _targetColumnElem.find('.char-counter-column'),
                                 ColumnView.TEXTAREA_MAX_LENGTH,
                                 undefined,
                                 false);
        if (titleTextElement) {
            ViewUtils.setCharCounter(titleTextElement,
                                     _targetColumnElem.find('.char-counter-title-column'),
                                     ColumnView.THREAD_TITLE_MAX_LENGTH,
                                     undefined,
                                     true);
        }
        var _fileUploadElement = _targetColumnElem.find('div.frm-message .file-inputs');
        _self._fileUpload = new ColumnFileUploadPartsView(_fileUploadElement, _self);
        var _progressBarElement = _targetColumnElem.find('div.frm-message').find('.submit-message-progress');
        _self._progressBar = new ProgressBarView(_progressBarElement, false);
    };
    _proto._createEventHandler = function() {
        var _self = this;
        var _rootElement = _self.getHtmlElement();
        if (!_rootElement) {
            console.log('ColumnView::_createEventHandler>>>' + _rootElement);
            return;
        }
        var _selectorBottom = 'div.column-content';
        var _selectorToggleButton = 'a.col_btn.col_input_btn';
        var _selectorConfigButton = 'div.popup_menu.col_menu';
        var _selectorCloseButton = 'a.col_btn.col_close_btn ';
        var _bottom = _rootElement.find(_selectorBottom);
        var _toggleButton = _rootElement.find(_selectorToggleButton);
        var _toggleIconOpen = 'ui-icon-minusthick';
        var _toggleIconClose = 'ui-icon-plusthick';
        var _columnType = _self.getType();
        _toggleButton.on('click', function(){
          $(this).parents('.column').toggleClass('open').find('.frm-message').stop().slideToggle(200, function(){
            ViewUtils.rayout_resize(_rootElement.find('.column-content'));
          });
        });

        var _optionMenu = _rootElement.find(_selectorConfigButton);
        var _closeButton = _rootElement.find(_selectorCloseButton);
        if(_columnType == 9){
            let gcInfo = CubeeController.getInstance().getChatRoomInfoByRoomId(_self._info._chatRoomInfomation._roomId);
            _self._info.setChatRoomInfomation(gcInfo)
            _self._setOptionMenu(_optionMenu);
        }else{
            _self._setOptionMenu(_optionMenu);
        }
        _closeButton.on('click', function() {
            ColumnManager.getInstance().removeColumn(_self);
        });

        _rootElement.find('[data-toggle="tooltip"]').tooltip({
          trigger: 'hover'
        });

        _self._setColumnTitleToolTip();

        _rootElement.on('click', '.attach-toggle-btn', function(){
            var _toggleAttachmentArea = _self.getHtmlElement().find('.message-attachment-area');
            _toggleAttachmentArea.slideToggle(200, function(){
                $(window).trigger('resize');
            });
        })

        _rootElement.find('.attach-note-btn').on('click', function(){
            var _noteAttachmentArea = _self.getHtmlElement().find('.attach-note-element');
            var _DialogAssignNoteOnSendMessageView = new DialogAssignNoteOnSendMessageView(_noteAttachmentArea);
            _DialogAssignNoteOnSendMessageView.showDialog();
        })
        _rootElement.find("a.menthion-dialog-btn").off('click.menthiondialogbtn');
        _rootElement.find("a.menthion-dialog-btn").on('click.menthiondialogbtn',ColumnView.mentionIconEvent);
    };

    ColumnView.mentionIconEvent = (event) => {
        let columNum;
        let columElm;

        let columns = $("#columnInnerContainer").children();
        for(let i=0;i<columns.length;i++){
            if($(columns[i]).is($(event.currentTarget).closest(".col_card"))){
                columNum = i;
                columElm = $(columns[i]);
            }
        }
        if(! columElm && $(event.currentTarget).closest("#side-bar-recent").length){
            columElm = $(event.currentTarget).closest("#side-bar-recent");
            columNum = -1;
        }
        if(typeof columNum != 'number'){
            return;
        }
        let clickColumnInfo;
        if(columNum >= 0){
            clickColumnInfo = ColumnManager.getInstance().getColumnList().get(columNum);
        }else if(columNum == -1){
            clickColumnInfo = SideMenuRecentView.getInstance().getColumnInfo();
        }
        let columnType = clickColumnInfo.getColumnType();

        let isConversationRecent = false;
        if(columnType == ColumnInformation.TYPE_COLUMN_SHOW_CONVERSATION ||
           columnType == ColumnInformation.TYPE_COLUMN_RECENT ||
           columnType == ColumnInformation.TYPE_COLUMN_SEARCH ||
           columnType == ColumnInformation.TYPE_COLUMN_FILTER ||
           columnType == ColumnInformation.TYPE_COLUMN_CUSTOM_FILTER){
            let itemId = $(event.currentTarget).closest("div.read-message").attr("itemid");
            let _message = CubeeController.getInstance()._messageManager;
            let emojiStampRecentMsgType = _message.getMessage(itemId).getType();
            if(emojiStampRecentMsgType != null){
                switch(emojiStampRecentMsgType){
                    case Message.TYPE_PUBLIC:
                        columnType = ColumnInformation.TYPE_COLUMN_TIMELINE;
                        break;
                    case Message.TYPE_CHAT:
                        columnType = ColumnInformation.TYPE_COLUMN_CHAT;
                        break;
                    case Message.TYPE_GROUP_CHAT:
                        columnType = ColumnInformation.TYPE_COLUMN_GROUP_CHAT;
                        break;
                    case Message.TYPE_COMMUNITY:
                        columnType = ColumnInformation.TYPE_COLUMN_COMMUNITY_FEED;
                        break;
                    default:
                        columnType = clickColumnInfo.getColumnType();
                        break;
                }
            }
            isConversationRecent = true;
        }
        switch(columnType){
            case ColumnInformation.TYPE_COLUMN_TIMELINE:
                break;
            case ColumnInformation.TYPE_COLUMN_CHAT:
                break;
            case ColumnInformation.TYPE_COLUMN_GROUP_CHAT:
                let _roomIdGC;
                if(isConversationRecent){
                    _roomIdGC = $(event.currentTarget).parent().find("textarea.message-input-area.input-message-reply").attr("groupid");
                }else{
                    _roomIdGC = $(columElm).find("div.column-group-chat")
                                           .attr("roomid");
                }
                let basemessGC = $(event.currentTarget).parent().find("textarea.message-input-area").val();
                let dialogGC = new DialogMenthionGroupChatPersonList(
                    _roomIdGC,
                    basemessGC,
                    (mentions) => {
                        let mentionStr = "";
                        for(let i=0;i<mentions.length;i++){
                            if(basemessGC.indexOf(mentions[i]) < 0 &&
                               mentionStr.indexOf(mentions[i]) < 0){
                                mentionStr += mentions[i] + " ";
                            }
                        }
                        $(event.currentTarget).parent().find("textarea.message-input-area").val(mentionStr + basemessGC);
                    });
                dialogGC.showDialog();
                break;
            case ColumnInformation.TYPE_COLUMN_COMMUNITY_FEED:
                let _roomIdPJ;
                if(isConversationRecent){
                    _roomIdPJ = $(event.currentTarget).parent().find("textarea.message-input-area.input-message-reply").attr("groupid");
                }else{
                    _roomIdPJ = $(columElm).find("div.column-community-feed")
                                           .attr("roomid");
                }
                let basemessPJ = $(event.currentTarget).parent().find("textarea.message-input-area").val();
                let dialogPJ = new DialogMenthionCommunityPersonList(
                    _roomIdPJ,
                    basemessPJ,
                    (mentions) => {
                        let mentionStr = "";
                        for(let i=0;i<mentions.length;i++){
                            if(basemessPJ.indexOf(mentions[i]) < 0 &&
                               mentionStr.indexOf(mentions[i]) < 0){
                                mentionStr += mentions[i] + " ";
                            }
                        }
                        $(event.currentTarget).parent().find("textarea.message-input-area").val(mentionStr + basemessPJ);
                    });
                dialogPJ.showDialog();
                break;
        }
    };
    _proto._setOptionMenu = function(optionButton) {
        var _self = this;
        var _optionMenuHtml = WithReadDoneColumnOptionMenu.getHtml(_self._info);
        var _optionMenuElem = optionButton.append(_optionMenuHtml);
        _self._columnOptionMenu = new WithReadDoneColumnOptionMenu(_optionMenuElem, _self._info, _self);
    };
    _proto._setColumnTitleToolTip = function() {
        var _self = this;
        var _columnInfo = _self._info;
        var _columnDisplayName = _columnInfo.getDisplayName();
        var _rootElement = _self.getHtmlElement();
        if(_rootElement == null) {
            return;
        }
        var _columnHeaderChildDiv = _rootElement.find('div.column-header > div');
        var _columnHeaderTitle = _columnHeaderChildDiv.eq(0);
        var _toolTipContent = '<div class="tooltipColumnTitle"><h>' + Utils.convertEscapedHtml(_columnDisplayName, false) + '</h><div>';
        _columnHeaderTitle.attr('title', _columnDisplayName);
    };

    _proto.getHistoryMessage = function() {
    };
    _proto.showUpdateMessage = function(msg) {
    };
    _proto.cleanup = function() {
        var _self = this;
        var _hash = _self._getMsgObjHash();
        for (var key in _hash) {
            _hash[key].cleanup();
            delete _hash[key];
        }
        if(_self._button){
            _self._button.cleanup();
            _self._button = null;
        }
        if(_self._textarea){
            _self._textarea.cleanup();
            _self._textarea = null;
        }
        delete _self._button;
        delete _self._textarea;
        var _rootElement = _self.getHtmlElement();
        if(_rootElement != null){
            _rootElement.find("*").off().trigger("autosize.destroy").remove();
            _rootElement.off();
        }
        _self._htmlElement = null;
        delete _self._htmlElement;
        _self._uploading = false;
        if(_self._columnOptionMenu){
            _self._columnOptionMenu.cleanup();
        }
        delete _self._columnOptionMenu;
        _self._className = '';
        _self._displayName = '';
        _self._closable = true;
        _self._msgObjHash = {};
        _self._msgObjIndexList = new ArrayList();
        _self._width = 0;
        _self._currentLoadedItemId = 0;
        _self._allMessageReceived = false;
        _self._uploading = false;
        _self._inputAreaHeight = 0;
        if(_self._columnContentObj){
            _self._columnContentObj = null;
        }
        if(_self._fileUpload){
            _self._fileUpload.cleanup();
            _self._fileUpload = null;
            delete _self._fileUpload;
        }
        if(_self._progressBar){
            _self._progressBar.cleanup();
            _self._progressBar = null;
            delete _self._progressBar;
        }
        _self._disableBottomEvent = false;
        _self._endPergeMessageIntarval();
    };
    _proto.getType = function() {
        return this._type;
    };
    _proto.getColumnInfo = function() {
        return this._info;
    };
    _proto._getMsgObjHash = function() {
        return this._msgObjHash;
    };
    _proto.addMsgObjIndexToHash = function(msgObjIndex) {
        if (_validation({'object' : msgObjIndex}) == false) {
            return false;
        }
        var _self = this;
        var _msg = msgObjIndex.getMsgObj().getMessage();
        if (_validation({'object' : _msg}) == false) {
            return false;
        }
        var _itemId = _msg.getItemId();
        if (_validation({'string' : _itemId}) == false) {
            return false;
        }
        var _hash = _self._getMsgObjHash();
        _hash[_itemId] = msgObjIndex;
        return true;
    };
    _proto.getMsgObjByItemId = function(itemId) {
        if (_validation({'string' : itemId}) == false) {
            return null;
        }
        var _self = this;
        var _hash = _self._getMsgObjHash();
        var _index;
        if ( itemId in _hash) {
            _index = _hash[itemId];
            if (_index) {
                return _index.getMsgObj();
            }
        }
        return null;
    };
    _proto.getMsgObjIndexByItemId = function(itemId) {
        if (_validation({'string' : itemId}) == false) {
            return null;
        }
        var _self = this;
        var _hash = _self._getMsgObjHash();
        if ( itemId in _hash) {
            return _hash[itemId];
        }
        return null;
    };
    _proto.removeFromHash = function(itemId) {
        if (_validation({'string' : itemId}) == false) {
            return;
        }
        var _self = this;
        var _hash = _self._getMsgObjHash();
        if ( itemId in _hash) {
            delete _hash[itemId];
        }
    };
    _proto._getMsgObjIndexList = function() {
        return this._msgObjIndexList;
    };
    _proto.addMsgObjIndex = function(msgObjIndex) {
        if (_validation({'object' : msgObjIndex}) == false) {
            return false;
        }
        var _self = this;
        _self.addMsgObjIndexToHash(msgObjIndex);
        _self._getMsgObjIndexList().add(msgObjIndex);
        return true;
    };
    _proto.getMsgObjIndexPositionByItemId = function(itemId) {
        if (_validation({'string' : itemId}) == false) {
            return null;
        }
        var _self = this;
        var _ret = -1;
        var _indexList = _self._getMsgObjIndexList();
        var _indexListCount = _indexList.getCount();
        for (var _i = 0; _i < _indexListCount; _i++) {
            var _curElm = _indexList.get(_i);
            var _curItemId = _curElm.getMsgObj().getMessage().getItemId();
            if (_curItemId == itemId) {
                _ret = _i;
                break;
            }
        }
        return _ret;
    };
    _proto.insertMsgObjIndex = function(pos, msgObjIndex) {
        if (_validation({'object' : msgObjIndex, 'position' : pos}) == false) {
            return false;
        }
        var _self = this;
        var _indexList = _self._getMsgObjIndexList();
        _self.addMsgObjIndexToHash(msgObjIndex);
        return _indexList.insert(pos, msgObjIndex);
    };
    _proto.removeMsgObjIndexByItemId = function(itemId) {
        if (_validation({'string' : itemId}) == false) {
            return false;
        }
        var _self = this;
        var _indexList = _self._getMsgObjIndexList();
        var _count = _indexList.getCount();
        _self.removeFromHash(itemId);
        for (var _i = 0; _i < _count; _i++) {
            var _curIndex = _indexList.get(_i);
            var _curMsgObj = _curIndex.getMsgObj();
            var _curMsg = _curMsgObj.getMessage();
            if (_curMsg.getItemId() == itemId) {
                _curMsgObj.cleanup();
                return _indexList.remove(_i);
            }
            var _curIndexChildren = _curIndex.getChildren();
            var _indexCount = _curIndex.getChildrenCount();
            for (var _j = 0; _j < _indexCount; _j++) {
                var _curIndexChild = _curIndexChildren.get(_j);
                var _curMsgObj = _curIndexChild.getMsgObj();
                var _curMsg = _curMsgObj.getMessage();
                if (_curMsg.getItemId() == itemId) {
                    _curMsgObj.cleanup();
                    return _curIndexChildren.remove(_j);
                }
            }
        }
        return false;
    };
    _proto.getParentMsgObjByPosition = function(pos) {
        if (_validation({'position' : pos}) == false) {
            return null;
        }
        var _self = this;
        var _indexList = _self._getMsgObjIndexList();
        var _count = _indexList.getCount();
        if(pos >= 0 || pos < _count) {
            return _indexList.get(pos).getMsgObj();
        }
        return null;
    };
    _proto._LoadingIcon = function(className) {
        var _self = this;
        var _targetColumnElem = _self.getHtmlElement();
        if(_targetColumnElem == null) {
            return;
        }
        var _elem = _targetColumnElem.find(className);
        if(_elem.size() > 0) {
            ViewUtils.showLoadingIcon(_elem);
        }

        return _elem;
    };
    _proto._hideLoadingIconInSelf = function() {
        var _self = this;
        var _targetColumnElem = _self.getHtmlElement();
        if(_targetColumnElem == null) {
            return;
        }
        var _columnContentElem = _targetColumnElem.children('div').children('div.column-content');
        ViewUtils.hideLoadingIconInChild(_columnContentElem);

        var _firstLoadingIconElem = _targetColumnElem.find('div.wrap-frm-message');
        ViewUtils.hideLoadingIcon(_firstLoadingIconElem);
    };
    _proto.clickSubFormButton = function() {
        console.log('ColumnView::clickSubFormButton _ must inherit method.');
    };

    _proto._uploadFileAndSendMessage = function(text, sendMessageFunction , threadTitle="") {
        var _self = this;
        if (_validation({'function' : sendMessageFunction}) == false) {
            return false;
        }
        if (_self._uploading == true) {
            return false;
        }
        var _files;
        var _fileform;
        var newMessageArea = _self.getHtmlElement().find(".wrap-frm-message");
        if (ViewUtils.isValidInputTextLength(text)  &&
            ViewUtils.getCalculattionTitle(threadTitle) <= ColumnView.THREAD_TITLE_MAX_LENGTH) {
            if (_self._fileUpload == null) {
                sendMessageFunction(text);
                return;
            }
            if(!ViewUtils.isIE89()){
                _files = _self._fileUpload.getFilesObject();
                if (_files == null) {
                    sendMessageFunction(text);
                    return;
                }
                if (_files.length <= 0) {
                    sendMessageFunction(text);
                    return;
                }
                _self._progressBar.visibleProgressBar();
                ViewUtils.switchAttachmentArea(newMessageArea, false);
            } else {
                var _fileform = _self._fileUpload.getFileForm();
                if(_fileform == null){
                    sendMessageFunction(text);
                    return;
                }
                if(_fileform.value == "") {
                    sendMessageFunction(text);
                    return;
                }
            }

            function onUploadResult(result) {
                if (result.result != "success") {
                    _self._uploading = false;
                    if(!ViewUtils.isIE89()){
                        ViewUtils.switchAttachmentArea(newMessageArea, true);
                        _self._progressBar.progressClear();
                    }else{
                        ViewUtils.hideLoadingIcon(_self._textarea.getHtmlElement());
                        ViewUtils.showErrorMessageIE(_self._textarea.getHtmlElement(), Resource.getMessage('error_file_up_request'));
                    }
                    return;
                }

                text += '\n' + result.path;
                sendMessageFunction(text);
                _self._uploading = false;
                if(!ViewUtils.isIE89()){
                    ViewUtils.switchAttachmentArea(newMessageArea, true);
                    _self._progressBar.progressComplete();
                }else{
                    ViewUtils.hideLoadingIcon(_self._textarea.getHtmlElement());
                    ViewUtils.hideErrorMessageIE(_self._textarea.getHtmlElement());
                }
            };

            function onUploadProgress(progress) {
                _self._progressBar.setProgressValue(progress);
            };

            _self._uploading = true;

            if(!ViewUtils.isIE89()){
                var _file = _files[0];
                return CubeeController.getInstance().uploadFile(_file, onUploadResult, onUploadProgress);
            }else{
                ViewUtils.showLoadingIcon(_self._textarea.getHtmlElement());
                return CubeeController.getInstance().uploadFileIE(_fileform, onUploadResult);
            }
        }
        return false;
    };
    _proto.createMessageObjectOnly = function(msg) {
        console.log('ColumnView::createMessageObjectOnly … must inherits method');
    };
    _proto._setMessageObject = function(_msgObj, element, pos) {
        var _self = this;
        if (_validation({'element' : element, 'position' : pos}) == false) {
            return;
        }
        _msgObj.setHtmlElement(element);
        var _msgObjIndex = new MessageObjectIndex(_msgObj);
        var _indexList = _self._getMsgObjIndexList();
        var _indexListCount = _indexList.getCount();
        if (pos == -1 || (_indexListCount == 0 && pos == 0)) {
            if (!_self.addMsgObjIndex(_msgObjIndex)) {
                console.log('ColumnView::_setMessageObject … addMsgObjIndex fail');
            }
        } else if (pos >= _indexListCount) {
            console.log('ColumnView::_setMessageObject … pos is over _indexListCount>>>' + pos + '/' + _indexListCount);
        } else {
            if (!_self.insertMsgObjIndex(pos, _msgObjIndex)) {
                console.log('ColumnView::_setMessageObject … insertMsgObjIndex fail');
            }
        }
    };
    _proto._getMessageElement = function(pos) {
        if (_validation({'position' : pos}) == false) {
            return null;
        }
        var _self = this;
        if (!_self._columnContentObj){
            var _htmlElem = _self.getHtmlElement();
            if(_htmlElem == null) {
                return;
            }
        }
        return _self.getColumnContent().children('div').eq(pos);
    };
    _proto.showMessage = function(msg) {
        var _self = this;
        if (_self._validation({'object' : msg}) == false) {
            return false;
        }
        _self._showMessageData(msg);
    };
    _proto._showMessageData = function(msg) {
        if (_validation({'object' : msg}) == false) {
            return false;
        }
        var _self = this;
        var _itemId = msg.getItemId();
        if (_self.getMsgObjByItemId(_itemId)) {
            return true;
        }
        var _content;
        var _type = msg.getType();
        var _targetColumnElem = _self.getHtmlElement();
        if(_targetColumnElem == null) {
            return;
        }
        var _columnContentElem = _self.getColumnContent();

        var msgObj = _self.createMessageObjectOnly(msg);
        _content = _self.getColumnMessageHtml(msgObj, false);
        if (_content == "") {
            return false;
        }
        _content = _self.createDivMessageBorder(_content);
        _self._setMessageObject(msgObj, _content, 0);
        _columnContentElem.prepend(_content);
        var _linkElm = _content.children();
        new MessageColumnLink($(_linkElm), msg);

        addMessageRoomTitleHeader(_self, msg, _content);

        var _toolTipBaseElement = _content.children().not('.' + ColumnView.TOGGLE_REPLY_CLS_NAME).eq(0);
        _self._setToolTipToMessageElem(_toolTipBaseElement, msg, msgObj);
        msgObj.onAddMessageReferCount();

        if(msg.getBodyType() == 1){
            ViewUtils.showStampMessage(_linkElm, _self);
        }
        _self.afterCreateMessageHtml(_linkElm);
        return true;
    };
    _proto.getColumnMessageHtml = function(message, replyFlag) {
        console.log('ColumnView::getColumnMessageHtml _ must inherit method.');
    };
    _proto.getActionToolTipType = function(message) {
        var _ret = 0;
        if (_validation({'object' : message}) == false) {
            return _ret;
        }
        var _type = message.getType();
        var _replyId = null;
        if (_type == Message.TYPE_PUBLIC) {
            _replyId = message.getReplyItemId();
        }

        var _loginUserJid = LoginUser.getInstance().getJid();
        var _messageAuthorJID = message.getFrom();
        switch(_type) {
            case Message.TYPE_PUBLIC:
            case Message.TYPE_GROUP_CHAT:
            case Message.TYPE_COMMUNITY:
            case Message.TYPE_CHAT: 
            case Message.TYPE_MURMUR:
                if(message.getDeleteFlag() == 2 || _loginUserJid != _messageAuthorJID){
                    _ret = TooltipView.TYPE_PUBLIC_REPLY;
                }else{
                    _ret = TooltipView.TYPE_PUBLIC_REPLY_CAN_DELETE;
                }
                break;
            case Message.TYPE_MAIL:
                _ret = TooltipView.TYPE_CHAT;
                break;
            case Message.TYPE_TASK:
                _ret = TooltipView.TYPE_TASK;
                var _status = message.getStatus();
                var _owner = message.getOwnerJid();
                var _loginUser = LoginUser.getInstance().getJid();
                var _parentId = message.getParentItemId();
                if (_status == TaskMessage.STATUS_INBOX) {
                    _ret = TooltipView.TYPE_INBOX;
                }

                else if ((_owner == _loginUser) && (_parentId != "")) {

                  if(_status == TaskMessage.STATUS_ASSIGNING){
                    _ret = TooltipView.TYPE_ASSIGNED_TASK;
                  }
                  else{
                    _ret = TooltipView.TYPE_CHILD_TASK;
                  }
                }else if((_owner != _loginUser) && (_parentId != "")){
                    _ret = TooltipView.TYPE_CHILD_TASK;
                } else {
                    var _childrenTaskItemIds = CubeeController.getInstance().getChildrenTaskItemIds(message.getItemId());
                    if (_childrenTaskItemIds != null && _childrenTaskItemIds.getCount() > 0) {
                        var _demandTaskList = ViewUtils.getDemandTaskListByMessage(message);
                        if (_demandTaskList.getCount() > 0) {
                            _ret = TooltipView.TYPE_PARENT_TASK_CANCEL;
                        } else {
                            _ret = TooltipView.TYPE_PARENT_TASK;
                        }
                    }
                }
                break;
            case Message.TYPE_SYSTEM:
                break;
            case Message.TYPE_QUESTIONNAIRE:
                _ret = TooltipView.TYPE_QUESTIONNAIRE;
                break;
            default:
                console.log('ColumnView::getActionToolTipType _ invalid type:' + _type);
                break;
        }
        return _ret;
    };
    _proto.getBottomToolTipType = function(message) {
        var _ret = 0;
        if (_validation({'object' : message}) == false) {
            return _ret;
        }
        return _ret;
    };
    _proto._showReadMore = function() {
        var _self = this;
        var _parentOfElm;
        var _tailOfElm;
        var _ret = false;
        var _maxNumMsg = 0;
        var _htmlElem = _self.getHtmlElement();
        if(_htmlElem == null) {
            return;
        }
        var _elm = _self.getColumnContent();

        if (_validation({'object' : _elm}) == false) {
            return _ret;
        }
        if (_self._allMessageReceived == true) {
            return false;
        }
        _parentOfElm = _elm.parents("div.ui-widget-content.column");

        _tailOfElm = _elm.children('div:last');
        if (_tailOfElm.hasClass(ViewUtils.LOADING_ICON_CLASS_NAME)) {
            return false;
        }
        _self._hideLoadingIconInSelf();
        ViewUtils.showLoadingIcon(_tailOfElm);
        _maxNumMsg = _elm.children('div').size();
        if (_maxNumMsg == 0) {
            ViewUtils.hideLoadingIcon(_tailOfElm);
            return false;
        }
        if (_hasClass(_parentOfElm)) {
            _self.getHistoryMessage();
            _ret = true;
        }
        return _ret;
    };
    _proto.showHistoryMessage = function(msg) {
        if (_validation({'object' : msg}) == false) {
            return;
        }
        var _self = this;
        _self._hideLoadingIconInSelf();

        var _messageId = msg.getId();
        if (_self._currentLoadedItemId == 0 || _self._currentLoadedItemId > _messageId) {
            _self._currentLoadedItemId = _messageId;
        }
        var _type = msg.getType();
        if (_type == Message.TYPE_TASK) {
            _self._currentLoadedItemId = _messageId;
        }
        var _itemId = msg.getItemId();
        if (_self.getMsgObjByItemId(_itemId)) {
            return;
        }
        var _content;
        var _type = msg.getType();
        var _targetColumnElem = _self.getHtmlElement();
        if(_targetColumnElem == null) {
            return;
        }
        var _columnContentElem = _self.getColumnContent();

        var msgObj = _self.createMessageObjectOnly(msg);
        if(msgObj == null) {
            return;
        }
        _content = _self.getColumnMessageHtml(msgObj, false);
        if (_content == '') {
            return;
        }
        _content = _self.createDivMessageBorder(_content);
        _self._setMessageObject(msgObj, _content, -1);
        _columnContentElem.append(_content);
        var _linkElm = _content.children();
        new MessageColumnLink($(_linkElm), msg);

        addMessageRoomTitleHeader(_self, msg, _content);

        var _toolTipBaseElement = _self._getToolTipBaseElement(_content);
        _self._setToolTipToMessageElem(_toolTipBaseElement, msg, msgObj);
        msgObj.onAddMessageReferCount();

        if(msg.getBodyType() == 1){
            ViewUtils.showStampMessage(_linkElm, _self);
        }
        _self.afterCreateMessageHtml(_linkElm);
    };
    _proto._getToolTipBaseElement = function (content) {
        return content.children().not('.' + ColumnView.TOGGLE_REPLY_CLS_NAME).eq(0);
    };
    _proto._getRootReplyItemId = function(message) {
        var _self = this;
        var _ret = '';
        if (_self._validation({'object' : message}) == false) {
            return false;
        }
        var _replyItemId = message.getReplyItemId();
        if(_replyItemId == null || _replyItemId == '') {
            return _ret;
        }
        var _replyMessageObj = _self.getMsgObjByItemId(_replyItemId);
        if(_replyMessageObj == null) {
            return _ret;
        }
        var _replyMessage = _replyMessageObj.getMessage();
        if(_replyMessage == null) {
            return _ret;
        }
        var _replyMessageItemId = _replyMessage.getItemId();
        if(_replyMessageItemId == null) {
            return _ret;
        }
        _ret = _replyItemId;
        var _rootObj = _self.getParentMsgObjByItemId(_replyItemId);
        if(_rootObj == null) {
            return _ret;
        }
        var _rootMessage = _rootObj.getMessage();
        if(_rootMessage == null) {
            return _ret;
        }
        var _rootMessageItemId = _rootMessage.getItemId();
        if(_rootMessageItemId == null) {
            return _ret;
        }
        _ret = _rootMessageItemId;
        return _ret;
    };
    _proto._getReplyPositionElement = function(replyFirstId, targetElement) {
        var _self = this;
        var _ret = {};
        _ret.insertElementFound = false;
        if (replyFirstId != null && replyFirstId != '') {
            var _cnt = targetElement.children('div').length;
            for (var _i = 0; _i < _cnt; _i++) {
                var _element = targetElement.children('div').eq(_i);
                if (_element == null) {
                    break;
                }
                var _childElement = _element.children().not('.' + ColumnView.TOGGLE_REPLY_CLS_NAME).eq(0);
                if (_childElement == null) {
                    break;
                }
                var _messageInfoElement = _childElement.children('div.message-header').children('div.message-info');
                if (_messageInfoElement == null) {
                    return;
                }
                var _itemId = _messageInfoElement.attr('itemid');
                if (_itemId == replyFirstId) {
                    _ret.insertElementFound = true;
                    _ret.insertElement = _element;
                    _ret.replyInsertIndex = _i;
                    break;
                }
            }
        }
        return _ret;
    };
    _proto.addMsgObjIndexChild = function(insertTargetItemid, msgObjIndex) {
        var _self = this;
        if (_self._validation({'string' : insertTargetItemid, 'object' : msgObjIndex}) == false) {
            return false;
        }
        var _indexList = _self._getMsgObjIndexList();
        var _targetIndex = _self.getMsgObjIndexByItemId(insertTargetItemid);
        _self.addMsgObjIndexToHash(msgObjIndex);
        _targetIndex.getChildren().add(msgObjIndex);
        return true;
    };
    _proto.getParentMsgObjByItemId = function(childItemId) {
        var _self = this;
        if (_self._validation({'string' : childItemId}) == false) {
            return null;
        }
        var _indexList = _self._getMsgObjIndexList();
        var _count = _indexList.getCount();
        var _isFound = false;
        for (var _i = 0; _i < _count; _i++) {
            var _curIndex = _indexList.get(_i);
            var _curIndexChildren = _curIndex.getChildren();
            var _indexCount = _curIndex.getChildrenCount();
            for (var _j = 0; _j < _indexCount; _j++) {
                var _curIndexChild = _curIndexChildren.get(_j);
                var _curMsgObj = _curIndexChild.getMsgObj();
                var _curMsg = _curMsgObj.getMessage();
                if (_curMsg.getItemId() == childItemId) {
                    _isFound = true;
                    break;
                }
            }
            if (_isFound) {
                return _curIndex.getMsgObj();
            }
        }
        return null;
    };
    _proto.strToggleReplyLinkHtml = function (strLinkTxt, threadRootElement) {
        var _self = this;
        if (_self._validation({'string' : strLinkTxt}) == false) {
            return;
        }
        if (_self._validation({'object' : threadRootElement}) == false) {
            return;
        }
        var _messageStatusCssClass = (threadRootElement.hasClass(ColumnMessageView.MESSAGE_READ_STATUS_READ_CSS_CLS))? ColumnMessageView.MESSAGE_READ_STATUS_READ_CSS_CLS : ColumnMessageView.MESSAGE_READ_STATUS_UNREAD_CSS_CLS;

        var _html = '<div class="box-border ' + ColumnView.TOGGLE_REPLY_CLS_NAME + ' ' + _messageStatusCssClass + '">' + strLinkTxt + '</div><div class="comment_wrapper"></div>';
        return _html;
    };
    _proto._showMessageDataWithThread = function(msg) {
        var _self = this;
        if (_self._validation({'object' : msg}) == false) {
            return false;
        }
        var _itemId = msg.getItemId();
        if (_self.getMsgObjByItemId(_itemId)) {
            return true;
        }
        var _content;
        var _msgElement;
        var _type = msg.getType();
        var _targetSel = _self.getHtmlElement();
        if(_targetSel == null) {
            return;
        }
        var _targetElm = _self.getColumnContent();


        var _messageElm = null;
        var _insertElementFound = false;
        var _insertElement = null;
        var _replyInsertIndex = -1;

        var _replyFirstId = _self._getRootReplyItemId(msg);
        if (_replyFirstId != null && _replyFirstId != '') {
            var _replyFirstObj = _self.getMsgObjByItemId(_replyFirstId);
            if(_replyFirstObj != null) {
                _insertElement = _replyFirstObj.getHtmlElement();
                _insertElementFound = true;
                _replyInsertIndex = _self.getMsgObjIndexPositionByItemId(_replyFirstId);
            }
        }

        var _msgObj = _self.createMessageObjectOnly(msg);
        _content = _self.getColumnMessageHtml(_msgObj, _insertElementFound);
        if (_content == "") {
            return false;
        }

        if (_insertElementFound) {
            _insertElement.append(_content);
            _msgElement = _insertElement.children().eq(-1);
            _msgObj.setHtmlElement(_msgElement);
            var _msgObjIndex = new MessageObjectIndex(_msgObj);
            _self.addMsgObjIndexChild(_replyFirstId, _msgObjIndex);

            _insertElement.detach();
            _targetElm.prepend(_insertElement);
            _self._getMsgObjIndexList().move(_replyInsertIndex, 0);
            _messageElm = _insertElement;
        } else {
            _content = _self.createDivMessageBorder(_content);
            _self._setMessageObject(_msgObj, _content, 0);
            _targetElm.prepend(_content);
            _msgElement = _self._getMessageElement(0).children().eq(-1);
        }
        var _linkElm = _msgElement;
        new MessageColumnLink($(_linkElm), msg);

        var _toolTipBaseElement;
        var _insertedElement = _targetElm.children('div').eq(0);
        if (_insertElementFound) {
            _toolTipBaseElement = _insertedElement.children().not('.' + ColumnView.TOGGLE_REPLY_CLS_NAME).eq(-1).children('div').eq(1);
        } else {
            _toolTipBaseElement = _insertedElement.children().not('.' + ColumnView.TOGGLE_REPLY_CLS_NAME).eq(-1);
        }

        addMessageRoomTitleHeader(_self, msg, _insertedElement);

        _self._setToolTipToMessageElem(_toolTipBaseElement, msg, _msgObj);
        if (_messageElm != null) {
            var _replyCount = _messageElm.children().not('.' + ColumnView.TOGGLE_REPLY_CLS_NAME).length - 1;
            var _currentReply = _messageElm.children().not('.' + ColumnView.TOGGLE_REPLY_CLS_NAME).eq(-1).prev();
            if (_replyCount > ColumnView.RECENT_REPLY_SHOW_COUNT) {
                if (_messageElm.children('.' + ColumnView.HIDDEN_REPLY_CLS_NAME).length == 0) {
                    var _currentClsVal = _currentReply.attr('class');
                    _currentReply.attr('class', _currentClsVal + ' ' + ColumnView.HIDDEN_REPLY_CLS_NAME);
                    _currentReply.hide();
                    _messageElm.children('.' + ColumnView.TOGGLE_REPLY_CLS_NAME).remove();
                    var allReplyCount = _messageElm.children('div.thread-message').length;
                    var toggleString = Utils.stringFormat(Resource.getMessage('show_past_reply_txt'), allReplyCount);
                    var _threadRootElement = _messageElm.children().not('.' + ColumnView.TOGGLE_REPLY_CLS_NAME).eq(0);
                    var strToggleHtml = _self.strToggleReplyLinkHtml(toggleString, _threadRootElement);
                    _messageElm.children().not('.' + ColumnView.TOGGLE_REPLY_CLS_NAME).eq(0).after(strToggleHtml);
                } else {
                    if (_messageElm.children('.' + ColumnView.HIDDEN_REPLY_CLS_NAME).is(':hidden')) {
                        var _currentClsVal = _currentReply.attr('class');
                        _currentReply.attr('class', _currentClsVal + ' ' + ColumnView.HIDDEN_REPLY_CLS_NAME);
                        _currentReply.hide();
                        var allReplyCount = _messageElm.children('div.thread-message').length;
                        var toggleString = Utils.stringFormat(Resource.getMessage('show_past_reply_txt'), allReplyCount);
                        _messageElm.children('.' + ColumnView.TOGGLE_REPLY_CLS_NAME).text(toggleString);
                    }
                }
            }
        }
        _msgObj.onAddMessageReferCount();

        if(msg.getBodyType() == 1){
            ViewUtils.showStampMessage(_linkElm, _self);
        }
        _self.afterCreateMessageHtml(_linkElm);

        return true;
    };
    _proto._showHistoryMessageWithThread = function(msg) {
        var _self = this;
        if (_self._validation({'object' : msg}) == false) {
            return;
        }
        var _messageId = msg.getId();
        if (_self._currentLoadedItemId == 0 || _self._currentLoadedItemId > _messageId) {
            _self._currentLoadedItemId = _messageId;
        }
        var _itemId = msg.getItemId();
        if (_self.getMsgObjByItemId(_itemId)) {
            return;
        }
        var _targetColumnElem = _self.getHtmlElement();
        if(_targetColumnElem == null) {
            return;
        }
        var _columnContentElem = _self.getColumnContent();

        var _repliedItemIds = CubeeController.getInstance().getReplyReverseItemIds(_itemId);

        var _isDisply = false;
        var _threadTargetMsgObjIndexList = new ArrayList();
        var _reply = false;
        var msgObj = _self.createMessageObjectOnly(msg);
        var _insertHtml = _self.getColumnMessageHtml(msgObj, _reply);
        _insertHtml = _self.createDivMessageBorder(_insertHtml);

        var _msgElement;
        if (_repliedItemIds != null) {
            var _repliedItemIdCount = _repliedItemIds.getCount();
            var _firstFindPos = -1;
            for (var _j = 0; _j < _repliedItemIdCount; _j++) {
                var _replyedItemId = _repliedItemIds.get(_j);
                var _threadTargetMsgObjIndex = _self.getMsgObjIndexByItemId(_replyedItemId);
                if(_threadTargetMsgObjIndex != null) {
                    _threadTargetMsgObjIndexList.add(_threadTargetMsgObjIndex);
                    var _threadTargetPos = _self.getMsgObjIndexPositionByItemId(_replyedItemId);
                    if(_firstFindPos == -1 || _threadTargetPos < _firstFindPos) {
                        _firstFindPos = _threadTargetPos;
                    }
                }
            }
            var _beforeElem = null;
            if (_firstFindPos > 0) {
                _beforeElem = _columnContentElem.children('div').eq(_firstFindPos - 1);
            }
            var _repliedThreadElem = new Array();
            var _repliedThreadItemIdCount = _threadTargetMsgObjIndexList.getCount();
            for (var _j = 0; _j < _repliedThreadItemIdCount; _j++) {
                _repliedThreadElem[_j] = new Array();
                var _threadTargetMsgObjIndex = _threadTargetMsgObjIndexList.get(_j);
                var _threadTargetMsgObjIndexChildren = _threadTargetMsgObjIndex.getChildren();
                var _threadTargetMsgObjIndexChildrenCount = _threadTargetMsgObjIndex.getChildrenCount();
                _repliedThreadElem[_j][0] = _threadTargetMsgObjIndex.getMsgObj().getMessage().getItemId();
                for(var _k = 0; _k < _threadTargetMsgObjIndexChildrenCount; _k++) {
                    var _msgObjIndexChild = _threadTargetMsgObjIndexChildren.get(_k);
                    _repliedThreadElem[_j][_k+1] = _msgObjIndexChild.getMsgObj().getMessage().getItemId();
                }
            }
            var _replyItemIdList = new Array();
            var _sortedPosition = new Array();
            for (var _j = 0; _j < _repliedThreadItemIdCount; _j++) {
                _sortedPosition[_j] = -1;
            }
            var _sortedCount = 0;
            while (true) {
                var _startIndex = -1;
                for (var _j = 0; _j < _repliedThreadItemIdCount; _j++) {
                    if (_sortedPosition[_j] + 1 < _repliedThreadElem[_j].length) {
                        _startIndex = _j;
                        break;
                    }
                }
                if (_startIndex == -1) {
                    break;
                }
                var _tempLatestIndex = _startIndex;
                var _tempItemId = _repliedThreadElem[_startIndex][_sortedPosition[_startIndex] + 1];
                var _tempMessage = CubeeController.getInstance().getMessage(_tempItemId);
                var _tempDate = new Date(_tempMessage.getDate());
                for (var _j = _startIndex + 1; _j < _repliedThreadItemIdCount; _j++) {
                    if (_sortedPosition[_j] + 1 >= _repliedThreadElem[_j].length) {
                        continue;
                    }
                    var _tempComparedItemId = _repliedThreadElem[_j][_sortedPosition[_j] + 1];
                    var _tempComparedMessage = CubeeController.getInstance().getMessage(_tempComparedItemId);
                    if (_tempDate.isAfter(_tempComparedMessage.getDate())) {
                        _tempLatestIndex = _j;
                        _tempDate = new Date(_tempComparedMessage.getDate());
                    }
                }
                _sortedPosition[_tempLatestIndex]++;
                _replyItemIdList[_sortedCount] = _repliedThreadElem[_tempLatestIndex][_sortedPosition[_tempLatestIndex]];
                _sortedCount++;
            }
            if (_firstFindPos >= 0) {
                _isDisply = true;
                var _insertedElm = null;
                if (_beforeElem != null) {
                    _beforeElem.after(_insertHtml);
                    _msgElement = _self._getMessageElement(_firstFindPos);
                    _self._setMessageObject(msgObj, _msgElement, _firstFindPos);
                    _insertedElm = _beforeElem.next();
                } else {
                    _columnContentElem.prepend(_insertHtml);
                    _msgElement = _self._getMessageElement(0);
                    _self._setMessageObject(msgObj, _msgElement, 0);
                    _insertedElm = _columnContentElem.children('div').eq(0);
                }
                _self._setToolTipToMessageElem(_insertedElm.children().not('.' + ColumnView.TOGGLE_REPLY_CLS_NAME).eq(0), msg, msgObj);
                var _repliedThreadItemIdCount = _threadTargetMsgObjIndexList.getCount();
                for(var _j = 0; _j < _repliedThreadItemIdCount; _j++) {
                    var _threadTargetMsgObj = _threadTargetMsgObjIndexList.get(_j).getMsgObj();
                    var _htmlElem = _threadTargetMsgObj.getHtmlElement();
                    _htmlElem.remove();
                    var _delPosItemId = _threadTargetMsgObj.getMessage().getItemId();
                    var _pos = _self.getMsgObjIndexPositionByItemId(_delPosItemId);
                    _self.removeFromHash(_delPosItemId);
                    var _indexList = _self._getMsgObjIndexList();
                    _indexList.remove(_pos);
                }

                _self._addReplyMessageToColumn(_insertedElm, _itemId, _replyItemIdList);
                var _lastIdx = _insertedElm.children().not('.' + ColumnView.TOGGLE_REPLY_CLS_NAME).length - 1;
                var _lastHiddenIdx = _lastIdx - ColumnView.RECENT_REPLY_SHOW_COUNT;
                for (var _j = 1; _j <= _lastHiddenIdx; _j++) {
                    var _replyChildrenElem = _insertedElm.children().not('.' + ColumnView.TOGGLE_REPLY_CLS_NAME).eq(_j);
                    _replyChildrenElem.hide();
                    var currentClsVal = _replyChildrenElem.attr('class');
                    _replyChildrenElem.attr('class', currentClsVal + ' ' + ColumnView.HIDDEN_REPLY_CLS_NAME);
                    if (_j == _lastHiddenIdx) {
                        var allReplyCount = _insertedElm.children('div.thread-message').length;
                        var toggleString = Utils.stringFormat(Resource.getMessage('show_past_reply_txt'), allReplyCount);
                        var _threadRootElement = _insertedElm.children().not('.' + ColumnView.TOGGLE_REPLY_CLS_NAME).eq(0);
                        var strToggleHtml = _self.strToggleReplyLinkHtml(toggleString, _threadRootElement);
                        _insertedElm.children('.' + ColumnView.TOGGLE_REPLY_CLS_NAME).remove();
                        _insertedElm.children().not('.' + ColumnView.TOGGLE_REPLY_CLS_NAME).eq(0).after(strToggleHtml);
                    }
                }
            }
        }

        addMessageRoomTitleHeader(_self, msg, _insertHtml);

        if (_isDisply == false) {
            _columnContentElem.append(_insertHtml);

            var _msgElement = _self._getMessageElement(-1);
            _self._setMessageObject(msgObj, _msgElement, -1);
            _self._setToolTipToMessageElem(_msgElement.children().not('.' + ColumnView.TOGGLE_REPLY_CLS_NAME).eq(0), msg, msgObj);
        }
        var _linkElm = _msgElement.children();
        new MessageColumnLink($(_linkElm), msg);
        msgObj.onAddMessageReferCount();

        if(msg.getBodyType() == 1){
            ViewUtils.showStampMessage(_linkElm, _self);
        }
        _self.afterCreateMessageHtml(_linkElm);
    };
    _proto._addReplyMessageToColumn = function(insertedElm, itemIdOfInsertedElm, replyMessageItemIdList) {
        var _self = this;
        var _length = replyMessageItemIdList.length;
        for (var _i = 0; _i < _length; _i++) {
            var _childElemMessage = CubeeController.getInstance().getMessage(replyMessageItemIdList[_i]);
            var _msgObj = _self.createMessageObjectOnly(_childElemMessage);
            var _insertHtml = _self.getColumnMessageHtml(_msgObj, true);
            insertedElm.append(_insertHtml);
            var _msgElement = insertedElm.children().eq(-1);
            _msgObj.setHtmlElement(_msgElement);
            var _msgObjIndex = new MessageObjectIndex(_msgObj);
            _self.addMsgObjIndexChild(itemIdOfInsertedElm, _msgObjIndex);
            var _toolTipBaseElement = insertedElm.children().not('.' + ColumnView.TOGGLE_REPLY_CLS_NAME).eq(-1).children('div').eq(1);
            _self._setToolTipToMessageElem(_toolTipBaseElement, _childElemMessage, _msgObj);

            if(_childElemMessage.getBodyType() == 1){
                ViewUtils.showStampMessage(_msgElement, _self);
            }
            _self.afterCreateMessageHtml(_msgElement);
        }
    };

    _proto.afterCreateMessageHtml = (_msgElement) => {
    };

    _proto.deleteMessageBase = function(itemId, deleteFlag, adminDeleted) {
        var _deleteFlag = deleteFlag ? deleteFlag : 1;
        var _self = this;
        var _ret = false;
        var _messageViewObj = _self.getMsgObjByItemId(itemId);
        var _replaceStr = '';
        if(_messageViewObj != null){

            switch(_deleteFlag){
                case 1: 
                    _messageViewObj.getHtmlElement().remove();
                    _ret = _self.removeMsgObjIndexByItemId(itemId);
                    break;
                case 2: 
                    var _messageElement = $(".box-border[itemid=" + itemId +"]");
                    for(var i=0; i < _messageElement.size(); i++){
                        var _messageUpdateDeleteFlag = _messageViewObj.getMessage();
                        let deleted_body_by_admin;
                        let deleted_body;
                        if(_messageUpdateDeleteFlag.getType() == Message.TYPE_QUESTIONNAIRE){
                            deleted_body_by_admin = Resource.getMessage('deleted_questionnaire_body_by_admin');
                            deleted_body          = Resource.getMessage('deleted_questionnaire_body');
                        }else{
                            deleted_body_by_admin = Resource.getMessage('deleted_message_body_by_admin');
                            deleted_body          = Resource.getMessage('deleted_message_body');
                        }
                        if (adminDeleted) {
                            _replaceStr = "<pre>" + deleted_body_by_admin + "</pre>";
                        } else {
                            _replaceStr = "<pre>" + deleted_body + "</pre>";
                        }
                        _messageElement.eq(i).find(".message-body").html(_replaceStr); 
                        _messageElement.eq(i).find(".thumbnail-area").remove(); 
                        _messageElement.eq(i).find(".frm-read-more").remove(); 
                        _messageUpdateDeleteFlag.setDeleteFlag(_deleteFlag);
                        _self._setToolTipToMessageElem(_messageElement.eq(i), _messageUpdateDeleteFlag, _messageViewObj);
                        if(_messageUpdateDeleteFlag.getType() == Message.TYPE_QUESTIONNAIRE){
                            _messageElement.eq(i).find(".showActionTooltip").remove();
                        }
                    }
            }
        }
        return _ret;
    };
    _proto.deleteMessage = _proto.deleteMessageBase;
    _proto._getNotAvailableMessageHtmlIfMessageNothing = function(count) {
    };
    _proto._setToolTipToMessageElem = function(messageElement, message, messageObject) {
        var _self = this;
        var _actionToolTipType = _self.getActionToolTipType(message);
        var _bottomToolTipType = _self.getBottomToolTipType(message);

        var _bottomToolTipOwner = messageElement.children('div.message-info').eq(0);
        var _avatarToolTipOwner = messageElement.find('div.block-avatar').eq(0);
        if (_actionToolTipType != TooltipView.TYPE_UNKNOWN) {
            var _actionToolTipOwner = null;
            messageElement = _self._appendShowActionToolTipElement(messageElement, message);
            var _showToolTipElem = messageElement.find('.showActionTooltip').eq(0);
            if (ViewUtils.isIE89() || message.getType() == Message.TYPE_TASK) {
                if (messageElement.find(".inbox-message-header").length > 0) {
                    _actionToolTipOwner = messageElement.find('div.inbox-message-header').eq(0);
                }
                else if (messageElement.find(".task-message-header").length > 0) {
                    _actionToolTipOwner = messageElement.find('div.task-message-header').eq(0);
                }
                else {
                    _actionToolTipOwner = messageElement.children('div.message-header').eq(0);
                }
            }
            else {
                _actionToolTipOwner = messageElement.find('td.actionToolTipBase').eq(0);
            }
            var _isShowConversation = true;
            if(_self.getType() == ColumnInformation.TYPE_COLUMN_SHOW_CONVERSATION) {
                _isShowConversation = false;
            }
            TooltipView.getInstance().setActionToolTip(_actionToolTipType, _actionToolTipOwner, _showToolTipElem, _isShowConversation);
        }
        messageObject.setMessageInnerActionToolTip();
        if (_bottomToolTipType != TooltipView.TYPE_UNKNOWN) {
            TooltipView.getInstance().setActionToolTip(_bottomToolTipType, _bottomToolTipOwner);
        }
        TooltipView.getInstance().setAvatarToolTip(TooltipView.TYPE_USER_AVATAR, _avatarToolTipOwner, true);
        var quote = messageObject.getMessage().getQuotationItem();
        if (quote && quote.getFrom()) {
            TooltipView.getInstance().setAvatarToolTip(TooltipView.TYPE_USER_AVATAR, messageObject.getHtmlElement().find(".quote_in_message div.block-avatar"), true);
        }
        messageElement.find('[data-toggle="tooltip"]').tooltip({
          trigger: 'hover'
        });

        if ( (message.getFrom() != LoginUser.getInstance().getJid() ||
            message.getDeleteFlag() != 0) &&
            (_self.getActionToolTipType(message) != TooltipView.TYPE_TASK &&
            _self.getActionToolTipType(message) != TooltipView.TYPE_PARENT_TASK &&
            _self.getActionToolTipType(message) != TooltipView.TYPE_PARENT_TASK_CANCEL) ) {
            messageElement.find('a.action-delete-message').remove();
        }
        if ((message.getFrom() != LoginUser.getInstance().getJid()) ||
            message.getThreadRootId() == '') {
            messageElement.find('a.action-update-thread-title').remove();
        }
        if (message.getFrom() != LoginUser.getInstance().getJid() ||
            message.getDeleteFlag() != 0) {
            messageElement.find('a.action-update-message').remove();
        }

        if (message.getDeleteFlag() != 0) {
            messageElement.find('a.action-quote-message').remove();
        }

        if (!checkHeader(_self)) {
            messageElement.find('a.action-move-message-room').remove();
        }
        if ((message.getFrom() != LoginUser.getInstance().getJid()) ||
            message.getThreadRootId() != message.getItemId() ||
            !CodiMdViewUtils.judgeNoteEnable()) {
            messageElement.find('a.action-assign-note').remove();
        }
        let count = 0;
        messageElement.find('td.actionToolBarBase ul > li > a').each((i,e)=>{
            count++;
        });
        if(count == 0){
            messageElement.find('td.actionToolBarBase .msg_menu_btn').hide();
        }else{
            messageElement.find('td.actionToolBarBase .msg_menu_btn').show();
        }
    };

    function checkHeader(_self){
        if (_self.getType() == ColumnInformation.TYPE_COLUMN_SEARCH ||
            _self.getType() == ColumnInformation.TYPE_COLUMN_RECENT ||
            _self.getType() == ColumnInformation.TYPE_COLUMN_TOME) {
            return true;
        }

        if (_self.getType() != ColumnInformation.TYPE_COLUMN_CUSTOM_FILTER) {
            return false;
        }
        var _sourceColumnType = _self.getColumnInfo().getSourceColumnType();
        // '_begginingColumnType' may be a typo for variable _beginningColumnType.
        //  _beginningColumnType. を修正
        var _beginningColumnType = null;
        if (_sourceColumnType == ColumnInformation.TYPE_COLUMN_FILTER) {
            _beginningColumnType = _self.getColumnInfo().getBeginningColumnType();
        }
        return (_sourceColumnType == ColumnInformation.TYPE_COLUMN_SEARCH || _sourceColumnType == ColumnInformation.TYPE_COLUMN_RECENT || _sourceColumnType == ColumnInformation.TYPE_COLUMN_TOME || _beginningColumnType == ColumnInformation.TYPE_COLUMN_TOME)
    }

    _proto._appendShowActionToolTipElement = function(messageElement, message){
        var _hasToolTipElem = messageElement.find('.showActionTooltip').length;
        var _self = this;
        if(_hasToolTipElem == 0){
            var _showActionToolTipHtml = '<div class="showActionTooltip" >';
            _showActionToolTipHtml += '  <div class="actionToolBar box-border">';
            _showActionToolTipHtml += '    <div class="popup_menu msg_menu">';
            _showActionToolTipHtml += '      <a class="msg_btn msg_menu_btn popup_btn ico_btn">';
            _showActionToolTipHtml += '        <i class="fa fa-ellipsis-v"></i>';
            _showActionToolTipHtml += '      </a>';
            _showActionToolTipHtml += '</div></div></div>';

            function isInbox(){
                return messageElement.find(".inbox-message-header").length > 0 ? true : false;
            }
            function isTask(){
                return messageElement.find(".task-message-header").length > 0 ? true : false;
            }
            function isQuestionnair(){
                if(message.getDeleteFlag() == 2 ||
                   LoginUser.getInstance().getJid() != message.getFrom()){
                    return false;
                }
                if(messageElement.hasClass("questionnaire-message-header")){
                    return true;
                }else{
                    return messageElement.parent().find(".questionnaire-message-header").length > 0 ? true : false;
                }
            }
            if(ViewUtils.isIE89()){
                if(isInbox()){
                    _showActionToolTipHtml = _showActionToolTipHtml.replace('class="showActionTooltip"', 'class="showActionTooltip tooltipMenuPosIe89"');
                    messageElement.find('div.message-header').eq(0).append(_showActionToolTipHtml);
                }else{
                    var _ie89Html = '<td class="actionToolTipArea">' + _showActionToolTipHtml + '</td>';
                    messageElement.find('div.message-header td:last').eq(0).after(_ie89Html);
                }
            }else{
                if (isInbox()) {
                    messageElement.find('div.inbox-message-header').eq(0).append(_showActionToolTipHtml);
                }
                else if (isTask()) {
                    messageElement.find('div.task-message-header').eq(0).append(_showActionToolTipHtml);
                }
                else if (isQuestionnair()) {
                    if(messageElement.hasClass("questionnaire-message-header")){
                        messageElement.append(_showActionToolTipHtml);
                    }else{
                        messageElement.find('div.questionnaire-message-header').eq(0).append(_showActionToolTipHtml);
                    }
                }
                else {
                    switch(_self._type) {
                        case ColumnInformation.TYPE_COLUMN_TIMELINE :
                        case ColumnInformation.TYPE_COLUMN_COMMUNITY_FEED :
                        case ColumnInformation.TYPE_COLUMN_GROUP_CHAT :
                            if (_self._SendMessageRight == false) {
                                addToolTipElement('#toolbarMessageActionNotSend',message.getBodyType());
                            }else {
                                addToolTipElement('#toolbarMessageAction',message.getBodyType());
                            }
                            break;
                        default:
                            switch(message.getType()) {
                              case Message.TYPE_PUBLIC :
                                  if(!AuthorityInfo.getInstance().checkRights('sendMessageToFeed')){
                                        addToolTipElement('#toolbarMessageActionNotSend',message.getBodyType());
                                        break;
                                  }
                                  addToolTipElement('#toolbarMessageAction',message.getBodyType());
                                  break;
                              case Message.TYPE_GROUP_CHAT :
                                  if(AuthorityInfo.getInstance().checkRights('viewMessageInGroupchat', message.getTo())){
                                        addToolTipElement('#toolbarMessageActionNotSend',message.getBodyType());
                                        break;
                                  }
                                  addToolTipElement('#toolbarMessageAction',message.getBodyType());
                                  break;
                              case Message.TYPE_COMMUNITY :
                                  if(AuthorityInfo.getInstance().checkRights('viewMessageInCommunity', message.getTo())){
                                        addToolTipElement('#toolbarMessageActionNotSend',message.getBodyType());
                                        break;
                                  }
                                  addToolTipElement('#toolbarMessageAction',message.getBodyType());
                                  break;
                              default:
                                  addToolTipElement('#toolbarMessageAction',message.getBodyType());
                                  break;
                            }
                    }
                }
            }
        }

        function addToolTipElement(toolBarId, bodyType){
            let $menuhtml = $(toolBarId).clone(false);
            if(bodyType && typeof  bodyType == 'number' &&  bodyType == 1){
                $menuhtml.find("li > a.action-update-message").parent().remove();
                $menuhtml.find("li > a.action-quote-message").parent().remove();
                $menuhtml.find("li > a.action-add-inbox-task").parent().remove();
                $menuhtml.find("li > a.action-add-new-task").parent().remove();
            }
            var _showActionToolBarHtml = '<div class="actionToolBar box-border">' + $menuhtml.html() + '</div>';
            messageElement.find('td.actionToolBarBase').eq(0).append(_showActionToolBarHtml);
        }

        return messageElement;
    };

    _proto.onGoodJobReceive = function(itemId) {
        var _self = this;
        var _columnMessageView = _self.getMsgObjByItemId(itemId);
        if (_columnMessageView == null) {
            return;
        }
        _columnMessageView.onGoodJobReceive();
    };
    _proto.onEmotionPointReceive = function(itemId) {
        var _self = this;
        var _columnMessageView = _self.getMsgObjByItemId(itemId);
        if (_columnMessageView == null) {
            return;
        }
        _columnMessageView.onEmotionPointReceive();
    };
    _proto.onMessageOptionReceive = function(messageOptionNotification) {
        if (_validation({'object' : messageOptionNotification}) == false) {
            return;
        }
        if (messageOptionNotification.getType == null) {
            return;
        }
        var _type = messageOptionNotification.getType();
        if (_type != Notification_model.TYPE_MESSAGE_OPTION) {
            return;
        }
        var _self = this;
        var _itemId = messageOptionNotification.getItemId();
        var _columnMessageView = _self.getMsgObjByItemId(_itemId);
        if (_columnMessageView == null) {
            return;
        }
        _columnMessageView.onMessageOptionReceive(messageOptionNotification);
    };
    _proto.onThreadTitleUpdateReceived = function(updateMessages, notification) {
        var _self = this;
        var _htmlElement = _self.getHtmlElement();
        for (var i=0; i<updateMessages.length; i++) {
            var _titleElement = _htmlElement.find('[itemid='+updateMessages[i]+'] .message-title');
            if (!notification.getThreadTitle()) {
                _titleElement.remove();
            } else {
                let category = [];
                let threadTitle = notification.getThreadTitle();
                let _threadTitle = threadTitle;
                _threadTitle = ViewUtils.replaceTenantBaseTitleCategory(_threadTitle, threadTitle, category);
                _threadTitle = ViewUtils.replaceOrignalTitleCategory(_threadTitle,threadTitle, category);

                let categoryArray = category.sort((a,b)=>{
                    return a.index - b.index;
                });
                let categoryStr = '';
                for(let i=0;i<categoryArray.length;i++){
                    categoryStr += categoryArray[i].data;
                }
                if (_titleElement[0]) {
                    _titleElement.html('' + categoryStr+ '<span style="font-weight:700;">' + Utils.convertEscapedHtml(_threadTitle) + '</span>');
                } else {
                    var addHtml = '<pre class="message-title">' + categoryStr + '<span style="font-weight:700;">' +Utils.convertEscapedHtml(_threadTitle) + '</span></pre>';
                    _htmlElement.find('[itemid='+updateMessages[i]+'] .message-body').prepend(addHtml);

                }
            }
        }
    };
    _proto.onNoteAssignChangedReceived = function(updateMessages, notification) {
        var _self = this;
        var _htmlElement = _self.getHtmlElement();
        for (var i=0; i<updateMessages.length; i++) {
            if (notification.getType() == Notification_model.TYPE_ASSIGN_NOTE) {
                var _titleElement = _htmlElement.find('[itemid='+updateMessages[i]+'] .message-title');
                var threadRootId = notification.getThreadRootId();
                var oldThreadRootId = notification.getOldThreadRootId();
                if (threadRootId && !oldThreadRootId) {
                    var _noteTitle = Utils.convertEscapedHtml(notification.getNoteTitle());
                    var _noteUrl = notification.getNoteUrl();
                    var html = '\
                        <div class="message-body-note">\
                            <a href="' + _noteUrl + ' " target="_brank" title="' + _noteTitle + '">\
                                <i class="fa fa-pencil-square-o"></i>\
                                ' + _noteTitle + '\
                            </a>\
                        </div>\
                    ';
                    if(_htmlElement.find('[itemid='+updateMessages[i]+'] .message-body .message-body-note').length){
                        _htmlElement.find('[itemid='+updateMessages[i]+'] .message-body .message-body-note').remove();
                    }
                    if (_htmlElement.find('[itemid='+updateMessages[i]+'] .message-body .message-title').length) {
                        _htmlElement.find('[itemid='+updateMessages[i]+'] .message-body .message-title').after(html);
                    } else {
                        _htmlElement.find('[itemid='+updateMessages[i]+'] .message-body').prepend(html);
                    }
                } else if (oldThreadRootId && !threadRootId) {
                    _htmlElement.find('[itemid='+updateMessages[i]+'] .message-body .message-body-note').remove();
                }
            } else if (notification.getType() == Notification_model.TYPE_DELETE_NOTE) {
                _htmlElement.find('[itemid='+updateMessages[i]+'] .message-body .message-body-note').remove();
            }
        }
    };
    _proto.onMessageUpdateReceived = function(notification) {
        var _self = this;
        var _itemId = notification.getMessage().getItemId();
        var targetMessageObj = _self.getMsgObjByItemId(_itemId);
        if (!targetMessageObj) {
            var _columnType = _self.getColumnInfo().getColumnType();
            if (_columnType == ColumnInformation.TYPE_COLUMN_SEARCH ||
                _columnType == ColumnInformation.TYPE_COLUMN_RECENT ||
                _columnType == ColumnInformation.TYPE_COLUMN_MURMUR ||
                _columnType == ColumnInformation.TYPE_COLUMN_TOME ||
                _columnType == ColumnInformation.TYPE_COLUMN_FILTER ||
                _columnType == ColumnInformation.TYPE_COLUMN_CUSTOM_FILTER) {
                    if (_self.showNewMatchUpdateMessage(notification.getMessage())) {
                        targetMessageObj = _self.getMsgObjByItemId(_itemId);
                    } else {
                        return;
                    };
            }
        }

        var targetElement = targetMessageObj.getHtmlElement();

        var insertElement = $(targetMessageObj.getMessageHeaderHtml()).find('.message-time');
        targetElement.find('div[itemid='+_itemId+'] .message-time').remove();
        targetElement.find('div[itemid='+_itemId+'] .sender-name').after(insertElement);

        insertElement = $(targetMessageObj.getMessageBodyHtml()).find('.message-body').children();
        targetElement.find('div[itemid='+_itemId+'] .message-body').children().remove();
        targetElement.find('div[itemid='+_itemId+'] .message-body').append(insertElement);

        if (_self.getType() == ColumnInformation.TYPE_COLUMN_SHOW_CONVERSATION) {
            targetElement.find('pre.message-title').remove();
        }

        var _messageThumbnailElement = targetElement.find('img.image-thumbnail');
        if (_messageThumbnailElement.length) {
            $(_messageThumbnailElement).each(function(index, element){
                var _element = $(element);
                if(!_element.attr('src')) {
                    var url = _element.attr('data-url');
                    CubeeController.getInstance().downloadThumbnailImage(url, _itemId, _element);
                }
            });
        }
        ViewUtils.showOpenGraphProtocolImage(targetElement);

        targetMessageObj.updateMessageReadStatus(false);
        targetMessageObj.setMessage(notification._message);

        if (notification.getMessage().getType() == Message.TYPE_PUBLIC) {
            var _readMoreElement = $(targetElement).find('div[itemid='+_itemId+'] a.read-more-link').eq(0);
            if (_readMoreElement.length) {
                _self.getMsgObjByItemId(_itemId)._setReadMoreEvent(_readMoreElement);
            }
            targetMessageObj._columnMessageExistingReaderInfoView._message = notification._message;
        }
        else {
            var _readMoreElement = $(targetElement).find('div[itemid='+_itemId+'] a.read-more-link').eq(0);
            if (_readMoreElement.length) {
                _self.getMsgObjByItemId(_itemId)._setReadMoreEvent(_readMoreElement);
            }
            if(targetMessageObj._columnMessageExistingReaderInfoView){
                targetMessageObj._columnMessageExistingReaderInfoView._message = notification._message;
            }
            targetElement.find('div[itemid='+_itemId+'] .frm-existing-reader').remove();
            if (targetMessageObj._columnMessageExistingReaderInfoView) {
                targetMessageObj._columnMessageExistingReaderInfoView.cleanup();
                targetMessageObj._columnMessageExistingReaderInfoView = null;
            }
        }
        let hashtagElement = $(targetElement).find('div[itemid='+_itemId+'] a.hashtag');
        _self.getMsgObjByItemId(_itemId)._setHashtagEvent(hashtagElement);
        _self.afterCreateMessageHtml(targetElement);
    };
    _proto.updateColumnTitle = function(color) {
        var _self = this;
        var _columnInfo = _self._info;
        var _columnDisplayName = _columnInfo.getDisplayName();
        var _htmlElement = _self.getHtmlElement();
        if(_htmlElement == null) {
            return;
        }
        var _titleElement = _htmlElement.children('div').children('div.column-header').eq(0).children('div.column-header-title').eq(0);
        _titleElement.attr('title', _columnDisplayName);
        _titleElement.text(_columnDisplayName);
        ColumnManager.getInstance().updateColumnIconTitle(_self);
        _self._setColumnTitleToolTip();
        if (color) {
          _titleElement.css({'border-bottom-color': color});
        }
        ColumnManager.getInstance().updateColumnIcon(_self);
    };
    _proto.createDivMessageBorder = function(_content) {
        return $('<div class="message-border"></div>').append(_content);
    };
    _proto._createDisplayName = function() {
        var _ret = '';
        return _ret;
    };
    _proto.checkDemandTask = function() {
        return false;
    };

    _proto.onAddMember = function(addedMemberList) {
    };
    _proto._insertMessage = function(message, position) {
        var _self = this;
        if (message == null) {
            return;
        }
        if(position == null || typeof position != 'number') {
            return;
        }
        var _indexList = _self._getMsgObjIndexList();
        var _indexListCount = _indexList.getCount();
        if(position < 0 || position >= _indexListCount) {
            position = -1;
        }
        var _targetColumnElem = _self.getHtmlElement();
        if(_targetColumnElem == null) {
            return;
        }
        var _columnContentElem = _self.getColumnContent();

        var msgObj = _self.createMessageObjectOnly(message);
        var _content = _self.getColumnMessageHtml(msgObj, false);
        if (_content == "") {
            return;
        }
        _content = _self.createDivMessageBorder(_content);
        _self._setMessageObject(msgObj, _content, position);
        if(position < 0) {
            _columnContentElem.append(_content);
        } else {
            _columnContentElem.children('*').eq(position).before(_content);
        }

        var _linkElm = _content.children();
        new MessageColumnLink($(_linkElm), message);
        var _toolTipBaseElement = _content.children().not('.' + ColumnView.TOGGLE_REPLY_CLS_NAME).eq(0);
        _self._setToolTipToMessageElem(_toolTipBaseElement, message, msgObj);
    };
    _proto._startPergeMessageIntarval = function() {
        var _self = this;
        if(!Conf.getVal('PURGE_MESSAGE_FLAG')){
            return;
        }
        _self._pergeMessageTimerId = setInterval(function() {
            _self._pergeMessage();
        }, Conf.getVal('PURGE_MESSAGE_INTARVAL'));
    };
    _proto._endPergeMessageIntarval = function() {
        var _self = this;
        if(_self._pergeMessageTimerId){
            clearInterval(_self._pergeMessageTimerId);
            _self._pergeMessageTimerId = null;
        }
    };
    _proto._pergeMessage = function() {
        var _self = this;
        var _indexList = _self._getMsgObjIndexList();
        if(_indexList == null){
            return;
        }
        var _index = _indexList.getCount() - 1;
        if(_index < Conf.getVal('PURGE_DEFAULT_BASE_THREAD_POS')){
            return;
        }
        var _htmlElem = _self.getHtmlElement();
        if(_htmlElem == null) {
            return;
        }
        var _contentElement = _self.getColumnContent();

        var _contentElementHeight = _contentElement.height();
        var _deley = 10;
        _self._disableBottomEvent = true;
        function _asyncPergeMessage(){
            if(_index < Conf.getVal('PURGE_DEFAULT_BASE_THREAD_POS')){
                _endPerge();
                return;
            }
            var _messageIndexObj = _indexList.get(_index);
            if(_messageIndexObj == null){
                _index--;
                setTimeout(_asyncPergeMessage, _deley);
                return;
            }
            var _messageViewObj =_messageIndexObj.getMsgObj();
            if(_messageViewObj != null){
                var _messageElm = _messageViewObj.getHtmlElement();
                var _messagePos = _messageElm.position();
                var _messagePosTop = _messagePos.top - _contentElement.offset().top;
                if(_messagePosTop <= _contentElementHeight){
                    _endPerge();
                    return;
                }
                var _childrenCount = _messageIndexObj.getChildrenCount();
                var _childrenLastIndex = _childrenCount - 1;
                for(var _i = _childrenLastIndex; _i >= 0; _i--){
                    var _childrenMessageViewObj = _indexList.get(_index).getChildren();
                    var _childMessageViewObj = _childrenMessageViewObj.get(_i).getMsgObj();
                    var _childItemId = _childMessageViewObj.getItemId();
                    _self.removeMsgObjIndexByItemId(_childItemId);
                }
                _messageElm.remove();
                var _itemId = _messageViewObj.getItemId();
                _self.removeMsgObjIndexByItemId(_itemId);
            };
            _index--;
            setTimeout(_asyncPergeMessage, _deley);
        };
        setTimeout(_asyncPergeMessage, _deley);

        function _endPerge(){
            var _curMessageObjIndexList = _self._getMsgObjIndexList();
            var _lastIdx = _curMessageObjIndexList.getCount() - 1;
            var _lastMessageViewList = _curMessageObjIndexList.get(_lastIdx);
            var _lastMessageViewObj = _lastMessageViewList.getMsgObj();
            var _lastMessage = _lastMessageViewObj.getMessage();
            var _id = _lastMessage.getId();
            var _lastThreadChildrenCount = _lastMessageViewList.getChildrenCount();
            if(_lastThreadChildrenCount > 0){
                var _lastThreadMessageIndex = _lastThreadChildrenCount - 1;
                var _lastThreadChildren = _lastMessageViewList.getChildren();
                var _childMessageViewObj = _lastThreadChildren.get(_lastThreadMessageIndex).getMsgObj();
                var _lastChildMessage = _childMessageViewObj.getMessage();
                _id = _lastChildMessage.getId();
            }
            _self._currentLoadedItemId = _id;
            setTimeout(function(){
                _self._disableBottomEvent = false;
                _self._allMessageReceived = false;
            }, _deley);
        }
    };
    _proto._validation = function(args){
        return _validation(args);
    };
    function _validation(args) {
        for (var p in args) {
            if (p == 'string') {
                if (args[p] == null || typeof args[p] != 'string') {return false;}
            } else if (p == 'object' || p == 'message' || p == 'element') {
                if (args[p] == null || typeof args[p] != 'object') {return false;}
            } else if (p == 'position') {
                if (args[p] == null || typeof args[p] != 'number') {return false;}
            } else if (p == 'positionFrom' || p == 'positionTo') {
                if (args[p] == null || typeof args[p] != 'number' || args[p] < 0) {return false;}
            } else if (p == 'function') {
                if (args[p] == null || typeof args[p] != 'function') {return false;}
            }
        }
        return true;
    }

    _proto._hasClass = function(args){
        return _hasClass(args);
    };
    function _hasClass(_parentOfElm) {
        var _ret = false;
        if (_parentOfElm.hasClass(ColumnView.CLASS_SEL_TIMELINE)
            || _parentOfElm.hasClass(ColumnView.CLASS_SEL_MENTION)
            || _parentOfElm.hasClass(ColumnView.CLASS_SEL_QUESTIONNAIRE)
            || _parentOfElm.hasClass(ColumnView.CLASS_SEL_CHAT)
            || _parentOfElm.hasClass(ColumnView.CLASS_SEL_TASK)
            || _parentOfElm.hasClass(ColumnView.CLASS_SEL_INBOX)
            || _parentOfElm.hasClass(ColumnView.CLASS_SEL_SEARCH)
            || _parentOfElm.hasClass(ColumnView.CLASS_SEL_GROUP_CHAT)
            || _parentOfElm.hasClass(ColumnView.CLASS_SEL_MAIL)
            || _parentOfElm.hasClass(ColumnView.CLASS_SEL_COMMUNITY_FEED)
            || _parentOfElm.hasClass(ColumnView.CLASS_SEL_COMMUNITY_TASK)
            || _parentOfElm.hasClass(ColumnView.CLASS_SEL_RECENT)
            || _parentOfElm.hasClass(ColumnView.CLASS_SEL_TOME)
            || _parentOfElm.hasClass(ColumnView.CLASS_SEL_MURMUR)) {
            _ret = true;
        }
        return _ret;
    }

    _proto.removeMsgObjIndexByItemIdNoCleanupMessage = function(itemId) {
        var _self = this;
        if (_self._validation({'string' : itemId}) == false) {
            return false;
        }
        var _self = this;
        var _indexList = _self._getMsgObjIndexList();
        var _count = _indexList.getCount();
        _self.removeFromHash(itemId);
        for (var _i = 0; _i < _count; _i++) {
            var _curIndex = _indexList.get(_i);
            var _curMsgObj = _curIndex.getMsgObj();
            var _curMsg = _curMsgObj.getMessage();
            if (_curMsg.getItemId() == itemId) {
                return _indexList.remove(_i);
            }
            var _curIndexChildren = _curIndex.getChildren();
            var _indexCount = _curIndex.getChildrenCount();
            for (var _j = 0; _j < _indexCount; _j++) {
                var _curIndexChild = _curIndexChildren.get(_j);
                var _curMsgObj = _curIndexChild.getMsgObj();
                var _curMsg = _curMsgObj.getMessage();
                if (_curMsg.getItemId() == itemId) {
                    return _curIndexChildren.remove(_j);
                }
            }
        }
        return false;
    };
    _proto.updateMessageReadStatus = function(itemId, readFlag) {
        var _self = this;
        var _messageView = _self.getMsgObjByItemId(itemId);
        if(_messageView == null){
            return;
        }
        _messageView.updateMessageReadStatus(readFlag);
    };

    _proto.getColumnContent = function() {
        var _self = this;
        var content = _self.getHtmlElement().find('div.column-content').find('.mCSB_container');
        if (content.length > 0) {
          return content;
        } else {
          return _self.getHtmlElement().find('div.column-content');
        }
    };

    _proto.refreshScrollbar = function() {
      var _self = this;
        if(_self._htmlElement &&
           !_self._htmlElement.find('.scroll_content.ps').length) {
        var target = _self._htmlElement.find('.scroll_content');
        var ps = new PerfectScrollbar(target[0], {
          suppressScrollX: true
        });
        $(target).on('ps-scroll-y',() => {
          if ($('emoji-picker').hasClass('open')) {
            $('emoji-picker').removeClass('open');
          }
        });
        col_scr.push(ps);

        target.on('ps-y-reach-end', function(){
          if(_self._disableBottomEvent){
              return;
          }
          _self._showReadMore(true);
        })
      }
    };

    _proto.onUpdateQuestionnaireMessageReceive = function(message) {
        var _self = this;
        if(message === null || message.getType() !== Message.TYPE_QUESTIONNAIRE) {
            return;
        }

        var _itemId = message.getItemId();
        var _itemView = _self.getMsgObjByItemId(_itemId);
        if (!_itemView) {
            return;
        }

        _itemView.setMessage(message);

        var _content = _self.getColumnMessageHtml(_itemView, false);
        if (_content === "") {
            return;
        }
        var _htmlElement = _itemView.getHtmlElement();
        if (_htmlElement.length > 0) {
            _htmlElement.html(_content);
            _itemView.setHtmlElement(_htmlElement);
        }
        var _linkElm = _htmlElement.children();
        new MessageColumnLink($(_linkElm), message);

        var _toolTipBaseElement = _htmlElement.children().not('.' + ColumnView.TOGGLE_REPLY_CLS_NAME).eq(0);
        _self._setToolTipToMessageElem(_toolTipBaseElement, message, _itemView);
        return true;
    };

    const addMessageRoomTitleHeader = (self, msg, _insertedElement) => {
        const _self = self;
        const _columnInfo = _self.getColumnInfo();
        switch(_columnInfo.getColumnType()){
            case ColumnInformation.TYPE_COLUMN_MURMUR:
                if(_self.isSideMenu){
                    let _userName = msg.getProfileMap().getByKey(msg.getTo()).getNickName();
                    var result = Utils.avatarCreate({name: _userName, type: 'user'});
                    let r = String(parseInt(result.color.substring(1,3), 16));
                    let g = String(parseInt(result.color.substring(3,5), 16));
                    let b = String(parseInt(result.color.substring(5,7), 16));
                    let columnTitle = Resource.getMessage('Murmur');
                    const _columnName = msg.getColumnName();
                    if(typeof _columnName === 'string' &&
                       _columnName.length > 0){
                        columnTitle = _columnName;
                    }
                    _insertedElement.children('.murmur-message')
                                    .prepend(
                                        $('<div>')
                                            .addClass("side-murmur-thread-root-message")
                                            .css({
                                                "border-left-color": result.color,
                                                "background-color": "rgba("+r+","+g+","+b+",0.05)",
                                            })
                                            .attr("msgto", msg.getTo())
                                            .text(columnTitle)
                                    );
                }
                break;
        }
    };
})();
