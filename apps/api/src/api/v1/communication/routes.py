from datetime import datetime, timezone
from typing import Dict, List, Optional
import uuid
from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    WebSocket,
    WebSocketDisconnect,
    status,
)
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.api.dependencies.auth import (
    AuthenticatedUserContext,
    get_current_user_context,
)
from src.core.database import get_db_session
from src.models.communication import Channel, ChannelMember, Message, Notification
from src.models.identity import User
from src.schemas.communication import (
    ChannelCreate,
    ChannelRead,
    MessageCreate,
    MessageRead,
    NotificationRead,
)

router = APIRouter(prefix="/communication", tags=["Communication & Notifications"])


# -------------------------------------------------------------
# WEBSOCKET REAL-TIME CONNECTION MANAGER
# -------------------------------------------------------------
class ConnectionManager:
    def __init__(self):
        self.active_channels: Dict[str, List[WebSocket]] = {}

    async def connect(self, channel_id: str, websocket: WebSocket):
        await websocket.accept()
        if channel_id not in self.active_channels:
            self.active_channels[channel_id] = []
        self.active_channels[channel_id].append(websocket)

    def disconnect(self, channel_id: str, websocket: WebSocket):
        if channel_id in self.active_channels:
            if websocket in self.active_channels[channel_id]:
                self.active_channels[channel_id].remove(websocket)
            if not self.active_channels[channel_id]:
                del self.active_channels[channel_id]

    async def broadcast_to_channel(self, channel_id: str, message_data: dict):
        if channel_id in self.active_channels:
            for connection in self.active_channels[channel_id]:
                try:
                    await connection.send_json(message_data)
                except Exception:
                    pass


ws_manager = ConnectionManager()


@router.websocket("/ws/{channel_id}")
async def websocket_chat_endpoint(websocket: WebSocket, channel_id: str):
    await ws_manager.connect(channel_id, websocket)
    try:
        while True:
            data = await websocket.receive_json()
            # Broadcast message to all active channel peers
            await ws_manager.broadcast_to_channel(channel_id, data)
    except WebSocketDisconnect:
        ws_manager.disconnect(channel_id, websocket)


# -------------------------------------------------------------
# CHANNELS & MESSAGES
# -------------------------------------------------------------
@router.get("/channels", response_model=List[ChannelRead])
async def list_channels(
    context: AuthenticatedUserContext = Depends(get_current_user_context),
    db: AsyncSession = Depends(get_db_session),
):
    stmt = (
        select(Channel)
        .where(Channel.organization_id == context.user.organization_id)
        .order_by(Channel.name)
    )
    result = await db.execute(stmt)
    return result.scalars().all()


@router.post("/channels", response_model=ChannelRead, status_code=status.HTTP_201_CREATED)
async def create_channel(
    payload: ChannelCreate,
    context: AuthenticatedUserContext = Depends(get_current_user_context),
    db: AsyncSession = Depends(get_db_session),
):
    channel = Channel(
        organization_id=context.user.organization_id,
        project_id=payload.project_id,
        name=payload.name,
        channel_type=payload.channel_type,
        is_private=payload.is_private,
        created_by=context.user.id,
    )
    db.add(channel)
    await db.flush()

    # Add creator as member
    member = ChannelMember(channel_id=channel.id, user_id=context.user.id)
    db.add(member)

    await db.commit()
    await db.refresh(channel)
    return channel


@router.get("/channels/{channel_id}/messages", response_model=List[MessageRead])
async def list_channel_messages(
    channel_id: uuid.UUID,
    limit: int = Query(50, ge=1, le=100),
    context: AuthenticatedUserContext = Depends(get_current_user_context),
    db: AsyncSession = Depends(get_db_session),
):
    stmt = (
        select(Message, User.full_name.label("sender_name"))
        .join(User, Message.sender_id == User.id)
        .where(Message.channel_id == channel_id)
        .order_by(Message.created_at.asc())
        .limit(limit)
    )
    rows = (await db.execute(stmt)).all()

    return [
        MessageRead(
            id=m.id,
            channel_id=m.channel_id,
            sender_id=m.sender_id,
            content=m.content,
            attachments=m.attachments,
            mentions=m.mentions,
            created_at=m.created_at,
            sender_name=s_name,
        )
        for m, s_name in rows
    ]


@router.post("/messages", response_model=MessageRead, status_code=status.HTTP_201_CREATED)
async def post_message(
    payload: MessageCreate,
    context: AuthenticatedUserContext = Depends(get_current_user_context),
    db: AsyncSession = Depends(get_db_session),
):
    msg = Message(
        channel_id=payload.channel_id,
        sender_id=context.user.id,
        content=payload.content,
        attachments=payload.attachments,
        mentions=payload.mentions,
    )
    db.add(msg)
    await db.commit()
    await db.refresh(msg)

    message_response = {
        "id": str(msg.id),
        "channel_id": str(msg.channel_id),
        "sender_id": str(msg.sender_id),
        "content": msg.content,
        "attachments": msg.attachments,
        "mentions": msg.mentions,
        "created_at": msg.created_at.isoformat(),
        "sender_name": context.user.full_name,
    }

    # Broadcast via WebSocket
    await ws_manager.broadcast_to_channel(str(msg.channel_id), message_response)

    return MessageRead(
        id=msg.id,
        channel_id=msg.channel_id,
        sender_id=msg.sender_id,
        content=msg.content,
        attachments=msg.attachments,
        mentions=msg.mentions,
        created_at=msg.created_at,
        sender_name=context.user.full_name,
    )


# -------------------------------------------------------------
# GLOBAL IN-APP NOTIFICATIONS
# -------------------------------------------------------------
@router.get("/notifications", response_model=List[NotificationRead])
async def list_my_notifications(
    context: AuthenticatedUserContext = Depends(get_current_user_context),
    db: AsyncSession = Depends(get_db_session),
):
    stmt = (
        select(Notification)
        .where(
            Notification.recipient_id == context.user.id,
            Notification.organization_id == context.user.organization_id,
        )
        .order_by(desc(Notification.created_at))
        .limit(30)
    )
    result = await db.execute(stmt)
    return result.scalars().all()


@router.patch("/notifications/{notification_id}/read")
async def mark_notification_read(
    notification_id: uuid.UUID,
    context: AuthenticatedUserContext = Depends(get_current_user_context),
    db: AsyncSession = Depends(get_db_session),
):
    stmt = select(Notification).where(
        Notification.id == notification_id,
        Notification.recipient_id == context.user.id,
    )
    notif = (await db.execute(stmt)).scalar_one_or_none()
    if notif:
        notif.is_read = True
        await db.commit()
    return {"status": "ok"}
