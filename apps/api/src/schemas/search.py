from typing import List, Optional
import uuid
from pydantic import BaseModel


class SearchResultItem(BaseModel):
    id: uuid.UUID
    entity_type: str  # "ACCOUNT", "LEAD", "DEAL", "EMPLOYEE", "CONTRACT"
    title: str
    subtitle: Optional[str] = None
    url: str
    metadata: Optional[dict] = None


class GlobalSearchResponse(BaseModel):
    query: str
    total_matches: int
    results: List[SearchResultItem]
