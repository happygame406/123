from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from jose import jwt, JWTError
from app import models, schemas, bot_logic
from app.database import SessionLocal

router = APIRouter()

SECRET_KEY = "supersecretkey"
ALGORITHM = "HS256"

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(authorization: str = Header(None)):
    if not authorization:
        return None
    
    try:
        token = authorization.split(" ")[1]
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except (JWTError, IndexError):
        return None

@router.post("/chat/session")
def create_session(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    session = models.Session()
    
    if current_user:
        session.user_id = current_user.get("user_id")
    
    db.add(session)
    db.commit()
    db.refresh(session)
    return {"session_id": session.id, "created_at": session.created_at}

@router.post("/chat/message")
def send_message(
    message: schemas.MessageCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    session = db.query(models.Session).filter(models.Session.id == message.session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Сессия не найдена")
    
    if not message.text or not message.text.strip():
        raise HTTPException(status_code=400, detail="Сообщение не может быть пустым")
    
    user_msg = models.Message(
        session_id=message.session_id,
        sender="user",
        text=message.text.strip()
    )
    db.add(user_msg)
    
    bot_text = bot_logic.get_bot_response(message.text)
    bot_msg = models.Message(
        session_id=message.session_id,
        sender="bot",
        text=bot_text
    )
    db.add(bot_msg)
    db.commit()
    
    return {"response": bot_text}

@router.get("/chat/history/{session_id}")
def get_history(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    session = db.query(models.Session).filter(models.Session.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Сессия не найдена")
    
    messages = db.query(models.Message).filter(models.Message.session_id == session_id).all()
    return [
        {"id": msg.id, "sender": msg.sender, "text": msg.text, "created_at": msg.created_at}
        for msg in messages
    ]