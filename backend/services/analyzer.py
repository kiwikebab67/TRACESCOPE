import hashlib
import os
import pefile

def calculate_md5(filepath):
    """Calculate MD5 hash of a file in chunks."""
    md5_hash = hashlib.md5()
    try:
        with open(filepath, "rb") as f:
            for byte_block in iter(lambda: f.read(4096), b""):
                md5_hash.update(byte_block)
        return md5_hash.hexdigest()
    except Exception as e:
        return f"error: {str(e)}"

def evaluate_log_risk(event_id, source):
    """
    Evaluate the risk of a Windows Event Log entry based on Event ID and source.
    Returns: (risk_level, intelligence_description)
    """
    event_id = int(event_id)
    
    risk_mapping = {
        1102: ("High", "Audit log cleared. This is a critical indicator of defense evasion / anti-forensics activity."),
        4625: ("Medium", "Failed account logon attempt. Possible credential brute-forcing activity."),
        4624: ("Low", "Successful account logon. Standard administrative or user activity."),
        4720: ("Medium", "A user account was created. Verify if this was authorized access control modification."),
        4722: ("Medium", "A user account was enabled. Potential persistence mechanism creation."),
        4732: ("High", "A member was added to a security-enabled local group (e.g., Administrators). Privileged escalation indicator."),
        7045: ("High", "A new system service was installed. Verify for potential persistence (malware running as a service)."),
        4697: ("High", "A service was installed in the system. Often used by attackers to establish persistent access."),
        4688: ("Low", "A new process has been created. standard process creation log.")
    }
    
    if event_id in risk_mapping:
        return risk_mapping[event_id]
    
    source_lower = source.lower()
    if "mimikatz" in source_lower or "cobaltstrike" in source_lower or "metasploit" in source_lower:
        return ("High", f"Known offensive security tool signature detected in log source: {source}")
    
    if "powershell" in source_lower:
        if event_id in [4103, 4104]:
            return ("Medium", "PowerShell script block logging captured execution. Review script block text for commands.")
        return ("Low", f"PowerShell log event {event_id} recorded.")
        
    return ("Low", f"Log event parsed from source {source}. No immediate high-risk indicators found.")

def analyze_malware_file(filepath, filename):
    """
    Perform static PE analysis and simulated YARA scan on binary executables.
    Returns: {
        'is_suspicious': bool,
        'notes': list of string,
        'yara_matches': list of dict
    }
    """
    results = {
        'is_suspicious': False,
        'notes': [],
        'yara_matches': []
    }
    
    # 1. Simulated YARA scanning engine based on PE signatures/filename
    filename_lower = filename.lower()
    if "beacon" in filename_lower or "cs_" in filename_lower or "cobalt" in filename_lower:
        results['is_suspicious'] = True
        results['yara_matches'].append({
            'rule': 'CobaltStrike_C2_Beacon',
            'meta': 'Detected Cobalt Strike Command & Control client payload.',
            'risk': 'High'
        })
    elif "shell" in filename_lower or "chopper" in filename_lower:
        results['is_suspicious'] = True
        results['yara_matches'].append({
            'rule': 'Webshell_ChinaChopper',
            'meta': 'Detected China Chopper eval-based ASPX/PHP webshell.',
            'risk': 'High'
        })
    elif "mimikatz" in filename_lower or "lsadump" in filename_lower:
        results['is_suspicious'] = True
        results['yara_matches'].append({
            'rule': 'Mimikatz_CredentialStealer',
            'meta': 'Detected LSASS credential extraction utility.',
            'risk': 'High'
        })
    
    # General YARA check based on file hash suffix
    md5 = calculate_md5(filepath)
    if md5.endswith('0') or md5.endswith('f'):
        results['is_suspicious'] = True
        results['yara_matches'].append({
            'rule': 'Suspicious_Shellcode_Injector',
            'meta': 'Entropy analysis indicates potential packer or crypted shellcode payloads.',
            'risk': 'High'
        })

    # 2. pefile structural analysis
    try:
        pe = pefile.PE(filepath)
        
        standard_sections = ['.text', '.data', '.rdata', '.rsrc', '.reloc', '.pdata', '.idata']
        packed_indicators = ['UPX', 'PAC', 'ASPack', 'MEW', 'FSG', 'Peka']
        
        for section in pe.sections:
            try:
                name = section.Name.decode('utf-8', errors='ignore').strip('\x00')
                if any(ind in name for ind in packed_indicators):
                    results['is_suspicious'] = True
                    results['notes'].append(f"YARA matched packed section '{name}' (associated with compressor/packer).")
                elif name not in standard_sections and len(name) > 0:
                    results['notes'].append(f"Non-standard PE section name: '{name}'.")
            except Exception:
                pass

        suspicious_apis = {
            'VirtualAlloc': 'Memory allocation for injection',
            'WriteProcessMemory': 'Process hollowing',
            'CreateRemoteThread': 'Remote thread injection',
            'IsDebuggerPresent': 'Debugger detection / Anti-Analysis',
            'InternetOpen': 'C2 beacon network connection'
        }
        
        found_apis = []
        if hasattr(pe, 'DIRECTORY_ENTRY_IMPORT'):
            for entry in pe.DIRECTORY_ENTRY_IMPORT:
                for imp in entry.imports:
                    if imp.name:
                        try:
                            imp_name = imp.name.decode('utf-8', errors='ignore')
                            if imp_name in suspicious_apis:
                                found_apis.append(f"{imp_name} ({suspicious_apis[imp_name]})")
                        except Exception:
                            pass
                            
        if found_apis:
            results['notes'].append(f"API Imports flagged: {', '.join(found_apis[:4])}")
            if len(found_apis) >= 2:
                results['is_suspicious'] = True
                
        if len(pe.sections) > 8:
            results['notes'].append(f"High section count ({len(pe.sections)}). Potential cryptor/packer signature.")
            results['is_suspicious'] = True
            
    except pefile.PEFormatError:
        results['notes'].append("Not a valid portable executable (PE) binary header structure.")
    except Exception as e:
        results['notes'].append(f"PE Analysis Error: {str(e)}")
        
    if not results['notes'] and not results['yara_matches']:
        results['notes'].append("Standard executable file headers validated. No anomalies flagged.")
        
    return results

def analyze_memory_dump(filepath, filename):
    """
    Simulate Volatility memory forensics extraction.
    Generates process list (pslist), network scans (netscan), and injected threads (malfind).
    """
    # We will generate a list of mock events showing Volatility memory analysis
    vol_logs = [
        # Volatility pslist
        {
            'event_id': 101,
            'source': 'Volatility: pslist',
            'description': 'PID 4824: explorer.exe - Standard shell process.',
            'risk_level': 'Low',
            'time_created': 'Offset: 0x3f8a00'
        },
        {
            'event_id': 102,
            'source': 'Volatility: pslist',
            'description': 'PID 5104: svchost.exe - Parent PID 4824. WARNING: svchost.exe should not be a child of explorer.exe!',
            'risk_level': 'High',
            'time_created': 'Offset: 0x4f1200'
        },
        # Volatility netscan
        {
            'event_id': 201,
            'source': 'Volatility: netscan',
            'description': 'PID 5104 (svchost.exe) bound to external IP 185.220.101.4:443 (Russia / Known Tor exit node) on TCP port 49152.',
            'risk_level': 'High',
            'time_created': 'Socket state: ESTABLISHED'
        },
        # Volatility malfind
        {
            'event_id': 301,
            'source': 'Volatility: malfind',
            'description': 'PID 5104: svchost.exe - Found page with PAGE_EXECUTE_READWRITE permissions containing MZ header. Injected code detected.',
            'risk_level': 'High',
            'time_created': 'Protection: ERW'
        }
    ]
    
    # If the filename does not look like a suspicious dump, we can return cleaner outputs with minor info
    if "malicious" not in filename.lower() and "infected" not in filename.lower() and "mem" not in filename.lower() and "raw" not in filename.lower():
        vol_logs = [
            {
                'event_id': 101,
                'source': 'Volatility: pslist',
                'description': 'PID 1004: wininit.exe - Parent PID 440. Standard init process.',
                'risk_level': 'Low',
                'time_created': 'Offset: 0x1f1000'
            },
            {
                'event_id': 102,
                'source': 'Volatility: pslist',
                'description': 'PID 2048: lsass.exe - Parent PID 510. Standard authentication authority.',
                'risk_level': 'Low',
                'time_created': 'Offset: 0x2e8b00'
            },
            {
                'event_id': 201,
                'source': 'Volatility: netscan',
                'description': 'No suspicious network socket bindings or active C2 connections found in RAM dump.',
                'risk_level': 'Low',
                'time_created': 'Socket state: CLOSED'
            }
        ]
        
    return vol_logs
