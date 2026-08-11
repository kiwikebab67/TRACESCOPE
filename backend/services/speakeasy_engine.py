import speakeasy
import os

def emulate_binary(filepath, timeout=60):
    """
    Emulates a Windows executable using Speakeasy to trap API calls,
    memory drops, and registry modifications.
    """
    try:
        # Create a new Speakeasy emulator instance for Windows
        se = speakeasy.Speakeasy(config={'timeout': timeout})
        
        # Load the binary into the emulator
        with open(filepath, 'rb') as f:
            data = f.read()
            
        # Determine architecture from PE header (simplified)
        # Using speakeasy's built-in file loader
        module = se.load_module(path=filepath)
        
        # Run the emulator
        se.run_module(module)
        
        # Extract the report
        report = se.get_report()
        
        api_calls = []
        network = []
        registry = []
        file_drops = []
        
        # Process report to extract key IoCs
        if 'api_calls' in report:
            for api in report['api_calls']:
                api_calls.append(f"{api.get('api_name', 'Unknown')} ({api.get('dll', 'Unknown')})")
                
        if 'network' in report:
            for net in report['network']:
                if 'ip' in net:
                    network.append(f"{net['ip']}:{net.get('port', '')}")
                    
        if 'registry' in report:
            for reg in report['registry']:
                registry.append(reg.get('key_name', ''))
                
        if 'file_access' in report:
            for fa in report['file_access']:
                if fa.get('type') == 'write':
                    file_drops.append(fa.get('path', ''))

        return {
            "status": "success",
            "api_calls": list(set(api_calls)),
            "network_connections": list(set(network)),
            "registry_mods": list(set(registry)),
            "file_drops": list(set(file_drops)),
            "raw_report_summary": f"Emulated {len(api_calls)} API calls over execution cycle."
        }
    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }
