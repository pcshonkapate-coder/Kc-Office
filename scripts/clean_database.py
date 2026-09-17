import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "kapate_os.db")

def clean_database():
    if not os.path.exists(DB_PATH):
        print(f"Database not found at {DB_PATH}")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    tables_to_clear = [
        "leads", "deals", "contacts", "companies", "deal_contacts", "deal_stage_history",
        "proposals", "contracts", "tasks", "subtasks", "projects", "milestones",
        "resource_allocations", "invoices", "invoice_items", "payments", "expenses",
        "timesheets", "attendance", "leave_requests", "performance_reviews",
        "employees", "interns", "freelancers", "person_profiles", "signature_trackers",
        "document_versions", "documents", "managed_documents", "activities", "activity_events",
        "meetings", "followup_reminders", "delivery_comments", "ai_audit_logs", "ai_drafts",
        "notifications", "audit_logs"
    ]

    cleared_count = 0
    for table in tables_to_clear:
        try:
            cursor.execute(f"DELETE FROM {table};")
            cleared_count += 1
        except sqlite3.OperationalError as e:
            # Table might not exist or already clean
            pass

    # Clean non-admin users if desired, or keep the initial superadmin user
    cursor.execute("DELETE FROM users WHERE email != 'admin@kapateconsultancy.com' AND email != 'shon@kapateconsultancy.com';")

    conn.commit()
    conn.close()
    print(f"Successfully purged test data from {cleared_count} operational tables. System is clean and ready for deployment.")

if __name__ == "__main__":
    clean_database()
