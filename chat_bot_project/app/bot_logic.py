from datetime import datetime

def get_bot_response(user_message: str) -> str:
    user_message = user_message.lower()
    
    if "привет" in user_message:
        return "Привет! Как я могу помочь?"
    elif "123" in user_message:
        return "123"
    elif "как дела" in user_message:
        return "У меня всё отлично!"
    elif "помощь" in user_message:
        return "Я могу ответить на вопросы о времени или просто пообщаться."
    elif "время" in user_message:
        return f"Текущее время: {datetime.now().strftime('%H:%M')}"
    elif "спасибо" in user_message:
        return "Пожалуйста! Обращайтесь ещё!"
    elif "пока" in user_message:
        return "До свидания! Хорошего дня!"
    else:
        return "Извините, я не понял ваш вопрос. Можете переформулировать?"