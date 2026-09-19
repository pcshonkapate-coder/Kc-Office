import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
from app.core.config import settings
from app.core.logging import logger


class EmailService:
    @staticmethod
    def render_otp_html(otp_code: str, employee_name: Optional[str] = None, purpose: str = "LOGIN") -> str:
        name_greeting = f"Hello {employee_name}," if employee_name else "Hello,"
        purpose_text = "sign in to your employee account on" if purpose == "LOGIN" else "verify your identity on"

        return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Kapate OS Verification Code</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 40px 10px;">
    <tr>
      <td align="center">
        <table width="100%" max-width="540" border="0" cellspacing="0" cellpadding="0" style="max-width: 540px; background-color: #ffffff; border-radius: 20px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);">
          
          <!-- Header Branding -->
          <tr>
            <td style="background-color: #0f172a; padding: 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">
                KAPATE <span style="color: #3b82f6;">CONSULTANCY</span>
              </h1>
              <p style="margin: 6px 0 0 0; color: #94a3b8; font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px;">
                Enterprise Operating System
              </p>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 35px 30px;">
              <p style="margin: 0 0 14px 0; font-size: 15px; font-weight: 600; color: #0f172a;">
                {name_greeting}
              </p>
              <p style="margin: 0 0 24px 0; font-size: 13px; color: #475569; line-height: 1.6;">
                You recently requested a One-Time Password (OTP) to {purpose_text} <strong>Kapate OS</strong>. Use the secure 6-digit security code below to complete your authorization:
              </p>

              <!-- OTP Code Display Card -->
              <div style="background-color: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 14px; padding: 22px; text-align: center; margin: 24px 0;">
                <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">
                  Your Verification Code
                </div>
                <div style="font-family: 'Courier New', Courier, monospace; font-size: 34px; font-weight: 800; color: #0284c7; letter-spacing: 8px; margin: 4px 0;">
                  {otp_code}
                </div>
                <div style="font-size: 11px; color: #94a3b8; margin-top: 8px;">
                  ⏱️ Valid for <strong>5 minutes</strong>. Do not share this code with anyone.
                </div>
              </div>

              <!-- Security Notice -->
              <p style="margin: 24px 0 0 0; font-size: 12px; color: #64748b; line-height: 1.5;">
                If you did not request this security code, your account may be under observation. Please notify <strong>security@kapateconsultancy.in</strong> immediately.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 20px 30px; border-top: 1px solid #e2e8f0; text-align: center;">
              <p style="margin: 0; font-size: 11px; color: #94a3b8;">
                &copy; 2026 Kapate Consultancy Pvt Ltd • Secure Identity & Access Management
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
"""

    @classmethod
    def send_otp_email(
        cls,
        to_email: str,
        otp_code: str,
        employee_name: Optional[str] = None,
        purpose: str = "LOGIN"
    ) -> bool:
        """
        Dispatches real-time OTP verification email.
        If SMTP server is configured in .env, connects and delivers to real inbox.
        Otherwise logs formatted dispatch.
        """
        subject = f"Your Kapate OS Verification Code: {otp_code}"
        html_content = cls.render_otp_html(otp_code, employee_name, purpose)
        plain_text = f"Your Kapate OS verification code is: {otp_code}. Valid for 5 minutes. Do not share this code."

        if settings.SMTP_HOST and settings.SMTP_USER and settings.SMTP_PASSWORD:
            try:
                msg = MIMEMultipart("alternative")
                msg["Subject"] = subject
                from_addr = settings.EMAILS_FROM_EMAIL or settings.SMTP_USER
                msg["From"] = f"{settings.EMAILS_FROM_NAME} <{from_addr}>"
                msg["To"] = to_email

                msg.attach(MIMEText(plain_text, "plain", "utf-8"))
                msg.attach(MIMEText(html_content, "html", "utf-8"))

                timeout = getattr(settings, "SMTP_TIMEOUT", 10)
                is_ssl = getattr(settings, "SMTP_SSL", False) or settings.SMTP_PORT == 465

                if is_ssl:
                    server = smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT, timeout=timeout)
                else:
                    server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=timeout)
                    if getattr(settings, "SMTP_TLS", True):
                        server.starttls()

                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                server.sendmail(from_addr, [to_email], msg.as_string())
                server.quit()

                logger.info(f"[SUCCESS] [Real-Time Email Dispatched] Live OTP successfully sent to '{to_email}' via SMTP ({settings.SMTP_HOST}:{settings.SMTP_PORT})")
                return True
            except Exception as e:
                logger.error(f"[ERROR] [SMTP Dispatch Error] Failed to send email via SMTP to '{to_email}': {str(e)}")
                # Still log the code in console for development fallback so the developer can see the code if SMTP fails
                logger.warning(
                    f"\n{'='*60}\n"
                    f"[WARN] [SMTP FAILED - FALLBACK CONSOLE DISPATCH]\n"
                    f"To: {to_email}\n"
                    f"Subject: {subject}\n"
                    f"OTP Code: >> {otp_code} <<\n"
                    f"Reason: {str(e)}\n"
                    f"{'='*60}\n"
                )
                return False
        else:
            logger.info(
                f"\n{'='*60}\n"
                f"[INFO] [REAL-TIME EMAIL DISPATCH - CONSOLE RELAY]\n"
                f"To: {to_email}\n"
                f"Subject: {subject}\n"
                f"OTP Code: >> {otp_code} <<\n"
                f"Notice: Configure SMTP_HOST, SMTP_USER, SMTP_PASSWORD in backend/.env for live inbox delivery.\n"
                f"{'='*60}\n"
            )
            return True
