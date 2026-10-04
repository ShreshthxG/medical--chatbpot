# PulseAI – Medical RAG Chatbot

A medical question-answering chatbot. Answers are grounded in a medical book (PDF) using
LangChain, HuggingFace embeddings (all-MiniLM-L6-v2), a Pinecone vector index and a Groq LLM.
The frontend is plain HTML/CSS/JS.

> General health information only, not a diagnosis. In an emergency, call your local emergency number.

## Structure
- `app.py` – Flask backend (`POST /chat` → `{ reply, sources }`)
- `index.html`, `style.css`, `script.js` – frontend

## Setup
1. `pip install -r requirements.txt`
2. Copy `.env.example` to `.env` and add your Pinecone and Groq keys
3. Make sure the Pinecone index `medical-chatbot` already exists and contains your book chunks
4. `python app.py`
5. Open `index.html` in your browser (or run `python -m http.server 8000` and visit `http://localhost:8000`)

## Configuration
- Backend URL: `API_URL` at the top of `script.js`
- Index name and Groq model: top of `app.py`
