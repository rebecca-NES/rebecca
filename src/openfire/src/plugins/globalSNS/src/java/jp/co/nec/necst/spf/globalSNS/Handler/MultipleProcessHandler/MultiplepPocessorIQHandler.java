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

package jp.co.nec.necst.spf.globalSNS.Handler.MultipleProcessHandler;

import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.ThreadPoolExecutor;
import java.util.concurrent.TimeUnit;

import jp.co.nec.necst.spf.globalSNS.GlobalSNSPlugin;
import jp.co.nec.necst.spf.globalSNS.GlobalSNSReqister;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.xmpp.packet.IQ;
import org.xmpp.packet.PacketError;

public class MultiplepPocessorIQHandler implements GlobalSNSReqister {
    private static final Logger Log = LoggerFactory
            .getLogger(MultiplepPocessorIQHandler.class);

    private final static int THREAD_POOL_CORE_POOL_SIZE = 8;
    private final static int THREAD_POOL_MAXIMUM_POOL_SIZE = 8;
    private final static int THREAD_POOL_KEEP_ALIVE_TIME = 60;
    private final static TimeUnit THREAD_POOL_TIME_UNIT = TimeUnit.SECONDS;

    private static ThreadPoolExecutor mThreadPool = null;
    private static MultiplepPocessorIQHandler mInstance = null;

    private MultiplepPocessorIQHandler() {
        mThreadPool = new ThreadPoolExecutor(THREAD_POOL_CORE_POOL_SIZE,
                THREAD_POOL_MAXIMUM_POOL_SIZE, THREAD_POOL_KEEP_ALIVE_TIME,
                THREAD_POOL_TIME_UNIT, new LinkedBlockingQueue<Runnable>(),
                new ThreadPoolExecutor.CallerRunsPolicy());
        GlobalSNSPlugin.registerGlobalSNSReqister(this);
    }

    public static MultiplepPocessorIQHandler getInstance() {
        if (mInstance == null) {
            mInstance = new MultiplepPocessorIQHandler();
        }
        return mInstance;
    }

    public IQ addIQPacket(IMultipleThreadHandleIQ handler, IQ packet) {
        final String logPrefix = "addIQPacket :";
        IQ retPacket = null;
        if (mThreadPool == null) {
            retPacket = IQ.createResultIQ(packet);
            retPacket.setChildElement(packet.getChildElement().createCopy());
            retPacket.setError(PacketError.Condition.bad_request);
            return retPacket;
        }
        try {
            mThreadPool.execute(new MultipleProcessHandlerRunner(handler,
                    packet));
            return null;
        } catch (Throwable throwObject) {
            try {
                Log.error(logPrefix
                        + "Error occurred on adding queue in thread pool.",
                        throwObject);
            } catch (OutOfMemoryError oomError) {
            }
        }
        try {
            retPacket = IQ.createResultIQ(packet);
            retPacket.setChildElement(packet.getChildElement().createCopy());
            retPacket.setError(PacketError.Condition.bad_request);
        } catch (Throwable throwObject) {
            try {
                Log.error(
                        logPrefix
                                + "Error occurred on create error result return packet.",
                        throwObject);
            } catch (OutOfMemoryError oomError) {
            }
        }
        return retPacket;
    }

    @Override
    public void stop() {
        if (mThreadPool != null) {
            mThreadPool.shutdown();
            mThreadPool = null;
        }
    }
}
