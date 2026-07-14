"""Provider factory. `CONNECT_PROVIDER` unset/`demo` → simulated carrier,
mirroring the AI engine's keyless demo mode."""

from ...config import settings
from .base import MessagingProvider, ProviderError, ProviderMessageResult, ProvisionedNumber
from .demo import DemoProvider
from .twilio import TwilioProvider

__all__ = [
    "MessagingProvider",
    "ProviderError",
    "ProviderMessageResult",
    "ProvisionedNumber",
    "get_provider",
]

_PROVIDERS = {
    "demo": DemoProvider,
    "twilio": TwilioProvider,
}


def get_provider() -> MessagingProvider:
    name = (settings.CONNECT_PROVIDER or "demo").lower()
    provider_cls = _PROVIDERS.get(name)
    if provider_cls is None:
        raise ProviderError(f"Unknown CONNECT_PROVIDER '{name}'")
    return provider_cls()
