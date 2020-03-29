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

function FollowsView(){
};(function() {
    $(function(){
        $('#listFollows').hide('blind', 'fast');
        $('#followsListContainer > div:first').on('mouseover', function() {
            $(this).css('cursor', 'pointer');
        }).on('click', function() {
            $(this).next().toggle('slow');
            return false;
        }).next().show();
    });
})();

function FollowsListDialog(){
    DialogView.call(this);
};(function() {
    FollowsListDialog.prototype = $.extend({}, DialogView.prototype);
    var _super = DialogView.prototype;
    var _proto = FollowsListDialog.prototype;
})();

function FollowListView(){
    FollowsListDialog.call(this);
};(function() {
    FollowListView.prototype = $.extend({}, FollowsListDialog.prototype);
    var _super = FollowsListDialog.prototype;
    var _proto = FollowListView.prototype;
})();

function FollowerListView(){
    FollowsListDialog.call(this);
};(function() {
    FollowerListView.prototype = $.extend({}, FollowsListDialog.prototype);
    var _super = FollowsListDialog.prototype;
    var _proto = FollowerListView.prototype;
})();

