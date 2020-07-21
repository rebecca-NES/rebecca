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

package jp.co.nes.spf.identityReflector.Ldap;

import java.util.Collection;
import java.util.ArrayList;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Types;

import javax.naming.CommunicationException;

import org.jivesoftware.database.DbConnectionManager;
import org.jivesoftware.openfire.XMPPServer;
import org.jivesoftware.openfire.auth.AuthProvider;
import org.jivesoftware.openfire.auth.UnauthorizedException;
import org.jivesoftware.openfire.user.UserNotFoundException;
import org.jivesoftware.util.JiveGlobals;
import org.jivesoftware.util.StringUtils;
import org.jivesoftware.util.cache.Cache;
import org.jivesoftware.util.cache.CacheFactory;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.xmpp.packet.JID;

import jp.co.nec.necst.spf.globalSNS.ContextHub.UserAccountStroreDbHelper;
import jp.co.nec.necst.spf.globalSNS.Data.UserAccountInfo;

import org.jivesoftware.openfire.auth.AuthFactory;
import org.jivesoftware.openfire.ldap.LdapManager;

public class LdapAuthProvider implements AuthProvider {

    private static final Logger Log = LoggerFactory.getLogger(LdapAuthProvider.class);

    private LdapManager manager;
    private Cache<String, String> authCache = null;

    private static final String LOAD_PASSWORD =
            "SELECT plainPassword,encryptedPassword FROM ofUser WHERE username=?";
    private static final String UPDATE_PASSWORD =
            "UPDATE ofUser SET plainPassword=?, encryptedPassword=? WHERE username=?";
    public LdapAuthProvider() {
        JiveGlobals.migrateProperty("ir.ldap.authCache.enabled");

        Collection hosts = new ArrayList();
        hosts.add(JiveGlobals.getXMLProperty("ir.ldap.host","localhost"));

        manager = LdapManager.getInstance();
        manager.setHosts(hosts);
        manager.setPort(JiveGlobals.getXMLProperty("ir.ldap.port",389));
        manager.setBaseDN(JiveGlobals.getXMLProperty("ir.ldap.baseDN",""));
        manager.setAdminDN(JiveGlobals.getXMLProperty("ir.ldap.adminDN",""));
        manager.setAdminPassword(JiveGlobals.getXMLProperty("ir.ldap.adminPassword",""));
        manager.setUsernameField(JiveGlobals.getXMLProperty("ir.ldap.usernameField","uid"));

        if (JiveGlobals.getXMLProperty("ir.ldap.authCache.enabled", false)) {
            Log.debug("Ldap auth cache on.");
            String cacheName = "LDAP Authentication";
            CacheFactory.setMaxSizeProperty
                (cacheName,
                 JiveGlobals.getXMLProperty("ir.ldap.authCache.size",524288));
            CacheFactory.setMaxLifetimeProperty
                (cacheName,
                 JiveGlobals.getXMLProperty("ir.ldap.authCache.maxLifetime",7200000));
            authCache = CacheFactory.createCache(cacheName);
        }else{
            Log.debug("Ldap auth cache off.");
        }
    }

    public boolean isPlainSupported() {
        return false;
    }

    public boolean isDigestSupported() {
        return true;
    }

    public void authenticate(String username, String password) throws UnauthorizedException {
        Log.debug(" authenticate do!");
        if (username == null || password == null || "".equals(password.trim())) {
            throw new UnauthorizedException();
        }
        String jid = username;

        if (username.contains("@")) {
            int index = username.indexOf("@");
            String domain = username.substring(index + 1);
            if (domain.equals(XMPPServer.getInstance().getServerInfo().getXMPPDomain())) {
                username = username.substring(0, index);
            } else {
                throw new UnauthorizedException();
            }
        } else {
            jid = String.format("%s@%s",
                    username,
                    XMPPServer.getInstance().getServerInfo().getXMPPDomain()
            );
        }

        username = JID.unescapeNode(username);

        if (! username.equals("admin")) {
            UserAccountInfo userAccountInfo = UserAccountStroreDbHelper.getUserAccountInfoByJid(jid);
            if (userAccountInfo == null) {
                Log.warn("There is no data on user_account_store for: " + jid);
                throw new UnauthorizedException();
            }
            username = userAccountInfo.getLoginAccount();
        }

        if (authCache != null && authCache.containsKey(username)) {
            String hash = authCache.get(username);
            if (StringUtils.hash(password).equals(hash)) {
                Log.debug(" authCache auth true");
                return;
            }
            Log.debug(" authCache auth false");
        }

        String userDN;
        try {
            userDN = manager.findUserDN(username);
            if (!manager.checkAuthentication(userDN, password)) {
                Log.debug(" authenticate : manager.checkAuthentication = false:" + userDN);
                throw new UnauthorizedException("Username and password don't match");
            }
        }
        catch (CommunicationException e) {
            Log.error("Error connecting to LDAP server", e);
            throw new UnauthorizedException(e);
        }
        catch (Exception e) {
            Log.error("Error catch Exception LDAP server e:"+e);
            throw new UnauthorizedException(e);
        }

        if (authCache != null) {
            Log.debug(" set authCache username : " + username);
            authCache.put(username, StringUtils.hash(password));
        }
    }

    public void authenticate(String username, String token, String digest) throws UnsupportedOperationException {
        Log.debug(" authenticate  do!! (Digest authentication not currently supported.)");
        throw new UnsupportedOperationException("Digest authentication not currently supported.");
    }

    public String getPassword(String username) throws UserNotFoundException,
                                                      UnsupportedOperationException {
        Log.debug("do getPassword : " +  username);
        if (!supportsPasswordRetrieval()) {
            throw new UnsupportedOperationException();
        }
        Connection con = null;
        PreparedStatement pstmt = null;
        ResultSet rs = null;
        if (username.contains("@")) {
            int index = username.indexOf("@");
            String domain = username.substring(index + 1);
            if (domain.equals(XMPPServer.getInstance().getServerInfo().getXMPPDomain())) {
                username = username.substring(0, index);
            } else {
                throw new UserNotFoundException();
            }
        }
        try {
            con = DbConnectionManager.getConnection();
            pstmt = con.prepareStatement(LOAD_PASSWORD);
            pstmt.setString(1, username);
            rs = pstmt.executeQuery();
            if (!rs.next()) {
                throw new UserNotFoundException(username);
            }
            String plainText = rs.getString(1);
            String encrypted = rs.getString(2);
            if (encrypted != null) {
                try {
                    return AuthFactory.decryptPassword(encrypted);
                }
                catch (UnsupportedOperationException uoe) {
                }
            }
            return plainText;
        }
        catch (SQLException sqle) {
            throw new UserNotFoundException(sqle);
        }
        finally {
            DbConnectionManager.closeConnection(rs, pstmt, con);
        }
    }

    public void setPassword(String username, String password) throws UserNotFoundException {
        Log.debug("do setPassword : " +  username);
        boolean usePlainPassword = JiveGlobals.getBooleanProperty("user.usePlainPassword");
        String encryptedPassword = null;
        if (username.contains("@")) {
            int index = username.indexOf("@");
            String domain = username.substring(index + 1);
            if (domain.equals(XMPPServer.getInstance().getServerInfo().getXMPPDomain())) {
                username = username.substring(0, index);
            } else {
                throw new UserNotFoundException();
            }
        }
        if (!usePlainPassword) {
            try {
                encryptedPassword = AuthFactory.encryptPassword(password);
                password = null;
            }
            catch (UnsupportedOperationException uoe) {
            }
        }

        Connection con = null;
        PreparedStatement pstmt = null;
        try {
            con = DbConnectionManager.getConnection();
            pstmt = con.prepareStatement(UPDATE_PASSWORD);
            if (password == null) {
                pstmt.setNull(1, Types.VARCHAR);
            }
            else {
                pstmt.setString(1, password);
            }
            if (encryptedPassword == null) {
                pstmt.setNull(2, Types.VARCHAR);
            }
            else {
                pstmt.setString(2, encryptedPassword);
            }
            pstmt.setString(3, username);
            pstmt.executeUpdate();
        }
        catch (SQLException sqle) {
            throw new UserNotFoundException(sqle);
        }
        finally {
            DbConnectionManager.closeConnection(pstmt, con);
        }
    }

    public boolean supportsPasswordRetrieval() {
        Log.debug("do supportsPasswordRetrieval");
        return true;
    }
}
