-- ポリシーを追加
INSERT INTO policies (id, policy_tid, created_at, created_by, updated_by)
       SELECT 'p_view_murmur', 'p_view_murmur', now(),'rightctl_initializer', ''
              WHERE NOT EXISTS (SELECT id FROM policies WHERE id='p_view_murmur');
INSERT INTO policies (id, policy_tid, created_at, created_by, updated_by)
       SELECT 'p_send_murmur', 'p_send_murmur', now(),'rightctl_initializer', ''
              WHERE NOT EXISTS (SELECT id FROM policies WHERE id='p_send_murmur');

-- ポリシーをロールに追加
-- ロールnormal に追加
INSERT INTO role_has_policies (role_id, policy_id)
       SELECT 'normal', 'p_send_murmur'
              WHERE NOT EXISTS (SELECT role_id FROM role_has_policies WHERE role_id='normal' AND policy_id='p_send_murmur')
                    AND EXISTS (SELECT role_id FROM role_has_policies WHERE role_id='normal' AND policy_id='p_create_groupchat');
-- ロールguest に追加
INSERT INTO role_has_policies (role_id, policy_id)
       SELECT 'guest', 'p_view_murmur'
              WHERE NOT EXISTS (SELECT role_id FROM role_has_policies WHERE role_id='guest' AND policy_id='p_view_murmur')
                    AND EXISTS (SELECT role_id FROM role_has_policies WHERE role_id='guest' AND policy_id='p_create_groupchat');

-- 権限を追加
\set send_id -1
INSERT INTO rights (action, enable_flag, created_at, created_by, updated_by)
       SELECT 'sendMessageToMurmur',true ,now(),'rightctl_initializer', ''
              WHERE NOT EXISTS (SELECT action FROM rights WHERE action='sendMessageToMurmur')
              RETURNING id AS send_id \gset
\set view_id -1
INSERT INTO rights (action, enable_flag, created_at, created_by, updated_by)
       SELECT 'viewMessageInMurmur',true ,now(),'rightctl_initializer', ''
              WHERE NOT EXISTS (SELECT action FROM rights WHERE action='viewMessageInMurmur')
              RETURNING id AS view_id \gset

-- ポリシーに権限を割当
INSERT INTO policy_has_rights (policy_id, right_id) SELECT 'p_send_murmur', :'send_id'
       WHERE :'send_id' != -1
             AND NOT EXISTS
             (SELECT policy_id FROM policy_has_rights WHERE policy_id='p_send_murmur' AND right_id=:'send_id');
INSERT INTO policy_has_rights (policy_id, right_id) SELECT 'p_send_murmur', :'view_id'
       WHERE :'view_id' != -1
             AND NOT EXISTS
             (SELECT policy_id FROM policy_has_rights WHERE policy_id='p_send_murmur' AND right_id=:'view_id');
INSERT INTO policy_has_rights (policy_id, right_id) SELECT 'p_view_murmur', :'view_id'
       WHERE :'view_id' != -1
             AND NOT EXISTS
             (SELECT policy_id FROM policy_has_rights WHERE policy_id='p_view_murmur' AND right_id=:'view_id');
