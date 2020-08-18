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

package jp.co.nec.necst.spf.globalSNS.Data;

import java.math.BigInteger;

public class QuestionnaireOptionInfo {
    private BigInteger mId;
    private String mItemId;
    private String mOption;

    public QuestionnaireOptionInfo() {
        mId = BigInteger.ZERO;
        mItemId = "";
        mOption = "";
    }

    public QuestionnaireOptionInfo(
            QuestionnaireOptionInfo questionnaireOptionInfo) {
        mId = questionnaireOptionInfo.getId();
        mItemId = questionnaireOptionInfo.getItemId();
        mOption = questionnaireOptionInfo.getOption();
    }

    public BigInteger getId() {
        return mId;
    }

    public void setId(BigInteger id) {
        mId = id;
    }

    public String getItemId() {
        return mItemId;
    }

    public void setItemId(String itemId) {
        mItemId = itemId;
    }

    public String getOption() {
        return mOption;
    }

    public void setOption(String option) {
        mOption = option;
    }

}
