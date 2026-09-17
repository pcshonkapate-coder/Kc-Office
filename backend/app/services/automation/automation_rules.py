from typing import Dict, Any
from sqlalchemy.orm import Session
from datetime import date
from app.services.automation.event_bus import EventBus
from app.services.notifications.dispatcher import NotificationDispatcher
from app.models.delivery import Project
from app.core.logging import logger

dispatcher = NotificationDispatcher()

def handle_deal_won(db: Session, payload: Dict[str, Any]):
    """
    Triggered when a Deal is marked CLOSED WON.
    Optionally creates a project automatically.
    """
    deal_id = payload.get("deal_id")
    company_id = payload.get("company_id")
    deal_name = payload.get("deal_name")
    user_id = payload.get("user_id")
    auto_create_project = payload.get("auto_create_project", False)
    
    if auto_create_project:
        logger.info(f"Automation: Auto-creating Project for Won Deal {deal_id}")
        project = Project(
            company_id=company_id,
            deal_id=deal_id,
            name=f"Project: {deal_name}",
            status="PLANNING",
            start_date=date.today()
        )
        db.add(project)
        db.commit()
        db.refresh(project)
        
        # Notify the user
        dispatcher.dispatch(
            db=db,
            user_id=user_id,
            event_category="project_created",
            title="Project Automatically Created",
            message=f"Project '{project.name}' has been automatically created from your Won deal.",
            notification_type="success"
        )
    else:
        # Just notify them that the deal is won and they should create a project
        dispatcher.dispatch(
            db=db,
            user_id=user_id,
            event_category="deal_won",
            title="Deal Won! Next Steps",
            message=f"Deal '{deal_name}' was won. Remember to create a project or generate an MSA.",
            notification_type="action_required"
        )


def handle_invoice_overdue(db: Session, payload: Dict[str, Any]):
    """
    Triggered by a cron script when an invoice crosses its due date.
    """
    invoice_id = payload.get("invoice_id")
    invoice_number = payload.get("invoice_number")
    user_id = payload.get("finance_user_id") # Usually a finance admin
    
    dispatcher.dispatch(
        db=db,
        user_id=user_id,
        event_category="invoice_overdue",
        title="Invoice Overdue",
        message=f"Invoice #{invoice_number} is now overdue. Please follow up with the client.",
        notification_type="warning"
    )

def handle_task_assigned(db: Session, payload: Dict[str, Any]):
    task_id = payload.get("task_id")
    assignee_id = payload.get("assignee_id")
    task_title = payload.get("task_title")
    
    dispatcher.dispatch(
        db=db,
        user_id=assignee_id,
        event_category="task_assigned",
        title="New Task Assigned",
        message=f"You have been assigned to task: {task_title}.",
        notification_type="info"
    )

def handle_lead_assigned(db: Session, payload: Dict[str, Any]):
    assignee_id = payload.get("assignee_id")
    lead_name = payload.get("lead_name")
    
    dispatcher.dispatch(
        db=db,
        user_id=assignee_id,
        event_category="lead_assigned",
        title="New Lead Assigned",
        message=f"You have been assigned a new lead: {lead_name}. Please qualify them.",
        notification_type="action_required"
    )


# Register rules to EventBus
EventBus.subscribe("DEAL_WON", handle_deal_won)
EventBus.subscribe("INVOICE_OVERDUE", handle_invoice_overdue)
EventBus.subscribe("TASK_ASSIGNED", handle_task_assigned)
EventBus.subscribe("LEAD_ASSIGNED", handle_lead_assigned)
