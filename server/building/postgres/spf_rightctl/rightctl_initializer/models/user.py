# -*- coding: utf-8 -*-

# from sqlalchemy import Column, BigInteger, String, Sequence, TIMESTAMP, ForeignKey
from sqlalchemy import Column, BigInteger, String, TIMESTAMP, ForeignKey

from db_manager import Base

class User(Base):
	__tablename__ = 'users'
	id = Column(BigInteger, primary_key=True)
	user = Column(String(512), nullable=False, unique=True)
	role_id = Column(String(100), ForeignKey('roles.id'), nullable=False)

	created_at = Column(TIMESTAMP, nullable=False)
	created_by = Column(String(512), nullable=False)
	updated_at = Column(TIMESTAMP, default=None)
	updated_by = Column(String(512), nullable=False, default="")
