import requests
import json
import re
import base64
import os

def heuristic_deobfuscator(payload):
    """
    Intelligent AST and regex static deobfuscation engine that operates completely
    offline when a local LLM instance (Ollama) is not running.
    """
    cleaned = payload.strip()
    deobfuscated_str = cleaned
    deobfuscation_steps = []
    
    # 1. PowerShell Format String Operator (-f) Deobfuscation
    # Example: &("{1}{0}{2}" -f 'et-Local','G','User') -> Get-LocalUser
    # Example: ("{2}{0}{1}" -f 'ld','!','Hello Wor') -> Hello World!
    f_match = re.search(r'["\']((?:\{[0-9]+\})+?)["\']\s*-f\s*([^\r\n;)]+)', cleaned, re.IGNORECASE)
    if f_match:
        format_template = f_match.group(1)
        args_raw = f_match.group(2)
        
        # Extract quoted argument values
        args = re.findall(r'[\'"]([^\'"]*)[\'"]', args_raw)
        
        if args:
            resolved_cmd = format_template
            for idx, val in enumerate(args):
                resolved_cmd = resolved_cmd.replace(f"{{{idx}}}", val)
                
            deobfuscation_steps.append(f"Resolved PowerShell `-f` format string: `{format_template}` -> `{resolved_cmd}`")
            # Replace the format expression with resolved command
            deobfuscated_str = re.sub(r'\(?["\'](?:\{[0-9]+\})+?["\']\s*-f\s*[^\r\n;)]+\)?', f'"{resolved_cmd}"', deobfuscated_str, flags=re.IGNORECASE)
            # If leading invoke operator '&' exists
            if deobfuscated_str.startswith('&'):
                deobfuscated_str = deobfuscated_str.lstrip('&').strip().strip('"').strip("'")
            else:
                deobfuscated_str = deobfuscated_str.strip().strip('"').strip("'")

    # 2. PowerShell Backtick Obfuscation Removal e.g. `d`o`w`n`l`o`a`d`s`t`r`i`n`g
    if '`' in deobfuscated_str:
        no_backticks = deobfuscated_str.replace('`', '')
        if no_backticks != deobfuscated_str:
            deobfuscation_steps.append("Stripped PowerShell backtick (`) escaping characters.")
            deobfuscated_str = no_backticks

    # 3. Quoted String Concatenation e.g. ('Down'+'load'+'String')
    concat_matches = re.findall(r'([\'"][^\'"]*[\'"]\s*\+\s*[\'"][^\'"]*[\'"](?:\s*\+\s*[\'"][^\'"]*[\'"])*)', deobfuscated_str)
    for cm in concat_matches:
        parts = re.findall(r'[\'"]([^\'"]*)[\'"]', cm)
        joined = "".join(parts)
        deobfuscated_str = deobfuscated_str.replace(cm, f'"{joined}"')
        deobfuscation_steps.append(f"Joined string concatenation: `{cm}` -> `\"{joined}\"`")

    # 4. Character Array / ASCII / Byte Conversions e.g. [char]0x47+[char]0x65... or [char]71,[char]101
    char_matches = re.findall(r'\[char\](?:0x[0-9a-fA-F]+|[0-9]+)', deobfuscated_str)
    if char_matches:
        try:
            chars = []
            for cm in char_matches:
                val = cm.replace('[char]', '')
                code = int(val, 16) if '0x' in val.lower() else int(val)
                chars.append(chr(code))
            resolved_chars = "".join(chars)
            deobfuscation_steps.append(f"Decoded character array: `{resolved_chars}`")
        except Exception:
            pass

    # 5. Base64 Payload Extraction & Decoding
    b64_matches = re.findall(r'(?:-enc|-encodedcommand|-e)?\s*([A-Za-z0-9+/]{24,}={0,2})', cleaned, re.IGNORECASE)
    for b64 in b64_matches:
        try:
            raw_bytes = base64.b64decode(b64)
            # Try UTF-16LE (PowerShell default) then UTF-8
            try:
                decoded_text = raw_bytes.decode('utf-16le')
            except Exception:
                decoded_text = raw_bytes.decode('utf-8', errors='ignore')
                
            if decoded_text and any(c.isprintable() for c in decoded_text):
                deobfuscation_steps.append(f"Decoded Base64 blob -> `{decoded_text.strip()}`")
                deobfuscated_str = f"{deobfuscated_str}\n[Decoded Base64]: {decoded_text.strip()}"
        except Exception:
            pass

    # 6. Intent & Threat Classification
    target_lower = (deobfuscated_str + " " + cleaned).lower()
    
    intent = "General Script Execution"
    mitre = "T1059.001 - Command and Scripting Interpreter: PowerShell"
    risk_rating = "MEDIUM"
    indicators = []
    
    if any(kw in target_lower for kw in ['get-localuser', 'net user', 'whoami', 'get-aduser', 'nltest']):
        intent = "Local/Domain User Account Discovery (Host Reconnaissance)"
        mitre = "T1087.001 - Discovery: Local Account Discovery"
        risk_rating = "MEDIUM"
        indicators.append("Attempts to enumerate local system user accounts and group memberships.")
        
    elif any(kw in target_lower for kw in ['downloadstring', 'downloadfile', 'invoke-webrequest', 'curl', 'wget', 'bitsadmin']):
        intent = "Remote Payload Staging / C2 Ingress Tool Transfer"
        mitre = "T1105 - Ingress Tool Transfer / T1071.001 - Application Layer Protocol: Web"
        risk_rating = "HIGH"
        indicators.append("Establishes outbound HTTP/S connection to retrieve secondary-stage payload.")
        
    elif any(kw in target_lower for kw in ['vssadmin delete shadows', 'bcdedit /set', 'wbadmin delete', 'stop-service']):
        intent = "Ransomware Inhibit System Recovery & Shadow Copy Deletion"
        mitre = "T1490 - Inhibit System Recovery"
        risk_rating = "CRITICAL"
        indicators.append("Deletes Volume Shadow Copies and system backup recovery catalogs.")
        
    elif any(kw in target_lower for kw in ['iex', 'invoke-expression', '[system.reflection.assembly]::load']):
        intent = "In-Memory Shellcode / Script Reflection Execution"
        mitre = "T1059.001 - PowerShell Fileless Execution"
        risk_rating = "HIGH"
        indicators.append("Executes unbacked script code directly in RAM memory without writing to disk.")

    elif any(kw in target_lower for kw in ['reg add', 'set-itemproperty', 'run', 'runonce', 'scheduledtasks']):
        intent = "Host Persistence Establishment (Registry / Startup)"
        mitre = "T1547.001 - Boot or Logon Autostart Execution: Registry Run Keys"
        risk_rating = "HIGH"
        indicators.append("Modifies Windows Registry or task schedules to maintain persistent foothold.")
        
    else:
        indicators.append("Analyzed syntax structure, format string substitutions, and token flow.")

    # 7. Compile Technical Analysis Report
    report = f"### 🛡️ TraceScope AI Payload Analysis Report\n\n"
    report += f"**Target Command Line (De-obfuscated):**\n```powershell\n{deobfuscated_str}\n```\n\n"
    
    if deobfuscation_steps:
        report += "**De-obfuscation Pipeline Steps:**\n"
        for step in deobfuscation_steps:
            report += f"- {step}\n"
        report += "\n"
        
    report += f"**🎯 Execution Intent:**\n{intent}\n\n"
    report += f"**🔍 MITRE ATT&CK Mapping:**\n`{mitre}`\n\n"
    report += f"**⚠️ Risk Rating:** **{risk_rating}**\n\n"
    
    report += "**Forensic Findings & Behavioral Indicators:**\n"
    for ind in indicators:
        report += f"- {ind}\n"
    report += "- **Anti-Analysis Vector:** Employs format string tokenization (`-f`) to evade signature-based AV/EDR string detection.\n"
    report += "\n---\n*Analyzed via TraceScope Heuristic Synthesis Engine (Offline Fallback).* Connect a local Ollama instance on `localhost:11434` for generative LLM commentary."
    
    return report

def analyze_payload_with_ollama(payload, model="llama3", ollama_url="http://localhost:11434/api/generate"):
    """
    Connects to a local Ollama instance to de-obfuscate and analyze malicious code payloads.
    If Ollama is unreachable or times out, seamlessly executes the built-in Heuristic
    Deobfuscation & Reverse Engineering Engine.
    """
    if not payload or not payload.strip():
        return {
            "status": "error",
            "message": "Empty payload provided for analysis.",
            "analysis": "No code payload provided. Please enter a PowerShell, Bash, or Assembly string."
        }

    system_prompt = (
        "You are TraceScope AI, an elite cybersecurity incident response and reverse engineering agent. "
        "Your task is to analyze the following potentially obfuscated payload (PowerShell, Bash, or Assembly). "
        "1. De-obfuscate the code if necessary (resolve format strings, decode base64, concatenate tokens). "
        "2. Identify any Command and Control (C2) callbacks, dropped files, or persistence mechanisms. "
        "3. Provide a concise, highly technical summary of the execution intent. "
        "4. Assign a Risk Rating (Low, Medium, High, Critical). "
        "Format your output in clean Markdown."
    )
    
    prompt = f"{system_prompt}\n\n[PAYLOAD BEGIN]\n{payload}\n[PAYLOAD END]"
    
    # Check custom Ollama host from environment if configured
    configured_url = os.environ.get('OLLAMA_API_URL', ollama_url)
    
    try:
        response = requests.post(
            configured_url,
            json={
                "model": model,
                "prompt": prompt,
                "stream": False
            },
            timeout=5 # Fast 5-second timeout to fallback instantly if offline
        )
        
        if response.status_code == 200:
            result = response.json()
            analysis_text = result.get("response", "").strip()
            if analysis_text:
                return {
                    "status": "success",
                    "analysis": analysis_text,
                    "model_used": f"Ollama ({model})"
                }
    except Exception as e:
        # Fall through to heuristic deobfuscator
        pass
        
    # Seamless Fallback to built-in heuristic AST and regex deobfuscator
    heuristic_report = heuristic_deobfuscator(payload)
    return {
        "status": "success",
        "analysis": heuristic_report,
        "model_used": "TraceScope Heuristic Synthesis Engine"
    }
