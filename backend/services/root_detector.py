import re

def parse_build_prop(build_prop_content: str):
    """
    Parses an Android build.prop file to detect custom ROMs, rooted test-keys,
    and insecure adb configurations.
    """
    findings = []
    is_rooted = False
    score = 100

    # Split lines and ignore comments
    lines = build_prop_content.splitlines()
    props = {}
    
    for line in lines:
        line = line.strip()
        if not line or line.startswith('#'):
            continue
        if '=' in line:
            key, val = line.split('=', 1)
            props[key.strip()] = val.strip()

    # 1. Check ro.build.tags (Most definitive proof of custom ROM / Root)
    build_tags = props.get('ro.build.tags', '')
    if 'test-keys' in build_tags:
        is_rooted = True
        score -= 50
        findings.append({
            "indicator": "ro.build.tags = test-keys",
            "description": "CRITICAL: Device is running a custom ROM or engineering build. Cryptographic signature checks are disabled.",
            "risk": "High"
        })
    elif 'release-keys' in build_tags:
        findings.append({
            "indicator": "ro.build.tags = release-keys",
            "description": "Secure: Device is running a production build.",
            "risk": "Low"
        })

    # 2. Check ro.secure
    secure_flag = props.get('ro.secure', '')
    if secure_flag == '0':
        is_rooted = True
        score -= 20
        findings.append({
            "indicator": "ro.secure = 0",
            "description": "HIGH: adbd runs as root by default. This is a severe security vulnerability.",
            "risk": "High"
        })

    # 3. Check ro.debuggable
    debuggable_flag = props.get('ro.debuggable', '')
    if debuggable_flag == '1':
        score -= 10
        findings.append({
            "indicator": "ro.debuggable = 1",
            "description": "MEDIUM: System is globally debuggable. Attackers can attach debuggers to any process.",
            "risk": "Medium"
        })

    # 4. Check ro.adb.secure
    adb_secure = props.get('ro.adb.secure', '')
    if adb_secure == '0':
        score -= 10
        findings.append({
            "indicator": "ro.adb.secure = 0",
            "description": "MEDIUM: ADB does not require authentication. Anyone with physical access can push/pull files.",
            "risk": "Medium"
        })

    if not findings:
        findings.append({
            "indicator": "No Anomalies",
            "description": "The build.prop file appears standard with no glaring root indicators.",
            "risk": "Low"
        })

    # Ensure score doesn't go below 0
    score = max(0, score)

    return {
        "is_rooted": is_rooted,
        "integrity_score": score,
        "findings": findings,
        "device_model": props.get('ro.product.model', 'Unknown'),
        "android_version": props.get('ro.build.version.release', 'Unknown')
    }

def scan_filesystem_for_root(paths: list):
    """
    Scans a list of file paths (from a system dump or adb shell ls -R) 
    for known root binaries and root management apps.
    """
    findings = []
    is_rooted = False
    score = 100

    known_su_paths = [
        "/system/bin/su",
        "/system/xbin/su",
        "/sbin/su",
        "/data/local/xbin/su",
        "/data/local/bin/su",
        "/system/sd/xbin/su",
        "/system/bin/failsafe/su",
        "/data/local/su"
    ]

    magisk_paths = [
        "/sbin/magisk",
        "/data/adb/magisk",
        "/data/adb/modules",
        "/init.magisk.rc"
    ]

    for path in paths:
        # Check for su binary
        if path in known_su_paths or path.endswith("/su"):
            is_rooted = True
            score -= 40
            findings.append({
                "indicator": f"su Binary Found: {path}",
                "description": "CRITICAL: The 'su' (SuperUser) binary grants administrative privileges to applications.",
                "risk": "High"
            })
            
        # Check for Magisk
        if any(m in path for m in magisk_paths):
            is_rooted = True
            score -= 40
            findings.append({
                "indicator": f"Magisk Artifact Found: {path}",
                "description": "CRITICAL: Magisk (systemless root) framework detected.",
                "risk": "High"
            })
            
        # Check for root management APKs
        if "Superuser.apk" in path or "MagiskManager.apk" in path:
            score -= 20
            findings.append({
                "indicator": f"Root Manager APK: {path}",
                "description": "HIGH: A root management application is installed.",
                "risk": "High"
            })

    # Deduplicate findings based on indicator
    unique_findings = list({f["indicator"]: f for f in findings}.values())

    score = max(0, score)
    return {
        "is_rooted": is_rooted,
        "integrity_score": score,
        "findings": unique_findings
    }
