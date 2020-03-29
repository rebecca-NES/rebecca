# -*- coding: utf-8 -*-

from sqlalchemy import Column, String, ForeignKey

from db_manager import Base

class RoleHasPolicy(Base):
	__tablename__ = 'role_has_policies'
	role_id = Column(String(100), ForeignKey('roles.id', ondelete='cascade'), primary_key=True)
	policy_id = Column(String(100), ForeignKey('policies.id', ondelete='cascade'), primary_key=True)
