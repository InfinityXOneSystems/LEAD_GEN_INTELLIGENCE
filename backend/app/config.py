from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    DATABASE_URL: str = "postgresql://leadgen:leadgen123@localhost:5432/leadgen"
    REDIS_URL: str = "redis://localhost:6379/0"
    SECRET_KEY: str = "dev-secret-key-change-in-production"
    OPENAI_API_KEY: str = ""
    SENDGRID_API_KEY: str = ""
    GITHUB_TOKEN: str = ""
    GOOGLE_SHEETS_CREDENTIALS: str = ""
    SCRAPER_CONCURRENCY: int = 10
    MAX_LEADS_PER_DAY: int = 100000

    # Derived
    @property
    def async_database_url(self) -> str:
        return self.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://")


settings = Settings()
