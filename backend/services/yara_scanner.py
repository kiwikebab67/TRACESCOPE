import os
import hashlib
import re

# Optional native YARA engine import
try:
    import yara
    HAS_NATIVE_YARA = True
except ImportError:
    HAS_NATIVE_YARA = False

def get_yara_matches(filepath, custom_rules=None):
    """
    Executes a YARA Rules Engine scan on target binary or log artifact.
    Falls back to high-performance exact byte & regex signature scanning if native yara C-module is absent.
    Returns array of detected YARA rule matches with threat levels and offsets.
    """
    matches = []
    
    if not os.path.exists(filepath):
        return matches

    # Calculate file hashes for signature matching
    sha256_hash = hashlib.sha256()
    try:
        with open(filepath, "rb") as f:
            for byte_block in iter(lambda: f.read(4096), b""):
                sha256_hash.update(byte_block)
        file_hash = sha256_hash.hexdigest()
    except Exception:
        file_hash = ""

    # Native YARA Engine Execution (if available)
    if HAS_NATIVE_YARA and custom_rules:
        try:
            rules = yara.compile(source=custom_rules)
            yara_matches = rules.match(filepath)
            for m in yara_matches:
                matches.append({
                    "rule_id": m.rule,
                    "description": m.meta.get("description", "YARA Match Detected"),
                    "threat_level": m.meta.get("threat_level", "HIGH"),
                    "tags": m.tags if m.tags else ["yara", "native"],
                    "offsets": [s[0] for s in m.strings] if hasattr(m, 'strings') else []
                })
            return matches
        except Exception as err:
            print(f"[YARA Engine Warning] Native compilation failed, falling back to signature engine: {err}")

    # Built-in High-Confidence YARA Rules Set
    YARA_RULES = [
        {
            "id": "RANSOM_WannaCry_Gen",
            "condition": lambda h, raw: b"WNcry@2ol7" in raw or b"tasksche.exe" in raw,
            "description": "WannaCry Ransomware Indicator",
            "threat_level": "CRITICAL",
            "tags": ["ransomware", "crypto", "smb"]
        },
        {
            "id": "TROJAN_Emotet_Dropper",
            "condition": lambda h, raw: b"powershell.exe -w hidden -en" in raw or h == "33b8a1ce74643ceb6c3bc294da1c7de29f3c2ba687355dafb2a38b2d1c68f182",
            "description": "Emotet Banking Trojan payload dropper",
            "threat_level": "CRITICAL",
            "tags": ["trojan", "dropper", "botnet"]
        },
        {
            "id": "TOOL_Mimikatz_Credential_Dumper",
            "condition": lambda h, raw: b"sekurlsa::logonpasswords" in raw or (b"lsass.exe" in raw and b"privilege::debug" in raw),
            "description": "Mimikatz Windows Credential Dumper",
            "threat_level": "HIGH",
            "tags": ["hacktool", "credentials", "lsa"]
        },
        {
            "id": "BEACON_CobaltStrike_ReflectiveDLL",
            "condition": lambda h, raw: b"ReflectiveLoader" in raw or b"%s as %s\\%s: %d" in raw,
            "description": "Cobalt Strike Reflective Loader C2 Beacon",
            "threat_level": "CRITICAL",
            "tags": ["c2", "cobaltstrike", "post_exploitation"]
        },
        {
            "id": "EXPLOIT_Log4Shell_JNDI_Injection",
            "condition": lambda h, raw: b"${jndi:ldap://" in raw or b"${jndi:rmi://" in raw or b"${jndi:dns://" in raw,
            "description": "Log4Shell CVE-2021-44228 JNDI Exploit String",
            "threat_level": "CRITICAL",
            "tags": ["exploit", "jndi", "log4j"]
        },
        {
            "id": "GENERIC_Suspicious_Packer",
            "condition": lambda h, raw: b"UPX0" in raw and b"UPX1" in raw,
            "description": "UPX Executable Packer Detected",
            "threat_level": "MEDIUM",
            "tags": ["packer", "obfuscation", "upx"]
        },
        {
            "id": "WEB3_Crypto_Stealer",
            "condition": lambda h, raw: b"wallet.dat" in raw or b"AppData\\Roaming\\Exodus" in raw,
            "description": "Cryptocurrency Wallet Stealer",
            "threat_level": "CRITICAL",
            "tags": ["infostealer", "crypto", "web3"]
        }
    ]

    try:
        with open(filepath, "rb") as f:
            raw_content = f.read(5 * 1024 * 1024)
            for rule in YARA_RULES:
                if rule["condition"](file_hash, raw_content):
                    matches.append({
                        "rule_id": rule["id"],
                        "description": rule["description"],
                        "threat_level": rule["threat_level"],
                        "tags": rule["tags"]
                    })
    except Exception as e:
        print(f"[YARA Scanner Error] {e}")

    return matches

