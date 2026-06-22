import { ExternalLink, Mail, MapPin, Phone, ShieldCheck } from 'lucide-react'
import { useApp } from './AppContext'

export function Footer() {
  const { language } = useApp()

  // Translations
  const t = {
    en: {
      aboutTitle: 'About OPTCL',
      aboutDesc:
        'Odisha Power Transmission Corporation Limited (OPTCL) is one of the largest transmission utilities in the country, transmitting power across the state of Odisha safely and efficiently.',
      linksTitle: 'Quick Links',
      contactTitle: 'Contact Us',
      addressLabel: 'Registered Office:',
      addressVal: 'Janpath, Bhubaneswar, Odisha, Pin-751022, India',
      phoneLabel: 'Phone:',
      emailLabel: 'Email:',
      copyright:
        'Odisha Power Transmission Corporation Limited © 2026. All rights reserved. Government of Odisha.',
      designedBy: 'Designed and Maintained by OPTCL IT & GIS Team',
      legalTitle: 'Legal & Info',
      terms: 'Terms of Use',
      privacy: 'Privacy Policy',
      disclaimer: 'Disclaimer',
    },
    or: {
      aboutTitle: 'ଓପିଟିସିଏଲ୍‌ ବିଷୟରେ',
      aboutDesc:
        'ଓଡ଼ିଶା ପାୱାର ଟ୍ରାନ୍ସମିସନ କର୍ପୋରେସନ ଲିମିଟେଡ୍ (ଓପିଟିସିଏଲ୍‌) ହେଉଛି ଦେଶର ଅନ୍ୟତମ ବୃହତ୍ତମ ବିଦ୍ୟୁତ ସଞ୍ଚାରଣ ସଂସ୍ଥା, ଯାହା ସମଗ୍ର ଓଡ଼ିଶାରେ ବିଦ୍ୟୁତ ସଞ୍ଚାରଣ ସୁରକ୍ଷିତ ଏବଂ ଦକ୍ଷତାର ସହିତ କରିଥାଏ।',
      linksTitle: 'ମୁଖ୍ୟ ଲିଙ୍କ୍',
      contactTitle: 'ଯୋଗାଯୋଗ',
      addressLabel: 'ପଞ୍ଜୀକୃତ କାର୍ଯ୍ୟାଳୟ:',
      addressVal: 'ଜନପଥ, ଭୁବନେଶ୍ୱର, ଓଡ଼ିଶା, ପିନ୍-୭୫୧୦୨୨, ଭାରତ',
      phoneLabel: 'ଫୋନ୍:',
      emailLabel: 'ଇମେଲ୍:',
      copyright:
        'ଓଡ଼ିଶା ପାୱାର ଟ୍ରାନ୍ସମିସନ କର୍ପୋରେସନ ଲିମିଟେଡ୍ © ୨୦୨୬। ସର୍ବାଧିକାର ସୁରକ୍ଷିତ। ଓଡ଼ିଶା ସରକାର।',
      designedBy: 'ଓପିଟିସିଏଲ୍‌ ଆଇଟି ଏବଂ ଜିଆଇଏସ୍ ଟିମ୍ ଦ୍ୱାରା ନିର୍ମିତ ଓ ପରିଚାଳିତ',
      legalTitle: 'ଆଇନଗତ ଓ ସୂଚନା',
      terms: 'ବ୍ୟବହାର ନିୟମାବଳୀ',
      privacy: 'ଗୋପନୀୟତା ନୀତି',
      disclaimer: 'ଦାବି ତ୍ୟାଗ',
    },
  }[language]

  const quickLinks = [
    { name: 'OPTCL Portal', url: 'https://www.optcl.co.in' },
    { name: 'Ministry of Power (GoI)', url: 'https://powermin.gov.in' },
    { name: 'GRID-INDIA', url: 'https://grid-india.in' },
    { name: 'OERC Odisha', url: 'https://www.oerc.gov.in' },
    { name: 'National Power Portal', url: 'https://npp.gov.in' },
  ]

  const legalLinks = [
    { name: t.terms, url: '#' },
    { name: t.privacy, url: '#' },
    { name: t.disclaimer, url: '#' },
  ]

  return (
    <footer className=" text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-950 transition-colors duration-300 font-sans">
      {/* Top Banner section */}
      <div className="bg-slate-950/60 py-10 px-4 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <svg
              className="w-10 h-10 text-cyan-400"
              viewBox="0 0 100 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle
                cx="50"
                cy="50"
                r="46"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                d="M50 20 L30 80 M50 20 L70 80 M30 80 L70 80"
                stroke="currentColor"
                strokeWidth="3.5"
              />
              <path
                d="M40 50 L60 50 M35 65 L65 65"
                stroke="currentColor"
                strokeWidth="2.5"
              />
            </svg>
            <div>
              <h2 className="text-slate-700 dark:text-slate-300 font-extrabold tracking-wide text-md">
                ODISHA POWER TRANSMISSION CORPORATION LIMITED
              </h2>
              <p className="text-xs text-slate-700 dark:text-slate-300 font-semibold mt-0.5">
                Lifeline of Odisha | State Transmission Utility (STU)
              </p>
            </div>
          </div>

          {/* Digital India and Make In India banner badges */}
          <div className="flex items-center gap-4">
            {/* Digital India white SVG logo container */}
            <div className="flex items-center gap-2 bg-slate-800/40 border border-slate-700/50 px-3 py-1.5 rounded-xl">
              <svg
                className="w-8 h-8"
                viewBox="0 0 100 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M20 50 A30 30 0 0 1 80 50"
                  stroke="#f97316"
                  strokeWidth="6"
                />
                <path
                  d="M80 50 A30 30 0 0 1 20 50"
                  stroke="#22c55e"
                  strokeWidth="6"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="14"
                  stroke="#60a5fa"
                  strokeWidth="2"
                />
              </svg>
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-white leading-none">
                  Digital India
                </span>
                <span className="text-[7px] text-slate-400 font-bold leading-none mt-0.5">
                  Power To Empower
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-slate-800/40 border border-slate-700/50 px-3 py-1.5 rounded-xl text-[10px] font-bold text-slate-300">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span>Certified Secure</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main footer grid */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Column 1: About */}
          <div className="space-y-4">
            <h3 className="text-white text-sm font-bold uppercase tracking-wider relative pb-2 after:absolute after:bottom-0 after:left-0 after:w-8 after:h-[2px] after:bg-cyan-500">
              {t.aboutTitle}
            </h3>
            <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">
              {t.aboutDesc}
            </p>
          </div>

          {/* Column 2: Quick Links */}
          <div className="space-y-4">
            <h3 className="text-white text-sm font-bold uppercase tracking-wider relative pb-2 after:absolute after:bottom-0 after:left-0 after:w-8 after:h-[2px] after:bg-cyan-500">
              {t.linksTitle}
            </h3>
            <ul className="space-y-2.5 text-xs">
              {quickLinks.map((link, idx) => (
                <li key={idx}>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    className=" flex items-center gap-1.5 transition-colors group"
                  >
                    <span>{link.name}</span>
                    <ExternalLink className="w-3 h-3 text-slate-600 group-hover:text-cyan-400 transition-colors" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Legal info */}
          <div className="space-y-4">
            <h3 className="text-white text-sm font-bold uppercase tracking-wider relative pb-2 after:absolute after:bottom-0 after:left-0 after:w-8 after:h-[2px] after:bg-cyan-500">
              {t.legalTitle}
            </h3>
            <ul className="space-y-2.5 text-xs">
              {legalLinks.map((link, idx) => (
                <li key={idx}>
                  <a href={link.url} className=" transition-colors">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Contact Us */}
          <div className="space-y-4">
            <h3 className="text-white text-sm font-bold uppercase tracking-wider relative pb-2 after:absolute after:bottom-0 after:left-0 after:w-8 after:h-[2px] after:bg-cyan-500">
              {t.contactTitle}
            </h3>
            <ul className="space-y-3.5 text-xs">
              <li className="flex gap-2.5">
                <MapPin className="w-4 h-4 text-cyan-400 shrink-0" />
                <div>
                  <span className="font-bold text-slate-700 dark:text-slate-300 block">
                    {t.addressLabel}
                  </span>
                  <span className="text-slate-400">{t.addressVal}</span>
                </div>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-cyan-400 shrink-0" />
                <div>
                  <span className="font-bold text-slate-700 dark:text-slate-300 block">
                    {t.phoneLabel}
                  </span>
                  <a href="tel:+916742540051" className=" transition-colors">
                    +91 (674) 2540051
                  </a>
                </div>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-cyan-400 shrink-0" />
                <div>
                  <span className="font-bold text-slate-700 dark:text-slate-300 block">
                    {t.emailLabel}
                  </span>
                  <a
                    href="mailto:info@optcl.co.in"
                    className=" transition-colors"
                  >
                    info@optcl.co.in
                  </a>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Copyright bar */}
      <div className="bg-slate-950 py-6 px-4 text-center border-t border-slate-800/80">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] font-semibold text-slate-500">
          <span>{t.copyright}</span>
          <span className="text-slate-600 hover:text-slate-400 transition-colors">
            {t.designedBy}
          </span>
        </div>
      </div>
    </footer>
  )
}
