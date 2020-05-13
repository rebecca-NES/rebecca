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

function SideMenuRecentView(){
}(function() {
    var isGotInstance = false;
    var isGotHistory = false;

    // The initial value of _proto is unused, since it is always overwritten.
    var _proto; // = SideMenuRecentView.prototype;

    SideMenuRecentView.prototype = $.extend({}, ColumnRecentView.prototype);
    var _super = ColumnRecentView.prototype;
    var _proto = SideMenuRecentView.prototype;

    var _sideMenuRecentView = new SideMenuRecentView();

    SideMenuRecentView.getInstance = () => {
        if(! isGotInstance){
            _sideMenuRecentView.__init();
        }
        isGotInstance = true;
        return _sideMenuRecentView;
    }

    _proto.createView = () => {}
    _proto.createHtml = () => {}
    _proto._setRecentColumnEvent = () => {}
    _proto._createDisplayName = () =>{}
    _proto._setOptionMenu = () => {}
    _proto.onSystemMessageReceive = (mess) => {}

    _proto.__init = function() {
        var _self = this;
        var _columnInfo = new RecentColumnInfomation();
        var _columnSort = new ColumnSortCondition();
        var _columnTypeFilter = ColumnFilterManager.getColumnFilter(ColumnInformation.TYPE_COLUMN_RECENT);
        var _columnSearchCondition = new ColumnSearchCondition(_columnTypeFilter, _columnSort);
        _columnInfo.setSearchCondition(_columnSearchCondition);
        ColumnRecentView.call(_self, _columnInfo);

        _self._headerDisplayName = Resource.getMessage('RecentSideBarTitle');

        _self.createSideList();
        _self._htmlElement = _self.getHtmlElement();

        return _self;
    };

    _proto.showRecentHistory = () => {
        _super._LoadingIcon(_sideMenuRecentView, 'div.column-content');
        _sideMenuRecentView.getHistoryMessage();
        _sideMenuRecentView.refreshScrollbar();
        _sideMenuRecentView.showButtonEvent();
        isGotHistory = true;
    }

    _proto.showButtonEvent = () => {
        showButtonEvent();
        $(window).off('resize.side-bar-recent');
        $(window).on('resize.side-bar-recent', () => {
            if(isGotInstance && isGotHistory){
                _sideMenuRecentView.refreshScrollbar();
            }
        });
    }

    _proto.isGotHistory = () => {
        return isGotHistory;
    }

    const showButtonEvent = () => {
        $('#side-bar-recent-ico').off('click.side-bar-recent');
        $('#side-bar-recent-ico').on('click.side-bar-recent', () => {
            if(!isGotInstance){
                SideMenuRecentView.getInstance();
            }
            if(!isGotHistory){
                _sideMenuRecentView.showRecentHistory();
            }
            if($('#side-bar-recent').css('display') == 'none'){
                _open();
                $("#side-bar-recent-ico").removeClass('alert-btn-recent');
            }else{
                _close();
            }
        });
        $(document).off('click.side-bar-recent');
        $(document).on('click.side-bar-recent',(event) => {
            if(!$(event.target).closest('#side-bar-recent').length &&
               !$(event.target).closest('#side-bar-recent-ico').length &&
               !$(event.target).closest('#modal_area').length &&
               !$(event.target).closest('div.modal_exit').length &&
               !$(event.target).closest('#grouptitle_modal').length &&
               !$(event.target).closest('#quote_modal').length &&
               !$(event.target).closest('#read_modal').length &&
               !$(event.target).closest('#emotion_modal').length &&
               !$(event.target).closest('#assignnote_modal').length &&
               !$(event.target).closest('#taskregist_modal').length &&
               !$(event.target).closest('#taskregist_modal').length &&
               !$(event.target).closest('div.autocomplete-suggestion').length &&
               !$(event.target).closest('div.autocomplete-suggestion').length &&
               !$(event.target).closest('#msgdelete_modal').length &&
               !$(event.target).closest('.emoji-mart').length &&
               !$(event.target).closest('#mentionmember_modal').length) {
                _close();
            }
        });
    }

    const _open = () => {
        if ($('.control-sidebar').hasClass('control-sidebar-open')) {
            $('.control-sidebar').toggleClass('control-sidebar-open');
        }
        if($('#side-bar-recent').css('display') == 'none'){
            $('#side-bar-recent').css('display','block');
            $("#side-bar-recent").animate({
                'right':'0px'
            },{
                'duration': 300,
            });
        }
    }

    _proto.open = () => {
        _open();
    }

    const _close = () => {
        if($('#side-bar-recent').css('display') != 'none'){
            $("#side-bar-recent").animate({
                'right':'-400px'
            },{
                'duration': 300,
                'complete': () => {
                    $('#side-bar-recent').css('display','none');
                }
            });
        }
    }

    _proto.close = () => {
        _close();
    }

    _proto.clearColumn = () => {
        _close();
        $("#side-bar-recent").remove();
        $(window).off('resize.side-bar-recent');
        $(document).off('click.side-bar-recent');
        isGotInstance = false;
        isGotHistory = false;
    }

    _proto.createSideList = () => {
        let _self = this;
        let displayName = Resource.getMessage('RecentSideBarTitle');
        if(!$("#side-bar-recent").size()){
            let sidebarRecent = '\
                <div id="side-bar-recent">\
                    <div class="sb-header">\
                        <span class="sb-ico"><i class="fa fa-commenting"></i></span>\
                        <span class="sb-ttl">'+ displayName+'</span>\
                    </div>\
                    <div class="column-content scroll_content"></div>\
                </div>\
            '
            $("div.control-sidebar").after(sidebarRecent);
        }
    }

    _proto.getHtmlElement = () => {
        return $('#side-bar-recent');
    }

    _proto._hideLoadingIconInSelf = () => {
        var _self = this;
        var _targetColumnElem = _sideMenuRecentView.getHtmlElement();
        if(_targetColumnElem == null) {
            return;
        }
        var _columnContentElem = _targetColumnElem.children('div.column-content');
        ViewUtils.hideLoadingIconInChild(_columnContentElem);
    }

    _proto._setToolTipToMessageElem = (messageElement, message, messageObject) => {
        var _self = _sideMenuRecentView;
        _super._setToolTipToMessageElem.call(_self, messageElement, message, messageObject);
        $('a.ico_btn.action-show-conversation', messageElement).remove();
    }

    _proto.afterCreateMessageHtml = (messageElement) => {
        var _self = _sideMenuRecentView;
        $('.message-body > pre a.hashtag', messageElement).on('click',()=>{
            _self.close();
        });
    }

    _proto._initColumnSearchCondition = () => {
        var _recentFilter = {
            "term":0,
            "tome":false,
            "search":"",
            "sender":"",
            "unread":false,
            "having_url":false,
            "attached_file":false
        };
        var _columnSearchCondition = _sideMenuRecentView.getColumnSearchCondition(_recentFilter, "");
        _sideMenuRecentView._info.setSearchCondition(_columnSearchCondition);
    }

    _proto.refreshScrollbar = function() {
      var _self = this;
      if(!_self._htmlElement.find('.scroll_content.ps').length) {
        var target = _self._htmlElement.find('.scroll_content');
        /* Unused variable ps.
        var ps = new PerfectScrollbar(target[0], {
          suppressScrollX: true
        }); */
        $(target).on('ps-scroll-y',() => {
          if ($('emoji-picker').hasClass('open')) {
            $('emoji-picker').removeClass('open');
          }
        });

        target.on('ps-y-reach-end', function(){
          if(_self._disableBottomEvent){
              return;
          }
          _self._showReadMore(true);
        })
      }
    }

    _proto.showMessage = (msg) => {
        var _self = _sideMenuRecentView;
        if($('#side-bar-recent-ico').css('display') != 'none' &&
           $('#side-bar-recent').css('display') == 'none' &&
           msg.getFrom() != LoginUser.getInstance().getJid()){
            $("#side-bar-recent-ico").addClass('alert-btn-recent');
        }
        if(isGotHistory){
            _super.showMessage.call(_self, msg);
        }
    }

    _proto._showReadMore = function() {
        var _self = this;
        var _tailOfElm;
        var _ret = false;
        var _maxNumMsg = 0;
        var _htmlElem = _self.getHtmlElement();
        if(_htmlElem == null) {
            return;
        }
        var _elm = _self.getColumnContent();
        if(!_elm.parents("#side-bar-recent").length){
            return;
        }

        if (_self._validation({'object' : _elm}) == false) {
            return _ret;
        }
        if (_self._allMessageReceived == true) {
            return false;
        }

        _tailOfElm = _elm.children('div:last');
        if (_tailOfElm.hasClass(ViewUtils.LOADING_ICON_CLASS_NAME)) {
            return false;
        }
        _self._hideLoadingIconInSelf();
        ViewUtils.showLoadingIcon(_tailOfElm);
        _maxNumMsg = _elm.children('div.message-border').size();
        if (_maxNumMsg == 0) {
            ViewUtils.hideLoadingIcon(_tailOfElm);
            return false;
        }
        if (_elm.parents("#side-bar-recent").length &&
            _elm.parents("#side-bar-recent").css('display') != 'none') {
            _self.getHistoryMessage();
            _ret = true;
        }
        return _ret;
    };

    showButtonEvent();
})();
