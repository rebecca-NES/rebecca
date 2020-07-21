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

import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;

import org.apache.commons.dbcp2.BasicDataSource;
import org.jivesoftware.util.Log;

public abstract class AbstractDataBaseHelper {

    private Connection mConnection = null;
    private BasicDataSource mDataSource = null;
    private boolean mIsReferenceMode = false;

    protected AbstractDataBaseHelper(boolean isReferenceMode, BasicDataSource ds) {
        mIsReferenceMode = isReferenceMode;
        mDataSource = ds;
    }

    @SuppressWarnings("deprecation")
    public boolean open() {
        if (mConnection == null) {
            try {
                mConnection = mDataSource.getConnection();
            } catch (SQLException e) {
                Log.error(e);
                return false;
            }
        }
        return true;
    }

    @SuppressWarnings("deprecation")
    public void close() {
        try {
            if (mConnection != null) {
                mConnection.close();
                mConnection = null;
            }
        } catch (SQLException e) {
            Log.error(e);
        }
    }

    @SuppressWarnings("deprecation")
    public boolean execute(String sql) {
        if (mConnection == null) {
            Log.error("Global SNS DataBase is not connected.");
            return false;
        }
        try {
            Statement statement = mConnection.createStatement();
            return statement.execute(sql);
        } catch (SQLException e) {
            String errorMessage = "Global SNS Plugin::error in DataBase execute (sql="
                    + sql + ") (exception=" + e.toString();
            Log.error(errorMessage);
        }
        return false;
    }

    @SuppressWarnings("deprecation")
    public ResultSet executeQuery(String sql) {
        if (mConnection == null) {
            Log.error("Global SNS DataBase is not connected.");
            return null;
        }
        try {
            Statement statement = mConnection.createStatement(ResultSet.TYPE_SCROLL_INSENSITIVE,ResultSet.CONCUR_READ_ONLY);
            return statement.executeQuery(sql);
        } catch (SQLException e) {
            String errorMessage = "Global SNS Plugin::error in DataBase executeQuery (sql="
                    + sql + ") (exception=" + e.toString();
            Log.error(errorMessage);
        }
        return null;
    }

    public int executeInsert(String sql) {
        return executeUpdate(sql);
    }

    @SuppressWarnings("deprecation")
    public int executeUpdate(String sql) {
        if (mConnection == null) {
            Log.error("Global SNS DataBase is not connected.");
            return -1;
        }
        if(mIsReferenceMode) {
            Log.error("This connection is Refference Mode. So, Can't INSERT, UPDATE and DELETE.");
            return -1;
        }

        try {
            Statement statement = mConnection.createStatement();
            return statement.executeUpdate(sql);
        } catch (SQLException e) {
            String errorMessage = "Global SNS Plugin::error in DataBase executeUpdate (sql="
                    + sql + ") (exception=" + e.toString();
            Log.error(errorMessage);
        }
        return -1;
    }

    public int executeDelete(String sql) {
        return executeUpdate(sql);
    }

    public int executeCreateTable(String sql) {
        return executeUpdate(sql);
    }

    public int executeAlterTable(String sql) {
        return executeUpdate(sql);
    }
}
