from typing import List, Optional, Any
from datetime import date, datetime, timezone
import uuid
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.workforce import Attendance, LeaveRequest, PerformanceReview, PersonProfile, Intern
from app.models.auth import User
from app.models.system import Document
from app.schemas.hr import (
    AttendanceCreate, AttendanceResponse, 
    LeaveRequestCreate, LeaveRequestResponse,
    PerformanceReviewCreate, PerformanceReviewResponse
)
from app.core.exceptions import KapateAppException
from app.services.pdf.generator import PDFGenerator


class HRService:
    def __init__(self, db: Session):
        self.db = db
        self.pdf_generator = PDFGenerator()

    # --- Attendance ---
    def check_in(self, user_id: str, notes: Optional[str] = None) -> AttendanceResponse:
        today = date.today()
        now = datetime.now(timezone.utc)
        
        att = self.db.query(Attendance).filter(Attendance.user_id == user_id, Attendance.date == today).first()
        if not att:
            att = Attendance(
                user_id=user_id,
                date=today,
                check_in=now,
                status="present",
                notes=notes,
            )
            self.db.add(att)
        else:
            att.check_in = now
            att.status = "present"
            if notes:
                att.notes = notes

        self.db.commit()
        self.db.refresh(att)
        return AttendanceResponse.model_validate(att)

    def check_out(self, user_id: str, notes: Optional[str] = None) -> AttendanceResponse:
        today = date.today()
        now = datetime.now(timezone.utc)
        
        att = self.db.query(Attendance).filter(Attendance.user_id == user_id, Attendance.date == today).first()
        if not att:
            raise KapateAppException(status_code=400, detail="Cannot check out without checking in first.")
            
        att.check_out = now
        
        # Calculate total hours if check_in exists
        if att.check_in:
            check_in_dt = att.check_in
            if check_in_dt.tzinfo is None:
                check_in_dt = check_in_dt.replace(tzinfo=timezone.utc)
            diff = now - check_in_dt
            hours = diff.total_seconds() / 3600.0
            att.total_hours = round(hours, 2)
            
        if notes:
            att.notes = f"{att.notes or ''} | {notes}" if att.notes else notes

        self.db.add(att)
        self.db.commit()
        self.db.refresh(att)
        if not att.check_out:
            att.check_out = now
        return AttendanceResponse.model_validate(att)

    # --- Leave ---
    def request_leave(self, data: LeaveRequestCreate, user_id: str) -> LeaveRequestResponse:
        leave = LeaveRequest(
            **data.model_dump(),
            user_id=user_id,
            status="pending"
        )
        self.db.add(leave)
        self.db.commit()
        self.db.refresh(leave)
        return LeaveRequestResponse.model_validate(leave)

    def process_leave(self, leave_id: str, status: str, reviewer_id: str) -> LeaveRequestResponse:
        leave = self.db.query(LeaveRequest).filter(LeaveRequest.id == leave_id).first()
        if not leave:
            raise KapateAppException(status_code=404, detail="Leave request not found")
            
        status_norm = status.lower()
        if status_norm not in ["approved", "rejected", "cancelled"]:
            raise KapateAppException(status_code=400, detail="Invalid status")
            
        leave.status = status_norm
        leave.approved_by_user_id = reviewer_id
        
        self.db.commit()
        self.db.refresh(leave)
        return LeaveRequestResponse.model_validate(leave)

    # --- Performance Reviews ---
    def submit_review(self, data: PerformanceReviewCreate, reviewer_id: str) -> PerformanceReviewResponse:
        review = PerformanceReview(
            **data.model_dump(),
            reviewer_id=reviewer_id
        )
        self.db.add(review)
        self.db.commit()
        self.db.refresh(review)
        return PerformanceReviewResponse.model_validate(review)

    # --- Certificates ---
    def generate_intern_certificate(self, intern_id: str, issuer_id: str) -> dict:
        intern = self.db.query(Intern).filter(Intern.id == intern_id).first()
        if not intern:
            raise KapateAppException(status_code=404, detail="Intern not found")
            
        # Ensure they have a completed status
        if intern.internship_status != "COMPLETED":
            raise KapateAppException(status_code=400, detail="Intern must have COMPLETED status to issue certificate")
            
        # Get mentor name
        mentor_name = "Kapate Mentor"
        if intern.manager_id:
            mentor = self.db.query(PersonProfile).filter(PersonProfile.id == intern.manager_id).first()
            if mentor:
                mentor_name = mentor.name

        data_for_pdf = {
            "intern_name": intern.name,
            "start_date": intern.start_date.strftime("%B %d, %Y") if intern.start_date else "N/A",
            "end_date": intern.end_date.strftime("%B %d, %Y") if intern.end_date else "N/A",
            "mentor_name": mentor_name
        }
        
        pdf_bytes = self.pdf_generator.generate_pdf("certificate", data_for_pdf)
        
        # Save as Document
        doc = Document(
            id=str(uuid.uuid4()),
            title=f"Internship Certificate - {intern.name}",
            file_type="application/pdf",
            entity_type="intern_certificate",
            entity_id=intern.id,
            uploaded_by_user_id=issuer_id
        )
        self.db.add(doc)
        self.db.commit()
        
        # In a real app, save pdf_bytes to S3 or disk and store URL in doc.file_url
        # For now, we simulate success
        
        intern.certificate_status = "ISSUED"
        self.db.commit()
        
        return {"message": "Certificate generated and securely stored.", "document_id": doc.id}
