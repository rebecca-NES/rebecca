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

package jp.co.nec.necst.spf.globalSNS.WebSocketServer.WebSocketApi;

import java.util.List;

public class MessageNotificationApi extends NotificationApi {
    public Content content;

    public MessageNotificationApi() {
        notify = "Notification";
    }
    
    public class Content{
        public int allCount = 0;
        public int count = 0;
        public Extras extras;
        public List<Message> items;

        public class Extras{
            public int subType = 0;
        }

        public class Message{
            public String type = "Message";
            public int subType = 0;
        }
        
        public class MessageDetail extends Message {
            public String itemId = "";
            public String from = "";
            public String fromName = "";
            public String to = "";
            public String groupName = "";
            public String title = "";
            public String body = "";
            public int status = 0;
            public String createdAt = "";
            public String updatedAt = "";
        }
    }


}
