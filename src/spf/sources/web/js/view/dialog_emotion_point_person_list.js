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

function DialogEmotionPointPersonListView(messageItemId, emotionPointList, emotionIcons) {
    this._messageItemId = messageItemId;
    this._emotionPointList = emotionPointList;
    this._emotionIcons = emotionIcons;
    DialogPersonListView.call(this, Resource.getMessage('dialog_label_list_emotion_point'), emotionPointList);
};(function() {
    DialogEmotionPointPersonListView.prototype = $.extend({}, DialogPersonListView.prototype);
    var _super = DialogPersonListView.prototype;
    var _proto = DialogEmotionPointPersonListView.prototype;

    _proto._init = function() {
        _super._init.call(this);
        var _self = this;
        var _messageThumbnailElement = this._dialogInnerElement.find('img.image-thumbnail');
        _messageThumbnailElement.each(function(index, el) {
            var _element = $(el);
            if(!_element.attr('src')) {
                var url = _element.attr('data-url');
                CubeeController.getInstance().downloadThumbnailImage(url, "item", _element);
            }
        });
        showGraph(_self);
        addAvatarTooltip(_self);
    }

    function addAvatarTooltip(_this) {
        var _self = _this;
        _self._dialogInnerElement.find("div.block-avatar").each(function(e, elem){
            TooltipView.getInstance().setAvatarToolTip(TooltipView.TYPE_USER_AVATAR, $(elem), true);
        })
        _self._dialogInnerElement.find("div.block-avatar").on('mouseenter', function () {
          var dialogEdgeRight = $('#emotion_modal').offset().left + $('#emotion_modal').width();
          var left = $(this).offset().left + 290;
          var elmLeft = 0;
          if (left > dialogEdgeRight) {
              elmLeft = dialogEdgeRight - left;
          }
          $(this).children('.mTip').css({'top': 'auto' , 'left': elmLeft + 'px'}).addClass('hover');
        });
    }

    function showGraph(_this) {
        var _self = _this;
        var showList = _getShowList(_self._emotionPointList);
        var _labels = [];
        var _data = [];
        for (key in _self._emotionIcons) {
            if (key == 0) {
                continue;
            }
            _labels.add(key);
            if (showList[key]) {
                _data.add(showList[key].length);
            } else {
                _data.add(0);
            }
        }
        var myChart = new Chart(document.getElementById("emotion_canvas"), {
            type: 'horizontalBar',
            data: {
                labels: _labels.reverse(),
                datasets: [{
                    backgroundColor: "#d86868",
                    data: _data.reverse()
                }]
            },
            options: {
                title: {
                    display: true,
                    text: 'サンクスポイント付与割合'
                },
                legend: {
                    display: false
                },
                scales: {
                    xAxes: [
                        {
                            display: true,
                            scaleLabel: {
                                display: true,
                                labelString: "付与人数"
                            }
                        }
                    ],
                    yAxes: [
                        {
                            display: true,
                            scaleLabel: {
                                display: true,
                                labelString: "ポイント数"
                            }
                        }
                    ]
                },
                responsive: false
            }
        });
    }


    _proto.getInnerHtml = function() {
        var _self = this;
        var _ret = "";
        var _personList = _self._personList;
        if(_personList == null){
            return _ret;
        }
        var _count = getSumEmotionPoint(_self._emotionPointList);
        _ret += '<div id="emotion_modal" class="card modal_card">';
        _ret += '  <div class="card_title">';
        _ret += '    <p>' + _self._title + '（'+_count+'）</p>';
        _ret += '  </div>';
        _ret += '  <div class="list_wrapper scroll_content">';
        _ret += _getEmotionListElement(_self);
        _ret += '  </div>';
        _ret += '  <div class="btn_wrapper">';
        _ret += '    <p id="dialog-error" class="ui-state-error-text dialog_error_footer"></p>';
        _ret += '    <button type="button" class="modal_btn success_btn ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only" role="button" aria-disabled="false"><span class="ui-button-text">' + Resource.getMessage('dialog_label_ok') + '</span></button>';
        _ret += '  </div>';
        _ret += '  <a class="modal_exit modal_exit_btn ico_btn ui-dialog-titlebar-close ui-corner-all" role="button"><i class="fa fa-times"></i></a>';
        _ret += '</div>';
        return _ret;
    };

    function getSumEmotionPoint(_emotionPointList) {
        var sum = 0;
        for (var i=0; i<_emotionPointList._length; i++) {
            sum += _emotionPointList.get(i).getEmotionPoint();
        }
        return sum;
    }

    function _getShowList(_emotionPointList) {
        var showList = {};
        for (var i=0; i<_emotionPointList._length; i++) {
            var emotionData = _emotionPointList.get(i);
            var point = _emotionPointList.get(i).getEmotionPoint();
            if ( point in showList ) {
                showList[point].add(_createPersonFromEmotionData(emotionData));
            } else {
                showList[point] = [_createPersonFromEmotionData(emotionData)];
            }
        }
        return showList;
    }

    function _getEmotionListElement(_this){
        var _self = _this;
        var showList = {};
        showList = _getShowList(_self._emotionPointList);
        var keyList = [];
        for (key in _self._emotionIcons) {
            keyList.add(key);
        }
        keyList.reverse();
        _ret = "";
        _ret += '  <canvas id="emotion_canvas" width="420"></canvas>'
        for (key in keyList) {
            var objectKey = keyList[key];
            if (showList[objectKey]) {
                if (ViewUtils.isAttachmentUrl(_self._emotionIcons[objectKey], _self._emotionIcons[objectKey])) {
                    _ret += '<div class="modal_header_emotion">\
                        <p class="modal_title_emotion">'+objectKey+'ポイント</p>\
                        <img class="image-thumbnail clickable" title="' + _self._emotionIcons[objectKey] + '\
                        " data-url="' + _self._emotionIcons[objectKey] + '"/>\
                      </div>';
                } else {
                    _ret += '<div class="modal_header_emotion"><p class="modal_title_emotion">'+ _self._emotionIcons[objectKey] +' ('+objectKey+'ポイント)</p></div>';
                }
                _ret += '<div class="emotionAvatarList">';
                for ( var i=0; i<showList[objectKey].length; i++) {
                    _ret += ViewUtils.getAvatarDataHtmlFromPerson(showList[objectKey][i]);
                }
                _ret += '</div>';
              }
        }
        return _ret;
    }
    function _createPersonFromEmotionData(emotionData){
        if(!emotionData || typeof emotionData != 'object'){
            return;
        }
        var _person = new Person();
        _person.setJid(emotionData.getJid());
        var _profile = new Profile();
        _profile.setNickName(emotionData.getNickName());
        _profile.setAvatarType(emotionData.getAvatarType());
        _profile.setAvatarData(emotionData.getAvatarData());
        _profile.setLoginAccount(emotionData.getLoginAccount());
        _profile.setStatus(emotionData.getStatus());
        _person._profile = _profile;
        return _person;
    }
    _proto.onNotification = function(notification) {
        var _self = this;
        if (!$("#modal_area").is(":visible")) {
            return;
        }
        if(notification == null || typeof notification != 'object'){
            return;
        }
        var _type = notification.getType();
        if(_type != Notification_model.TYPE_EMOTION_POINT){
            return;
        }
        var newlistElement = _getEmotionListElement(_self);
        _self._dialogInnerElement.find('.list_wrapper').find('*').off();
        _self._dialogInnerElement.find('.list_wrapper').children().remove();
        _self._dialogInnerElement.find('.list_wrapper').html(newlistElement);
        _self.rewritDialogTitle();
        showGraph(_self);
        addAvatarTooltip(_self);
    };

    _proto.rewritDialogTitle = function() {
        var _self = this;
        var _childrens = _self._dialogInnerElement.find('.modal_list li');
        var _childrenCount = getSumEmotionPoint(_self._emotionPointList);
        var _title = _self._dialogInnerElement.parent().find('.card_title p');
        _title.text(_self._title + ' (' + _childrenCount + ')');
    };
})();
