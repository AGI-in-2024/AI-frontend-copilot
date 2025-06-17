# AI-frontend-copilot

Сервис генерации TypeScript/React-кода по текстовому описанию пользователя. Позволяет быстро создавать UI-компоненты с помощью искусственного интеллекта.

## Возможности
- Генерация React-кода по текстовому описанию
- Быстрое улучшение и рефакторинг компонентов
- Автоматическое описание UI
- Визуальный предпросмотр с live-обновлением

## Архитектура проекта
```
AI-frontend-copilot/
├── backend/         # Серверная часть (Flask, LangChain, OpenAI)
├── frontend/        # Веб-интерфейс (Next.js, TailwindCSS)
├── vite-preview-mode/my-app/ # SPA-превью на Vite+React
├── requirements.txt # Python-зависимости для backend
└── README.md       
```

## Быстрый старт

### 1. Клонируйте репозиторий
```bash
git clone https://github.com/AGI-in-2024/AI-frontend-copilot.git
cd AI-frontend-copilot
```

### 2. Запуск backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # или venv\Scripts\activate для Windows
pip install -r requirements.txt
# Укажите OpenAI API ключ в .env:
echo "OPENAI_API_KEY=your_api_key_here" > .env
python app.py
```
Backend будет доступен на http://localhost:5000

### 3. Запуск frontend
```bash
cd ../frontend
npm install
# Создайте .env.local с адресом backend:
echo "NEXT_PUBLIC_BACKEND_URL=http://localhost:5000" > .env.local
npm run dev
```
Frontend будет доступен на http://localhost:3000

### 4. Откройте сервис
Перейдите в браузере по адресу: [http://localhost:3000](http://localhost:3000)

## Основные зависимости
- **Backend:** Flask, Flask-CORS, langchain, faiss-cpu, openai, python-dotenv
- **Frontend:** Next.js, React, TailwindCSS, @radix-ui, axios, codesandbox, prismjs и др.

## Примеры использования
- Введите текстовое описание интерфейса — получите готовый React-компонент.
- Быстро улучшайте или рефакторьте существующий код через AI.

## Структура репозитория
- `backend/` — серверная логика, интеграция с LLM, API
- `frontend/` — клиентская часть, UI, взаимодействие с API
- `vite-preview-mode/my-app/` — отдельное SPA-превью для генерации компонентов

## Контакты
- [GitHub Issues](https://github.com/AGI-in-2024/AI-frontend-copilot/issues) — для багов и предложений

---

> Проект находится в активной разработке. Добро пожаловать к участию и обратной связи!
