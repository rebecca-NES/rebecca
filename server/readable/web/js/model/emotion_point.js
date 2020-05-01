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
function EmotionPointList() {
    ArrayList.call(this);
};(function() {
  var Super = function Super() {
  };
  Super.prototype = ArrayList.prototype;
  EmotionPointList.prototype = new Super();
  var _super = Super.prototype;
  var _proto = EmotionPointList.prototype;
  _proto.add = function(emotionPointData) {
      var _self = this;
      if(emotionPointData == null || typeof emotionPointData != 'object') {
          return false;
      }
      if(emotionPointData.getJid == null) {
          return false;
      }
      var _jid = emotionPointData.getJid();
      if(_jid == null || _jid == '') {
          return false;
      }
      var _existEmotionPointData = _self.getByJid(_jid);
      if(_existEmotionPointData != null) {
          return false;
      }
      return _super.add.call(this, emotionPointData);
  };
  _proto.getByJid = function(jid) {
      var _self = this;
      if (jid == null || typeof jid != 'string') {
          return null;
      }
      var _retEmotionPointData = null;
      var _count = _self._length;
      for (var i = 0; i<_count; i++) {
          if (_self._array[i].getJid() == jid) {
              _retEmotionPointData = _self._array[i];
              break;
          }
      }
      return _retEmotionPointData;
  };
  _proto.removeByJid = function(jid) {
      var _self = this;
      if(jid == null || typeof jid != 'string') {
          return null;
      }
      var _retEmotionPointData = null;
      var _count = _self._length;
      for(var _i = 0; _i < _count; _i++) {
          if(_self._array[_i].getJid() == jid) {
              _retEmotionPointData = _super.remove.call(this, _i);
              break;
          }
      }
      return _retEmotionPointData;
  };
  _proto.removeAll = function() {
      _super.removeAll.call(this);
  };
})();

 function EmotionPointData() {
    Profile.call(this);
    this._jid = '';
    this._created_at = '';
    this._updated_at = '';
    this._emotion_point = '';
 }; (function() {
    EmotionPointData.prototype = $.extend({}, Profile.prototype);
    var _proto = EmotionPointData.prototype;

    _proto.getJid = function() {
        return this._jid;
    }
    _proto.setJid = function(jid) {
        if(jid == null || typeof jid != 'string') {
            return;
        }
        if(jid == '') {
            return;
        }
        this._jid = jid;
    }
    _proto.getCreatedAt = function() {
        return this._created_at;
    }
    _proto.setCreatedAt = function(created_at) {
        if(created_at == null || typeof created_at != 'object') {
            return;
        }
        if(created_at == '') {
            return;
        }
        this._created_at = created_at;
    }
    _proto.getUpdatedAt = function() {
        return this._updated_at;
    }
    _proto.setUpdatedAt = function(updated_at) {
        if(updated_at == null || typeof updated_at != 'object') {
            return;
        }
        if(updated_at == '') {
            return;
        }
        this._updated_at = updated_at;
    }
    _proto.getEmotionPoint = function() {
        return this._emotion_point;
    }
    _proto.setEmotionPoint = function(emotion_point) {
        if(emotion_point == null || typeof emotion_point != 'number') {
            return;
        }
        // Variable 'emotion_point' is of type number, but it is compared to an expression of type string.
        //if(emotion_point == '') { 
        if(emotion_point == 0) {
            return;
        }
        this._emotion_point = emotion_point;
    }
 })();
