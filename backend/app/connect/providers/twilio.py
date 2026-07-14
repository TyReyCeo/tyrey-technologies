"""Twilio adapter — the ONLY file that touches the twilio SDK.

The SDK is imported lazily inside methods so demo mode (and the test suite)
never needs the package installed. Webhook signatures are verified with the
account auth token per Twilio's scheme (HMAC-SHA1 over URL + sorted form
params) using the stdlib, so verification works without the SDK too.
"""

import base64
import hashlib
import hmac
import logging
import time
from typing import Mapping

from ...config import settings
from .base import ProviderError, ProviderMessageResult, ProvisionedNumber

logger = logging.getLogger("tyrey.connect.twilio")


class TwilioProvider:
    name = "twilio"

    def _client(self):
        try:
            from twilio.rest import Client
        except ImportError as exc:  # pragma: no cover - deployment config error
            raise ProviderError("twilio package is not installed") from exc
        if not settings.TWILIO_ACCOUNT_SID or not settings.TWILIO_AUTH_TOKEN:
            raise ProviderError("Twilio credentials are not configured")
        return Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)

    def send_sms(
        self,
        *,
        from_number: str,
        to_number: str,
        body: str,
        media_urls: list[str] | None = None,
    ) -> ProviderMessageResult:
        started = time.monotonic()
        try:
            message = self._client().messages.create(
                from_=from_number,
                to=to_number,
                body=body,
                media_url=media_urls or None,
            )
        except ProviderError:
            raise
        except Exception as exc:
            # No message content in logs — IDs, latency, and error class only.
            logger.error(
                "twilio send failed latency_ms=%d error=%s",
                int((time.monotonic() - started) * 1000),
                type(exc).__name__,
            )
            raise ProviderError("Carrier send failed") from exc

        logger.info(
            "twilio send sid=%s status=%s latency_ms=%d",
            message.sid,
            message.status,
            int((time.monotonic() - started) * 1000),
        )
        return ProviderMessageResult(provider_sid=message.sid, status=message.status or "queued")

    def provision_number(
        self, *, area_code: str | None, toll_free: bool
    ) -> ProvisionedNumber:
        client = self._client()
        try:
            if toll_free:
                available = client.available_phone_numbers("US").toll_free.list(limit=1)
            else:
                available = client.available_phone_numbers("US").local.list(
                    area_code=int(area_code) if area_code else None, limit=1
                )
            if not available:
                raise ProviderError("No phone numbers available for that search")
            purchased = client.incoming_phone_numbers.create(
                phone_number=available[0].phone_number
            )
        except ProviderError:
            raise
        except Exception as exc:
            logger.error("twilio provision failed error=%s", type(exc).__name__)
            raise ProviderError("Number provisioning failed") from exc

        logger.info("twilio provisioned number sid=%s", purchased.sid)
        # Real numbers stay pending until 10DLC/toll-free registration clears
        # (docs/connect-ai/ARCHITECTURE.md §9); sends are gated until then.
        return ProvisionedNumber(
            e164=purchased.phone_number,
            provider_sid=purchased.sid,
            toll_free=toll_free,
        )

    def release_number(self, *, provider_sid: str) -> None:
        try:
            self._client().incoming_phone_numbers(provider_sid).delete()
        except ProviderError:
            raise
        except Exception as exc:
            logger.error("twilio release failed sid=%s error=%s", provider_sid, type(exc).__name__)
            raise ProviderError("Number release failed") from exc

    def verify_webhook(
        self, *, url: str, headers: Mapping[str, str], form: Mapping[str, str]
    ) -> bool:
        signature = headers.get("x-twilio-signature", "")
        if not signature or not settings.TWILIO_AUTH_TOKEN:
            return False
        payload = url + "".join(k + form[k] for k in sorted(form))
        expected = base64.b64encode(
            hmac.new(
                settings.TWILIO_AUTH_TOKEN.encode(), payload.encode("utf-8"), hashlib.sha1
            ).digest()
        ).decode()
        return hmac.compare_digest(expected, signature)
