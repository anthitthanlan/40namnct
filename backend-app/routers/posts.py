from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import re
import unicodedata
from app.database import get_db
from app.models.post import Post
from app.schemas.post import PostCreate, PostUpdate, PostResponse
from app.services.auth_service import get_current_admin

from app.services.facebook_service import sync_facebook_page_posts

router = APIRouter(prefix="/api/posts", tags=["Posts"])

@router.post("/sync-facebook")
async def sync_facebook(db: Session = Depends(get_db)):
    result = await sync_facebook_page_posts(db)
    return result

def slugify(text: str) -> str:
    text = unicodedata.normalize('NFKD', text).encode('ascii', 'ignore').decode('utf-8')
    text = re.sub(r'[^\w\s-]', '', text.lower())
    return re.sub(r'[-\s]+', '-', text).strip('-')

@router.get("", response_model=List[PostResponse])
def get_posts(
    status: Optional[str] = None,
    source: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    query = db.query(Post)
    if status:
        query = query.filter(Post.status == status)
    if source:
        query = query.filter(Post.source == source)
    
    # Sort pinned first, then created_at desc
    posts = query.order_by(Post.pinned.desc(), Post.created_at.desc()).offset(offset).limit(limit).all()
    
    # Transform to camelCase responses
    result = []
    for p in posts:
        result.append(PostResponse(
            id=p.id,
            slug=p.slug,
            title=p.title,
            excerpt=p.excerpt or "",
            content=p.content or "",
            author=p.author or "",
            authorRole=p.author_role or "",
            source=p.source,
            status=p.status,
            pinned=p.pinned,
            cover=p.cover,
            categoryId=p.category_id,
            createdAt=p.created_at,
            updatedAt=p.updated_at
        ))
    return result

@router.get("/{slug_or_id}", response_model=PostResponse)
def get_post(slug_or_id: str, db: Session = Depends(get_db)):
    post = db.query(Post).filter((Post.slug == slug_or_id) | (Post.id == slug_or_id)).first()
    if not post:
        raise HTTPException(status_code=404, detail="Bài viết không tồn tại")
    return PostResponse(
        id=post.id,
        slug=post.slug,
        title=post.title,
        excerpt=post.excerpt or "",
        content=post.content or "",
        author=post.author or "",
        authorRole=post.author_role or "",
        source=post.source,
        status=post.status,
        pinned=post.pinned,
        cover=post.cover,
        categoryId=post.category_id,
        createdAt=post.created_at,
        updatedAt=post.updated_at
    )

@router.post("", response_model=PostResponse)
def create_post(
    post_in: PostCreate,
    db: Session = Depends(get_db)
):
    base_slug = post_in.slug or slugify(post_in.title)
    slug = base_slug
    idx = 1
    while db.query(Post).filter(Post.slug == slug).first():
        slug = f"{base_slug}-{idx}"
        idx += 1

    new_post = Post(
        title=post_in.title,
        slug=slug,
        excerpt=post_in.excerpt,
        content=post_in.content,
        author=post_in.author,
        author_role=post_in.authorRole,
        source=post_in.source,
        status=post_in.status,
        pinned=post_in.pinned,
        cover=post_in.cover,
        category_id=post_in.categoryId,
    )
    db.add(new_post)
    db.commit()
    db.refresh(new_post)

    return PostResponse(
        id=new_post.id,
        slug=new_post.slug,
        title=new_post.title,
        excerpt=new_post.excerpt or "",
        content=new_post.content or "",
        author=new_post.author or "",
        authorRole=new_post.author_role or "",
        source=new_post.source,
        status=new_post.status,
        pinned=new_post.pinned,
        cover=new_post.cover,
        categoryId=new_post.category_id,
        createdAt=new_post.created_at,
        updatedAt=new_post.updated_at
    )

@router.put("/{id}", response_model=PostResponse)
def update_post(
    id: str,
    post_update: PostUpdate,
    db: Session = Depends(get_db),
    admin = Depends(get_current_admin)
):
    post = db.query(Post).filter(Post.id == id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Bài viết không tồn tại")

    update_data = post_update.model_dump(exclude_unset=True)
    if "authorRole" in update_data:
        post.author_role = update_data.pop("authorRole")
    if "categoryId" in update_data:
        post.category_id = update_data.pop("categoryId")
    
    for key, value in update_data.items():
        if hasattr(post, key) and value is not None:
            setattr(post, key, value)

    db.commit()
    db.refresh(post)

    return PostResponse(
        id=post.id,
        slug=post.slug,
        title=post.title,
        excerpt=post.excerpt or "",
        content=post.content or "",
        author=post.author or "",
        authorRole=post.author_role or "",
        source=post.source,
        status=post.status,
        pinned=post.pinned,
        cover=post.cover,
        categoryId=post.category_id,
        createdAt=post.created_at,
        updatedAt=post.updated_at
    )

@router.delete("/{id}")
def delete_post(
    id: str,
    db: Session = Depends(get_db),
    admin = Depends(get_current_admin)
):
    post = db.query(Post).filter(Post.id == id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Bài viết không tồn tại")
    db.delete(post)
    db.commit()
    return {"success": True, "message": "Đã xóa bài viết"}
