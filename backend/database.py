from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Το URL για την SQLite (το αρχείο θα δημιουργηθεί αυτόματα στον ίδιο φάκελο)
SQLALCHEMY_DATABASE_URL = "sqlite:///./event_app.db"

# Δημιουργία της "μηχανής". 
# Το check_same_thread=False χρειάζεται μόνο για την SQLite στο FastAPI.
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Συνάρτηση για να παίρνουμε session της βάσης σε κάθε request
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()