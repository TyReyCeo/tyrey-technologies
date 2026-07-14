"""The carrier adapter interface — the ONLY surface the rest of the app uses.

Mirrors how llm.py isolates the Anthropic SDK: provider SDKs live behind this
protocol, provider failures raise ProviderError (mapped to 502 in main.py),
and the demo implementation keeps every path testable without keys.
"""

from dataclasses import dataclass, field
from typing import Mapping, Protocol


class ProviderError(RuntimeError):
    """The carrier provider failed. main.py maps this to a 502."""


@dataclass
class ProviderMessageResult:
    provider_sid: str
    status: str  # queued | sent | simulated


@dataclass
class ProvisionedNumber:
    e164: str
    provider_sid: str
    toll_free: bool = False
    # Demo numbers are exempt from carrier registration; real numbers start
    # pending until 10DLC/toll-free registration completes.
    status: str = "pending_registration"
    extra: dict = field(default_factory=dict)


class MessagingProvider(Protocol):
    name: str

    def send_sms(
        self,
        *,
        from_number: str,
        to_number: str,
        body: str,
        media_urls: list[str] | None = None,
    ) -> ProviderMessageResult: ...

    def provision_number(
        self, *, area_code: str | None, toll_free: bool
    ) -> ProvisionedNumber: ...

    def release_number(self, *, provider_sid: str) -> None: ...

    def verify_webhook(
        self, *, url: str, headers: Mapping[str, str], form: Mapping[str, str]
    ) -> bool: ...
