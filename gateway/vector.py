import faiss
import numpy as np
from sentence_transformers import SentenceTransformer
import uuid

# Load model globally to avoid reloading on every request
# all-MiniLM-L6-v2 is fast and produces 384-dimensional embeddings
try:
    model = SentenceTransformer('all-MiniLM-L6-v2')
    embedding_dim = 384
except Exception as e:
    print(f"Warning: Failed to load SentenceTransformer. Is it installed? {e}")
    model = None
    embedding_dim = 384

# Global FAISS index and metadata mapping
# For a production system this would be persisted to disk or external vector DB
# For this simulator, in-memory is fine and resets automatically
index = faiss.IndexFlatIP(embedding_dim) # Inner Product for Cosine Similarity (assuming normalized vectors)
id_mapping = {} # maps faiss integer ID to cache_entry_id string
current_id = 0

def get_embedding(text: str) -> np.ndarray:
    """Generates an embedding for the given text."""
    if model is None:
        return np.zeros(embedding_dim, dtype=np.float32)
    # Encode and normalize for cosine similarity via Inner Product
    embedding = model.encode([text], normalize_embeddings=True)
    return embedding.astype(np.float32)

def add_to_index(cache_entry_id: str, app_id: str, text: str):
    """Generates an embedding and adds it to the FAISS index."""
    global current_id
    embedding = get_embedding(text)
    index.add(embedding)
    
    # Store the mapping
    # We partition conceptually by app_id, but FAISS FlatIP searches the whole index.
    # We'll store app_id in the mapping and filter post-search.
    id_mapping[current_id] = {
        "cache_entry_id": cache_entry_id,
        "app_id": app_id
    }
    current_id += 1

def search_cache(app_id: str, text: str, threshold: float = 0.90) -> dict:
    """
    Searches the index for a similar prompt within the same app_id.
    Returns the cache_entry_id and similarity_score if a hit is found above threshold, else None.
    """
    if index.ntotal == 0:
        return None
        
    embedding = get_embedding(text)
    # Search top 5 to give room for filtering by app_id
    k = min(5, index.ntotal)
    distances, indices = index.search(embedding, k)
    
    for idx, distance in zip(indices[0], distances[0]):
        if idx == -1: continue # FAISS returns -1 if not enough results
        
        metadata = id_mapping.get(idx)
        if not metadata: continue
        
        # Partition by App ID
        if metadata["app_id"] == app_id:
            similarity = float(distance)
            if similarity >= threshold:
                return {
                    "cache_entry_id": metadata["cache_entry_id"],
                    "similarity_score": similarity
                }
            else:
                # Top result within the app is below threshold, no need to check others
                # (Assuming distances are sorted descending for Inner Product)
                return None
                
    return None

def clear_index():
    """Clears the FAISS index and mappings. Used for Demo Reset."""
    global index, id_mapping, current_id
    index = faiss.IndexFlatIP(embedding_dim)
    id_mapping = {}
    current_id = 0
