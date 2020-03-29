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
window.onload = function() {
    var _isShowImage = false;
    if (window.opener) {
        var _controller = window.opener.CubeeController.getInstance();
        if (_controller) {
            var _name = window.name;
            if (_name) {
                document.title = _name;
                var _data = _controller.getImageData(_name);
                if (_data) {
                    var _imageElem = document.getElementById("imageData");
                    if (_imageElem) {
                        _imageElem.title = _name;
                        _imageElem.src = _data;
                        _controller.setImageData(_name);
                        _isShowImage = true;
                    }
                }
            }
        }
        window.opener = null;
    }
    if (!_isShowImage) {
        var _elem = document.getElementById("imageBase");
        if (_elem) {
            _elem.innerHTML = 'Failed to display the image .';
            _elem.style.color = "#F00";
        }
    }
}
