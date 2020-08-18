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

package jp.co.nec.necst.spf.globalSNS.SmartDeviceNotification;

import java.io.UnsupportedEncodingException;
import java.net.URLDecoder;

import jp.co.nec.necst.spf.globalSNS.ContextHub.SystemConfDbHelper;


public class SmartDeviceNoticeInfo {

    private final int version = 2;

    private content content;

    public int getVersion() {
        return version;
    }

    public content getContent() {
        return content;
    }

    public void setContent(content content) {
        this.content = content;
    }

    public class content {

        public static final int TYPE_MESSAGE = 1;
        public static final int TYPE_GROUP_CHAT_CREATE = 2;
        public static final int TYPE_GROUP_CHAT_ADD_MEMBER = 3;

        private int type;

        private String serverURL = SystemConfDbHelper.getValue(SystemConfDbHelper.SystemConfKey.SERVER_URL);

        private messageNotice messageNotice;

        public int getType() {
            return type;
        }

        public void setType(int type) {
            this.type = type;
        }

        public String getServerURL() {
            return serverURL;
        }

        public messageNotice getMessageNotice() {
            return messageNotice;
        }

        public void setMessageNotice(messageNotice messageNotice) {
            this.messageNotice = messageNotice;
        }

        public class messageNotice {

            private int messageType;

            private boolean isWF;

            private String fromJid;

            private int status;

            private entry entry;

            private toInfo toInfo;

            private roomInfo roomInfo;

            public int getMessageType() {
                return messageType;
            }

            public void setMessageType(int messageType) {
                this.messageType = messageType;
            }
            
            public boolean getIsWF() {
                return isWF;
            }
            
            public void setIsWF(boolean isWF) {
                this.isWF = isWF;
            }

            public String getFromJid() {
                return fromJid;
            }

            public void setFromJid(String fromJid) {
                this.fromJid = fromJid;
            }

            public int getStatus() {
                return status;
            }

            public void setStatus(int status) {
                this.status = status;
            }

            public entry getEntry() {
                return entry;
            }

            public void setEntry(entry entry) {
                this.entry = entry;
            }

            public toInfo getToInfo() {
                return toInfo;
            }

            public void setToInfo(toInfo toInfo) {
                this.toInfo = toInfo;
            }

            public roomInfo getRoomInfo() {
                return roomInfo;
            }

            public void setRoomInfo(roomInfo roomInfo) {
                this.roomInfo = roomInfo;
            }

            public class entry {

                private String title;

                private String body;
                
                public String getTitle() {
                    return title;
                }

                public void setTitle(String title) {
                    this.title = title;
                }

                public String getBody() {
                    return body;
                }

                public void setBody(String body) {
                    String decodedBody = (body==null? "":body);
                    try {
                        decodedBody = URLDecoder.decode(decodedBody, "UTF-8");
                    } catch (UnsupportedEncodingException e) {
                    }
                    this.body = decodedBody;
                }
            }

            public class toInfo {

                private String jid;

                private String nickname;

                public String getJid() {
                    return jid;
                }

                public void setJid(String jid) {
                    this.jid = jid;
                }

                public String getNickname() {
                    return nickname;
                }

                public void setNickname(String nickname) {
                    this.nickname = nickname;
                }
            }

            public class roomInfo {

                private String roomId;

                private String roomName;

                public String getRoomId() {
                    return roomId;
                }

                public void setRoomId(String roomId) {
                    this.roomId = roomId;
                }

                public String getRoomName() {
                    return roomName;
                }

                public void setRoomName(String roomName) {
                    this.roomName = roomName;
                }
            }
        }
    }
}
