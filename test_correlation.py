import unittest
import os
import sys
import json

# Setup paths to import backend modules
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from services.artifact_parser import parse_linux_syslog, parse_auditd_log
from services.threat_intel import query_abuseipdb, query_virustotal_hash
from app import app, db
from models.case import Case
from models.evidence import Evidence, ForensicLog

class TestSIEMArtifactsAndThreatCorrelation(unittest.TestCase):

    def setUp(self):
        # Create temp files for syslog and auditd logs
        self.syslog_path = 'test_syslog.log'
        self.audit_path = 'test_audit.log'
        
        # Sample syslog contents
        with open(self.syslog_path, 'w', encoding='utf-8') as f:
            f.write(
                "Aug 18 12:00:01 web-prod sshd[1234]: Failed password for root from 185.220.101.4 port 2222 ssh2\n"
                "Aug 18 12:05:00 web-prod sshd[1235]: Accepted publickey for admin from 192.168.1.50 port 54321 ssh2\n"
                "Aug 18 12:10:02 web-prod sudo:  admin : TTY=pts/0 ; PWD=/home/admin ; USER=root ; COMMAND=/bin/chmod 777 /etc/shadow\n"
                "Aug 18 12:15:30 web-prod kernel: [123.45] Generic syslog event with no threats\n"
            )
            
        # Sample auditd contents
        with open(self.audit_path, 'w', encoding='utf-8') as f:
            f.write(
                'type=SYSCALL msg=audit(1692376510.123:1001): arch=c000003e syscall=59 success=yes exit=0 ppid=123 uid=0 exe="/tmp/malicious_payload"\n'
                'type=USER_AUTH msg=audit(1692376520.456:1002): pid=500 uid=0 auid=1000 ses=1 subj=kernel msg=\'op=PAM:authentication acct="invalid_user" exe="/usr/sbin/sshd" hostname=198.51.100.12 addr=198.51.100.12 terminal=ssh res=failed\'\n'
                'type=ANOM_PROMISCUOUS msg=audit(1692376530.789:1003): dev=eth0 prom=256 old_prom=0 auid=4294967295 ses=4294967295\n'
            )

    def tearDown(self):
        # Cleanup files
        if os.path.exists(self.syslog_path):
            os.remove(self.syslog_path)
        if os.path.exists(self.audit_path):
            os.remove(self.audit_path)

    def test_syslog_parser(self):
        events = parse_linux_syslog(self.syslog_path)
        
        # Verify parser extracted correct count
        self.assertEqual(len(events), 4)
        
        # Verify failed password alert (sshd)
        ssh_failed = [e for e in events if e['event_id'] == 4625]
        self.assertEqual(len(ssh_failed), 1)
        self.assertEqual(ssh_failed[0]['risk_level'], 'High') # High due to remote IP and failed login
        self.assertIn("185.220.101.4", ssh_failed[0]['description'])
        
        # Verify accepted login
        ssh_ok = [e for e in events if e['event_id'] == 4624 and "sshd" in e['source']]
        self.assertEqual(len(ssh_ok), 1)
        self.assertEqual(ssh_ok[0]['risk_level'], 'Low')
        
        # Verify sudo high-risk event
        sudo_exec = [e for e in events if e['event_id'] == 4688]
        self.assertEqual(len(sudo_exec), 1)
        self.assertEqual(sudo_exec[0]['risk_level'], 'High') # High due to chmod /etc/shadow
        self.assertIn("sudo", sudo_exec[0]['source'].lower())

    def test_auditd_parser(self):
        events = parse_auditd_log(self.audit_path)
        
        self.assertEqual(len(events), 3)
        
        # Verify high-risk syscall exe from /tmp/
        syscall_ev = [e for e in events if e['event_id'] == 8002]
        self.assertEqual(len(syscall_ev), 1)
        self.assertEqual(syscall_ev[0]['risk_level'], 'High')
        self.assertIn("/tmp/malicious_payload", syscall_ev[0]['description'])
        
        # Verify USER_AUTH failed auth
        user_auth_ev = [e for e in events if e['event_id'] == 4625]
        self.assertEqual(len(user_auth_ev), 1)
        self.assertEqual(user_auth_ev[0]['risk_level'], 'High') # High due to remote IP address
        self.assertIn("198.51.100.12", user_auth_ev[0]['description'])
        
        # Verify ANOM_PROMISCUOUS anomaly
        sniff_ev = [e for e in events if e['event_id'] == 8003]
        self.assertEqual(len(sniff_ev), 1)
        self.assertEqual(sniff_ev[0]['risk_level'], 'High')

    def test_correlation_endpoint(self):
        # Test correlation API locally via flask test client
        with app.app_context():
            # Ensure a test case exists
            test_case = Case.query.filter_by(title="SIEM Correlation Test Case").first()
            if not test_case:
                test_case = Case(
                    case_number="CASE-TEST-99",
                    title="SIEM Correlation Test Case",
                    description="Automated Integration Testing Case",
                    investigator="Test Harness"
                )
                db.session.add(test_case)
                db.session.commit()
                
            # Create a test evidence
            test_evidence = Evidence(
                filename="syslog",
                filepath=self.syslog_path,
                hash_sha256="abc123sha256",
                hash_md5="abc123md5",
                case_id=test_case.id
            )
            db.session.add(test_evidence)
            db.session.commit()
            
            # Add logs that simulate threats to correlate
            db.session.add(ForensicLog(
                evidence_id=test_evidence.id,
                event_id=4625,
                source="sshd",
                description="Failed password for root from 185.220.101.4 port 22 ssh2",
                risk_level="High",
                tool_source="logs"
            ))
            db.session.commit()
            
            # Test correlation route
            client = app.test_client()
            res = client.get(f"/api/threat-intel/correlate/{test_case.id}")
            self.assertEqual(res.status_code, 200)
            
            data = json.loads(res.data)
            self.assertEqual(data['status'], 'success')
            self.assertTrue(len(data['alerts']) > 0)
            
            # Verify correlated IP alert matches expected
            alerts = data['alerts']
            ip_alerts = [a for a in alerts if a['ioc'] == '185.220.101.4']
            self.assertEqual(len(ip_alerts), 1)
            self.assertEqual(ip_alerts[0]['risk_level'], 'High')
            self.assertIn("botnet", ip_alerts[0]['description'].lower())
            
            # Clean up db records
            db.session.delete(ForensicLog.query.filter_by(evidence_id=test_evidence.id).first())
            db.session.delete(test_evidence)
            db.session.delete(test_case)
            db.session.commit()

if __name__ == '__main__':
    unittest.main()
