(function() {
    var qs = require('querystring');
    var ServerLog = require('../../scripts/controller/server_log');
    var Conf = require('../../scripts/controller/conf');

    var _log = ServerLog.getInstance();
    var _conf = Conf.getInstance();

    //定数

    /**
     * ページネーションの表示を作成する
     * @param {number} allCount 全件数
     * @param {number} perPage ページあたりの表示件数
     * @param {number} pageNumber 現在のページ番号
     * @param {Array} opts オプション配列 [?page=ページ番号]の後ろに付加情報を付ける場合に使用する
     * @returns {String} 置換後の文字列全体
     */
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

        //prevボタン
        if (_settings['prev_text'] && _settings['current'] && 1 < _settings['current']) {
            _link = _settings["base"].replace("%_%", _settings["format"]);
            _link = _link.replace("%#%", _settings["current"] - 1);
            _pageLinks.push('<li><a class="prev" href="' + _link + _settings["add_args"] + '">' + _settings["prev_text"] + '</a></li>');
        }
        //numberボタン
        for (var _i = 1; _i <= _settings["total"]; _i++) {
            var _ndisplay = _i;
            if (_i === _settings["current"]) {
                //_pageLinks.push('<li class="active"><a href="' + _link + _settings["add_args"] + '">' + _ndisplay + '</a></li>');
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
                    //page数が多い場合、「...」でページ間を省略する
                    _pageLinks.push('<li class="disabled"><a href="#">&#8230;</a></li>');
                    _dots = false;
                }
            }
        }
        //nextボタン
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
