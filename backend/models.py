# this defines what a "User" looks like in the database (columns like name, email, password, role).
# from sqlalchemy import Column, Integer, String
# from database import Base

# class User(Base):
#     __tablename__ = "users"

#     id = Column(Integer, primary_key=True, index=True)
#     name = Column(String, nullable=False)
#     email = Column(String, unique=True, index=True, nullable=False)
#     hashed_password = Column(String, nullable=False)
#     role = Column(String, nullable=False)  # resident, guardian, volunteer, security

#     # role-specific optional fields
#     room_number = Column(String, nullable=True)
#     guardian_contact = Column(String, nullable=True)
#     relationship_to_resident = Column(String, nullable=True)
#     resident_name = Column(String, nullable=True)
#     availability = Column(String, nullable=True)
#     staff_id = Column(String, nullable=True)
#     shift = Column(String, nullable=True)


from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, nullable=False)

    room_number = Column(String, nullable=True)
    guardian_contact = Column(String, nullable=True)
    relationship_to_resident = Column(String, nullable=True)
    resident_name = Column(String, nullable=True)
    availability = Column(String, nullable=True)
    staff_id = Column(String, nullable=True)
    shift = Column(String, nullable=True)

    # profile fields
    age = Column(Integer, nullable=True)
    photo_url = Column(String, nullable=True)
    medical_notes = Column(String, nullable=True)
    phone = Column(String, nullable=True)   # used to link guardian accounts to residents
    
    skills = Column(String, nullable=True)   # comma-separated: "First Aid,Medical,Fire Safety"


class Society(Base):
    __tablename__ = "societies"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    address = Column(String, nullable=True)
    resident_id = Column(Integer, ForeignKey("users.id"), nullable=False)


class Block(Base):
    __tablename__ = "blocks"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    society_id = Column(Integer, ForeignKey("societies.id"), nullable=False)


class Flat(Base):
    __tablename__ = "flats"

    id = Column(Integer, primary_key=True, index=True)
    flat_number = Column(String, nullable=False)
    block_id = Column(Integer, ForeignKey("blocks.id"), nullable=False)
    resident_id = Column(Integer, ForeignKey("users.id"), nullable=False)


class Guardian(Base):
    __tablename__ = "guardians"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    phone = Column(String, nullable=False)
    guardian_type = Column(String, nullable=False)
    resident_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    linked_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    status = Column(String, default="unlinked")


class EmergencyContact(Base):
    __tablename__ = "emergency_contacts"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    phone = Column(String, nullable=False)
    relation = Column(String, nullable=True)
    resident_id = Column(Integer, ForeignKey("users.id"), nullable=False)


from datetime import datetime, timezone

class Announcement(Base):
    __tablename__ = "announcements"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    message = Column(String, nullable=False)
    posted_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(String, default=lambda: datetime.now(timezone.utc).isoformat())
    
# class EmergencyAlert(Base):
#     __tablename__ = "emergency_alerts"

#     id = Column(Integer, primary_key=True, index=True)
#     resident_id = Column(Integer, ForeignKey("users.id"), nullable=False)
#     category = Column(String, nullable=True)
#     message = Column(String, nullable=True)
#     latitude = Column(String, nullable=True)
#     longitude = Column(String, nullable=True)
#     status = Column(String, default="pending")
#     accepted_by = Column(Integer, ForeignKey("users.id"), nullable=True)
#     created_at = Column(String, default=lambda: datetime.now(timezone.utc).isoformat())
#     acknowledged_at = Column(String, nullable=True)
#     resolved_at = Column(String, nullable=True)
    
#     acknowledged_at = Column(String, nullable=True)
#     resolved_at = Column(String, nullable=True)
#     assistance_started_at = Column(String, nullable=True)

class EmergencyAlert(Base):
    __tablename__ = "emergency_alerts"

    id = Column(Integer, primary_key=True, index=True)

    resident_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    category = Column(String, nullable=True)
    message = Column(String, nullable=True)

    latitude = Column(String, nullable=True)
    longitude = Column(String, nullable=True)

    status = Column(String, default="pending")

    # Person who accepted/acknowledged the alert
    accepted_by = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=True
    )

    # Person who resolved the alert
    resolved_by = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=True
    )

    created_at = Column(
        String,
        default=lambda: datetime.now(timezone.utc).isoformat()
    )

    acknowledged_at = Column(String, nullable=True)
    assistance_started_at = Column(String, nullable=True)
    resolved_at = Column(String, nullable=True)