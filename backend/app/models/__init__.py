from app.db.base import Base
from app.models.base import TimestampMixin, SoftDeleteMixin
from app.models.auth import User, Role, Permission, UserRole, RolePermission
from app.models.otp import OTPToken
from app.models.crm import (
    Company, Contact, Lead, Deal, Activity, Meeting, Proposal, Contract,
    Service, DealContact, DealStageHistory, FollowUpReminder
)
from app.models.workforce import Department, PersonProfile, Employee, Intern, Freelancer, Attendance, LeaveRequest, Timesheet, PerformanceReview
from app.models.delivery import Project, Milestone, Task, Subtask, DeliveryComment, ResourceAllocation
from app.models.finance import Expense, Invoice, InvoiceItem, Payment
from app.models.system import Document, Notification, AuditLog, NotificationPreference, ActivityEvent
from app.models.document import ManagedDocument, DocumentVersion, SignatureTracker
from app.models.ai import AIAuditLog, AIDraft
from app.models.identity import RegistrationRequest, OnboardingInvitation, KapateIdSequence

__all__ = [
    "Base",
    "TimestampMixin",
    "SoftDeleteMixin",
    "User",
    "OTPToken",
    "Role",
    "Permission",
    "UserRole",
    "RolePermission",
    "Service",
    "Company",
    "Contact",
    "Lead",
    "Deal",
    "DealContact",
    "DealStageHistory",
    "FollowUpReminder",
    "Activity",
    "Meeting",
    "Proposal",
    "Contract",
    "Department",
    "PersonProfile",
    "Employee",
    "Intern",
    "Freelancer",
    "Attendance",
    "LeaveRequest",
    "Timesheet",
    "PerformanceReview",
    "Project",
    "Milestone",
    "Task",
    "Subtask",
    "DeliveryComment",
    "ResourceAllocation",
    "Expense",
    "Invoice",
    "InvoiceItem",
    "Payment",
    "Document",
    "Notification",
    "NotificationPreference",
    "AuditLog",
    "ActivityEvent",
    "ManagedDocument",
    "DocumentVersion",
    "SignatureTracker",
    "AIAuditLog",
    "AIDraft",
    "RegistrationRequest",
    "OnboardingInvitation",
    "KapateIdSequence",
]
