(function() {
    /**
    * tenant_store モデルクラス
    */
    function AccessRelationData() {
        // redis でのデータ型の名称
        this.REDIS_DATA_TYPE = 'string';
        // redis でのキー名
        this.REDIS_KEY_NAME = null;
        // 保持するデータ
        this._hostName = null;
    }

    /**
    * CacheCheff で使用する場合の生成メソッド
    * @param {string} hostName ホスト名
    */
    AccessRelationData.createDish = function(hostName) {
        if (!hostName || typeof hostName != 'string') {
            return null;
        }
        var _accessRelationData = new AccessRelationData();

        _accessRelationData.setHostName(hostName);

        return _accessRelationData;
    }

    var _proto = AccessRelationData.prototype;

    // キー名
    _proto.setKeyName = function(keyName) {
        this.REDIS_KEY_NAME = keyName;
    };
    _proto.getKeyName = function() {
        return this.REDIS_KEY_NAME;
    }
    // ホスト名
    _proto.setHostName = function(hostName) {
        this._hostName = hostName;
    };
    _proto.getHostName = function() {
        return this._hostName;
    }

    // 保持データ
    _proto.getData = function() {
        return this._hostName;
    }

    exports.createDish = AccessRelationData.createDish;
    exports.REDIS_DATA_TYPE = AccessRelationData.REDIS_DATA_TYPE;
    exports.REDIS_KEY_NAME = AccessRelationData.REDIS_KEY_NAME;
})();