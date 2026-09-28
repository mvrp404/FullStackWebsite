from fastapi import FastAPI, Depends, HTTPException, status, Response
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional, List

import models
import schemas
import recommender
from database import engine, get_db, SessionLocal

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Event Management API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SECRET_KEY = "my_super_secret_key_for_this_app"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="users/login")

def get_password_hash(password):
    return pwd_context.hash(password)

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Μη έγκυρα διαπιστευτήρια",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = db.query(models.User).filter(models.User.username == username).first()
    if user is None:
        raise credentials_exception
    return user

def require_admin(current_user: models.User = Depends(get_current_user)):
    if current_user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Απαιτούνται δικαιώματα διαχειριστή.")
    return current_user

@app.on_event("startup")
def create_init_admin():
    db = SessionLocal()
    admin_user = db.query(models.User).filter(models.User.username == "admin").first()
    
    if not admin_user:
        admin_user = models.User(
            username="admin",
            password_hash=get_password_hash("admin123"),
            email="admin@di.uoa.gr",
            first_name="System",
            last_name="Administrator",
            role="ADMIN",
            is_approved=True
        )
        db.add(admin_user)
    else:
        admin_user.password_hash = get_password_hash("admin123")
        admin_user.is_approved = True
        admin_user.role = "ADMIN"
        
    db.commit()
    db.close()

# --- ΧΡΗΣΤΕΣ & AUTH ---
@app.post("/users/register", response_model=schemas.UserResponse)
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    if user.password != user.password_confirm:
        raise HTTPException(status_code=400, detail="Οι κωδικοί δεν ταιριάζουν.")
    
    if db.query(models.User).filter(models.User.username == user.username).first():
        raise HTTPException(status_code=400, detail="Το username υπάρχει ήδη.")
    if db.query(models.User).filter(models.User.email == user.email).first():
        raise HTTPException(status_code=400, detail="Το email χρησιμοποιείται ήδη από άλλον χρήστη.")
    
    new_user = models.User(
        username=user.username,
        password_hash=get_password_hash(user.password),
        email=user.email,
        first_name=user.first_name,
        last_name=user.last_name,
        phone=user.phone,
        address=user.address,
        latitude=user.latitude,
        longitude=user.longitude,
        afm=user.afm,
        role=user.role,
        is_approved=False 
    )
    db.add(new_user)
    
    try:
        db.commit()
        db.refresh(new_user)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Σφάλμα βάσης δεδομένων κατά την εγγραφή.")
        
    return new_user

@app.post("/users/login")
def login_user(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Λάθος username ή password")
    if not user.is_approved:
        raise HTTPException(status_code=403, detail="Ο λογαριασμός εκκρεμεί για έγκριση.")
        
    access_token = create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer", "role": user.role}

# --- ΔΙΑΧΕΙΡΙΣΤΗΣ (ADMIN) ---
@app.get("/admin/users", response_model=List[schemas.UserResponse])
def get_all_users(db: Session = Depends(get_db), admin: models.User = Depends(require_admin)):
    return db.query(models.User).all()

@app.get("/admin/users/pending", response_model=List[schemas.UserResponse])
def get_pending_users(db: Session = Depends(get_db), admin: models.User = Depends(require_admin)):
    return db.query(models.User).filter(models.User.is_approved == False).all()

@app.put("/admin/users/{user_id}/approve")
def approve_user(user_id: int, db: Session = Depends(get_db), admin: models.User = Depends(require_admin)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Ο χρήστης δεν βρέθηκε.")
    user.is_approved = True
    db.commit()
    return {"message": "Ο χρήστης εγκρίθηκε επιτυχώς."}

@app.delete("/admin/users/{user_id}/reject")
def reject_user(user_id: int, db: Session = Depends(get_db), admin: models.User = Depends(require_admin)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Ο χρήστης δεν βρέθηκε.")
    
    db.delete(user)
    db.commit()
    return {"message": "Η αίτηση του χρήστη απορρίφθηκε επιτυχώς."}

@app.get("/admin/export/json")
def export_events_json(db: Session = Depends(get_db), admin: models.User = Depends(require_admin)):
    return db.query(models.Event).all()

@app.get("/admin/export/xml")
def export_events_xml(db: Session = Depends(get_db), admin: models.User = Depends(require_admin)):
    events = db.query(models.Event).all()
    xml_content = '<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE Events SYSTEM "events.dtd">\n<Events>\n'
    for event in events:
        xml_content += f'  <Event EventID="{event.id}">\n'
        xml_content += f'    <Title>{event.title}</Title>\n'
        xml_content += f'    <EventType>{event.event_type}</EventType>\n'
        xml_content += f'    <Venue>{event.venue}</Venue>\n'
        xml_content += f'    <Address>{event.address}</Address>\n'
        xml_content += f'    <City>{event.city}</City>\n'
        xml_content += f'    <Country>{event.country}</Country>\n'
        if event.latitude and event.longitude:
            xml_content += f'    <GeoLocation Latitude="{event.latitude}" Longitude="{event.longitude}"/>\n'
        xml_content += f'    <StartDateTime>{event.start_datetime.isoformat()}</StartDateTime>\n'
        xml_content += f'    <EndDateTime>{event.end_datetime.isoformat()}</EndDateTime>\n'
        xml_content += f'    <Capacity>{event.capacity}</Capacity>\n'
        
        if event.ticket_types:
            xml_content += '    <TicketTypes>\n'
            for tt in event.ticket_types:
                xml_content += f'      <TicketType TicketTypeID="{tt.id}">\n'
                xml_content += f'        <Name>{tt.name}</Name>\n'
                xml_content += f'        <Price>{tt.price}</Price>\n'
                xml_content += f'        <Quantity>{tt.quantity}</Quantity>\n'
                xml_content += f'        <Available>{tt.available}</Available>\n'
                xml_content += '      </TicketType>\n'
            xml_content += '    </TicketTypes>\n'
        
        xml_content += f'    <Organizer UserID="{event.organizer_id}"/>\n'
        xml_content += f'    <Status>{event.status}</Status>\n'
        xml_content += f'    <Description>{event.description}</Description>\n'
        
        # Εξαγωγή φωτογραφίας εφόσον υπάρχει
        if event.image_url:
            xml_content += f'    <Media>\n      <Photo>{event.image_url}</Photo>\n    </Media>\n'
            
        xml_content += '  </Event>\n'
    xml_content += '</Events>'
    return Response(content=xml_content, media_type="application/xml")

# --- ΕΚΔΗΛΩΣΕΙΣ ---
@app.post("/events/", response_model=schemas.EventResponse)
def create_event(event: schemas.EventCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != "ORGANIZER":
        raise HTTPException(status_code=403, detail="Μόνο διοργανωτές μπορούν να δημιουργήσουν εκδηλώσεις.")
        
    new_event = models.Event(
        id=event.id,
        title=event.title,
        event_type=event.event_type,
        venue=event.venue,
        address=event.address,
        city=event.city,
        country=event.country,
        latitude=event.latitude,
        longitude=event.longitude,
        capacity=event.capacity,
        description=event.description,
        image_url=event.image_url,
        start_datetime=event.start_datetime,
        end_datetime=event.end_datetime,
        organizer_id=current_user.id,
        status="PUBLISHED"
    )
    db.add(new_event)
    db.commit()
    db.refresh(new_event)
    return new_event

@app.get("/events/", response_model=List[schemas.EventResponse])
def get_all_events(db: Session = Depends(get_db)):
    return db.query(models.Event).all() 

# --- ΔΙΑΧΕΙΡΙΣΗ ΕΚΔΗΛΩΣΕΩΝ (ΟΡΓΑΝΩΤΗΣ) ---
@app.get("/organizer/events", response_model=List[schemas.EventResponse])
def get_organizer_events(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != "ORGANIZER":
        raise HTTPException(status_code=403, detail="Μόνο οι διοργανωτές έχουν πρόσβαση.")
    return db.query(models.Event).filter(models.Event.organizer_id == current_user.id).all()

@app.get("/events/{event_id}", response_model=schemas.EventResponse)
def get_event(event_id: str, db: Session = Depends(get_db)):
    event = db.query(models.Event).filter(models.Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Η εκδήλωση δεν βρέθηκε.")
    return event

@app.put("/events/{event_id}", response_model=schemas.EventResponse)
def update_event(event_id: str, updated_data: schemas.EventCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    event = db.query(models.Event).filter(models.Event.id == event_id).first()
    if not event or event.organizer_id != current_user.id:
        raise HTTPException(status_code=404, detail="Δεν βρέθηκε η εκδήλωση ή δεν σας ανήκει.")
    
    if event.status == "CANCELLED":
        raise HTTPException(status_code=400, detail="Δεν επιτρέπεται η επεξεργασία ακυρωμένης εκδήλωσης.")
        
    event.title = updated_data.title
    event.event_type = updated_data.event_type
    event.venue = updated_data.venue
    event.address = updated_data.address
    event.city = updated_data.city
    event.country = updated_data.country
    event.latitude = updated_data.latitude
    event.longitude = updated_data.longitude
    event.capacity = updated_data.capacity
    event.description = updated_data.description
    event.image_url = updated_data.image_url
    event.start_datetime = updated_data.start_datetime
    event.end_datetime = updated_data.end_datetime
    
    db.commit()
    db.refresh(event)
    return event

@app.delete("/events/{event_id}")
def delete_event(event_id: str, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    event = db.query(models.Event).filter(models.Event.id == event_id).first()
    if not event or event.organizer_id != current_user.id:
        raise HTTPException(status_code=404, detail="Δεν βρέθηκε η εκδήλωση ή δεν σας ανήκει.")
    
    bookings_count = sum([db.query(models.Booking).filter(models.Booking.ticket_type_id == tt.id).count() for tt in event.ticket_types])
    
    if bookings_count > 0:
        raise HTTPException(status_code=400, detail="Υπάρχουν ήδη κρατήσεις. Μπορείτε μόνο να ακυρώσετε την εκδήλωση.")
        
    db.delete(event)
    db.commit()
    return {"message": "Η εκδήλωση διαγράφηκε επιτυχώς."}

@app.put("/events/{event_id}/cancel")
def cancel_event(event_id: str, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    event = db.query(models.Event).filter(models.Event.id == event_id).first()
    if not event or event.organizer_id != current_user.id:
        raise HTTPException(status_code=404, detail="Δεν βρέθηκε η εκδήλωση ή δεν σας ανήκει.")
        
    if event.status == "CANCELLED":
        raise HTTPException(status_code=400, detail="Η εκδήλωση είναι ήδη ακυρωμένη.")
        
    event.status = "CANCELLED"
    
    users_to_notify = set()
    for tt in event.ticket_types:
        bookings = db.query(models.Booking).filter(models.Booking.ticket_type_id == tt.id).all()
        for b in bookings:
            if b.booking_status != "CANCELLED":
                users_to_notify.add(b.user_id)
                b.booking_status = "CANCELLED"
            
    for uid in users_to_notify:
        msg = models.Message(
            sender_id=current_user.id,
            receiver_id=uid,
            content=f"ΣΗΜΑΝΤΙΚΟ: Η εκδήλωση '{event.title}' ακυρώθηκε από τον διοργανωτή. Η κράτησή σας ακυρώθηκε.",
            is_read=False,
            timestamp=datetime.utcnow()
        )
        db.add(msg)
        
    db.commit()
    return {"message": "Η εκδήλωση ακυρώθηκε και ειδοποιήθηκαν με αυτόματο μήνυμα οι συμμετέχοντες."}

@app.get("/events/{event_id}/bookings", response_model=List[schemas.BookingResponse])
def get_event_bookings(event_id: str, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    event = db.query(models.Event).filter(models.Event.id == event_id).first()
    
    if not event or event.organizer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Δεν έχετε πρόσβαση στις κρατήσεις αυτής της εκδήλωσης.")
    
    ticket_type_ids = [tt.id for tt in event.ticket_types]
    bookings = db.query(models.Booking).filter(models.Booking.ticket_type_id.in_(ticket_type_ids)).all()
    
    return bookings

# --- ΕΙΣΙΤΗΡΙΑ ---
@app.post("/events/{event_id}/tickets", response_model=schemas.TicketTypeResponse)
def add_ticket_type(event_id: str, ticket: schemas.TicketTypeCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    event = db.query(models.Event).filter(models.Event.id == event_id, models.Event.organizer_id == current_user.id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Η εκδήλωση δεν βρέθηκε ή δεν σας ανήκει.")

    if event.status == "CANCELLED":
        raise HTTPException(status_code=400, detail="Δεν μπορείτε να προσθέσετε εισιτήρια σε ακυρωμένη εκδήλωση.")

    current_tickets = sum([t.quantity for t in event.ticket_types])
    if current_tickets + ticket.quantity > event.capacity:
        raise HTTPException(status_code=400, detail="Το άθροισμα των εισιτηρίων υπερβαίνει τη συνολική χωρητικότητα.")

    new_ticket = models.TicketType(
        id=ticket.id,
        event_id=event_id,
        name=ticket.name,
        price=ticket.price,
        quantity=ticket.quantity,
        available=ticket.quantity
    )
    db.add(new_ticket)
    db.commit()
    db.refresh(new_ticket)
    return new_ticket

# --- ΚΡΑΤΗΣΕΙΣ ---
@app.post("/bookings/", response_model=schemas.BookingResponse)
def create_booking(booking: schemas.BookingCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    ticket = db.query(models.TicketType).filter(models.TicketType.id == booking.ticket_type_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ο τύπος εισιτηρίου δεν βρέθηκε.")
        
    event = db.query(models.Event).filter(models.Event.id == ticket.event_id).first()
    if event and event.status == "CANCELLED":
        raise HTTPException(status_code=400, detail="Η εκδήλωση έχει ακυρωθεί. Δεν επιτρέπονται νέες κρατήσεις.")

    if ticket.available < booking.quantity:
        raise HTTPException(status_code=400, detail="Δεν υπάρχουν αρκετά διαθέσιμα εισιτήρια.")
    
    ticket.available -= booking.quantity
    total_cost = ticket.price * booking.quantity
    
    new_booking = models.Booking(
        user_id=current_user.id,
        ticket_type_id=ticket.id,
        quantity=booking.quantity,
        total_cost=total_cost,
        booking_status="CONFIRMED",
        booking_date=datetime.utcnow()
    )
    db.add(new_booking)
    db.commit()
    db.refresh(new_booking)
    return new_booking

@app.get("/bookings/", response_model=List[schemas.BookingResponse])
def get_user_bookings(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return db.query(models.Booking).filter(models.Booking.user_id == current_user.id).order_by(models.Booking.booking_date.desc()).all()

# --- ΜΗΝΥΜΑΤΑ ---
@app.post("/messages/", response_model=schemas.MessageResponse)
def send_message(message: schemas.MessageCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    new_message = models.Message(
        sender_id=current_user.id,
        receiver_id=message.receiver_id,
        content=message.content,
        is_read=False,
        timestamp=datetime.utcnow()
    )
    db.add(new_message)
    db.commit()
    db.refresh(new_message)
    return new_message

@app.get("/messages/inbox", response_model=List[schemas.MessageResponse])
def get_inbox(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return db.query(models.Message).filter(models.Message.receiver_id == current_user.id).order_by(models.Message.timestamp.desc()).all()

@app.get("/messages/sent", response_model=List[schemas.MessageResponse])
def get_sent_messages(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return db.query(models.Message).filter(models.Message.sender_id == current_user.id).order_by(models.Message.timestamp.desc()).all()

@app.get("/messages/unread-count")
def get_unread_count(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    count = db.query(models.Message).filter(models.Message.receiver_id == current_user.id, models.Message.is_read == False).count()
    return {"unread": count}

@app.put("/messages/{message_id}/read")
def mark_as_read(message_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    msg = db.query(models.Message).filter(models.Message.id == message_id, models.Message.receiver_id == current_user.id).first()
    if msg and not msg.is_read:
        msg.is_read = True
        db.commit()
    return {"message": "Marked as read"}

@app.delete("/messages/{message_id}")
def delete_message(message_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    msg = db.query(models.Message).filter(models.Message.id == message_id, (models.Message.receiver_id == current_user.id) | (models.Message.sender_id == current_user.id)).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Το μήνυμα δεν βρέθηκε.")
    
    db.delete(msg)
    db.commit()
    return {"message": "Το μήνυμα διαγράφηκε επιτυχώς."}

# --- ΣΥΣΤΗΜΑ ΣΥΣΤΑΣΕΩΝ ---
@app.get("/recommendations/", response_model=List[schemas.EventResponse])
def get_recommendations(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    all_bookings = db.query(models.Booking).all()
    ratings_data = []
    for b in all_bookings:
        ratings_data.append((b.user_id, b.ticket_type.event_id, 5.0))
    
    if not ratings_data:
        return db.query(models.Event).filter(models.Event.status == "PUBLISHED").limit(5).all()

    recsys = recommender.BiasedMatrixFactorization()
    recsys.fit(ratings_data)

    user_booked_events = {b.ticket_type.event_id for b in db.query(models.Booking).filter(models.Booking.user_id == current_user.id).all()}
    all_events = db.query(models.Event).filter(models.Event.status == "PUBLISHED").all()
    
    predictions = []
    for event in all_events:
        if event.id not in user_booked_events:
            score = recsys.predict(current_user.id, event.id)
            predictions.append((score, event))
    
    predictions.sort(key=lambda x: x[0], reverse=True)
    top_events = [event for score, event in predictions[:5]]
    
    return top_events