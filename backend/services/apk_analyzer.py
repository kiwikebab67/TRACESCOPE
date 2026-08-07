import os
from pyaxmlparser import APK

# List of commonly abused dangerous permissions
DANGEROUS_PERMISSIONS = {
    "android.permission.RECEIVE_SMS": "High",
    "android.permission.READ_SMS": "High",
    "android.permission.SEND_SMS": "High",
    "android.permission.READ_CONTACTS": "High",
    "android.permission.WRITE_CONTACTS": "Medium",
    "android.permission.READ_CALL_LOG": "High",
    "android.permission.WRITE_CALL_LOG": "Medium",
    "android.permission.RECORD_AUDIO": "High",
    "android.permission.CAMERA": "High",
    "android.permission.ACCESS_FINE_LOCATION": "Medium",
    "android.permission.ACCESS_BACKGROUND_LOCATION": "High",
    "android.permission.SYSTEM_ALERT_WINDOW": "High",
    "android.permission.REQUEST_INSTALL_PACKAGES": "High",
    "android.permission.BIND_ACCESSIBILITY_SERVICE": "CRITICAL",
    "android.permission.BIND_DEVICE_ADMIN": "CRITICAL"
}

def analyze_apk(file_path: str):
    """
    Statically analyzes an APK by decoding its AndroidManifest.xml.
    Returns package info and flags malicious permissions.
    """
    if not os.path.exists(file_path):
        return {"error": "APK file not found."}

    try:
        apk = APK(file_path)
        
        # Extract basic info
        app_name = apk.application
        package_name = apk.package
        version_name = apk.version_name
        version_code = apk.version_code
        
        # Extract permissions
        permissions = apk.get_permissions()
        
        # Analyze permissions for risk
        analyzed_permissions = []
        overall_risk = "Low"
        critical_count = 0
        high_count = 0
        
        for perm in permissions:
            risk = DANGEROUS_PERMISSIONS.get(perm, "Low")
            
            if risk == "CRITICAL":
                critical_count += 1
                overall_risk = "CRITICAL"
            elif risk == "High":
                high_count += 1
                if overall_risk != "CRITICAL":
                    overall_risk = "High"
            elif risk == "Medium" and overall_risk not in ["CRITICAL", "High"]:
                overall_risk = "Medium"
                
            analyzed_permissions.append({
                "permission": perm,
                "risk_level": risk,
                "description": "Known dangerous permission commonly abused by malware." if risk in ["High", "CRITICAL"] else "Standard Android permission."
            })

        # Sort permissions so highest risk is at the top
        risk_sort_order = {"CRITICAL": 0, "High": 1, "Medium": 2, "Low": 3}
        analyzed_permissions.sort(key=lambda x: risk_sort_order.get(x["risk_level"], 4))
        
        # Extract Main Activity
        main_activity = apk.get_main_activity()
        
        # Services & Receivers
        services = apk.get_services()
        receivers = apk.get_receivers()

        return {
            "status": "success",
            "app_name": app_name,
            "package_name": package_name,
            "version": f"{version_name} ({version_code})",
            "main_activity": main_activity,
            "overall_risk": overall_risk,
            "risk_summary": f"Detected {critical_count} CRITICAL and {high_count} High-Risk permissions.",
            "permissions": analyzed_permissions,
            "services_count": len(services) if services else 0,
            "receivers_count": len(receivers) if receivers else 0
        }

    except Exception as e:
        return {
            "status": "error",
            "message": f"Failed to parse APK: {str(e)}"
        }
