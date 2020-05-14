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
function ColumnIconView() {
    IconAreaIconView.call(this);
    this._iconElement = null;
    this._columnType = ColumnInformation.TYPE_COLUMN_UNKNOWN;
    this._filterCondition = null;
    this._columnInfo = null;
};(function() {
    ColumnIconView.prototype = $.extend({}, IconAreaIconView.prototype);
    var _super = IconAreaIconView.prototype;
    var _proto = ColumnIconView.prototype;
    _proto.getColumnInfo = function() {
        return this._columnInfo;
    };
    _proto.initColumnIconView = function(columnInformation, insertIndex) {
        var _self = this;
        if(!columnInformation || typeof columnInformation != 'object') {
            return false;
        }
        _self._columnInfo = columnInformation;
        _self._columnType = columnInformation.getColumnType();
        _self._filterCondition = columnInformation.getFilterCondition();
        var _htmlString = _getHtml(columnInformation);
        if(insertIndex == null || typeof insertIndex != 'number') {
            ColumnIconArea.COLUM_ICON_SPARATOR_ELEMENT.before(_htmlString);
            _self._iconElement = ColumnIconArea.COLUM_ICON_SPARATOR_ELEMENT.prev();
        } else {
            var _menuIconsElement = $('ul#menuIcons').eq(0);
            _menuIconsElement.children().eq(insertIndex).before(_htmlString);
            _self._iconElement = _menuIconsElement.children().eq(insertIndex);
        }
        _self.updateTitle();
        if(LayoutManager.isMobile) LayoutManager.resetScreenLayout();
        return true;
    };
    _proto.cleanup = function() {
        var _self = this;
        _self._iconElement.off();
        delete _self._iconElement;
        delete _self._columnType;
        delete _self._filterCondition;
        delete _self._columnInfo;
    };

    _proto.showNotificationIcon = function() {
        if(this._iconElement != null) {
            var _buttonColumnNotification = this._iconElement.children('input.newly-arrived');
            if (_buttonColumnNotification.length == 0) {
                this._iconElement.append(_getColumnNotificationHtml());
                var notifIcon = this._iconElement.children('input.newly-arrived');
                $(notifIcon).position({
                    my : 'right top',
                    at : 'right top',
                    of : this._iconElement
                });
                var defaultMargin = $(notifIcon).css('margin-top').replace('px','');
                var jumpH = $(notifIcon).css('height').replace('px','');
                var topH = defaultMargin - jumpH;
                var totalMsec = 500;
                var singleMsec = Math.floor(totalMsec / 6);
                 $(notifIcon).animate({ 'margin-top': topH + 'px' }, singleMsec, 'easeOutCubic', function(){
                    $(this).animate({ 'margin-top': defaultMargin + 'px' }, singleMsec, 'easeInCubic', function(){
                        $(this).animate({ 'margin-top': (topH / 2) + 'px' }, singleMsec, 'easeOutCubic', function(){
                            $(this).animate({ 'margin-top': defaultMargin + 'px' }, singleMsec, 'easeInCubic', function(){
                                $(this).animate({ 'margin-top': (topH / 4) + 'px' }, singleMsec, 'easeOutCubic', function(){
                                    $(this).animate({ 'margin-top': defaultMargin + 'px' }, singleMsec, 'easeInCubic', function(){
                                    })
                                })
                            })
                        })
                    })
                });
            }
        }
    };

    _proto.removeColumnNotificationIcon = function() {
        if(this._iconElement != null) {
            this._iconElement.children('input.newly-arrived').remove();
            View.getInstance().invalidBlinkTitleBar();
        }
    };
    function _getHtml(columnInformation) {
        if(!columnInformation || typeof columnInformation != 'object') {
            return '';
        }
        var _jidStr = '';
        var _imageTag = '';                                    
        var _cssType = 'ico_system';                           
        var _columnName = Utils.convertEscapedTag(columnInformation.getDisplayName()); 
        var _columnType = columnInformation.getColumnType();
        var _iconSrc = columnInformation.getIconImage();
        var _id = 'id="' + columnInformation.getFilterCondition() + '_icon"';
        let _messageList = columnInformation.getSearchCondition();
        let _msgto = '';
        switch(_columnType) {
            case ColumnInformation.TYPE_COLUMN_TIMELINE:       
                _imageTag = '<i class="menu-column fa fa-comments" title="' + columnInformation.getDisplayName() + '"></i>';
                break;
            case ColumnInformation.TYPE_COLUMN_MENTION:        
                _imageTag = '<i class="menu-column fa fa-user" title="' + columnInformation.getDisplayName() + '"></i>';
                break;
            case ColumnInformation.TYPE_COLUMN_CHAT:           
                _jidStr = 'jid="' + columnInformation.getFilterCondition() + '"';
                _cssType = 'ico_user';
                var _person = CubeeController.getInstance().getPersonData(columnInformation.getFilterCondition());
                if(_person != null){   
                    _columnName = _person.getUserName();
                    var result = Utils.avatarCreate({type: 'user', name: _columnName});
                    _columnName = Utils.convertEscapedTag(_columnName); 
                    if (ViewUtils.getAvatarUrl(_person) == ViewUtils.DEFAULT_USER_AVATAR_SRC) {
                        _imageTag    = '    <div class="menu-column no_img" style="background-color:' + result.color + '" title="' + _columnName + '">';
                        _imageTag   += '      <div class="no_img_inner">' + result.name + '</div>';
                        _imageTag   += '    </div>';
                    }else{
                        _imageTag = '<img ' + _id + ' class="menu-column ' + '" src="' + _iconSrc + '" title="' + _columnName + '">';
                    }
                }else{
                    _columnName = columnInformation.getDisplayName();
                    var result = Utils.avatarCreate({type: 'user', name: _columnName});
                    _columnName = Utils.convertEscapedTag(_columnName); 
                    if (columnInformation.getIconImage() == ViewUtils.DEFAULT_USER_AVATAR_SRC) {
                        _imageTag    = '    <div class="menu-column no_img" style="background-color:' + result.color + '" title="' + _columnName + '">';
                        _imageTag   += '      <div class="no_img_inner">' + result.name + '</div>';
                        _imageTag   += '    </div>';
                    }else{
                        _imageTag = '<img ' + _id + ' class="menu-column ' + '" src="' + _iconSrc + '" title="' + _columnName + '">';
                    }
                }
                break;
            case ColumnInformation.TYPE_COLUMN_TASK:           
                _imageTag = '<i class="menu-column fa fa-check" title="' + _columnName + '"></i>';
                break;
            case ColumnInformation.TYPE_COLUMN_INBOX:          
                _imageTag = '<i class="menu-column fa fa-archive" title="' + _columnName + '"></i>';
                break;
            case ColumnInformation.TYPE_COLUMN_SEARCH:         
            case ColumnInformation.TYPE_COLUMN_FILTER:         
            case ColumnInformation.TYPE_COLUMN_CUSTOM_FILTER:  
                _imageTag = '<i class="menu-column fa fa-search" title="' + columnInformation.getDisplayName() + '"></i>';
                break;
            case ColumnInformation.TYPE_COLUMN_GROUP_CHAT:     
                _cssType = 'ico_group';
                var result = Utils.avatarCreate({type: 'group', name: columnInformation.getDisplayName()});
                _imageTag    = '    <div class="menu-column no_img" style="background-color:' + result.color + '" title="' + _columnName + '">';
                _imageTag   += '      <div class="no_img_inner">' + result.name + '</div>';
                _imageTag   += '    </div>';
                if(_messageList != undefined &&
                   _messageList !=  "" &&
                   typeof _messageList ==  "object"){
                    let itemArray = _messageList._filterCondition._columnFilterConditionList._array;
                    if(itemArray != undefined &&
                       typeof itemArray == 'object'){
                        for(let i=0;i<itemArray.length;i++){
                            if(itemArray[i]._name == "msgto" &&
                               itemArray[i]._value != undefined){
                                _msgto = ' msgto="' + itemArray[i]._value + '"';
                            }
                        }
                    }
                }
                break;
            case ColumnInformation.TYPE_COLUMN_COMMUNITY_FEED: 
                _cssType = 'ico_project';
                var result = Utils.avatarCreate({type: 'project', name: columnInformation.getDisplayName()});
                _imageTag    = '    <div class="menu-column no_img" style="background-color:' + result.color + '" title="' + _columnName + '">';
                _imageTag   += '      <div class="no_img_inner">' + result.name + '</div>';
                _imageTag   += '    </div>';
                if(_messageList != undefined &&
                   _messageList !=  "" &&
                   typeof _messageList ==  "object"){
                    let itemArray = _messageList._filterCondition._columnFilterConditionList._array;
                    if(itemArray != undefined &&
                       typeof itemArray == 'object'){
                        for(let i=0;i<itemArray.length;i++){
                            if(itemArray[i]._name == "msgto" &&
                               itemArray[i]._value != undefined){
                                _msgto = ' msgto="' + itemArray[i]._value + '"';
                            }
                        }
                    }
                }
                break;
            case ColumnInformation.TYPE_COLUMN_COMMUNITY_TASK: 
                _imageTag = '<i class="menu-column fa fa-check-circle" title="' + _columnName + '"></i>';
                if(_messageList != undefined &&
                   _messageList !=  "" &&
                   typeof _messageList ==  "object"){
                    let itemArray = _messageList._filterCondition._columnFilterConditionList._array;
                    if(itemArray != undefined &&
                       typeof itemArray == 'object'){
                        for(let i=0;i<itemArray.length;i++){
                            if(itemArray[i]._name == "group_name" &&
                               itemArray[i]._value != undefined){
                                _msgto = ' msgto="' + itemArray[i]._value + '"';
                            }
                        }
                    }
                }
                break;
            case ColumnInformation.TYPE_COLUMN_RECENT:         
                _imageTag = '<i class="menu-column fa fa-exclamation" title="' + _columnName + '"></i>';
                break;
            case ColumnInformation.TYPE_COLUMN_TOME:           
                _imageTag = '<i class="menu-column fa fa-at" title="' + columnInformation.getDisplayName() + '"></i>';
                break;
            case ColumnInformation.TYPE_COLUMN_SHOW_CONVERSATION: 
                _imageTag = '<i class="menu-column fa fa-comment" title="' + columnInformation.getDisplayName() + '"></i>';
                break;
            case ColumnInformation.TYPE_COLUMN_QUESTIONNAIRE: 
                _imageTag = '<i class="menu-column fa fa-pie-chart" title="' + columnInformation.getDisplayName() + '"></i>';
                break;
            case ColumnInformation.TYPE_COLUMN_MURMUR:{           
                _cssType = 'ico_user';
                let partnerJid = MurmurColumnInformation.getOwnJidFromSearchCondition(columnInformation);
                var _person = null;
                _person = CubeeController.getInstance().getPersonData(partnerJid);
                _jidStr = 'jid="' + partnerJid + '"';
                _id = 'id="'+partnerJid + '_icon"';
                let _columnName = Resource.getMessage('Murmur');
                if(columnInformation._columnName){
                    _columnName = columnInformation._columnName;
                }
                if(_person != null){   
                    let _userName = _person.getUserName();
                    var result = Utils.avatarCreate({type: 'user', name: _userName});
                    _columnName = Utils.convertEscapedTag(_columnName); 
                    if (ViewUtils.getAvatarUrl(_person) == ViewUtils.DEFAULT_USER_AVATAR_SRC) {
                        _imageTag    = '    <div class="menu-column no_img" style="background-color:' + result.color + '" title="' + _columnName +  ' (' + _person.getUserName() + ')">';
                        _imageTag   += '      <div class="no_img_inner">' + result.name + '</div>';
                        _imageTag   += '    </div>';
                    }else{
                        _imageTag = '<img ' + _id + ' class="menu-column ' + '" src="' + _iconSrc + '" title="' + _columnName + ' (' + _person.getUserName() + ')">';
                    }
                }else{
                    CubeeController.getInstance().getPersonDataByJidFromServer(
                        partnerJid,
                        (_personList)=>{
                            for(let i=0;i<_personList.getCount();i++){
                                const _person = _personList.get(i);
                                if(_person == null){
                                    console.error("_person is null")
                                    continue
                                }
                                const _avatarSrc = ViewUtils.getAvatarUrl(_person);
                                columnInformation.setIconImage(_avatarSrc);
                                let _userName = _person.getUserName();
                                $("#menuIcons > li[jid=\""+partnerJid+"\"][columntype=18] > span.ico > div").remove();

                                if(_avatarSrc == "images/user_noimage.png"){
                                    let result = Utils.avatarCreate({type: 'user', name: _userName});
                                    _columnName = Utils.convertEscapedTag(_columnName); 
                                    _imageTag    = '    <div class="menu-column no_img" style="background-color:'
                                                 + result.color + '" title="' + _columnName + " ("+ _userName +')' + '">';
                                    _imageTag   += '      <div class="no_img_inner">' + result.name + '</div>';
                                    _imageTag   += '    </div>';
                                    $("#menuIcons > li[jid=\""+partnerJid+"\"][columntype=18] > span.ico").append(_imageTag);
                                }else{
                                    if($("#menuIcons > li[jid=\""+partnerJid+"\"][columntype=18] > span.ico > img").length){
                                        $("#menuIcons > li[jid=\""+partnerJid+"\"][columntype=18] > span.ico > img").remove();
                                    }
                                    $("#menuIcons > li[jid=\""+partnerJid+"\"][columntype=18] > span.ico")
                                        .append('<img jid="' + partnerJid + '_icon" class="menu-column '
                                              + '" src="' + _avatarSrc + '" title="' + _columnName + " ("+ _userName +')' + '">')
                                }
                                return
                            }
                        });
                }
                break;
            }
            default:                                           
                _imageTag = '<img ' + _id + ' class="menu-column ' + '" src="' + _iconSrc + '" title="' + columnInformation.getDisplayName() + '">';
                break;
        };
        var _htmlString = '<li ' + _jidStr + ' ' +_msgto + ' columntype="'+ _columnType + '" ' + ' class="sortable-item">' +
                        '<span class="ico ' + _cssType + '">' + _imageTag + '</span>' +
                        '<span class="name">' +
                        _columnName +
                        '</span>' +
                          '</li>';
        return _htmlString;
    };

    _proto.isMatchColumnInfo = function(columnInformation) {
        var _self = this;
        var _ret = false;
        var _columnType = columnInformation.getColumnType();
        var _filterCondition = columnInformation.getFilterCondition();
        var _searchCondition = columnInformation.getSearchCondition();
        if(_self._columnType != _columnType) {
            return _ret;
        }
        if (_filterCondition != null && _filterCondition != '') {
            if(_self._filterCondition == _filterCondition) {
                _ret = true;
            }
        } else {
            if(_self._columnType == ColumnInformation.TYPE_COLUMN_GROUP_CHAT) {
                var _iconRoomInfo = columnInformation.getChatRoomInfomation();
                var _selfRoomInfo = _self.getColumnInfo().getChatRoomInfomation();
                if (_iconRoomInfo.getRoomId() == _selfRoomInfo.getRoomId()) {
                    _ret = true;
                }
            } else if(_self._columnType == ColumnInformation.TYPE_COLUMN_COMMUNITY_FEED) {
                var _requestCommunityInfo = columnInformation.getCommunityInfomation();
                var _selfRoomInfo = _self.getColumnInfo().getCommunityInfomation();
                if (_requestCommunityInfo.getRoomId() == _selfRoomInfo.getRoomId()) {
                    _ret = true;
                }
            } else if(_self._columnType == ColumnInformation.TYPE_COLUMN_COMMUNITY_TASK) {
                var _requestCommunityInfo = columnInformation.getCommunityInfomation();
                var _selfRoomInfo = _self.getColumnInfo().getCommunityInfomation();
                if (_requestCommunityInfo.getRoomId() == _selfRoomInfo.getRoomId()) {
                    _ret = true;
                }
            } else {
                _ret = true;
            }
        }
        return _ret;
    };

    function _addClickEvent(iconElement) {
        iconElement.on('click', function() {
            var _index = $(this).index();
            ColumnManager.getInstance().bringColumnIntoView(_index);
            var notificationIcon = $(this).children('input.button_column_notification');
            if($(notificationIcon).length > 0) {
                $(notificationIcon).remove();
                var _count = 0;
                for(var i = 0; i < this.parentNode.children.length; i++) {
                    if($(this.parentNode.children[i]).children('input.button_column_notification').length > 0) {
                        _count++;
                    }
                }
                if(_count == 0) {
                    View.getInstance().invalidBlinkTitleBar();
                }
            }
            return false;
        });
    };

    function _getColumnNotificationHtml() {
        return '<input type="image" class="newly-arrived button_column_notification" src="images/column_notification.png" />';
    };

    function _getDemandTaskIconHtml() {
        return '<input type="image" class="demamd-task  button_column_notification" src="images/demand_red.png" />';
    };

    _proto.updateTitle = function() {
        var _self = this;
        if(_self._columnInfo != null) {
            _self._iconElement.children('.menu-column').eq(0).attr('title', Utils.convertEscapedTag(_self._columnInfo.getDisplayName()));
        }
    };
    _proto.checkColumnImage = function(columnimage, type) {
        switch (type){
            case ColumnInformation.TYPE_COLUMN_CHAT:           
                if(columnimage == '' || columnimage == ViewUtils.DEFAULT_USER_AVATAR_SRC){
                    return true;
                }
            break;
                case ColumnInformation.TYPE_COLUMN_GROUP_CHAT:     
                if(columnimage == '' || columnimage == 'images/community_onebit.png'){
                    return true;
                }
                break;
            case ColumnInformation.TYPE_COLUMN_COMMUNITY_FEED: 
                if(columnimage == '' || columnimage == 'images/column_community_feed.png'){
                    return true;
                }
            break;
        }
        return false;
    };
    _proto.updateColumnIcon = function() {
        var _self = this;
        var _flgImage = false;
        if(_self._columnInfo != null) {
            var _imgSrc = _self._columnInfo.getIconImage();
            var _dispName = Utils.convertEscapedTag(_self._columnInfo.getDisplayName()); 
            // The initial value of _dispData is unused, since it is always overwritten.
            var _dispData; // = _dispName; 
            var _resultName = _self._columnInfo.getDisplayName(); 
            var _type = _self._columnInfo.getColumnType();
            var _typeData = '';
            switch (_type){
                case ColumnInformation.TYPE_COLUMN_CHAT:           
                    _typeData = "user";
                    _flgImage = true;
                break;
                case ColumnInformation.TYPE_COLUMN_GROUP_CHAT:     
                    _typeData = "group";
                    _flgImage = true;
                break;
                case ColumnInformation.TYPE_COLUMN_COMMUNITY_FEED: 
                    _resultName = _self._columnInfo.getCommunityInfomation().getRoomName(); 
                    _dispData = Utils.convertEscapedTag(_resultName); 
                    if(TabManager.getInstance().isActiveMyWorkplace()){ 
                        _dispName = _dispData;
                    }
                    _typeData = "project";
                    _flgImage = true;
                break;
                case ColumnInformation.TYPE_COLUMN_MURMUR:           
                    _typeData = "user";
                    if(_imgSrc != ViewUtils.DEFAULT_USER_AVATAR_SRC){
                        _flgImage = true;
                    }
                break;
            }
            _self._iconElement.find('.name').html(_dispName);      
            if(_flgImage){
                if((_self._iconElement.find('img.menu-column').size() == 0) && (_self.checkColumnImage(_imgSrc, _type))){
                    var result = Utils.avatarCreate({type: _typeData, name: _resultName});
                    _self._iconElement.find('div.menu-column').attr({title: _resultName, style: "background-color:"+ result.color});
                    _self._iconElement.find('div.menu-column > .no_img_inner').html(result.name);
                }else if((_self._iconElement.find('img.menu-column').size() == 0) && (_self.checkColumnImage(_imgSrc, _type) == false)){
                    var _id = 'id="' + _self._columnInfo.getFilterCondition() + '_icon"';
                    _self._iconElement.find('div.menu-column').remove(); 
                    _self._iconElement.find('span.ico').append('<img ' + _id + ' class="menu-column ' + '" src="' + _imgSrc + '" title="' + _resultName + '">');
                }else if((_self._iconElement.find('img.menu-column').size() != 0) && (_self.checkColumnImage(_imgSrc, _type))){
                    _self._iconElement.find('img.menu-column').remove(); 
                    var result = Utils.avatarCreate({type: _typeData, name: _resultName});
                    var _imageTag    = '    <div class="menu-column no_img" style="background-color:' + result.color + '" title="' + _resultName + '">';
                        _imageTag   += '      <div class="no_img_inner">' + result.name + '</div>';
                        _imageTag   += '    </div></span>';
                    _self._iconElement.find('span.ico').append(_imageTag);
                }else if((_self._iconElement.find('img.menu-column').size() != 0) && (_self.checkColumnImage(_imgSrc, _type) == false)){
                    _self._iconElement.find('img.menu-column').attr({src: _imgSrc, title: _resultName});
                }
            }else{
                _self._iconElement.find('.menu-column').attr('title', _resultName);
            }
        }
    };

    _proto.onUpdateDisplay = function(columnInfo) {
        var _self = this;
        if(columnInfo == null || typeof columnInfo != 'object') {
            return false;
        }
        if(_self._columnType != ColumnInformation.TYPE_COLUMN_TASK
            && _self._columnType != ColumnInformation.TYPE_COLUMN_INBOX){
            return false;
        }
        var _rootElm = _self._iconElement;
        var _notificationIcon = _rootElm.find('input.newly-arrived');
        if($(_notificationIcon).length > 0){
            return false;
        }
        var _demandTaskIcon = _rootElm.find('input.demamd-task');
        if($(_demandTaskIcon).length > 0){
          $(_demandTaskIcon).remove();
        }
        var _isDemanded = ColumnManager.getInstance().checkDemandTask(_self._columnInfo);
        if(_isDemanded){
            _self.showDemandIcon();
        }
        return true;
    };

    _proto.onNewlyArrived = function() {
        var _self = this;
        var _rootElm = _self._iconElement;
        var _demandTaskIcon = _rootElm.find('input.demamd-task');
        if($(_demandTaskIcon).length > 0){
          $(_demandTaskIcon).remove();
        }
        _self.showNotificationIcon();
        View.getInstance().validBlinkTitleBar(800, View.getInstance().getTitle(), View.getInstance().getBlinkTitle());
    };

    _proto.showDemandIcon = function() {
        if(this._iconElement != null) {
            var _buttonColumnNotification = this._iconElement.children('input.demamd-task');
            if (_buttonColumnNotification.length == 0) {
                this._iconElement.append(_getDemandTaskIconHtml());
                _buttonColumnNotification = this._iconElement.children('input.demamd-task');
            }
            $(_buttonColumnNotification).position({
                my : 'right bottom',
                at : 'right bottom',
                of : this._iconElement
            });
        }
    };

    $(function() {
        $('#menuIcons').on('click', 'li.sortable-item', function() {
            if ($(this).data('longtapped') != null) {
                $(this).data('longtapped', null);
                return;
            }
            var _parent = $(this);
            var _index = $(_parent).index();
            ColumnManager.getInstance().bringColumnIntoView(_index);
            var notificationIcon = $(_parent).children('input.newly-arrived');
            if($(notificationIcon).length > 0) {

                var _count = -1;
                _count = $(_parent).parent().find('li > input.newly-arrived').length - 1;
                $(notificationIcon).remove();
                if(_count == 0) {
                    View.getInstance().invalidBlinkTitleBar();
                }
            }
            ColumnManager.getInstance().attentionColumn(_index, true);
            var _columnInfo = ColumnIconArea.getInstance().getIconColumnInfo(_index);
            if(_columnInfo != null) {
                NotificationIconManager.getInstance().onColumnClicked(_columnInfo);
            }
        });
        $('#menuIcons').on('sortstart', function(event, ui) {
            var _index = ui.item.index();
            ColumnIconArea.getInstance().startSortIcon(_index);
        });
        $('#menuIcons').on('sortupdate', function(event, ui) {
            var _index = ui.item.index();
            ColumnIconArea.getInstance().updateSortIcon(_index);
            ColumnManager.getInstance().bringColumnIntoView(_index);
            ColumnManager.getInstance().attentionColumn(_index, true);
        });
        $('#menuIcons').on('longtap', 'img.menu-column,div.menu-column,i.menu-column', function(event) {
            $(this).data('longtapped', 'true');
        });
    });
})();
