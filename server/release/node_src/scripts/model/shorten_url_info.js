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
(function() {
    function ShortenURLInfo() {
        var _self = this;

        _self.UrlId = null;
        _self.DisplayedURL = null;
        _self.ShortenPath = null;
        _self.OriginalURL = null;

        _self._expandedURL = null;
    };

        var _proto = ShortenURLInfo.prototype;

    ShortenURLInfo.create = function() {
        var _shortenURLInfo = new ShortenURLInfo();
        return _shortenURLInfo;
    }
    _proto.setUrlId = function(urlId) {
        if (urlId == null || typeof urlId != 'string') {
            return;
        }
        this.UrlId = urlId;
    }

    _proto.getUrlId = function() {
        return this.UrlId;
    }
    _proto.setDisplayedURL = function(displayedURL) {
        if (displayedURL == null || typeof displayedURL != 'string') {
            return;
        }
        this.DisplayedURL = displayedURL;
    };

    _proto.getDisplayedURL = function() {
        return this.DisplayedURL;
    };

    _proto.setShortenPath = function(shortenPath) {
        if (shortenPath == null || typeof shortenPath != 'string') {
            return;
        }
        this.ShortenPath = shortenPath;
    };

    _proto.getShortenPath = function() {
        return this.ShortenPath;
    };

    _proto.setOriginalURL = function(originalURL) {
        if (originalURL == null || typeof originalURL != 'string') {
            return;
        }
        this.OriginalURL = originalURL;
    };

    _proto.getOriginalURL = function() {
        return this.OriginalURL;
    };

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
