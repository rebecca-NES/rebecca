(function() {
    var fs = require('fs');
    var path = require('path');
    var ServerLog = require('./server_log');

    // ServerLogクラスインスタンス取得
    var _log = ServerLog.getInstance();

    function File() {
    }

    var _file;

    function getInstance() {
        return _file;
    }

    var _proto = File.prototype;

    /*
     * ファイルを読み出し、1行ごと配列に格納して返却
     * @param {String} filepath 読み出すファイルのパス
     * @param {function} callback 
     */
    _proto.readFile = function(filepath, callback) {
        _log.connectionLog(7, 'File.readFile:: read file ' + filepath);

        // 存在チェック
        fs.exists(filepath, function(exists) {
            var _retList = [];

            if(exists) {
                // ファイルを読み出して解析
                var _options = {
                    encoding:'utf8'
                };
                fs.readFile(filepath, _options, function(err, data) {
                    if(err) {
                        _log.connectionLog(3, 'File.readFile:: readFile error : ' + err.message);

                        var _retErr = new Error('Failed to read file');
                        callback(_retErr, _retList);
                        return;
                    }
                    var _fileData = data.toString();
                    var _fileListDatas = _fileData.split('\n');
                    var _count = _fileListDatas.length;
                    for(var _i = 0; _i < _count; _i++) {
                        var _lineData = _fileListDatas[_i];
                        var _line = _lineData.replace(/^\s+|\s+$/g, "");
                        if(_line == '') {
                            // 空の行はスキップ
                            continue;
                        }
                        _retList.push(_line);
                    }
                    callback(null, _retList);
                });
            } else {
                // ファイルが存在しない場合
                _log.connectionLog(3, 'File.readFile:: ' + filepath + ' is not exist');

                var _retErr = new Error(filepath + ' is not exist');
                callback(_retErr, _retList);
            }
        });
    }

    _file = new File();

    exports.getInstance = getInstance;
})();
