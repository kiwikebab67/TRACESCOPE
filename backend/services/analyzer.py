import hashlib
import math
import pefile

def calculate_md5(filepath):
    """Calculates the MD5 hash of a file."""
    hash_md5 = hashlib.md5()
    with open(filepath, "rb") as f:
        for chunk in iter(lambda: f.read(4096), b""):
            hash_md5.update(chunk)
    return hash_md5.hexdigest()

def evaluate_log_risk(event_id, source):
    """Evaluates risk levels for log events."""
    if event_id in [4624, 4625]:
        return "Medium", "Logon/Logoff activity detected."
    if event_id == 1102:
        return "High", "Security log cleared!"
    return "Informational", "Standard System Activity Metric Record"

def analyze_malware_file(filepath, filename):
    """Analyzes a file using pefile and entropy analysis."""
    results = {"is_suspicious": False, "notes": []}
    
    # 1. PE Header Analysis
    try:
        pe = pefile.PE(filepath)
        results["notes"].append("Valid PE file detected.")
        
        # Check for suspicious imports
        suspicious_imports = [b"CreateRemoteThread", b"WriteProcessMemory", b"VirtualAllocEx", b"InternetOpen"]
        if hasattr(pe, 'DIRECTORY_ENTRY_IMPORT'):
            for entry in pe.DIRECTORY_ENTRY_IMPORT:
                for imp in entry.imports:
                    if imp.name in suspicious_imports:
                        results["is_suspicious"] = True
                        results["notes"].append(f"Suspicious Import: {imp.name.decode()}")
    except Exception:
        results["notes"].append("Not a valid PE file or header corrupted.")

    # 2. Entropy Check
    with open(filepath, "rb") as f:
        data = f.read()
        if len(data) > 0:
            entropy = sum([-(b/len(data)) * math.log(b/len(data), 2) for b in [data.count(i) for i in range(256)] if b > 0])
            if entropy > 7.0:
                results["is_suspicious"] = True
                results["notes"].append(f"High Entropy detected: {entropy:.2f}")

    return results