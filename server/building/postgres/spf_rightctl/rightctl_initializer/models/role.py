# -*- coding: utf-8 -*-

# from sqlalchemy import Column, Integer, String, Sequence, TIMESTAMP
from sqlalchemy import Column, String, TIMESTAMP

from db_manager import Base

class Role(Base):
	__tablename__ = 'roles'
	id = Column(String(100), primary_key=True)
	role_tid = Column(String(100), nullable=False)

	created_at = Column(TIMESTAMP, nullable=False)
	created_by = Column(String(512), nullable=False)
	updated_at = Column(TIMESTAMP, default=None)
	updated_by = Column(String(512), nullable=False, default="")
