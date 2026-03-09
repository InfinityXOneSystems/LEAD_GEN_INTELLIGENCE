from contextlib import asynccontextmanager

import structlog
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from prometheus_client import CONTENT_TYPE_LATEST, Counter, Histogram, generate_latest
from starlette.responses import Response

logger = structlog.get_logger()

# Prometheus metrics
REQUEST_COUNT = Counter(
    "http_requests_total", "Total HTTP requests", ["method", "endpoint", "status"]
)
REQUEST_LATENCY = Histogram(
    "http_request_duration_seconds", "HTTP request latency", ["endpoint"]
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("starting_application")
    try:
        from app.database import Base, engine
        from app.models import contractor  # noqa: F401 - register models

        Base.metadata.create_all(bind=engine)
        logger.info("database_tables_created")
    except Exception as e:
        logger.error("startup_failed", error=str(e))

    # Start background worker pool for runtime command execution
    try:
        from app.runtime.command_router import _register_defaults
        from app.workers.worker_runtime import start_worker_pool
        from app.workers.worker_supervisor import start_supervisor

        _register_defaults()
        start_worker_pool(num_workers=2)
        start_supervisor()
        logger.info("worker_pool_started")
    except Exception as e:
        logger.error("worker_pool_start_failed", error=str(e))

    yield


app = FastAPI(
    title="LEAD_GEN_INTELLIGENCE API",
    description="Enterprise-grade lead intelligence platform",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


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
from app.api.v1 import scrapers  # noqa: E402
from app.api.v1 import agents, commands, leads, outreach  # noqa: E402
from app.api.v1 import runtime as runtime_router  # noqa: E402
from app.api.v1 import system as system_router  # noqa: E402

app.include_router(leads.router, prefix="/api/v1")
app.include_router(scrapers.router, prefix="/api/v1")
app.include_router(agents.router, prefix="/api/v1")
app.include_router(outreach.router, prefix="/api/v1")
app.include_router(commands.router, prefix="/api/v1")
app.include_router(runtime_router.router, prefix="/api/v1")
app.include_router(system_router.router, prefix="/api/v1")
