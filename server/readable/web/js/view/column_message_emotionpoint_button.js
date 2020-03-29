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
function ColumnMessageEmotionPointButton(htmlElement, parent, itemId, emotionPointList, isToolTipOwner) {
    this._htmlElement = htmlElement;
    this._parent = parent;
    this._itemId = itemId;
    this._emotionPointList = emotionPointList;
    this._count = 0;
    if(isToolTipOwner != false) {
        isToolTipOwner = true;
    }
    this._isToolTipOwner = isToolTipOwner
    this._createEventHandler();
};(function() {
    ColumnMessageEmotionPointButton.prototype = $.extend({}, ViewCore.prototype);
    var _proto = ColumnMessageEmotionPointButton.prototype;
    _proto.cleanup = function() {
        var _self = this;
        var _rootElement = _self.getHtmlElement();
        _rootElement.off();
        this._htmlElement = null;
        this._parent = null;
        this._itemId = null;
        this._emotionPointList = null;
        this._isToolTipOwner = null;
    };
    ColumnMessageEmotionPointButton.getHtml = function(emotionPointList, emotionIcons) {
        var _ret = '';
        var loginUserEmotion = emotionPointList.getByJid(LoginUser.getInstance().getJid());
        var count = getSumEmotionPoint(emotionPointList);
        _ret += '<div class="frm-emote popup_emotion_list">';
        _ret += '<a class="popup_btn ico_btn" data-toggle="tooltip" data-container="body" data-original-title="' + Resource.getMessage('data_modal_emotion') + '">';
        if (count > 0) {
            _ret += '<i class="fa fa-heart" style="color:'+getIconOpacity(count)+'"></i></a>';
        } else {
            _ret += '<i class="fa fa-heart-o"></i></a>';
        }
        _ret += '<ul class="popup_list">';
        var noSelectedString = emotionIcons[0] ? emotionIcons[0] : "なし";
        if (!loginUserEmotion) {
            _ret += '<li><a class="txt_btn selected" data-emote=0>'+noSelectedString+'</a></li>';
        } else {
            _ret += '<li><a class="txt_btn" data-emote=0>'+noSelectedString+'</a></li>';
        }
        for (var key in emotionIcons) {
            if ( key==0 ) {
                continue;
            }
            if(ViewUtils.isAttachmentUrl(emotionIcons[key], emotionIcons[key])){
                if (loginUserEmotion && key == loginUserEmotion.getEmotionPoint()) {
                    _ret += '<li><a class="txt_btn selected" data-emote='+key+'>';
                } else {
                    _ret += '<li><a class="txt_btn" data-emote='+key+'>';
                }
                _ret += key+'ポイント<img class="image-thumbnail clickable" title="' + emotionIcons[key] + '" data-url="' + emotionIcons[key] + '"/>';
                _ret += '</a></li>';
            } else {
                if (loginUserEmotion && key == loginUserEmotion.getEmotionPoint()) {
                    _ret += '<li><a class="txt_btn selected" data-emote='+key+'>'+emotionIcons[key]+'('+key+'ポイント)</a></li>';
                } else {
                    _ret += '<li><a class="txt_btn" data-emote='+key+'>'+emotionIcons[key]+'('+key+'ポイント)</a></li>';
                }
            }
        }
        _ret += '</ul>';
        if(count == 0){
            _ret += '<span class="good-job-counter not-read-message txt_btn" data-toggle="tooltip" title="" data-container="body" data-original-title="' + Resource.getMessage('data_modal_emotion') + '">';
        }else{
            _ret += '<span class="good-job-counter not-read-message txt_btn">';
        }
        _ret += '' + count;
        _ret += '</span>';
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
    function getIconOpacity(sumPoint) {
        if (sumPoint <= 25) {
            return "#FDB1B1";
        } else if (sumPoint <= 50) {
            return "#FC5C5C"
        } else if (sumPoint <= 75) {
            return "#FB0000"
        } else {
            return "#D00000"
        }
    }
    _proto.getParent = function() {
        return this._parent;
    };
    _proto._createEventHandler = function() {
        var _self = this;
        var _rootElement = _self.getHtmlElement();
        _rootElement.find('.popup_list li').on('click', function() {
            _self._parent.sendEmotionPoint($(this).find('a').data("emote"));
        });
        _rootElement.find('span.good-job-counter').on('click', function(e) {
            _rootElement.children('.mTip').hide();
            _self.showEmotionPointUserList();
            e.stopPropagation();
        });
        TooltipView.getInstance().createGoodJobTooltip(_rootElement, _self._getEmotionPointList(), _self._isToolTipOwner);
    };
    _proto._getEmotionPointList = function() {
        var _self = this;
        if(_self._itemId == null) {
            return null;
        }
        var _message = _self.getParent().getMessage();
        if(_message == null) {
            return null;
        }
        _self._emotionPointList = _message.getEmotionPointList();
        return _self._emotionPointList;
    }
    _proto.showEmotionPointUserList = function() {
        var _self = this;
        var _emotionPointList = _self._getEmotionPointList();
        var _count = _emotionPointList.getCount();
        if(_count == 0){
            return;
        }
        var _dialogPersonListView = new DialogEmotionPointPersonListView(
            _self._itemId, _self._emotionPointList,
            _self.getParent().getMessage().getEmotionIconList());
        ColumnManager.getInstance().showPersonListDialog(_dialogPersonListView);
    }
    _proto.onEmotionPointReceive = function() {
        var _self = this;
        var _rootElement = _self.getHtmlElement();
        var _emotionPointList = _self._getEmotionPointList();

        var afterHtmlElem = ColumnMessageEmotionPointButton.getHtml(_emotionPointList, _self.getParent().getMessage().getEmotionIconList());
        _rootElement.children('*').off();
        _rootElement.children().remove();
        _rootElement.append($(afterHtmlElem).children());
        _self._createEventHandler();

        $(_rootElement).find('[data-toggle="tooltip"]').tooltip({
          trigger: 'hover'
        });

        if (getSumEmotionPoint(_emotionPointList)) {
            $(_rootElement).find('.good-job-counter').attr({
                'data-original-title': ''
            });
        }

        if (_self._emotionPointList._length != 0) {
            ViewUtils.animateCss(_rootElement.find('a.popup_btn'), 'rubberBand');
        }

        var _messageThumbnailElement = _rootElement.find('img.image-thumbnail');
        _messageThumbnailElement.each(function(index, el) {
            var _element = $(el);
            if(!_element.attr('src')) {
                var url = _element.attr('data-url');
                CubeeController.getInstance().downloadThumbnailImage(url, "item", _element);
            }
        });
    };
})();
