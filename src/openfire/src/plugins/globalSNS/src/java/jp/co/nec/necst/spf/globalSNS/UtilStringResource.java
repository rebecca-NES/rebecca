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

package jp.co.nec.necst.spf.globalSNS;

import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

public class UtilStringResource {
    private static UtilStringResource mInstance = null;
    
    public static UtilStringResource getInstance() {
        if(mInstance == null) {
            mInstance = new UtilStringResource();
        }
        return mInstance;
    }
    
    private UtilStringResource() {
        createStringResource();
    }
    
    public String getString(String key, Locale locale) {
        return getJaString(key);
    }
    
    
    private String getJaString(String key) {
        return mStringResourceMapJa.get(key);
    }
    
    private String getEnString(String key) {
        return mStringResourceMapEn.get(key);
    }
    private final static Map<String, String> mStringResourceMapJa = new ConcurrentHashMap<String, String>();
    
    private final static Map<String, String> mStringResourceMapEn = new ConcurrentHashMap<String, String>();
    
    private void createStringResource() {
        int enCount = mStringResourceEn.length;
        for(int i = 0; i < enCount; i++) {
            mStringResourceMapEn.put(mStringResourceEn[i][0], mStringResourceEn[i][1]);
        }
        int jaCount = mStringResourceJa.length;
        for(int i = 0; i < jaCount; i++) {
            mStringResourceMapJa.put(mStringResourceJa[i][0], mStringResourceJa[i][1]);
        }
    }
    
    private final static String[][] mStringResourceJa = {
        {"addTaskSystemMessage","%sさんに以下のタスクが割り当てられました\n タスク名:%s"},
        {"finishTaskSystemMessage","以下のタスクを完了しました\n タスク名:%s"},
        
        {"systemMessageAddTask","タスクを追加しました。\nタスク名：%s\n担当者：%s"},
        {"systemMessageAddTaskSelfAndOthers","タスクを追加し、他%s名に依頼しました。\nタスク名：%s\n担当者：%s、他%s名"},
        {"systemMessageAddTaskMulitiOwner","タスクを追加しました。\nタスク名：%s\n担当者：%s名"},
        {"systemMessageRequestTask","タスクを依頼しました。\nタスク名：%s\n担当者：%s"},
        {"systemMessageRequestTaskMulitiOwner","タスクを依頼しました。\nタスク名：%s\n担当者：%s名"},
        {"systemMessageBeAddedTask","タスクが追加されました。\nタスク名：%s\n担当者：%s\n作成者：%s"},
        {"systemMessageBeAddedTaskMulitiOwner","タスクが追加されました。\nタスク名：%s\n担当者：%s名\n作成者：%s"},
        {"systemMessageBeRequestedTask","タスクを依頼されました。\nタスク名：%s\n依頼者：%s"},
        {"systemMessageFinishTask","タスクを終了しました。\nタスク名：%s\n担当者：%s"},
        {"systemMessageFinishTaskSelfAndOthers","タスクを終了しました。\nタスク名：%s\n担当者：%s、他%s名"},
        {"systemMessageFinishTaskMulitiOwner","タスクを終了しました。\nタスク名：%s\n担当者：%s名"},
        {"systemMessageBeFinishedTask","タスクが終了されました。\nタスク名：%s\n担当者：%s\n更新者：%s"},
        {"systemMessageBeFinishedTaskMulitiOwner","タスクが終了されました。\nタスク名：%s\n担当者：%s名\n更新者：%s"},
        {"systemMessageBeFinishedRequestTask","タスクが終了されました。\nタスク名：%s\n依頼者：%s"},
        {"systemMessageRejectTask","タスクを却下しました。\nタスク名：%s\n担当者：%s"},
        {"systemMessageRejectTaskSelfAndOthers","タスクを却下しました。\nタスク名：%s\n担当者：%s、他%s名"},
        {"systemMessageRejectTaskMulitiOwner","タスクを却下しました。\nタスク名：%s\n担当者：%s名"},
        {"systemMessageBeRejectedTask","タスクが却下されました。\nタスク名：%s\n担当者：%s\n更新者：%s"},
        {"systemMessageBeRejectedTaskMulitiOwner","タスクが却下されました。\nタスク名：%s\n担当者：%s名\n更新者：%s"},
        {"systemMessageBeRejectedRequestTask","タスクが却下されました。\nタスク名：%s\n依頼者：%s"},
        {"finishTaskSystemMessage_ver20130325","以下のタスクを完了しました\n タスク名:%s\n 担当者:%s"},
        {"systemMessageDeleteTask","タスクを削除しました。\nタスク名：%s\n削除者：%s"},
        {"systemMessageBeDeletedTask","タスクが削除されました。\nタスク名：%s\n削除者：%s"},
        {"systemMessageRejectTask_ver20150826","以下のタスクを却下しました\n タスク名:%s\n 担当者:%s"},
    };
    
    private final static String[][] mStringResourceEn = {
        {"addTaskSystemMessage","The following a tasks was assigned to %s.\n TaskTitle:%s"},
        {"finishTaskSystemMessage","The following a tasks has been finished.\n TaskTitle:%s"},

        {"systemMessageAddTask","You created a new task.\nTask Title: %s\nOwner: %s"},
        {"systemMessageAddTaskSelfAndOthers","You created a new task and requested a task %s Other\nTask Title: %s\nOwner: %s, and %s Other"},
        {"systemMessageAddTaskMulitiOwner","You created a new task.\nTask Title: %s\nOwner: %s people"},
        {"systemMessageRequestTask","You requested a task.\nTask Title: %s\nOwner: %s"},
        {"systemMessageRequestTaskMulitiOwner","You requested a task.\nTask Title: %s\nOwner: %s people"},
        {"systemMessageBeAddedTask","A task was added.\nTask Title: %s\nOwner: %s\nCreate: %s"},
        {"systemMessageBeAddedTaskMulitiOwner","A task was added.\nTask Title: %s\nOwner: %s people\nCreate: %s"},
        {"systemMessageBeRequestedTask","You are requested a task.\nTask Title: %s\nClient: %s"},
        {"systemMessageFinishTask","You finished a task.\nTask Title: %s\nOwner: %s"},
        {"systemMessageFinishTaskSelfAndOthers","You finished a task.\nTask Title: %s\nOwner: %s, and %s Other"},
        {"systemMessageFinishTaskMulitiOwner","You finished a task.\nTask Title: %s\nOwner: %s people"},
        {"systemMessageBeFinishedTask","A task was finished.\nTask Title: %s\nOwner: %s\nUpdate: %s"},
        {"systemMessageBeFinishedTaskMulitiOwner","A task was finished.\nTask Title: %s\nOwner: %s people\nUpdate: %s"},
        {"systemMessageBeFinishedRequestTask","A task was finished.\nTask Title: %s\nClient：%s"},
        {"systemMessageRejectTask","You rejected a task.\nTask Title: %s\nOwner: %s"},
        {"systemMessageRejectTaskSelfAndOthers","You rejected a task.\nTask Title: %s\nOwner: %s, and %s Other"},
        {"systemMessageRejectTaskMulitiOwner","You rejected a task.\nTask Title: %s\nOwner: %s people"},
        {"systemMessageBeRejectedTask","A task was rejected.\nTask Title: %s\nOwner: %s\nUpdate: %s"},
        {"systemMessageBeRejectedTaskMulitiOwner","A task was rejected.\nTask Title: %s\nOwner: %s people\nUpdate: %s"},
        {"systemMessageBeRejectedRequestTask","A task was rejected.\nTask Title: %s\nClient：%s"},
        {"finishTaskSystemMessage_ver20130325","The following a tasks has been finished.\n TaskTitle:%s\n Owner: %s"},
        {"systemMessageDeleteTask","You deleted the task.\nTask Title: %s\nDeleter: %s"},
        {"systemMessageBeDeletedTask","The task deleted.\nTask Title: %s\nDeleter: %s"},
        {"systemMessageRejectTask_ver20150826","The following a tasks has been rejected.\n TaskTitle:%s\n Owner: %s"},
    };
}
