"""
/scan-emails endpoint — receives email credentials from the Next.js Inngest job,
scans for shipping invoices, extracts cost data via LLM, and returns results.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter
from pydantic import BaseModel

from app.email_scanner import scan_gmail, scan_imap
from app.extractor import extract_invoice_data

router = APIRouter()


class ScanRequest(BaseModel):
    emailAccountId: str
    provider: str  # "gmail" | "outlook" | "imap"
    accessToken: str
    refreshToken: Optional[str] = None
    scanKeywords: Optional[str] = None
    lastScannedAt: Optional[str] = None


class InvoiceResult(BaseModel):
    subject: str
    sender: str
    receivedAt: str
    invoiceNumber: str
    supplierName: str
    amount: float
    orderNumber: Optional[str] = None
    trackingNumber: Optional[str] = None


class ScanResponse(BaseModel):
    invoices: list[InvoiceResult]


@router.post("/scan-emails", response_model=ScanResponse)
async def scan_emails(req: ScanRequest) -> ScanResponse:
    # Determine the date window
    since = None
    if req.lastScannedAt:
        since = datetime.fromisoformat(req.lastScannedAt)
    else:
        since = datetime.now(timezone.utc) - timedelta(days=30)

    keywords = (
        [k.strip() for k in req.scanKeywords.split(",")]
        if req.scanKeywords
        else ["FedEx", "UPS", "DHL", "USPS", "shipping invoice", "freight"]
    )

    # Fetch emails based on provider
    if req.provider == "gmail":
        raw_emails = await scan_gmail(
            access_token=req.accessToken,
            since=since,
            keywords=keywords,
        )
    elif req.provider in ("outlook", "imap"):
        raw_emails = await scan_imap(
            access_token=req.accessToken,
            provider=req.provider,
            since=since,
            keywords=keywords,
        )
    else:
        return ScanResponse(invoices=[])

    # Extract invoice data from each email using LLM
    invoices: list[InvoiceResult] = []
    for email in raw_emails:
        extracted = await extract_invoice_data(
            subject=email["subject"],
            sender=email["sender"],
            body=email["body"],
            attachments=email.get("attachments", []),
        )
        if extracted:
            invoices.append(
                InvoiceResult(
                    subject=email["subject"],
                    sender=email["sender"],
                    receivedAt=email["received_at"],
                    invoiceNumber=extracted["invoice_number"],
                    supplierName=extracted["supplier_name"],
                    amount=extracted["amount"],
                    orderNumber=extracted.get("order_number"),
                    trackingNumber=extracted.get("tracking_number"),
                )
            )

    return ScanResponse(invoices=invoices)
