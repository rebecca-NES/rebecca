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
var _cubee_version = '5.12.0_ajh';

(function() {
    function _addCSSFile(url){
        var _link = document.createElement('link');
        _link.href = url;
        _link.rel = 'stylesheet';
        _link.type = 'text/css';
        var _headElm = document.getElementsByTagName('head')[0];
        _headElm.appendChild(_link);
    }

    _addCSSFile('css/common.css?v=' + _cubee_version);
    _addCSSFile('css/adminlte/bootstrap.min.css?v=' + _cubee_version);
    _addCSSFile('css/font-awesome.min.css?v=' + _cubee_version);
    _addCSSFile('css/adminlte/AdminLTE.min.css?v=' + _cubee_version);
    _addCSSFile('css/perfect-scrollbar.css?v=' + _cubee_version);
    _addCSSFile('css/style.css?v=' + _cubee_version);
    _addCSSFile('css/animate/animate.min.css?v=' + _cubee_version);
    _addCSSFile('js/libs/emoji-mart-embed/emoji-mart.css?v=' + _cubee_version);

    document.write('<script src="js/libs/adminlte/jquery-1.7.2.min.js?v=' + _cubee_version + '"></script>');
    document.write('<script src="js/libs/jquery/jquery-ui-1.8.20.custom.min.js?v=' + _cubee_version + '"></script>');
    document.write('<script src="js/libs/jquery/jquery.bottom-1.0.js?v=' + _cubee_version + '"></script>');
    document.write('<script src="js/libs/jquery/jquery.autosize-1.17.1.js?v=' + _cubee_version + '"></script>');
    document.write('<script src="js/libs/jquery/jquery-ui-timepicker-addon.js?v=' + _cubee_version + '"></script>');
    document.write('<script src="js/libs/jquery/jquery.autocomplete.js?v=' + _cubee_version + '"></script>');
    document.write('<script src="js/libs/jquery/sugar-1.3.9.min.js?v=' + _cubee_version + '"></script>');
    document.write('<script src="js/libs/jquery/jquery.ui.touch-punch.min.js?v=' + _cubee_version + '"></script>');
    document.write('<script src="js/libs/jquery/jquery.upload-1.0.2-for-cubee-ie.js?v=' + _cubee_version + '"></script>');
    document.write('<script src="js/libs/jquery/i18n/jquery.ui.datepicker-ja.js?v=' + _cubee_version + '"></script>');
    document.write('<script src="js/libs/jquery/i18n/jquery-ui-timepicker-ja.js?v=' + _cubee_version + '"></script>');

    document.write('<script src="js/libs/json/json2.js?v=' + _cubee_version + '"></script>');
    document.write('<script src="js/libs/polyfill-6.26.0.min.js?v=' + _cubee_version + '"></script>');
    document.write('<script src="/socket.io/socket.io.js?v=' + _cubee_version + '"></script>');
    document.write('<script src="js/libs/globalize/globalize.js?v=' + _cubee_version + '"></script>');
    document.write('<script src="js/libs/globalize/cultures/globalize.culture.ja.js?v=' + _cubee_version + '"></script>');

    document.write('<script src="js/libs/d3js/d3.v3.min.js?v=' + _cubee_version + '"></script>');

    document.write('<script src="js/libs/crypto-js/rollups/aes.js?v=' + _cubee_version + '"></script>');
    document.write('<script src="js/libs/crypto-js/rollups/pbkdf2.js?v=' + _cubee_version + '"></script>');
    document.write('<script src="js/libs/adminlte/bootstrap.min.js?v=' + _cubee_version + '"></script>');
    document.write('<script src="js/libs/adminlte/app.min.js?v=' + _cubee_version + '"></script>');
    document.write('<script src="js/libs/perfect-scrollbar.min.js?v=' + _cubee_version + '"></script>');
    document.write('<script src="js/libs/autosize.min.js?v=' + _cubee_version + '"></script>');
    document.write('<script src="js/libs/chartjs/Chart.min.js?v=' + _cubee_version + '"></script>');
    document.write('<script src="js/libs/cropbox_mobile.js?v=' + _cubee_version + '"></script>');
    document.write('<script src="js/libs/vue/vue.min.js?v=' + _cubee_version + '"></script>');
    document.write('<script src="js/libs/pushjs/push.min.js?v=' + _cubee_version + '"></script>');

    document.write('<script src="js/common.js?v=' + _cubee_version + '"></script>');

    document.write('<script src="js/conf.js?v=' + _cubee_version + '"></script>');

    document.write('<script src="js/vue_component.js?v=' + _cubee_version + '"></script>');

    document.write('<script src="js/controller/get_destination_host.js?v=' + _cubee_version + '"></script>');

    document.write('<script src="js/libs/twemoji/twemoji.min.js?v=' + _cubee_version + '"></script>');
    document.write('<script src="js/libs/emoji-mart-embed/emoji-mart.js?v=' + _cubee_version + '"></script>');
    document.write('<script src="js/libs/javascript-load-image/load-image.all.min.js?v=' + _cubee_version + '"></script>');

    var _js_files = [
        'js/model/array_list.js',
        'js/model/column_information.js',
        'js/model/person.js',
        'js/model/notification.js',
        'js/model/good_job.js',
        'js/model/message.js',
        'js/model/community.js',
        'js/model/column_filter.js',
        'js/model/column_filter_manager.js',
        'js/model/chatroom_information.js',
        'js/model/mail_server_information.js',
        'js/model/mail_cooperation_information.js',
        'js/model/filter_manager.js',
        'js/model/message_existing_reader_info.js',
        'js/model/ui_shorten_url_info.js',
        'js/model/cubee_aes.js',
        'js/model/login_ticket.js',
        'js/model/authority.js',
        'js/model/policy.js',
        'js/model/role.js',
        'js/model/translations.js',
        'js/model/emotion_point.js',
        'js/controller/utils.js',
        'js/controller/api_cubee.js',
        'js/controller/socket_io_connector.js',
        'js/controller/cubee_server_connector.js',
        'js/controller/authority.js',
        'js/controller/community.js',
        'js/controller/login.js',
        'js/controller/favorite.js',
        'js/controller/message.js',
        'js/controller/notification.js',
        'js/controller/person.js',
        'js/controller/search.js',
        'js/controller/chatroom.js',
        'js/controller/mail_server.js',
        'js/controller/cubee_controller.js',
        'js/controller/notification_setting.js',
        'js/controller/push_notification_setting.js',
        'js/controller/codimd/connector.js',
        'js/controller/openGraphProtocol/connector.js',
        'js/view/resource.js',
        'js/view/view_utils.js',
        'js/view/viewcore.js',
        'js/view/view.js',
        'js/view/tab_item_view.js',
        'js/view/tab_my_work_place_item_view.js',
        'js/view/tab_community_item_view.js',
        'js/view/tab_column_state_store.js',
        'js/view/tab_manager.js',
        'js/view/login_view.js',
        'js/view/avatar_view.js',
        'js/view/dialog_view.js',
        'js/view/dialog_setting_view.js',
        'js/view/dialog_person_list_view.js',
        'js/view/dialog_existing_reader_person_list_view.js',
        'js/view/dialog_follower_list_view.js',
        'js/view/dialog_followee_list_view.js',
        'js/view/dialog_good_job_person_list_view.js',
        'js/view/dialog_add_column_view.js',
        'js/view/dialog_add_column_for_community_view.js',
        'js/view/dialog_remove_chat_list_view.js',
        'js/view/dialog_delete_check_view.js',
        'js/view/dialog_password_view.js',
        'js/view/dialog_profile_view.js',
        'js/view/dialog_setting_filter_view.js',
        'js/view/dialog_setting_filter_task_view.js',
        'js/view/dialog_setting_filter_my_task_view.js',
        'js/view/dialog_setting_custom_filter_view.js',
        'js/view/dialog_setting_custom_filter_inbox_view.js',
        'js/view/dialog_setting_search_view.js',
        'js/view/dialog_task_view.js',
        'js/view/dialog_mail_cooperation_view.js',
        'js/view/dialog_chat_room_update_room_info_view.js',
        'js/view/dialog_chat_room_create_room_info_view.js',
        'js/view/dialog_community_create_setting_base_view.js',
        'js/view/dialog_select_member_view.js',
        'js/view/dialog_select_chat_room_member_view.js',
        'js/view/dialog_select_chat_room_add_member_view.js',
        'js/view/dialog_select_chat_room_change_authority_member_view.js',
        'js/view/dialog_select_chat_room_confirm_authority_member_view.js',
        'js/view/dialog_select_chat_room_leave_member_view.js',
        'js/view/dialog_select_community_member_view.js',
        'js/view/dialog_select_community_add_member_view.js',
        'js/view/dialog_select_community_leave_member_view.js',
        'js/view/dialog_create_community_view.js',
        'js/view/dialog_setting_community_view.js',
        'js/view/dialog_unsubscribe_check_view.js',
        'js/view/dialog_groupchat_unsubscribe_check_view.js',
        'js/view/dialog_project_unsubscribe_check_view.js',
        'js/view/dialog_favorite_view.js',
        'js/view/dialog_groupchat_list_view.js',
        'js/view/dialog_public_groupchat_list_view.js',
        'js/view/dialog_chat_list_view.js',
        'js/view/dialog_quote_message_view.js',
        'js/view/dialog_read_in_bulk_check_view.js',
        'js/view/dialog_menthion_community_person_list_view.js',
        'js/view/dialog_menthion_groupchat_person_list_view.js',
        'js/view/favorite_store.js',
        'js/view/general_config_button.js',
        'js/view/column_reply_textarea_view.js',
        'js/view/column_link_view.js',
        'js/view/tooltip_view.js',
        'js/view/search_view.js',
        'js/view/my_presence_view.js',
        'js/view/icon_area_view.js',
        'js/view/notificationicon_manager.js',
        'js/view/columnaddicon_view.js',
        'js/view/columnicon_view.js',
        'js/view/notificationicon_view.js',
        'js/view/chat_notificationicon_view.js',
        'js/view/task_notificationicon_view.js',
        'js/view/inbox_notification_icon_view.js',
        'js/view/mention_notification_icon_view.js',
        'js/view/tome_notification_icon_view.js',
        'js/view/group_chat_notification_icon_view.js',
        'js/view/mail_notification_icon_view.js',
        'js/view/community_notification_icon_view.js',
        'js/view/group_chat_notification_tool_tip_view.js',
        'js/view/community_notification_tool_tip_view.js',
        'js/view/slide_container_view.js',
        'js/view/base_side_list_view_impl.js',
        'js/view/my_work_place_side_list_view_impl.js',
        'js/view/side_list_view.js',
        'js/view/side_menu_parts.js',
        'js/view/accordion_view.js',
        'js/view/side_menu_accrodion_parts.js',
        'js/view/group_chat_start_form_view.js',
        'js/view/contact_list_view.js',
        'js/view/contact_list_for_community_view.js',
        'js/view/community_side_list_view_impl.js',
        'js/view/community_list_view.js',
        'js/view/community_member_list_view.js',
        'js/view/community_details_view.js',
        'js/view/follows_view.js',
        'js/view/column_message_view.js',
        'js/view/column_message_avatar.js',
        'js/view/column_message_avatar_tooltip.js',
        'js/view/column_message_goodjob_button.js',
        'js/view/column_message_emotionpoint_button.js',
        'js/view/column_message_read_more_button.js',
        'js/view/column_message_existing_reader_info_view.js',
        'js/view/column_message_tooltip.js',
        'js/view/column_view_parts.js',
        'js/view/register_view.js',
        'js/view/task_register_view.js',
        'js/view/inbox_register_view.js',
        'js/view/column_view.js',
        'js/view/message_column_link.js',
        'js/view/column_task_filter_and_sort_condition.js',
        'js/view/column_chat_view.js',
        'js/view/column_group_chat_view.js',
        'js/view/column_task_view.js',
        'js/view/column_inbox_view.js',
        'js/view/column_filter_view.js',
        'js/view/column_custom_filter_view.js',
        'js/view/column_search_view.js',
        'js/view/column_timeline_view.js',
        'js/view/column_mail_view.js',
        'js/view/column_mention_view.js',
        'js/view/column_tome_view.js',
        'js/view/column_recent_view.js',
        'js/view/column_community_feed_view.js',
        'js/view/column_community_task_view.js',
        'js/view/column_show_conversation_view.js',
        'js/view/column_murmur_view.js',
        'js/view/questionnaire/questionnaire_notificationicon_view.js',
        'js/view/questionnaire/column_questionnaire_message_view.js',
        'js/view/questionnaire/column_questionnaire_view.js',
        'js/view/questionnaire/questionnaire_register_view.js',
        'js/view/questionnaire/dialog_select_questionnaire_range_view.js',
        'js/view/questionnaire/dialog_questionnaire_confirm_view.js',

        'js/view/column_manager.js',
        'js/view/column_system_message_view.js',
        'js/view/column_task_message_view.js',
        'js/view/column_inbox_message_view.js',
        'js/view/column_chat_message_view.js',
        'js/view/column_public_message_view.js',
        'js/view/column_group_chat_message_view.js',
        'js/view/column_mail_message_view.js',
        'js/view/column_community_message_view.js',
        'js/view/column_community_task_message_view.js',
        'js/view/column_murmur_message_view.js',
        'js/view/attached_file_data.js',
        'js/view/attached_file_list.js',
        'js/view/group_chat_list_view.js',
        'js/view/public_group_chat_list_view.js',
        'js/view/layout_manager.js',
        'js/view/cautionicon_view.js',
        'js/view/demandtask_cautionicon_view.js',
        'js/view/read_message_setter.js',
        'js/view/side_menu_extension_parts.js',
        'js/view/contact_list_sub_view.js',
        'js/view/community_member_list_sub_view.js',
        'js/view/side_menu_user_list_view.js',
        'js/view/contact_list_member_view.js',
        'js/view/search_person_view.js',
        'js/view/search_person_result_view.js',
        'js/view/message_box.js',
        'js/view/dialog_select_community_confirm_authority_member_view.js',
        'js/view/dialog_select_community_change_authority_member_view.js',
        'js/view/wizard_view.js',
        'js/view/select_and_add_project_view.js',
        'js/view/dialog_project_list_view.js',
        'js/view/dialog_public_project_list_view.js',
        'js/view/select_user_list_view.js',
        'js/view/dialog_add_chat_list_view.js',
        'js/view/dialog_thread_title_list_view.js',
        'js/view/dialog_thread_title_update_view.js',
        'js/view/dialog_update_message_view.js',
        'js/view/dialog_emotion_point_person_list.js',
        'js/view/dialog_point_ranking_view.js',
        'js/view/side_menu_recent_view.js',
        'js/view/side_menu_murmur_view.js',
        'js/view/dialog_send_murmur_message_view.js',
        'js/view/dialog_murmur_list_view.js',
        'js/view/dialog_murmur_column_name_set_view.js',

        'js/view/codimd/sidebar_note_view.js',
        'js/view/codimd/dialog_create_note_view.js',
        'js/view/codimd/dialog_note_list_view.js',
        'js/view/codimd/dialog_remove_note_view.js',
        'js/view/codimd/dialog_assign_note_view.js',
        'js/view/codimd/codimd_view_utils.js',
        'js/view/codimd/dialog_assign_note_on_send_message_view.js',

        'js/read_plugin.js',
        'js/portal/main.js',
        'js/view/dialog_search_option_view.js'
    ];

    for (var _i = 0, _len = _js_files.length; _i < _len; ++_i) {
        document.write('<script src="' + _js_files[_i] + '?v=' + _cubee_version + '"></script>');
    }

})();
(function () {
    if (typeof window.console === "undefined") {
        window.console = {};
    }
    if (typeof window.console.log === "undefined") {
       window.console.log = function () {} ;
    }
})();
