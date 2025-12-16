from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os
from contextlib import asynccontextmanager
from app import models
from app.database import engine, SessionLocal
from app.auth.register import router as register_router
from app.auth.login import router as login_router
from app.chat import router as chat_router

def init_database():
    try:
        print("Создание таблиц в базе данных...")
        models.Base.metadata.create_all(bind=engine)
        print("Таблицы успешно созданы")
    except Exception as e:
        print(f"Ошибка при создании таблиц: {e}")

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_database()
    yield
    pass

app = FastAPI(
    title="Чат-бот поддержки",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(register_router)
app.include_router(login_router)
app.include_router(chat_router)

FRONTEND_DIR = os.path.join(os.path.dirname(__file__), "..", "frontend")

if os.path.exists(FRONTEND_DIR):
    app.mount("/static", StaticFiles(directory=FRONTEND_DIR), name="static")
    
    @app.get("/", include_in_schema=False)
    async def serve_frontend():
        return FileResponse(os.path.join(FRONTEND_DIR, "index.html"))
    
    @app.get("/{path:path}", include_in_schema=False)
    async def catch_all(path: str):
        file_path = os.path.join(FRONTEND_DIR, path)
        if os.path.exists(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(FRONTEND_DIR, "index.html"))
else:
    print(f"ВНИМАНИЕ: Папка фронтенда не найдена: {FRONTEND_DIR}")
    print("Запускается только API бэкенд")

@app.get("/health")
def health_check():
    return {"status": "ok", "message": "Чат-бот работает"}

@app.get("/api/check-db")
def check_database():
    try:
        db = SessionLocal()
        result = db.execute("SELECT 1")
        db.close()
        return {"database": "ok", "tables_created": True}
    except Exception as e:
        return {"database": "error", "message": str(e)}

if __name__ == "__main__":                                                                                      
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)