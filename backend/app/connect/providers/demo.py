"""Simulated carrier — the default provider and the one every test runs on.

Deterministic (a process-local counter, no randomness), instant (never
sleeps), and clearly labeled: every send comes back `status="simulated"`.
Mirrors the AI engine's demo mode.
"""

import itertools
from typing import Mapping

from .base import ProviderMessageResult, ProvisionedNumber

_counter = itertools.count(1)


class DemoProvider:
    name = "demo"

    def send_sms(
        self,
        *,
        from_number: str,
        to_number: str,
        body: str,
        media_urls: list[str] | None = None,
    ) -> ProviderMessageResult:
        return ProviderMessageResult(
            provider_sid=f"SMdemo{next(_counter):08d}", status="simulated"
        )

    def provision_number(
        self, *, area_code: str | None, toll_free: bool
    ) -> ProvisionedNumber:
        prefix = "833" if toll_free else (area_code or "555")
        return ProvisionedNumber(
            e164=f"+1{prefix}{next(_counter):07d}",
            provider_sid=f"PNdemo{next(_counter):08d}",
            toll_free=toll_free,
            status="active",  # demo numbers skip carrier registration
        )

    def release_number(self, *, provider_sid: str) -> None:
        return None

    def verify_webhook(
        self, *, url: str, headers: Mapping[str, str], form: Mapping[str, str]
    ) -> bool:
        return True  # simulated webhooks carry no carrier signature
