import requests
import json

def analyze_payload_with_ollama(payload, model="llama3", ollama_url="http://localhost:11434/api/generate"):
    """
    Connects to a local Ollama instance to de-obfuscate and analyze malicious code payloads.
    """
    system_prompt = (
        "You are TraceScope AI, an elite cybersecurity incident response and reverse engineering agent. "
        "Your task is to analyze the following potentially obfuscated payload (PowerShell, Bash, or Assembly). "
        "1. De-obfuscate the code if necessary. "
        "2. Identify any Command and Control (C2) callbacks, dropped files, or persistence mechanisms. "
        "3. Provide a concise, highly technical summary of the execution intent. "
        "4. Assign a Risk Rating (Low, Medium, High, Critical). "
        "Format your output clearly."
    )
    
    prompt = f"{system_prompt}\n\n[PAYLOAD BEGIN]\n{payload}\n[PAYLOAD END]"
    
    try:
        response = requests.post(
            ollama_url,
            json={
                "model": model,
                "prompt": prompt,
                "stream": False
            },
            timeout=120
        )
        
        if response.status_code == 200:
            result = response.json()
            return {
                "status": "success",
                "analysis": result.get("response", "No response generated."),
                "model_used": model
            }
        else:
            return {
                "status": "error",
                "message": f"Ollama API Error: {response.status_code} - {response.text}"
            }
            
    except requests.exceptions.ConnectionError:
        return {
            "status": "error",
            "message": "Failed to connect to local Ollama instance. Is Ollama running on localhost:11434?"
        }
    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }
