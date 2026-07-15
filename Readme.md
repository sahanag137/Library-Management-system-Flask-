# 📚 LibraryPro - Library Management System

A modern, full-stack Library Management System featuring a sleek, minimalist Ivory & Black aesthetic. Built with a decoupled architecture using a Python Flask REST API backend and a pure HTML/CSS/Vanilla JS frontend.

## ✨ Features

* **Beautiful UI/UX:** Premium monochrome aesthetic with smooth CSS transitions, glassmorphism elements, and micro-animations.
* **RESTful API:** Robust Python backend using Flask and SQLAlchemy.
* **Zero-Setup Database:** Uses SQLite for easy deployment without complex database configuration.
* **Authentication:** Secure session-based admin login system.
* **Dashboard Analytics:** Visual statistics and overview of library operations.
* **Book & Member Management:** Add, track, and manage books and library members.

## 💻 Tech Stack

**Frontend:**
* HTML5
* CSS3 (Custom Minimalist Ivory/Black Theme)
* Vanilla JavaScript (ES6+ `fetch` API)

**Backend:**
* Python 3
* Flask & Flask-CORS
* SQLAlchemy (ORM)
* SQLite (Database)
* Werkzeug (Security & Hashing)

---

## 🚀 Getting Started

Follow these instructions to get a copy of the project up and running on your local machine.

### 1. Backend Setup

Open your terminal and navigate to the backend directory:
`cd backend`

Create and activate a virtual environment:

**Windows:**
`python -m venv venv`
`venv\Scripts\activate`

**Mac/Linux:**
`python3 -m venv venv`
`source venv/bin/activate`

Install the required Python packages:
`pip install Flask Flask-SQLAlchemy Flask-CORS PyMySQL Werkzeug cryptography`

Start the Flask server:
`python app.py`

*(The backend will automatically create the `library.db` database and seed the default admin account on its first run).*

### 2. Frontend Setup

1. Leave the backend running in its terminal.
2. Open the `frontend` directory in VS Code.
3. Right-click on `index.html` and select **"Open with Live Server"**.
4. The website will automatically launch in your default web browser.

### 🔐 Default Login Credentials

Use these credentials to access the system upon first launch:
* **Username:** `admin`
* **Password:** `admin123`

---

## 🤝 Contributing
Contributions, issues, and feature requests are welcome! Feel free to check the issues page.

 