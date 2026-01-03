"""Health check schemas."""

from typing import Any, Dict, Literal
from pydantic import BaseModel


class ComponentStatus(BaseModel):
    """Status of a single component."""

    status: Literal["healthy", "unhealthy", "degraded"]
    details: Dict[str, Any] = {}


class HealthResponse(BaseModel):
    """Aggregated health response."""

    status: Literal["healthy", "unhealthy", "degraded"]
    components: Dict[str, ComponentStatus]
    version: str = "0.1.0"
