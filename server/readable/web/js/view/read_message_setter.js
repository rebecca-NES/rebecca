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
function ReadMessageSetter() {
};(function() {

    ReadMessageSetter.setReadMessage = function(message){
        if(message == null){
            return;
        }
        if(message.getReadFlag() == Message.READ_STATUS_READ){
            return;
        }
        var _itemId = message.getItemId();
        if(_itemId == null || _itemId == ''){
            return;
        }
        var _ret = CubeeController.getInstance().sendSetReadOneMessage(_itemId, _callback);

        if(_ret){
            var responseItemId = _itemId;

            var _notification = _createSetReadMessageNotificationForNotifyToMySelf(responseItemId);

            message.setReadFlag(Message.READ_STATUS_READ);
            var _existingReaderItem = _notification.getExistingReaderItem();
            var _existingReaderInfo = message.getExistingReaderInfo();
            if(_existingReaderInfo == null){
                _existingReaderInfo = new MessageExistingReaderInfo();
                _existingReaderInfo.setAllCount(1);
                _existingReaderInfo.getExistingReaderItemList().add(_existingReaderItem);
                message.setExistingReaderInfo(_existingReaderInfo);
            }else{
                var _count = _existingReaderInfo.getAllCount();
                _existingReaderInfo.setAllCount(_count + 1);
                _existingReaderInfo.getExistingReaderItemList().removeAll();
                _existingReaderInfo.getExistingReaderItemList().add(_existingReaderItem);
            }

            ColumnManager.getInstance().onNotification(_notification);
        } else {
            throw 'faild to send ExistingRead Message:';
        }

        function _callback(responseItemId){
        }

        function _createSetReadMessageNotificationForNotifyToMySelf(itemId){
            var _jid = LoginUser.getInstance().getJid();
            var _person = CubeeController.getInstance().getPersonData(_jid);

            var _existingReaderItem = new ExistingReaderItem();
            _existingReaderItem.setPerson(_person);
            _existingReaderItem.setDate(new Date()); 

            var _setReadMessageNotification = new SetReadMessageNotification();
            _setReadMessageNotification.setItemId(itemId);
            _setReadMessageNotification.setExistingReaderItem(_existingReaderItem);

            return _setReadMessageNotification;
        }
    };
})();
