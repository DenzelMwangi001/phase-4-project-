# SkillSwap 🤝🌍

SkillSwap is a full-stack web platform where users can exchange skills through swap requests. Whether you're offering cooking lessons or seeking coding help, SkillSwap connects you with others looking to grow — together.

---

## 🚀 Features

- 🔐 **User Authentication (JWT)**  
  Sign up, log in, and manage your session securely using JSON Web Tokens.

- 🎯 **Skill Sharing System**  
  Post a skill, describe it, and share what you know.

- 🔍 **Search Bar**  
  Quickly find skills by name using the live search bar.

- 🔄 **Skill Swap Requests**  
  Request to swap with others, send a message, and wait for acceptance or rejection.

- ✅ **Swap Request Management**  
  Accept or reject incoming requests from your dashboard.

- 📧 **Connect After Acceptance**  
  Once a request is accepted, both users can view each other's email to connect externally.

- 🧾 **User Profile Modal**  
  View your posted skills, sent swaps, and received swap requests in one clean interface.

---

## 🛠 Tech Stack

**Frontend**
- HTML, CSS, JavaScript (Vanilla)
- Modal popups and clean UI design

**Backend**
- Flask + Flask-CORS + SQLAlchemy
- JWT-based authentication
- RESTful API structure

**Database**
- SQLite (for development)

---


Backend Setup (Flask)

python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
flask db init
flask db migrate
flask db upgrade
flask run
Frontend
Just open index.html in your browser.

You may also host it using Netlify, GitHub Pages, or Render.

📦 API Endpoints
Method	Endpoint	Description
POST	/signup	Register new user
POST	/login	Login existing user
GET	/skills	Get all posted skills
POST	/skills	Post new skill (auth required)
POST	/swaps	Send swap request (auth)
GET	`/swaps?type=sent	received`
PATCH	/swaps/<id>	Accept/Reject a swap
