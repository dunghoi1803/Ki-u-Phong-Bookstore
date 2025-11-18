"""Cart request/response schemas."""
from typing import List

from pydantic import BaseModel, conint


class CartItemCreate(BaseModel):
    book_id: int
    quantity: conint(gt=0)


class CartItemUpdate(BaseModel):
    quantity: conint(gt=0)


class CartItemRead(BaseModel):
    item_id: int
    book_id: int
    title: str | None
    price: float
    quantity: int
    subtotal: float
    image: str | None = None


class CartRead(BaseModel):
    id: int
    status: str
    items: List[CartItemRead]
    total_quantity: int
    total_amount: float
