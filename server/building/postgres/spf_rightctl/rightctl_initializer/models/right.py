# -*- coding: utf-8 -*-

# from sqlalchemy import Column, BigInteger, Boolean, String, Sequence, TIMESTAMP, UniqueConstraint
from sqlalchemy import Column, BigInteger, Boolean, String, TIMESTAMP, UniqueConstraint

from db_manager import Base

class Right(Base):
	__tablename__ = 'rights'
	id = Column(BigInteger, primary_key=True)
	action = Column(String(512), nullable=False, index=True)
	resource = Column(String(512), nullable=True, index=True)
	condition = Column(String(512))
	enable_flag = Column(Boolean, nullable=False, default=False)

	created_at = Column(TIMESTAMP, nullable=False)
	created_by = Column(String(512), nullable=False)
	updated_at = Column(TIMESTAMP, default=None)
	updated_by = Column(String(512), nullable=False, default="")

	UniqueConstraint('right', 'resource', 'condition', 'enable_flag', name='right_unq1')
