from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class UserCreate(BaseModel):
    username: str
    password: str
    password_confirm: str
    email: str
    first_name: str
    last_name: str
    phone: str
    address: str
    latitude: Optional[float] = 0.0
    longitude: Optional[float] = 0.0
    afm: str
    role: str

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    role: str
    is_approved: bool

    class Config:
        from_attributes = True
        orm_mode = True

class TicketTypeCreate(BaseModel):
    id: str
    name: str
    price: float
    quantity: int

class TicketTypeResponse(TicketTypeCreate):
    event_id: str
    available: int

    class Config:
        from_attributes = True
        orm_mode = True

class EventCreate(BaseModel):
    id: str
    title: str
    event_type: str
    venue: str
    address: str
    city: str
    country: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    capacity: int
    description: str
    image_url: Optional[str] = None  # <-- ΝΕΟ ΠΕΔΙΟ ΓΙΑ ΦΩΤΟΓΡΑΦΙΑ
    start_datetime: datetime
    end_datetime: datetime

class EventResponse(EventCreate):
    organizer_id: int
    status: str
    ticket_types: List[TicketTypeResponse] = []

    class Config:
        from_attributes = True
        orm_mode = True

class BookingCreate(BaseModel):
    ticket_type_id: str
    quantity: int

class BookingResponse(BaseModel):
    id: int
    user_id: int
    ticket_type_id: str
    quantity: int
    total_cost: float
    booking_status: str
    booking_date: Optional[datetime] = None

    class Config:
        from_attributes = True
        orm_mode = True

class MessageCreate(BaseModel):
    receiver_id: int
    content: str

class MessageResponse(BaseModel):
    id: int
    sender_id: int
    receiver_id: int
    content: str
    is_read: bool
    timestamp: Optional[datetime] = None

    class Config:
        from_attributes = True
        orm_mode = True