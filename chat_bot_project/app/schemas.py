from pydantic import BaseModel, validator
from datetime import datetime

class UserCreate(BaseModel):
    username: str
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class MessageCreate(BaseModel):
    text: str
    session_id: int

class MessageResponse(BaseModel):
    text: str
    sender: str
    created_at: datetime

class SessionResponse(BaseModel):
    id: int
    created_at: datetime

class Token(BaseModel):
    access_token: str
    token_type: str