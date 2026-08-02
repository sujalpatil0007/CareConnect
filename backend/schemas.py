# this defines what data the frontend is allowed to send us (e.g. registration must include name, email, password).

from pydantic import BaseModel, EmailStr
from typing import Optional

class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str

    room_number: Optional[str] = None
    guardian_contact: Optional[str] = None
    relationship_to_resident: Optional[str] = None
    resident_name: Optional[str] = None
    availability: Optional[str] = None
    staff_id: Optional[str] = None
    shift: Optional[str] = None
    phone: Optional[str] = None   # guardian's own phone, used for linking

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str

    class Config:
        from_attributes = True
        
        
# ======================================================================================

class SocietyCreate(BaseModel):
    name: str
    address: Optional[str] = None

class SocietyResponse(BaseModel):
    id: int
    name: str
    address: Optional[str] = None

    class Config:
        from_attributes = True


class BlockCreate(BaseModel):
    name: str
    society_id: int

class BlockResponse(BaseModel):
    id: int
    name: str
    society_id: int

    class Config:
        from_attributes = True


class FlatCreate(BaseModel):
    flat_number: str
    block_id: int

class FlatResponse(BaseModel):
    id: int
    flat_number: str
    block_id: int

    class Config:
        from_attributes = True


class GuardianCreate(BaseModel):
    name: str
    phone: str
    guardian_type: str  # "primary" or "secondary"

class GuardianResponse(BaseModel):
    id: int
    name: str
    phone: str
    guardian_type: str

    class Config:
        from_attributes = True

# ---------------------------------------------------------------------------------------
class EmergencyContactCreate(BaseModel):
    name: str
    phone: str
    relation: Optional[str] = None

class EmergencyContactResponse(BaseModel):
    id: int
    name: str
    phone: str
    relation: Optional[str] = None

    class Config:
        from_attributes = True

class ProfileUpdate(BaseModel):
    age: Optional[int] = None
    photo_url: Optional[str] = None
    medical_notes: Optional[str] = None
    skills: Optional[str] = None


class AnnouncementCreate(BaseModel):
    title: str
    message: str


class AnnouncementResponse(BaseModel):
    id: int
    title: str
    message: str
    posted_by: int
    created_at: str

    class Config:
        from_attributes = True

#-------------------------------------------------------------------------
class GuardianApprove(BaseModel):
    status: str  # "approved"


#-------------------------------------------------------------------------
class EmergencyAlertCreate(BaseModel):
    message: Optional[str] = None


class EmergencyAlertResponse(BaseModel):
    id: int
    resident_id: int
    message: Optional[str] = None
    status: str
    accepted_by: Optional[int] = None
    created_at: str

    class Config:
        from_attributes = True
    
    
