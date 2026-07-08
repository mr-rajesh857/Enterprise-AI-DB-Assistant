import os
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


def _get_env(name: str, default: str = "") -> str:
    env_file = Path(__file__).resolve().parent.parent / ".env"
    if env_file.exists():
        for line in env_file.read_text(encoding="utf-8").splitlines():
            if line.startswith(f"{name}="):
                return line.split("=", 1)[1].strip().strip('"').strip("'")
    return os.getenv(name, default)


class Settings(BaseSettings):
    DATABASE_URL: str = _get_env("DATABASE_URL", "sqlite:///./app.db")
    SECRET_KEY: str = _get_env("SECRET_KEY", "dev-secret-key-change-me")
    ALGORITHM: str = _get_env("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(_get_env("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
    GEMINI_API_KEY: str = _get_env("GEMINI_API_KEY", "dummy-gemini-key")
    GEMINI_MODEL: str = _get_env("GEMINI_MODEL", "gemini-2.5-flash")
    APP_ENV: str = _get_env("APP_ENV", "development")
    CORS_ORIGINS: str = _get_env("CORS_ORIGINS", "http://localhost:3000")

    model_config = SettingsConfigDict(extra="ignore")

    @property
    def cors_list(self):
        return [o.strip() for o in self.CORS_ORIGINS.split(",")]


settings = Settings()