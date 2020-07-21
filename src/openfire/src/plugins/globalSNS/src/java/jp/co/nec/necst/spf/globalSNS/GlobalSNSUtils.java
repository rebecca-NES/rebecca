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

import java.io.UnsupportedEncodingException;
import java.math.BigInteger;
import java.net.URLDecoder;
import java.net.URLEncoder;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Calendar;
import java.util.GregorianCalendar;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import jp.co.nec.necst.spf.globalSNS.ContextHub.UserAccountStroreDbHelper;
import jp.co.nec.necst.spf.globalSNS.Data.UserAccountInfo;

import org.jivesoftware.openfire.PresenceManager;
import org.jivesoftware.openfire.XMPPServer;
import org.jivesoftware.openfire.user.User;
import org.jivesoftware.openfire.user.UserNotFoundException;
import org.jivesoftware.openfire.vcard.VCardManager;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.xmpp.packet.JID;

public class GlobalSNSUtils {
    private static final Logger Log = LoggerFactory.getLogger(GlobalSNSUtils.class);

    public static final int API_STATUS_SUCCESS = 200000;
    public static final int API_STATUS_BAD_REQUEST = 400000;
    public static final int API_STATUS_UNAUTHORIZED = 401000;
    public static final int API_STATUS_FORBIDDEN = 403000;
    public static final int API_STATUS_NOT_FOUND = 404000;
    public static final int API_STATUS_INTERNAL_SERVER_ERROR = 500000;


    public static String getSqlDataToCryptPassword(String password ) {
        return "encode(digest('" + escapeSqlData(password) + "', 'sha256'), 'hex')";
    }
    public static String escapeSqlData(String data) {
        data = substitute(data, "'", "''");
        data = substitute(data, "\\", "\\\\");
        return data;
    }

    public static String escapeSqlDataForLikePhrase(String data) {
        data = substitute(data, "\\", "\\\\");
        data = substitute(data, "%", "\\%");
        data = substitute(data, "_", "\\_");
        data = escapeSqlData(data);
        return data;
    }

    public static String escapeSqlDataForRegexpPhrase(String data) {
        data = substitute(data, "\\", "\\\\");
        data = substitute(data, "*", "\\*");
        data = substitute(data, "+", "\\+");
        data = substitute(data, ".", "\\.");
        data = substitute(data, "?", "\\?");
        data = substitute(data, "{", "\\{");
        data = substitute(data, "}", "\\}");
        data = substitute(data, "(", "\\(");
        data = substitute(data, ")", "\\)");
        data = substitute(data, "[", "\\[");
        data = substitute(data, "]", "\\]");
        data = substitute(data, "^", "\\^");
        data = substitute(data, "$", "\\$");
        data = substitute(data, "-", "\\-");
        data = substitute(data, "|", "\\|");
        data = substitute(data, "/", "\\/");
        data = escapeSqlData(data);
        return data;
    }

    public static String escapeSqlDataForRegexpPhraseInBracket(String data) {
        data = substitute(data, "\\", "\\\\");
        data = substitute(data, "]", "\\]");
        data = escapeSqlData(data);
        return data;
    }

    public static String convertListToStringforInOperator(List<String> stringListforInOperator) {
        String ret = "";
        if(stringListforInOperator == null || stringListforInOperator.isEmpty()) {
            return ret;
        }
        int count = stringListforInOperator.size();
        for(int i = 0; i < count; i++) {
            if(i != 0) {
                ret += ", ";
            }
            ret += "'";
            ret += escapeSqlData(stringListforInOperator.get(i));
            ret += "'";
        }
        return ret;
    }

    private static String substitute(String input, String pattern,
            String replacement) {
        return input.replace(pattern, replacement);
    }

    public static void splitStringToArray(String input,
            List<String> outArrayList) {
        if (input == null || input.equals("") || outArrayList == null) {
            return;
        }
        String[] splitDatas = input.split(",");
        outArrayList.addAll(Arrays.asList(splitDatas));
    }

    public static void splitStringToArray(String input, String delimiter,
            List<String> outArrayList) {
        if (input == null || input.equals("") || delimiter == null || delimiter.equals("") || outArrayList == null) {
            return;
        }
        String[] splitDatas = input.split(delimiter);
        outArrayList.addAll(Arrays.asList(splitDatas));
    }

    public static Calendar parseDateString(String dateString) {
        if (dateString == null) {
            return null;
        }
        int len = dateString.length();
        if (len < 10) {
            return null;
        }
        GregorianCalendar retCal = null;
        try {
            int yyyy = Integer.parseInt(dateString.substring(0, 4));
            int MM = Integer.parseInt(dateString.substring(5, 7));
            int dd = Integer.parseInt(dateString.substring(8, 10));
            int HH = 0;
            int mm = 0;
            int ss = 0;
            if (len > 15) {
                HH = Integer.parseInt(dateString.substring(11, 13));
                mm = Integer.parseInt(dateString.substring(14, 16));
            }
            if (len > 18) {
                ss = Integer.parseInt(dateString.substring(17, 19));
            }
            retCal = new GregorianCalendar(yyyy, MM - 1, dd, HH, mm, ss);
        } catch (NumberFormatException e) {
        }
        return retCal;
    }

    private static final String VCARD_PROP_NICKNAME = "NICKNAME";
    private static final String VCARD_PROP_FULLNAME = "FN";

    public static String getUserName(String jid) {
        String userName = "";
        String accountName = "";
        int atIndex = jid.indexOf("@");
        if (atIndex > 0) {
            accountName = jid.substring(0, atIndex);
        } else {
            accountName = jid;
        }
        VCardManager vCardManager = VCardManager.getInstance();
        String nickName = vCardManager.getVCardProperty(accountName,
                VCARD_PROP_NICKNAME);
        if (nickName != null && !nickName.equals("")) {
            userName = nickName;
        }
        if (userName.equals("")) {
            String fullName = vCardManager.getVCardProperty(accountName,
                    VCARD_PROP_FULLNAME);
            if (fullName != null && !fullName.equals("")) {
                userName = fullName;
            }
        }
        if (userName.equals("")) {
            UserAccountInfo userAccountInfo = UserAccountStroreDbHelper.getUserAccountInfoByJid(jid);
            userName = userAccountInfo.getLoginAccount();
        }

        return userName;
    }

    public static boolean isAvailable(JID jid) {
        boolean ret = false;
        if (jid == null) {
            Log.error("GlobalSNSUtils#isAvailable::jid is NULL");
            return ret;
        }
        String userName = jid.getNode();
        User user = null;
        try {
            user = XMPPServer.getInstance().getUserManager().getUser(userName);
        } catch (UserNotFoundException e) {
            Log.error("GlobalSNSUtils#isAvailable::User is not found (Username = "
                    + userName);
            return ret;
        }
        PresenceManager presenceManager = XMPPServer.getInstance()
                .getPresenceManager();
        if (user == null) {
            Log.error("GlobalSNSUtils#isAvailable::User is NULL (Username = "
                    + userName);
            return ret;
        }
        return presenceManager.isAvailable(user);
    }

    public static boolean isExistUser(JID jid) {
        boolean ret = false;
        if (jid == null) {
            Log.error("GlobalSNSUtils#isExistUser::jid is NULL");
            return ret;
        }
        String userName = jid.getNode();
        if (userName == null || userName.equals("")) {
            Log.error("GlobalSNSUtils#isExistUser::userName is invalid");
            return ret;
        }
        try {
            XMPPServer.getInstance().getUserManager().getUser(userName);
        } catch (UserNotFoundException e) {
            Log.warn("GlobalSNSUtils#isExistUser::user("
                    + userName + ") is not exist.");
            return ret;
        }
        ret = true;
        return ret;
    }

    public static boolean waitUserLogined(String jidStr, int timeoutMills) {
        if (jidStr == null || jidStr.equals("")) {
            Log.error("GlobalSNSUtils#waitUserLogined : jidStr is invalid");
            return false;
        }
        JID jid = new JID(jidStr);
        if (!GlobalSNSUtils.isExistUser(jid)) {
            Log.error("GlobalSNSUtils#waitUserLogined : user is unknown. jid="
                    + jidStr);
            return false;
        }
        String userName = jid.getNode();
        User waitUser = null;
        try {
            waitUser = XMPPServer.getInstance().getUserManager()
                    .getUser(userName);
        } catch (UserNotFoundException e) {
            Log.error("GlobalSNSUtils#waitUserLogined() :: User is not found (Username = "
                    + userName);
            return false;
        }
        PresenceManager presenceManager = XMPPServer.getInstance()
                .getPresenceManager();
        long startTimeMillis = Calendar.getInstance().getTimeInMillis();
        while (true) {
            if (waitUser == null) {
                Log.error("GlobalSNSUtils#waitUserLogined() :: notifyToUser is null");
                return false;
            }
            long nowTimeMillis = Calendar.getInstance().getTimeInMillis();
            if (startTimeMillis + timeoutMills < nowTimeMillis) {
                Log.error("GlobalSNSUtils#waitUserLogined() :: login timeout! Username = "
                        + userName);
                return false;
            }
            if (presenceManager.isAvailable(waitUser)) {
                break;
            }
            try {
                Thread.sleep(100);
                waitUser = XMPPServer.getInstance().getUserManager()
                        .getUser(userName);
            } catch (InterruptedException e) {

            } catch (UserNotFoundException e) {
                Log.error("GlobalSNSUtils#waitUserLogined() :: User is not found in loop (Username = "
                        + userName);
                return false;
            }
        }
        return true;
    }

    private static final List<Character> list62 = Arrays.asList('0', '1', '2',
            '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f',
            'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's',
            't', 'u', 'v', 'w', 'x', 'y', 'z', 'A', 'B', 'C', 'D', 'E', 'F',
            'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S',
            'T', 'U', 'V', 'W', 'X', 'Y', 'Z');

    private static final BigInteger SIXTY_TWO = BigInteger.valueOf(62);

    public static String decimalToSixtyTwoString(BigInteger decimal) {
        if(decimal == null){
            return null;
        }
        StringBuffer buf = new StringBuffer();
        BigInteger tmpDecimal = new BigInteger(decimal.toString());
        while (tmpDecimal.compareTo(SIXTY_TWO) >= 0) {
            BigInteger index = tmpDecimal.remainder(SIXTY_TWO);
            Character chara = list62.get(index.intValue());
            buf.append(chara);
            tmpDecimal = tmpDecimal.divide(SIXTY_TWO);
        }
        BigInteger index = tmpDecimal.remainder(SIXTY_TWO);
        buf.append(list62.get(index.intValue()));
        return buf.reverse().toString();
    }

    public static BigInteger sixtyTwoStringToDecimal(String s62) {
        if(s62 == null){
            return null;
        }
        String i62 = new StringBuffer(s62).reverse().toString();
        BigInteger i10 = BigInteger.ZERO;
        for (int i = 0; i < i62.length(); i++) {
            Character chara = i62.charAt(i);
            if (!list62.contains(chara)) {
                return null;
            }
            BigInteger sixtyTwoPow = SIXTY_TWO.pow(i);
            BigInteger index = BigInteger.valueOf(list62.indexOf(chara));
            BigInteger calc = sixtyTwoPow.multiply(index);
            i10 = i10 .add(calc);
        }
        return i10;
    }

    public static List<String> getUserListFromStr(String str) {
        if (str == null) {
            Log.error("PublicMessageNotifier#getUserListFromStr:: str is null");
            return null;
        }
        List<String> userNameJidList = null;
        Pattern accountPattern = Pattern.compile("@.*?[\\s　]|@.*?$");
        Matcher accountMatcher = accountPattern.matcher(str);

        userNameJidList = new ArrayList<String>();
        while (accountMatcher.find()) {
            String accountStr = accountMatcher.group().trim();
            String userNameStr = accountStr.replaceFirst("@", "");
            userNameStr = userNameStr.replaceAll("　", "");
            try {
                UserAccountInfo UserInfo = UserAccountStroreDbHelper
                        .getUserAccountInfo(userNameStr);
                if (UserInfo == null) {
                    continue;
                }
                String userJIDStr = UserInfo.getOpenfireAccount() + "@" + UserInfo.getXmppServerName();
                JID userJID = new JID(userJIDStr);
                boolean isExistUser = GlobalSNSUtils.isExistUser(userJID);
                if (isExistUser) {
                    userNameJidList.add(userJIDStr);
                }
            } catch (IllegalArgumentException ex) {
            }
        }

        if (userNameJidList == null || userNameJidList.size() == 0) {
            return null;
        }

        return userNameJidList;
    }

    public static String decodeURIComponent(String str) {
        if (str == null) {
            return null;
        } else if (str.isEmpty()) {
            return str;
        }
        String res = null;
        try {
            res = URLDecoder.decode(str, "UTF-8");
        } catch (UnsupportedEncodingException e) {
            Log.error("Failed to decodeURIComponent", e);
            res = str;
        }

        return res;
    }

    public static String encodeURIComponent(String str) {
        if (str == null) {
            return null;
        } else if (str.isEmpty()) {
            return str;
        }
        String res = null;
        try {
            res = URLEncoder.encode(str, "UTF-8").replaceAll("\\+", "%20")
                    .replaceAll("\\%21", "!").replaceAll("\\%27", "'")
                    .replaceAll("\\%28", "(").replaceAll("\\%29", ")")
                    .replaceAll("\\%7E", "~");
        } catch (UnsupportedEncodingException e) {
            Log.error("Failed to encodeURIComponent", e);
            res = str;
        }

        return res;
    }

}
