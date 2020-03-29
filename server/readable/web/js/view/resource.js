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
(function () {
    var Globalize;
    Globalize = global.Globalize;

    Globalize.addCultureInfo('ja', {
        messages: {
            'label_separator' : ':',

            'login_header' : 'ログイン',
            'login_tenantname_placeholder' : 'テナント名',
            'login_username_placeholder' : 'アカウント名',
            'login_password_placeholder' : 'パスワード',
            'login_btn' : 'ログイン',

            'failed_to_fetch_authority_data' : '権限情報の取得に失敗しました。',
            'unauthorized_assignment' : 'ユーザに割り当てられたアカウントタイプの取得に失敗しました。アカウントタイプの割当を管理者へ依頼してください。',
            'policy_manage' : '管理',
            'policy_send' : '投稿/閲覧',
            'policy_view' : '閲覧のみ',
            'conf_community_change_authority_tooltip' : '権限変更',
            'conf_confirm_authority_tooltip' : 'メンバー確認',
            'dialog_label_alter_member_list': 'メンバー一覧',
            'not_selected_authority_info' : '権限が設定されていないメンバーが存在します。',

            'loginErrMsg': '認証に失敗しました。テナント名、 アカウント名 または パスワード が正しくありません。',
            'loginErrTenantContain': 'テナント名を入力してください。',
            'loginErrUserLength1': 'アカウント名の長さは ',
            'loginErrUserLength2': ' ～ ',
            'loginErrUserContain': 'アカウント名を入力してください。',
            'loginErrPasswordLength1': 'パスワードの長さは ',
            'loginErrPasswordLength2': ' ～ ',
            'loginErrPasswordContain': 'パスワードを入力してください。',
            'skipLoginAccessTokenErrMsg':'認証に失敗しました。再度ログインしてください。',
            'skipLoginSwitchProtocolErrMsg':'プロトコルの変更に失敗しました。再度ログインしてください。',
            'skipLoginErrMsg':'認証に失敗しました。再度ログインしてください。',

            'loading': '読み込み中',
            'save': '保存',
            'edit': '編集',

            'presence_chat' : 'オンライン',
            'presence_away' : '退席中',
            'presence_xa' : '外出・出張中',
            'presence_dnd' : '取り込み中',

            'my_memo_placeholder' : 'ひとことメモ',

            'header_add_column' : 'カラムを追加します',
            'header_switch_to_list' : 'リスト表示に切り替えます',
            'header_switch_to_columns' : 'カラム表示に切り替えます',
            'header_context_search' : 'キーワード検索を行います',
            'header_button_option' : 'オプション',
            'header_context_search_placeholder' : 'メッセージを検索',
            'MyWorkplace' : 'ダッシュボード',
            'MyFeed': 'フィード',
            'Mention': '自分宛',
            'ToMe': '自分宛',
            'Chat': 'チャット',
            'Task': 'タスク',
            'MyTask' : 'マイタスク',
            'Inbox': 'インボックス',
            'Search': '検索',
            'GroupChat' : 'グループチャット',
            'Mail' : 'メール',
            'CommunityFeed' : 'プロジェクトフィード',
            'CommunityTask' : 'タスク',
            'Questionnaire' : 'アンケート',
            'Murmur' : 'つぶやき',
            'ContextSearchCommunityTask' : 'プロジェクトタスク',
            'blink_title' : '　　　　　　　　　　　　　',
            'NotReferableColumnTitle' : '参照不可',
            'Community' : 'プロジェクト',
            'RecentPostedMessages' : '新着',
            'RecentSideBarTitle' : '新着メッセージ',
            'MurmurSideBarTitle' : 'つぶやき一覧',
            'MurmurSendButtonTitle' : 'つぶやく',
            'MurmurSideBarOpenCloseButton' : 'つぶやき',
            'RecentQuickFilterOnlyToMe': '自分宛のみ',
            'RecentQuickFilterUnread': '未読メッセージ',
            'RecentQuickFilterFile': '添付ファイル有',
            'RecentQuickFilterAllRead': 'まとめて既読',
            'ShowConversation' : '会話を見る',
            'MyQuestionnaire' : 'マイアンケート',
            'QuestionnaireOption' : '選択肢',

            'ContactList' : 'コンタクトリスト',
            'GroupChatList' : 'グループチャットリスト',
            'PublicGroupChatList' : '公開グループチャットリスト',
            'CommunityList' : 'プロジェクトリスト',
            'PublicCommunityList' : '公開プロジェクトリスト',
            'CommunityMemberList' : 'プロジェクトメンバー',
            'CommunityDetail' : 'プロジェクト詳細',

            'group_title_no_group' : '所属グループなし',
            'group_title_all' : '全員',
            'room_group_title_all' : 'ルーム全メンバー',
            'group_title_favorite' : 'お気に入り',
            'group_title_group_member' : 'グループメンバー',
            'group_title_community_member' : 'プロジェクトメンバー',

            'column_btn_submit' : '投稿',
            'column_btn_submit-tooltip' : 'ctrl+enterで投稿',
            'column_btn_filter' : 'フィルタ',
            'column_btn_search' : '検索',

            'column_btn_message_area_open_close' : '投稿領域の開閉',
            'column_btn_close' : 'カラムを閉じる',

            'show_past_reply_txt' : 'すべてのコメント({0}件)を表示',
            'hidden_past_reply_txt' : '古いコメントを非表示',

            'config_profile' : 'プロフィール',
            'config_password' : 'パスワード',
            'config_mail_cooperation' : 'メール連携',
            'config_logout' : 'ログアウト',
            'config_avator_zoom_in': '拡大',
            'config_avator_zoom_out': '縮小',
            'config_submit_buttom': '登録',

            'config_profile_title': 'プロフィール変更',
            'config_profile_image_label' : '画像を変更',
            'config_profile_avater_label' : 'アバター画像',
            'config_profile_nickname_label' : 'ニックネーム',
            'config_profile_mail_address' : 'メールアドレス',
            'config_profile_group' : '所属',
            'config_profile_group_notes': '※兼務など、所属が複数ある場合はカンマ(,)で区切ってください',
            'config_user_status' : 'ステータス',
            'config_account_type' : 'アカウントタイプ',
            'config_dashboard_background_image' : 'ダッシュボード背景設定',

            'config_profile_change_failed' : 'プロフィールの変更に失敗しました。',
            'config_profile_image_failed' : '画像データを選択していません。',
            'config_profile_image_large' : '選択した画像データはサイズが大きすぎます。',
            'config_profile_nickname_empty' : 'ニックネームを入力してください。',
            'config_profile_group_must' : '未入力の所属があります。',
            'config_profile_group_txt' : '全角で入力してください。',
            'config_profile_group_empty' : '所属は5個まで指定可能です。',
            'config_profile_group_complexity' : '所属は100文字以内で入力してください。',
            'config_profile_group_list_err' : '所属一覧取得に失敗しました。再度ダイアログを開きなおしてください。',


            'config_password_title': 'パスワード変更',
            'config_password_current_label' : '現在のパスワード',
            'config_password_new_label' : '新しいパスワード',
            'config_password_new_confirm_label' : '新しいパスワード(確認用)',
            'config_password_notes': '※パスワードの長さは8～32とし、半角英文字、数字、記号をそれぞれ最低1文字入力してください。',
            'config_password_complexity': '半角英文字、数字、記号をそれぞれ最低1文字入力してください。',

            'config_password_current_must' : '現在のパスワードを入力してください。',
            'config_password_new_must' : '新しいパスワードを入力してください。',
            'config_password_new_confirm_must' : 'パスワードが一致しません。',

            'config_password_change_failed' : 'パスワードの変更に失敗しました。' ,
            'config_current_password_invalid' : '現在のパスワードが不正です。' ,

            'config_mail_cooperation_check_cooperation_label' : 'メール連携をする',
            'config_mail_cooperation_server_label' : 'サーバ : ',
            'config_mail_cooperation_mail_address_label' : 'メールアドレス : ',
            'config_mail_cooperation_pop3_account_label' : 'POP3アカウント  : ',
            'config_mail_cooperation_pop3_password_label' : 'POP3パスワード  : ',

            'config_mail_cooperation_error_mail_address_must' : 'メールアドレスを入力してください。',
            'config_mail_cooperation_error_mail_server_account_must' : 'メールサーバのアカウントを入力してください。',
            'config_mail_cooperation_error_mail_server_password_must' : 'メールサーバのパスワードを入力してください。',
            'config_mail_cooperation_error_mail_address_invalid' : 'メールアドレスがASCII文字で入力してください。',
            'config_mail_cooperation_error_mail_server_password_invalid' : 'パスワードはASCII文字で入力してください。',

            'tab_not_referable_community' : '参照不可',

            'setting_community_dialog_title' : 'プロジェクト設定',
            'community_add_member_dialog_title' : 'メンバーの追加',
            'community_force_leave_member_dialog_title' : 'メンバーの退会',
            'community_change_owner_dialog_title' : '管理者変更',

            'button_create' : '作成',
            'button_update' : '更新',
            'button_force_leave' : '退会',


            'config_community_change_failed' : 'プロジェクトの変更に失敗しました。',
            'config_community_logo_failed' : '画像データを選択していません。',
            'config_community_community_large' : '選択した画像データはサイズが大きすぎます。',
            'config_community_title_empty' : 'プロジェクト名を入力してください。',
            'not_exist_in_list' : '一覧にアカウントが追加されていません。',
            'not_force_leave_yourself' : 'あなた自身を退会することができません',
            'exist_in_list' : 'は一覧内に追加されています。',
            'not_referable_community' : 'このプロジェクトを参照することはできません',
            'not_referable_groupchat' : 'このグループチャットを参照することはできません',
            'authchanged_force_reload_community' : 'プロジェクト内の権限が変更されました。画面を更新してください。',
            'authchanged_force_reload_groupchat' : 'グループチャット内の権限が変更されました。画面を更新してください。',

            'create_community_dialog_title' : 'プロジェクト作成',
            'community_title' : 'プロジェクト名',
            'community_description' : '説明',
            'community_privacy' : '公開設定',
            'community_member_entry_type' : '参加タイプ',
            'community_color' : 'プロジェクトカラー',
            'community_logo' : 'プロジェクト画像',
            'community_detail_label_owner' : '管理者',


            'community_privacy_open' : '公開',
            'community_privacy_close' : '非公開',
            'community_privacy_secret' : '秘密',

            'community_member_entry_type_add' : '追加のみ',
            'community_member_entry_type_invite' : '招待のみ',
            'community_member_entry_type_invite_or_accept' : '招待または承認',
            'community_member_entry_type_invate_or_free' : '招待または自由',

            'conf_community_setting_tooltip' : '設定',
            'conf_community_change_owner_tooltip' : '権限変更',
            'conf_community_add_member_tooltip' : 'メンバー追加',
            'conf_community_leave_member_tooltip' : 'メンバー退会',
            'conf_community_withdraw_member_tooltip' : 'プロジェクトから脱退',

            'add_member_submit' : '追加実行',

            'force_leave_member' : 'メンバーを退会',

            'add_owner' : '管理者を追加',
            'owner_list' : '管理者一覧 : ',

            'presence' : '●',
            'suspend' : '(利用停止中)',

            'goodjob' : 'いいね!',


            'whole_text' : '全て表示',
            'abbreviation' : '省略する',

            'omit' : '省略する',
            'view_all' : '全て表示',

            'action_show_conversation' : '会話を見ます',
            'action_reply' : '返信します',
            'action_add_inbox_task' : 'インボックスに追加します',
            'action_doing_task' : '進行中にします',
            'action_finish_task' : '終了にします',
            'action_edit_task' : '編集します',
            'action_accept_new_task' : '依頼を引受けます',
            'action_reject_task' : '依頼を断ります',
            'action_demand_task' : '催促します',
            'action_clear_demanded_task' : '催促を取消します',
            'action_add_new_task_from_message' : 'タスクを登録します',
            'action_add_new_task_from_inbox' : 'タスクを登録します',
            'action_delete_message' : '削除します',
            'action_delete_task' : '削除します',
            'action_delete_from_inbox' : '削除します',

            'presence_offline' : 'オフライン',
            'presence_offline_cut' : 'オフライン',
            'presence_offline_cutUp' : 'オフライン',
            'presence_online' : 'オンライン',
            'presence_staway' : '退席中',
            'presence_exaway' : '外出・出張中',
            'presence_nodisturb' : '取り込み中',

            'notification_items' : '件',

            'group_chat_notification_join' : '参加',
            'group_chat_notification_add_member' : 'メンバー追加',
            'group_chat_notification_remove_member' : 'メンバー削除',
            'group_chat_notification_remove_member_own' : 'メンバーから外れました',
            'group_chat_notification_update_room_name' : 'からタイトル変更',
            'group_chat_notification_change_authority' : '権限変更',
            'community_notification_change_info' : 'プロジェクト情報変更',
            'community_notification_change_authority' : '権限変更',
            'get_room_list_err' : 'リストの取得に失敗しました 時間をおいて再度実行してください',


            'task_title_add' : 'タスク追加',
            'task_title_view' : 'タスク参照',
            'task_title_edit' : 'タスク更新',
            'task_title_registerTask' : 'タスクを登録',
            'task_registerTask_btn' : 'タスクを登録',
            'task_reloadTask_btn' : '更新',
            'task_title_editTask' : 'タスクを編集',
            'questionnaire_registerQuestionnaire_btn':'アンケートを登録',
            'questionnaire_reloadQuestionnaire_btn' : '更新',

            'questionnaire_title_createQuestionnaire' : 'アンケートを登録',

            'task_statuc_reject' : '-',
            'task_statuc_other' : '■',
            'notification' : '通知',
            'demand_notification' : '催促されたタスクがあります',

            'task_user_arrow' : '&nbsp;&#9654;&nbsp;',

            'task_user_count' : '名',
            'task_user_other' : '他',

            'task_show_owner' : '担当者を表示',

            'task_owner' : '担当者:',
            'task_owner_edit' : '担当者',

            'task_client' : '依頼者',

            'task_priority_title' : '優先度',
            'task_priority_low' : '低',
            'task_priority_medium' : '中',
            'task_priority_high' : '高',
            'task_priority_top' : '最優先',

            'task_status' : 'ステータス',
            'task_to_inbox_omit' : 'IN',
            'task_status_assign_omit' : '割',
            'task_status_new_omit' : '受',
            'task_status_do_omit' : '進',
            'task_status_fin_omit' : '終',
            'task_status_rej_omit' : '却',
            'task_to_inbox' : 'INBOX',
            'task_status_assign' : '割当中',
            'task_status_new' : '新規',
            'task_status_do' : '進行中',
            'task_status_fin' : '終了',
            'task_status_rej' : '却下',
            'task_status_req' : '依頼',
            'task_status_accept' : '受付済',

            'task_demand' : '急いで',

            'task_filter_dialog_title' : 'フィルタ',
            'task_refilter_dialog_title' : 'フィルタ',
            'task_filter' : 'フィルタ',

            'task_type' : '種別',
            'task_request_type' : '依頼の種別',
            'task_request_type_client' : '依頼したタスク',
            'task_request_type_owner' : '依頼されたタスク',
            'task_request_type_self' : '自分だけのタスク',
            'task_demand_status' : '催促されている',
            'task_due_date_date' : '終了日',
            'task_due_date_to' : 'まで',
            'task_created_term' : '作成日時',

            'task_startdate_label' : '開始',
            'task_enddate_label' : '終了',

            'task_unfinished_number' : '未完了 : ',
            'inbox_item_number' : 'アイテム数 : ',
            'toggle' : 'カラムヘッダー領域の表示/非表示を切り替えます',

            'questionnaire_inputtype_title' : 'タイプ',
            'questionnaire_inputType_radiobox' : '単一選択',
            'questionnaire_inputType_checkbox': '複数選択',
            'questionnaire_resultVisible_title' : '結果',
            'questionnaire_resultVisible_public' : '公開',
            'questionnaire_resultVisible_private': '非公開',
            'questionnaire_graphType_title' : 'グラフ',
            'questionnaire_graphType_pie' : '円グラフ',
            'questionnaire_graphType_bar': '棒グラフ',
            'questionnaire_range_title' : '範囲',
            'questionnaire_item_add' : '選択肢追加',
            'questionnaire_item_option' : '選択肢',
            'questionnaire_range_value' : 'フィード',
            'questionnaire_range_value_no_select' : '選択してください',
            'questionnaire_dialog_range_title' : '範囲選択',
            'questionnaire_dialog_error_no_select_range' : '対象範囲を選択してください',
            'questionnaire_dialog_error_nothing_room' : '投稿可能なルームがありません',
            'questionnaire_dialog_error_send' : 'アンケート作成に失敗しました',
            'questionnaire_start_date' : '開始日時',
            'questionnaire_due_date' : '終了日時',
            'questionnaire_option_text': '内容',

            'questionnaire_dialog_range_feed' : 'フィード',
            'questionnaire_dialog_range_community' : 'プロジェクト',
            'questionnaire_dialog_range_group' : 'グループチャット',
            'questionnaire_range_community_name' : 'プロジェクト名',
            'questionnaire_range_group_name' : 'グループ名',

            'custom_filter_label_sender' : '投稿者',
            'custom_filter_label_having_attached_file_and_url' : '添付ファイル／URL',
            'custom_filter_label_having_attached_file' : '添付ファイルあり',
            'custom_filter_label_having_url' : 'URLあり',
            'custom_filter_label_attached_file' : '添付ファイル',
            'custom_filter_label_url' : 'URL',
            'custom_filter_label_term' : '期間',
            'custom_filter_label_term_24_hours' : '24時間以内',
            'custom_filter_label_term_48_hours' : '48時間以内',
            'custom_filter_label_term_1_week' : '1週間以内',
            'custom_filter_label_term_1_month' : '1ヶ月以内',
            'custom_filter_label_term_1_year' : '1年以内',
            'custom_filter_error_text': 'が入力されていません。',
            'custom_filter_inbox_label_sender' : '投稿者／依頼者',
            'custom_filter_label_unread_message' : '未読メッセージ',

            'suffix_for_reply_title':'への返信',

            'dialogerrorTaskFilterText': 'が入力されていません。',
            'dialogerrorTaskFilterCheckbox': 'が選択されていません。',
            'system_message_server_disconnected' : 'サーバから切断されました。',
            'mail_setting_error_message' : 'メール連携の設定に失敗しました。',
            'no_server_info' : 'サーバ情報なし',

            'dialog_error_invalid_input' : '入力が正しくありません。',

            'task_status_solved' : '解決',
            'task_status_fb' : 'フィードバック',

            'task_start_date' : '開始日時',
            'task_due_date' : '終了日時',

            'task_name_placeholder': 'タスク名(ステータスが割当中、新規、進行中は必須)',
            'task_name': 'タスク名',
            'task_body': '内容',

            'task_body_placeholder': '内容',
            'task_register_name_placeholder': '50文字以内',
            'questionnaire_body_placeholder': '内容',

            'task_update_title' : 'タスクが更新されました。\n タイトル：',
            'task_update_user' : '\n 更新者：',

            'task_multi_selection' : '(複数可)',
            'task_non_multi_selection' : '(複数不可)',

            'task_error_taskname' : 'タスク名を入力してください。',
            'task_error_wrong_datetime' : '日時が不正です。',
            'task_error_statu_due_datetime' : '開始日時は未来日でかつ終了日時より前の日時を入力してください。',
            'task_error_taskname_length' : 'タスク名が長すぎます。',
            'task_error_content_length' : '内容が長すぎます。',
            'task_error_owner_select' : '担当者を入力してください',
            'task_error_not_defined' : '登録フォーマットは定義されていません。',

            'date_year' : '年',
            'date_month' : '月',
            'date_day' : '日',
            'date_hour' : '時',
            'date_minute' : '分',

            'file_up_title' : 'ファイルを添付します(20MB未満)',

            'calendar_picker_title' : '...',

            'reply_button' : '返信',

            'default_placeholder' : 'メッセージを入力してください。',
            'not_send_to_feed_err_placeholder' : 'フィードメッセージの投稿権限がありません',
            'not_view_to_feed_err_placeholder' : 'フィードメッセージの閲覧権限がありません。 システムメッセージのみ表示されます。',
            'not_send_to_community_err_placeholder' : 'プロジェクトメッセージ投稿権限がありません',
            'not_send_to_groupchat_err_placeholder' : 'グループチャット投稿権限がありません',
            'not_view_to_murmur_err_placeholder' : 'つぶやきメッセージの閲覧権限がありません',

            'title_placeholder' : 'タイトルを入力してください(省略可)。',
            'title_select_category' : 'タイトルのカテゴリを選択',

            'reply_placeholder' : '返信メッセージを入力してください。',

            'inbox_placeholder' : 'インボックスへ追加する内容を入力してください。',

            'inbox_submit' : '追加',

            'inbox_add_date' : '追加日 : ',

            'dialogerrorSearch': 'キーワードが入力されていません。',
            'dialogerrorSearchOneChar': '半角英数字や一部半角記号の1文字の検索はできません。',
            'dialogerrorSelect' : '検索対象が選択されていません。',

            'search_option_title' : '検索オプション',
            'search_option_label' : '検索対象',
            'search_option_checked_all' : '全てON',
            'search_option_unchecked_all' : '全てOFF',

            'search_result_message_none' : '該当なし',

            'column_option_filter' : '検索',
            'column_option_group_chat_add_member' : 'メンバー追加',
            'column_option_group_chat_change_authority_member' : '権限変更',
            'column_option_group_chat_leave_member' : 'メンバー退会',
            'column_option_group_chat_unsubscribe' : 'グループを退会',
            'column_option_public_group_chat_unsubscribe' : 'グループチャットからの脱退',
            'column_option_group_chat_update_room_info' : 'グループチャット設定',
            'column_option_group_chat_list_member' : 'メンバー確認',
            'column_option_add_myworkplace' : 'ダッシュボードにカラムを追加',
            'column_option_custom_filter' : 'フィルタ',
            'column_option_notification_off' : '通知をオフにする',
            'column_option_notification_on' : '通知をオンにする',
            'column_option_thread_title_list' : 'タイトル一覧',

            'column_unexpected_error': '予期せぬエラーが発生しました',

            'dialog_label_ok' : 'OK',
            'dialog_label_ok2' : 'OK',
            'dialog_label_cancel' : 'キャンセル',
            'dialog_label_save' : 'OK',
            'dialog_label_keyword' : 'キーワード  : ',
            'dialog_filter_title' : '検索',
            'dialog_context_search_title' : 'キーワード検索',
            'dialog_add_column_title' : 'カラム追加',
            'dialog_delete_conf_message' : '削除します。よろしいですか？',
            'dialog_delete_conf_message_for_community' : 'このタスクはプロジェクトメンバー全員で共有しています。<br>削除すると、他のメンバーからも参照できなくなります。<br><br>本当に削除しますか？',
            'dialog_delete_conf_message_for_contactlist' : 'コンタクトリストから削除しますか？',
            'dialog_cancel_title' : 'キャンセル',
            'dialog_option_title' : 'オプション',
            'dialog_close_title' : '閉じる',
            'dialog_label_account' : 'アカウント名  : ',
            'dialog_placeholder_account' : '@に続けてアカウント名を入力',
            'dialog_show_conversation_title' : '会話を見る',
            'dialog_label_roomname' : 'タイトル  : ',
            'dialog_placeholder_roomname' : 'タイトルを入力',
            'dialog_confirmation_title' : '確認',
            'dialog_label_close' : '閉じる',
            'dialog_label_more_view': 'もっと見る',

            'dialog_label_input_member' : 'メンバーを入力 : ',
            'dialog_title_group_chat_add_member': 'メンバーの追加',
            'dialog_label_add_member_list' : '追加者一覧 : ',
            'dialog_label_remove_member_list' : '退会者一覧 : ',
            'dialog_confirmation_unsubscribe' : '退会しますか？',
            'dialog_title_group_chat_change_authority_member' : '権限変更',
            'dialog_title_group_chat_leave_member' : 'メンバーの退会',
            'dialog_button_add_to_member_list' : '一覧に追加>',

            'add_followee_text' : 'フォローする',
            'del_followee_text' : 'フォローを外す',
            'dialog_title_followee' : 'フォローリスト',
            'dialog_title_follower' : 'フォロワーリスト',
            'dialog_label_followee_search' : 'フォロー名で検索',
            'dialog_label_follower_search' : 'フォロワー名で検索',
            'dialog_followee_list_nothing' : 'フォローが追加されていません。',
            'dialog_follower_list_nothing' : 'フォロワーが追加されていません。',
            'dialog_followee_list_search_nothing' : '対象のフォローユーザが見つかりませんでした。',
            'dialog_follower_list_search_nothing' : '対象のフォロワーユーザが見つかりませんでした。',

            'murmur_btn_text' : 'つぶやき参照',
            'dialog_murmur_show_unfollow_mess' : '未フォローのみ',
            'dialog_murmur_show_all_follow_mess' : '全つぶやき',
            'dialog_murmur_list' : 'つぶやいているユーザリスト',
            'side_menu_view_fix' : 'つぶやき一覧ピン留めする',
            'side_menu_view_unfixed' : 'つぶやき一覧ピン留め外す',

            'dialog_tab_new' : '新規',
            'dialog_title_chatlist' : 'チャットリスト',
            'dialog_label_chatlist_search' : 'チャット名で検索',
            'dialog_chatlist_search_nothing' : '一致するチャットは見つかりませんでした。',
            'dialog_chatlist_nothing' : 'チャットが設定されていません。',

            'dialog_title_create_groupchat' : 'グループチャットの作成',
            'dialog_note_1_create_groupchat' : '※このプロジェクトに作成されます。',

            'dialog_label_groupchatlist_search' : 'グループチャットチャット名で検索',
            'dialog_groupchatlist_search_nothing' : '一致するグループチャットは見つかりませんでした。',
            'dialog_groupchatlist_nothing' : '所属グループチャットはありません。',

            'dialog_label_projectlist_search' : 'プロジェクト名で検索',
            'dialog_projectlist_search_nothing' : '一致するプロジェクトは見つかりませんでした。',
            'dialog_projectlist_nothing' : '所属プロジェクトはありません。',

            'dialog_public_groupchat_joining' : '参加',
            'dialog_public_community_joining' : '参加',

            'dialog_title_system_info' : 'お知らせ',
            'dialog_title_add_favorite' : 'お気に入りグループに追加',
            'dialog_title_remove_favorite' : 'お気に入りグループからの削除',
            'dialog_label_remove' : '[[1]]を[[2]]から削除しますか？',
            'dialog_label_keyword_and' : 'and検索 : キーワード1 キーワード2 ・・・',
            'dialog_label_keyword_or' : 'or検索 : キーワード1 +キーワード2 + ・・・',
            'dialog_label_remove_member' : 'グループを退会します。よろしいですか？',
            'dialog_label_project_remove_member' : 'プロジェクトを退会します。よろしいですか？',

            'dialog_title_remove_followee_user': 'フォローリストから削除',
            'err_not_selected_followee_user': '対象のフォローユーザが選択されていません',

            'dialog_label_remove_user': '削除',
            'dialog_title_remove_chatlist_user': 'チャットリストから削除',
            'err_not_selected_user': '対象ユーザが選択されていません',

            'dialog_label_thread_title_list': 'タイトル一覧',
            'dialog_label_thread_search': 'タイトル名で検索',

            'dialog_label_thread_title_update': 'タイトル編集',
            'dialog_placeholder_title': 'タイトルを入力してください',
            'dialog_update_title_note': '※設定されたタイトルを削除する際は、何も入力せずにOKを押下してください',
            'dialog_update_title_validation_error': 'タイトルは50文字以下で設定してください',
            'dialog_update_title_error': 'タイトルの更新に失敗しました。',
            'dialog_thread_title_list_get_error': 'タイトル一覧取得に失敗しました。',
            'dialog_thread_title_nothing': 'タイトルが設定されていません。',
            'dialog_thread_title_search_nothing': '一致するタイトルは見つかりませんでした。',

            'dialog_label_update_message': 'メッセージ編集',
            'dialog_update_message_error': 'メッセージの編集に失敗しました。',
            'dialog_update_message_number_error': '文字以下で入力してください。',
            'dialog_update_message_nothing_error': 'メッセージを入力してください。',
            'dialog_update_file_error': 'ファイルのアップロードに失敗しました。',

            'dialog_label_quote_message': 'メッセージ共有',
            'dialog_select_quote_room': '投稿先のルームを選択',
            'dialog_selected_quote_room': '選択中のルーム',
            'dialog_comment_for_quote_message': '共有元メッセージに対するコメント',
            'dialog_quote_message': '共有後の表示イメージ',
            'dialog_quote_message_attention_anonymous': '※公開設定が非公開となっているプロジェクトとグループチャット、及びチャットはメッセージの投稿者情報は共有されません。',
            'dialog_label_not_select_quote_room_error' : '投稿する宛先を選択してください。',
            'dialog_label_send_quote_message_error' : '共有メッセージの投稿に失敗しました。',
            'dialog_error_no_chatlist': 'チャットリストが登録されていません。',
            'dialog_error_no_groupchat': '所属グループチャットはありません。',
            'dialog_search_room_nothing': '該当するルームはありません。',
            'dialog_search_room_name': 'ルーム名で検索',

            'data_modal_emotion': 'サンクスポイント付与',
            'dialog_label_list_emotion_point': 'サンクスポイント',

            'dialog_goodjob_point_ranking': 'いいね!取得数ランキング',
            'dialog_select_ranking_period': '集計期間を選択',
            'dialog_ranking_week': '1週間',
            'dialog_ranking_month': '1ヶ月',
            'dialog_ranking_year': '1年',
            'dialog_thanks_point_ranking': 'サンクスポイント取得数ランキング',
            'dialog_error_get_ranking': 'ランキング情報の取得に失敗しました。',
            'dialog_error_nothing_ranking': 'ランキング情報が存在しません。',

            'dialog_error_nothing_murmur': 'つぶやいているユーザが存在しません。',

            'dialog_label_create_note': 'ノート作成',
            'dialog_label_note_name': 'ノート名',
            'dialog_placeholder_note_name': '作成するノートの名前を入力してください',
            'dialog_error_note_name': 'ノートの名前を入力してください',
            'dialog_create_note_validation_error': 'ノート名は50文字以下で設定してください',
            'dialog_error_create_note': 'ノート作成に失敗しました',
            'dialog_label_get_note_list': 'ノート一覧',
            'dialog_label_search_note_list': 'ノート名、ルーム名で検索',
            'dialog_error_get_note_list': 'ノート一覧取得に失敗しました',
            'dialog_error_note_search_nothing': '一致するノートは見つかりませんでした',
            'dialog_label_remove_note': 'ノート削除',
            'dialog_note_nothing': 'ノートが作成されていません',
            'dialog_note_nothing_for_assign': '割当可能なノートがありません',
            'dialog_error_select_remove_notes': '削除するノートを選択してください',
            'dialog_error_failed_remove_notes': 'ノート削除に失敗しました 時間をおいて再度実行してください',
            'not_assign_room_notes': '未割り当て',
            'dialog_label_assign_note': 'ノート割当',
            'dialog_error_assign_note': 'ノート割当に失敗しました',
            'dialog_error_no_select_assign_note': 'ノートを選択してください',
            'tootip_assign_note': 'ノートを割り当てます',
            'dialog_label_select_assign_note': 'スレッドへ割り当てるノートを選択',
            'dialog_selected_note': '選択中ノート',
            'dialog_error_assign_note_after_try': 'ノート割当に失敗しました。再度ノート割当を実行してください。',
            'dialog_error_send_message': 'メッセージ投稿に失敗しました。時間をおいて再度お試しください。',
            'dialog_title_note_error' : 'お知らせ',
            'dialog_error_note_rename' : 'ノート名の変更に失敗しました、時間を置いて再実行してください。',

            'dialog_label_murmur_send_message': 'つぶやき投稿',

            'default_group_chat_suffix' : 'のチャット',
            'group_chat_start_title' : 'グループチャット',
            'group_chat_start_explain' : 'ユーザクリックで参加者を追加',
            'group_chat_start_label_title' : 'グループ名:',
            'group_chat_start_label_selected_users' : '選択ユーザ:',
            'group_chat_start_label_start_button' : 'チャット開始',
            'group_chat_start_label_cancel_button' : 'キャンセル',
            'group_chat_start_selected_users_count_suffix' : '名',

            'gorup_chat_member_label' : 'メンバー',
            'group_chat_member_count_suffix' : '名',

            'add_member_err_contactlist' : 'は、コンタクトリスト内のユーザを入力してください。',
            'add_member_err_not_exist_account' : 'は、存在しません。存在するアカウントを入力してください。',
            'add_member_err_exist' : 'は、既にメンバーです。',
            'add_member_err_input' : 'アカウントの形式で入力してください。',
            'add_member_err_not_exist' : 'は、メンバーではありません。',
            'group_chat_add_member_err_wrong_account' : 'は、アカウントの形式で入力してください。',

            'add_member_err_submit' : 'メンバーの追加処理に失敗しました。時間を置いて、同じ処理をもう一度お試しください。',
            'add_member_err_authority_change' : 'メンバーの追加処理に失敗しました。権限管理機能から権限の紐付を行ってください。',
            'change_member_authority_err' : '権限変更に失敗しました。時間を置いて、同じ処理をもう一度お試しください。',
            'leave_member_err' : 'メンバー退会に失敗しました。時間を置いて、同じ処理をもう一度お試しください。',
            'leave_last_manager_member_err' : '最後の管理者メンバーです、退会には管理者以外のメンバーが退会している必要があります。',
            'add_member_err_authority' : '権限の紐付けに失敗しました。',
            'not_assign_account_type_err' : 'にアカウントタイプが紐づいていません。テナント管理者に設定を依頼してください。',
            'authority_err' : '実行する権限がありません。',
            'authority_err_on_add_member' : 'メンバーの追加処理に失敗しました。権限管理機能から、追加したユーザの権限を設定するようにプロジェクトの管理者に依頼してください。',
            'groupchat_community_err': 'グループチャットの作成に失敗しました。時間をおいて、同じ処理をもう一度お試しください。',
            'create_community_err': 'プロジェクトの作成に失敗しました。時間をおいて、同じ処理をもう一度お試しください。',

            'subview_title' : 'アクション:',
            'subview_label_selected_user' : '選択ユーザ:',
            'subview_label_selected_user_suffix' : '名',
            'subview_btn_title_start_chat' : 'チャットを開始します',
            'subview_btn_title_start_group_chat' : 'グループチャットを開始します',
            'subview_btn_title_add_contact_list' : 'コンタクトリストに追加します',
            'subview_btn_title_remove_contact_list' : 'コンタクトリストから削除します',
            'subview_btn_title_add_favorite' : 'お気に入りに追加します',
            'subview_btn_title_community_unsubscribe_member' : 'メンバーを退会させます',
            'subview_btn_title_community_add_member' : 'メンバーを追加します',

            'sideview_btn_back_to_contact_list' : 'コンタクトリストに戻る',
            'sideview_label_search_result' : '検索結果',

            'sideview_tab_search_contact_list_member' : 'コンタクトリスト検索',
            'sideview_tab_search_all_user' : '全ユーザ検索',
            'sideview_text_search_placeholder': '検索キーワード',
            'sideview_btn_search_exec': '検索',

            'deleted_message_body' : 'このメッセージは削除されました。',
            'deleted_message_body_by_admin' : 'このメッセージは管理者によって削除されました。',

            'deleted_questionnaire_body' : 'このアンケートは削除されました。',
            'deleted_questionnaire_body_by_admin' : 'このアンケートは管理者によって削除されました。',

            'show_Action_ToolTip_button' : 'メッセージメニュー',

            'group_chat_error_room_name' : 'タイトルを入力してください。',

            'authority_changed_role' : 'あなたのアカウントタイプがテナント管理者によって変更されました。画面を更新してください。',


            'error_file_up_over_max_sixe' : '20MBを超えています',
            'error_file_up_request' : '内部エラーが発生しました',

            'read_message_control_title' : 'クリックすると既読状態となります',

            'read_in_bulk_control' : 'まとめて既読',
            'read_in_bulk_error_message' : 'メッセージの既読に失敗しました。',
            'read_in_bulk_attention_message' : 'カラム内へ表示されているメッセージを全て既読にします。',
            'read_in_bulk_attention_message_last_line' : 'よろしいですか？',
            'read_in_bulk_attention_nonify_message': '※表示されているメッセージのみに適応されます。',

            'Send': 'Send',
            'Favorite': 'Favorite',
            'Hashtag': 'Hashtag',
            'Favorite': 'Favorite',
            'List': 'List',

            'Friend' : 'Friend',
            'Family' : 'Family',
            'Java' : 'Java',
            'C' : 'C',

            'existing_reader_count' : '名',
            'existing_reader_other' : '他',
            'existing_reader_label' : '名が既読',
            'existing_reader_link' : '既読者一覧',
            'existing_reader_dialog_title' : '既読者一覧',

            'wizard_btn_next' : '次へ',
            'wizard_btn_before' : '前へ',
            'wizard_btn_start' : '開始',
            'wizard_btn_avater_up' : '拡大',
            'wizard_btn_avater_down' : '縮小',
            'wizard_profile_title' : 'プロフィールの情報を入力してください',
            'wizard_profile_nickname_label' : 'ニックネーム',
            'wizard_profile_avater_label' : 'アバター画像',
            'wizard_profile_avater_OK' : 'OK',
            'wizard_password_title' : 'パスワードを設定してください',
            'wizard_password_new_label' : '新しいパスワード',
            'wizard_password_new_confirm_label' : '新しいパスワード(確認用)',
            'wizard_password_not_specified_label' : '※パスワードの長さは8～32とし、半角英文字、数字、記号をそれぞれ最低1文字入力してください。登録が不要な方は',
            'wizard_password_skip_label' : 'スキップ',
            'wizard_password_not_specified_label_suffix' : 'していただけます。',
            'wizard_chatlist_title' : 'ユーザをチャットリストに追加します',
            'wizard_chatlist_conditions' : 'ニックネームまたは組織名で検索',
            'wizard_chatlist_conditions_account' : 'ニックネームまたはアカウント名で検索',
            'wizard_chatlist_allcheck' : 'すべて選択'
            ,
            'wizard_profile_change_failed' : 'プロフィールの変更に失敗しました。',
            'wizard_profile_image_failed' : '画像データを選択していません。',
            'wizard_profile_image_large' : '選択した画像データはサイズが大きすぎます。',
            'wizard_profile_nickname_empty' : 'ニックネームを入力してください。',

            'wizard_password_new_must' : '新しいパスワードを入力してください。',
            'wizard_password_new_confirm_must' : 'パスワードが一致しません。',
            'wizard_password_Length1': 'パスワードの長さは ',
            'wizard_password_Length2': ' ～ ',
            'wizard_password_Contain': 'パスワードを入力してください。',

            'wizard_chatList_add_failed' : 'チャットリストの追加に失敗しました。',

            'main_header_project_list_title' : 'プロジェクトを選択',

            'main_header_system_info' : 'お知らせ',
            'main_header_project_details' : 'プロジェクト詳細',
            'main_header_recent_list' : '新着メッセージ',

            'main_header_project_all' : '全てのプロジェクト',
            'main_header_create_project' : 'プロジェクトの作成',
            'main_header_public_project_list' : '公開中のプロジェクトへ参加',
            'project_list_title' : 'プロジェクトリスト',
            'public_project_list_title' : '公開プロジェクトリスト',
            'project_list_zero' : '所属プロジェクトはありません',

            'community_btn_avater_up' : '拡大',
            'community_btn_avater_down' : '縮小',
            'community_btn_avater_OK' : 'OK',
            'community_logo_setting_failed' : 'プロジェクト画像の設定に失敗しました。プロジェクト詳細画面にて再度登録してください。',

            'main_Left_sidebar_group_chatList' : 'グループチャットリスト',
            'main_Left_sidebar_group_add' : 'グループを追加',
            'main_Left_sidebar_group_all_chatList' : '全てのグループチャットリストを見る',

            'main_Left_sidebar_chatList' : 'チャットリスト',
            'main_Left_sidebar_project_all' : '全てのチャットリストを見る',
            'main_Left_sidebar_create_project' : 'ユーザを追加',

            'dialog_add_chat_no_user' : '追加ユーザが選択されていません',

            'push_notification_setting_title': 'Push通知設定',
            'push_notification_on': '通知する',
            'push_notification_off': '通知しない',
            'push_notification_alert_blocking': '通知がブロックされています。\n通知を受診するためにはブラウザの設定から通知を許可してください。',
            'push_notification_for_goodjob': 'さんがあなたのメッセージへいいね!しました！',
            'push_notification_for_thanks_point': 'さんがあなたのメッセージへサンクスポイントを付与しました！',
            'push_notification_for_questionnaire': 'さんによるアンケートが開始されました！',
            'push_notification_for_adduserfollow': 'さんにフォロー追加されました！',

            'vote_button_name' : '回答',
            'vote_startdate_status_text' : '開始',
            'vote_enddate_status_text' : '終了',
            'vote_toggle_display' : '投票領域を表示して回答する',
            'vote_toggle_hide' : '投票領域を折り畳む',
            'vote_status_label_before' : '未開始',
            'vote_status_label_after' : '終了済み',
            'vote_status_label_authority_err' : '投票不可',

            'stamp_name' : 'スタンプ',
            'dialog_title_stamp_error' : 'お知らせ',
            'dialog_error_send_stamp' : 'スタンプ投稿に失敗しました。時間をおいて再度お試しください。',

            'menthion_community_person_list_dialog_title' : 'メンション指定',
            'menthion_groupchat_person_list_dialog_title' : 'メンション指定',
            'menthion_button_force_selected' : '選択',
            'menthion_select_error' : 'メンション作成に失敗しました。',
            'menthion_icon_title' : '宛先を指定',

            'note_name_edit_botton_tooltip' : '編集',
            'note_name_save_botton_tooltip' : '保存',

            'set_murmur_column_name' : 'つぶやき名称変更',
            'dialog_label_murmur_column_name_set' : 'つぶやき名称変更',
            'dialog_placeholder_murmur_column_name' :  'つぶやき名称を入力してください',
            'dialog_set_murmur_column_name_note' : 'つぶやきカラムを別の名前に変更できます。<br />空欄を設定すると、デフォルト表示（つぶやき）に戻ります。',
            'dialog_update_column_name_validation_error' : 'つぶやき名称は20文字以下で設定してください',
            'dialog_update_column_name_error' : 'つぶやき名称の更新に失敗しました。',
        }
    });

    Globalize.addCultureInfo('en-US', {
        messages: {
            'label_separator' : ':',

            'login_username' : 'User name',
            'login_username_placeholder' : 'Name',
            'login_password' : 'Password',
            'login_password_placeholder' : 'Password',
            'login_btn' : 'Login',
            'login_faq' : 'FAQ',

            'failed_to_fetch_authority_data' : 'Faild to fetch authority data.',
            'unauthorized_assignment' : 'Faild to fetch account type of assigned to you. Beg it to administrator.',
            'policy_manage' : 'Manager',
            'policy_send' : 'Sender',
            'policy_view' : 'Viewer',

            'loginErrMsg': 'The username or password you entered is incorrect.',
            'loginErrUserLength1': 'Length of Username must be between ',
            'loginErrUserLength2': ' and ',
            'loginErrUserContain': 'You must enter your username.',
            'loginErrPasswordLength1': 'Length of Password must be between ',
            'loginErrPasswordLength2': ' and ',
            'loginErrPasswordContain': 'You must enter your password.',
            'skipLoginAccessTokenErrMsg':'Failed authentication. Please login again.',
            'skipLoginSwitchProtocolErrMsg':'Failed to switch protocol. Please login again.',
            'skipLoginErrMsg':'Failed authentication. Please login again.',

            'loading': 'loading',
            'save': 'save',
            'edit': 'edit',

            'presence_chat' : 'Online',
            'presence_away' : 'Away',
            'presence_xa' : 'External away',
            'presence_dnd' : 'Don\'t disturb',

            'my_memo_placeholder' : 'My memo',

            'header_add_column' : 'Add Column',
            'header_switch_to_list' : 'Switch to list',
            'header_switch_to_columns' : 'Switch to columns',
            'header_context_search' : 'Context search',
            'header_button_option' : 'Options',
            'header_context_search_placeholder' : 'Context Search',

            'MyWorkplace' : 'My Workplace',

            'MyFeed': 'Feed',
            'Mention': 'Watch Feed',
            'ToMe': 'Watch Feed',
            'Chat': 'Chat',
            'Task': 'Task',
            'MyTask' : 'My Task',
            'Inbox': 'Inbox',
            'Search': 'Search',
            'GroupChat' : 'Group Chat',
            'Mail' : 'Mail',
            'CommunityFeed' : 'Community Feed',
            'CommunityTask' : 'Task',
            'ContextSearchCommunityTask' : 'Community Task',
            'NotReferableColumnTitle' : 'Not Referable',
            'Community' : 'Community',
            'RecentPostedMessages' : 'Recent',
            'ShowConversation' : 'Show Conversation',
            'Questionnaire' : 'Questionnaire',
            'MyQuestionnaire' : 'My Questionnaire',
            'QuestionnaireOption' : 'Option ',

            'ContactList' : 'Contact List',
            'GroupChatList' : 'Group Chat List',
            'CommunityList' : 'Community List',
            'CommunityMemberList' : 'Community Member List',
            'CommunityDetail' : 'Community Detail',

            'group_title_no_group' : 'No Group',
            'group_title_all' : 'All',
            'room_group_title_all' : 'All Room Members',
            'group_title_favorite' : 'Favorite',
            'group_title_group_member' : 'Group Member',
            'group_title_community_member' : 'Community Member',

            'column_btn_submit' : 'Submit',
            'column_btn_filter' : 'Filter',
            'column_btn_search' : 'Search',

            'show_past_reply_txt' : 'Display all reply({0})',
            'hidden_past_reply_txt' : 'Hide past reply',

            'config_profile' : 'Profile',
            'config_password' : 'Change Password',
            'config_mail_cooperation' : 'Mail Setting',
            'config_logout' : 'Logout',

            'config_profile_image_label' : 'Change image',
            'config_profile_avater_label' : 'Avatar image: ',
            'config_profile_nickname_label' : 'Nickname : ',
            'config_profile_mail_address' : 'Mail address : ',

            'config_profile_change_failed' : 'Fail to change your profile',
            'config_profile_image_failed' : 'You did not select an image data.',
            'config_profile_image_large' : 'A selected image is too large. Resize to less than 700KB',
            'config_profile_nickname_empty' : 'You must enter your nickname.',


            'config_password_current_label' : 'Current password : ',
            'config_password_new_label' : 'New password : ',
            'config_password_new_confirm_label' : 'Confirm new password : ',

            'config_password_current_must' : 'You must enter your current password in order to change it. ',
            'config_password_new_must' : 'You must enter a new password in order to change it.',
            'config_password_new_confirm_must' : 'Passwords don\'t match',

            'config_password_change_failed' : 'Fail to change your password.' ,
            'config_current_password_invalid' : 'Invalid youe current password.' ,

            'config_mail_cooperation_check_cooperation_label' : 'Retrieve your e-mail',
            'config_mail_cooperation_server_label' : 'Pop Server : ',
            'config_mail_cooperation_mail_address_label' : 'e-mail address : ',
            'config_mail_cooperation_pop3_account_label' : 'POP3 account  : ',
            'config_mail_cooperation_pop3_password_label' : 'POP3 password  : ',

            'config_mail_cooperation_error_mail_address_must' : 'You must enter your e-mail address',
            'config_mail_cooperation_error_mail_server_account_must' : 'You must enter your pop3 server account.',
            'config_mail_cooperation_error_mail_server_password_must' : 'You must enter your pop3 server password.',
            'config_mail_cooperation_error_mail_address_invalid' : 'E-Mail Address may contain any combination of ASCII characters',
            'config_mail_cooperation_error_mail_server_password_invalid' : 'Password may contain any combination of ASCII characters',

            'tab_not_referable_community' : 'not referable',

            'update_community_dialog_title' : 'Setting Community',
            'community_add_member_dialog_title' : 'Add Member',
            'community_force_leave_member_dialog_title' : 'Leave Member',
            'community_change_owner_dialog_title' : 'Change Owner',

            'button_create' : 'Create',
            'button_update' : 'Update',
            'button_force_leave' : 'Leave',

            'config_community_change_failed' : 'Fail to change a community',
            'config_community_logo_failed' : 'You did not select an image data.',
            'config_community_community_large' : 'A selected image is too large. Resize to less than 700KB',
            'config_community_title_empty' : 'You must enter a title.',
            'not_exist_in_list' : 'You must enter accounts in a list.',
            'not_force_leave_yourself' : 'You can not let yourself leave forcibly',
            'exist_in_list' : 'exists in a list',
            'not_referable_community' : 'This Community is not referable.',
            'not_referable_groupchat' : 'You are not a member of this group chat.',

            'community_title' : 'Title',
            'community_description' : 'Description',
            'community_privacy' : 'Privacy Type',
            'community_member_entry_type' : 'Member Entry Type',
            'community_logo' : 'Community Logo',
            'community_detail_label_owner' : 'Owner',

            'community_privacy_open' : 'Open',
            'community_privacy_close' : 'Close',
            'community_privacy_secret' : 'Secret',

            'community_member_entry_type_add' : 'Add',
            'community_member_entry_type_invite' : 'Invite',
            'community_member_entry_type_invite_or_accept' : 'Invite or Accept',
            'community_member_entry_type_invate_or_free' : 'Invite or Free',

            'conf_community_setting_tooltip' : 'Setting',
            'conf_community_change_owner_tooltip' : 'Change Owner',
            'conf_community_add_member_tooltip' : 'Add Member',
            'conf_community_leave_member_tooltip' : 'Remove Member',

            'add_member_submit' : 'Exec Add Member',

            'force_leave_member' : 'Remove Member',

            'add_owner' : 'Add Owner',
            'owner_list' : 'List of Owner : ',

            'presence' : '●',
            'suspend' : '(Suspension of Use)',

            'goodjob' : 'Good Job!',

            'whole_text' : 'Whole Text',
            'abbreviation' : 'abbreviation',

            'omit' : 'Omit',
            'view_all' : 'Show all',

            'action_show_conversation' : 'Show Conversation',
            'action_reply' : 'Reply',
            'action_add_inbox_task' : 'To Inbox',
            'action_doing_task' : 'Doing task',
            'action_finish_task' : 'Finish task',
            'action_edit_task' : 'Edit task',
            'action_accept_new_task' : 'Accept task',
            'action_reject_task' : 'Reject task',
            'action_demand_task' : 'Demand task',
            'action_clear_demanded_task' : 'Clear demanded task',
            'action_add_new_task_from_message' : 'Add task from Message',
            'action_add_new_task_from_inbox' : 'Add task from Inbox',
            'action_delete_message' : 'Delete message',
            'action_delete_task' : 'Delete task',
            'action_delete_from_inbox' : 'Delete from Inbox',

            'presence_offline' : 'Offline',
            'presence_offline_cut' : 'offline',
            'presence_offline_cutUp' : 'Offline',
            'presence_online' : 'Online',
            'presence_staway' : 'Stay away',
            'presence_exaway' : 'Go out. Trip',
            'presence_nodisturb' : 'Do not disturb',

            'notification_items' : '',

            'group_chat_notification_join' : 'Joined',
            'group_chat_notification_add_member' : 'Added Member',
            'group_chat_notification_remove_member' : 'Remove Member',
            'group_chat_notification_remove_member_own' : 'Remove Yourself',
            'group_chat_notification_update_room_name' : ' : old title',

            'community_notification_change_info' : 'Changed Community Information',
            'community_notification_change_authority' : 'Changed Community Authority',

            'task_title_add' : 'Add task',
            'task_title_view' : 'Show task',
            'task_title_edit' : 'Update task',
            'task_title_registerTask' : 'Register Task',
            'task_registerTask_btn' : 'Register task',
            'task_reloadTask_btn' : 'Reload',
            'task_title_editTask' : 'Edit Task',

            'task_statuc_reject' : '-',
            'task_statuc_other' : '■',
            'notification' : 'notification',
            'demand_notification' : 'Request Task is Demand',

            'task_user_arrow' : '&nbsp;&#9654;&nbsp;',

            'task_user_count' : 'users',
            'task_user_other' : 'others:',

            'task_show_owner' : 'Show Owner',

            'task_owner' : 'Assigned :',
            'task_owner_edit' : 'Assigned',

            'task_client' : 'requester',

            'task_priority_title' : 'Priority',
            'task_priority_low' : 'Low',
            'task_priority_medium' : 'Mid',
            'task_priority_high' : 'High',
            'task_priority_top' : 'Urgent',

            'task_status' : 'Status',
            'task_to_inbox_omit' : 'IN',
            'task_status_assign_omit' : 'AS',
            'task_status_new_omit' : 'NW',
            'task_status_do_omit' : 'DO',
            'task_status_fin_omit' : 'FN',
            'task_status_rej_omit' : 'RJ',
            'task_to_inbox' : 'INBOX',
            'task_status_assign' : 'Assigning',
            'task_status_new' : 'New',
            'task_status_do' : 'Doing',
            'task_status_fin' : 'Finished',
            'task_status_rej' : 'Rejected',
            'task_status_req' : 'Request',
            'task_status_accept' : 'Accepted',

            'task_demand' : 'Hurry up',

            'task_filter_dialog_title' : 'Filter',
            'task_refilter_dialog_title' : 'Filter',
            'task_filter' : 'Filterd',

            'task_type' : 'type',
            'task_request_type' : '依頼の種別',
            'task_request_type_client' : '依頼したタスク',
            'task_request_type_owner' : '依頼されたタスク',
            'task_request_type_self' : '自分だけのタスク',
            'task_demand_status' : '催促されている',
            'task_due_date_date' : '終了日',
            'task_due_date_to' : 'まで',
            'task_created_term' : '作成日時',

            'task_startdate_label' : 'Start',
            'task_enddate_label' : 'End',

            'task_unfinished_number' : 'Unfinished : ',
            'inbox_item_number' : 'Items : ',
            'toggle' : 'Toggle',

            'questionnaire_inputtype_title' : 'Type',
            'questionnaire_inputType_radiobox' : 'Radiobox',
            'questionnaire_inputType_checkbox': 'Checkbox',
            'questionnaire_resultVisible_title' : 'Result',
            'questionnaire_resultVisible_public' : 'Public',
            'questionnaire_resultVisible_private': 'Private',
            'questionnaire_graphType_title' : 'Graph',
            'questionnaire_graphType_pie' : 'Pie',
            'questionnaire_graphType_bar': 'Bar',
            'questionnaire_range_title' : 'Range',
            'questionnaire_item_add' : 'Add option',
            'questionnaire_start_date' : 'Start date and time',
            'questionnaire_due_date' : 'Due date and time',
            'questionnaire_dialog_range_title' : 'Select range',

            'questionnaire_dialog_range_feed' : 'Feed',
            'questionnaire_dialog_range_community' : 'Community',
            'questionnaire_dialog_range_group' : 'Group',
            'questionnaire_range_community_name' : 'CommunityName',
            'questionnaire_range_group_name' : 'GrouoName',

            'custom_filter_label_sender' : 'Sender',
            'custom_filter_label_having_attached_file_and_url' : 'Attached file / URL',
            'custom_filter_label_having_attached_file' : 'Include attached files',
            'custom_filter_label_having_url' : 'Include URL',
            'custom_filter_label_term' : 'Term',
            'custom_filter_label_term_24_hours' : 'Within 24 hours',
            'custom_filter_label_term_48_hours' : 'Within 48 hours',
            'custom_filter_label_term_1_week' : 'Within 1 week',
            'custom_filter_label_term_1_month' : 'Within 1 month',
            'custom_filter_label_term_1_year' : 'Within 1 year',
            'custom_filter_error_text': 'is invalid.',
            'custom_filter_inbox_label_sender' : 'Sender / Requester',
            'custom_filter_label_unread_message' : 'Unread Message',

            'dialogerrorTaskFilterText': 'is invalid.',
            'dialogerrorTaskFilterCheckbox': 'is not selected.',
            'system_message_server_disconnected' : 'Server disconnected',
            'mail_setting_error_message' : 'Fail: Change MailCooperationSetting',
            'no_server_info' : 'No Name Server',

            'dialog_error_invalid_input' : 'Account is wrong.',

            'task_status_solved' : 'Closed',
            'task_status_fb' : 'Feedback',

            'task_start_date' : 'Start date and time',
            'task_due_date' : 'Due date and time',

            'task_name_placeholder': 'Task name(This is essential field, if status is assigning, new or doing.)',
            'task_name': 'Task name',

            'task_body_placeholder': 'request details',

            'task_update_title' : 'Task status is updated \n Title：',
            'task_update_user' : '\n Modified by ：',

            'task_multi_selection' : '(Multiple selection)',
            'task_non_multi_selection' : '(Single selection)',

            'task_error_taskname' : 'Please input task name.',
            'task_error_wrong_datetime' : 'Date or Time is wrong.',
            'task_error_statu_due_datetime' : 'StartDate error. Input future date rather than Due Date.',
            'task_error_taskname_length' : 'Task name is too long.',
            'task_error_content_length' : 'Task content is too long.',
            'task_error_owner_select' : 'Please select owners.',
            'task_error_not_defined' : 'Register form is not defined.',

            'date_year' : 'year',
            'date_month' : 'month',
            'date_day' : 'day',
            'date_hour' : 'hour',
            'date_minute' : 'minute',

            'file_up_title' : 'file Upload(under 20MB)',

            'calendar_picker_title' : '...',

            'reply_button' : 'Reply',

            'default_placeholder' : 'Input your message.',

            'reply_placeholder' : 'Input reply message.',

            'inbox_placeholder' : 'Drop in your INBOX.',

            'inbox_submit' : 'Drop in',

            'inbox_add_date' : 'Drop date to inbox : ',

            'dialogerrorSearch': 'Keyword is empty.',
            'dialogerrorSearchOneChar': 'It is not possible to single character search of alphanumeric characters and some single-byte symbols.',
            'dialogerrorSelect' : 'Search ColumnType not selected.',

            'search_option_title' : 'Search Option',
            'search_option_label' : 'ColumnType',
            'search_option_checked_all' : 'ON All',
            'search_option_unchecked_all' : 'OFF All',

            'search_result_message_none' : 'No message found',

            'column_option_filter' : 'Search',
            'column_option_group_chat_add_member' : 'Add member',
            'column_option_group_chat_change_authority_member' : 'Edit member',
            'column_option_group_chat_leave_member' : 'Leave member',
            'column_option_group_chat_unsubscribe' : 'Unsubscribe',
            'column_option_group_chat_update_room_info' : 'Change title',
            'column_option_group_chat_list_member' : 'List member',
            'column_option_add_myworkplace' : 'Add this column to My Workplace',
            'column_option_custom_filter' : 'Filter',
            'column_option_notification_off' : 'Turn off the notification',
            'column_option_notification_on' : 'Turn on the notification',

            'dialog_label_ok' : 'OK',
            'dialog_label_ok2' : 'OK',
            'dialog_label_cancel' : 'Cancel',
            'dialog_label_save' : 'OK',
            'dialog_label_keyword' : 'Keyword  : ',
            'dialog_filter_title' : 'Search',
            'dialog_context_search_title' : 'Context Search',
            'dialog_add_column_title' : 'Add Column',
            'dialog_delete_conf_message' : 'Are you sure to delete？',
            'dialog_delete_conf_message_for_community' : 'This task being shared community members.<br>if it deleted, other member also can not see it.<br><br>Are you sure to delete？',
            'dialog_delete_conf_message_for_contactlist' : 'Are you sure to delete from contact list？',
            'dialog_cancel_title' : 'cancel',
            'dialog_option_title' : 'Options',
            'dialog_close_title' : 'Close',
            'dialog_label_account' : 'Account name  : ',
            'dialog_placeholder_account' : 'Input account name after @.',
            'dialog_show_conversation_title' : 'Show conversations',
            'dialog_label_roomname' : 'Title  : ',
            'dialog_placeholder_roomname' : 'Input title',
            'dialog_confirmation_title' : 'Confirmation',
            'dialog_label_close' : 'Close',
            'dialog_label_input_member' : 'Input member : ',
            'dialog_label_add_member_list' : 'Add member list : ',
            'dialog_label_remove_member_list' : 'Remove member list : ',
            'dialog_confirmation_unsubscribe' : 'Are you sure you want to unsubscribe from group chat ?',
            'dialog_title_group_chat_change_authority_member' : 'Edit member',
            'dialog_title_group_chat_leave_member' : 'Remove member',
            'dialog_button_add_to_member_list' : 'Add to list>',

            'dialog_tab_new' : 'New',

            'dialog_title_create_groupchat' : 'Create Group chat',
            'dialog_title_system_info' : 'Information',
            'dialog_title_add_favorite' : 'Add Favorite Group',
            'dialog_title_remove_favorite' : 'Remove Favorite Group',
            'dialog_label_remove' : 'Are you sure you want to remove [[1]] from [[2]]?',

            'default_group_chat_suffix' : 'Group Chat',
            'group_chat_start_title' : 'Group Chat',
            'group_chat_start_explain' : 'Click or tap user from contact list to add this group chat.',
            'group_chat_start_label_title' : 'Title:',
            'group_chat_start_label_selected_users' : 'Selected user(s):',
            'group_chat_start_label_start_button' : 'Start chat',
            'group_chat_start_label_cancel_button' : 'Cancel',
            'group_chat_start_selected_users_count_suffix' : '',

            'gorup_chat_member_label' : 'Num. of joined',
            'group_chat_member_count_suffix' : '',

            'add_member_err_contactlist' : 'Input user name in the contact list.',
            'add_member_err_not_exist_account' : 'is not exist',
            'add_member_err_exist' : 'is already joined',
            'add_member_err_not_exist' : 'is not joined',
            'add_member_err_input' : 'Input user name format.',
            'group_chat_add_member_err_wrong_account' : 'is must input user name format.',

            'add_member_err_submit' : 'An attempt to add member has failed. Try the same process again with some time.',
            'add_member_err_authority_change' : 'An attempt to add member has failed. Please update a authority data from the authority management function.',
            'change_member_authority_err' : 'Failed to update authority data. Try the same process again with some time.',
            'leave_member_err' : 'Failed to unsubscribe a member. Try the same process again with some time.',
            'add_member_err_authority' : 'Failed to assign user with specified authority.',
            'not_assign_account_type_err' : ' is not attached account type. Please ask the tenant administrator to set up.',
            'authority_err' : 'You do not have permission to execute.',
            'authority_err_on_add_member' : 'An attempt to add member has failed. Please ask the community administrator to set the authority of the added user from the authority management function.',

            'subview_title' : 'Action:',
            'subview_label_selected_user' : 'Selected user(s):',
            'subview_label_selected_user_suffix' : '',
            'subview_btn_title_start_chat' : 'Start chat',
            'subview_btn_title_start_group_chat' : 'Start group chat',
            'subview_btn_title_add_contact_list' : 'Add to contact list',
            'subview_btn_title_remove_contact_list' : 'remove from contact list',
            'subview_btn_title_add_favorite' : 'Add favorite',
            'subview_btn_title_community_unsubscribe_member' : 'Unsubscribe the members',
            'subview_btn_title_community_add_member' : 'Add the members',

            'sideview_btn_back_to_contact_list' : 'Back to contact list',
            'sideview_label_search_result' : 'Search result(s)',

            'sideview_tab_search_contact_list_member' : 'Contact list',
            'sideview_tab_search_all_user' : 'All users',
            'sideview_text_search_placeholder': 'Keyword',
            'sideview_btn_search_exec': 'Search',

            'deleted_message_body' : 'This message was deleted.',
            'deleted_message_body_by_admin' : 'This message was deleted by admin.',

            'show_Action_ToolTip_button' : 'Message menu',

            'group_chat_error_room_name' : 'Title is empty.',

            'authority_changed_role' : 'Tenant admin changed your account type. Reload browser.',


            'error_file_up_over_max_sixe' : 'Over 20MB',
            'error_file_up_request' : 'Server Error',

            'read_message_control_title' : 'Click to chage status to Read.',

            'read_in_bulk_control' : 'Read in bulk.',
            'read_in_bulk_error_message' : 'Change to already read failed.',
            'read_in_bulk_attention_message' : 'Can you change to already read , view message?',
            'read_in_bulk_attention_message_last_line' : '',
            'read_in_bulk_attention_nonify_message': '',

            'Send': 'Send',
            'Favorite': 'Favorite',
            'Hashtag': 'Hashtag',
            'Favorite': 'Favorite',
            'List': 'List',

            'Friend' : 'Friend',
            'Family' : 'Family',
            'Java' : 'Java',
            'C' : 'C',

            'existing_reader_count' : 'users',
            'existing_reader_other' : 'others',
            'existing_reader_label' : ' user(s) read',
            'existing_reader_link' : 'Existing Reader List',
            'existing_reader_dialog_title' : 'Existing Reader List',

            'vote_button_name' : 'Vote',
            'vote_enddate_status_text' : 'Over',
            'vote_toggle_display' : 'Display the vote area and vote',
            'vote_toggle_hide' : 'Hide the vote area',
            'vote_status_label_before' : 'Not time',
            'vote_status_label_after' : 'Finished'

        }
    });

}(this));
var Resource = {
    setCulture : function(culture) {
      return Globalize.culture(culture);
    },
    getMessage : function(key, culture) {
        return Globalize.localize(key, culture);
    }
};
Resource.setCulture('ja');
