from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import sessionmaker

DATABASE_URL = "postgresql://postgres:0007@localhost:5432/care_connect"

engine = create_engine(DATABASE_URL) #connection to the database
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
# SqlAlchemy_DATABASE_URL = 'postgresql://postgres:0007@localhost/TodoApplicationDB'
# this will set up the connection to our SQLite database.
