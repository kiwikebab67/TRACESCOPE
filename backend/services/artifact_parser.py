import xml.etree.ElementTree as ET
import os

try:
    import Evtx.Evtx as evtx
    HAS_EVTX = True
except ImportError:
    HAS_EVTX = False

def parse_evtx_log(filepath):
    """
    Parse a Windows EVTX log file. If python-evtx is not available or 
    the file is not a valid EVTX binary, falls back to parsing it line by line.
    """
    events = []
    
    if HAS_EVTX:
        try:
            with open(filepath, 'rb') as f:
                sig = f.read(8)
                is_evtx_sig = (sig == b'ElfFile\x00')
                
            if is_evtx_sig:
                with evtx.Evtx(filepath) as log:
                    for record in log.records():
                        try:
                            xml_str = record.xml()
                            root = ET.fromstring(xml_str)
                            
                            ns = {'ns': 'http://schemas.microsoft.com/win/2004/08/events/event'}
                            system = root.find('ns:System', ns)
                            
                            if system is not None:
                                event_id_elem = system.find('ns:EventID', ns)
                                event_id = event_id_elem.text if event_id_elem is not None else '0'
                                
                                provider_elem = system.find('ns:Provider', ns)
                                source = provider_elem.get('Name') if provider_elem is not None else 'Unknown'
                                
                                time_created_elem = system.find('ns:TimeCreated', ns)
                                time_created = time_created_elem.get('SystemTime') if time_created_elem is not None else 'N/A'
                                
                                if time_created and 'T' in time_created:
                                    time_created = time_created.split('.')[0].replace('T', ' ')
                                    
                                events.append({
                                    'event_id': event_id,
                                    'source': source,
                                    'time_created': time_created
                                })
                        except Exception:
                            pass
                if events:
                    return events
        except Exception:
            pass
            
    # Fallback to Text Log Parser
    try:
        with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
            for idx, line in enumerate(f):
                line = line.strip()
                if not line:
                    continue
                
                line_lower = line.lower()
                event_id = 1000
                source = "Text Logger"
                
                if "error" in line_lower or "failed" in line_lower or "unauthorized" in line_lower:
                    event_id = 4625
                    source = "Text Audit Engine"
                elif "critical" in line_lower or "cleared" in line_lower or "deleted" in line_lower:
                    event_id = 1102
                    source = "Text Audit Engine"
                elif "success" in line_lower or "logged" in line_lower:
                    event_id = 4624
                    source = "Text Log Monitor"
                
                events.append({
                    'event_id': event_id,
                    'source': source,
                    'time_created': f"Line {idx + 1}"
                })
    except Exception:
        pass
        
    return events

def parse_pcap_capture(filepath):
    """
    Parses a real PCAP network capture using scapy.
    Extracts network conversations, protocols, and HTTP/DNS payloads.
    """
    try:
        from scapy.all import rdpcap, IP, TCP, UDP, DNS, Raw
    except ImportError:
        return [{"id": 1, "time": "N/A", "source_ip": "Error", "dest_ip": "Error", "protocol": "Error", "length": 0, "info": "Scapy library not installed", "risk": "High"}]

    packets_data = []
    try:
        # Load up to 2500 packets to prevent massive payloads freezing the app
        pkts = rdpcap(filepath, count=2500)
        
        for idx, pkt in enumerate(pkts):
            if IP in pkt:
                src = pkt[IP].src
                dst = pkt[IP].dst
                proto = "IP"
                info = ""
                risk = "Low"
                length = len(pkt)
                
                if TCP in pkt:
                    proto = "TCP"
                    info = f"{pkt[TCP].sport} > {pkt[TCP].dport} [Flags: {pkt[TCP].flags}]"
                    if pkt[TCP].dport in [443, 8443]:
                        proto = "TLS"
                    if Raw in pkt and b'HTTP' in pkt[Raw].load:
                        proto = "HTTP"
                        try:
                            info = pkt[Raw].load.decode('utf-8', errors='ignore').split('\r\n')[0]
                        except:
                            pass
                elif UDP in pkt:
                    proto = "UDP"
                    info = f"{pkt[UDP].sport} > {pkt[UDP].dport}"
                    if DNS in pkt:
                        proto = "DNS"
                        if pkt[DNS].qd:
                            try:
                                info = f"DNS Query: {pkt[DNS].qd.qname.decode('utf-8', errors='ignore')}"
                            except:
                                info = "DNS Query"
                
                # Basic heuristic for risk
                if dst in ["185.220.101.4", "9.9.9.9"] or src in ["185.220.101.4"]:
                    risk = "High"
                if "beacon" in info.lower() or "cmd.exe" in info.lower():
                    risk = "High"
                
                packets_data.append({
                    "id": idx + 1,
                    "time": f"{pkt.time:.6f}",
                    "source_ip": src,
                    "dest_ip": dst,
                    "protocol": proto,
                    "length": length,
                    "info": info,
                    "risk": risk
                })
        return packets_data
    except Exception as e:
        return [{"id": 1, "time": "N/A", "source_ip": "Error", "dest_ip": "Error", "protocol": "Error", "length": 0, "info": f"Failed to parse PCAP: {str(e)}", "risk": "High"}]

def parse_autopsy_disk(filepath):
    """
    Simulates Autopsy Disk Image File System parsing.
    Extracts folder files, deleted items, metadata, and EXIF parameters.
    """
    disk_files = [
        {
            'event_id': 8001,
            'source': 'Autopsy: File System',
            'description': '/Users/Victim/Desktop/invoice_update_v2.exe - File size: 540 KB. Executable flag set. Hash matching SHA256.',
            'risk_level': 'Medium',
            'time_created': 'File Record: 0x0A'
        },
        {
            'event_id': 8002,
            'source': 'Autopsy: Deleted Files',
            'description': '[DELETED] /Users/Victim/Documents/c2_config.ini - File system link broken but raw bytes recovered in slack space.',
            'risk_level': 'High',
            'time_created': 'File Record: 0x14'
        },
        {
            'event_id': 8003,
            'source': 'Autopsy: EXIF Metadata',
            'description': '/Users/Victim/Pictures/server_rack.jpg - Found GPS coordinates in EXIF headers pointing to: Latitude 55.7558 N, Longitude 37.6173 E.',
            'risk_level': 'Medium',
            'time_created': 'EXIF Tag: 0x9203'
        },
        {
            'event_id': 8004,
            'source': 'Autopsy: Chrome History',
            'description': 'Extracted sqlite DB record: Visited URL "http://rx-c2-panel.xyz/login" on 2026-07-18 11:20 UTC.',
            'risk_level': 'High',
            'time_created': 'Sqlite ID: 4410'
        }
    ]
    return disk_files
