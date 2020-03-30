/**
 * Cubee authority code definitions
 * @module  src/scripts/controller/authority/const
 */

const AUTHORITY_ACTIONS = {
    /**
     * フィード閲覧権
     * @type {String}
     */
    FEED_VIEW: 'viewMessageInFeed',
    /**
     * フィード投稿権
     * @type {String}
     */
    FEED_SEND: 'sendMessageToFeed',
    /**
     * Groupchat 投稿権
     * @type {String}
     */
    GC_VIEW: 'viewMessageInGroupchat',
    /**
     * Groupchat 投稿権
     * @type {String}
     */
    GC_SEND: 'sendMessageToGroupchat',
    /**
     * Groupchat 管理権
     * @type {String}
     */
    GC_MANAGE: 'manageGroupchat',
    /**
     * Groupchat 作成権
     * @type {String}
     */
    GC_CREATE: 'createGroupchat',
    /**
     * コミュニティ 閲覧権
     * @type {String}
     */
    COMMUNITY_VIEW: 'viewMessageInCommunity',
    /**
     * コミュニティ 投稿権
     * @type {String}
     */
    COMMUNITY_SEND: 'sendMessageToCommunity',
    /**
     * コミュニティ 管理権
     * @type {String}
     */
    COMMUNITY_MANAGE: 'manageCommunity',
    /**
     * コミュニティ 作成権
     * @type {String}
     */
    COMMUNITY_CREATE: 'createCommunity',
    /**
     * つぶやき閲覧権
     * @type {String}
     */
    MURMUR_VIEW: 'viewMessageInMurmur',
    /**
     * つぶやき投稿権
     * @type {String}
     */
    MURMUR_SEND: 'sendMessageToMurmur',

    /* ===============================
     * 特別権限
     * =============================== */
    /**
     * 全メッセージを検索できる権限
     * @type {String}
     */
    SEARCH_ALL_MESSAGES : 'searchAllMessages',

    /**
     * 全メッセージに対する削除権限
     * @type {String}
     */
    ADMIN_DELETE: 'deleteAllMessages'
};

exports.AUTHORITY_ACTIONS = AUTHORITY_ACTIONS;

