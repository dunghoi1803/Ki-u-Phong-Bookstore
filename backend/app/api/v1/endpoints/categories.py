"""Category management endpoints for admin and public listing."""
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api import deps
from app.models import TheLoai
from app.schemas import CategoryCreate, CategoryRead, CategoryUpdate

router = APIRouter()


@router.get("/", response_model=List[CategoryRead])
def list_categories(db: Session = Depends(deps.get_db)) -> List[CategoryRead]:
    stmt = select(TheLoai).order_by(TheLoai.ten_the_loai.asc())
    return list(db.execute(stmt).scalars().all())


@router.post(
    "/",
    response_model=CategoryRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(deps.require_admin)],
)
def create_category(payload: CategoryCreate, db: Session = Depends(deps.get_db)) -> CategoryRead:
    parent_id = payload.ma_the_loai_cha
    if parent_id is not None and db.get(TheLoai, parent_id) is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Parent category not found")

    category = TheLoai(ten_the_loai=payload.ten_the_loai, ma_the_loai_cha=payload.ma_the_loai_cha)
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


@router.put(
    "/{category_id}",
    response_model=CategoryRead,
    dependencies=[Depends(deps.require_admin)],
)
def update_category(
    category_id: int,
    payload: CategoryUpdate,
    db: Session = Depends(deps.get_db),
) -> CategoryRead:
    category = db.get(TheLoai, category_id)
    if category is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")

    if payload.ten_the_loai is not None:
        category.ten_the_loai = payload.ten_the_loai
    if payload.ma_the_loai_cha is not None:
        if payload.ma_the_loai_cha == category_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Category cannot be its own parent")
        if db.get(TheLoai, payload.ma_the_loai_cha) is None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Parent category not found")
        category.ma_the_loai_cha = payload.ma_the_loai_cha

    db.add(category)
    db.commit()
    db.refresh(category)
    return category


@router.delete(
    "/{category_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(deps.require_admin)],
)
def delete_category(category_id: int, db: Session = Depends(deps.get_db)) -> None:
    category = db.get(TheLoai, category_id)
    if category is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")

    # Simple delete; DB will enforce FK constraints.
    db.delete(category)
    db.commit()

