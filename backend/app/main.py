import structlog
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST
from starlette.responses import Response

from app.config import settings

logger = structlog.get_logger()

# Prometheus metrics
REQUEST_COUNT = Counter("http_requests_total", "Total HTTP requests", ["method", "endpoint", "status"])
REQUEST_LATENCY = Histogram("http_request_duration_seconds", "HTTP request latency", ["endpoint"])

app = FastAPI(
    title="LEAD_GEN_INTELLIGENCE API",
    description="Enterprise-grade lead intelligence platform",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    logger.info("starting_application")
    try:
        from app.database import engine, Base
        from app.models import contractor  # noqa: F401 - register models
        Base.metadata.create_all(bind=engine)
        logger.info("database_tables_created")
    except Exception as e:
        logger.error("startup_failed", error=str(e))


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "leadgen-api",
        "version": "1.0.0",
    }


@app.get("/metrics")
def metrics():
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)


# Include routers
from app.api.v1 import leads, scrapers, agents, outreach, commands  # noqa: E402

app.include_router(leads.router, prefix="/api/v1")
app.include_router(scrapers.router, prefix="/api/v1")
app.include_router(agents.router, prefix="/api/v1")
app.include_router(outreach.router, prefix="/api/v1")
app.include_router(commands.router, prefix="/api/v1")
