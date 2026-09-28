from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean, Table
from sqlalchemy.orm import relationship
from database import Base
import datetime

event_category_association = Table(
    'event_category', Base.metadata,
    Column('event_id', String(50), ForeignKey('events.id')),
    Column('category_id', Integer, ForeignKey('categories.id'))
)

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    first_name = Column(String(50))
    last_name = Column(String(50))
    phone = Column(String(20))
    address = Column(String(255))
    latitude = Column(Float)
    longitude = Column(Float)
    afm = Column(String(20), unique=True)
    role = Column(String(20), default="GUEST")
    is_approved = Column(Boolean, default=False)
    
    organized_events = relationship("Event", back_populates="organizer")
    bookings = relationship("Booking", back_populates="user")

class Category(Base):
    __tablename__ = "categories"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False)

class Photo(Base):
    __tablename__ = "photos"
    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(String(50), ForeignKey("events.id"))
    filename = Column(String(255), nullable=False)
    event = relationship("Event", back_populates="media")

class Event(Base):
    __tablename__ = "events"
    id = Column(String(50), primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    event_type = Column(String(100))
    venue = Column(String(255))
    address = Column(String(255))
    city = Column(String(100))
    country = Column(String(100))
    latitude = Column(Float)
    longitude = Column(Float)
    capacity = Column(Integer, nullable=False)
    description = Column(String(1000))
    image_url = Column(String(500), nullable=True)  # <-- ΝΕΟ ΠΕΔΙΟ ΓΙΑ ΦΩΤΟΓΡΑΦΙΑ
    start_datetime = Column(DateTime)
    end_datetime = Column(DateTime)
    status = Column(String(50), default="PUBLISHED")
    organizer_id = Column(Integer, ForeignKey("users.id"))
    
    organizer = relationship("User", back_populates="organized_events")
    ticket_types = relationship("TicketType", back_populates="event")
    categories = relationship("Category", secondary=event_category_association)
    media = relationship("Photo", back_populates="event")

class TicketType(Base):
    __tablename__ = "ticket_types"
    id = Column(String(50), primary_key=True, index=True)
    event_id = Column(String(50), ForeignKey("events.id"))
    name = Column(String(100), nullable=False)
    price = Column(Float, nullable=False)
    quantity = Column(Integer, nullable=False)
    available = Column(Integer, nullable=False)

    event = relationship("Event", back_populates="ticket_types")
    bookings = relationship("Booking", back_populates="ticket_type")

class Booking(Base):
    __tablename__ = "bookings"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    ticket_type_id = Column(String(50), ForeignKey("ticket_types.id"))
    quantity = Column(Integer, nullable=False)
    total_cost = Column(Float, nullable=False)
    booking_status = Column(String(20), default="CONFIRMED")
    booking_date = Column(DateTime, default=datetime.datetime.utcnow) 

    user = relationship("User", back_populates="bookings")
    ticket_type = relationship("TicketType", back_populates="bookings")

class Message(Base):
    __tablename__ = "messages"
    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey("users.id"))
    receiver_id = Column(Integer, ForeignKey("users.id"))
    content = Column(String(1000), nullable=False)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    is_read = Column(Boolean, default=False)

    sender = relationship("User", foreign_keys=[sender_id])
    receiver = relationship("User", foreign_keys=[receiver_id])