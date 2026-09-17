import os
from typing import Dict, Any
from jinja2 import Environment, FileSystemLoader
from app.core.logging import logger

try:
    import pdfkit
    PDFKIT_AVAILABLE = True
except ImportError:
    PDFKIT_AVAILABLE = False
    logger.warning("pdfkit not installed. PDF generation will fall back to mock.")

class PDFGenerator:
    """
    Architecture for Kapate-branded PDF Document Generation.
    Uses Jinja2 to render HTML templates populated with document data,
    then uses pdfkit (wkhtmltopdf) to convert to professional PDFs.
    """
    def __init__(self):
        # Setup Jinja2 environment pointing to our templates directory
        template_dir = os.path.join(os.path.dirname(__file__), '..', '..', 'templates', 'documents')
        self.env = Environment(loader=FileSystemLoader(template_dir))

    def generate_pdf(self, document_type: str, data: Dict[str, Any]) -> bytes:
        """
        Generates a PDF byte string.
        :param document_type: e.g. "proposal", "sow"
        :param data: Safe payload containing only client-facing information.
        """
        template_name = f"{document_type.lower()}.html"
        try:
            template = self.env.get_template(template_name)
        except Exception as e:
            logger.error(f"Template not found for {document_type}: {e}")
            # Fallback to a generic template if specific one isn't found
            template = self.env.get_template("generic.html")
            
        # Render HTML
        html_out = template.render(**data)
        
        if PDFKIT_AVAILABLE:
            try:
                # Convert HTML to PDF bytes
                pdf_bytes = pdfkit.from_string(html_out, False)
                return pdf_bytes
            except Exception as e:
                logger.error(f"pdfkit generation failed: {e}")
        
        # Mock generation if pdfkit isn't available or fails
        logger.info("[Mock PDF] Generating mock PDF bytes.")
        return b"%PDF-1.4\n%Mock Document Bytes\n%%EOF"
