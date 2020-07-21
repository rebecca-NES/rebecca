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

package jp.co.nec.necst.spf.globalSNS.WebSocketServer;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class WebSocketClientManager {
    private static final Logger Log = LoggerFactory
            .getLogger(WebSocketClientManager.class);

    private static WebSocketClientManager mInstance = null;

    private List<GlobalSNSWebSocket> mNotLogedInWebSocketList = null;
    private Map<String, List<GlobalSNSWebSocket>> mLogedInWebSocketMap;

    private WebSocketClientManager() {
        mNotLogedInWebSocketList = new CopyOnWriteArrayList<GlobalSNSWebSocket>();
        mLogedInWebSocketMap = new ConcurrentHashMap<String, List<GlobalSNSWebSocket>>();
    }

    public static WebSocketClientManager getInstance() {
        if (mInstance == null) {
            mInstance = new WebSocketClientManager();
        }
        return mInstance;
    }

    public void disconnectAllClient() {
        final String logPrefix = "disconnectAllClient() : ";
        for (GlobalSNSWebSocket webSocket : mNotLogedInWebSocketList) {
            if (webSocket == null) {
                Log.error(logPrefix + "webSocket is null.", new Throwable());
                continue;
            }
            webSocket.forceClose();
        }
        mNotLogedInWebSocketList.clear();
        for(Map.Entry<String, List<GlobalSNSWebSocket>> webSocketListEntry : mLogedInWebSocketMap.entrySet()) {
            List<GlobalSNSWebSocket> webSocketList = webSocketListEntry.getValue();
            for (GlobalSNSWebSocket webSocket : webSocketList) {
                if (webSocket == null) {
                    Log.error(logPrefix + "webSocket is null.", new Throwable());
                    continue;
                }
                webSocket.forceClose();
            }
            webSocketList.clear();
        }
        mLogedInWebSocketMap.clear();
    }

    public void addClientWebSocket(GlobalSNSWebSocket webSocket) {
        final String logPrefix = "addClientWebSocket() : ";
        if (webSocket == null) {
            Log.error(logPrefix + "webSocket is null.", new Throwable());
            return;
        }
        if(mNotLogedInWebSocketList.contains(webSocket)) {
            Log.warn(logPrefix + "webSocket has already been added.", new Throwable());
            return;
        }
        mNotLogedInWebSocketList.add(webSocket);
    }

    public void onLogin(GlobalSNSWebSocket globalSNSWebSocket) {
        final String logPrefix = "onLogin() : ";
        if(globalSNSWebSocket == null){
            Log.error(logPrefix + "globalSNSWebSocket is null", new Throwable());
            return;
        }
        String jid = globalSNSWebSocket.getJid();
        if(jid == null || jid.equals("")){
            Log.error(logPrefix + "jid is invalid", new Throwable());
            return;
        }
        List<GlobalSNSWebSocket> socketList = mLogedInWebSocketMap.get(jid);
        if(socketList == null){
            socketList = new ArrayList<GlobalSNSWebSocket>();
            mLogedInWebSocketMap.put(jid, socketList);
        }
        if(socketList.contains(globalSNSWebSocket)){
            Log.info(logPrefix + "This globalSNSWebSocket object already added ");
            return;
        }
        synchronized (socketList){
            socketList.add(globalSNSWebSocket);
        }
        mNotLogedInWebSocketList.remove(globalSNSWebSocket);
    }

    public void onDisconnect(GlobalSNSWebSocket globalSNSWebSocket){
        final String logPrefix = "onDisconnect() : ";
        if(globalSNSWebSocket == null){
            Log.error(logPrefix + "globalSNSWebSocket is null", new Throwable());
            return;
        }
        String jid = globalSNSWebSocket.getJid();
        if(jid == null || jid.equals("")){
            mNotLogedInWebSocketList.remove(globalSNSWebSocket);
            return;
        }
        List<GlobalSNSWebSocket> socketList = mLogedInWebSocketMap.get(jid);
        if(socketList == null){
            return;
        }
        synchronized (socketList){
            socketList.remove(globalSNSWebSocket);
            if(socketList.isEmpty()){
                mLogedInWebSocketMap.remove(jid);
            }
        }
    }

    public List<GlobalSNSWebSocket> getWebSocketList(String jid) {
        if(jid == null || "".equals(jid)){
            Log.error("getWebSocketList() : jid is invalid", new Throwable());
            return null;
        }
        return mLogedInWebSocketMap.get(jid);
    }

}
