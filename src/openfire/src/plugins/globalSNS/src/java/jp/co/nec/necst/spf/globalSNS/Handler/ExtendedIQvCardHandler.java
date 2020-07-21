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

package jp.co.nec.necst.spf.globalSNS.Handler;

import java.io.IOException;
import java.io.PrintWriter;
import java.io.StringWriter;
import java.io.UnsupportedEncodingException;
import java.net.URLDecoder;
import java.net.URLEncoder;
import java.sql.Timestamp;
import java.text.SimpleDateFormat;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;

import jp.co.nec.necst.spf.globalSNS.ContextHub.UserAdapter;
import jp.co.nec.necst.spf.globalSNS.GlobalSNSUtils;
import jp.co.nec.necst.spf.globalSNS.ContextHub.UserProfileDbHelper;
import jp.co.nec.necst.spf.globalSNS.ContextHub.VCardChangeAdapter;
import jp.co.nec.necst.spf.globalSNS.Data.Profile;
import jp.co.nec.necst.spf.globalSNS.Handler.MultipleProcessHandler.IMultipleThreadHandleIQ;
import jp.co.nec.necst.spf.globalSNS.Handler.MultipleProcessHandler.MultiplepPocessorIQHandler;
import jp.co.nec.necst.spf.globalSNS.ContextHub.AdminAdapter;
import net.arnx.jsonic.JSON;

import org.dom4j.DocumentHelper;
import org.dom4j.Element;
import org.jivesoftware.openfire.auth.UnauthorizedException;
import org.jivesoftware.openfire.handler.IQvCardHandler;
import org.jivesoftware.util.JiveGlobals;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.xmpp.packet.IQ;
import org.xmpp.packet.JID;
import org.xmpp.packet.PacketError;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;

import org.xmpp.packet.IQ.Type;

public class ExtendedIQvCardHandler extends IQvCardHandler implements
        IMultipleThreadHandleIQ {
    private static final Logger Log = LoggerFactory
            .getLogger(ExtendedIQvCardHandler.class);

    @Override
    public IQ handleIQ(IQ packet) throws UnauthorizedException {
        return MultiplepPocessorIQHandler.getInstance().addIQPacket(this,
                packet);
    }

    @Override
    public IQ handleIQInThread(IQ packet) throws UnauthorizedException {
        Log.debug("do func ExtendedIQvCardHandler.handleIQInThread(");

        Profile profileData = null;

        Type iqType = packet.getType();
        IQ replyPacket = null;
        
        if (! iqType.equals(IQ.Type.get)) {
            profileData = updateExtrasInPacket(packet);
            if (profileData == null) {
                Log.error("updateExtrasInPacket failed");
                replyPacket = IQ.createResultIQ(packet);
                replyPacket.setChildElement(packet.getChildElement().createCopy());
                replyPacket.setError(PacketError.Condition.bad_request);
                return replyPacket;
            }
            restoreNickName(packet, profileData);
        }

        replyPacket = super.handleIQ(packet);
        if (replyPacket == null) {
            replyPacket = IQ.createResultIQ(packet);
            replyPacket.setChildElement(packet.getChildElement().createCopy());
        }
        if (iqType.equals(IQ.Type.get)) {
            return replyPacket;
        }
        if (replyPacket.getType().equals(IQ.Type.error) || !execIQ(packet, profileData)) {
            replyPacket.setChildElement(packet.getChildElement().createCopy());
            replyPacket.setError(PacketError.Condition.bad_request);
        } else {
            replyPacket.setChildElement(packet.getChildElement().createCopy());
        }
        return replyPacket;
    }

    private boolean execIQ(IQ iq, Profile profileData) throws UnauthorizedException {
        Log.debug("do func ExtendedIQvCardHandler.execIQ(");

        JID fromJid = iq.getFrom();
        String strJid = fromJid.toBareJID();


        Element vCardElement = iq.getChildElement();
        if (vCardElement == null) {
            Log.error("vcardElement is null");
            return false;
        }

        Element nicknameElement = vCardElement.element("NICKNAME");
        if (nicknameElement != null) {
        } else {
            Log.error("nicknameElement is null");
            return false;
        }
        String nickName = nicknameElement.getText();
        try {
            nickName = URLDecoder.decode(nickName, "UTF-8");
            nickName = URLEncoder.encode(nickName, "UTF-8");
        } catch (UnsupportedEncodingException e) {
            Log.error("Encode or Decode Error");
            StringWriter sw = new StringWriter();
            e.printStackTrace(new PrintWriter(sw));
            String exceptionAsString = sw.toString();
            Log.error(exceptionAsString);
            nickName = "";
        }
        profileData.setNickName(nickName);

        Element photoElement = vCardElement.element("PHOTO");
        if (photoElement == null) {
            Log.error("photoElement is null");
            return false;
        }

        Element typeElement = photoElement.element("TYPE");
        if (typeElement == null) {
            Log.error("typeElement is null");
            return false;
        }
        String type = typeElement.getText();
        profileData.setPhotoType(type);

        Element binvalElement = photoElement.element("BINVAL");
        if (binvalElement == null) {
            Log.error("binvalElement is null");
            return false;
        }
        String binval = binvalElement.getText();
        profileData.setPhotoData(binval);

        Element affiliationElement = vCardElement.element("group");
        if(affiliationElement != null){
            String groups = AdminAdapter.ConvertGroupXMPPtoJSON(affiliationElement);
            profileData.setAffiliation(groups);
        }

        Element emailElement = vCardElement.element("EMAIL");
        boolean hasEmail = false;
        if (emailElement != null) {
            Element emailUserIdElement = emailElement.element("USERID");
            if (emailUserIdElement != null) {
                profileData.setEmail(emailUserIdElement.getTextTrim());
                hasEmail = true;
            }
        }
        if (!hasEmail) {
            profileData.setEmail(null);
        }
        
        Profile profileData_s = new Profile();
        String nowDateTime = profileData_s.getDateStr();
        try {
            Timestamp newTime = new Timestamp(new SimpleDateFormat(
                    "yyyy/MM/dd HH:mm:ss").parse(nowDateTime).getTime());
            profileData.setDate(newTime);
        } catch (Exception e) {
            Log.error("SimpleDateFormat Error");
            return false;
        }

        VCardChangeAdapter.getInstance().updateUserProfile(profileData);

        VCardChangeAdapter.getInstance().entryVCardData(strJid);

        return true;
    }

    Profile updateExtrasInPacket(IQ iq) {
        Log.debug("do func ExtendedIQvCardHandler.updateExtrasInPacket(");
        JID fromJid = iq.getFrom();
        String strJid = fromJid.toBareJID();

        Profile profileData = UserProfileDbHelper.getUserProfileDataWithExtra(strJid);
        if (profileData == null) {
            Log.debug("profileData is null");
            return null;
        }
        profileData.setJid(strJid);
        Element vCardElement = iq.getChildElement();
        if (vCardElement == null) {
            Log.debug("vcardElement is null");
            return null;
        }
        Element extrasElement = vCardElement.element("EXTRAS");
        if (extrasElement != null) {
            String postedExtras = GlobalSNSUtils.decodeURIComponent(extrasElement.getText());
            String mergedExtras = mergePostedExtrasWithCurrent(postedExtras, profileData.getExtrasData());
            if (! isExtrasWithinTheLimit(mergedExtras, JiveGlobals.getProperty("spf.USER_PROFILE_EXTRAS_DATA_MAX_BYTE "))) {
                return null;
            }
            profileData.setExtrasData(mergedExtras);
            String encodedExtras = GlobalSNSUtils.encodeURIComponent(mergedExtras);
            extrasElement.setText(encodedExtras);
        }
        Element groupsElement = vCardElement.element("group");
        if(groupsElement == null){
            Element groups = DocumentHelper.createElement("group");
            String groupsStr = profileData.getAffiliation();
            String[] groupsStrArray = groupsStr.split(",");
            for(String group : groupsStrArray){
                String _group = group.replaceFirst("^\\[", "").replaceFirst("\\]$", "")
                    .replaceFirst("^\"", "").replaceFirst("\"$", "");
                Element _gitem = DocumentHelper.createElement("item");
                if(_group.length() > 0){
                    _gitem.setText(_group);
                    groups.add(_gitem);
                }
            }
            vCardElement.add(groups);
        }
        return profileData;
    }

    void restoreNickName(IQ iq, Profile profileData) {
        Log.debug("do func ExtendedIQvCardHandler.restoreNickName(");
        Element vCardElement = iq.getChildElement();
        Element nickNameElem = vCardElement.element("NICKNAME");
        if (nickNameElem == null) {
            nickNameElem = DocumentHelper.createElement("NICKNAME");
            String profileNickName = profileData.getNickName();
            if (profileNickName == null) {
                profileNickName = "";
            }
            nickNameElem.setText(profileNickName);
            vCardElement.add(nickNameElem);
        }
    }

    String mergePostedExtrasWithCurrent(String postedExtras, String currentExtras) {
        Log.debug("do func ExtendedIQvCardHandler.mergePostedExtrasWithCurrent(");
        if ("{}".equals(postedExtras)) {
            return postedExtras;

        } else if (postedExtras == null || postedExtras.isEmpty()) {
            return currentExtras;

        } else if (postedExtras.equals(currentExtras)) {
            return currentExtras;
        }

        ObjectMapper mapper = new ObjectMapper();

        JsonNode jsonNodeOfCurrent = null;
        try {
            jsonNodeOfCurrent = mapper.readTree(currentExtras);
        } catch (Exception e1) {
            Log.debug("Invalid request. cant readTree currentExtras");
        }

        JsonNode jsonNodeOfPosted = null;
        try {
            jsonNodeOfPosted = mapper.readTree(postedExtras);
        } catch (Exception e1) {
            Log.warn("Invalid request. cant readTree postedExtras");
            return currentExtras; 
        }
        postedExtras = jsonNodeOfPosted.toString();
        
        if (jsonNodeOfCurrent == null) {
            return postedExtras;
        }

        JsonNode mergedJsonNode = mergeJsonNodes(jsonNodeOfPosted, jsonNodeOfCurrent);

        return mergedJsonNode.toString();
    }

    public static JsonNode mergeJsonNodes(JsonNode updateNode, JsonNode mainNode) {
        Log.debug("do func ExtendedIQvCardHandler.mergeJsonNodes(");

        Iterator<String> fieldNames = updateNode.fieldNames();
        while (fieldNames.hasNext()) {

            String updatedFieldName = fieldNames.next();
            JsonNode valueToBeUpdated = mainNode.get(updatedFieldName);
            JsonNode updatedValue = updateNode.get(updatedFieldName);

            if ("{}".equals(updatedValue.toString())) {
                ((ObjectNode) mainNode).replace(updatedFieldName, updatedValue);

            } else if (valueToBeUpdated != null && updatedValue.isArray()) {
                ((ObjectNode) mainNode).replace(updatedFieldName, updatedValue);

            } else if (valueToBeUpdated != null && valueToBeUpdated.isObject()) {
                mergeJsonNodes(updatedValue, valueToBeUpdated);

            } else {
                if (mainNode instanceof ObjectNode) {
                    ((ObjectNode) mainNode).replace(updatedFieldName, updatedValue);
                }
            }
        }
        return mainNode;
    }
    boolean isExtrasWithinTheLimit(String extras, String MAX_BYTES) {
        Log.debug("do func ExtendedIQvCardHandler.isExtrasWithinTheLimit(");

        int maxBytesOfExtras = 20971520;
        int bytesOfExtras = 0;
        try {
            maxBytesOfExtras = Integer.parseInt(MAX_BYTES);
        } catch (Exception e) {
            Log.debug("failed to parseInt of extras");
        }
        try {
            bytesOfExtras = extras.getBytes("utf-8").length;
        } catch (Exception e) {
            Log.warn("failed to getBytes of extras", e);
            return false;
        }
        if (bytesOfExtras > maxBytesOfExtras) {
            Log.error("It's not authorized that storing over MAX_ELEMENT_BYTES: " + String.valueOf(bytesOfExtras));
            return false;
        }
        
        return true;
    }
}
