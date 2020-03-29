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
    var qs = require('querystring');
    var ServerLog = require('../../scripts/controller/server_log');
    var Conf = require('../../scripts/controller/conf');

    var _log = ServerLog.getInstance();
    var _conf = Conf.getInstance();


    function paginate(allCount, perPage, pageNumber, opts) {
        var _dots = false;
        var _link = '';
        var _settings = {};
        var _pageLinks = [];
        opts = opts || {}
        _settings['base'] = '%_%';
        _settings['format'] = '?page=%#%';
        _settings['total'] = parseInt(Math.ceil(allCount / perPage));
        _settings['current'] = parseInt(pageNumber);
        _settings['show_all'] = false;
        _settings['prev_next'] = true;
        _settings['prev_text'] = '&laquo';
        _settings['next_text'] = '&raquo';
        _settings['end_size'] = 1;
        _settings['mid_size'] = 1;
        _settings['add_args'] = parseAdditionalArgs(opts.add_args || '');

        if (_settings['prev_text'] && _settings['current'] && 1 < _settings['current']) {
            _link = _settings["base"].replace("%_%", _settings["format"]);
            _link = _link.replace("%#%", _settings["current"] - 1);
            _pageLinks.push('<li><a class="prev" href="' + _link + _settings["add_args"] + '">' + _settings["prev_text"] + '</a></li>');
        }
        for (var _i = 1; _i <= _settings["total"]; _i++) {
            var _ndisplay = _i;
            if (_i === _settings["current"]) {
                _pageLinks.push('<li class="active"><a href="#">' + _ndisplay + '</a></li>');
                _dots = true;
            } else {
                if (_settings["show_all"] || (_i <= _settings["end_size"]
                    || (_settings["current"] && _i >= _settings["current"] - _settings["mid_size"] && _i <= _settings["current"] + _settings["mid_size"])
                    || _i > _settings["total"] - _settings["end_size"])) {
                    _link = _settings["base"].replace("%_%", _settings["format"]);
                    _link = _link.replace("%#%", _i);
                    _pageLinks.push('<li><a href="' + _link + _settings["add_args"] + '">' + _ndisplay + '</a></li>');
                    _dots = true;
                } else if (_dots && !_settings["show_all"]) {
                    _pageLinks.push('<li class="disabled"><a href="#">&#8230;</a></li>');
                    _dots = false;
                }
            }
        }
        if (_settings["prev_next"] && _settings["current"] && (_settings["current"] < _settings["total"] || -1 === _settings["total"])) {
            _link = _settings["base"].replace("%_%", _settings["format"]);
            _link = _link.replace("%#%", parseInt(_settings["current"]) + 1);
            _pageLinks.push('<li><a class="next" href="' + _link + _settings["add_args"] + '">' + _settings["next_text"] + '</a></li>');
        }
        return '<div class="pagination pagination-centered"><ul>' + _pageLinks.join("\n") + '</ul></div>';
    };

    function parseAdditionalArgs(args){
        return args == '' ? args: '&' + qs.encode(args);
    };

    exports.paginate = paginate;

})();
