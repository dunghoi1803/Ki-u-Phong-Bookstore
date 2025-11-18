"""Common dependencies reused across routers."""
from __future__ import annotations

from typing import Generator

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db.session import get_db as _get_db
from app.models import NguoiDung
from app.schemas import TokenPayload

settings = get_settings()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.api_v1_prefix}/auth/login")


def get_db() -> Generator[Session, None, None]:
    yield from _get_db()


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> NguoiDung:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        token_data = TokenPayload(**payload)
    except JWTError as exc:
        raise credentials_exception from exc

    if token_data.sub is None:
        raise credentials_exception

    user = db.get(NguoiDung, int(token_data.sub))
    if user is None:
        raise credentials_exception
    return user


def get_current_active_user(current_user: NguoiDung = Depends(get_current_user)) -> NguoiDung:
    if not current_user.trang_thai:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User disabled")
    return current_user


def require_admin(current_user: NguoiDung = Depends(get_current_active_user)) -> NguoiDung:
    if not any(role.ma_vai_tro_code == "admin" for role in current_user.roles):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin privilege required")
    return current_user
