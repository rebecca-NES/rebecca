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

package jp.co.nec.necst.spf.globalSNS.Data.MessageFilter;

import jp.co.nec.necst.spf.globalSNS.GlobalSNSUtils;
import jp.co.nec.necst.spf.globalSNS.ContextHub.PublicMessageQuestionnaireStoreDbHelper;

import org.dom4j.Element;
import org.jivesoftware.util.Log;

public class QuestionnaireMessageColumnTypeCondition extends MessageFilterCondition {

    private int mMsgType = -1;
    protected String mMatchColumn = null;

    @SuppressWarnings("deprecation")
    @Override
    public String toSqlWhereSectionString() {
        String ret = "";
        if (mMsgType < 0) {
            Log.error("QuestionnaireMessageColumnTypeCondition#toSqlWhereSectionString::mJid is invalid");
            return ret;
        }
        if(mMatchColumn == null) {
            Log.error("QuestionnaireMessageColumnTypeCondition#toSqlWhereSectionString::mMatchColumn is invalid");
            return ret;
        }
        String sqlMatchColumnStr = GlobalSNSUtils.escapeSqlData(mMatchColumn);
        String questionnaireItemIdSelectSQL = PublicMessageQuestionnaireStoreDbHelper.getQuestionnaireItemIdListSelectSqlMsgTypeOrder(mMsgType);
        if (questionnaireItemIdSelectSQL == null || questionnaireItemIdSelectSQL.equals("")) {
            ret = "FALSE";
        } else {
            ret = "(" + sqlMatchColumnStr + " IN ("
                    + questionnaireItemIdSelectSQL + "))";
        }
        return ret;
    }

    @Override
    public boolean setDataFromElement(Element element) {
        return true;
    }

    @SuppressWarnings("deprecation")
    public boolean setData(int msgType, String matchColumn) {
        if (msgType < 0) {
            Log.error("QuestionnaireMessageColumnTypeCondition#setData::msgType is null");
            return false;
        }
        if (matchColumn == null) {
            Log.error("QuestionnaireMessageColumnTypeCondition#setData::matchColumn is null");
            return false;
        }
        if (matchColumn.equals("")) {
            Log.error("QuestionnaireMessageColumnTypeCondition#setData::matchColumn is empty");
            return false;
        }
        mMsgType = msgType;
        mMatchColumn = matchColumn;
        return true;
    }

}
