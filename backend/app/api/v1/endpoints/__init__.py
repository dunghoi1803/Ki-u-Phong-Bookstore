"""Endpoints package for API router registration."""

from . import admin_orders, addresses, auth, books, cart, categories, orders

__all__ = [
    "admin_orders",
    "addresses",
    "auth",
    "books",
    "cart",
    "categories",
    "orders",
]
