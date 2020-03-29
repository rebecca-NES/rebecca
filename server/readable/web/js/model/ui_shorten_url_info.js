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
function ShortenURLInfo() {
	this.DisplayedURL = null; 
	this.ShortenPath = null;  
	this.OriginalURL = null;  
};(function () {

    var _proto = ShortenURLInfo.prototype;

    ShortenURLInfo.create = function() {
        var _shortenURLInfo = new ShortenURLInfo();
        return _shortenURLInfo;
    };

    _proto.getDisplayedURL = function() {
        return this.DisplayedURL;
    };
    _proto.setDisplayedURL = function(displayedURL) {
        if (displayedURL == null || typeof displayedURL != 'string') {
            return;
        }
        this.DisplayedURL = displayedURL;
    };


    _proto.getShortenPath = function() {
        return this.ShortenPath;
    };
    _proto.setShortenPath = function(shortenPath) {
        if (shortenPath == null || typeof shortenPath != 'string') {
            return;
        }
        this.ShortenPath = shortenPath;
    };

    _proto.getOriginalURL = function() {
        return this.OriginalURL;
    };
    _proto.setOriginalURL = function(originalURL) {
        if (originalURL == null || typeof originalURL != 'string') {
            return;
        }
        this.OriginalURL = originalURL;
    };
})();
