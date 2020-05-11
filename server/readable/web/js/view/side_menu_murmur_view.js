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
function SideMenuMurmurView(){
}(function() {
    var isGotInstance = false;
    var isGotHistory = false;

    SideMenuMurmurView.prototype = $.extend({}, ColumnMurmurView.prototype);
    var _super = ColumnMurmurView.prototype;
    var _proto = SideMenuMurmurView.prototype;

    var _sideMenuMurmurView = new SideMenuMurmurView();

    SideMenuMurmurView.getInstance = () => {
        if(! isGotInstance){
            _sideMenuMurmurView.__init();
        }
        isGotInstance = true;
        return _sideMenuMurmurView;
    }
    _sideMenuMurmurView.viewFixed = false;

    _proto.createView = () => {}
    _proto.createHtml = () => {}
    _proto._setMurmurColumnEvent = () => {}
    _proto._createDisplayName = () =>{}
    _proto._setOptionMenu = () => {}
    _proto.onSystemMessageReceive = (mess) => {}

    _proto.isViewFixed = () => {
        return _sideMenuMurmurView.viewFixed;
    }
    _proto.__init = function() {
        var _self = this;
        var _columnInfo = new MurmurColumnInformation();
        var _columnSort = new ColumnSortCondition();
        var _columnTypeFilter = MyMurmurColumnFilter.getFilter();
        var _columnSearchCondition = new ColumnSearchCondition(_columnTypeFilter, _columnSort);
        _columnInfo.setSearchCondition(_columnSearchCondition);
        _columnInfo.isSideMenu = true;
        _self.isSideMenu = true
        ColumnMurmurView.call(_self, _columnInfo);

        _self._headerDisplayName = Resource.getMessage('MurmurSideBarTitle');

        _self.createSideList();
        _self._htmlElement = _self.getHtmlElement();

        _self.viewFixed = false;
        const _lsd = TabColumnStateStore.getInstance()._getItem("side_murmur_"+LoginUser.getInstance().getJid())
        if(typeof _lsd === 'string'){
            const lsd = JSON.parse(_lsd);
            if(typeof lsd == 'object' && lsd.viewFixed){
                _self.viewFixed = lsd.viewFixed
            }
        }

        return _self;
    };

    _proto.showMurmurHistory = () => {
        _super._LoadingIcon(_sideMenuMurmurView,'div.column-content');
        _sideMenuMurmurView.getHistoryMessage();
        _sideMenuMurmurView.refreshScrollbar();
        _sideMenuMurmurView.showButtonEvent();
        isGotHistory = true;

        if(_sideMenuMurmurView.viewFixed){
            $("#side-bar-murmur > div.sb-header .fa-thumb-tack").addClass("view-fixed")
            if(!$("#side-bar-murmur > div.sb-header .fa-thumb-tack").parent().find(".fa.fa-ban").length){
                $('<i class="fa fa-ban" aria-hidden="true"></i>').appendTo($("#side-bar-murmur > div.sb-header .fa-thumb-tack").parent())
            }
            $("#side-bar-murmur > div.sb-header .sb-ico-pin").attr("data-original-title",
                                                                   Resource.getMessage('side_menu_view_unfixed'))
            _sideMenuMurmurView.open()
        }
    }

    _proto.showButtonEvent = () => {
        showButtonEvent();
        if(!_sideMenuMurmurView._SendMessageRight){
            $('#side-bar-murmur button.open-send-dialog').off('click');
            $('#side-bar-murmur button.open-send-dialog').css('opacity','0.3');
        }
        if(!_sideMenuMurmurView._ViewMessageRight){
            $("#side-bar-murmur > div.column-content").append(
                $("<div>")
                    .css({
                        width: "100%",
                        height: "70px",
                        color: "#cccccc",
                        padding: "10px 25px 10px 10px",
                        backgroundColor: "#eae5e5",
                        fontSize: "1.4rem",
                        lineHeight: "2rem",
                        borderTop: "solid 1px #d9d9d9",
                        borderBottom: "solid 1px #ccc",
                    })
                    .text(
                        Resource.getMessage('not_view_to_murmur_err_placeholder')
                    ))
        }
        $("#side-bar-murmur > div.sb-header .fa-thumb-tack").off("click.sb-header-fa-thumb-tack");
        $("#side-bar-murmur > div.sb-header .fa-thumb-tack").on("click.sb-header-fa-thumb-tack",()=>{
            if(_sideMenuMurmurView.viewFixed){
                $("#side-bar-murmur > div.sb-header .fa-thumb-tack").removeClass("view-fixed")
                $("#side-bar-murmur > div.sb-header .sb-ico-pin").find(".fa-ban").remove()
                $("#side-bar-murmur > div.sb-header .sb-ico-pin").attr("data-original-title",
                                                                       Resource.getMessage('side_menu_view_fix'))
                _sideMenuMurmurView.viewFixed = false
            }else{
                $("#side-bar-murmur > div.sb-header .fa-thumb-tack").addClass("view-fixed")
                if(!$("#side-bar-murmur > div.sb-header .fa-thumb-tack").parent().find(".fa.fa-ban").length){
                    $('<i class="fa fa-ban" aria-hidden="true"></i>').appendTo($("#side-bar-murmur > div.sb-header .fa-thumb-tack").parent())
                }
                $("#side-bar-murmur > div.sb-header .sb-ico-pin").attr("data-original-title",
                                                                       Resource.getMessage('side_menu_view_unfixed'))
                _sideMenuMurmurView.viewFixed = true
            }
            const _lsd = TabColumnStateStore.getInstance()._getItem("side_murmur_"+LoginUser.getInstance().getJid());
            let lsd = {};
            if(_lsd){
                lsd = JSON.parse(_lsd);
            }
            lsd["viewFixed"] = _sideMenuMurmurView.viewFixed
            TabColumnStateStore.getInstance()._setItem("side_murmur_"+LoginUser.getInstance().getJid(), JSON.stringify(lsd));
        });
        $(window).off('resize.side-bar-murmur');
        $(window).on('resize.side-bar-murmur', () => {
            if(isGotInstance && isGotHistory){
                _sideMenuMurmurView.refreshScrollbar();
            }
        });
    }

    _proto.isGotHistory = () => {
        return isGotHistory;
    }

    const showButtonEvent = () => {
        $('#side-bar-murmur-ico').off('click.side-bar-murmur-ico');
        $('#side-bar-murmur-ico').attr('data-original-title', Resource.getMessage('MurmurSideBarTitle'))
        $('#side-bar-murmur-ico').on('click.side-bar-murmur-ico', () => {
            if(!isGotInstance){
                SideMenuMurmurView.getInstance();
            }
            if(!isGotHistory){
                _sideMenuMurmurView.showMurmurHistory();
            }
            if($('#side-bar-murmur').css('display') == 'none'){
                _open();
                $("#side-bar-murmur-ico").removeClass('alert-btn-murmur');
            }else{
                $("#side-bar-murmur > div.sb-header .fa-thumb-tack").removeClass("view-fixed")
                $("#side-bar-murmur > div.sb-header .sb-ico-pin").find(".fa-ban").remove()
                $("#side-bar-murmur > div.sb-header .sb-ico-pin").attr("data-original-title",
                                                                       Resource.getMessage('side_menu_view_fix'))
                _sideMenuMurmurView.viewFixed = false
                const _lsd = TabColumnStateStore.getInstance()._getItem("side_murmur_"+LoginUser.getInstance().getJid());
                let lsd = {};
                if(_lsd){
                    lsd = JSON.parse(_lsd);
                }
                lsd["viewFixed"] = _sideMenuMurmurView.viewFixed
                TabColumnStateStore.getInstance()._setItem("side_murmur_"+LoginUser.getInstance().getJid(), JSON.stringify(lsd));
                _close();
            }
        });
        $('#side-bar-murmur button.open-list-dialog').off('click.button-open-list-dialog');
        $('#side-bar-murmur button.open-list-dialog').on( 'click.button-open-list-dialog',()=>{
            // Superfluous arguments passed to function DialogMurmurListView.
            let _DialogMurmurListView = new DialogMurmurListView();
            _DialogMurmurListView.showDialog();
        });
        $(document).off('click.side-bar-murmur');
        $(document).on('click.side-bar-murmur',(event) => {
            if(!_sideMenuMurmurView.viewFixed && (!$(event.target).closest('#side-bar-murmur').length &&
               !$(event.target).closest('#side-bar-murmur-ico').length &&
               !$(event.target).closest('#modal_area').length &&
               !$(event.target).closest('div.modal_exit').length &&
               !$(event.target).closest('#murmur_send_modal').length &&
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
               !$(event.target).closest('#mentionmember_modal').length)) {
                _close();
            }
        });
    }

    const _open = (doWindowResize) => {
        if(doWindowResize == null){
            doWindowResize = true;
        }
        if ($('.control-sidebar').hasClass('control-sidebar-open')) {
            $('.control-sidebar').toggleClass('control-sidebar-open');
        }
        if($('#side-bar-murmur').css('display') == 'none'){
            $('#side-bar-murmur').css('display','block');
            $("#side-bar-murmur").animate({
                'right':'0px'
            },{
                'duration': 300,
            });
            const selW = ["#columnContainer", "#columnInnerContainer"];
            for(let i=0;i<selW.length;i++){
                const w = parseInt($(selW[i]).css("width"));
                if(isNaN(w)){
                    continue;
                }
                let widthFlex = w - 400 + 40
                if(widthFlex < 320){
                    widthFlex = 320
                }
                $(selW[i]).animate({
                    'width': widthFlex
                },{
                    'duration': 300,
                    'complete': () => {
                        if(doWindowResize){
                            $(window).trigger('resize');
                        }
                    }
                });
            }
        }
    }

    _proto.open = (doWindowResize) => {
        _open(doWindowResize);
    }

    const _close = (doWindowResize) => {
        if(doWindowResize == null){
            doWindowResize = true;
        }
        if($('#side-bar-murmur').css('display') != 'none'){
            $("#side-bar-murmur").animate({
                'right':'-400px'
            },{
                'duration': 300,
                'complete': () => {
                    $('#side-bar-murmur').css('display','none');
                }
            });
            const selW = ["#columnContainer", "#columnInnerContainer"];
            for(let i=0;i<selW.length;i++){
                const w = parseInt($(selW[i]).css("width"));
                if(isNaN(w)){
                    continue;
                }
                let widthFlex = w + 400 + 40
                if(widthFlex < 320){
                    widthFlex = 320
                }
                $(selW[i]).animate({
                    'width': widthFlex
                },{
                    'duration': 300,
                    'complete': () => {
                        if(doWindowResize){
                            $(window).trigger('resize');
                        }
                    }
                });
            }

        }
    }

    _proto.close = (doWindowResize) => {
        _close(doWindowResize);
    }

    _proto.clearColumn = () => {
        _close();
        $("#side-bar-murmur").remove();
        $(window).off('resize.side-bar-murmur');
        $(document).off('click.side-bar-murmur');
        isGotInstance = false;
        isGotHistory = false;
    }


    _proto.createSideList = () => {
        let displayName = Resource.getMessage('MurmurSideBarTitle');
        let showUnFollowMess = Resource.getMessage('dialog_murmur_show_unfollow_mess');
        let listTitle = Resource.getMessage('dialog_murmur_list');
        if(!$("#side-bar-murmur").size()){
            let sidebarMurmur = '\
                <div id="side-bar-murmur">\
                    <div class="sb-header">\
                        <span class="sb-ico-pin" data-original-title="' + Resource.getMessage('side_menu_view_fix')
                              + '" data-toggle="tooltip" data-placement="bottom">\
                          <i class="fa fa-thumb-tack"></i></span>\
                        <span class="sb-ico"><i class="fa fa-commenting"></i></span>\
                        <span class="sb-ttl">'+ displayName+'</span>\
                        <!-- <button class="show-unfollow-mess" data-original-title="'+showUnFollowMess
                              + '" data-toggle="tooltip" data-placement="bottom">'+showUnFollowMess+'</button> -->\
                        <button class="open-list-dialog" data-original-title="'+listTitle
                              + '" data-toggle="tooltip" data-placement="bottom">'+listTitle+'</button>\
                    </div>\
                    <div class="column-content scroll_content"></div>\
                </div>\
                        '
            $("div.control-sidebar").after(sidebarMurmur);
            $('[data-toggle="tooltip"]').tooltip({trigger: 'hover'});
        }
    }

    _proto.getHtmlElement = () => {
        return $('#side-bar-murmur');
    }

    _proto._hideLoadingIconInSelf = () => {
        var _targetColumnElem = _sideMenuMurmurView.getHtmlElement();
        if(_targetColumnElem == null) {
            return;
        }
        var _columnContentElem = _targetColumnElem.children('div.column-content');
        ViewUtils.hideLoadingIconInChild(_columnContentElem);
    }

    _proto._setToolTipToMessageElem = (messageElement, message, messageObject) => {
        var _self = _sideMenuMurmurView;
        _super._setToolTipToMessageElem.call(_self, messageElement, message, messageObject);
        $('a.ico_btn.action-show-conversation', messageElement).on('click',(event)=>{
            _self.close();
        })
    }

    _proto.afterCreateMessageHtml = (messageElement) => {
        var _self = _sideMenuMurmurView;
        $('.message-body > pre a.hashtag', messageElement).on('click',()=>{
            _self.close();
        });
    }

    _proto._initColumnSearchCondition = () => {
        var _murmurFilter = {
            "term":0,
            "tome":false,
            "search":"",
            "sender":"",
            "unread":false,
            "having_url":false,
            "attached_file":false
        };
        var _columnSearchCondition = _sideMenuMurmurView.getColumnSearchCondition(_murmurFilter, "");
        _sideMenuMurmurView._info.setSearchCondition(_columnSearchCondition);
    }

    _proto.refreshScrollbar = function() {
        var _self = _sideMenuMurmurView;
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
        var _self = _sideMenuMurmurView;
        if($('#side-bar-murmur-ico').css('display') != 'none' &&
           $('#side-bar-murmur').css('display') == 'none' &&
           msg.getFrom() != LoginUser.getInstance().getJid()){
            $("#side-bar-murmur-ico").addClass('alert-btn-murmur');
        }
        if(isGotHistory){
            _super._showMessageData.call(_self, msg);
        }
    }

    _proto._showReadMore = function() {
        var _self = _sideMenuMurmurView;
        var _tailOfElm;
        var _ret = false;
        var _maxNumMsg = 0;
        var _htmlElem = _self.getHtmlElement();
        if(_htmlElem == null) {
            return;
        }
        var _elm = _self.getColumnContent();
        if(!_elm.parents("#side-bar-murmur").length){
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
        if (_elm.parents("#side-bar-murmur").length &&
            _elm.parents("#side-bar-murmur").css('display') != 'none') {
            _self.getHistoryMessage();
            _ret = true;
        }
        return _ret;
    };

    showButtonEvent();
})();
