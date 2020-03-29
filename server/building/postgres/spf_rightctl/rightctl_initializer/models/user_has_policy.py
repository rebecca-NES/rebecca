# -*- coding: utf-8 -*-

from sqlalchemy import Column, BigInteger, String, ForeignKey

from db_manager import Base

class UserHasPolicy(Base):
	__tablename__ = 'user_has_policies'
	user_id = Column(BigInteger, ForeignKey('users.id', ondelete='cascade'), primary_key=True)
	policy_id = Column(String(100), ForeignKey('policies.id', ondelete='cascade'), primary_key=True)
