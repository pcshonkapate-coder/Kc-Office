from typing import List, Optional, Any, Dict
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.models.system import ActivityEvent

class ActivityService:
    def __init__(self, db: Session):
        self.db = db

    def log_activity(
        self,
        entity_type: str,
        entity_id: str,
        event_type: str,
        description: str,
        user_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> ActivityEvent:
        event = ActivityEvent(
            entity_type=entity_type.lower(),
            entity_id=str(entity_id),
            event_type=event_type,
            description=description,
            user_id=user_id,
            metadata_json=metadata
        )
        self.db.add(event)
        self.db.commit()
        self.db.refresh(event)
        return event

    def get_timeline(
        self,
        entity_type: str,
        entity_id: str,
        limit: int = 50,
        offset: int = 0
    ) -> List[ActivityEvent]:
        return (
            self.db.query(ActivityEvent)
            .filter(
                ActivityEvent.entity_type == entity_type.lower(),
                ActivityEvent.entity_id == str(entity_id)
            )
            .order_by(desc(ActivityEvent.created_at))
            .offset(offset)
            .limit(limit)
            .all()
        )
