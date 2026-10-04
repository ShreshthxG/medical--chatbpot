"""
Flask wrapper for your RAG pipeline (HuggingFace embeddings + Pinecone + Groq).
Run:  pip install flask flask-cors langchain-huggingface langchain-pinecone langchain-groq python-dotenv
      export PINECONE_API_KEY=...   export GROQ_API_KEY=...
      python app.py
Then open medical-chatbot.html in your browser.
"""
import os
from dotenv import load_dotenv
from flask import Flask, request, jsonify
from flask_cors import CORS
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_pinecone import PineconeVectorStore
from langchain_groq import ChatGroq

load_dotenv()

INDEX_NAME = "medical-chatbot"          # same index you created in the notebook
GROQ_MODEL = "llama-3.3-70b-versatile"  # change to any Groq model you use

embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
store = PineconeVectorStore.from_existing_index(index_name=INDEX_NAME, embedding=embeddings)
retriever = store.as_retriever(search_kwargs={"k": 3})
llm = ChatGroq(model=GROQ_MODEL, temperature=0.2)

SYSTEM = (
    "You are a careful medical information assistant. Answer ONLY from the context below. "
    "If the context does not contain the answer, say you don't know. Keep answers clear and short, "
    "do not diagnose, and suggest seeing a doctor for personal or urgent concerns.\n\nContext:\n{context}"
)

app = Flask(__name__)
CORS(app)


@app.post("/chat")
def chat():
    question = (request.get_json(silent=True) or {}).get("message", "").strip()
    if not question:
        return jsonify(error="Empty message"), 400

    docs = retriever.invoke(question)
    context = "\n\n".join(d.page_content for d in docs)
    answer = llm.invoke([
        ("system", SYSTEM.format(context=context)),
        ("human", question),
    ]).content

    sources, seen = [], set()
    for d in docs:
        page = int(d.metadata.get("page", 0)) + 1          # PyPDFLoader pages are 0-indexed
        file = os.path.basename(d.metadata.get("source", "Medical_book.pdf"))
        if (file, page) not in seen:
            seen.add((file, page))
            sources.append({"file": file, "page": page})

    return jsonify(reply=answer, sources=sources)


if __name__ == "__main__":
    app.run(port=5000, debug=True)
