import os
import re
import socket
import urllib.parse
import datetime
import requests

HIGH_RISK_TLDS = {
    '.top', '.xyz', '.click', '.buzz', '.country', '.kim', '.science', '.gq', 
    '.work', '.loan', '.stream', '.tk', '.ml', '.ga', '.cf', '.cc', '.su', '.ru'
}

SUSPICIOUS_KEYWORDS = [
    'login', 'signin', 'verify', 'account', 'banking', 'secure', 'update', 
    'wallet', 'paypal', 'metamask', 'binance', 'coinbase', 'security', 
    'auth', 'password', 'credential', 'recover', 'free', 'airdrop', 'bonus'
]

TARGET_BRANDS = {
    'paypal': 'PayPal Inc.',
    'metamask': 'ConsenSys MetaMask',
    'binance': 'Binance Crypto Exchange',
    'coinbase': 'Coinbase Inc.',
    'microsoft': 'Microsoft 365 / Azure',
    'google': 'Google Accounts',
    'apple': 'Apple ID',
    'amazon': 'Amazon Services',
    'netflix': 'Netflix Accounts',
    'chase': 'JPMorgan Chase Bank',
    'wellsfargo': 'Wells Fargo Bank'
}

def scan_url(target_url, vt_api_key=None):
    raw_url = target_url.strip()
    if not raw_url.startswith(('http://', 'https://')):
        raw_url = 'http://' + raw_url
        
    parsed = urllib.parse.urlparse(raw_url)
    hostname = parsed.hostname or parsed.netloc or ''
    port = parsed.port or (443 if parsed.scheme == 'https' else 80)
    path = parsed.path or '/'
    
    findings = []
    risk_score = 10
    
    is_ip_host = bool(re.match(r'^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$', hostname))
    if is_ip_host:
        risk_score += 35
        findings.append("URL uses a raw IP address instead of a standard domain name (common in drive-by malware).")

    is_punycode = hostname.startswith('xn--') or 'xn--' in hostname
    if is_punycode:
        risk_score += 40
        findings.append("IDN Homograph / Punycode domain detected (`xn--`), indicating visual domain spoofing.")

    matched_tld = next((tld for tld in HIGH_RISK_TLDS if hostname.endswith(tld)), None)
    if matched_tld:
        risk_score += 25
        findings.append(f"Domain registered under high-risk abuse TLD (`{matched_tld}`).")

    impersonated_brand = None
    for brand, brand_name in TARGET_BRANDS.items():
        if brand in hostname.lower() and not hostname.lower().endswith(f"{brand}.com") and not hostname.lower().endswith(f"{brand}.org"):
            impersonated_brand = brand_name
            risk_score += 35
            findings.append(f"Potential Brand Impersonation: Domain mimics **{brand_name}** (`{hostname}`).")
            break

    found_keywords = [kw for kw in SUSPICIOUS_KEYWORDS if kw in raw_url.lower()]
    if found_keywords:
        risk_score += min(len(found_keywords) * 15, 30)
        findings.append(f"Suspicious credential/phishing keywords identified: `{', '.join(found_keywords)}`")

    subdomain_count = len(hostname.split('.')) - 2
    if subdomain_count >= 3:
        risk_score += 20
        findings.append(f"Excessive subdomain nesting ({subdomain_count} subdomains) used for visual deception.")

    resolved_ip = "Unresolved"
    dns_status = "Failed"
    try:
        resolved_ip = socket.gethostbyname(hostname)
        dns_status = "Active A-Record"
    except Exception:
        findings.append("DNS A-Record lookup failed (domain may be dormant or sinkholed).")

    vt_key = vt_api_key or os.environ.get('VT_API_KEY')
    vt_stats = {"malicious": 0, "suspicious": 0, "harmless": 0}
    
    if vt_key:
        try:
            url_id = urllib.parse.quote(raw_url, safe='')
            vt_resp = requests.get(
                f"https://www.virustotal.com/api/v3/urls/{url_id}",
                headers={"x-apikey": vt_key, "accept": "application/json"},
                timeout=5
            )
            if vt_resp.status_code == 200:
                vt_data = vt_resp.json()
                vt_stats = vt_data.get('data', {}).get('attributes', {}).get('last_analysis_stats', vt_stats)
                if vt_stats.get('malicious', 0) > 0:
                    risk_score += min(vt_stats['malicious'] * 15, 50)
                    findings.append(f"VirusTotal Blacklist: {vt_stats['malicious']} security vendors flagged this URL as malicious.")
        except Exception:
            pass

    risk_score = min(max(risk_score, 5), 100)
    
    if risk_score >= 70:
        verdict = "MALICIOUS / PHISHING"
        verdict_color = "red"
    elif risk_score >= 40:
        verdict = "SUSPICIOUS"
        verdict_color = "amber"
    else:
        verdict = "SAFE / LOW RISK"
        verdict_color = "green"

    return {
        "status": "success",
        "url": raw_url,
        "hostname": hostname,
        "scheme": parsed.scheme.upper(),
        "resolved_ip": resolved_ip,
        "dns_status": dns_status,
        "risk_score": risk_score,
        "verdict": verdict,
        "verdict_color": verdict_color,
        "impersonated_brand": impersonated_brand or "None Detected",
        "findings": findings if findings else ["Standard domain structure with no overt phishing heuristics detected."],
        "virustotal_detections": vt_stats,
        "timestamp": datetime.datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')
    }
