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

public class PublicMessageQuestionnaireInfo {
    private BigInteger mId;
    private String mItemId;
    private int mInputType;
    private int mResultVisible;
    private int mGraphType;
    private int mRoomType;

    public static final int INPUT_TYPE_RADIOBOX = 1;
    public static final int INPUT_TYPE_CHECKBOX = 2;
    public static final int RESULT_VISIBLE_PUBLIC = 1;
    public static final int RESULT_VISIBLE_CREATOR_ONLY = 2;
    public static final int GRAPH_TYPE_BAR = 1;
    public static final int GRAPH_TYPE_PIE = 2;
    public static final int ROOM_TYPE_PUBLIC = 1;
    public static final int ROOM_TYPE_GROUP = 3;
    public static final int ROOM_TYPE_COMMUNITY = 5;

    public PublicMessageQuestionnaireInfo() {
        mId = BigInteger.ZERO;
        mItemId = "";
        mInputType = INPUT_TYPE_RADIOBOX;
        mResultVisible = RESULT_VISIBLE_PUBLIC;
        mGraphType = GRAPH_TYPE_BAR;
        mRoomType = ROOM_TYPE_PUBLIC;
    }

    public PublicMessageQuestionnaireInfo(PublicMessageQuestionnaireInfo publicmessageQuestionnaireInfo) {
        mId = publicmessageQuestionnaireInfo.getId();
        mItemId = publicmessageQuestionnaireInfo.getItemId();
        mInputType = publicmessageQuestionnaireInfo.getInputType();
        mResultVisible = publicmessageQuestionnaireInfo.getResultVisible();
        mGraphType = publicmessageQuestionnaireInfo.getGraphType();
        mRoomType = publicmessageQuestionnaireInfo.getRoomType();
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

    public int getInputType() {
        return mInputType;
    }

    public void setInputType(int inputType) {
        mInputType = inputType;
    }

    public int getResultVisible() {
        return mResultVisible;
    }

    public void setResultVisible(int resultVisible) {
        mResultVisible = resultVisible;
    }

    public int getGraphType() {
        return mGraphType;
    }

    public void setGraphType(int graphType) {
        mGraphType = graphType;
    }

    public int getRoomType() {
        return mRoomType;
    }

    public void setRoomType(int roomType) {
        mRoomType = roomType;
    }

}
