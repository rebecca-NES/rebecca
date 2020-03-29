# -*- coding: utf-8 -*-

from sqlalchemy import Column, Integer, String, Sequence, TIMESTAMP

from db_manager import Base

class Translation(Base):
	__tablename__ = 'translations'
	id = Column(String(100), primary_key=True)
	locale = Column(String(10), primary_key=True)
	t = Column(String(512), nullable=False)

	created_at = Column(TIMESTAMP, nullable=False)
	created_by = Column(String(512), nullable=False)
	updated_at = Column(TIMESTAMP, default=None)
	updated_by = Column(String(512), nullable=False, default="")
