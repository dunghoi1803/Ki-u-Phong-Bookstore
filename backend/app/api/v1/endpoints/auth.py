"""Authentication endpoints."""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api import deps
from app.core.security import create_access_token, get_password_hash, verify_password
from app.models import NguoiDung, VaiTro
from app.schemas import PasswordChange, Token, UserCreate, UserRead, UserUpdate

router = APIRouter()

CUSTOMER_ROLE_CODE = "customer"
ADMIN_ROLE_CODE = "admin"


def _get_role_by_code(db: Session, code: str, *, default_name: str) -> VaiTro:
    role = db.execute(select(VaiTro).where(VaiTro.ma_vai_tro_code == code)).scalar_one_or_none()
    if role is None:
        role = VaiTro(ma_vai_tro_code=code, ten_vai_tro=default_name)
        db.add(role)
        db.commit()
        db.refresh(role)
    return role


@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def register_user(user_in: UserCreate, db: Session = Depends(deps.get_db)) -> UserRead:
    existing = db.execute(select(NguoiDung).where(NguoiDung.email == user_in.email)).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    user = NguoiDung(
        ho_ten=user_in.ho_ten,
        email=user_in.email,
        so_dien_thoai=user_in.so_dien_thoai,
        mat_khau_ma_hoa=get_password_hash(user_in.password),
    )
    customer_role = _get_role_by_code(db, CUSTOMER_ROLE_CODE, default_name="Khach hang")
    user.roles.append(customer_role)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(deps.get_db)) -> Token:
    stmt = select(NguoiDung).where(NguoiDung.email == form_data.username)
    user = db.execute(stmt).scalar_one_or_none()
    if user is None or not verify_password(form_data.password, user.mat_khau_ma_hoa):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")

    if not user.trang_thai:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account disabled")

    access_token = create_access_token(subject=str(user.ma_nguoi_dung))
    return Token(access_token=access_token)


@router.get("/me", response_model=UserRead)
def read_profile(current_user: NguoiDung = Depends(deps.get_current_active_user)) -> UserRead:
    return current_user


@router.put("/me", response_model=UserRead)
def update_profile(
    payload: UserUpdate,
    db: Session = Depends(deps.get_db),
    current_user: NguoiDung = Depends(deps.get_current_active_user),
) -> UserRead:
    # If email is changed, ensure it is not already used
    if payload.email and payload.email != current_user.email:
        existing = db.execute(select(NguoiDung).where(NguoiDung.email == payload.email)).scalar_one_or_none()
        if existing:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    if payload.ho_ten is not None:
        current_user.ho_ten = payload.ho_ten
    if payload.so_dien_thoai is not None:
        current_user.so_dien_thoai = payload.so_dien_thoai
    if payload.email is not None:
        current_user.email = payload.email

    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return current_user


@router.post("/change-password")
def change_password(
    payload: PasswordChange,
    db: Session = Depends(deps.get_db),
    current_user: NguoiDung = Depends(deps.get_current_active_user),
) -> dict:
    if not verify_password(payload.old_password, current_user.mat_khau_ma_hoa):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Current password is incorrect")

    current_user.mat_khau_ma_hoa = get_password_hash(payload.new_password)
    db.add(current_user)
    db.commit()
    return {"detail": "Password changed successfully"}


@router.post("/make-me-admin", response_model=UserRead)
def make_me_admin(
    db: Session = Depends(deps.get_db),
    current_user: NguoiDung = Depends(deps.get_current_active_user),
) -> UserRead:
    """Elevate the current user to admin role (dev-only convenience endpoint)."""
    admin_role = _get_role_by_code(db, ADMIN_ROLE_CODE, default_name="Admin")
    if admin_role not in current_user.roles:
        current_user.roles.append(admin_role)
        db.add(current_user)
        db.commit()
        db.refresh(current_user)
    return current_user
