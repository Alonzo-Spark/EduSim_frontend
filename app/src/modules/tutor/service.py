import re
import json
import time
from pathlib import Path
from typing import List, Dict, Any
from rag.retriever import get_retriever
import pickle
import faiss
from sentence_transformers import SentenceTransformer
import os
from dotenv import load_dotenv
from app.src.modules.shared.gemini_service import generate_text


load_dotenv(Path(__file__).resolve().parents[4] / ".env")

# RAG Setup
_retriever = None
_embeddings_model = None


def _empty_tutor_payload(message: str):
    return {
        "title": "Generation Failed",
        "description": "",
        "formula": "",
        "related_concepts": [],
        "related_formulas": [],
        "ai_explanation": message,
        "sources": [],
        "queryType": "concept",
        "concepts": [],
        "formulas": [],
        "explanation": message,
        "ragContent": [],
    }

def get_rag_components():
    global _retriever, _embeddings_model
    if _retriever is None:
        try:
            # Load FAISS index and metadata
            index = faiss.read_index("faiss_index/index.faiss")
            with open("faiss_index/metadata.pkl", "rb") as f:
                metadata = pickle.load(f)
            
            _embeddings_model = SentenceTransformer('all-MiniLM-L6-v2')
            _retriever = get_retriever(index, metadata, _embeddings_model)
        except Exception as e:
            print(f"⚠️ RAG Initialization Warning: {e}")
            return None, None
    return _retriever, _embeddings_model

def analyze_with_llm(query: str, context: str) -> Dict[str, Any]:
    """
    Uses LLM to extract physics concepts, formulas, query type, and explanation from the context.
    """
    system_prompt = (
        "You are an intelligent physics textbook tutor. Analyze the user's query and the provided Context.\n\n"
        "1. Determine the 'queryType': 'concept', 'formula', or 'mixed'.\n"
        "2. Extract 'concepts': list of related physics topics from the context.\n"
        "3. Extract 'formulas': find relevant formulas in the context. IF the query is a concept but has fundamental formulas (like F=ma for force) not present in context, you MUST include them from your knowledge. Provide formula, name, topic, meaning.\n"
        "4. Generate an 'explanation' answering the query based on the context.\n\n"
        "Return ONLY a valid JSON object:\n"
        "{\n"
        "  \"queryType\": \"string\",\n"
        "  \"concepts\": [\"string\"],\n"
        "  \"formulas\": [\n"
        "    {\"formula\": \"string\", \"name\": \"string\", \"topic\": \"string\", \"meaning\": \"string\"}\n"
        "  ],\n"
        "  \"explanation\": \"string\"\n"
        "}\n"
    )
    
    user_prompt = f"Context:\n{context}\n\nQuery:\n{query}"
    
    try:
        final_prompt = f"{system_prompt}\n\n{user_prompt}\n\nReturn only the JSON object."
        response_text = generate_text(final_prompt, temperature=0.2, max_output_tokens=2048, cache_namespace="tutor.analysis")
        if not response_text:
            return _empty_tutor_payload("Gemini returned an empty response.")

        json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
        if json_match:
            print("Gemini generation completed: tutor analysis")
            parsed = json.loads(json_match.group())
            return {
                **parsed,
                "title": parsed.get("title", "AI Tutor Response"),
                "description": parsed.get("description", ""),
                "formula": parsed.get("formula", ""),
                "related_concepts": parsed.get("concepts", []),
                "related_formulas": parsed.get("formulas", []),
                "ai_explanation": parsed.get("explanation", ""),
                "sources": parsed.get("sources", []),
            }

        return _empty_tutor_payload("Gemini returned an invalid JSON response.")
    except Exception as e:
        print("Gemini Generation Error:", str(e))
        return _empty_tutor_payload(f"Gemini generation failed: {str(e)}")

def analyze_tutor_query(query: str) -> Dict[str, Any]:
    # 1. RAG Retrieval First
    request_started = time.perf_counter()
    print("Gemini request started: tutor retrieval")
    retriever, _ = get_rag_components()
    rag_content = []
    context = ""
    retrieval_started = time.perf_counter()
    
    if retriever:
        docs = retriever(query)
        # Format RAG content for frontend
        for doc in docs[:5]: # Top 5
            source = os.path.basename(doc.get("source", "Textbook"))
            content = doc.get("text", "").strip()
            
            # Clean up text
            content = re.sub(r'\s+', ' ', content)
            if len(content) > 400:
                content = content[:400] + "..."

            rag_content.append({
                "title": source,
                "content": content
            })
            
            context += f"{content}\n\n"
        print(f"Gemini retrieval completed: {len(rag_content)} chunks")
    else:
        context = "No textbook context available."

    retrieval_time = time.perf_counter() - retrieval_started
    print(f"Retrieval time: {retrieval_time:.2f}s")
    print("Retrieved Context:", context)

    if not query or len(query.strip()) < 2:
        return _empty_tutor_payload("Query is too short for Gemini generation.")

    # 2. Use LLM for intelligent extraction based on context
    structured = analyze_with_llm(query, context)

    if not context.strip():
        context = "No textbook context available."

    # 3. Generate the explanation with Gemini using the same textbook context
    explanation_prompt = (
        "You are an intelligent physics textbook tutor. Use the retrieved textbook context to answer the student's query. "
        "Keep the explanation accurate, concise, and educational.\n\n"
        f"Context:\n{context}\n\n"
        f"Query:\n{query}\n\n"
        "Respond with a clear explanation and include relevant formulas when appropriate."
    )
    try:
        explanation_started = time.perf_counter()
        print("Gemini request started: tutor explanation")
        rag_explanation = generate_text(
            explanation_prompt,
            temperature=0.2,
            max_output_tokens=2048,
            cache_namespace="tutor.explanation",
        )
        if not rag_explanation:
            rag_explanation = "Gemini returned an empty response."
        else:
            print("Gemini generation completed: tutor explanation")

        explanation_time = time.perf_counter() - explanation_started
        print(f"Gemini generation time: {explanation_time:.2f}s")
    except Exception as e:
        print("Gemini Generation Error:", str(e))
        rag_explanation = f"Gemini generation failed: {str(e)}"

    total_time = time.perf_counter() - request_started
    print(f"Total request time: {total_time:.2f}s")

    concepts = structured.get("concepts", [])
    formulas = structured.get("formulas", [])
    if isinstance(formulas, list) and formulas and isinstance(formulas[0], dict):
        first_formula = formulas[0].get("formula", "")
    elif isinstance(formulas, list) and formulas:
        first_formula = formulas[0]
    else:
        first_formula = ""

    explanation_text = rag_explanation or structured.get("explanation", "")
    
    return {
        "title": structured.get("title", "AI Tutor Response"),
        "description": structured.get("description", query),
        "formula": first_formula,
        "related_concepts": concepts,
        "related_formulas": formulas,
        "ai_explanation": explanation_text,
        "sources": rag_content[:3],
        "queryType": structured.get("queryType", "concept"),
        "concepts": concepts,
        "formulas": formulas,
        "explanation": explanation_text,
        "ragContent": rag_content[:3], # Send top 3 to frontend
    }
