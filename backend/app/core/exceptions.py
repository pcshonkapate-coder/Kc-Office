from typing import Any, Dict, Optional
from fastapi import HTTPException, status


class KapateAppException(HTTPException):
    def __init__(
        self,
        status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
        code: str = "INTERNAL_ERROR",
        message: str = "An unexpected error occurred",
        details: Optional[Any] = None,
    ):
        super().__init__(
            status_code=status_code,
            detail={
                "code": code,
                "message": message,
                "details": details or [],
            },
        )


class EntityNotFoundException(KapateAppException):
    def __init__(self, entity_name: str, identifier: Any):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            code="ENTITY_NOT_FOUND",
            message=f"{entity_name} with identifier '{identifier}' was not found.",
        )


class UnauthorizedException(KapateAppException):
    def __init__(self, message: str = "Invalid credentials or expired session."):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            code="UNAUTHORIZED",
            message=message,
        )


class PermissionDeniedException(KapateAppException):
    def __init__(self, required_permission: str):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            code="PERMISSION_DENIED",
            message=f"You do not possess the required permission: '{required_permission}'.",
        )


class BadRequestException(KapateAppException):
    def __init__(self, message: str = "Invalid request payload or operation."):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            code="BAD_REQUEST",
            message=message,
        )


class NotFoundException(KapateAppException):
    def __init__(self, message: str = "Resource not found."):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            code="NOT_FOUND",
            message=message,
        )

