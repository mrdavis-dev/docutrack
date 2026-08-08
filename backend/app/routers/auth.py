import logging
from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy.orm import Session as DBSession
from app.database import get_db
from app.models.user import User, Session, SESSION_TTL
from app.schemas.user import LoginRequest, LoginResponse, UserCreate, UserOut
from app.utils.auth import hash_password, verify_password, require_admin, bearer_scheme

logger = logging.getLogger(__name__)
router = APIRouter(tags=["auth"])


@router.post("/auth/login", response_model=LoginResponse)
def login(payload: LoginRequest, db: DBSession = Depends(get_db)):
    user = db.query(User).filter(User.username == payload.username, User.is_active == True).first()  # noqa: E712
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Usuario o contraseña incorrectos")
    session = Session(
        user_id=user.id,
        token=Session.new_token(),
        expires_at=datetime.utcnow() + SESSION_TTL,
    )
    db.add(session)
    db.commit()
    logger.info("User %s logged in", user.username)
    return LoginResponse(token=session.token, username=user.username, expires_at=session.expires_at)


@router.post("/auth/logout", status_code=204)
def logout(
    creds: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: DBSession = Depends(get_db),
):
    if creds:
        session = db.query(Session).filter(Session.token == creds.credentials).first()
        if session and session.revoked_at is None:
            session.revoked_at = datetime.utcnow()
            db.commit()
    # No error if already logged out / invalid token — logout is idempotent.


@router.get("/users", response_model=List[UserOut])
def list_users(db: DBSession = Depends(get_db), _: User = Depends(require_admin)):
    return db.query(User).order_by(User.created_at).all()


@router.post("/users", response_model=UserOut, status_code=201)
def create_user(payload: UserCreate, db: DBSession = Depends(get_db), _: User = Depends(require_admin)):
    if db.query(User).filter(User.username == payload.username).first():
        raise HTTPException(status_code=400, detail="Ese usuario ya existe")
    user = User(username=payload.username, password_hash=hash_password(payload.password))
    db.add(user)
    db.commit()
    db.refresh(user)
    logger.info("Admin user created: %s", user.username)
    return user


@router.patch("/users/{user_id}/deactivate", response_model=UserOut)
def deactivate_user(user_id: int, db: DBSession = Depends(get_db), current: User = Depends(require_admin)):
    if user_id == current.id:
        raise HTTPException(status_code=400, detail="No puedes desactivar tu propia cuenta")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    user.is_active = False
    # Revoke all active sessions for this user so a deactivation takes effect immediately,
    # not just on their next login attempt.
    db.query(Session).filter(Session.user_id == user_id, Session.revoked_at.is_(None)).update(
        {"revoked_at": datetime.utcnow()}
    )
    db.commit()
    db.refresh(user)
    logger.info("Admin user deactivated: %s", user.username)
    return user
