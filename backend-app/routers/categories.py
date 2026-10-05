from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.category import Category
from app.schemas.category import CategoryCreate, CategoryUpdate, CategoryResponse
from app.services.auth_service import get_current_admin
import re
import unicodedata

router = APIRouter(prefix="/api/categories", tags=["Categories"])

def slugify(text: str) -> str:
    text = unicodedata.normalize('NFKD', text).encode('ascii', 'ignore').decode('utf-8')
    text = re.sub(r'[^\w\s-]', '', text).strip().lower()
    text = re.sub(r'[-\s]+', '-', text)
    return text

@router.get("", response_model=List[CategoryResponse])
def get_categories(db: Session = Depends(get_db)):
    categories = db.query(Category).order_by(Category.order.asc()).all()
    return [
        CategoryResponse(
            id=c.id,
            slug=c.slug,
            name=c.name,
            description=c.description,
            order=c.order,
            createdAt=c.created_at,
            updatedAt=c.updated_at
        ) for c in categories
    ]

@router.get("/{id_or_slug}", response_model=CategoryResponse)
def get_category(id_or_slug: str, db: Session = Depends(get_db)):
    c = db.query(Category).filter((Category.id == id_or_slug) | (Category.slug == id_or_slug)).first()
    if not c:
        raise HTTPException(status_code=404, detail="Category not found")
    return CategoryResponse(
        id=c.id,
        slug=c.slug,
        name=c.name,
        description=c.description,
        order=c.order,
        createdAt=c.created_at,
        updatedAt=c.updated_at
    )

@router.post("", response_model=CategoryResponse)
def create_category(cat_in: CategoryCreate, db: Session = Depends(get_db), admin = Depends(get_current_admin)):
    slug = slugify(cat_in.name) or "danh-muc"
    existing = db.query(Category).filter(Category.slug == slug).first()
    if existing:
        slug = f"{slug}-{len(slug)}"
    
    new_cat = Category(
        slug=slug,
        name=cat_in.name,
        description=cat_in.description,
        order=cat_in.order
    )
    db.add(new_cat)
    db.commit()
    db.refresh(new_cat)
    
    return CategoryResponse(
        id=new_cat.id,
        slug=new_cat.slug,
        name=new_cat.name,
        description=new_cat.description,
        order=new_cat.order,
        createdAt=new_cat.created_at,
        updatedAt=new_cat.updated_at
    )

@router.put("/{id}", response_model=CategoryResponse)
def update_category(id: str, cat_in: CategoryUpdate, db: Session = Depends(get_db), admin = Depends(get_current_admin)):
    c = db.query(Category).filter(Category.id == id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Category not found")

    changes = cat_in.model_dump(exclude_unset=True)
    if "name" in changes:
        c.name = changes["name"]
        new_slug = slugify(c.name) or "danh-muc"
        existing = db.query(Category).filter(Category.slug == new_slug, Category.id != id).first()
        if existing:
            new_slug = f"{new_slug}-{id[:4]}"
        c.slug = new_slug
    if "description" in changes:
        c.description = changes["description"]
    if "order" in changes:
        c.order = changes["order"]

    db.commit()
    db.refresh(c)
    
    return CategoryResponse(
        id=c.id,
        slug=c.slug,
        name=c.name,
        description=c.description,
        order=c.order,
        createdAt=c.created_at,
        updatedAt=c.updated_at
    )

@router.delete("/{id}")
def delete_category(id: str, db: Session = Depends(get_db), admin = Depends(get_current_admin)):
    c = db.query(Category).filter(Category.id == id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Category not found")
    
    db.delete(c)
    db.commit()
    return {"success": True}
