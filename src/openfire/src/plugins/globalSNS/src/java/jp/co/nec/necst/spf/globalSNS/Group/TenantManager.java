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

package jp.co.nec.necst.spf.globalSNS.Group;

import org.xmpp.packet.JID;


public class TenantManager {
    private static TenantManager mInstance = null;

    public static TenantManager getInstance() {
        if (mInstance == null) {
            mInstance = new TenantManager();
        }
        return mInstance;
    }

    private TenantManager() {
    }

    public boolean checkTenantAdminHasOneUser(JID tenantAdminJid, JID tenantUserJid) {
        return true;
    }
    public boolean isTenantAdmin(JID jid) {
        return true;
    }
}
