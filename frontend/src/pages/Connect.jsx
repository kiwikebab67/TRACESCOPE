import React from 'react';
import { Users, Phone, Mail, Globe, ShieldAlert, HeartHandshake, FileText, ExternalLink } from 'lucide-react';

const Connect = () => {
  const supportEntities = [
    {
      id: 1,
      name: "CyberPeace Foundation",
      description: "A global civil society organization and think tank of cybersecurity and policy experts. They provide dedicated support for victims of cyber fraud, harassment, and digital forensics.",
      hotline: "+91 9570000066",
      email: "helpline@cyberpeace.net",
      website: "https://www.cyberpeace.org/",
      type: "NGO",
      icon: <HeartHandshake className="w-8 h-8 text-[var(--ts-blue)]" />
    },
    {
      id: 2,
      name: "National Cyber Crime Reporting Portal",
      description: "Official government portal to report cybercrimes, including financial fraud, social media crimes, and ransomware attacks. Immediate freezing of fraudulent transactions available via helpline.",
      hotline: "1930",
      email: "complaint-cyb@gov.in",
      website: "https://cybercrime.gov.in/",
      type: "Government",
      icon: <ShieldAlert className="w-8 h-8 text-red-500" />
    },
    {
      id: 3,
      name: "CERT-In (Computer Emergency Response Team)",
      description: "The national nodal agency for responding to computer security incidents. Report severe organizational breaches, malware outbreaks, and targeted cyber attacks.",
      hotline: "+91-11-24368572",
      email: "incident@cert-in.org.in",
      website: "https://www.cert-in.org.in/",
      type: "Nodal Agency",
      icon: <Globe className="w-8 h-8 text-orange-500" />
    }
  ];

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto pb-10">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gradient flex items-center gap-3">
            <Users className="w-8 h-8 text-[var(--ts-purple)]" />
            Victim Support & Digital Rescue
          </h1>
          <p className="text-ts-text-muted mt-2 max-w-2xl text-lg">
            If you or your organization are actively facing cyber fraud, ransomware, or require immediate digital forensics assistance, please connect with the authorized entities below.
          </p>
        </div>
        <button className="btn-primary shadow-[0_0_15px_rgba(255,0,60,0.3)]">
          <FileText className="w-4 h-4" /> Download Emergency Contact PDF
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 mt-4">
        {supportEntities.map(entity => (
          <div key={entity.id} className="glass-panel p-6 flex flex-col md:flex-row gap-6 relative overflow-hidden group">
            {/* Background accent line */}
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${entity.type === 'Government' ? 'bg-red-500' : entity.type === 'NGO' ? 'bg-[var(--ts-blue)]' : 'bg-orange-500'}`}></div>
            
            <div className="flex flex-col items-center justify-center shrink-0 w-24 h-24 rounded-full bg-black/5 border border-[var(--ts-border)] group-hover:scale-105 transition-transform">
              {entity.icon}
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-xl font-bold text-[var(--ts-text)]">{entity.name}</h2>
                <span className={`badge ${entity.type === 'Government' ? 'bg-red-500/20 text-red-500 border border-red-500/30' : entity.type === 'NGO' ? 'bg-[var(--ts-blue)]/20 text-[var(--ts-blue)] border border-[var(--ts-blue)]/30' : 'bg-orange-500/20 text-orange-500 border border-orange-500/30'}`}>
                  {entity.type}
                </span>
              </div>
              <p className="text-ts-text-muted mb-6 leading-relaxed">
                {entity.description}
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3 bg-black/5 p-3 rounded-lg border border-[var(--ts-border)]">
                  <div className="p-2 rounded bg-[var(--ts-purple)]/10 text-[var(--ts-purple)]"><Phone className="w-4 h-4" /></div>
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-ts-text-muted">Hotline</span>
                    <span className="text-sm font-mono font-bold text-[var(--ts-text)]">{entity.hotline}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 bg-black/5 p-3 rounded-lg border border-[var(--ts-border)]">
                  <div className="p-2 rounded bg-[var(--ts-blue)]/10 text-[var(--ts-blue)]"><Mail className="w-4 h-4" /></div>
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-ts-text-muted">Email</span>
                    <span className="text-sm font-mono font-bold text-[var(--ts-text)]">{entity.email}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-black/5 p-3 rounded-lg border border-[var(--ts-border)]">
                  <div className="p-2 rounded bg-green-500/10 text-green-500"><ExternalLink className="w-4 h-4" /></div>
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-ts-text-muted">Portal</span>
                    <a href={entity.website} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-[var(--ts-text)] hover:text-[var(--ts-blue)] transition-colors line-clamp-1">
                      {entity.website.replace('https://www.', '')}
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 glass-panel p-6 border-l-4 border-l-orange-500 bg-orange-500/5">
        <h3 className="font-bold text-[var(--ts-text)] flex items-center gap-2 mb-2">
          <ShieldAlert className="w-5 h-5 text-orange-500" /> Immediate Action Items for Victims
        </h3>
        <ul className="list-disc pl-5 text-sm text-ts-text-muted space-y-2">
          <li><strong>Do not panic.</strong> Immediately isolate the affected devices from your network (turn off Wi-Fi or unplug ethernet cables) to prevent malware spread.</li>
          <li><strong>Preserve Evidence.</strong> Do not delete any emails, files, or messages. TraceScope can analyze these artifacts later.</li>
          <li><strong>Report Immediately.</strong> Dial 1930 immediately if the fraud involves financial transactions to freeze the funds.</li>
          <li><strong>Change Credentials.</strong> Use an unaffected device to change passwords for critical accounts (email, banking).</li>
        </ul>
      </div>
    </div>
  );
};

export default Connect;
