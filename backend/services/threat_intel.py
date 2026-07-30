import os
import requests
import hashlib
import time

def query_virustotal_hash(file_hash):
    """
    Queries VirusTotal v3 API for a file hash.
    Falls back to a realistic simulation if VT_API_KEY is not set.
    """
    api_key = os.environ.get('VT_API_KEY')
    
    if api_key:
        url = f"https://www.virustotal.com/api/v3/files/{file_hash}"
        headers = {"x-apikey": api_key}
        try:
            response = requests.get(url, headers=headers)
            if response.status_code == 200:
                stats = response.json().get('data', {}).get('attributes', {}).get('last_analysis_stats', {})
                malicious = stats.get('malicious', 0)
                if malicious > 0:
                    return "High", f"[VT] {malicious} security vendors flagged this file as malicious."
                return "Low", "[VT] File is known and clean."
        except Exception:
            pass # Fall back to simulation on network error
            
    # Simulation (Intelligent Mock based on common malicious hashes or randomness)
    # We simulate based on the first character of the hash to maintain consistency
    first_char = file_hash[0].lower() if file_hash else '0'
    if first_char in '012345':
        return "High", f"[ThreatIntel] Simulated VT Match: 43/72 security vendors flagged this hash as trojan/ransomware."
    elif first_char in '6789':
        return "Medium", f"[ThreatIntel] Simulated VT Match: 2/72 security vendors flagged this hash as potentially unwanted (PUA)."
    else:
        return "Low", "[ThreatIntel] Simulated VT Match: 0/72 vendors flagged this file."

def query_abuseipdb(ip_address):
    """
    Queries AbuseIPDB API for an IP address.
    Falls back to a realistic simulation if ABUSE_API_KEY is not set.
    """
    api_key = os.environ.get('ABUSE_API_KEY')
    
    # Ignore internal/local IPs
    if ip_address.startswith(('10.', '192.168.', '127.', '172.')):
         return "Low", "Internal IP Address"

    if api_key:
        url = "https://api.abuseipdb.com/api/v2/check"
        querystring = {'ipAddress': ip_address, 'maxAgeInDays': '90'}
        headers = {'Accept': 'application/json', 'Key': api_key}
        try:
            response = requests.get(url, headers=headers, params=querystring)
            if response.status_code == 200:
                score = response.json().get('data', {}).get('abuseConfidenceScore', 0)
                if score > 50:
                    return "High", f"[AbuseIPDB] High confidence of abuse (Score: {score}%)."
                elif score > 0:
                    return "Medium", f"[AbuseIPDB] Some reports of abuse (Score: {score}%)."
                return "Low", "[AbuseIPDB] Clean IP."
        except Exception:
            pass # Fall back to simulation

    # Simulation
    last_octet = ip_address.split('.')[-1] if '.' in ip_address else '0'
    try:
        last_num = int(last_octet)
        if last_num % 4 == 0:
            return "High", f"[ThreatIntel] Simulated AbuseIPDB Match: 100% confidence of abuse (C2/Botnet Activity)."
        elif last_num % 3 == 0:
            return "Medium", f"[ThreatIntel] Simulated AbuseIPDB Match: 25% confidence of abuse (Port Scanning)."
    except:
        pass
        
    return "Low", "[ThreatIntel] Simulated AbuseIPDB Match: Clean IP."
