"""Catalog endpoints."""
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, selectinload

from app.api import deps
from app.models import KhoSach, NhaXuatBan, Sach, SachTacGia, SachTheLoai, TacGia, TheLoai, DanhGia
from app.schemas import BookCreate, BookListResponse, BookRead, BookUpdate, ReviewCreate, ReviewRead

router = APIRouter()

LANGUAGE_LABELS = {
    "vi": "Tiếng Việt",
    "en": "Tiếng Anh",
    "ja": "Tiếng Nhật",
    "fr": "Tiếng Pháp",
}


def _resolve_language_label(value: Optional[str]) -> Optional[str]:
    if not value:
        return None
    value = value.strip()
    # Nếu FE gửi code (vi, en, ...) thì map sang label tiếng Việt
    if value in LANGUAGE_LABELS:
        return LANGUAGE_LABELS[value]
    # Nếu đã là dạng đầy đủ (Tiếng Việt, ...) thì giữ nguyên
    return value


@router.get("/", response_model=BookListResponse)
def list_books(
    *,
    db: Session = Depends(deps.get_db),
    search: Optional[str] = Query(None, description="Free text search on book title"),
    category_id: Optional[int] = Query(None),
    min_price: Optional[float] = Query(None, ge=0),
    max_price: Optional[float] = Query(None, ge=0),
    language: Optional[str] = Query(None, description="Language code, e.g. vi, en"),
    in_stock: bool = Query(False, description="Only return books that have inventory in stock"),
    publisher_name: Optional[str] = Query(None, description="Filter by publisher name (case-insensitive)"),
    author_name: Optional[str] = Query(None, description="Filter by author name (case-insensitive)"),
    min_rating: Optional[float] = Query(
        None,
        ge=1,
        le=5,
        description="Filter by minimum average rating (1-5)",
    ),
    sort: str = Query(
        "relevance",
        description="Sort mode: relevance, price_asc, price_desc, newest, bestseller",
    ),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
) -> BookListResponse:
    stmt = (
        select(Sach)
        .options(
            selectinload(Sach.inventory),
            selectinload(Sach.categories),
            selectinload(Sach.authors),
            selectinload(Sach.publisher),
        )
        .where(Sach.trang_thai == "active")
    )

    if search:
        like_pattern = f"%{search}%"
        stmt = stmt.where(
            or_(
                Sach.ten_sach.ilike(like_pattern),
                Sach.publisher.has(NhaXuatBan.ten_nxb.ilike(like_pattern)),
                Sach.authors.any(TacGia.ten_tac_gia.ilike(like_pattern)),
                Sach.categories.any(TheLoai.ten_the_loai.ilike(like_pattern)),
            )
        )
    if category_id:
        stmt = stmt.where(Sach.categories.any(ma_the_loai=category_id))
    if min_price is not None:
        stmt = stmt.where(Sach.gia_ban >= min_price)
    if max_price is not None:
        stmt = stmt.where(Sach.gia_ban <= max_price)
    if language:
        language_label = _resolve_language_label(language)
        stmt = stmt.where(Sach.ngon_ngu == language_label)
    if in_stock:
        stmt = stmt.join(Sach.inventory).where(KhoSach.so_luong_ton > 0)
    if publisher_name:
        publisher_like = f"%{publisher_name}%"
        stmt = stmt.where(Sach.publisher.has(NhaXuatBan.ten_nxb.ilike(publisher_like)))
    if author_name:
        author_like = f"%{author_name}%"
        stmt = stmt.where(Sach.authors.any(TacGia.ten_tac_gia.ilike(author_like)))

    if min_rating is not None:
        avg_subq = (
            select(
                DanhGia.ma_sach,
                func.avg(DanhGia.diem_danh_gia).label("avg_rating"),
            )
            .where(DanhGia.duyet_hien_thi.is_(True))
            .group_by(DanhGia.ma_sach)
            .subquery()
        )
        stmt = stmt.join(avg_subq, avg_subq.c.ma_sach == Sach.ma_sach).where(
            avg_subq.c.avg_rating >= min_rating
        )

    if sort == "price_asc":
        stmt = stmt.order_by(Sach.gia_ban.asc(), Sach.ma_sach.asc())
    elif sort == "price_desc":
        stmt = stmt.order_by(Sach.gia_ban.desc(), Sach.ma_sach.desc())
    elif sort in {"newest", "bestseller", "relevance"}:
        stmt = stmt.order_by(Sach.ngay_tao.desc(), Sach.ma_sach.desc())
    else:
        stmt = stmt.order_by(Sach.ngay_tao.desc(), Sach.ma_sach.desc())

    total = db.execute(stmt.with_only_columns(func.count()).order_by(None)).scalar() or 0
    books = db.execute(stmt.offset(offset).limit(limit)).scalars().all()
    return BookListResponse(total=total, data=books)


@router.get("/{book_id}", response_model=BookRead)
def get_book(book_id: int, db: Session = Depends(deps.get_db)) -> BookRead:
    stmt = (
        select(Sach)
        .options(
            selectinload(Sach.inventory),
            selectinload(Sach.categories),
            selectinload(Sach.authors),
            selectinload(Sach.publisher),
        )
        .where(Sach.ma_sach == book_id)
    )
    book = db.execute(stmt).scalar_one_or_none()
    if book is None:
        raise HTTPException(status_code=404, detail="Book not found")
    return book


@router.post(
    "/",
    response_model=BookRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(deps.require_admin)],
)
def create_book(payload: BookCreate, db: Session = Depends(deps.get_db)) -> BookRead:
    """Create a new book with basic inventory information."""
    slug = payload.ten_sach.strip().lower().replace(" ", "-")
    book = Sach(
        ma_sku=payload.ma_sku,
        ten_sach=payload.ten_sach,
        duong_dan_slug=slug,
        mo_ta=payload.mo_ta,
        gia_ban=payload.gia_ban,
        gia_bia=payload.gia_bia,
        trang_thai=payload.trang_thai,
        anh_bia=payload.anh_bia,
        ngon_ngu=_resolve_language_label(payload.ngon_ngu) or LANGUAGE_LABELS["vi"],
    )
    db.add(book)
    db.flush()

    if payload.publisher_name:
        publisher = (
            db.execute(select(NhaXuatBan).where(NhaXuatBan.ten_nxb == payload.publisher_name))
            .scalar_one_or_none()
        )
        if publisher is None:
            publisher = NhaXuatBan(ten_nxb=payload.publisher_name)
            db.add(publisher)
            db.flush()
        book.ma_nxb = publisher.ma_nxb

    if payload.category_name:
        category = (
            db.execute(select(TheLoai).where(TheLoai.ten_the_loai == payload.category_name))
            .scalar_one_or_none()
        )
        if category is None:
            category = TheLoai(ten_the_loai=payload.category_name, ma_the_loai_cha=None)
            db.add(category)
            db.flush()
        db.add(SachTheLoai(ma_sach=book.ma_sach, ma_the_loai=category.ma_the_loai))

    if payload.author_name:
        author = (
            db.execute(select(TacGia).where(TacGia.ten_tac_gia == payload.author_name))
            .scalar_one_or_none()
        )
        if author is None:
            author = TacGia(ten_tac_gia=payload.author_name)
            db.add(author)
            db.flush()
        db.add(SachTacGia(ma_sach=book.ma_sach, ma_tac_gia=author.ma_tac_gia))

    inventory = KhoSach(
        ma_sach=book.ma_sach,
        so_luong_ton=payload.so_luong_ton,
        so_luong_giu_cho=0,
    )
    db.add(inventory)
    db.commit()

    return get_book(book.ma_sach, db)


@router.put(
    "/{book_id}",
    response_model=BookRead,
    dependencies=[Depends(deps.require_admin)],
)
def update_book(book_id: int, payload: BookUpdate, db: Session = Depends(deps.get_db)) -> BookRead:
    """Update basic book fields and inventory."""
    book = db.get(Sach, book_id)
    if book is None:
        raise HTTPException(status_code=404, detail="Book not found")

    if payload.ten_sach is not None:
        book.ten_sach = payload.ten_sach
        book.duong_dan_slug = payload.ten_sach.strip().lower().replace(" ", "-")
    if payload.gia_ban is not None:
        book.gia_ban = payload.gia_ban
    if payload.gia_bia is not None:
        book.gia_bia = payload.gia_bia
    if payload.mo_ta is not None:
        book.mo_ta = payload.mo_ta
    if payload.trang_thai is not None:
        book.trang_thai = payload.trang_thai
    if payload.anh_bia is not None:
        book.anh_bia = payload.anh_bia
    if payload.ngon_ngu is not None:
        book.ngon_ngu = _resolve_language_label(payload.ngon_ngu)
    if payload.publisher_name is not None:
        new_name = (payload.publisher_name or "").strip()
        if not new_name:
            book.ma_nxb = None
        else:
            if book.ma_nxb:
                publisher = db.get(NhaXuatBan, book.ma_nxb)
                if publisher is not None:
                    publisher.ten_nxb = new_name
                    db.add(publisher)
            else:
                publisher = (
                    db.execute(select(NhaXuatBan).where(NhaXuatBan.ten_nxb == new_name))
                    .scalar_one_or_none()
                )
                if publisher is None:
                    publisher = NhaXuatBan(ten_nxb=new_name)
                    db.add(publisher)
                    db.flush()
                book.ma_nxb = publisher.ma_nxb
    if payload.category_name is not None:
        db.query(SachTheLoai).filter(SachTheLoai.ma_sach == book.ma_sach).delete()
        if payload.category_name:
            category = (
                db.execute(select(TheLoai).where(TheLoai.ten_the_loai == payload.category_name))
                .scalar_one_or_none()
            )
            if category is None:
                category = TheLoai(ten_the_loai=payload.category_name, ma_the_loai_cha=None)
                db.add(category)
                db.flush()
            db.add(SachTheLoai(ma_sach=book.ma_sach, ma_the_loai=category.ma_the_loai))

    if payload.author_name is not None:
        db.query(SachTacGia).filter(SachTacGia.ma_sach == book.ma_sach).delete()
        if payload.author_name:
            author = (
                db.execute(select(TacGia).where(TacGia.ten_tac_gia == payload.author_name))
                .scalar_one_or_none()
            )
            if author is None:
                author = TacGia(ten_tac_gia=payload.author_name)
                db.add(author)
                db.flush()
            db.add(SachTacGia(ma_sach=book.ma_sach, ma_tac_gia=author.ma_tac_gia))

    if payload.so_luong_ton is not None:
        inventory = db.get(KhoSach, book.ma_sach)
        if inventory is None:
            inventory = KhoSach(
                ma_sach=book.ma_sach,
                so_luong_ton=payload.so_luong_ton,
                so_luong_giu_cho=0,
            )
            db.add(inventory)
        else:
            inventory.so_luong_ton = payload.so_luong_ton

    db.commit()
    return get_book(book_id, db)


@router.post(
    "/{book_id}/reviews",
    response_model=ReviewRead,
    status_code=status.HTTP_201_CREATED,
)
def create_or_update_review(
    book_id: int,
    payload: ReviewCreate,
    db: Session = Depends(deps.get_db),
    current_user=Depends(deps.get_current_active_user),
) -> ReviewRead:
    """Create or update a review for a book by the current user.

    Each user can have at most one review per book. Submitting again will update
    the existing review.
    """
    book = db.get(Sach, book_id)
    if book is None or book.trang_thai != "active":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found")

    existing = (
        db.execute(
            select(DanhGia).where(
                DanhGia.ma_sach == book_id,
                DanhGia.ma_nguoi_dung == current_user.ma_nguoi_dung,
            )
        )
        .scalar_one_or_none()
    )

    if existing is None:
        review = DanhGia(
            ma_sach=book_id,
            ma_nguoi_dung=current_user.ma_nguoi_dung,
            diem_danh_gia=payload.diem_danh_gia,
            tieu_de=payload.tieu_de,
            noi_dung=payload.noi_dung,
            duyet_hien_thi=True,
        )
        db.add(review)
    else:
        existing.diem_danh_gia = payload.diem_danh_gia
        existing.tieu_de = payload.tieu_de
        existing.noi_dung = payload.noi_dung
        existing.duyet_hien_thi = True
        review = existing
        db.add(review)

    db.commit()
    db.refresh(review)

    return ReviewRead(
        ma_danh_gia=review.ma_danh_gia,
        ma_sach=review.ma_sach,
        diem_danh_gia=review.diem_danh_gia,
        tieu_de=review.tieu_de,
        noi_dung=review.noi_dung,
        ngay_tao=review.ngay_tao,
        author_name=review.author.ho_ten if review.author else "",
    )


@router.get(
    "/{book_id}/reviews",
    response_model=list[ReviewRead],
)
def list_reviews(
    book_id: int,
    db: Session = Depends(deps.get_db),
) -> list[ReviewRead]:
    """List all approved reviews of a book."""
    stmt = (
        select(DanhGia)
        .where(DanhGia.ma_sach == book_id, DanhGia.duyet_hien_thi.is_(True))
        .order_by(DanhGia.ngay_tao.desc())
    )
    rows = db.execute(stmt).scalars().all()
    return [
        ReviewRead(
            ma_danh_gia=r.ma_danh_gia,
            ma_sach=r.ma_sach,
            diem_danh_gia=r.diem_danh_gia,
            tieu_de=r.tieu_de,
            noi_dung=r.noi_dung,
            ngay_tao=r.ngay_tao,
            author_name=r.author.ho_ten if r.author else "",
        )
        for r in rows
    ]


@router.delete(
    "/{book_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(deps.require_admin)],
)
def delete_book(book_id: int, db: Session = Depends(deps.get_db)) -> None:
    """Soft delete a book by marking it inactive."""
    book = db.get(Sach, book_id)
    if book is None:
        raise HTTPException(status_code=404, detail="Book not found")

    book.trang_thai = "inactive"
    db.commit()
