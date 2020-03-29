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

function SelectAndAddProjectView(){

    this._displayProjects = new CommunityList();
    this._headerElement = $('.header_project_ico').find('.ico_project');
    this._groupchatListView = null;
    this._chatListView = null;

    SelectAndAddProjectView._default_color = Conf.getVal('DEFAULT_PROJECT_COLOR');
    SelectAndAddProjectView._colors =["#E04F5F",
                                      "#E7953B",
                                      "#FAD43D",
                                      "#98D44E",
                                      "#32BEA6",
                                      "#51B8FD",
                                      "#187BCE",
                                      "#AF69C4",
                                      "#F195AD",
                                      "#A17255",
                                      "#8CA8BC",
                                      "#555555",
                                      Conf.getVal('DEFAULT_PROJECT_COLOR')  
                                     ];

    SelectAndAddProjectView.AvaterType = 'project';
};(function() {

    var _proto = SelectAndAddProjectView.prototype;

    var _selectandaddProjectView = new SelectAndAddProjectView();

     SelectAndAddProjectView.getInstance = function() {
         return _selectandaddProjectView;
     };

    _proto.getProjectList = function(_communityInfo) {
        var _self = this;

        function onJoinedCommunityInfoListCallback(_communityList) {

            _self.setProjectList(_communityList);

           const auth_if = AuthorityInfo.getInstance();
           if(!auth_if.checkRights("createCommunity")){
                $('.project_list .list_wrapper').find('#addproject_modal').remove();
           }

            _self.setEventHandler();

            $('#prj_ico').hide();
            $('#side-bar-recent-ico').hide();
            $('#side-bar-murmur-ico').show();

            if(_communityInfo != null) {
                _self.setHeaderIconAndColor(_communityInfo);
            }

            _self._groupchatListView = (new GroupChatListView()).init({
                mode: 'sidebar'
            });

            _self._chatListView = (new ContactListView()).init();

            _self._communityList = _communityList;

        }

        var _sortCondition = new ColumnSortCondition();
        _sortCondition.getItems().removeAll();
        _sortCondition.getItems().add("updated_at");
        _sortCondition.getOrders().removeAll();
        _sortCondition.getOrders().add(ColumnSortCondition.SORT_ORDER_DESC);

        CubeeController.getInstance().getJoinedCommunityInfoList(0, Conf.getVal('NUMBER_OF_ITEMS_BY_PER_PROJECT_LIST_COUNT'), _sortCondition, onJoinedCommunityInfoListCallback);
    };

    _proto.setProjectList = function(_communityList) {
        var _self = this;

        var _headerProjectListElement = $('.project_list');
        _headerProjectListElement.html(_self.getProjectInnerHtml(_communityList));
    };

    _proto.setHeaderIconAndColor = function(_communityInfo) {
        var _self = this;
        if(_communityInfo == null) {

            $('#header').find('.navbar').css('background-color' , '');
            $('.content-wrapper').css('background-color' , '');

            var _extras = LoginUser.getInstance().getExtras();
            if (_extras && _extras.backgroundImage) {
                $('div[name="mainWrapper"]').addClass(_extras.backgroundImage);
            } else {
                $('div[name="mainWrapper"]').addClass('dashboard_wrapper');
            }
            $('div[name="navbar"]').addClass('dashboard_header_navbar');
            $('#watch_view').addClass('dashboard_content-wrapper');

            var pointBackground = "linear-gradient(161deg, rgb(193, 48, 48) 0%, rgb(225, 196, 63) 100%) 50% 50% / 100% 100% no-repeat"
            $('#sidebar-gj-tp table').css({"background":pointBackground});

            _self._headerElement.html('<img src="images/cubee_ico_02.png" alt="">');

            $('.project_btn').attr('data_value','myworkplace');
            $('.project_btn').html(Resource.getMessage('MyWorkplace') + '<i class="fa fa-caret-down"></i>')

            $('#prj_ico').hide();
            $('#side-bar-recent-ico').hide();
            $('#side-bar-murmur-ico').show();

        } else {

            $('div[name="mainWrapper"]').removeClass (function (index, css) {
                return (css.match (/\bdashboard_w\S+/g) || []).join(' ');
            });
            $('div[name="navbar"]').removeClass('dashboard_header_navbar');
            $('#watch_view').removeClass('dashboard_content-wrapper');

            var projectcolor = chkColorInfo(_communityInfo.getMemberEntryType());
            $('#header').find('.navbar').css('background-color' , projectcolor);

            $('.content-wrapper').css('background-color' , projectcolor);

            var pointBackground = "linear-gradient(161deg, "+hexToRGB(projectcolor)+" 0%, "+hexToRGB(projectcolor,0.5)+" 100%) no-repeat 50% 50% / 100% 100%"
            $('#sidebar-gj-tp table').css({"background":pointBackground});

            var _avaterDate = _communityInfo.getLogoUrl();
            var _ret = null;
            if (_avaterDate == null || _avaterDate == '') {

                var result = Utils.avatarCreate({name:_communityInfo.getRoomName() ,type:SelectAndAddProjectView.AvaterType });

                _ret = '<div class="no_img" style="background-color:' + result.color + '"><div class="no_img_inner">' + result.name + '</div></div>';

            } else {
                _ret = '<div class="no_img"><div class="no_img_inner"><img src="' + _avaterDate + '" alt="">' + '</div></div>';
            }
            _self._headerElement.html(_ret);

            $('.project_btn').attr('data_value',_communityInfo.getRoomId());
            $('.project_btn').html(Utils.convertEscapedHtml(_communityInfo.getRoomName(),false) + '<i class="fa fa-caret-down"></i>');

            $('#prj_ico').show();
            $('#side-bar-recent-ico').show();
            $('#side-bar-murmur-ico').hide();
        }
    };

    function hexToRGB(hex, alpha) {
        var r = parseInt(hex.slice(1, 3), 16),
            g = parseInt(hex.slice(3, 5), 16),
            b = parseInt(hex.slice(5, 7), 16);

        if (alpha) {
            return "rgba(" + r + ", " + g + ", " + b + ", " + alpha + ")";
        } else {
            return "rgb(" + r + ", " + g + ", " + b + ")";
        }
    }

    _proto.getProjectInnerHtml = function(_communityList) {
        var _self = this;

        _self._displayProjects = new CommunityList();

        var projectListCount= _communityList.getCount();

        var _roomInfo = _communityList.get(0);

        var _ret = "";

        _self.setHeaderIconAndColor(null);

        if(projectListCount == 0) {
            _ret += '<a data_value="myworkplace" class="project_btn" data-toggle="tooltip" data-placement="right" data-original-title="' + Resource.getMessage('main_header_project_list_title') + '">'  + Resource.getMessage('MyWorkplace') + '<i class="fa fa-caret-down"></i></a>';
            _ret += '<div class="list_wrapper">';
            _ret += '  <ul class="list" id="project">';
            _ret += '    <li><a data_value="myworkplace" class="txt_btn">' + Resource.getMessage('MyWorkplace') + '</a></li>';
            _ret += '  </ul>';
            _ret += '  <ul class="list">';
            _ret += '    <li><a  class="txt_btn" id="projectlist_modal"><i class="fa fa-address-book"></i>' + Resource.getMessage('main_header_project_all') + '</a></li>';
            _ret += '    <li><a  class="txt_btn" id="addproject_modal"><i class="fa fa-pencil"></i>' + Resource.getMessage('main_header_create_project') + '</a></li>';
            _ret += '    <li><a  class="txt_btn" id="public_project_list">' + Resource.getMessage('main_header_public_project_list') + '</a></li>';
            _ret += '  </ul>';
            _ret += '</div>';

            return _ret;
        }

       _ret += '<a data_value="myworkplace" class="project_btn" data-toggle="tooltip" data-placement="right" data-original-title="' + Resource.getMessage('main_header_project_list_title') + '">'  + Resource.getMessage('MyWorkplace') + '<i class="fa fa-caret-down"></i></a>';
       _ret += '<div class="list_wrapper">';
       _ret += '  <ul class="list" id="project">';

       _ret += '    <li><a data_value="myworkplace" class="txt_btn">' + Resource.getMessage('MyWorkplace') + '</a></li>';

       for(var i = 0; i< projectListCount; i++) {

           var _roomInfo = _communityList.get(i);

           _ret += '    <li><a data_value="' + _roomInfo.getRoomId() + '" class="txt_btn">' + Utils.convertEscapedHtml(_roomInfo.getRoomName(),false) + '</a></li>';

           _self._displayProjects.add(_roomInfo.getRoomId(),_roomInfo);
       }
       _ret += '  </ul>';
       _ret += '  <ul class="list">';
       _ret += '    <li><a class="txt_btn" id="projectlist_modal"><i class="fa fa-address-book"></i>' + Resource.getMessage('main_header_project_all') + '</a></li>';
       _ret += '    <li><a class="txt_btn" id="addproject_modal"><i class="fa fa-pencil"></i>' + Resource.getMessage('main_header_create_project') + '</a></li>';
       _ret += '    <li><a class="txt_btn" id="public_project_list">' + Resource.getMessage('main_header_public_project_list') + '</a></li>';
       _ret += '  </ul>';
       _ret += '</div>';

        return _ret;
    };

    _proto.setEventHandler = function() {
        var _self = this;

        $('.project_list').find('[data-toggle="tooltip"]').tooltip({
            trigger: 'hover'
        });

        $('.project_btn').on('click', function(){
            $(this).parents('.project_list').toggleClass('open').find('.list_wrapper').stop().slideToggle(200);
        });

        $(document).on('click', function(e){
            if (!$(e.target).closest('.project_btn').length) {
                $('.project_list').removeClass('open').find('.list_wrapper').stop().slideUp(200);
            }
        });

        $('#project li .txt_btn').on('click', function (event, columnInfo) {

            var _communityId = $(this).attr('data_value');
            var delCommunityId = $('.project_btn').attr('data_value');

            function getItemForId (){
                var projectListCount= _self._displayProjects.getCount();
                for(var i = 0; i< projectListCount; i++) {
                    var proItem = _self._displayProjects.get(i);

                    if(proItem.getRoomId() == _communityId) {
                        return proItem;
                    }
                }
            }

            var communityInfo = null;
            if(_communityId != 'myworkplace') {
                communityInfo = getItemForId();
                SideMenuMurmurView.getInstance().close();
            }else{
                if(SideMenuMurmurView.getInstance().isViewFixed()){
                    SideMenuMurmurView.getInstance().open();
                }
            }

            function deleteProject(){
                if(delCommunityId != _communityId){
                    var _tabCommunity = new TabCommunityItemView();
                    if(delCommunityId != "myworkplace"){
                        _tabCommunity.init(delCommunityId);
                    }
                    TabManager.getInstance()._deleteProject(_tabCommunity);

                }
                NotificationIconManager.getInstance().updateAttentionHeaderColumnIconView();
            }

            TabManager.getInstance().selectOrAddTabByCommunityInfo(_communityId, communityInfo, deleteProject);

            $('.project_list').removeClass('open').find('.list_wrapper').stop().slideUp(200);
        });

        $('#projectlist_modal').on('click', function(){
            var _dialogProjectListView = new DialogProjectListView();
            _dialogProjectListView.showDialog();
        });

        $('#addproject_modal').on('click', function(){
            var _dialogCreateCommunityView = new DialogCreateCommunityView();
            _dialogCreateCommunityView.showDialog();
        });

        $('#public_project_list').on('click', function(){
            var _dialogPublicProjectListView = new DialogPublicProjectListView();
            _dialogPublicProjectListView.showDialog();
        });

    };

    function chkColorInfo (_color){
        var _self = this;

        if(_color.indexOf('#') == -1) {
           _color = '#' + _color;
        }

        if (SelectAndAddProjectView._colors.indexOf(_color) >= 0) {
            return _color;
        } else {
            return SelectAndAddProjectView._default_color;
        }
    };

})();
