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
function DialogQuoteMessageView(message, column, roomPrivacyType=0) {
    this._dialogAreaElement = $('#modal_area');
    this._dialogInnerElement = null;
    this._dialogMessagePage = null;
    this._dialogMessageToPage = null;
    this._message = message;
    this._column = column;
    this.displayMessage = "";
    this.displayRoomInfo = null;
    this._textarea = null;
    this._roomPrivacyType = roomPrivacyType;
    DialogOkCancelView.call(this);
};(function() {
    DialogQuoteMessageView.prototype = $.extend({}, DialogOkCancelView.prototype);
    var _super = DialogOkCancelView.prototype;
    var _proto = DialogQuoteMessageView.prototype;
    _proto._init = function () {
        var _self = this;
        _super._init.call(_self);
        _self._dialogAreaElement.html(_self.getMainHtmlElement());
        _self._dialogInnerElement = _self._dialogAreaElement.children();
        _self._dialogInnerElement.find('#quotemessage_modal').html(_self.getInnerMessageHtml());
        _self._dialogInnerElement.find('#quotemessage_modal_for_to').html(_self.getInnerToMessageHtml());
        _self._dialogMessagePage = _self._dialogInnerElement.find('#quotemessage_modal');
        _self._dialogMessageToPage = _self._dialogInnerElement.find('#quotemessage_modal_for_to');

        _self._dialogAreaElement.on('click', '#quote_next_btn', function(){
            _self.nextModal();
        })

        _self._dialogAreaElement.on('click', '#quote_before_btn', function(){
            _self.beforeModal();
        })

        _self._dialogAreaElement.on('click', '#quote_send_btn', function(){
            _self.sendQuoteMessageExecute();
        })

        _self._dialogAreaElement.on('click', ".modal_exit", function() {
             ViewUtils.modal_allexit();
             _self._dialogAreaElement.off();
        })

        _self._dialogAreaElement.on('change', 'input[name="destination_room"]:radio', function(){
            _self._dialogInnerElement.off();
            _self._dialogInnerElement.find('.scroll_content').off();
            $('#showList_for_quote').children().remove();
            _self.ps.update();
            showErrMessage(_self._dialogMessageToPage, '');
            switch ($(this).attr('id')) {
                case 'quote_project':
                    getAllProjectList(_self);
                    break;
                case 'quote_groupchat':
                    getAllGroupchatList(_self);
                    break;
                case 'quote_chat':
                    getAllChatList(_self);
                    break;
                default:
                    break;
            }
        });

        _self._createEventHandler();
    };

    _proto.getMainHtmlElement = function() {
        var _ret = '<div class="ui-dialog ui-widget ui-widget-content ui-corner-all ui-draggable" tabindex="-1" role="dialog" aria-labelledby="ui-dialog-title-tab-column-add">\
                      <div id="quote_modal" class="card modal_card modal_slider">\
                        <div class="modal_slide_wrapper cf">\
                          <div class="modal_slide quote_message_slide"  id="quotemessage_modal">\
                          </div>\
                          <div class="modal_slide password_slide" id="quotemessage_modal_for_to">\
                          </div>\
                        </div>\
                        <!-- ウィザード×ボタン -->\
                        <a class="modal_exit modal_exit_btn ico_btn ui-dialog-titlebar-close ui-corner-all" role="button"><i class="fa fa-times"></i></a>\
                      </div>\
                    </div>';
          return _ret;
    }

    function judgeMessageType(judgeElem) {
        if (judgeElem.match(/ico_user/)) {
            return Message.TYPE_CHAT;
        } else if (judgeElem.match(/ico_group/)) {
            return Message.TYPE_GROUP_CHAT;
        } else if (judgeElem.match(/ico_project/)) {
            return Message.TYPE_COMMUNITY;
        }
    }

    _proto.addDestinationRoom = function(destElem) {
        var _self = this;
        destElem = $(destElem);
        _self._dialogAreaElement.find('ul.quote_distination').children().remove();
        var roomClass = destElem.find('span.ico').attr('class');
        var _messageType = judgeMessageType(roomClass);
        switch(_messageType) {
            case Message.TYPE_CHAT:
                destElem.find('span.group').text(Resource.getMessage('Chat'));
                destElem.find('a').attr("data_value", destElem.attr("jid"));
                break;
            case Message.TYPE_GROUP_CHAT:
                var kindHtml = '<span class="group">' + Resource.getMessage('GroupChat') + '</span>';
                destElem.find("a").append($(kindHtml));
                destElem.find('a').attr("data_value", destElem.find('a').attr("roomid"));
                break;
            case Message.TYPE_COMMUNITY:
                destElem.find('span.detail').remove();
                var kindHtml = '<span class="group">' + Resource.getMessage('Community') + '</span>';
                destElem.find("a").append($(kindHtml));
                break;
            default:
                break;
        }
        destElem.find("a").attr("roomType", _messageType);
        destElem.attr("title", destElem.find('span.name').text()+" "+destElem.find('span.group').text());
        _self._dialogAreaElement.find('ul.quote_distination').append(destElem.prop('outerHTML'));
        _self.displayRoomInfo = destElem;
    }

    _proto._createEventHandler = function() {
        var _self = this;
        autosize(_self._dialogInnerElement.find('.message-input-area'));
        var _textareaElement = _self._dialogInnerElement.find('div.frm-message > textarea.message-input-area');
        _self._textarea = new ColumnTextAreaView(_textareaElement, _self, Resource.getMessage('default_placeholder'));
        ViewUtils.setCharCounter(_textareaElement, _self._dialogInnerElement.find('.char-counter-column'), ColumnView.TEXTAREA_MAX_LENGTH);

        var fileName = ViewUtils.getAttachmentFileName(_self._message.getMessage());
        if (fileName) {
            _self._dialogInnerElement.find('p.file-name').text(fileName);
            _self._dialogInnerElement.find('p.file-name').attr('title', fileName);
        }

        var _messageThumbnailElement = _self._dialogInnerElement.find('img.image-thumbnail');
        var _imageMaxWidth = ColumnManager.getInstance().getImageMaxWidth();
        _messageThumbnailElement.each(function(index, el) {
            var _element = $(el);
            if(!_element.attr('src')) {
                var _itemId = _self._message.getItemId();
                var url = _element.attr('data-url');
                CubeeController.getInstance().downloadThumbnailImage(url, _itemId, _element);
            }
            _element.css('max-width', _imageMaxWidth);
        });

        ViewUtils.showOpenGraphProtocolImage(_self._dialogInnerElement);

        _self.quote_from_ps = new PerfectScrollbar(_self._dialogInnerElement.find('.scroll_content')[0], {
            suppressScrollX: true
        });

        getAllProjectList(_self);
        _self.ps = new PerfectScrollbar(_self._dialogInnerElement.find('#quotemessage_modal_for_to .scroll_content')[0], {
            suppressScrollX: true
        });
        dlg_scr.push(_self.ps);

        _self._dialogInnerElement.find('.title_search_btn').off('click');
        _self._dialogInnerElement.find('.title_search_btn').on('click', function(){
            _self.filterRoomList();
        });
        _self._dialogInnerElement.find('input.field').keypress(function(e) {
            if ((e.which && e.which === 13) || (e.keyCode && e.keyCode === 13)) {
                _self.filterRoomList();
            }
            return e.which !== 13;
        });

    }

    _proto.showDialog = function() {
        var _self = this;
        _self._onOpenDialog();
    }

    _proto._onOpenDialog = function() {
        var _self = this;
        $('#modal_area').css('display', 'block');
        $('#modal_area').prepend('<div class="overlay modal_exit"></div>');
        _self._dialogInnerElement.addClass('on').css('display', 'block').animate({ 'margin-top':0, 'opacity':1 }, 200 );
        _self._dialogInnerElement.find('#quote_modal').addClass('on').css('display', 'block').animate({ 'margin-top':0, 'opacity':1 }, 200 );
        $('.overlay').animate({ 'opacity':0.3}, 200 );
    }

    _proto.nextModal = function() {
        var _self = this;
        showErrMessage(_self._dialogMessagePage, '');
        if (!ViewUtils.isValidInputTextLength(_self._textarea.getText())) {
            showErrMessage(_self._dialogMessagePage, ColumnView.TEXTAREA_MAX_LENGTH + Resource.getMessage('dialog_update_message_number_error'));
            return;
        }
        _self._dialogAreaElement.find('.modal_slide_wrapper').css( 'transform', 'translateX(-480px)' );
    }

    _proto.filterRoomList = function(){
        var _self = this;
        $('#showList_for_quote').children().remove();
        showErrMessage(_self._dialogMessageToPage, '');

        switch (Number(_self._dialogInnerElement.find('input[type=radio]:checked').val())){
            case Message.TYPE_COMMUNITY:
                filterProject(_self);
                break;
            case Message.TYPE_Followee:
                filterFollowee(_self);
            case Message.TYPE_Follower:
                filterFollower(_self);
            case Message.TYPE_GROUP_CHAT:
                filterGroupchat(_self);
                break;
            case Message.TYPE_CHAT:
                filterChat(_self);
                break;
            default:
                break;
        }
    };

    function filterProject(_self) {
        var _inputKeyword = _self._dialogInnerElement.find('input.field').val();
        var _searchProjectList = new ArrayList();
        _self._allProjectList._array.filter(function(projectInfo){
            var projectName = projectInfo.getRoomName();
            if( 0 <= projectName.indexOf(_inputKeyword)) {
                _searchProjectList.add(projectInfo)
            }
        })
        if (!_searchProjectList.getCount()) {
            showErrMessage(_self._dialogMessageToPage, Resource.getMessage('dialog_search_room_nothing'));
            return;
        }
        _self._dialogAreaElement.find('#showList_for_quote').append(setProjectListFrame(_self,_searchProjectList));
        _self._dialogInnerElement.find('.scroll_content').scrollTop(0);
    };

    function filterFollowee(_self) {
        var _inputKeyword = _self._dialogInnerElement.find('input.field').val();
        var _searchFolloweeList = new ArrayList();
        _self._allFolloweeList._array.filter(function(followeeInfo){
            var followeeName = followInfo.getRoomName();
            if( 0 <= followeeName.indexOf(_inputKeyword)) {
                _searchFolloweeList.add(followeeInfo)
            }
        })
        if (!_searchFolloweeList.getCount()) {
            showErrMessage(_self._dialogMessageToPage, Resource.getMessage('dialog_search_followee_nothing'));
            return;
        }
        _self._dialogAreaElement.find('#showList_for_quote').append(setFolloweeListFrame(_self,_searchFolloweeList));
        _self._dialogInnerElement.find('.scroll_content').scrollTop(0);
    };

    function filterFollower(_self) {
        var _inputKeyword = _self._dialogInnerElement.find('input.field').val();
        var _searchFollowerList = new ArrayList();
        _self._allFollowerList._array.filter(function(followerInfo){
            var followerName = followeeInfo.getRoomName();
            if( 0 <= followerName.indexOf(_inputKeyword)) {
                _searchFollowerList.add(followerInfo)
            }
        })
        if (!_searchFollowerList.getCount()) {
            showErrMessage(_self._dialogMessageToPage, Resource.getMessage('dialog_search_follower_nothing'));
            return;
        }
        _self._dialogAreaElement.find('#showList_for_quote').append(setFollowerListFrame(_self,_searchFollowerList));
        _self._dialogInnerElement.find('.scroll_content').scrollTop(0);
    };

    function filterGroupchat(_self) {
        var _inputKeyword = _self._dialogInnerElement.find('input.field').val();
        var _searchGroupchatList = new ArrayList();
        _self._allGroupchatList._array.filter(function(groupchatInfo){
            var groupchatName = groupchatInfo.getRoomName();
            if( 0 <= groupchatName.indexOf(_inputKeyword)) {
                _searchGroupchatList.add(groupchatInfo)
            }
        })
        if (!_searchGroupchatList.getCount()) {
            showErrMessage(_self._dialogMessageToPage, Resource.getMessage('dialog_search_room_nothing'));
            return;
        }
        _self._dialogAreaElement.find('#showList_for_quote').append(setGroupchatListFrame(_self,_searchGroupchatList));
        _self._dialogInnerElement.find('.scroll_content').scrollTop(0);
    };

    function filterChat(_self) {
        var _inputKeyword = _self._dialogInnerElement.find('input.field').val();
        var _searchChatList = new ArrayList();
        _self._allChatList._array.filter(function(chatInfo){
            var chatName = chatInfo.getUserName();
            var accountName = chatInfo.getLoginAccount();
            var groupName = ViewUtils.getGroupName(chatInfo);
            if( 0 <= chatName.indexOf(_inputKeyword) ||
                0 <= accountName.indexOf(_inputKeyword) ||
                0 <= groupName.indexOf(_inputKeyword)) {
                _searchChatList.add(chatInfo)
            }
        })
        if (!_searchChatList.getCount()) {
            showErrMessage(_self._dialogMessageToPage, Resource.getMessage('dialog_search_room_nothing'));
            return;
        }
        _self._dialogAreaElement.find('#showList_for_quote').append(setChatListFrame(_self,_searchChatList));
        _self._dialogInnerElement.find('.scroll_content').scrollTop(0);
    };

    _proto.beforeModal = function() {
        var _self = this;
        _self._dialogAreaElement.find('.modal_slide_wrapper').css( 'transform', 'translateX(0px)' );
    }

    _proto.getInnerMessageHtml = function() {
        var _self = this;
        var createInputElement = "<div>";
        var _autoCompleteType = 'autocomplete';
        if (_self._message.getType() == Message.TYPE_COMMUNITY) {
            _autoCompleteType = 'autocomplete-for-community" groupId="'+_self._message.getTo()+'"';
        } else if(_self._message.getType() == Message.TYPE_GROUP_CHAT) {
            _autoCompleteType = 'autocomplete-for-chatroom" groupId="'+_self._message.getTo()+'"';
        }
        createInputElement += '<textarea class="ui-corner-all autoresize-textarea message-input-area ' + _autoCompleteType + ' placeholder="" style="min-height: 4em; max-height: 300px;"></textarea>';
        createInputElement += ColumnFileUploadPartsView.getHtml(1);
        createInputElement += ColumnTextAreaView.getCharCounterHtml(1, true);
        createInputElement += '</div>';
        var _ret = "";

        _ret = '    <div class="card_title">';
        _ret += '      <p>' + Resource.getMessage('dialog_label_quote_message') + '</p>';
        _ret += '    </div>';
        _ret += '    <div class="modal_content_wrapper">';
        _ret += '      <p class="modal_title">' + Resource.getMessage('dialog_comment_for_quote_message') + ':</p>';
        _ret += '      <div class="flex1 frm-message update_message">';
        _ret += $(createInputElement).find('.message-input-area').prop('outerHTML');
        _ret += $(createInputElement).find('.char-counter-column').prop('outerHTML');
        _ret += '      </div>';
        _ret += '      <p class="modal_title">' + Resource.getMessage('dialog_quote_message') + ':</p>';

        _ret += getQuoteMessageHtml(_self);

        _ret += '      <p class="modal_title">' + Resource.getMessage('dialog_quote_message_attention_anonymous') + '</p>';
        _ret += '    </div>';
        _ret += '    <div class="btn_wrapper">';
        _ret += '      <p id="dialog-error" class="ui-state-error-text dialog_error_footer"></p>';
        _ret += '      <button id="quote_next_btn" type="button" class="modal_btn ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only" role="button" aria-disabled="false"><span class="ui-button-text">' + Resource.getMessage('wizard_btn_next') + '</span></button>';
        _ret += '    </div>';
        return _ret;
    };

    function getQuoteMessageHtml(_self) {
        var ret = "";
        var _message = _self._message;
        var _quote = _message.getQuotationItem();
        if (_quote) {
            if (_quote.getFrom()) {
                ret = getMessageHtml(_self, _quote, true);
            } else {
                ret = getMessageHtml(_self, _quote, false);
            }
        } else {
            switch(_self._message.getType()){
                case Message.TYPE_PUBLIC:
                    ret = getMessageHtml(_self, _message, true);
                    break;
                case Message.TYPE_CHAT:
                    ret = getMessageHtml(_self, _message, false);
                    break;
                case Message.TYPE_GROUP_CHAT:
                    var _privacyType = 0;
                    if (_self._column.getType() == ColumnInformation.TYPE_COLUMN_GROUP_CHAT) {
                        _privacyType = _self._column.getColumnInfo().getChatRoomInfomation().getPrivacyType();
                    } else {
                        _privacyType = _self._roomPrivacyType;
                    }
                    if (_privacyType == 0) {
                        ret = getMessageHtml(_self, _message, true);
                    } else {
                        ret = getMessageHtml(_self, _message, false);
                    }
                    break;
                case Message.TYPE_COMMUNITY:
                    var _privacyType = 0;
                    if (_self._column.getType() == ColumnInformation.TYPE_COLUMN_COMMUNITY_FEED) {
                        _privacyType = _self._column.getColumnInfo().getCommunityInfomation().getPrivacyType();
                    } else {
                        _privacyType = _self._roomPrivacyType;
                    }
                    if (_privacyType == 0) {
                        ret = getMessageHtml(_self, _message, true);
                    } else {
                        ret = getMessageHtml(_self, _message, false);
                    }
                    break;
                case Message.TYPE_MURMUR:
                    ret = getMessageHtml(_self, _message, true);
                    break;
                default:
                    break;
            }
        }
        return ret;
    }

    function getMessageHtml(_self, _msg, _public) {
        var _quoteHeader = '';
        var _quoteBodyClass = "message-body-quote-anonymous";
        var _quoteBody = ViewUtils.urlAutoLink(_msg.getUIShortenUrls(), ViewUtils.removeAttachmentUrl(_msg.getMessage()), true, null, false, _msg.getItemId());
        var _messageView = _self._column.getMsgObjByItemId(_self._message.getItemId());
        if (_public) {
            _quoteBodyClass = "message-body-quote"
            _quoteHeader = _messageView.getMessageHeaderHtmlFromObj(_msg);
        }
        var _ret = '      <div class="quote_from scroll_content">\
                            '+_quoteHeader+'\
                            <div class='+_quoteBodyClass+'>\
                              '+_quoteBody+'\
                              '+_messageView.getMessageBodyThumbnailImageHtml(_msg)+'\
                            </div>\
                          </div>';
        return _ret;
    }

    _proto.getInnerToMessageHtml = function() {
        var _self = this;
        var _ret = "";
        _ret = '    <div class="card_title">';
        _ret += '      <p>' + Resource.getMessage('dialog_label_quote_message') + '</p>';
        _ret += '    </div>';
        _ret += '    <div class="modal_content_wrapper">';
        _ret += '      <p class="modal_title">' + Resource.getMessage('dialog_select_quote_room') + ':</p>';
        _ret += '<div class="select-quote-target">\
                  <label for="quote_project" class="radio">\
                  <input type="radio" name="destination_room" id="quote_project" value='+Message.TYPE_COMMUNITY+' checked="">\
                  <span></span>' + Resource.getMessage('Community') + '</label>\
                  <label for="quote_groupchat" class="radio">\
                  <input type="radio" name="destination_room" id="quote_groupchat" value='+Message.TYPE_GROUP_CHAT+'>\
                  <span></span>' + Resource.getMessage('GroupChat') + '</label>\
                  <label for="quote_chat" class="radio">\
                  <input type="radio" name="destination_room" id="quote_chat" value='+Message.TYPE_CHAT+'>\
                  <span></span>' + Resource.getMessage('Chat') + '</label>\
                </div>'
        _ret += '<div class="select_menu">\
                  <form action="#" method="get" class="search_form">\
                    <input type="text" name="q" class="field" placeholder="'+Resource.getMessage('dialog_search_room_name')+'">\
                    <button type="button" name="search" class="title_search_btn ico_btn"><i class="fa fa-search"></i></button>\
                  </form>\
                </div>';
        _ret += '<div class="list_wrapper scroll_content" id="quote_dest_list">';
        _ret += '  <ul class="modal_list" id="showList_for_quote">';
        _ret += '  </ul>';
        _ret += '</div>';

        _ret += '<p class="modal_title" id='+"quote_click_chat"+' style="\
                  margin-top: 15px;\
                  ">' + Resource.getMessage('dialog_selected_quote_room') + ': </p>';

        _ret += '<ul class="modal_list quote_distination">\
                </ul>';
        _ret += '    </div>';
        _ret += '    <div class="btn_wrapper">';
        _ret += '      <p id="dialog-error" class="ui-state-error-text dialog_error_footer"></p>';
        _ret += '      <button id="quote_before_btn" type="button" class="modal_btn ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only" role="button" aria-disabled="false"><span class="ui-button-text">' + Resource.getMessage('wizard_btn_before') + '</span></button>';
        _ret += '      <button id="quote_send_btn" type="button" class="modal_btn success_btn ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only" role="button" aria-disabled="false"><span class="ui-button-text">' + Resource.getMessage('column_btn_submit') + '</span></button>';
        _ret += '    </div>';
        return _ret;
    };

    function getAllGroupchatList(_self) {
        function onGetGroupInfoListHistoryCallback(_groupchatList) {
            _self._allGroupchatList = _groupchatList;
            _self._dialogAreaElement.find('#showList_for_quote').append(setGroupchatListFrame(_self,_groupchatList));
            _self._dialogInnerElement.on('click', '#showList_for_quote li', function(){
                _self.addDestinationRoom($(this).prop('outerHTML'));
            });
        }

        var _sortCondition = new ColumnSortCondition();
        _sortCondition.getItems().removeAll();
        _sortCondition.getItems().add("updated_at");
        _sortCondition.getOrders().removeAll();
        _sortCondition.getOrders().add(ColumnSortCondition.SORT_ORDER_DESC);
        var communityList = new ArrayList();
        communityList.add(new CommunityInfo());

        CubeeController.getInstance().getRoomInfoList(0, 1000, communityList, _sortCondition, onGetGroupInfoListHistoryCallback);
    }

    function setFollowListFrame(_self, _followList) {
        var followListCount= _chatList.getCount();

        if(followListCount == 0){
            showErrMessage(_self._dialogMessageToPage, Resource.getMessage('dialog_error_no_followlist'));
            return;
        }

        var _ret = "";
        for(var i = 0; i< followListCount; i++) {
            var _person = _followList.get(i);
            var _jid = _person.getJid();
            var groupName = ViewUtils.getGroupName(_person);
            var avatarHtml = '';
            if (ViewUtils.getAvatarUrl(_person) == ViewUtils.DEFAULT_USER_AVATAR_SRC) {
              avatarHtml = ViewUtils.getDefaultAvatarHtml(_person);
            } else {
              avatarHtml = ViewUtils.getAvatarDataHtmlFromPerson(_person)
            }

            _ret += '<li jid="' + _jid + '">';
            _ret += '  <a title="' + Utils.convertEscapedHtml(_person.getUserName()) + '  ' + Utils.convertEscapedHtml(groupName) + '">';
            _ret += '    <span class="ico ico_user status ' + ViewUtils.getPresenceColorCss(_person.getPresence()) + '">';
            _ret += avatarHtml;
            _ret += '    </span>';
            _ret += '    <span class="name">' + Utils.convertEscapedHtml(_person.getUserName()) + ViewUtils.getUserStatusString(_person.getStatus()) + '</span>';
            _ret += '    <span class="group">' + Utils.convertEscapedHtml(groupName) + '</span>';
            _ret += '</a></li>';
        }
        return _ret;
    }

    function setGroupchatListFrame(_self, _groupchatList) {
        var groupchatListCount= _groupchatList.getCount();

        if(groupchatListCount == 0){
            showErrMessage(_self._dialogMessageToPage, Resource.getMessage('dialog_error_no_groupchat'));
            return;
        }

        var _ret = "";
        for(var i = 0; i< groupchatListCount; i++) {
            var _roomInfo = _groupchatList.get(i);

            var roomName = Utils.convertEscapedHtml(_roomInfo.getRoomName())
            var avatarInfo = Utils.avatarCreate({type: 'group', name: _roomInfo.getRoomName()})

            _ret += '<li>'
            _ret += '<a title="'+roomName+'"roomid="' + _roomInfo.getRoomId() + '" class="text-overflow-ellipsis" title="' + roomName +'">';
            _ret += '  <span class="ico ico_group">'
            _ret += '    <div class="no_img" style="background-color:' + avatarInfo.color + '">';
            _ret += '      <div class="no_img_inner">' + avatarInfo.name + '</div>';
            _ret += '    </div></span>';
            _ret += '  <span class="name">' + roomName + '</span>';
            _ret += '</a></li>';
        }
        return _ret;
    }

    function getAllChatList(_self) {
        _self._allChatList = ContactList.getInstance();

        _self._dialogAreaElement.find('#showList_for_quote').append(setChatListFrame(_self, _self._allChatList));
        _self._dialogInnerElement.on('click', '#showList_for_quote li', function(){
            _self.addDestinationRoom($(this).prop('outerHTML'));
        });
    }

    function setChatListFrame(_self, _chatList) {
        var chatListCount= _chatList.getCount();

        if(chatListCount == 0){
            showErrMessage(_self._dialogMessageToPage, Resource.getMessage('dialog_error_no_chatlist'));
            return;
        }

        var _ret = "";
        for(var i = 0; i< chatListCount; i++) {
            var _person = _chatList.get(i);
            var _jid = _person.getJid();
            var groupName = ViewUtils.getGroupName(_person);
            var avatarHtml = '';
            if (ViewUtils.getAvatarUrl(_person) == ViewUtils.DEFAULT_USER_AVATAR_SRC) {
              avatarHtml = ViewUtils.getDefaultAvatarHtml(_person);
            } else {
              avatarHtml = ViewUtils.getAvatarDataHtmlFromPerson(_person)
            }

            _ret += '<li jid="' + _jid + '">';
            _ret += '  <a title="' + Utils.convertEscapedHtml(_person.getUserName()) + '  ' + Utils.convertEscapedHtml(groupName) + '">';
            _ret += '    <span class="ico ico_user status ' + ViewUtils.getPresenceColorCss(_person.getPresence()) + '">';
            _ret += avatarHtml;
            _ret += '    </span>';
            _ret += '    <span class="name">' + Utils.convertEscapedHtml(_person.getUserName()) + ViewUtils.getUserStatusString(_person.getStatus()) + '</span>';
            _ret += '    <span class="group">' + Utils.convertEscapedHtml(groupName) + '</span>';
            _ret += '</a></li>';
        }
        return _ret;
    }

    function getAllProjectList(_self) {

        function onJoinedCommunityInfoListCallback(_communityList) {
            _self._allProjectList = _communityList;
            _self._dialogAreaElement.find('#showList_for_quote').append(setProjectListFrame(_self,_communityList));
            _self._dialogInnerElement.on('click', '#showList_for_quote li', function(){
                _self.addDestinationRoom($(this).prop('outerHTML'));
            });
        }

        var _sortCondition = new ColumnSortCondition();
        _sortCondition.getItems().removeAll();
        _sortCondition.getItems().add("updated_at");
        _sortCondition.getOrders().removeAll();
        _sortCondition.getOrders().add(ColumnSortCondition.SORT_ORDER_DESC);

        CubeeController.getInstance().getJoinedCommunityInfoList(0, 1000, _sortCondition, onJoinedCommunityInfoListCallback);
    }

    function setProjectListFrame(_self,_communityList) {
        var projectListCount= _communityList.getCount();

        if(projectListCount == 0){
            showErrMessage(_self._dialogMessageToPage, Resource.getMessage('project_list_zero'));
            return;
        }

        var _ret = "";
        for(var i = 0; i< projectListCount; i++) {
            var _roomInfo = _communityList.get(i);
            // Variable _avaterDate is used like a local variable, but is missing a declaration.
            var _avaterDate = _roomInfo.getLogoUrl();
            // Variable projectname is used like a local variable, but is missing a declaration.
            var projectname = _roomInfo.getRoomName();

            _ret += '<li class="cf"><a  data_value="' + _roomInfo.getRoomId() + '" title="'+Utils.convertEscapedHtml(projectname)+'"><span class="ico ico_project">';

            if (_avaterDate == null || _avaterDate == '') {
                var result = Utils.avatarCreate({name:projectname ,type:DialogProjectListView.AvaterType });
                _ret += '<div class="no_img" style="background-color:' + result.color + '"><div class="no_img_inner">' + result.name + '</div></div></span>';
            } else {
                _ret += '<img src="' + _avaterDate + '" alt=""></span>';
            }

            _ret += '<span class="name">' + Utils.convertEscapedHtml(projectname,false) + '</span>';
        }
        return _ret;
    }
    _proto.sendQuoteMessageExecute = function(){
        var _self = this;
        if (!_self.displayRoomInfo) {
            showErrMessage(_self._dialogMessageToPage, Resource.getMessage('dialog_label_not_select_quote_room_error'));
            return;
        }
        var sendMessageData = {
            type: parseInt(_self.displayRoomInfo.find('a').attr("roomtype")),
            sendto: _self.displayRoomInfo.find('a').attr("data_value"),
            body: _self._textarea.getText(),
            quotationItemId: _self._message.getItemId()
        }

        CubeeController.getInstance().sendQuoteMessage(sendMessageData)
        .then(function(result){
            ViewUtils.modal_allexit();
            _self._dialogAreaElement.off();
            return;
        }).catch(function(err){
            if (err && err.content.reason) {
                switch (err.content.reason) {
                    case (403000):
                        showErrMessage(_self._dialogMessageToPage, Resource.getMessage('authority_err'));
                        break;
                    default:
                        showErrMessage(_self._dialogMessageToPage, Resource.getMessage('dialog_label_send_quote_message_error'));
                        break;
                }
            } else {
                showErrMessage(_self._dialogMessageToPage, Resource.getMessage('dialog_label_send_quote_message_error'));
            }
            return;
        });
    };

    function showErrMessage(element, string) {
        element.find("#dialog-error").text(string);
    }

})();
