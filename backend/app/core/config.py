"""Application settings loaded via environment variables."""
from functools import lru_cache
from pydantic import BaseSettings, Field


class Settings(BaseSettings):
    """Strongly typed runtime configuration."""

    project_name: str = Field("Kieu Phong Bookstore API", description="Human readable service name")
    api_v1_prefix: str = Field("/api/v1", description="Prefix for v1 routes")

    secret_key: str = Field(..., description="JWT signing secret")
    algorithm: str = Field("HS256", description="JWT signing algorithm")
    access_token_expire_minutes: int = Field(60 * 24, description="Access token lifetime in minutes")

    mysql_host: str = Field("localhost", description="MySQL host")
    mysql_port: int = Field(3306, description="MySQL port")
    mysql_user: str = Field("root", description="MySQL user")
    mysql_password: str = Field(..., description="MySQL password")
    mysql_db: str = Field("kieuphong_bookstore", description="Database name")

    first_superuser_email: str = Field("admin@example.com", description="Bootstrap admin email")
    first_superuser_password: str = Field("ChangeMe123!", description="Bootstrap admin password")

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

    @property
    def database_url(self) -> str:
        """Build the SQLAlchemy DSN for pymysql driver."""
        return (
            f"mysql+pymysql://{self.mysql_user}:{self.mysql_password}"
            f"@{self.mysql_host}:{self.mysql_port}/{self.mysql_db}?charset=utf8mb4"
        )


@lru_cache
def get_settings() -> Settings:
    """Return a cached Settings instance for dependency injection."""
    return Settings()
