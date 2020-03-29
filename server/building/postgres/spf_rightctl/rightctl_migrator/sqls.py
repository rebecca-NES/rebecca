# -*- coding: utf-8 -*-

import re

pt_manage = re.compile(r'^manage')
pt_send = re.compile(r'^send')
pt_view = re.compile(r'^view')
pt_user = re.compile(r'@')

def getsql_select_members(target):
    """ ルームとそれに所属するアカウント(jid)、role（community_storeにおける）を取得する
    Community か Groupchat かによって、呼び分ける
    """
    if target == 'Community':
        return getsql_select_community_members()
    else:
        return getsql_select_groupchats_members()

def getsql_select_community_members():
    return """
select   cs.room_id as room_id
       , cms.jid    as jid
       , cms.role   as role
       , uas.login_account as login_account
  from   community_store as cs
         inner join
         community_member_store as cms
           on cs.room_id = cms.room_id
           and cms.state in (1)
         inner join
         user_profile as upf
           on cms.jid = upf.jid
         inner join
         user_account_store uas
           on upf.name = uas.openfire_account
order by cs.room_id
       , cms.role desc
;
"""

def getsql_select_groupchats_members():
    return """
select   cs.room_id as room_id
       , cms.jid    as jid
       , 2          as role
       , uas.login_account as login_account
  from   chatroom_store as cs
         inner join
         chatroom_member_store as cms
           on cs.room_id = cms.room_id
           and cms.state in (1)
         inner join
         user_profile as upf
           on cms.jid = upf.jid
         inner join
         user_account_store uas
           on upf.name = uas.openfire_account
order by cs.room_id
;
"""

def getsql_insert_right(action, resource):
    return """
insert into rights (
    action
  , resource
  , enable_flag
  , created_at
  , created_by
  , updated_at
  , updated_by
) values (
    '{0}'
  , '{1}'
  , true
  , now()
  , 'migrator'
  , now()
  , 'migrator'
)
;
""".format(action, resource)

def get_policy_name(action, resource):
    return "p_{0}_{1}".format(action, resource)

def get_translation(action):
    if pt_manage.search(action) is not None:
        return u'管理'
    if pt_send.search(action) is not None:
        return u'投稿/閲覧'
    else:
        return u'閲覧のみ'

def getsql_insert_translation(target, action, resource):
    if target == 'Community':
        return getsql_insert_translation_community()
    else:
        return getsql_insert_translation_groupchat(action, resource)

def getsql_insert_translation_community():
    return u"""
insert into translations (
    id
  , locale
  , t
  , created_at
  , created_by
  , updated_at
  , updated_by
) values (
    'none'
  , 'ja'
  , ''
  , now()
  , 'migrator'
  , now()
  , 'migrator'
)
;
"""

def getsql_insert_translation_groupchat(action, resource):
    return u"""
insert into translations (
    id
  , locale
  , t
  , created_at
  , created_by
  , updated_at
  , updated_by
) values (
    '{0}'
  , 'ja'
  , '{1}'
  , now()
  , 'migrator'
  , now()
  , 'migrator'
)
;
""".format(get_policy_name(action, resource), get_translation(action))

def getsql_select_translation(target, action, resource):
    if target == 'Community':
        return getsql_select_translation_of_community()
    else:
        return getsql_select_translation_of_groupchat(action, resource)

def getsql_select_translation_of_community():
    return """
select   id
  from   translations
 where   id = 'none'
;
"""

def getsql_select_translation_of_groupchat(action, resource):
    return """
select   id
  from   translations
 where   id = '{0}'
;
""".format(get_policy_name(action, resource))

def getsql_insert_policy(policy_name):
    return """
insert into policies (
    id
  , policy_tid
  , created_at
  , created_by
  , updated_at
  , updated_by
) values (
    '{0}'
  , '{0}'
  , now()
  , 'migrator'
  , now()
  , 'migrator'
)
;
""".format(policy_name)

def getsql_select_policy(policy_name):
    return """
select   id
  from   policies
 where   id = '{0}'
;
""".format(policy_name)

def getsql_select_right_id(action, resource):
    return """
select   id
  from   rights
 where   action = '{0}'
   and   resource = '{1}'
;
""".format(action, resource)

def getsql_attach_poilicy_and_right(policy_name, right_id):
    return """
insert into policy_has_rights (
    policy_id
  , right_id
) values (
    '{0}'
  , {1}
)
;
""".format(policy_name, right_id)

def getsql_select_policy_has_righs(policy_name, right_id):
    return """
select   policy_id
  from   policy_has_rights
 where   policy_id = '{0}'
   and   right_id = {1}
;
""".format(policy_name, right_id)

def getsql_select_user_id(login_account):
    return """
select   id
  from   users
 where   "user" = '{0}'
;
""".format(login_account)

def getsql_attach_poilicy_and_user(policy_name, user_id):
    return """
insert into user_has_policies (
    user_id
  , policy_id
) values (
    {0}
  , '{1}'
)
;
""".format(user_id, policy_name)

def getsql_select_user_has_policies(policy_names, user_id):
    return """
select   policy_id
  from   user_has_policies
 where   user_id = {0}
   and   policy_id in ('{1}', '{2}', '{3}')
;
""".format(user_id, policy_names[0], policy_names[1], policy_names[2])
