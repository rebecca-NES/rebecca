# -*- coding: utf-8 -*-

from sqlalchemy import Column, BigInteger, String, ForeignKey

from db_manager import Base

class PolicyHasRight(Base):
	__tablename__ = 'policy_has_rights'
	policy_id = Column(String(100) , ForeignKey('policies.id', ondelete='cascade'), primary_key=True)
	right_id = Column(BigInteger, ForeignKey('rights.id', ondelete='cascade'), primary_key=True)
