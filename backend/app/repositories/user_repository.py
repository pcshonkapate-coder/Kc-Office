from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import select
from app.models.auth import User, Role, Permission


class UserRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, user_id: str) -> Optional[User]:
        stmt = select(User).where(User.id == user_id)
        return self.db.scalars(stmt).first()

    def get_by_email(self, email: str) -> Optional[User]:
        stmt = select(User).where(User.email == email.lower().strip())
        return self.db.scalars(stmt).first()

    def get_roles(self, user: User) -> List[str]:
        return [r.name for r in user.roles]

    def get_permissions(self, user: User) -> List[str]:
        perms = set()
        for r in user.roles:
            for p in r.permissions:
                perms.add(p.code)
        return sorted(list(perms))

    def assign_role(self, user: User, role_name: str) -> None:
        role = self.db.scalars(select(Role).where(Role.name == role_name.lower().strip())).first()
        if role and role not in user.roles:
            user.roles.append(role)
            self.db.commit()

    def create(self, user: User) -> User:
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user
