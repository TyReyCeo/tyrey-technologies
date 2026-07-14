from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    DATABASE_URL: str = "sqlite:///./tyrey.db"

    ANTHROPIC_API_KEY: str = ""
    CLAUDE_MODEL: str = "claude-sonnet-5"

    JWT_SECRET: str = "dev-only-secret-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_DAYS: int = 7

    # Comma-separated emails allowed to access admin-only endpoints (e.g. lead
    # listing). Empty means no one — admin routes deny by default.
    ADMIN_EMAILS: str = ""

    STRIPE_SECRET_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = ""
    STRIPE_PRICE_STARTER: str = ""
    STRIPE_PRICE_PRO: str = ""
    STRIPE_PRICE_EXECUTIVE: str = ""
    STRIPE_PRICE_CONNECT: str = ""
    STRIPE_PRICE_CONNECT_EXECUTIVE: str = ""

    # Connect AI carrier layer. Unset/"demo" = simulated sends (no keys),
    # "twilio" = real carrier via the adapter in app/connect/providers/.
    CONNECT_PROVIDER: str = "demo"
    TWILIO_ACCOUNT_SID: str = ""
    TWILIO_AUTH_TOKEN: str = ""
    CONNECT_SEND_RATE_PER_MIN: int = 60

    FRONTEND_URL: str = "http://localhost:3000"


settings = Settings()
