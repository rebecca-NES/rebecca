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

package jp.co.nec.necst.spf.globalSNS.ContextHub;

import jp.co.nec.necst.spf.globalSNS.Data.Profile;
import jp.co.nec.necst.spf.globalSNS.Notification.VCardChangeNotifier;

import org.jivesoftware.util.Log;

public class VCardChangeAdapter {

    private static VCardChangeAdapter mThisInstance = null;

    private VCardChangeAdapter() {
    }

    public static VCardChangeAdapter getInstance() {
        Log.debug("do func VCardChangeAdapter.getInstance(");
        if (mThisInstance == null) {
            mThisInstance = new VCardChangeAdapter();
        }
        return mThisInstance;
    }

    @SuppressWarnings("deprecation")
    public void entryVCardData(String jid) {
        Log.debug("do func VCardChangeAdapter.entryVCardData(");
        if (jid == null || jid.equals("")) {
            Log.error("notifyVCardData : jid is invalid");
            return;
        }
        VCardChangeNotifier.getInstance().notifyVCardData(jid);
    }
    
    public void updateUserProfile(Profile profileData) {
        Log.debug("do func VCardChangeAdapter.updateUserProfile(");
        UserProfileDbHelper.updateUserProfileDataToDb(profileData, 0);
    }
}
