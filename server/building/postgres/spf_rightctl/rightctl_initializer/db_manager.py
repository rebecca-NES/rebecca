# -*- coding: utf-8 -*-

from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

Base = declarative_base()

class DBManager():

    def __init__(self, database_name):
        self._engine = \
            create_engine(
                database_name,
                echo=False
            )

        # Crate tables
        Base.metadata.create_all(self._engine)

        # Only one session to access to database
        self._session = sessionmaker(bind=self._engine)

    def get_session(self):
        return self._session()

