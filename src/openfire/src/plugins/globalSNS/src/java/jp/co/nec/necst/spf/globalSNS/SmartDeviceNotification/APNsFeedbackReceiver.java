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

package jp.co.nec.necst.spf.globalSNS.SmartDeviceNotification;

import static java.util.concurrent.TimeUnit.SECONDS;

import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class APNsFeedbackReceiver {
    private static final Logger Log = LoggerFactory
            .getLogger(APNsFeedbackReceiver.class);
    
    private static APNsFeedbackReceiver mInstance;

    private static ScheduledExecutorService scheduler = Executors
            .newSingleThreadScheduledExecutor();

    private static final int SCHEDULER_INITIAL_DELAY_SEC = 60;
    private static final int SCHEDULER_PERIOD_SEC = 60 * 60 * 24;

    private APNsFeedbackReceiver() {
    }

    public static APNsFeedbackReceiver getInstance() {
        if (mInstance == null) {
            mInstance = new APNsFeedbackReceiver();
        }
        return mInstance;
    }

    public void start() {
        Log.info("APNsFeedbackReceiver startup...");
        scheduler.scheduleAtFixedRate(
                new APNSGarbageCollector(
                new APNSUtilsImpl()), SCHEDULER_INITIAL_DELAY_SEC,
                SCHEDULER_PERIOD_SEC, SECONDS);
        Log.info("APNsFeedbackReceiver startup DONE.");
    }

    public void stop() {
        Log.info("APNsFeedbackReceiver shutdown...");
        scheduler.shutdown();
        try {
            if (!scheduler.awaitTermination(60, SECONDS)) {
                scheduler.shutdownNow();
                if (!scheduler.awaitTermination(60, SECONDS)) {
                    Log.error("Pool did not terminate");
                }
            }
            Log.info("APNsFeedbackReceiver shutdown DONE.");
        } catch (InterruptedException ie) {
            scheduler.shutdownNow();
            Thread.currentThread().interrupt();
        }
    }

}
