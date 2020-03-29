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

function Conf(){
}
(function() {

    var _conf = {
            MESSAGE_BODY_MAX_LENGTH : 140,
            THREAD_TITLE_BODY_MAX_LENGTH : 50,
            SERVER_HEART_BEAT_TIME_MILLS : 600000,
            TASK_TITLE_MAX_LENGTH : 50,
            TAB_SCROLL_WIDTH : 300,
            HEADER_CONTAINER_HEIGHT : 34,
            ADD_COLUMN_DELAY : 1,
            MIN_TAB_WIDTH : 150,
            PURGE_MESSAGE_FLAG : true,
            PURGE_MESSAGE_INTARVAL : 600000,     
            PURGE_DEFAULT_BASE_THREAD_POS : 41,
            COMMUNITY_ENCODED_TITLE_LIMIT : 65536,
            COMMUNITY_ENCODED_DESCRIPTION_LIMIT : 65536,
            COMMUNITY_LOGO_SIZE_LIMIT : 716800,
            COLUMN_AUTO_REDE_MORE_TIME_MILLS : 1000,
            PRODUCT_NAME : "Rebecca",
            GOODJOB_USER_TOOLTIP_DISPLAY_COUNT : 3,
            NUMBER_OF_ITEMS_BY_PER_REQUEST : 20,
            NUMBER_OF_ITEMS_SEARCH_MAX_LIST : 1000,
            QUESTIONNAIRE_OPTION_MAX_LENGTH : 32,
            PORTAL_ENABLED : false,
            NUMBER_OF_ITEMS_BY_PER_PROJECT_LIST_COUNT : 10,
            NUMBER_OF_ITEMS_BY_PER_CHATLIST_REQUEST : 5,
            DEFAULT_PROJECT_COLOR : "#187BCE",
            OGP_TITLE_MAX_LENGTH : 50,
            OGP_DESCRIPTION_MAX_LENGTH : 150,
            NOTE_TITLE_MAX_LENGTH : 50
    };

    Conf.getVal = function(key) {
        return _conf[key];
    };

})();
