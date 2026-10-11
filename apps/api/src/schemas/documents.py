from datetime import datetime
from typing import List, Optional
import uuid
from pydantic import BaseModel, ConfigDict, Field


class FolderCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=128)
    parent_id: Optional[uuid.UUID] = None


class FolderRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    organization_id: uuid.UUID
    name: str
    parent_id: Optional[uuid.UUID] = None
    created_at: datetime


class DocumentVersionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    document_id: uuid.UUID
    version_number: int
    file_name: str
    file_size_bytes: int
    mime_type: str
    sha256_hash: str
    changelog: Optional[str] = None
    uploaded_by: uuid.UUID
    created_at: datetime
    uploader_name: Optional[str] = None


class DocumentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    organization_id: uuid.UUID
    folder_id: Optional[uuid.UUID] = None
    owner_id: uuid.UUID
    title: str
    tags: List[str]
    current_version_number: int
    created_at: datetime
    owner_name: Optional[str] = None
    latest_file_name: Optional[str] = None
    latest_file_size: Optional[int] = None
    latest_mime_type: Optional[str] = None


class KnowledgeArticleCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=255)
    category: str = Field("SOP", examples=["SOP", "POLICY", "GUIDE", "ARCHITECTURE"])
    content_markdown: str = Field(..., min_length=10)
    is_published: bool = True


class KnowledgeArticleRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    organization_id: uuid.UUID
    author_id: uuid.UUID
    title: str
    slug: str
    category: str
    content_markdown: str
    is_published: bool
    version: int
    created_at: datetime
    author_name: Optional[str] = None
