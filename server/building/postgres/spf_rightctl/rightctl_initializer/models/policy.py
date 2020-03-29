# -*- coding: utf-8 -*-

from sqlalchemy import Column, String, TIMESTAMP

from db_manager import Base

class Policy(Base):
	__tablename__ = 'policies'
	id = Column(String(100), primary_key=True)
	policy_tid = Column(String(100), nullable=False)

	created_at = Column(TIMESTAMP, nullable=False)
	created_by = Column(String(512), nullable=False)
	updated_at = Column(TIMESTAMP, default=None)
	updated_by = Column(String(512), nullable=False, default="")
