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

import java.io.IOException;
import java.sql.SQLException;
import java.util.Properties;

import org.apache.commons.dbcp2.BasicDataSource;
import org.apache.commons.dbcp2.BasicDataSourceFactory;
import org.jivesoftware.util.Log;

import java.io.File;
import java.io.FileInputStream;

public class GlobalSNSDataBaseHelper extends AbstractDataBaseHelper {

    static private GlobalSNSDataBaseHelper mGlobalSNSDataBaseHelper = null;
    static private BasicDataSource mDs = null;
    static private String mTenantUuid = null;

    @SuppressWarnings("deprecation")
    static public boolean initialize(){
        if(mDs != null){
            return true;
        }
        Properties properties = createDbProperties();
        try {
            mTenantUuid = properties.getProperty("tenantUuid");
            if (mTenantUuid == null || mTenantUuid.isEmpty()) {
                throw new Exception("GlobalSNS plugin : Could not read tenatUuid from properties file.");
            }
            mDs = BasicDataSourceFactory.createDataSource(properties);
        } catch (Exception e) {
            Log.error(e);
            return false;
        }
        return true;
    }

    @SuppressWarnings("deprecation")
    static public void cleanUp(){
        if(mGlobalSNSDataBaseHelper == null && mDs == null){
            return;
        }
        try {
            mDs.close();
        } catch (SQLException e) {
            Log.error(e);
        } catch (NullPointerException e) {
            Log.error(e);
        }
        mDs = null;
        mGlobalSNSDataBaseHelper = null;
    }


    static public GlobalSNSDataBaseHelper getInstance() {
        if (mGlobalSNSDataBaseHelper == null) {
            if(mDs == null){
                return null;
            }
            mGlobalSNSDataBaseHelper = new GlobalSNSDataBaseHelper(false, mDs);
        }
        return mGlobalSNSDataBaseHelper;
    }

    private GlobalSNSDataBaseHelper(boolean isReferenceMode, BasicDataSource ds) {
        super(isReferenceMode,ds);
    }

    static public GlobalSNSDataBaseHelper createReferenceInstance() {
        if(mDs == null){
            return null;
        }
        return new GlobalSNSDataBaseHelper(true, mDs);
    }

    @SuppressWarnings("deprecation")
    private static Properties createDbProperties() {
        Properties properties = new Properties();

        String confFile = System.getProperty("openfireHome");
        confFile += File.separator + "conf" + File.separator + "db-globalsns.properties";
        File dbPropertiesFile = new File(confFile);

        FileInputStream is = null;
        try {
            is = new FileInputStream(dbPropertiesFile);
            properties.load(is);
        } catch (IOException e) {
            Log.error("GlobalSNS plugin : db-globalsns.properties load failed", e);
            return null;
        } finally {
            if (is != null){
                try {
                    is.close();
                } catch (IOException e) {
                    Log.error("GlobalSNS plugin : db-globalsns.properties close failed", e);
                }
            }
        }
        return properties;
    }

    static public String getTenantUuid() {
        return mTenantUuid;
    }
}
