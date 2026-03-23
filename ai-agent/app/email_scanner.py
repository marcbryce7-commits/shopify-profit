"""
Email scanning — fetch emails matching shipping-related keywords from
Gmail (via Google API) or generic IMAP/Outlook.
"""

from __future__ import annotations

import base64
import imaplib
import email as email_lib
from datetime import datetime
from email.header import decode_header
from typing import Any, Optional

import httpx


async def scan_gmail(
    access_token: str,
    since: datetime,
    keywords: list[str],
) -> list[dict[str, Any]]:
    """Scan Gmail via the REST API using an OAuth access token."""
    query_parts = [f"after:{int(since.timestamp())}"]
    if keywords:
        kw_query = " OR ".join(f'"{k}"' for k in keywords)
        query_parts.append(f"({kw_query})")
    query = " ".join(query_parts)

    emails: list[dict[str, Any]] = []

    async with httpx.AsyncClient() as client:
        # List matching messages
        list_res = await client.get(
            "https://gmail.googleapis.com/gmail/v1/users/me/messages",
            headers={"Authorization": f"Bearer {access_token}"},
            params={"q": query, "maxResults": 50},
        )
        list_res.raise_for_status()
        messages = list_res.json().get("messages", [])

        for msg_ref in messages:
            msg_res = await client.get(
                f"https://gmail.googleapis.com/gmail/v1/users/me/messages/{msg_ref['id']}",
                headers={"Authorization": f"Bearer {access_token}"},
                params={"format": "full"},
            )
            msg_res.raise_for_status()
            msg_data = msg_res.json()

            headers = {
                h["name"].lower(): h["value"]
                for h in msg_data.get("payload", {}).get("headers", [])
            }

            body = _extract_gmail_body(msg_data.get("payload", {}))
            attachments = await _extract_gmail_attachments(
                client, access_token, msg_ref["id"], msg_data.get("payload", {})
            )

            emails.append(
                {
                    "subject": headers.get("subject", ""),
                    "sender": headers.get("from", ""),
                    "received_at": headers.get("date", ""),
                    "body": body,
                    "attachments": attachments,
                }
            )

    return emails


def _extract_gmail_body(payload: dict) -> str:
    """Recursively extract plain text body from Gmail payload."""
    if payload.get("mimeType") == "text/plain" and payload.get("body", {}).get("data"):
        return base64.urlsafe_b64decode(payload["body"]["data"]).decode("utf-8", errors="replace")

    for part in payload.get("parts", []):
        result = _extract_gmail_body(part)
        if result:
            return result

    return ""


async def _extract_gmail_attachments(
    client: httpx.AsyncClient,
    access_token: str,
    message_id: str,
    payload: dict,
) -> list[dict[str, Any]]:
    """Download PDF attachments from a Gmail message."""
    attachments: list[dict[str, Any]] = []

    for part in payload.get("parts", []):
        filename = part.get("filename", "")
        if not filename.lower().endswith(".pdf"):
            continue

        attachment_id = part.get("body", {}).get("attachmentId")
        if not attachment_id:
            continue

        att_res = await client.get(
            f"https://gmail.googleapis.com/gmail/v1/users/me/messages/{message_id}/attachments/{attachment_id}",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        att_res.raise_for_status()
        data = att_res.json().get("data", "")
        content = base64.urlsafe_b64decode(data)

        attachments.append({"filename": filename, "content": content})

    return attachments


async def scan_imap(
    access_token: str,
    provider: str,
    since: datetime,
    keywords: list[str],
) -> list[dict[str, Any]]:
    """Scan via IMAP (Outlook or generic IMAP server)."""
    if provider == "outlook":
        host = "outlook.office365.com"
    else:
        host = "imap.gmail.com"  # fallback

    mail = imaplib.IMAP4_SSL(host)

    # OAuth2 XOAUTH2 authentication
    auth_string = f"user=user\x01auth=Bearer {access_token}\x01\x01"
    try:
        mail.authenticate("XOAUTH2", lambda _: auth_string.encode())
    except imaplib.IMAP4.error:
        # Fallback: treat access_token as password
        mail.login("user", access_token)

    mail.select("INBOX")

    since_str = since.strftime("%d-%b-%Y")
    search_criteria = f'(SINCE "{since_str}")'

    _, message_ids = mail.search(None, search_criteria)
    ids = message_ids[0].split()

    emails: list[dict[str, Any]] = []
    for mid in ids[-50:]:  # limit to 50 most recent
        _, msg_data = mail.fetch(mid, "(RFC822)")
        raw = msg_data[0][1]  # type: ignore[index]
        msg = email_lib.message_from_bytes(raw)  # type: ignore[arg-type]

        subject = _decode_subject(msg.get("Subject", ""))

        # Check if subject/body matches keywords
        if not any(kw.lower() in subject.lower() for kw in keywords):
            continue

        body = ""
        attachments: list[dict[str, Any]] = []
        for part in msg.walk():
            content_type = part.get_content_type()
            if content_type == "text/plain":
                payload = part.get_payload(decode=True)
                if payload:
                    body = payload.decode("utf-8", errors="replace")
            elif (
                content_type == "application/pdf"
                and part.get_filename()
            ):
                payload = part.get_payload(decode=True)
                if payload:
                    attachments.append(
                        {"filename": part.get_filename(), "content": payload}
                    )

        emails.append(
            {
                "subject": subject,
                "sender": msg.get("From", ""),
                "received_at": msg.get("Date", ""),
                "body": body,
                "attachments": attachments,
            }
        )

    mail.logout()
    return emails


def _decode_subject(raw: Optional[str]) -> str:
    if not raw:
        return ""
    decoded_parts = decode_header(raw)
    parts = []
    for content, charset in decoded_parts:
        if isinstance(content, bytes):
            parts.append(content.decode(charset or "utf-8", errors="replace"))
        else:
            parts.append(content)
    return "".join(parts)
