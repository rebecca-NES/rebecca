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
$(function(){
  col_scr = [];
  $('.column-content.scroll_content').each(function () {
    if($(this).closest("#side-bar-recent")){
      return;
    }
    col_scr.push(new PerfectScrollbar($(this)[0], {
      suppressScrollX: true
    }));
  });
  var side_scr = [];
  $('.sidebar.scroll_content').each(function () {
    side_scr.push(new PerfectScrollbar($(this)[0], {
      suppressScrollX: true
    }));
  });
  dlg_scr = [];
  $('#dialog_area .scroll_content').each(function () {
    dlg_scr.push(new PerfectScrollbar($(this)[0], {
      suppressScrollX: true
    }));
  });
  head_scr = new PerfectScrollbar(('#mainHeader'), {
    suppressScrollY: true
  });
  wtc_scr = new PerfectScrollbar(('#watch_view .col_scroll_content'), {
    suppressScrollY: true
  });
  pj_scr = new PerfectScrollbar(('#project_scroll_area'), {
    suppressScrollX: true
  });
  $(window).on('resize', function () {
    col_scr.forEach(function (value) {
      value.update();
    });
    side_scr.forEach(function (value) {
      value.update();
    });
    dlg_scr.forEach(function (value) {
      value.update();
    });
    head_scr.update();
    wtc_scr.update();
    pj_scr.update();
  });

  $('#mainHeader .ui-sortable .sortable-item').on('click', function () {
    var i = $(this).index();
    var col_p = $('.content-wrapper .col_card').eq(i).position().left;
    var col_w = $('.content-wrapper .col_card').eq(i).outerWidth();
    var view_p = $('#watch_view .content_inner').position().left;
    var view_w = $('#watch_view').outerWidth();
    if (col_p - 20 < - view_p) {
      $('#watch_view .col_scroll_content').animate({scrollLeft: col_p - 20});
    } else if (col_p + col_w + 20 > - view_p + view_w) {
      $('#watch_view .col_scroll_content').animate({scrollLeft: col_p + col_w + 20 - view_w});
    }
  })

  $('[data-toggle="tooltip"]').tooltip({
    trigger: 'hover'
  });

  $('.user_menu_btn').on('click', function(){
    $(this).parents('.login_user').toggleClass('open');
  });
  $('.sidebar-toggle').on('click', function(){
    $('#left_sidebar .login_user').removeClass('open');
    if ($('#left_sidebar').position().top >= 1) {
        $('#sidebar-collapse-goodjob-count').hide();
        $('#sidebar-collapse-thanks-count').hide();
        $('#sidebar-collapse-followee-count').hide();
        $('#sidebar-collapse-follower-count').hide();
        $('#left_sidebar .login_user').removeClass('open');
        return;
    }
    if (!$('.sidebar-collapse').length) {
        $('#sidebar-collapse-goodjob-count').show();
        $('#sidebar-collapse-thanks-count').show();
        $('#sidebar-collapse-followee-count').show();
        $('#sidebar-collapse-follower-count').show();
        $('#left_sidebar .login_user').addClass('open');
    } else {
        $('#sidebar-collapse-goodjob-count').hide();
        $('#sidebar-collapse-thanks-count').hide();
        $('#sidebar-collapse-followee-count').hide();
        $('#sidebar-collapse-follower-count').hide();
        $('#left_sidebar .login_user').removeClass('open');
    }
  });

  $(document).on('click', '.popup_btn', function(){
    $('.popup_list').not(this).stop().fadeOut(100);
    $(this).siblings('.popup_list').stop().fadeToggle(100);
  });
  var popupF = false;
  $(document).on('click', '.popup_btn, .column-header .col_menu .aleart_toggle', function(){
    popupF = true;
  });
  $(document).on('click', function(){
    if (popupF) {
      popupF = false;
    } else {
      $('.popup_list').stop().fadeOut(100);
    }
  });

  $(document).on('focus', '.wrap-frm-message .message-input-area-title, .wrap-frm-message .message-input-area', function(){
    if(!$(this).closest('.wrap-frm-message').find('.message-attachment-area').is(':visible')) {
      var _toggleAttachmentArea = $(this).closest('.wrap-frm-message').find('.message-attachment-area');
      _toggleAttachmentArea.slideToggle(200, function(){
        $(window).trigger('resize');
      });
    }
  })
  $(document).on('click', function(event){
    if ($(event.target).closest('.modal_card ').length) {
      return;
    }
    if ($(event.target).is('#quick-filter-read, #quick-filter-tome, #quick-filter-file')) {
      return;
    }
    var click_column = $(event.target).closest('.col_card');
    var toggle_temp_area = $(document).find('.message-attachment-area');
    for (var i=0; i<toggle_temp_area.length; i++) {
      var toggle = $(toggle_temp_area.get(i));
      if (click_column.length) {
        if (!toggle.is(click_column.find('.message-attachment-area')) &&
          toggle.is(':visible')) {
          toggle.slideToggle(200, function(){
            $(window).trigger('resize');
          })
        }
      } else {
        if (toggle.is(':visible')) {
          toggle.slideToggle(200, function(){
            $(window).trigger('resize');
          })
        }
      }
    }
  })

  function column_width() {
    var murSi_w = 0;
    if($('#side-bar-murmur').css('display') == 'block'){
        murSi_w = 400;
    }
    var leftMen_W = 280;
    if($("body.sidebar-collapse").length > 0){
        leftMen_W = 50;
    }
    if($(window).width() < 768){
        leftMen_W = 0;
    }
    var col_l = $('.content-wrapper .col_card').not('.content-wrapper .col_card.closeaa').length;
    var col_conv_l = $('.content-wrapper .col_card.chat_card.column-show-conversation-wrapper').not('.content-wrapper .col_card.closeaa').length;
    var col_w = ($(window).width() - leftMen_W - murSi_w - 30 - (10 * col_l)) / col_l;
    var col_org_w = col_w;
    var columnCTNW = col_l * (col_org_w + 10) + 30;
    if (col_w < 320) {
      col_w = 320
    }
    $('.content-wrapper .col_card').not('.content-wrapper .col_card.closeaa').css('width', col_w +'px');
    var wrapper_w = (col_l - col_conv_l) * ((col_w  - col_conv_l) + 10) + col_conv_l * (600 + 10) + 30;
    if(murSi_w > 0){
        $('#columnContainer').css('width', columnCTNW +'px');
    }else{
        $('#columnContainer').css('width', "");
    }
    $('.scroll_inner').css('width', wrapper_w +'px');
    wtc_scr.update();
    head_scr.update();
  }

  $(window).on('resize', column_width);

  function column_height() {
    $('.content-wrapper .col_card').each(function() {
      var loadingicon_h = 0
      if ($(this).find('.wrap-frm-message').siblings('.loading-readmore').length) {
          loadingicon_h = $(this).find('.wrap-frm-message').siblings('.loading-readmore').outerHeight(true);
      }
      var column_h = $(this).outerHeight() - $(this).find('.column-header').outerHeight() - $(this).find('.wrap-frm-message').outerHeight() - loadingicon_h;
      $(this).find('.column-content').css('height', column_h + 'px');
    });
    col_scr.forEach(function (value) {
      value.update();
    });
  }
  column_height();
  $(window).on('resize', function(){
      setTimeout(function(){
          column_height()
      },50);
  });

  $('#header .sidebar-toggle').on('click', function () {
    setTimeout(function () {
        column_width();
        $(window).trigger('resize');
    }, 300);
  });

  $(document).on('click', '.content-wrapper .col_card .col_close_btn', function(){
    var $this = $(this);
    var col_w = $(this).parents('.col_card').outerWidth();
    $(this).parents('.col_card').addClass('closeaa').css({ 'margin-right': - col_w + 'px', 'opacity': 0, 'z-index': '1000' });
    setTimeout(function () {
      wtc_scr.update();
      head_scr.update();
    }, 300);
    column_width();
  });

  function modal_on(modal_n, wizard) {
    if (!wizard) {
      $('#' + modal_n).show();
      $('#dialog_area').prepend('<div class="overlay modal_exit"></div>');
    } else {
      $('#wizard_modal').show();
    }
    $('.ui-dialog').addClass('on').css('display', 'block').animate({ 'margin-top':0, 'opacity':1 }, 200, function () {
      if (wizard) {
        $('#wizard_modal').find('*').attr('tabindex', -1).end().find('.current').find('*').attr('tabindex', '');
      }
    });
    $('.overlay').animate({ 'opacity':0.3}, 200 );
  }
  function modal_exit() {
    if ($('div#profile_modal').length && TabManager.getInstance().isActiveMyWorkplace()) {
      var backgroundClass = LoginUser.getInstance().getExtras().backgroundImage ? LoginUser.getInstance().getExtras().backgroundImage : 'dashboard_wrapper';
      $('div[name="mainWrapper"]').removeClass (function (index, css) {
          return (css.match (/\bdashboard_w\S+/g) || []).join(' ');
      });
      $('div[name="mainWrapper"]').addClass(backgroundClass);
    }
    $('.ui-dialog.on').animate({ 'margin-top':-70 + 'px', 'opacity':0 }, 200, function() {
      $(this).css('display','none');
      $('.modal_card').css('display','none');
    });
    $('#modal_area').off();
    $('#modal_area').children().remove();
    $('#modal_area').hide();
    $('.overlay').animate({ 'opacity':0}, 200, function() {
      $(this).remove();
    });
    dlg_scr.forEach(function (value) {
      value.destroy();
    });
    dlg_scr = [];
  }

  $(document).on('click', '.modal_exit', modal_exit);
  $(document).keyup(function(e) {
    if (e.keyCode === 27) modal_exit();   
  });

  $(document).keydown(function(e) {
    if (e.keyCode === 9 || e.which === 9){
        if ($('#login').css('display') == 'none') {
            return false;
        }
        var focusIndex = document.activeElement.tabIndex;
        if (focusIndex < 0 || focusIndex == 3) {
            $('[tabindex=1]').focus();
            return false;
        }
    }
  });

  $('.avatar_file_comm').click(function () {
    cropper_comm = '';
    $(this).val('');
    $(this).parents('.cropped_wrapper').find('.cropped').hide();
    $(this).parents('.cropped_wrapper').find('.img_edit_area').hide();
  });
  $('.avatar_file_comm').change(function () {
    if (this.files.length > 0) {
      reader_comm = new FileReader();
      reader_comm.onload = function (e) {
        options_comm.imgSrc = e.target.result;
        cropper_comm = new cropbox(options_comm);
      }
      reader_comm.readAsDataURL(this.files[0]);
      $(this).parents('.cropped_wrapper').find('.cropped').hide();
      $(this).parents('.cropped_wrapper').find('.img_edit_area').fadeIn();
    }
  });
  $('#settingproject_modal #btnCrop').on('click', function () {
    var img = cropper_comm.getDataURL();
    $(this).parents('.img_edit_area').nextAll('.cropped').replaceWith('<div class="cropped"><img src="' + img + '" class="mCS_img_loaded"></div>');
    $(this).parents('.img_edit_area').hide();
    $(this).parents('.img_edit_area').nextAll('.cropped').fadeIn();
  });
  $('#settingproject_modal #btnZoomIn').on('click', function () {
    cropper_comm.zoomIn();
  });
  $('#settingproject_modal #btnZoomOut').on('click', function () {
    cropper_comm.zoomOut();
  });

  var emojiStampClickColumnNum = -1;
  var emojiStampReplayItemId;
  var emojiStampReplayBlock;
  var emojiStampConversationRoomId;
  var emojiStampRecentMsgType;
  var emojiStampRecentChatMsgTo;
  var emojiStampRecentChatMsgFrom;
  var emojiStampMessageTitle;
  var emojiStampMessageBody;
  var emojiStampWithNoteLink;
  var emojiStampWithAttatch;
  var emoji_show = false;
    $(document).on('click', '.emojibtn', function(event){
    if (emoji_show) {
        emoji_show = false;
    } else {
        if (!$(event.target).closest('emoji-picker').length && $('emoji-picker').hasClass('open')) {
            $('emoji-picker').removeClass('open');
            return;
        }
    }
    $('emoji-picker').addClass('open');
    var icon_top = $(this).offset().top;
    var icon_left = $(this).offset().left;
    picker_width = $('emoji-picker').children().width();
    var position_top = icon_top + 30;
    var position_left = icon_left;
    position_left = position_left - picker_width;
    var container_top = $('#columnContainer').offset().top;
    var container_left = $('#columnContainer').offset().left;
    if (icon_left - container_left < picker_width) {
        position_left += picker_width - (icon_left - container_left);
    }
    var container_bottom = $('#columnContainer').height() + container_top;
    var picker_height = $('emoji-picker').children().height();
    if (container_bottom - position_top < picker_height) {
        position_top -= picker_height - (container_bottom - position_top);
    }

    $('emoji-picker').children().offset({top: position_top, left:position_left});
    emoji_show = true;

      var columns = $("#columnInnerContainer").children();
      var columNum = -1;
      for(var i=0;i<columns.length;i++){
          if($(columns[i]).is($(event.currentTarget).closest(".col_card"))){
              columNum = i;
          }
      }
      emojiStampClickColumnNum = columNum;

      var itemid = $(event.currentTarget).closest("div.message-border > div.read-message").attr("itemid");
      emojiStampReplayItemId = undefined;
      if(itemid != null){
          emojiStampReplayItemId = itemid;
      }

      var replayBlock = $(event.currentTarget).closest("div.message-border div.wrap-frm-message-reply");
      emojiStampReplayBlock = undefined;
      if(replayBlock != null){
          emojiStampReplayBlock = replayBlock;
      }

      var roomid = $(event.currentTarget).parent().parent().find("textarea.input-message-reply").attr("groupid");
      emojiStampConversationRoomId = undefined;
      if(roomid != null){
          emojiStampConversationRoomId = roomid;
      }

      var msgType = $(event.currentTarget).closest("div.message-border > div.read-message").attr("msgtype");
      emojiStampRecentMsgType = undefined;
      if(msgType != null){
          try{
              emojiStampRecentMsgType = parseInt(msgType);
          }catch(e){}
      }else{
          if(itemid != null){
              emojiStampRecentMsgType = CubeeController.getInstance()._messageManager.getMessage(itemid).getType();
          }
      }
      var msgto = $(event.currentTarget).closest("div.message-border > div.read-message").attr("msgto");
      emojiStampRecentChatMsgTo = undefined;
      if(msgto != null){
          emojiStampRecentChatMsgTo = msgto;
      }else{
          if(emojiStampRecentMsgType == Message.TYPE_CHAT){
              emojiStampRecentChatMsgTo = CubeeController.getInstance()._messageManager.getMessage(itemid).getTo();
          }
      }
      var msgfrom = $(event.currentTarget).closest("div.message-border > div.read-message").attr("msgfrom");
      emojiStampRecentChatMsgFrom = undefined;
      if(msgfrom != null){
          emojiStampRecentChatMsgFrom = msgfrom;
      }else{
          if(emojiStampRecentMsgType == Message.TYPE_CHAT){
              emojiStampRecentChatMsgFrom = CubeeController.getInstance()._messageManager.getMessage(itemid).getFrom();;
          }
      }
      var msgTitle = $(event.currentTarget).parent().parent().find("textarea.message-input-area-title");
      emojiStampMessageTitle = undefined;
      if(msgTitle){
          emojiStampMessageTitle = msgTitle;
      }
      var msgBody = $(event.currentTarget).parent().parent().find("textarea.message-input-area,textarea.input-message-reply");
      emojiStampMessageBody = undefined;
      if(msgBody){
          emojiStampMessageBody = msgBody;
      }
      var noteArea = $(event.currentTarget).parent().parent().find('.attach-note-element p');
      emojiStampWithNoteLink = undefined;
      if(noteArea){
          emojiStampWithNoteLink = noteArea;
      }
      var attatch = $(event.currentTarget).parent().parent().find('.file-inputs p');
        emojiStampWithAttatch = undefined;
      if(attatch){
          emojiStampWithAttatch = attatch;
      }
  });
  $(document).on('click', function(event){
    if (emoji_show) {
      emoji_show = false;
    } else {
      if (!$(event.target).closest('emoji-picker').length && $('emoji-picker').hasClass('open')) {
        $('emoji-picker').removeClass('open');
      }
    }
  });
  emojiPicker = window.emojiMart.definePicker("emoji-picker", {
     native: false,
     set: 'twitter',
     title: 'Emoji STAMP',
     onSelect: function(emoji){ onSelectEmoji(emoji);}
  });
  function onSelectEmoji(emoji) {
      var clickColumns = ColumnManager.getInstance().getColumnList();
      var clickColumnViews = ColumnManager.getInstance().getColumnObjList();
      var clickColumnInfo = clickColumns.get(emojiStampClickColumnNum);
      var clickColumnView = clickColumnViews.get(emojiStampClickColumnNum);
      var columnType;
      if(clickColumnInfo){
          columnType = clickColumnInfo.getColumnType();
      }else if(emojiStampReplayBlock.closest("#side-bar-recent").length){
          columnType = ColumnInformation.TYPE_COLUMN_RECENT;
      }
      var isConversationOrRecent = false;
      if(columnType == ColumnInformation.TYPE_COLUMN_SHOW_CONVERSATION ||
         columnType == ColumnInformation.TYPE_COLUMN_RECENT ||
         columnType == ColumnInformation.TYPE_COLUMN_SEARCH ||
         columnType == ColumnInformation.TYPE_COLUMN_FILTER ||
         columnType == ColumnInformation.TYPE_COLUMN_CUSTOM_FILTER){
          if(emojiStampRecentMsgType != null){
              switch(emojiStampRecentMsgType){
                  case Message.TYPE_PUBLIC:
                      columnType = ColumnInformation.TYPE_COLUMN_TIMELINE;
                      break;
                  case Message.TYPE_CHAT:
                      columnType = ColumnInformation.TYPE_COLUMN_CHAT;
                      break;
                  case Message.TYPE_GROUP_CHAT:
                      columnType = ColumnInformation.TYPE_COLUMN_GROUP_CHAT;
                      break;
                  case Message.TYPE_COMMUNITY:
                      columnType = ColumnInformation.TYPE_COLUMN_COMMUNITY_FEED;
                      break;
                  case Message.TYPE_MURMUR:
                      columnType = ColumnInformation.TYPE_COLUMN_MURMUR;
                      break;
                  default:
                      columnType = clickColumnInfo.getColumnType();
                      break;
              }
          }
          isConversationOrRecent = true;
      }
      switch(columnType){
          case ColumnInformation.TYPE_COLUMN_TIMELINE:
              var _message = new PublicMessage();
              sendStampMessage(columnType,
                               _message,
                               emoji,
                               {
                                   "ReplayItemId":emojiStampReplayItemId,
                                   "ReplayBlock":emojiStampReplayBlock,
                                   "WithAttatch":emojiStampWithAttatch,
                                   "MessageBody":emojiStampMessageBody,
                                   "MessageTitle":emojiStampMessageTitle,
                                   "WithNoteLink":emojiStampWithNoteLink
                               },
                               clickColumnView,
                               clickColumnInfo,
                               function (mess, callback){
                                   CubeeServerConnector.getInstance().sendPublicMessage(mess, callback);
                               });
              break;;
          case ColumnInformation.TYPE_COLUMN_CHAT:
              var _message = new ChatMessage();

              sendStampMessage(columnType,
                               _message,
                               emoji,
                               {
                                   "isConversationOrRecent":isConversationOrRecent,
                                   "ReplayItemId":emojiStampReplayItemId,
                                   "ReplayBlock":emojiStampReplayBlock,
                                   "RecentChatMsgTo":emojiStampRecentChatMsgTo,
                                   "RecentChatMsgFrom":emojiStampRecentChatMsgFrom,
                                   "WithAttatch":emojiStampWithAttatch,
                                   "MessageBody":emojiStampMessageBody,
                                   "MessageTitle":emojiStampMessageTitle,
                                   "WithNoteLink":emojiStampWithNoteLink
                               },
                               clickColumnView,
                               clickColumnInfo,
                               function (mess, callback){
                                   CubeeServerConnector.getInstance().sendChatMessage(mess, callback);
                               });
              break;;
          case ColumnInformation.TYPE_COLUMN_GROUP_CHAT:
              var _message = new GroupChatMessage();
              sendStampMessage(columnType,
                               _message,
                               emoji,
                               {
                                   "isConversationOrRecent":isConversationOrRecent,
                                   "ReplayItemId":emojiStampReplayItemId,
                                   "ReplayBlock":emojiStampReplayBlock,
                                   "ConversationRoomId": emojiStampConversationRoomId,
                                   "WithAttatch":emojiStampWithAttatch,
                                   "MessageBody":emojiStampMessageBody,
                                   "MessageTitle":emojiStampMessageTitle,
                                   "WithNoteLink":emojiStampWithNoteLink
                               },
                               clickColumnView,
                               clickColumnInfo,
                               function (mess, callback){
                                   CubeeServerConnector.getInstance().sendGroupChatMessage(mess, callback);
                               });
              break;;
          case ColumnInformation.TYPE_COLUMN_COMMUNITY_FEED:
              var _message = new GroupChatMessage();
              sendStampMessage(columnType,
                               _message,
                               emoji,
                               {
                                   "isConversationOrRecent":isConversationOrRecent,
                                   "ReplayItemId":emojiStampReplayItemId,
                                   "ReplayBlock":emojiStampReplayBlock,
                                   "ConversationRoomId": emojiStampConversationRoomId,
                                   "WithAttatch":emojiStampWithAttatch,
                                   "MessageBody":emojiStampMessageBody,
                                   "MessageTitle":emojiStampMessageTitle,
                                   "WithNoteLink":emojiStampWithNoteLink
                               },
                               clickColumnView,
                               clickColumnInfo,
                               function (mess, callback){
                                   CubeeServerConnector.getInstance().sendCommunityMessage(mess, callback);
                               });
              break;;
          case ColumnInformation.TYPE_COLUMN_MURMUR:
              var _message = new MurmurMessage();
              sendStampMessage(columnType,
                               _message,
                               emoji,
                               {
                                   "isConversationOrRecent":isConversationOrRecent,
                                   "ReplayItemId":emojiStampReplayItemId,
                                   "ReplayBlock":emojiStampReplayBlock,
                                   "RecentChatMsgTo":emojiStampRecentChatMsgTo,
                                   "WithAttatch":emojiStampWithAttatch,
                                   "MessageBody":emojiStampMessageBody,
                                   "MessageTitle":emojiStampMessageTitle,
                                   "WithNoteLink":emojiStampWithNoteLink
                               },
                               clickColumnView,
                               clickColumnInfo,
                               function (mess, callback){
                                   CubeeServerConnector.getInstance().sendMurmurMessage(mess, callback);
                               });
              break;
      }
      emoji_show = false;
    $('emoji-picker').removeClass('open');
  }

  var SendMessageResponce = function (res, noteArea, emojiStamp) {
      if(res == null){
          console.log("error responce:" + JSON.stringify(res));
          var _title   = Resource.getMessage('dialog_title_stamp_error');
          var _message = Resource.getMessage('dialog_error_send_stamp');
          var _dialog = new DialogCloseView(_title, _message);
          _dialog.showDialog();
      }else{
          if(noteArea && res.content &&
             res.content.items &&
             res.content.items.length == 1 &&
             res.content.items[0].threadRootId){
              CodiMdController.getInstance().assignNoteOnThreadRootId(
                  res.content.items[0].threadRootId, noteArea)
                              .then(function(result){
                                  return;
                              }).catch(function(err){
                                  var _title   = Resource.getMessage('dialog_title_system_info');
                                  var _message = Resource.getMessage('dialog_error_assign_note_after_try');
                                  var _dialog = new DialogCloseView(_title, _message);
                                  _dialog.showDialog();
                                  return;
                              }).finally(function(){
                                  emojiStamp.WithNoteLink.attr("value","");
                                  emojiStamp.WithNoteLink.attr("title","");
                                  emojiStamp.WithNoteLink.text("");
                                  emojiStamp.WithNoteLink.parent().find(".note_cancel_btn").remove();
                              });
          }
      }
  }

  var sendStampMessage = function (columnType,
                                   _message,
                                   emoji,
                                   emojiStamp,
                                   clickColumnView,
                                   clickColumnInfo,
                                   callBackSendMessageToAPI) {
      if(emojiStamp.MessageBody != null &&
         typeof emojiStamp.MessageBody.val() == 'string' &&
         !emojiStamp.MessageBody.val().match(/^\s*$/)){
          _message.setMessage(emoji.native + "< " + emojiStamp.MessageBody.val() + " >");
      }else{
          _message.setMessage(emoji.native);
      }
      _message.setThreadTitle(emojiStamp.MessageTitle.val());
      if(columnType == ColumnInformation.TYPE_COLUMN_CHAT){
          if(emojiStamp.isConversationOrRecent){
              if(emojiStamp.RecentChatMsgTo != LoginUser.getInstance().getJid()){
                  _message.setTo(emojiStamp.RecentChatMsgTo);
              }else if(emojiStamp.RecentChatMsgFrom != LoginUser.getInstance().getJid()){
                  _message.setTo(emojiStamp.RecentChatMsgFrom);
              }else{
                  console.log("not found chat to or from data.");
              }
          }else{
              _message.setTo(clickColumnInfo.getFilterCondition());
          }
      }else if(columnType == ColumnInformation.TYPE_COLUMN_GROUP_CHAT){
          if(emojiStamp.isConversationOrRecent){
              _message.setTo(emojiStamp.ConversationRoomId);
          }else{
              _message.setTo(clickColumnInfo.getChatRoomInfomation().getRoomId());
          }
      }else if(columnType == ColumnInformation.TYPE_COLUMN_COMMUNITY_FEED){
          if(emojiStamp.isConversationOrRecent){
              _message.setTo(emojiStamp.ConversationRoomId);
          }else{
              _message.setTo(clickColumnInfo.getCommunityInfomation().getRoomId());
          }
      }
      _message.setBodyType(Message.BODYTYPE_STAMP);
      if(emojiStamp.ReplayItemId != null && emojiStamp.ReplayItemId.length > 0){
          _message.setReplyItemId(emojiStamp.ReplayItemId);
          emojiStamp.ReplayBlock.css("display","none");
      }
      var noteLink = emojiStamp.WithNoteLink.attr("value");
      var fileData = emojiStamp.WithAttatch.parent().parent().find('input[type="file"]').prop('files');
      if(fileData.length > 0){
          sendAttatch(fileData, clickColumnView).then(function(res){
              _message.addAttachedFileUrl(res.path);
              _message.setMessage(_message.getMessage() + "\n" + res.path);
              callBackSendMessageToAPI(
                  _message,
                  function (res2, resForComm){
                      if( resForComm && columnType == ColumnInformation.TYPE_COLUMN_COMMUNITY_FEED){
                          SendMessageResponce(resForComm, noteLink, emojiStamp);
                      }else{
                          SendMessageResponce(res2, noteLink, emojiStamp);
                      }
                  });
          }).catch(function(err){
              var _title   = Resource.getMessage('dialog_title_system_info');
              var _message = Resource.getMessage('dialog_update_file_error');
              var _dialog = new DialogCloseView(_title, _message);
              _dialog.showDialog();
              return;
          }).finally(function(){
              emojiStamp.WithAttatch.parent().parent().find('input[type="file"]').val("")
              emojiStamp.WithAttatch.attr("title","");
              emojiStamp.WithAttatch.text("");
              emojiStamp.WithAttatch.parent().parent().find("#fileupload_cancel_btn").remove();
          });
      }else{
          callBackSendMessageToAPI(
              _message,
              function (res, resForComm){
                  if(resForComm && columnType == ColumnInformation.TYPE_COLUMN_COMMUNITY_FEED){
                      SendMessageResponce(resForComm, noteLink, emojiStamp);
                  }else{
                      SendMessageResponce(res, noteLink, emojiStamp);
                  }
              });
      }
      ViewUtils.setCharCounter(emojiStamp.MessageBody.parent().find('.char-counter-title-column'), ColumnView.THREAD_TITLE_MAX_LENGTH);
      ViewUtils.setCharCounter(emojiStamp.MessageBody.parent().find('.char-counter-column'), ColumnView.TEXTAREA_MAX_LENGTH);
      emojiStamp.MessageBody.val("");
      emojiStamp.MessageTitle.val("");
  }
  var sendAttatch = function (fileData, clickColumnView) {
      return new Promise(function(resolve, reject){
          var _file = fileData && fileData.length > 0 ? fileData[0] : null;
          if(_file){
              CubeeController.getInstance().uploadFile(_file, function(_responseObject){
                  if(_responseObject.result == "success"){
                      resolve(_responseObject);
                      return;
                  }else{
                      reject();
                      return;
                  }
              }, function(percentComplete){
                  clickColumnView._progressBar.setProgressValue(percentComplete);
              });
          }
      });
  }
});
