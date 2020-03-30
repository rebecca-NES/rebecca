(function() {
    function ShortenURLInfo() {
        var _self = this;

        _self.UrlId = null;
        // URL-ID
        _self.DisplayedURL = null;
        // 表示用URL
        _self.ShortenPath = null;
        // 短縮パス
        _self.OriginalURL = null;
        // オリジナルURL

        _self._expandedURL = null;
        // 今回不使用
    };
    
    var _proto = ShortenURLInfo.prototype;

    ShortenURLInfo.create = function() {
        var _shortenURLInfo = new ShortenURLInfo();
        return _shortenURLInfo;
    }
    // URL-ID
    _proto.setUrlId = function(urlId) {
        if (urlId == null || typeof urlId != 'string') {
            return;
        }
        this.UrlId = urlId;
    }

    _proto.getUrlId = function() {
        return this.UrlId;
    }
    // DisplayURL
    _proto.setDisplayedURL = function(displayedURL) {
        if (displayedURL == null || typeof displayedURL != 'string') {
            return;
        }
        this.DisplayedURL = displayedURL;
    };

    _proto.getDisplayedURL = function() {
        return this.DisplayedURL;
    };

    // ShortenPath
    _proto.setShortenPath = function(shortenPath) {
        if (shortenPath == null || typeof shortenPath != 'string') {
            return;
        }
        this.ShortenPath = shortenPath;
    };

    _proto.getShortenPath = function() {
        return this.ShortenPath;
    };

    // OriginalURL
    _proto.setOriginalURL = function(originalURL) {
        if (originalURL == null || typeof originalURL != 'string') {
            return;
        }
        this.OriginalURL = originalURL;
    };

    _proto.getOriginalURL = function() {
        return this.OriginalURL;
    };

    // ExpandedURL
    _proto.setExpandedURL = function(expandedURL) {
        if (expandedURL == null || typeof expandedURL != 'string') {
            return;
        }
        this.ExpandedURL = expandedURL;
    };

    _proto.getExpandedURL = function() {
        return this.ExpandedURL;
    };
    exports.create = ShortenURLInfo.create;
})();
