import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'react-hot-toast';
import { SystemSettings } from '../types';
import { 
  Globe, 
  Download, 
  Search, 
  CheckCircle, 
  Info, 
  AlertTriangle, 
  ChevronRight,
  Printer,
  Clock,
  Send,
  MessageSquare
} from 'lucide-react';

// Define types for legal document
interface LegalDoc {
  id: string;
  title: string;
  category: 'Legal' | 'Privacy' | 'Compliance' | 'Trust';
  lastUpdated: string;
  sections: {
    title: string;
    content: string;
    regionalNote?: {
      region: string;
      text: string;
    };
  }[];
}

// Complete fully-drafted legal documents tailor-made for ATECH East Africa Healthcare Ecosystem
const LEGAL_DOCUMENTS: LegalDoc[] = [
  {
    id: 'terms-of-service',
    title: 'Terms of Service',
    category: 'Legal',
    lastUpdated: 'June 2026',
    sections: [
      {
        title: '1. Acceptance of Terms',
        content: 'Welcome to ATECH East Africa ("Platform", "we", "us", or "our"). These Terms of Service constitute a legally binding agreement made between you, whether personally or on behalf of an entity ("you", "User", or "Organization") and ATECH East Africa, concerning your access to and use of our cloud-based pharmaceutical supply chain management software, B2B marketplace, inventory sync, and related services. By registering an account, or accessing the services, you acknowledge that you have read, understood, and agree to be bound by these Terms. If you do not agree to all of these Terms, you are prohibited from using our services.'
      },
      {
        title: '2. Eligibility and User Roles',
        content: 'ATECH East Africa is an enterprise B2B pharmaceutical coordination platform. To register and maintain an active account, you must be a licensed pharmaceutical professional or corporate entity, including but not limited to: Licensed Retail Pharmacies, Wholesale Importers, Distributors, Manufacturers, and Certified Warehouses. You agree to submit authentic, current state regulatory and professional credentials during our onboarding validation process. Access may be restricted or revoked immediately if your regional professional licensing is suspended, expired, or terminated.',
        regionalNote: {
          region: 'East Africa / Ethiopia',
          text: 'Under EFDA (Ethiopian Food and Drug Authority) and regional health bureau regulations, all importer/distributor nodes and pharmacies must maintain continuous valid local trading and medical operations licensure to execute B2B transactions.'
        }
      },
      {
        title: '3. Inventory and Batch Management Rules',
        content: 'Users managing stock levels, drug lot allocations, and bin cards within the ATECH East Africa System are solely responsible for the correctness of input data. You agree that the system is a recording tool and does not replace professional pharmaceutical validation of expiration dates, lot numbers, or cold chain integrity. Any drug movement registered under a staff account is legally attributed to the managing pharmacist or supervisor designated on the Organization Profile.'
      },
      {
        title: '4. B2B Marketplace and Ordering Conduct',
        content: 'When placing an order in the B2B Marketplace: (a) Pharmacies enter into a binding purchase commitment with the wholesale importer or distributor; (b) Price listings, promotional packages, and advertising clearances are set independently by vendors and are subject to verification; (c) Standard payment terms, credit limits, and delivery agreements are established under separate trade accounts but coordinated via ATECH East Africa. We act purely as a transaction platform and are not a party to individual wholesale contracts.'
      },
      {
        title: '5. Limitation of Liability',
        content: 'In no event shall ATECH East Africa, its directors, employees, or agents be liable to you or any third party for any direct, indirect, consequential, exemplary, incidental, or punitive damages, including lost profit, lost revenue, loss of data, or drug supply interruptions arising from your use of the platform. You accept that the platform serves as an administrative and operations support system.'
      }
    ]
  },
  {
    id: 'privacy-policy',
    title: 'Global Privacy Policy',
    category: 'Privacy',
    lastUpdated: 'June 2026',
    sections: [
      {
        title: '1. Information We Collect',
        content: 'We collect information that identifies, relates to, describes, or is reasonably capable of being associated with your organization or authorized individual staff members. This includes: (a) Registration credentials, corporate licensure, and tax identification documents; (b) Professional contact info (emails, telephone lines, physical addresses); (c) Technical session data (IP addresses, login logs, device configurations, geolocation of retail branches); and (d) Supply-chain metadata (inventory lists, purchase history, order volumes, bin card records).'
      },
      {
        title: '2. Patient and Medical Data Privacy',
        content: 'ATECH East Africa does not directly store, process, or transmit individual identifiable Patient Health Information (PHI) under normal SaaS usage. Standard retail sales POS screens handle transaction tallies anonymously. In the event that custom prescription details or patient logs are created locally by a Pharmacy User, such data is encrypted client-side and is never accessible to the ATECH East Africa global server or shared with third-party importers. We maintain strict compliance boundaries with global patient confidentiality regulations.',
        regionalNote: {
          region: 'United States / HIPAA',
          text: 'To the extent that any US healthcare entity utilizes ATECH East Africa modules for tracking dispensaries, ATECH East Africa operates as a Business Associate. A standard Business Associate Agreement (BAA) must be signed prior to patient-facing POS activation.'
        }
      },
      {
        title: '3. GDPR and African Data Protection Compliance',
        content: 'We recognize and respect data subject rights globally. If you access the platform from the European Economic Area, UK, or jurisdictions with enacted personal data protection laws (including Kenya, Nigeria, South Africa, and Ethiopia draft proclamation structures), you possess specific rights: (a) Right of access and data portability; (b) Right of rectification; (c) Right to erasure ("right to be forgotten"); (d) Right to restrict processing. You can manage and trigger these rights inside your ATECH East Africa Security Profile or by submitting a certified support ticket.'
      },
      {
        title: '4. Data Transfers and Processing Boundaries',
        content: 'Information collected by ATECH East Africa is hosted securely in distributed enterprise cloud instances. By accessing the platform, you consent to the secure transfer, hosting, and logical caching of organization records across these cloud zones under ISO 27001 security alignments. All data remains encrypted both in transit (TLS 1.3) and at rest (AES-256).'
      }
    ]
  },
  {
    id: 'cookie-policy',
    title: 'Cookie & Tracking Policy',
    category: 'Privacy',
    lastUpdated: 'May 2026',
    sections: [
      {
        title: '1. What Are Cookies?',
        content: 'Cookies are small text files placed on your computer or mobile device when you access websites. In ATECH East Africa, we use functional local storage, session state variables, and cookies to keep you authenticated, remember your preferred interface language, track offline sync queues, and optimize screen responsive load times.'
      },
      {
        title: '2. Categorization of System Cookies',
        content: 'We classify our cookies into three main layers: (a) Strictly Necessary: Essential for user login, security verification, multi-branch switching, and handling offline sync registers. (b) Performance & Functional: Used to remember language preferences (English, Amharic, Afaan Oromoo, Tigrinya), theme adjustments, and collapsed sidebar states. (c) Analytics: Internal telemetry to identify platform feature bottlenecks, API load rates, and application bugs. We do NOT use third-party marketing or tracking cookies.'
      },
      {
        title: '3. Managing Cookie Preferences',
        content: 'You can adjust your browser settings to refuse cookies or alert you when cookies are being sent. However, because ATECH East Africa is a real-time full-stack enterprise coordination tool, disabling strictly necessary cookies will render the system unable to authenticate your session or coordinate warehouse inventories.'
      }
    ]
  }
];

export function LegalFooter({ settings }: { settings?: SystemSettings | null }) {
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeRegion, setActiveRegion] = useState<string>('East Africa / Ethiopia');
  const [cookiePreferencesOpen, setCookiePreferencesOpen] = useState(false);
  const [cookiesConfig, setCookiesConfig] = useState({
    strictlyNecessary: true,
    functional: true,
    analytics: false
  });

  // Open a specific document in modal
  const openDoc = (docId: string) => {
    setSelectedDocId(docId);
    setSearchQuery('');
  };

  const documents = useMemo(() => {
    return LEGAL_DOCUMENTS.map(doc => {
      if (doc.id === 'terms-of-service') {
        return {
          ...doc,
          title: settings?.termsOfServiceTitle || doc.title,
          sections: settings?.termsOfServiceContent 
            ? [{ title: settings.termsOfServiceTitle || doc.title, content: settings.termsOfServiceContent }]
            : doc.sections
        };
      }
      if (doc.id === 'privacy-policy') {
        return {
          ...doc,
          title: settings?.privacyPolicyTitle || doc.title,
          sections: settings?.privacyPolicyContent 
            ? [{ title: settings.privacyPolicyTitle || doc.title, content: settings.privacyPolicyContent }]
            : doc.sections
        };
      }
      if (doc.id === 'cookie-policy') {
        return {
          ...doc,
          title: settings?.cookiePolicyTitle || doc.title,
          sections: settings?.cookiePolicyContent 
            ? [{ title: settings.cookiePolicyTitle || doc.title, content: settings.cookiePolicyContent }]
            : doc.sections
        };
      }
      return doc;
    });
  }, [settings]);

  const selectedDoc = useMemo(() => {
    return documents.find(d => d.id === selectedDocId) || null;
  }, [documents, selectedDocId]);

  // Filter sections within a document based on search
  const filteredSections = useMemo(() => {
    if (!selectedDoc) return [];
    if (!searchQuery.trim()) return selectedDoc.sections;

    const query = searchQuery.toLowerCase();
    return selectedDoc.sections.filter(s => 
      s.title.toLowerCase().includes(query) || 
      s.content.toLowerCase().includes(query)
    );
  }, [selectedDoc, searchQuery]);

  // Handle Cookie Settings save
  const handleSaveCookiePreferences = () => {
    toast.success('Your privacy and cookie preferences have been synchronized!');
    setCookiePreferencesOpen(false);
  };

  return (
    <footer id="legal-footer-section" className="bg-[#f8fafc] dark:bg-[#0d1017] py-20 px-8 sm:px-16 mt-20 border-t border-slate-200 dark:border-zinc-900/60 font-sans text-slate-600 dark:text-zinc-400 text-left transition-colors duration-300">
      <div className="max-w-7xl mx-auto space-y-16">
        
        {/* Top Section: Muted Centered Copyright - Matching reference image exactly */}
        <div className="flex justify-center border-b border-slate-200 dark:border-zinc-900/40 pb-12">
          <span className="text-[11px] font-medium tracking-[0.25em] text-slate-400 dark:text-zinc-500 uppercase">
            © {new Date().getFullYear()} ATECH East Africa. Digital Logistics by Design.
          </span>
        </div>

        {/* Middle Section: Elegant Minimalist 3-Column Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 pt-4">
          
          {/* Column 1: Elegant Brand Identifier */}
          <div className="space-y-6">
            <div className="space-y-1">
              <h3 className="text-2xl font-semibold tracking-[0.15em] text-slate-800 dark:text-zinc-100 uppercase">
                ATECH
              </h3>
              <span className="text-[10px] font-bold tracking-[0.25em] text-blue-600 dark:text-blue-400 block">
                EAST AFRICA
              </span>
            </div>
            <p className="text-[12px] leading-relaxed text-slate-500 dark:text-zinc-500 font-normal max-w-xs">
              {settings?.footerDescription || 'Next-generation pharmaceutical logistics, intelligent supply-chain forecasting, and integrated B2B procurement. Engineered to secure medicine distribution and coordinate multi-branch inventory across East Africa.'}
            </p>
          </div>

          {/* Column 2: Contact */}
          <div className="space-y-6">
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400 block">
              CONTACT
            </span>
            <div className="space-y-3.5 text-[12px] font-medium">
              <p className="text-slate-700 dark:text-zinc-200 tracking-wide">
                {settings?.contactPhone || '+251 11 663 3000'}
              </p>
              <p className="text-slate-500 dark:text-zinc-500 leading-relaxed">
                {settings?.contactActiveRegions || 'Active across Ethiopia · Kenya · Rwanda · Tanzania · Uganda'}
              </p>
              <p className="text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white transition-colors">
                {settings?.contactEmail || 'info@atecheastafrica.com'}
              </p>
            </div>

            {/* Telegram & WhatsApp Badges dynamically using settings */}
            <div className="flex gap-2.5 pt-2">
              {(settings?.telegramLink !== '') && (
                <a 
                  href={settings?.telegramLink || "https://t.me/atech_east_africa"} 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center justify-center gap-1.5 px-4 py-2 border border-slate-200 dark:border-zinc-800 hover:border-blue-300 dark:hover:border-blue-900 rounded-md text-[11px] font-semibold text-slate-600 dark:text-zinc-350 hover:text-blue-650 dark:hover:text-blue-400 bg-white/50 dark:bg-transparent transition-all cursor-pointer"
                >
                  <Send size={11} className="text-slate-500 dark:text-zinc-400" />
                  <span>Telegram</span>
                </a>
              )}
              {(settings?.whatsappLink !== '') && (
                <a 
                  href={settings?.whatsappLink || "https://wa.me/251116633000"} 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center justify-center gap-1.5 px-4 py-2 border border-slate-200 dark:border-zinc-800 hover:border-blue-300 dark:hover:border-blue-900 rounded-md text-[11px] font-semibold text-slate-600 dark:text-zinc-350 hover:text-blue-650 dark:hover:text-blue-400 bg-white/50 dark:bg-transparent transition-all cursor-pointer"
                >
                  <MessageSquare size={11} className="text-slate-500 dark:text-zinc-400" />
                  <span>WhatsApp</span>
                </a>
              )}
            </div>
          </div>

          {/* Column 3: Legal */}
          <div className="space-y-6">
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400 block">
              LEGAL
            </span>
            <ul className="space-y-3 text-[12px] font-medium">
              <li>
                <button 
                  onClick={() => openDoc('privacy-policy')} 
                  className="text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white transition-colors cursor-pointer text-left bg-transparent border-none p-0 outline-none"
                >
                  {settings?.privacyPolicyTitle || 'Privacy Policy'}
                </button>
              </li>
              <li>
                <button 
                  onClick={() => openDoc('terms-of-service')} 
                  className="text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white transition-colors cursor-pointer text-left bg-transparent border-none p-0 outline-none"
                >
                  {settings?.termsOfServiceTitle || 'Terms of Use'}
                </button>
              </li>
              <li>
                <button 
                  onClick={() => openDoc('cookie-policy')} 
                  className="text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white transition-colors cursor-pointer text-left bg-transparent border-none p-0 outline-none"
                >
                  {settings?.cookiePolicyTitle || 'Cookie Policy'}
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setCookiePreferencesOpen(true)} 
                  className="text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white transition-colors cursor-pointer text-left bg-transparent border-none p-0 outline-none"
                >
                  Cookie Preferences
                </button>
              </li>
            </ul>
          </div>

        </div>

      </div>

      {/* Premium Dark Legal Document Reader Modal */}
      <AnimatePresence>
        {selectedDoc && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 dark:bg-[#060709]/85 backdrop-blur-md">
            {/* Backdrop click closer */}
            <div className="absolute inset-0" onClick={() => setSelectedDocId(null)} />

            <motion.div 
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="relative w-full max-w-4xl bg-white dark:bg-[#0f1115] border border-slate-200 dark:border-zinc-800 shadow-2xl rounded-3xl h-[80vh] flex flex-col overflow-hidden z-10 text-slate-700 dark:text-zinc-300"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-slate-200 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-[#12151c]/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1 text-left">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 uppercase tracking-widest">
                      {selectedDoc.category} Document
                    </span>
                    <span className="text-zinc-400 dark:text-zinc-600 text-xs">•</span>
                    <span className="text-xs text-slate-500 dark:text-zinc-500 font-medium font-mono flex items-center gap-1">
                      <Clock size={12} /> Last updated: {selectedDoc.lastUpdated}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                    {selectedDoc.title}
                  </h3>
                </div>

                <div className="flex items-center gap-2.5 self-stretch sm:self-auto">
                  {/* Regionalization Filter Toggle */}
                  <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-[#171a23] border border-slate-200 dark:border-zinc-800 px-3 py-1.5 rounded-xl shadow-sm text-xs font-semibold">
                    <Globe size={13} className="text-slate-400 dark:text-zinc-500" />
                    <select 
                      value={activeRegion}
                      onChange={(e) => {
                        setActiveRegion(e.target.value);
                        toast.success(`Context converted to: ${e.target.value}`);
                      }}
                      className="bg-transparent border-none font-bold outline-none text-slate-700 dark:text-zinc-350 cursor-pointer text-xs"
                    >
                      <option className="bg-white dark:bg-[#171a23] text-slate-900 dark:text-white">East Africa / Ethiopia</option>
                      <option className="bg-white dark:bg-[#171a23] text-slate-900 dark:text-white">Global / GDPR</option>
                      <option className="bg-white dark:bg-[#171a23] text-slate-900 dark:text-white">United States / CCPA</option>
                      <option className="bg-white dark:bg-[#171a23] text-slate-900 dark:text-white">United Kingdom / UK GDPR</option>
                    </select>
                  </div>

                  <button 
                    onClick={() => {
                      window.print();
                    }}
                    title="Print Agreement"
                    className="p-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-850 dark:hover:bg-zinc-800 text-slate-500 dark:text-zinc-400 rounded-xl transition-all cursor-pointer"
                  >
                    <Printer size={15} />
                  </button>

                  <button 
                    onClick={() => setSelectedDocId(null)}
                    className="p-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-850 dark:hover:bg-zinc-800 text-slate-500 dark:text-zinc-400 rounded-xl transition-all font-bold cursor-pointer"
                  >
                    &times;
                  </button>
                </div>
              </div>

              {/* Modal Body Container with Sidebar and Main Content */}
              <div className="flex-1 flex overflow-hidden">
                
                {/* Modal Sidebar Index (Fast Switcher) */}
                <div className="w-56 border-r border-slate-200 dark:border-zinc-800/80 overflow-y-auto hidden md:block bg-slate-50/50 dark:bg-[#0b0c10]/40 p-4 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest px-2.5 mb-3 block">Document Suite</span>
                  {documents.map(doc => (
                    <button
                      key={doc.id}
                      onClick={() => openDoc(doc.id)}
                      className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-between group ${
                        doc.id === selectedDoc.id
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800/50'
                      }`}
                    >
                      <span className="truncate">{doc.title}</span>
                      <ChevronRight size={12} className={doc.id === selectedDoc.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 transition-opacity'} />
                    </button>
                  ))}
                </div>

                {/* Main Text Panel */}
                <div className="flex-1 flex flex-col overflow-hidden">
                  
                  {/* Local Search input */}
                  <div className="p-4 border-b border-slate-200 dark:border-zinc-800/50 bg-white dark:bg-[#0f1115] flex items-center gap-3">
                    <Search size={15} className="text-slate-400 dark:text-zinc-500" />
                    <input 
                      type="text" 
                      placeholder={`Search within ${selectedDoc.title}...`}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-transparent border-none outline-none text-xs text-slate-800 dark:text-zinc-300 placeholder-slate-400 dark:placeholder-zinc-600 font-medium"
                    />
                    {searchQuery && (
                      <button 
                        onClick={() => setSearchQuery('')}
                        className="text-xs text-slate-400 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-zinc-300 font-bold bg-transparent border-none cursor-pointer"
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  {/* Scrollable text list */}
                  <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 text-left leading-relaxed text-sm text-slate-600 dark:text-zinc-400">
                    
                    {filteredSections.map((section, index) => {
                      const hasRegNote = section.regionalNote && section.regionalNote.region === activeRegion;
                      return (
                        <div key={index} className="space-y-3 pb-6 border-b border-slate-200 dark:border-zinc-800/40 last:border-0">
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white tracking-wide">
                            {section.title}
                          </h4>
                          <p className="leading-relaxed text-xs text-slate-600 dark:text-zinc-400 whitespace-pre-line font-normal">
                            {section.content}
                          </p>

                          {/* Highlight regional clauses matching selected context */}
                          {hasRegNote && (
                            <div className="p-4 bg-slate-50 dark:bg-zinc-900 border-l-2 border-blue-650 rounded-r-2xl space-y-1.5">
                              <span className="text-[9px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest block">
                                Local Annex: {section.regionalNote?.region}
                              </span>
                              <p className="text-xs text-slate-700 dark:text-zinc-350 leading-relaxed font-normal">
                                {section.regionalNote?.text}
                              </p>
                            </div>
                          )}

                          {/* If other regional notes exist but not active, show expandable alert */}
                          {section.regionalNote && section.regionalNote.region !== activeRegion && (
                            <div className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-zinc-500 font-medium">
                              <AlertTriangle size={10} className="text-slate-400 dark:text-zinc-600" />
                              <span>Localized clause exists for the <button onClick={() => setActiveRegion(section.regionalNote!.region)} className="text-slate-500 dark:text-zinc-400 hover:underline font-semibold bg-transparent border-none p-0 cursor-pointer">{section.regionalNote.region}</button> region.</span>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {filteredSections.length === 0 && (
                      <div className="py-12 text-center text-slate-400 dark:text-zinc-500">
                        <Search size={28} className="mx-auto mb-3 opacity-30" />
                        <p className="font-bold text-xs">No matches found</p>
                      </div>
                    )}

                    {/* Disclaimer Footnote */}
                    <div className="mt-12 p-4 bg-slate-50 dark:bg-zinc-900/50 rounded-2xl border border-slate-200 dark:border-zinc-800/80 text-xs text-slate-500 flex gap-3">
                      <Info size={15} className="text-slate-400 dark:text-zinc-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-slate-700 dark:text-zinc-400 block mb-1">Ecosystem Operations Validation</span>
                        These frameworks govern services on ATECH East Africa globally. Licensing and multi-branch movements remain subject to state FDA parameters.
                      </div>
                    </div>

                  </div>

                  {/* Modal Footer Controls */}
                  <div className="p-4 border-t border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-[#0b0c10]/80 flex flex-col sm:flex-row justify-between items-center gap-3">
                    <span className="text-[11px] text-slate-400 dark:text-zinc-500 font-medium">
                      Accepting or closing acknowledges digital service parameters.
                    </span>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button 
                        onClick={() => {
                          toast.success(`${selectedDoc.title} Downloaded!`);
                        }}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                      >
                        <Download size={13} /> PDF
                      </button>

                      <button 
                        onClick={() => {
                          toast.success(`Agreed to ${selectedDoc.title}`);
                          setSelectedDocId(null);
                        }}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-1 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                      >
                        <CheckCircle size={13} /> Accept
                      </button>
                    </div>
                  </div>

                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Cookie Preferences Side Modal */}
      <AnimatePresence>
        {cookiePreferencesOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 dark:bg-black/70 backdrop-blur-sm">
            <div className="absolute inset-0" onClick={() => setCookiePreferencesOpen(false)} />

            <motion.div
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.98, opacity: 0 }}
              className="relative w-full max-w-md bg-white dark:bg-[#0f1115] border border-slate-200 dark:border-zinc-800 shadow-2xl rounded-3xl p-6 z-10 text-slate-700 dark:text-zinc-300 text-left space-y-6"
            >
              <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <Globe className="text-blue-600 dark:text-blue-400" size={16} />
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white tracking-wide uppercase">Cookie Preferences</h3>
                </div>
                <button 
                  onClick={() => setCookiePreferencesOpen(false)}
                  className="p-1 text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-350 font-bold bg-transparent border-none text-lg cursor-pointer"
                >
                  &times;
                </button>
              </div>

              <p className="text-xs text-slate-500 dark:text-zinc-500 leading-relaxed">
                {settings?.cookiePreferencesDescription || 'ATECH East Africa uses essential parameters to secure logins, keep track of multi-branch sync operations, and hold offline invoice logs.'}
              </p>

              <div className="space-y-4">
                
                {/* Switch 1 */}
                <div className="flex justify-between items-start gap-4 p-3 bg-slate-50 dark:bg-zinc-900 rounded-2xl border border-slate-150 dark:border-zinc-800/50">
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">Necessary Cookies</h4>
                    <p className="text-[10px] text-slate-500 dark:text-zinc-500 leading-normal">Required for secure authentication and offline databases. Cannot be customized.</p>
                  </div>
                  <input type="checkbox" checked disabled className="h-4 w-4 text-zinc-600 rounded mt-1 cursor-not-allowed" />
                </div>

                {/* Switch 2 */}
                <div className="flex justify-between items-start gap-4 p-3 bg-slate-50 dark:bg-zinc-900 rounded-2xl border border-slate-150 dark:border-zinc-800/50">
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">Functional Customization</h4>
                    <p className="text-[10px] text-slate-500 dark:text-zinc-500 leading-normal">Remembers language choices, chart densities, and collapsible settings.</p>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={cookiesConfig.functional} 
                    onChange={(e) => setCookiesConfig({ ...cookiesConfig, functional: e.target.checked })}
                    className="h-4 w-4 accent-blue-600 rounded mt-1 cursor-pointer" 
                  />
                </div>

                {/* Switch 3 */}
                <div className="flex justify-between items-start gap-4 p-3 bg-slate-50 dark:bg-zinc-900 rounded-2xl border border-slate-150 dark:border-zinc-800/50">
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">Internal Analytics</h4>
                    <p className="text-[10px] text-slate-500 dark:text-zinc-500 leading-normal">Anonymously tracks slow loading API responses to aid our diagnostics.</p>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={cookiesConfig.analytics} 
                    onChange={(e) => setCookiesConfig({ ...cookiesConfig, analytics: e.target.checked })}
                    className="h-4 w-4 accent-blue-600 rounded mt-1 cursor-pointer" 
                  />
                </div>

              </div>

              <div className="flex justify-between items-center pt-4 border-t border-slate-200 dark:border-zinc-800">
                <button 
                  onClick={() => {
                    setCookiesConfig({ strictlyNecessary: true, functional: true, analytics: true });
                    toast.success('Approved all optional components');
                  }}
                  className="text-xs font-bold text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white bg-transparent border-none cursor-pointer"
                >
                  Accept All
                </button>
                <button 
                  onClick={handleSaveCookiePreferences}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold px-4 py-2 cursor-pointer"
                >
                  Save Settings
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </footer>
  );
}
