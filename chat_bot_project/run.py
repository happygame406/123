import uvicorn
import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

if __name__ == "__main__":
    print("Запуск чат-бота...")
    print("Доступные адреса:")
    print("  - API: http://127.0.0.1:8000")
    print("  - Frontend: http://127.0.0.1:8000")
    print("  - API документация: http://127.0.0.1:8000/docs")
    print("\nДля остановки нажмите Ctrl+C")
    
    uvicorn.run(
        "app.main:app",
        host="127.0.0.1",
        port=8000,
        reload=True,
        log_level="info"
    )