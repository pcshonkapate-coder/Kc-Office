from datetime import datetime, timezone
import os
from typing import List, Optional
import uuid
from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    Query,
    UploadFile,
    status,
)
from fastapi.responses import FileResponse
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.api.dependencies.auth import (
    AuthenticatedUserContext,
    get_current_user_context,
    require_permissions,
)
from src.core.database import get_db_session
from src.models.documents import (
    Document,
    DocumentVersion,
    Folder,
    KnowledgeArticle,
)
from src.models.identity import User
from src.schemas.documents import (
    DocumentRead,
    DocumentVersionRead,
    FolderCreate,
    FolderRead,
    KnowledgeArticleCreate,
    KnowledgeArticleRead,
)
from src.services.storage import storage_service

router = APIRouter(prefix="/documents", tags=["Knowledge & Documents"])


# -------------------------------------------------------------
# FOLDERS
# -------------------------------------------------------------
@router.get("/folders", response_model=List[FolderRead])
async def list_folders(
    context: AuthenticatedUserContext = Depends(require_permissions("document.read")),
    db: AsyncSession = Depends(get_db_session),
):
    stmt = (
        select(Folder)
        .where(Folder.organization_id == context.user.organization_id)
        .order_by(Folder.name)
    )
    result = await db.execute(stmt)
    return result.scalars().all()


@router.post("/folders", response_model=FolderRead, status_code=status.HTTP_201_CREATED)
async def create_folder(
    payload: FolderCreate,
    context: AuthenticatedUserContext = Depends(require_permissions("document.upload")),
    db: AsyncSession = Depends(get_db_session),
):
    f = Folder(
        organization_id=context.user.organization_id,
        name=payload.name,
        parent_id=payload.parent_id,
    )
    db.add(f)
    await db.commit()
    await db.refresh(f)
    return f


# -------------------------------------------------------------
# DOCUMENTS & VERSIONING
# -------------------------------------------------------------
@router.get("", response_model=List[DocumentRead])
async def list_documents(
    folder_id: Optional[uuid.UUID] = None,
    context: AuthenticatedUserContext = Depends(require_permissions("document.read")),
    db: AsyncSession = Depends(get_db_session),
):
    stmt = (
        select(Document, User.full_name.label("owner_name"))
        .join(User, Document.owner_id == User.id)
        .options(selectinload(Document.versions))
        .where(
            Document.organization_id == context.user.organization_id,
            Document.deleted_at.is_(None),
        )
    )
    if folder_id:
        stmt = stmt.where(Document.folder_id == folder_id)

    stmt = stmt.order_by(desc(Document.created_at))
    rows = (await db.execute(stmt)).all()

    response: List[DocumentRead] = []
    for doc, owner_name in rows:
        latest_ver = doc.versions[0] if doc.versions else None
        response.append(
            DocumentRead(
                id=doc.id,
                organization_id=doc.organization_id,
                folder_id=doc.folder_id,
                owner_id=doc.owner_id,
                title=doc.title,
                tags=doc.tags,
                current_version_number=doc.current_version_number,
                created_at=doc.created_at,
                owner_name=owner_name,
                latest_file_name=latest_ver.file_name if latest_ver else None,
                latest_file_size=latest_ver.file_size_bytes if latest_ver else None,
                latest_mime_type=latest_ver.mime_type if latest_ver else None,
            )
        )
    return response


@router.post("/upload", response_model=DocumentRead, status_code=status.HTTP_201_CREATED)
async def upload_document(
    title: str = Form(...),
    folder_id: Optional[uuid.UUID] = Form(None),
    tags: str = Form(""),
    file: UploadFile = File(...),
    context: AuthenticatedUserContext = Depends(require_permissions("document.upload")),
    db: AsyncSession = Depends(get_db_session),
):
    doc_id = uuid.uuid4()
    tag_list = [t.strip() for t in tags.split(",") if t.strip()]

    # 1. Save file to disk with SHA-256 calculation
    storage_path, file_size, sha256_hash = await storage_service.save_file(
        org_id=context.user.organization_id,
        doc_id=doc_id,
        version_num=1,
        filename=file.filename or "uploaded_document",
        file_stream=file.file,
    )

    # 2. Record Document and DocumentVersion 1
    doc = Document(
        id=doc_id,
        organization_id=context.user.organization_id,
        folder_id=folder_id,
        owner_id=context.user.id,
        title=title,
        tags=tag_list,
        current_version_number=1,
    )
    db.add(doc)
    await db.flush()

    ver = DocumentVersion(
        document_id=doc.id,
        version_number=1,
        storage_path=storage_path,
        file_name=file.filename or "uploaded_document",
        file_size_bytes=file_size,
        mime_type=file.content_type or "application/octet-stream",
        sha256_hash=sha256_hash,
        changelog="Initial document upload",
        uploaded_by=context.user.id,
    )
    db.add(ver)
    await db.commit()
    await db.refresh(doc)

    return DocumentRead(
        id=doc.id,
        organization_id=doc.organization_id,
        folder_id=doc.folder_id,
        owner_id=doc.owner_id,
        title=doc.title,
        tags=doc.tags,
        current_version_number=1,
        created_at=doc.created_at,
        owner_name=context.user.full_name,
        latest_file_name=ver.file_name,
        latest_file_size=ver.file_size_bytes,
        latest_mime_type=ver.mime_type,
    )


@router.post("/{document_id}/new-version", response_model=DocumentVersionRead)
async def upload_new_version(
    document_id: uuid.UUID,
    changelog: str = Form(""),
    file: UploadFile = File(...),
    context: AuthenticatedUserContext = Depends(require_permissions("document.upload")),
    db: AsyncSession = Depends(get_db_session),
):
    stmt = select(Document).where(
        Document.id == document_id,
        Document.organization_id == context.user.organization_id,
        Document.deleted_at.is_(None),
    )
    doc = (await db.execute(stmt)).scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    new_version_num = doc.current_version_number + 1

    # Save new version file safely without overwriting previous versions
    storage_path, file_size, sha256_hash = await storage_service.save_file(
        org_id=context.user.organization_id,
        doc_id=doc.id,
        version_num=new_version_num,
        filename=file.filename or "document_update",
        file_stream=file.file,
    )

    ver = DocumentVersion(
        document_id=doc.id,
        version_number=new_version_num,
        storage_path=storage_path,
        file_name=file.filename or "document_update",
        file_size_bytes=file_size,
        mime_type=file.content_type or "application/octet-stream",
        sha256_hash=sha256_hash,
        changelog=changelog or f"Version {new_version_num} update",
        uploaded_by=context.user.id,
    )
    db.add(ver)
    doc.current_version_number = new_version_num

    await db.commit()
    await db.refresh(ver)

    return DocumentVersionRead(
        id=ver.id,
        document_id=ver.document_id,
        version_number=ver.version_number,
        file_name=ver.file_name,
        file_size_bytes=ver.file_size_bytes,
        mime_type=ver.mime_type,
        sha256_hash=ver.sha256_hash,
        changelog=ver.changelog,
        uploaded_by=ver.uploaded_by,
        created_at=ver.created_at,
        uploader_name=context.user.full_name,
    )


@router.get("/{document_id}/versions", response_model=List[DocumentVersionRead])
async def list_document_versions(
    document_id: uuid.UUID,
    context: AuthenticatedUserContext = Depends(require_permissions("document.read")),
    db: AsyncSession = Depends(get_db_session),
):
    stmt = (
        select(DocumentVersion, User.full_name.label("uploader_name"))
        .join(User, DocumentVersion.uploaded_by == User.id)
        .where(DocumentVersion.document_id == document_id)
        .order_by(desc(DocumentVersion.version_number))
    )
    rows = (await db.execute(stmt)).all()
    return [
        DocumentVersionRead(
            id=v.id,
            document_id=v.document_id,
            version_number=v.version_number,
            file_name=v.file_name,
            file_size_bytes=v.file_size_bytes,
            mime_type=v.mime_type,
            sha256_hash=v.sha256_hash,
            changelog=v.changelog,
            uploaded_by=v.uploaded_by,
            created_at=v.created_at,
            uploader_name=u_name,
        )
        for v, u_name in rows
    ]


@router.get("/{document_id}/download")
async def download_document(
    document_id: uuid.UUID,
    version: Optional[int] = None,
    context: AuthenticatedUserContext = Depends(require_permissions("document.read")),
    db: AsyncSession = Depends(get_db_session),
):
    stmt = select(Document).where(
        Document.id == document_id,
        Document.organization_id == context.user.organization_id,
        Document.deleted_at.is_(None),
    )
    doc = (await db.execute(stmt)).scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    target_ver = version or doc.current_version_number
    ver_stmt = select(DocumentVersion).where(
        DocumentVersion.document_id == doc.id,
        DocumentVersion.version_number == target_ver,
    )
    ver = (await db.execute(ver_stmt)).scalar_one_or_none()
    if not ver:
        raise HTTPException(status_code=404, detail=f"Version {target_ver} not found")

    file_path = storage_service.get_file_path(ver.storage_path)
    return FileResponse(
        path=file_path,
        filename=ver.file_name,
        media_type=ver.mime_type,
    )


# -------------------------------------------------------------
# INTERNAL KNOWLEDGE BASE (SOPS, POLICIES, GUIDES)
# -------------------------------------------------------------
@router.get("/knowledge", response_model=List[KnowledgeArticleRead])
async def list_knowledge_articles(
    category: Optional[str] = None,
    context: AuthenticatedUserContext = Depends(require_permissions("document.read")),
    db: AsyncSession = Depends(get_db_session),
):
    stmt = (
        select(KnowledgeArticle, User.full_name.label("author_name"))
        .join(User, KnowledgeArticle.author_id == User.id)
        .where(
            KnowledgeArticle.organization_id == context.user.organization_id,
            KnowledgeArticle.deleted_at.is_(None),
        )
    )
    if category:
        stmt = stmt.where(KnowledgeArticle.category == category)

    stmt = stmt.order_by(KnowledgeArticle.title)
    rows = (await db.execute(stmt)).all()

    return [
        KnowledgeArticleRead(
            id=a.id,
            organization_id=a.organization_id,
            author_id=a.author_id,
            title=a.title,
            slug=a.slug,
            category=a.category,
            content_markdown=a.content_markdown,
            is_published=a.is_published,
            version=a.version,
            created_at=a.created_at,
            author_name=u_name,
        )
        for a, u_name in rows
    ]


@router.post("/knowledge", response_model=KnowledgeArticleRead, status_code=status.HTTP_201_CREATED)
async def create_knowledge_article(
    payload: KnowledgeArticleCreate,
    context: AuthenticatedUserContext = Depends(require_permissions("document.upload")),
    db: AsyncSession = Depends(get_db_session),
):
    import re
    slug = re.sub(r"[^a-zA-Z0-9]+", "-", payload.title.lower()).strip("-")

    # Check slug collision
    existing = (
        await db.execute(
            select(KnowledgeArticle).where(
                KnowledgeArticle.organization_id == context.user.organization_id,
                KnowledgeArticle.slug == slug,
                KnowledgeArticle.deleted_at.is_(None),
            )
        )
    ).scalar_one_or_none()
    if existing:
        slug = f"{slug}-{uuid.uuid4().hex[:6]}"

    article = KnowledgeArticle(
        organization_id=context.user.organization_id,
        author_id=context.user.id,
        title=payload.title,
        slug=slug,
        category=payload.category,
        content_markdown=payload.content_markdown,
        is_published=payload.is_published,
        version=1,
    )
    db.add(article)
    await db.commit()
    await db.refresh(article)

    return KnowledgeArticleRead(
        id=article.id,
        organization_id=article.organization_id,
        author_id=article.author_id,
        title=article.title,
        slug=article.slug,
        category=article.category,
        content_markdown=article.content_markdown,
        is_published=article.is_published,
        version=article.version,
        created_at=article.created_at,
        author_name=context.user.full_name,
    )
