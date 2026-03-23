"""
Invoice data extraction using an LLM (Anthropic Claude or OpenAI GPT).
Parses email bodies and PDF attachments to extract shipping cost information.
"""

from __future__ import annotations

import io
import json
import os
from typing import Any, Optional

EXTRACTION_PROMPT = """You are a shipping invoice data extractor. Analyze the following email and any attached PDF content to extract shipping cost information.

Extract:
- invoice_number: The invoice or reference number
- supplier_name: The shipping carrier or supplier (e.g., "FedEx", "UPS", "DHL")
- amount: The total shipping cost as a decimal number (e.g., 12.50)
- order_number: Any customer order number referenced (if found)
- tracking_number: Any tracking number (if found)

If the email is NOT a shipping invoice or does not contain shipping cost information, respond with null.

Respond ONLY with a JSON object or null. No markdown, no explanation.

Email Subject: {subject}
From: {sender}

Email Body:
{body}

{attachment_text}"""


async def extract_invoice_data(
    subject: str,
    sender: str,
    body: str,
    attachments: list[dict[str, Any]],
) -> Optional[dict[str, Any]]:
    """Use an LLM to extract structured invoice data from an email."""

    # Extract text from PDF attachments
    attachment_text = ""
    for att in attachments:
        if att.get("content"):
            text = _extract_pdf_text(att["content"])
            if text:
                attachment_text += f"\n\nPDF Attachment ({att['filename']}):\n{text[:3000]}"

    if attachment_text:
        attachment_text = f"Attached PDF Content:{attachment_text}"
    else:
        attachment_text = "(No PDF attachments)"

    prompt = EXTRACTION_PROMPT.format(
        subject=subject,
        sender=sender,
        body=body[:5000],
        attachment_text=attachment_text,
    )

    provider = os.getenv("LLM_PROVIDER", "anthropic")

    try:
        if provider == "anthropic":
            return await _call_anthropic(prompt)
        else:
            return await _call_openai(prompt)
    except Exception as e:
        print(f"LLM extraction error: {e}")
        return None


async def _call_anthropic(prompt: str) -> Optional[dict[str, Any]]:
    import anthropic

    client = anthropic.AsyncAnthropic()
    message = await client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=512,
        messages=[{"role": "user", "content": prompt}],
    )

    text = message.content[0].text.strip()
    if text.lower() == "null":
        return None

    return json.loads(text)


async def _call_openai(prompt: str) -> Optional[dict[str, Any]]:
    from openai import AsyncOpenAI

    client = AsyncOpenAI()
    response = await client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=512,
        response_format={"type": "json_object"},
    )

    text = (response.choices[0].message.content or "").strip()
    if text.lower() == "null" or not text:
        return None

    data = json.loads(text)
    # OpenAI json_object mode may wrap in an object
    if "result" in data and data["result"] is None:
        return None
    return data


def _extract_pdf_text(pdf_bytes: bytes) -> str:
    """Extract text from a PDF file using pypdf."""
    try:
        from pypdf import PdfReader

        reader = PdfReader(io.BytesIO(pdf_bytes))
        text_parts = []
        for page in reader.pages[:5]:  # limit to first 5 pages
            text_parts.append(page.extract_text() or "")
        return "\n".join(text_parts)
    except Exception:
        return ""
