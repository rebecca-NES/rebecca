# -*- coding: utf-8 -*-

import argparse
import datetime
import json
import collections
// Import of 'subprocess' is not used.
// import subprocess
import sys

from db_manager import DBManager
from models.user import User
from models.role import Role
from models.translation import Translation
from models.user_has_policy import UserHasPolicy
from models.role_has_policy import RoleHasPolicy
from models.policy import Policy
from models.policy_has_right import PolicyHasRight
from models.right import Right

def main():
    args = parse_args()

    # Initialize
    dbmng = DBManager(args.db)

    # Only one session to access to database
    _session = dbmng.get_session()

    # Open the file
    decorder = json.JSONDecoder(object_pairs_hook=collections.OrderedDict)
    input_f = open(args.input_file, 'r')
    input_j = decorder.decode(input_f.read())

    # Load json keys and make it inserted
    nowtime = datetime.datetime.now()

    for key in input_j.keys():
        if key == 'translations':
            for dic in input_j[key]:
                rec = Translation(
                          id = dic['id'],
                          locale = dic['locale'],
                          t = dic['t'],
                          created_at = nowtime,
                          created_by = 'rightctl_initializer'
                      )
                _session.add(rec)
            # break しないときは、else は使わないほうが良いらしい。
            # else:
            _session.commit()

        elif key == 'rights':
            for dic in input_j[key]:
                rec = Right(
                          action = dic['action'],
                          enable_flag = True,
                          created_at = nowtime,
                          created_by = 'rightctl_initializer'
                      )
                _session.add(rec)
            # break しないときは、else は使わないほうが良いらしい。
            # else:
            _session.commit()

        elif key == 'policies':
            for dic in input_j[key]:
                rec = Policy(
                          id = dic['id'],
                          policy_tid = dic['policy_tid'],
                          created_at = nowtime,
                          created_by = 'rightctl_initializer'
                      )
                _session.add(rec)
                _session.commit()
                for right_s in dic['rights']:
                    right = _session.query(Right).filter(Right.action==right_s).one()
                    child = PolicyHasRight(
                                policy_id = rec.id,
                                right_id = right.id
                            )
                    _session.add(child)
                # break しないときは、else は使わないほうが良いらしい。
                # else:
                _session.commit()
            # break しないときは、else は使わないほうが良いらしい。
            # else:
            _session.commit()

        elif key == 'roles':
            for dic in input_j[key]:
                rec = Role(
                          id = dic['id'],
                          role_tid = dic['role_tid'],
                          created_at = nowtime,
                          created_by = 'rightctl_initializer'
                      )
                _session.add(rec)
                _session.commit()
                for policy_s in dic['policies']:
                    policy = _session.query(Policy).filter(Policy.id==policy_s).one()
                    child = RoleHasPolicy(
                                role_id = rec.id,
                                policy_id = policy.id
                            )
                    _session.add(child)
                # break しないときは、else は使わないほうが良いらしい。
                # else:
                _session.commit()
            # break しないときは、else は使わないほうが良いらしい。
            # else:
            _session.commit()
        # break しないときは、else は使わないほうが良いらしい。
        # else:
        # None もいらない
        # None

def parse_args():
    parser = argparse.ArgumentParser(__doc__)
    parser.add_argument(
        "-d", "--db", dest="db",
        help="dbname like postgresql://admin:pass@localhost:5432/10-58-78-85_cubee_spf",
        required=True
    )
    parser.add_argument(
        "-i", "--input-file", dest="input_file",
        help="json file to insert into database",
        required=True
    )
    args = parser.parse_args()

    return args


if __name__ == '__main__':
    main()
