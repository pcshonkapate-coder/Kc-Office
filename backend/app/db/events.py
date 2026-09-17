import json
from sqlalchemy import event
from sqlalchemy.orm import Session
from app.models.system import AuditLog

_current_user_id = None

def set_current_user_id(user_id: str):
    global _current_user_id
    _current_user_id = user_id

def log_event(mapper, connection, target, action):
    if not hasattr(target, "__tablename__") or target.__tablename__ in ("audit_logs", "activity_events"):
        return

    entity_name = target.__tablename__
    entity_id = str(getattr(target, "id", ""))
    
    old_values = {}
    new_values = {}
    
    import uuid
    import datetime
    
    connection.execute(
        AuditLog.__table__.insert().values(
            id=str(uuid.uuid4()),
            action=action,
            entity_name=entity_name,
            entity_id=entity_id,
            old_values=old_values if action != 'CREATE' else None,
            new_values=new_values if action != 'DELETE' else None,
            user_id=_current_user_id,
            created_at=datetime.datetime.now(datetime.timezone.utc),
            updated_at=datetime.datetime.now(datetime.timezone.utc)
        )
    )

def configure_audit_logging():
    from app.db.base import Base
    for mapper in Base.registry.mappers:
        event.listen(mapper.class_, 'after_insert', lambda m, c, t: log_event(m, c, t, 'CREATE'))
        event.listen(mapper.class_, 'after_update', lambda m, c, t: log_event(m, c, t, 'UPDATE'))
        event.listen(mapper.class_, 'after_delete', lambda m, c, t: log_event(m, c, t, 'DELETE'))
