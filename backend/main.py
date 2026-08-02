# this is the actual FastAPI app with our /register and /login routes, and the file we'll run to start the server.
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from database import engine, Base, get_db
import models
import schemas
import auth

# Creates the actual 'users' table in PostgreSQL if it doesn't exist yet
Base.metadata.create_all(bind=engine)

app = FastAPI()

# Allows our React frontend (running on a different port) to talk to this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "Care Connect backend is running"}

# @app.post("/register", response_model=schemas.UserResponse)
# def register(user: schemas.UserRegister, db: Session = Depends(get_db)):
#     existing_user = db.query(models.User).filter(models.User.email == user.email).first()
#     if existing_user:
#         raise HTTPException(status_code=400, detail="Email already registered")

#     new_user = models.User(
#         name=user.name,
#         email=user.email,
#         hashed_password=auth.hash_password(user.password),
#         role=user.role,
#         room_number=user.room_number,
#         guardian_contact=user.guardian_contact,
#         relationship_to_resident=user.relationship_to_resident,
#         resident_name=user.resident_name,
#         availability=user.availability,
#         staff_id=user.staff_id,
#         shift=user.shift,
#     )
#     db.add(new_user)
#     db.commit()
#     db.refresh(new_user)
#     return new_user
@app.post("/register", response_model=schemas.UserResponse)
def register(user: schemas.UserRegister, db: Session = Depends(get_db)):
    existing_user = db.query(models.User).filter(models.User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    new_user = models.User(
        name=user.name,
        email=user.email,
        hashed_password=auth.hash_password(user.password),
        role=user.role,
        room_number=user.room_number,
        guardian_contact=user.guardian_contact,
        relationship_to_resident=user.relationship_to_resident,
        resident_name=user.resident_name,
        availability=user.availability,
        staff_id=user.staff_id,
        shift=user.shift,
        phone=user.phone,
        
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # if this is a guardian, try to match against a resident's Guardian entry by phone
    if user.role == "guardian" and user.phone:
        matching_guardian = db.query(models.Guardian).filter(
            models.Guardian.phone == user.phone,
            models.Guardian.linked_user_id == None
        ).first()
        if matching_guardian:
            matching_guardian.linked_user_id = new_user.id
            matching_guardian.status = "pending"
            db.commit()

    return new_user

@app.post("/login")
def login(credentials: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == credentials.email).first()
    if not user or not auth.verify_password(credentials.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    return {"message": "Login successful", "id": user.id, "name": user.name, "role": user.role}




@app.post("/society", response_model=schemas.SocietyResponse)
def add_society(society: schemas.SocietyCreate, resident_id: int, db: Session = Depends(get_db)):
    new_society = models.Society(
        name=society.name,
        address=society.address,
        resident_id=resident_id,
    )
    db.add(new_society)
    db.commit()
    db.refresh(new_society)
    return new_society


@app.post("/block", response_model=schemas.BlockResponse)
def add_block(block: schemas.BlockCreate, db: Session = Depends(get_db)):
    new_block = models.Block(
        name=block.name,
        society_id=block.society_id,
    )
    db.add(new_block)
    db.commit()
    db.refresh(new_block)
    return new_block


@app.post("/flat", response_model=schemas.FlatResponse)
def add_flat(flat: schemas.FlatCreate, resident_id: int, db: Session = Depends(get_db)):
    new_flat = models.Flat(
        flat_number=flat.flat_number,
        block_id=flat.block_id,
        resident_id=resident_id,
    )
    db.add(new_flat)
    db.commit()
    db.refresh(new_flat)
    return new_flat


@app.post("/guardian", response_model=schemas.GuardianResponse)
def add_guardian(guardian: schemas.GuardianCreate, resident_id: int, db: Session = Depends(get_db)):
    new_guardian = models.Guardian(
        name=guardian.name,
        phone=guardian.phone,
        guardian_type=guardian.guardian_type,
        resident_id=resident_id,
    )
    db.add(new_guardian)
    db.commit()
    db.refresh(new_guardian)
    return new_guardian


@app.post("/emergency-contact", response_model=schemas.EmergencyContactResponse)
def add_emergency_contact(contact: schemas.EmergencyContactCreate, resident_id: int, db: Session = Depends(get_db)):
    new_contact = models.EmergencyContact(
        name=contact.name,
        phone=contact.phone,
        relation=contact.relation,
        resident_id=resident_id,
    )
    db.add(new_contact)
    db.commit()
    db.refresh(new_contact)
    return new_contact


@app.get("/resident/{resident_id}/details")
def get_resident_details(resident_id: int, db: Session = Depends(get_db)):
    societies = db.query(models.Society).filter(models.Society.resident_id == resident_id).all()
    flats = db.query(models.Flat).filter(models.Flat.resident_id == resident_id).all()
    guardians = db.query(models.Guardian).filter(models.Guardian.resident_id == resident_id).all()
    emergency_contacts = db.query(models.EmergencyContact).filter(models.EmergencyContact.resident_id == resident_id).all()

    society_ids = [s.id for s in societies]
    blocks = db.query(models.Block).filter(models.Block.society_id.in_(society_ids)).all() if society_ids else []

    return {
        "societies": societies,
        "blocks": blocks,
        "flats": flats,
        "guardians": guardians,
        "emergency_contacts": emergency_contacts,
    }

# --- UPDATE (PUT) endpoints ---

@app.put("/society/{society_id}", response_model=schemas.SocietyResponse)
def update_society(society_id: int, society: schemas.SocietyCreate, db: Session = Depends(get_db)):
    existing = db.query(models.Society).filter(models.Society.id == society_id).first()
    if not existing:
        raise HTTPException(status_code=404, detail="Society not found")
    existing.name = society.name
    existing.address = society.address
    db.commit()
    db.refresh(existing)
    return existing


@app.put("/block/{block_id}", response_model=schemas.BlockResponse)
def update_block(block_id: int, block: schemas.BlockCreate, db: Session = Depends(get_db)):
    existing = db.query(models.Block).filter(models.Block.id == block_id).first()
    if not existing:
        raise HTTPException(status_code=404, detail="Block not found")
    existing.name = block.name
    existing.society_id = block.society_id
    db.commit()
    db.refresh(existing)
    return existing


@app.put("/flat/{flat_id}", response_model=schemas.FlatResponse)
def update_flat(flat_id: int, flat: schemas.FlatCreate, db: Session = Depends(get_db)):
    existing = db.query(models.Flat).filter(models.Flat.id == flat_id).first()
    if not existing:
        raise HTTPException(status_code=404, detail="Flat not found")
    existing.flat_number = flat.flat_number
    existing.block_id = flat.block_id
    db.commit()
    db.refresh(existing)
    return existing


@app.put("/guardian/{guardian_id}", response_model=schemas.GuardianResponse)
def update_guardian(guardian_id: int, guardian: schemas.GuardianCreate, db: Session = Depends(get_db)):
    existing = db.query(models.Guardian).filter(models.Guardian.id == guardian_id).first()
    if not existing:
        raise HTTPException(status_code=404, detail="Guardian not found")
    existing.name = guardian.name
    existing.phone = guardian.phone
    existing.guardian_type = guardian.guardian_type
    db.commit()
    db.refresh(existing)
    return existing


@app.put("/emergency-contact/{contact_id}", response_model=schemas.EmergencyContactResponse)
def update_contact(contact_id: int, contact: schemas.EmergencyContactCreate, db: Session = Depends(get_db)):
    existing = db.query(models.EmergencyContact).filter(models.EmergencyContact.id == contact_id).first()
    if not existing:
        raise HTTPException(status_code=404, detail="Contact not found")
    existing.name = contact.name
    existing.phone = contact.phone
    existing.relation = contact.relation
    db.commit()
    db.refresh(existing)
    return existing


# --- DELETE endpoints ---

@app.delete("/society/{society_id}")
def delete_society(society_id: int, db: Session = Depends(get_db)):
    existing = db.query(models.Society).filter(models.Society.id == society_id).first()
    if not existing:
        raise HTTPException(status_code=404, detail="Society not found")
    db.delete(existing)
    db.commit()
    return {"message": "Society deleted"}


@app.delete("/block/{block_id}")
def delete_block(block_id: int, db: Session = Depends(get_db)):
    existing = db.query(models.Block).filter(models.Block.id == block_id).first()
    if not existing:
        raise HTTPException(status_code=404, detail="Block not found")
    db.delete(existing)
    db.commit()
    return {"message": "Block deleted"}


@app.delete("/flat/{flat_id}")
def delete_flat(flat_id: int, db: Session = Depends(get_db)):
    existing = db.query(models.Flat).filter(models.Flat.id == flat_id).first()
    if not existing:
        raise HTTPException(status_code=404, detail="Flat not found")
    db.delete(existing)
    db.commit()
    return {"message": "Flat deleted"}


@app.delete("/guardian/{guardian_id}")
def delete_guardian(guardian_id: int, db: Session = Depends(get_db)):
    existing = db.query(models.Guardian).filter(models.Guardian.id == guardian_id).first()
    if not existing:
        raise HTTPException(status_code=404, detail="Guardian not found")
    db.delete(existing)
    db.commit()
    return {"message": "Guardian deleted"}


@app.delete("/emergency-contact/{contact_id}")
def delete_contact(contact_id: int, db: Session = Depends(get_db)):
    existing = db.query(models.EmergencyContact).filter(models.EmergencyContact.id == contact_id).first()
    if not existing:
        raise HTTPException(status_code=404, detail="Contact not found")
    db.delete(existing)
    db.commit()
    return {"message": "Contact deleted"}


# --- PROFILE ---

@app.put("/user/{user_id}/profile")
def update_profile(user_id: int, profile: schemas.ProfileUpdate, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if profile.age is not None:
        user.age = profile.age
    if profile.photo_url is not None:
        user.photo_url = profile.photo_url
    if profile.medical_notes is not None:
        user.medical_notes = profile.medical_notes
    if profile.skills is not None:
        user.skills = profile.skills

    db.commit()
    db.refresh(user)
    return {
        "id": user.id,
        "name": user.name,
        "age": user.age,
        "photo_url": user.photo_url,
        "medical_notes": user.medical_notes,
        "skills": user.skills,
    }

@app.get("/user/{user_id}/profile")
def get_profile(user_id: int, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "id": user.id,
        "name": user.name,
        "age": user.age,
        "photo_url": user.photo_url,
        "medical_notes": user.medical_notes,
        "skills": user.skills,
    }


# --- ANNOUNCEMENTS ---

@app.post("/announcement", response_model=schemas.AnnouncementResponse)
def create_announcement(announcement: schemas.AnnouncementCreate, posted_by: int, db: Session = Depends(get_db)):
    new_announcement = models.Announcement(
        title=announcement.title,
        message=announcement.message,
        posted_by=posted_by,
    )
    db.add(new_announcement)
    db.commit()
    db.refresh(new_announcement)
    return new_announcement


@app.get("/announcements", response_model=list[schemas.AnnouncementResponse])
def get_announcements(db: Session = Depends(get_db)):
    return db.query(models.Announcement).order_by(models.Announcement.id.desc()).all()


@app.delete("/announcement/{announcement_id}")
def delete_announcement(announcement_id: int, db: Session = Depends(get_db)):
    existing = db.query(models.Announcement).filter(models.Announcement.id == announcement_id).first()
    if not existing:
        raise HTTPException(status_code=404, detail="Announcement not found")
    db.delete(existing)
    db.commit()
    return {"message": "Announcement deleted"}

#security------------------------------------------------------------------------------------
@app.get("/users/by-role/{role}")
def get_users_by_role(role: str, db: Session = Depends(get_db)):
    users = db.query(models.User).filter(models.User.role == role).all()
    return [
        {
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "role": u.role,
            "room_number": u.room_number,
            "guardian_contact": u.guardian_contact,
            "relationship_to_resident": u.relationship_to_resident,
            "resident_name": u.resident_name,
            "availability": u.availability,
            "staff_id": u.staff_id,
            "shift": u.shift,
            "phone": u.phone,
        }
        for u in users
    ]
    
#volunteer-------------------------------------------------------------------------------------
@app.put("/user/{user_id}/availability")
def update_availability(user_id: int, availability: str, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.availability = availability
    db.commit()
    db.refresh(user)
    return {"id": user.id, "availability": user.availability}


# guardian connection--------------------------------------------------------
@app.put("/guardian/{guardian_id}/approve")
def approve_guardian(guardian_id: int, db: Session = Depends(get_db)):
    guardian = db.query(models.Guardian).filter(models.Guardian.id == guardian_id).first()
    if not guardian:
        raise HTTPException(status_code=404, detail="Guardian not found")
    guardian.status = "approved"
    db.commit()
    return {"message": "Guardian approved"}


@app.get("/guardian-user/{user_id}/linked-resident")
def get_linked_resident(user_id: int, db: Session = Depends(get_db)):
    guardian_record = db.query(models.Guardian).filter(
        models.Guardian.linked_user_id == user_id,
        models.Guardian.status == "approved"
    ).first()

    if not guardian_record:
        return {"linked": False}

    resident = db.query(models.User).filter(models.User.id == guardian_record.resident_id).first()
    societies = db.query(models.Society).filter(models.Society.resident_id == resident.id).all()
    flats = db.query(models.Flat).filter(models.Flat.resident_id == resident.id).all()
    emergency_contacts = db.query(models.EmergencyContact).filter(models.EmergencyContact.resident_id == resident.id).all()

    return {
        "linked": True,
        "resident_name": resident.name,
        "resident_email": resident.email,
        "societies": societies,
        "flats": flats,
        "emergency_contacts": emergency_contacts,
    }
    


# --- EMERGENCY ALERTS ---

@app.post("/emergency-alert", response_model=schemas.EmergencyAlertResponse)
def create_alert(alert: schemas.EmergencyAlertCreate, resident_id: int, db: Session = Depends(get_db)):
    new_alert = models.EmergencyAlert(
        resident_id=resident_id,
        message=alert.message,
    )
    db.add(new_alert)
    db.commit()
    db.refresh(new_alert)
    return new_alert


@app.get("/emergency-alerts", response_model=list[schemas.EmergencyAlertResponse])
def get_alerts(db: Session = Depends(get_db)):
    return db.query(models.EmergencyAlert).order_by(models.EmergencyAlert.id.desc()).all()


@app.put("/emergency-alert/{alert_id}/acknowledge")
def acknowledge_alert(alert_id: int, accepted_by: int, db: Session = Depends(get_db)):
    alert = db.query(models.EmergencyAlert).filter(models.EmergencyAlert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.status = "acknowledged"
    alert.accepted_by = accepted_by
    db.commit()
    return {"message": "Alert acknowledged"}


@app.put("/emergency-alert/{alert_id}/resolve")
def resolve_alert(alert_id: int, db: Session = Depends(get_db)):
    alert = db.query(models.EmergencyAlert).filter(models.EmergencyAlert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.status = "resolved"
    db.commit()
    return {"message": "Alert resolved"}