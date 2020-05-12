(function() {
    // Unused variable Utils.
    // var Utils = require('../utils');

    /**
     * @class 登録するコンタクトデータ
     */
    function RegisteredContactData() {
        var _self = this;
        // タイプ
        _self._type = RegisteredContactData.TYPE_NONE;
    };

    // 定数定義
    // コンタクト登録種別
    RegisteredContactData.TYPE_NONE = 'none';
    RegisteredContactData.TYPE_ALL = 'all';
    RegisteredContactData.TYPE_CUSTOM = 'custom';

    var _proto = RegisteredContactData.prototype;
    
    RegisteredContactData.create = function() {
        return new RegisteredContactData();
    };

    // タイプ
    _proto.getType = function() {
        return this._type;
    };
    _proto.setType = function(type) {
        if(type == null || typeof type != 'string') {
            return;
        }
        this._type = type;
    };
    _proto.cleanUp = function() {
        var _self = this;
        // タイプ
        _self._type = RegisteredContactData.TYPE_NONE;
    };

    exports.create = RegisteredContactData.create;
    exports.TYPE_NONE = RegisteredContactData.TYPE_NONE;
    exports.TYPE_ALL = RegisteredContactData.TYPE_ALL;
    exports.TYPE_CUSTOM = RegisteredContactData.TYPE_CUSTOM;
})();
