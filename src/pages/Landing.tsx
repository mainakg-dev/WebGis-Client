import { MainHeader } from '#/components/MainHeader'
import { Link } from '@tanstack/react-router'
import {
  Activity,
  Database,
  Eye,
  HelpCircle,
  Map,
  PhoneCall,
  Send,
  Shield,
  Sparkles,
} from 'lucide-react'
import React, { useState } from 'react'
import { useApp } from '../components/AppContext'
import { Footer } from '../components/Footer'

export function LandingPage() {
  const { language } = useApp()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  })
  const [formSubmitted, setFormSubmitted] = useState(false)

  // Translations
  const t = {
    en: {
      heroTitle: 'State-of-the-Art WebGIS Platform',
      heroSubtitle: 'Power Transmission Corporation Limited',
      heroDesc:
        'Visualizing, managing, and optimizing the grid transmission network. Track feeders, locate towers, and review drone inspection data within a secure, high-availability GIS interface.',
      launchBtn: 'Launch GIS Map',
      learnMoreBtn: 'Learn More',
      statLines: 'Transmission Lines',
      statLinesSub: '16,500+ Circuit km',
      statSubs: 'Grid Substations',
      statSubsSub: '190+ Grid Substations',
      statTowers: 'Tower Assets',
      statTowersSub: '120,005+ Assets mapped',
      statAvail: 'Grid Availability',
      statAvailSub: '99.98% operational uptime',
      featuresTitle: 'Platform Key Features',
      featuresSubtitle:
        'Explore the advanced utility capabilities built into the GIS Portal',
      feat1Title: 'Asset Proximity Buffering',
      feat1Desc:
        'Automated 50m spatial buffer algorithms that associate RGB & Thermal drone photography directly to the closest transmission towers.',
      feat2Title: 'Dual-Spectrum Inspections',
      feat2Desc:
        'Integrates RGB orthomosaic maps and thermal PDF reports to detect overheating hot-spots and line sag instantly.',
      feat3Title: 'Multi-Layer GIS Layers',
      feat3Desc:
        'Toggle map layers dynamically including high-voltage circuits, regional boundaries, substation buffers, and base maps.',
      contactTitle: 'Support & Helpdesk',
      contactSubtitle:
        'Get in touch with the GIS Operations and Systems Administration Team',
      formName: 'Full Name',
      formEmail: 'Email Address',
      formSubject: 'Subject',
      formMessage: 'Message Description',
      formSubmit: 'Submit Support Ticket',
      formSuccess:
        'Thank you! Your ticket has been submitted. Our team will review and get back to you shortly.',
      officeCard: 'Headquarters Office',
      phoneCard: 'Support Helpdesk',
    },
    hi: {
      heroTitle: 'अत्याधुनिक वेब-जीआईएस प्लेटफॉर्म',
      heroSubtitle: 'पावर ट्रांसमिशन कॉर्पोरेशन लिमिटेड',
      heroDesc:
        'ग्रिड पारेषण नेटवर्क की निगरानी, प्रबंधन और अनुकूलन। एक सुरक्षित और उच्च-उपलब्धता वाले जीआईएस इंटरफेस में फीडर ट्रैक करें, टावर खोजें और ड्रोन निरीक्षण डेटा की समीक्षा करें।',
      launchBtn: 'जीआईएस मैप खोलें',
      learnMoreBtn: 'अधिक जानें',
      statLines: 'पारेषण लाइनें',
      statLinesSub: '16,500+ सर्किट किमी',
      statSubs: 'ग्रिड सबस्टेशन',
      statSubsSub: '190+ ग्रिड सबस्टेशन',
      statTowers: 'टावर संपत्ति',
      statTowersSub: '1,20,000+ संपत्ति मैप',
      statAvail: 'ग्रिड उपलब्धता',
      statAvailSub: '99.98% परिचालन समय',
      featuresTitle: 'प्लेटफ़ॉर्म की मुख्य विशेषताएं',
      featuresSubtitle:
        'जीआईएस पोर्टल में निर्मित उन्नत उपयोगिता क्षमताओं का अन्वेषण करें',
      feat1Title: 'सम्पत्ति सीमा बफरिंग',
      feat1Desc:
        'स्वचालित 50 मीटर स्थानिक बफर एल्गोरिदम जो आरजीबी और थर्मल ड्रोन छवियों को निकटतम पारेषण टावरों से जोड़ते हैं।',
      feat2Title: 'दोहरी-स्पेक्ट्रम निरीक्षण',
      feat2Desc:
        'हॉट-स्पॉट और लाइन समस्याओं का तुरंत पता लगाने के लिए आरजीबी और थर्मल पीडीएफ रिपोर्ट को एकीकृत करता है।',
      feat3Title: 'बहु-स्तरीय जीआईएस परतें',
      feat3Desc:
        'हाई-वोल्टेज सर्किट, क्षेत्रीय सीमाओं, सबस्टेशन बफर और बेस मैप के साथ मैप स्तरों को बदलें।',
      contactTitle: 'सहायता और हेल्पडेस्क',
      contactSubtitle: 'जीआईएस संचालन और सिस्टम प्रशासन टीम से संपर्क करें',
      formName: 'पूरा नाम',
      formEmail: 'ईमेल पता',
      formSubject: 'विषय',
      formMessage: 'विवरण',
      formSubmit: 'टिकट जमा करें',
      formSuccess:
        'धन्यवाद! आपका टिकट जमा हो गया है। हमारी टीम जल्द ही आपसे संपर्क करेगी।',
      officeCard: 'मुख्य कार्यालय',
      phoneCard: 'सहायता हेल्पडेस्क',
    },
  }[language]

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFormSubmitted(true)
    setTimeout(() => {
      setFormData({ name: '', email: '', subject: '', message: '' })
      setFormSubmitted(false)
    }, 4000)
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-300 font-sans">
      <MainHeader />

      {/* Main Content Area */}
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden py-16">
          {/* Background Hero Image */}
          <div className="absolute inset-0 z-0">
            <img
              src="/optcl_hero.png"
              alt="PTCL Transmission Line"
              className="w-full h-full object-cover object-center"
            />
            {/* Glassmorphism overlay — unified for both themes */}
            <div className="absolute inset-0 backdrop-blur-sm bg-gradient-to-r from-white/30 via-white/15 to-transparent dark:from-slate-950/30 dark:via-slate-950/15 dark:to-transparent transition-all duration-500" />
            <div className="absolute inset-0 bg-blue-500/[0.03] backdrop-saturate-125 mix-blend-overlay transition-all duration-500" />
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-4 w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Content Column */}
            <div className="lg:col-span-8 space-y-6 text-left">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 dark:bg-cyan-500/20 border border-blue-200 dark:border-cyan-500/30 text-xs font-bold text-blue-600 dark:text-cyan-300 tracking-wide uppercase animate-pulse">
                <Sparkles className="w-3.5 h-3.5" />
                <span>GIS Portal v2.0</span>
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-none transition-colors duration-500">
                {t.heroTitle}
              </h1>
              <p className="text-lg sm:text-xl font-bold text-blue-600 dark:text-cyan-400 transition-colors duration-500">
                {t.heroSubtitle}
              </p>
              <p className="text-sm sm:text-base text-slate-650 dark:text-slate-300 max-w-2xl leading-relaxed transition-colors duration-500">
                {t.heroDesc}
              </p>
              <div className="flex flex-wrap items-center gap-4 pt-4">
                <Link
                  to="/map"
                  className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white font-extrabold px-6 py-3.5 rounded-xl shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 active:scale-[0.98] transition-all text-sm flex items-center gap-2 group"
                >
                  <Map className="w-4 h-4 text-white" />
                  <span>{t.launchBtn}</span>
                </Link>
                <a
                  href="#stats"
                  className="bg-slate-900/80 hover:bg-slate-800/80 text-slate-300 font-bold px-6 py-3.5 rounded-xl border border-slate-700/60 hover:text-white transition-all text-sm active:scale-[0.98]"
                >
                  {t.learnMoreBtn}
                </a>
              </div>
            </div>

            {/* Right Card / Fast Entry Portal */}
            <div className="lg:col-span-4 hidden lg:block animate-fade-in">
              <div className="bg-white/70 dark:bg-slate-900/65 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden transition-all duration-500">
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-500 to-cyan-500 opacity-60" />
                <h3 className="text-slate-900 dark:text-white font-bold text-md mb-4 flex items-center gap-2 transition-colors duration-500">
                  <Shield className="w-5 h-5 text-blue-600 dark:text-cyan-400 transition-colors duration-500" />
                  <span>Secure GIS Gateway</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-6 transition-colors duration-500">
                  Access is restricted to authorized PTCL personnel, engineers,
                  and sub-contractors with valid credentials.
                </p>
                <div className="space-y-3">
                  <Link
                    to="/login"
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white rounded-xl py-3 text-xs font-bold transition-all shadow-md hover:shadow-lg active:scale-[0.98]"
                  >
                    Authenticate / Login
                  </Link>
                  <a
                    href="https://powermin.gov.in"
                    target="_blank"
                    rel="noreferrer"
                    className="w-full block text-center border border-slate-200 dark:border-slate-800 hover:border-slate-350 dark:hover:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-800/35 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-300 rounded-xl py-3 text-xs font-bold transition-all"
                  >
                    PTCL IT Helpdesk
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Statistics highlights bar */}
        <section
          id="stats"
          className="py-12 bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800 transition-colors duration-300"
        >
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div className="p-4 space-y-1">
                <span className="text-2xl sm:text-3xl font-black text-blue-600 dark:text-cyan-400 block tracking-tight">
                  {t.statLinesSub.split(' ')[0]}
                </span>
                <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-white block">
                  {t.statLines}
                </span>
                <span className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 block font-semibold">
                  Across 30 districts
                </span>
              </div>

              <div className="p-4 space-y-1">
                <span className="text-2xl sm:text-3xl font-black text-blue-600 dark:text-cyan-400 block tracking-tight">
                  {t.statSubsSub.split(' ')[0]}
                </span>
                <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-white block">
                  {t.statSubs}
                </span>
                <span className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 block font-semibold">
                  Up to 400kV Capacity
                </span>
              </div>

              <div className="p-4 space-y-1">
                <span className="text-2xl sm:text-3xl font-black text-blue-600 dark:text-cyan-400 block tracking-tight">
                  {t.statTowersSub.split(' ')[0]}
                </span>
                <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-white block">
                  {t.statTowers}
                </span>
                <span className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 block font-semibold">
                  Fully geo-tagged
                </span>
              </div>

              <div className="p-4 space-y-1">
                <span className="text-2xl sm:text-3xl font-black text-blue-600 dark:text-cyan-400 block tracking-tight">
                  {t.statAvailSub.split(' ')[0]}
                </span>
                <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-white block">
                  {t.statAvail}
                </span>
                <span className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 block font-semibold">
                  Under STU standard
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Overview Section */}
        <section className="py-20 bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {t.featuresTitle}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-xl mx-auto">
              {t.featuresSubtitle}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
              {/* Feature 1: Buffering */}
              <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200/60 dark:border-slate-800/80 shadow-sm hover:shadow-md hover:border-blue-500/20 dark:hover:border-cyan-500/20 transition-all flex flex-col items-center text-center group">
                <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-cyan-500/10 flex items-center justify-center text-blue-600 dark:text-cyan-400 mb-6 group-hover:scale-110 transition-transform">
                  <Eye className="w-6 h-6" />
                </div>
                <h3 className="font-extrabold text-lg text-slate-800 dark:text-white">
                  {t.feat1Title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-3">
                  {t.feat1Desc}
                </p>
              </div>

              {/* Feature 2: Dual Spectrum */}
              <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200/60 dark:border-slate-800/80 shadow-sm hover:shadow-md hover:border-blue-500/20 dark:hover:border-cyan-500/20 transition-all flex flex-col items-center text-center group">
                <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-cyan-500/10 flex items-center justify-center text-blue-600 dark:text-cyan-400 mb-6 group-hover:scale-110 transition-transform">
                  <Activity className="w-6 h-6" />
                </div>
                <h3 className="font-extrabold text-lg text-slate-800 dark:text-white">
                  {t.feat2Title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-3">
                  {t.feat2Desc}
                </p>
              </div>

              {/* Feature 3: Map Layers */}
              <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200/60 dark:border-slate-800/80 shadow-sm hover:shadow-md hover:border-blue-500/20 dark:hover:border-cyan-500/20 transition-all flex flex-col items-center text-center group">
                <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-cyan-500/10 flex items-center justify-center text-blue-600 dark:text-cyan-400 mb-6 group-hover:scale-110 transition-transform">
                  <Database className="w-6 h-6" />
                </div>
                <h3 className="font-extrabold text-lg text-slate-800 dark:text-white">
                  {t.feat3Title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-3">
                  {t.feat3Desc}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Us Section */}
        <section
          id="contact-section"
          className="py-20 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800/80 transition-colors duration-300"
        >
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              {/* Left Column: Form Info */}
              <div className="lg:col-span-5 space-y-6">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                    {t.contactTitle}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                    {t.contactSubtitle}
                  </p>
                </div>

                <div className="space-y-4">
                  {/* HQ Address card */}
                  <div className="flex gap-4 p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-850 transition-all">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-cyan-500/10 flex items-center justify-center text-blue-600 dark:text-cyan-400 shrink-0">
                      <PhoneCall className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-800 dark:text-white">
                        {t.officeCard}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal mt-1">
                        Grid HQ Building, Sector 6, New Delhi, 110001
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold mt-1">
                        Fax: +91 (11) 23717565
                      </p>
                    </div>
                  </div>

                  {/* Contact Helpdesk card */}
                  <div className="flex gap-4 p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-850 transition-all">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-cyan-500/10 flex items-center justify-center text-blue-600 dark:text-cyan-400 shrink-0">
                      <HelpCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-800 dark:text-white">
                        {t.phoneCard}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal mt-1">
                        GIS Division, IT & Telecom Department
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold mt-1">
                        E-support: gis.support@ptcl.gov.in
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Interactive Form */}
              <div className="lg:col-span-7">
                <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800/80 p-8 rounded-3xl shadow-sm">
                  {formSubmitted ? (
                    <div className="px-6 py-8 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-center text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                      {t.formSuccess}
                    </div>
                  ) : (
                    <form onSubmit={handleFormSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-500 dark:text-slate-400">
                            {t.formName}
                          </label>
                          <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) =>
                              setFormData({ ...formData, name: e.target.value })
                            }
                            className="w-full px-4 py-3 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500 dark:focus:border-cyan-500 transition-all"
                            placeholder="John Doe"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-500 dark:text-slate-400">
                            {t.formEmail}
                          </label>
                          <input
                            type="email"
                            required
                            value={formData.email}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                email: e.target.value,
                              })
                            }
                            className="w-full px-4 py-3 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500 dark:focus:border-cyan-500 transition-all"
                            placeholder="john@ptcl.gov.in"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400">
                          {t.formSubject}
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.subject}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              subject: e.target.value,
                            })
                          }
                          className="w-full px-4 py-3 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500 dark:focus:border-cyan-500 transition-all"
                          placeholder="GIS access issue / Tower mapping request"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400">
                          {t.formMessage}
                        </label>
                        <textarea
                          required
                          rows={4}
                          value={formData.message}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              message: e.target.value,
                            })
                          }
                          className="w-full px-4 py-3 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500 dark:focus:border-cyan-500 transition-all resize-none"
                          placeholder="Describe your issue or feedback here..."
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white rounded-xl py-3.5 text-xs font-bold shadow-md hover:shadow-lg transition-all active:scale-[0.98]"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{t.formSubmit}</span>
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
