from typing import Callable, Dict, List, Any
from sqlalchemy.orm import Session
from app.core.logging import logger

class EventBus:
    """
    A lightweight, synchronous in-memory event bus.
    In a larger microservice architecture, this would be replaced with Redis/RabbitMQ.
    """
    _subscribers: Dict[str, List[Callable]] = {}

    @classmethod
    def subscribe(cls, event_type: str, handler: Callable):
        if event_type not in cls._subscribers:
            cls._subscribers[event_type] = []
        cls._subscribers[event_type].append(handler)
        logger.info(f"Subscribed handler to event: {event_type}")

    @classmethod
    def emit(cls, db: Session, event_type: str, payload: Dict[str, Any]):
        """
        Emit an event. Handlers are executed synchronously for now.
        """
        logger.info(f"Emitting event: {event_type} | Payload: {payload}")
        if event_type in cls._subscribers:
            for handler in cls._subscribers[event_type]:
                try:
                    handler(db, payload)
                except Exception as e:
                    logger.error(f"Error executing handler for {event_type}: {e}")
