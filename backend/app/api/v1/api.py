"""Attach versioned routers to the FastAPI application."""
from fastapi import APIRouter

from app.api.v1.endpoints import admin_orders, addresses, auth, books, cart, categories, orders

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(books.router, prefix="/books", tags=["books"])
api_router.include_router(categories.router, prefix="/categories", tags=["categories"])
api_router.include_router(cart.router, prefix="/cart", tags=["cart"])
api_router.include_router(orders.router, prefix="/orders", tags=["orders"])
api_router.include_router(admin_orders.router, prefix="/admin/orders", tags=["admin-orders"])
api_router.include_router(addresses.router, prefix="/users/me/addresses", tags=["addresses"])
