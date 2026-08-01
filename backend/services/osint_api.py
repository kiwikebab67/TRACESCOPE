import requests

def get_geolocation(ip_address):
    """
    Queries the free ip-api.com service for REAL geographical data of an IP address.
    No API key required for up to 45 requests/minute.
    """
    try:
        url = f"http://ip-api.com/json/{ip_address}?fields=status,message,country,countryCode,regionName,city,lat,lon,isp,org,as,query"
        response = requests.get(url, timeout=5)
        if response.status_code == 200:
            data = response.json()
            if data.get("status") == "success":
                return {
                    "status": "success",
                    "ip": data.get("query"),
                    "country": data.get("country"),
                    "city": data.get("city"),
                    "lat": data.get("lat"),
                    "lon": data.get("lon"),
                    "isp": data.get("isp"),
                    "org": data.get("org"),
                    "asn": data.get("as")
                }
            else:
                return {"status": "error", "message": data.get("message", "Invalid IP Address")}
        return {"status": "error", "message": f"API returned {response.status_code}"}
    except Exception as e:
        return {"status": "error", "message": str(e)}

def get_dns_records(domain):
    """
    Queries HackerTarget's free API for REAL DNS records of a domain.
    """
    try:
        url = f"https://api.hackertarget.com/dnslookup/?q={domain}"
        response = requests.get(url, timeout=5)
        if response.status_code == 200:
            text_data = response.text
            if "error" in text_data.lower() or "invalid" in text_data.lower():
                 return {"status": "error", "message": text_data.strip()}
            return {
                "status": "success",
                "domain": domain,
                "raw_records": text_data.strip()
            }
        return {"status": "error", "message": f"API returned {response.status_code}"}
    except Exception as e:
        return {"status": "error", "message": str(e)}
