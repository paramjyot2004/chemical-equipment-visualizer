
# Chemical Equipment Parameter Visualizer

A full-stack industrial parameter visualizer with real-time sync via Django Channels.

## 🚀 Setup Instructions

### 1. Backend (Django + Channels)
1. Install dependencies: 
   ```bash
   pip install django djangorestframework django-cors-headers pandas reportlab channels channels_redis
   ```
2. Configure `settings.py`:
   - Add `'channels'` to `INSTALLED_APPS`.
   - Set `ASGI_APPLICATION = 'your_project_name.asgi.application'`.
   - Configure a Channel Layer (use `InMemoryChannelLayer` for local dev or Redis for production).
3. Ensure the `asgi.py` routing includes the websocket protocol.
4. Run: `python manage.py makemigrations` and `python manage.py migrate`.
5. Start server: `python manage.py runserver`

### 2. Web Frontend (React)
1. Communicates via REST at `localhost:8000/api` and WebSockets at `ws://localhost:8000/ws/updates/`.
2. Automatically refreshes charts when the backend signals a change.

### 3. Desktop Application (PyQt5)
1. Install dependencies: 
   ```bash
   pip install PyQt5 requests matplotlib pandas websocket-client
   ```
2. Run: `python desktop/app.py`
3. Features a background thread listening to the WebSocket for zero-lag updates.

## 📊 Features
- **Real-time Sync**: Upload data in the web app, see it instantly appear on the desktop (and vice-versa).
- **CSV Data Ingestion**: Bulk upload equipment parameters.
- **Reporting**: One-click PDF report generation.
- **History**: Last 5 upload sessions tracked in SQLite.

## 🛠 Tech Stack
- **Backend**: Django + DRF + Channels
- **Web**: React 18 + Recharts
- **Desktop**: PyQt5 + Matplotlib
- **Auth**: HTTP Basic Auth
