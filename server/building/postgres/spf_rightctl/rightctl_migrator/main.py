# -*- coding: utf-8 -*-

import argparse
import datetime
import psycopg2
import psycopg2.extras

import sqls

def main():
    ''' メイン処理
    '''
    print 'START. %s' % datetime.datetime.today()

    # 引数のパース
    args = parse_args()

    # DB接続
    spf_con = psycopg2.connect(args.spf_db)
    print 'Connected: spf ' + str(spf_con.get_backend_pid())
    rightctl_con = psycopg2.connect(args.rightctl_db)
    print 'Connected: rightctl ' + str(rightctl_con.get_backend_pid())

    # コミュニティの権限作成
    migrate('Community', spf_con, rightctl_con)
    print 'done Community.'
    # グループチャットの権限作成
    migrate('Groupchat', spf_con, rightctl_con)
    print 'done Groupchat.'

    # DB接続をクローズ
    spf_con.close()
    rightctl_con.close()

    d = datetime.datetime.today()
    # d を使うように、修正
    # print 'DONE. %s' % datetime.datetime.today()
    print 'DONE. %s' % d


def migrate(target, spf_con, rightctl_con):
    """
    spf の データから、権限管理のデータを作る
    @param target Community か Groupchat を指定する
    @param spf_con SPFのDB（globalsns-TENANT_UUID）とのコネクション
    @param rightctl_con 権限管理(rightctl_TENANT_UUID)とのコネクション
    """
    # 処理した行数を保持。1000件ごとに commit したいから
    row_idx = 0
    # 最後に処理したルームIDを控えておく。ルームIDでソートしたデータをSPFのDBから取得するから
    room = ''

    # アクション名を保持する配列。Community か Groupchat かで名称が異なるので生成
    # 順番は大切。
    acions = [];
    for r in ['manage', 'sendMessageTo', 'viewMessageIn']:
        acions.append(r + target)

    # ポリシー名を保持する配列。べき等性を持たせるために、ユーザとポリシーを紐づけるときに、ポリシーの有無を確認するために使う
    # 順番は、actions に従う。
    policy_names = []

    # spf のカーソル用意
    # 列名アクセスするために、DictCursor を指定
    spf_cur = spf_con.cursor(cursor_factory=psycopg2.extras.DictCursor)

    # rightctl のカーソル用意
    rightctl_cur = rightctl_con.cursor(cursor_factory=psycopg2.extras.DictCursor)
    # rights の id が commit して発行されるシーケンス番号なので
    rightctl_cur.autocommit = False

    # spf から取得する
    spf_cur.execute(sqls.getsql_select_members(target))
    for spf_row in spf_cur:
        row_idx = row_idx + 1
        if row_idx % 1000 == 0:
            rightctl_con.commit()
            print 'commit'
        # 初回か、ルームが変わったタイミングで、権限・翻訳・ポリシーを登録
        if room != spf_row['room_id']:
            # 権限を登録する
            room = spf_row['room_id']
            policy_names = []
            for a in acions:
                policy_name = sqls.get_policy_name(a, room)
                policy_names.append(policy_name)
                # 権限
                # 登録済み？
                rightctl_cur.execute(sqls.getsql_select_right_id(a, room))
                if rightctl_cur.rowcount == 0:
                    # 登録
                    rightctl_cur.execute(sqls.getsql_insert_right(a, room))
                    print str(row_idx) + ' +  rights'
                    # コミット（権限のidが自動採番なので）
                    rightctl_con.commit()
                    # 権限のidの取得
                    rightctl_cur.execute(sqls.getsql_select_right_id(a, room))
                else:
                    print str(row_idx) + ' ! rights has already data: ' + a + ', ' + room
                right_id = rightctl_cur.fetchone()[0]

                # 翻訳
                # 登録済み？
                rightctl_cur.execute(sqls.getsql_select_translation(target, a, room))
                if rightctl_cur.rowcount == 0:
                    # 登録
                    rightctl_cur.execute(sqls.getsql_insert_translation(target, a, room))
                    print str(row_idx) + ' +  translations'
                else:
                    print str(row_idx) + ' ! translations has already data: ' + policy_name
                # ポリシー
                # 登録済み？
                rightctl_cur.execute(sqls.getsql_select_policy(policy_name))
                if rightctl_cur.rowcount == 0:
                    # 登録
                    rightctl_cur.execute(sqls.getsql_insert_policy(policy_name))
                    print str(row_idx) + ' +  policies'
                else:
                    print str(row_idx) + ' ! policies has already data: ' + policy_name
                # ポリシーと権限を紐づける
                # 登録済み？
                rightctl_cur.execute(sqls.getsql_select_policy_has_righs(policy_name, right_id))
                if rightctl_cur.rowcount == 0:
                    # 登録
                    rightctl_cur.execute(sqls.getsql_attach_poilicy_and_right(policy_name, right_id))
                    print str(row_idx) + ' +  policy_has_rights'
                else:
                    print str(row_idx) + ' ! policy_has_rights has already data: ' + policy_name + ', ' + str(right_id)

        # ユーザを取得
        login_account = spf_row['login_account'];
        rightctl_cur.execute(sqls.getsql_select_user_id(login_account))
        user_id = rightctl_cur.fetchone()[0]

        # ユーザとポリシーを紐づける
        # 登録済み？
        policy_name = ''
        rightctl_cur.execute(sqls.getsql_select_user_has_policies(policy_names, user_id))
        if rightctl_cur.rowcount == 0:
            # Community は、管理者かどうかがわかる
            #   管理者なら 0: p_manageCommunity_ を付与。
            #   管理者以外は 1: p_sendMessageToCommunity_ を付与。
            #   2: view.. は使わない。v4のデータからは判断できないから。
            # Groupchat は、0: p_manageGroupchat_ を付与。
            #   他は使わない。v4のデータからは判断できないから。
            idx = 0
            if spf_row['role'] != 2:
                idx = 1
            policy_name = policy_names[idx]
            # 登録
            rightctl_cur.execute(sqls.getsql_attach_poilicy_and_user(policy_name, user_id))
            print str(row_idx) + ' +  user_has_policies'
        else:
            policy_name = rightctl_cur.fetchone()[0]
            print str(row_idx) + ' ! user_has_policies has already data: ' + policy_name + ', ' + str(user_id)

        print str(row_idx) \
            + ' done: ' + policy_name \
            + ', ' + login_account

    # コミット
    rightctl_con.commit()
    print 'commit.'


def parse_args():
    # パーサーの作成
    parser = argparse.ArgumentParser(__doc__)
    # 必須パラメータ -s
    parser.add_argument(
        "-s", "--spf-db", dest="spf_db",
        help="dbname like postgresql://globalsns-aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa:PW@192.168.3.3:5432/globalsns",
        required=True
    )
    # 必須パラメータ -r
    parser.add_argument(
        "-r", "--rightctl-db", dest="rightctl_db",
        help="dbname like postgresql://rightctl:PW@192.168.3.3:5432/rightctl_aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        required=True
    )
    # 引数のパース
    args = parser.parse_args()

    # 結果返却
    return args

if __name__ == '__main__':
    # メイン処理の実行
    main()
