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

package jp.co.nec.necst.spf.globalSNS.WebSocketServer;

import java.io.File;

import org.eclipse.jetty.server.Handler;
import org.eclipse.jetty.server.Server;
import org.eclipse.jetty.server.handler.HandlerList;
import org.eclipse.jetty.server.handler.ResourceHandler;
import org.eclipse.jetty.server.ssl.SslSelectChannelConnector;
import org.eclipse.jetty.servlet.ServletContextHandler;
import org.eclipse.jetty.servlet.ServletHolder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import jp.co.nec.necst.spf.globalSNS.ContextHub.SystemConfDbHelper;

public class WebSocketServer {
    private static final Logger Log = LoggerFactory
            .getLogger(WebSocketServer.class);

    private static WebSocketServer mInstance = null;

    private static final int THREAD_STATUS_NOT_START = 0;
    private static final int THREAD_STATUS_STARTED = 1;
    private static final int THREAD_STATUS_STOPED = 2;

    private int mThreadStatus = THREAD_STATUS_NOT_START;
    private boolean mThreadStopRequest = false;
    private ProcessThread mThread = new ProcessThread();

    private WebSocketServer() {
    }

    public static WebSocketServer getInstance() {
        if (mInstance == null) {
            mInstance = new WebSocketServer();
        }
        return mInstance;
    }

    public boolean start() {
        final String logPrefix = "start :";
        if (mThreadStatus == THREAD_STATUS_STOPED) {
            return false;
        }
        if (mThreadStatus == THREAD_STATUS_STARTED) {
            return true;
        }
        try {
            mThread.start();
            mThreadStatus = THREAD_STATUS_STARTED;
            return true;
        } catch (Throwable throwObject) {
            try {
                Log.error(logPrefix + "Error occurred on starting thread.",
                        throwObject);
            } catch (OutOfMemoryError oomError) {
            }
        }
        return false;
    }

    public void stop() {
        final String logPrefix = "stop() : ";
        mThreadStatus = THREAD_STATUS_STOPED;
        mThreadStopRequest = true;
        try {
            mThread.join();
        } catch (InterruptedException e) {
            Log.error(logPrefix + "failed to stop thread", e);
        }
    }

    private class ProcessThread extends Thread {
        public void run() {
            final String logPrefix = "ProcessThread - run() : ";
            Log.debug(logPrefix + "start!");

            String portNumStr = SystemConfDbHelper
                    .getValue(SystemConfDbHelper.SystemConfKey.WEBSOCKET_PORT);
            int port = 3004;
            if (portNumStr != null) {
                try {
                    port = Integer.parseInt(portNumStr);
                } catch (NumberFormatException e) {
                    Log.error(logPrefix + "websocket port format is invalid : "
                            + portNumStr + " ... Use " + String.valueOf(port),
                            e);
                }
            } else {
                Log.error(
                        logPrefix + "websocket port setting is nothing... Use "
                                + String.valueOf(port), new Throwable());
            }

            int sslFlg = 0;
            String sslFlgNumStr = SystemConfDbHelper
                    .getValue(SystemConfDbHelper.SystemConfKey.WEBSOCKET_SSL_FLAG);
            if (sslFlgNumStr != null) {
                try {
                    sslFlg = Integer.parseInt(sslFlgNumStr);
                } catch (NumberFormatException e) {
                    Log.error(logPrefix + "websocket port format is invalid : "
                            + sslFlgNumStr + " ... Use " + String.valueOf(sslFlgNumStr),
                            e);
                    return;
                }
            } else {
                Log.error(
                        logPrefix + "ssl flag setting is nothing... Use "
                                + String.valueOf(sslFlg), new Throwable());
                return;
            }

            Server server = null;

            if ( sslFlg == 0 )
            {
                server = new Server(port);
            }  else {
                server = getSslServer(port);
            }

            if (server == null) {
                Log.error(logPrefix + "websocket server can not create error end!");
                return;
            }

            ResourceHandler rh = new ResourceHandler();

            GlobalSNSWebSocketServlet wss = new GlobalSNSWebSocketServlet();
            ServletHolder sh = new ServletHolder(wss);
            ServletContextHandler sch = new ServletContextHandler();

            sch.addServlet(sh, "/*");

            HandlerList hl = new HandlerList();
            hl.setHandlers(new Handler[] { rh, sch });
            server.setHandler(hl);

            while (true) {
                if (mThreadStopRequest) {
                    Log.debug(logPrefix + "stop!");
                    return;
                }
                try {
                    try {
                        server.start();
                        break;
                    } catch (Exception e) {
                        Log.error(logPrefix + "websocket server is cannot run",
                                e);
                    }
                    try {
                        Thread.sleep(1000);
                    } catch (InterruptedException e) {
                        Log.error(logPrefix + "thread sleep miss", e);
                    }
                } catch (Throwable throwObject) {
                    try {
                        Log.error(logPrefix + "Error occurred in thread loop.",
                                throwObject);
                    } catch (OutOfMemoryError oomError) {
                    }
                }
            }
            while (true) {
                if (mThreadStopRequest) {
                    wss.disconnectAllClient();
                    try {
                        server.stop();
                    } catch (Exception e) {
                        Log.error(
                                logPrefix + "failed to stop websocket server",
                                e);
                    }
                    break;
                }
                try {
                    try {
                        Thread.sleep(1000);
                    } catch (InterruptedException e) {
                        Log.error(logPrefix + "thread sleep miss 2", e);
                    }
                } catch (Throwable throwObject) {
                    try {
                        Log.error(logPrefix + "Error occurred in thread loop.",
                                throwObject);
                    } catch (OutOfMemoryError oomError) {
                    }
                }
            }
            Log.debug(logPrefix + "stop!");
        }

        private Server getSslServer(int port) {

            final String logPrefix = "ProcessThread - getSslServer(" + String.valueOf(port)  +  ") : ";
            Log.debug(logPrefix + "start!");

            String keystoreLocation = SystemConfDbHelper
                    .getValue(SystemConfDbHelper.SystemConfKey.WEBSOCKET_SSL_KEYSTORE_PATH);

            String keystorePassword = SystemConfDbHelper
                    .getValue(SystemConfDbHelper.SystemConfKey.WEBSOCKET_SSL_KEYSTORE_PASSWORD);

            String password = SystemConfDbHelper
                    .getValue(SystemConfDbHelper.SystemConfKey.WEBSOCKET_SSL_PASSWORD);

            if ( keystoreLocation == null || keystorePassword == null || password == null) {
                Log.error(logPrefix + "Failed to get SSL info error end!");
                return null;
            }
            if ( keystoreLocation.length() == 0 || keystorePassword.length() == 0 || password.length() == 0) {
                Log.error(logPrefix + "SSL info is not correct error end!");
                return null;
            }

            Log.debug(logPrefix + "keystoreLocation = " + keystoreLocation
                    + ", keystorePassword = " + keystorePassword
                    + ", password = " + password);

            try {

                File keystoreFile = new File(keystoreLocation);
                if (!keystoreFile.exists() ){
                    Log.error(logPrefix + "SSL(for SPFPresence.exe) keystore is not exist error end!");
                    return null;
                }

                SslSelectChannelConnector sslConnector = new SslSelectChannelConnector();
                sslConnector.setPort(port);
                sslConnector.setKeystore(keystoreFile.getPath());
                sslConnector.setPassword(keystorePassword);
                sslConnector.setKeyPassword(password);

                Server server = new Server();
                server.addConnector(sslConnector);

                Log.info(logPrefix + "success end!");
                return server;

            } catch (Exception e) {
                e.printStackTrace();
                Log.error(e.getMessage(), e);
            }

            Log.debug(logPrefix + "error end!");
            return null;
        }
    }
}
