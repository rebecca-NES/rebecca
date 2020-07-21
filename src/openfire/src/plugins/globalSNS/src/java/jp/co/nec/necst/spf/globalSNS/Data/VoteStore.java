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

public class VoteStore {
    private BigInteger mId;
    private String mItemId;
    private String mRoomId;
    private String mUserId;
    private BigInteger mOptionId;
    private BigInteger mCount;
    private String mOption;
    private int mValue;

    public VoteStore() {
        mId = BigInteger.ZERO;
        mItemId = "";
        mRoomId = "";
        mUserId = "";
        mOptionId = BigInteger.ZERO;
        mCount = BigInteger.ZERO;
        mOption = "";
        mValue = 0;
    }

    public VoteStore(VoteStore src) {
        mId = src.getId();
        mItemId = src.getItemId();
        mRoomId = src.getRoomId();
        mUserId = src.getUserId();
        mOptionId = src.getOptionId();
        mCount = src.getCount();
        mOption = src.getOption();
        mValue = src.getValue();
    }

    public BigInteger getId() {
        return mId;
    }

    public void setId(BigInteger id) {
        mId = id;
    }

    public int getValue() {
        return mValue;
    }

    public void setValue(int value) {
        mValue = value;
    }

    public String getUserId() {
        return mUserId;
    }

    public void setUserId(String userId) {
        mUserId = userId;
    }

    public String getItemId() {
        return mItemId;
    }

    public void setItemId(String itemId) {
        mItemId = itemId;
    }

    public String getRoomId() {
        return mRoomId;
    }

    public void setRoomId(String roomId) {
        mRoomId = roomId;
    }

    public BigInteger getOptionId() {
        return mOptionId;
    }

    public void setOptionId(BigInteger optionId) {
        mOptionId = optionId;
    }

    public BigInteger getCount() {
        return mCount;
    }

    public void setCount(BigInteger count) {
        mCount = count;
    }

    public String getOption() {
        return mOption;
    }

    public void setOption(String option) {
        this.mOption = option;
    }
}
