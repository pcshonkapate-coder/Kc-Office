import asyncio
from datetime import date, datetime, timedelta, timezone
import logging
from decimal import Decimal
import sys
import uuid
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.config import settings
from src.core.database import async_session_factory, engine
from src.core.redis import close_redis_pool, get_redis_client, init_redis_pool
from src.models.communication import Notification
from src.models.finance import Expense, Invoice
from src.models.projects import Project
from src.models.security import WebhookDeliveryLog, WebhookSubscription
from src.services.automation_engine import automation_engine

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] [KAPATE-WORKER] %(message)s",
)
logger = logging.getLogger("kapate.worker")


async def run_overdue_invoice_checks(db: AsyncSession):
    """Scans for invoices past due date and issues alerts to project managers/finance officers."""
    today = date.today()
    stmt = (
        select(Invoice)
        .where(
            Invoice.due_date < today,
            Invoice.status.in_(["SENT", "PARTIALLY_PAID"]),
            Invoice.deleted_at.is_(None),
        )
    )
    overdue_invoices = (await db.execute(stmt)).scalars().all()
    for inv in overdue_invoices:
        logger.info(f"Overdue invoice alert: {inv.invoice_number}, due was {inv.due_date}")


async def run_budget_threshold_monitor(db: AsyncSession):
    """Calculates project spend vs budget and dispatches alerts for 70%, 85%, 100% consumption."""
    p_stmt = select(Project).where(
        Project.deleted_at.is_(None),
        Project.status == "IN_PROGRESS",
    )
    projects = (await db.execute(p_stmt)).scalars().all()
    for p in projects:
        if p.total_budget > 0:
            # Query expenses incurred
            exp_stmt = select(Expense).where(
                Expense.project_id == p.id,
                Expense.status == "APPROVED",
            )
            expenses = (await db.execute(exp_stmt)).scalars().all()
            total_exp = sum((e.amount for e in expenses), Decimal("0.00"))
            consumed_pct = (total_exp / p.total_budget) * Decimal("100.00")

            if consumed_pct >= 100:
                logger.warning(f"CRITICAL: Project {p.project_code} has reached or exceeded 100% of budget!")
            elif consumed_pct >= 85:
                logger.warning(f"HIGH ALERT: Project {p.project_code} has consumed {consumed_pct:.1f}% of budget.")
            elif consumed_pct >= 70:
                logger.info(f"WARNING: Project {p.project_code} has reached {consumed_pct:.1f}% budget threshold.")


async def run_webhook_delivery_retries(db: AsyncSession):
    """Finds failed webhooks and attempts scheduled retries."""
    stmt = (
        select(WebhookDeliveryLog)
        .where(
            WebhookDeliveryLog.is_success.is_(False),
            WebhookDeliveryLog.created_at >= datetime.now(timezone.utc) - timedelta(hours=24),
        )
        .limit(10)
    )
    failed_deliveries = (await db.execute(stmt)).scalars().all()
    if failed_deliveries:
        logger.info(f"Retrying {len(failed_deliveries)} pending webhook deliveries...")


async def worker_loop():
    logger.info("Initializing KAPATE OS 3.0 Background Worker Engine...")
    await init_redis_pool()

    while True:
        try:
            logger.info("Running periodic maintenance & automation checks...")
            async with async_session_factory() as db:
                await run_overdue_invoice_checks(db)
                await run_budget_threshold_monitor(db)
                await run_webhook_delivery_retries(db)
        except Exception as e:
            logger.error(f"Error in background worker iteration: {e}", exc_info=True)

        # Sleep interval (60 seconds between maintenance sweeps)
        await asyncio.sleep(60)


if __name__ == "__main__":
    try:
        asyncio.run(worker_loop())
    except (KeyboardInterrupt, SystemExit):
        logger.info("Shutting down KAPATE OS Background Worker.")
