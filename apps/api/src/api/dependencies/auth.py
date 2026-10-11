import uuid
from typing import Annotated, Callable, List
from fastapi import Depends, HTTPException, Security, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
import jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.core.database import get_db_session
from src.core.redis import get_redis_client
from src.core.security import decode_token
from src.models.identity import Role, RolePermission, User, UserRole

security_scheme = HTTPBearer(auto_error=True)


class AuthenticatedUserContext:
    def __init__(
        self,
        user: User,
        token_jti: str,
        roles: List[str],
        permissions: List[str],
    ):
        self.user = user
        self.token_jti = token_jti
        self.roles = roles
        self.permissions = set(permissions)

    def has_permission(self, permission_code: str) -> bool:
        if "super_admin" in self.roles:
            return True
        return permission_code in self.permissions


async def get_current_user_context(
    credentials: Annotated[HTTPAuthorizationCredentials, Security(security_scheme)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> AuthenticatedUserContext:
    token = credentials.credentials
    try:
        payload = decode_token(token)
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "ERR_TOKEN_EXPIRED", "message": "Access token has expired"},
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "ERR_INVALID_TOKEN", "message": "Provided token is malformed or invalid"},
        )

    jti = payload.get("jti")
    user_id_str = payload.get("sub")
    if not jti or not user_id_str:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "ERR_TOKEN_MALFORMED", "message": "Token claims are missing critical identifiers"},
        )

    # Check token revocation blocklist in Redis
    redis_client = await get_redis_client()
    is_revoked = await redis_client.get(f"token:revoked:{jti}")
    if is_revoked:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "ERR_TOKEN_REVOKED", "message": "Token has been explicitly revoked"},
        )

    # Fetch User along with roles and resolved permissions
    user_uuid = uuid.UUID(user_id_str) if isinstance(user_id_str, str) else user_id_str
    stmt = (
        select(User)
        .options(
            selectinload(User.user_roles)
            .selectinload(UserRole.role)
            .selectinload(Role.role_permissions)
            .selectinload(RolePermission.permission)
        )
        .where(
            User.id == user_uuid,
            User.is_active.is_(True),
            User.deleted_at.is_(None),
        )
    )
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "ERR_USER_NOT_FOUND", "message": "User account is suspended, deleted, or does not exist"},
        )

    # Aggregate distinct roles and permissions
    role_slugs: List[str] = []
    permission_codes: set[str] = set()
    for ur in user.user_roles:
        role = ur.role
        if role and not role.deleted_at:
            role_slugs.append(role.slug)
            for rp in role.role_permissions:
                if rp.permission:
                    permission_codes.add(rp.permission.code)

    return AuthenticatedUserContext(
        user=user,
        token_jti=jti,
        roles=role_slugs,
        permissions=list(permission_codes),
    )


def require_permissions(*required_permissions: str) -> Callable:
    async def permission_checker(
        context: Annotated[AuthenticatedUserContext, Depends(get_current_user_context)]
    ) -> AuthenticatedUserContext:
        if "super_admin" in context.roles:
            return context

        missing = [p for p in required_permissions if p not in context.permissions]
        if missing:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "type": "https://api.kapateconsultancy.com/v3/errors/forbidden",
                    "title": "Access Denied",
                    "status": 403,
                    "code": "ERR_RBAC_FORBIDDEN",
                    "detail": f"Missing required permissions: {', '.join(missing)}",
                },
            )
        return context

    return permission_checker
