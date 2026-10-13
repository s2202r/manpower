import type { Locale } from './index'

export type TranslationKey =
  | 'nav.sign_in'
  | 'nav.join_free'
  | 'nav.browse_tasks'
  | 'nav.post_task'
  | 'nav.dashboard'
  | 'auth.tab_sign_in'
  | 'auth.tab_create'
  | 'auth.no_account'
  | 'auth.have_account'
  | 'auth.create_one_free'
  | 'auth.sign_in_link'
  | 'auth.email'
  | 'auth.password'
  | 'auth.your_name'
  | 'auth.sign_in_btn'
  | 'auth.create_btn'
  | 'auth.magic_link_btn'
  | 'auth.magic_sent'
  | 'auth.use_password'
  | 'auth.use_magic'

type Dict = Partial<Record<TranslationKey, string>>

const en: Dict = {
  'nav.sign_in': 'Sign in',
  'nav.join_free': 'Join free',
  'nav.browse_tasks': 'Browse tasks',
  'nav.post_task': 'Post a task',
  'nav.dashboard': 'Dashboard',
  'auth.tab_sign_in': 'Sign in',
  'auth.tab_create': 'Create account',
  'auth.no_account': 'No account?',
  'auth.have_account': 'Already have one?',
  'auth.create_one_free': 'Create one free',
  'auth.sign_in_link': 'Sign in',
  'auth.email': 'Email address',
  'auth.password': 'Password',
  'auth.your_name': 'Your name',
  'auth.sign_in_btn': 'Sign in',
  'auth.create_btn': 'Create account',
  'auth.magic_link_btn': 'Send magic link',
  'auth.magic_sent': 'Check your email for a sign-in link.',
  'auth.use_password': 'Sign in with password instead',
  'auth.use_magic': 'Sign in with magic link instead',
}

const hi: Dict = {
  'nav.sign_in': 'साइन इन',
  'nav.join_free': 'मुफ़्त जुड़ें',
  'nav.browse_tasks': 'काम देखें',
  'nav.post_task': 'काम पोस्ट करें',
  'nav.dashboard': 'डैशबोर्ड',
  'auth.tab_sign_in': 'साइन इन',
  'auth.tab_create': 'खाता बनाएं',
  'auth.no_account': 'खाता नहीं है?',
  'auth.have_account': 'पहले से खाता है?',
  'auth.create_one_free': 'मुफ़्त बनाएं',
  'auth.sign_in_link': 'साइन इन करें',
  'auth.email': 'ईमेल पता',
  'auth.password': 'पासवर्ड',
  'auth.your_name': 'आपका नाम',
  'auth.sign_in_btn': 'साइन इन करें',
  'auth.create_btn': 'खाता बनाएं',
  'auth.magic_link_btn': 'मैजिक लिंक भेजें',
  'auth.magic_sent': 'साइन-इन लिंक के लिए अपना ईमेल देखें।',
  'auth.use_password': 'पासवर्ड से साइन इन करें',
  'auth.use_magic': 'मैजिक लिंक से साइन इन करें',
}

const bn: Dict = {
  'nav.sign_in': 'সাইন ইন',
  'nav.join_free': 'বিনামূল্যে যোগ দিন',
  'nav.browse_tasks': 'কাজ দেখুন',
  'nav.post_task': 'কাজ পোস্ট করুন',
  'nav.dashboard': 'ড্যাশবোর্ড',
  'auth.tab_sign_in': 'সাইন ইন',
  'auth.tab_create': 'অ্যাকাউন্ট তৈরি করুন',
  'auth.no_account': 'অ্যাকাউন্ট নেই?',
  'auth.have_account': 'ইতিমধ্যে আছে?',
  'auth.create_one_free': 'বিনামূল্যে তৈরি করুন',
  'auth.sign_in_link': 'সাইন ইন করুন',
  'auth.email': 'ইমেইল ঠিকানা',
  'auth.password': 'পাসওয়ার্ড',
  'auth.your_name': 'আপনার নাম',
  'auth.sign_in_btn': 'সাইন ইন করুন',
  'auth.create_btn': 'অ্যাকাউন্ট তৈরি করুন',
  'auth.magic_link_btn': 'ম্যাজিক লিংক পাঠান',
  'auth.magic_sent': 'সাইন-ইন লিঙ্কের জন্য আপনার ইমেল দেখুন।',
  'auth.use_password': 'পাসওয়ার্ড দিয়ে সাইন ইন করুন',
  'auth.use_magic': 'ম্যাজিক লিংক দিয়ে সাইন ইন করুন',
}

const mr: Dict = {
  'nav.sign_in': 'साइन इन',
  'nav.join_free': 'मोफत सामील व्हा',
  'nav.browse_tasks': 'काम पहा',
  'nav.post_task': 'काम पोस्ट करा',
  'nav.dashboard': 'डॅशबोर्ड',
  'auth.tab_sign_in': 'साइन इन',
  'auth.tab_create': 'खाते तयार करा',
  'auth.no_account': 'खाते नाही?',
  'auth.have_account': 'आधीच खाते आहे?',
  'auth.create_one_free': 'मोफत तयार करा',
  'auth.sign_in_link': 'साइन इन करा',
  'auth.email': 'ईमेल पत्ता',
  'auth.password': 'पासवर्ड',
  'auth.your_name': 'तुमचे नाव',
  'auth.sign_in_btn': 'साइन इन करा',
  'auth.create_btn': 'खाते तयार करा',
  'auth.magic_link_btn': 'मॅजिक लिंक पाठवा',
  'auth.magic_sent': 'साइन-इन लिंकसाठी तुमचा ईमेल तपासा.',
  'auth.use_password': 'पासवर्डने साइन इन करा',
  'auth.use_magic': 'मॅजिक लिंकने साइन इन करा',
}

const te: Dict = {
  'nav.sign_in': 'సైన్ ఇన్',
  'nav.join_free': 'ఉచితంగా చేరండి',
  'nav.browse_tasks': 'పనులు చూడండి',
  'nav.post_task': 'పని పోస్ట్ చేయండి',
  'nav.dashboard': 'డ్యాష్‌బోర్డ్',
  'auth.tab_sign_in': 'సైన్ ఇన్',
  'auth.tab_create': 'ఖాతా సృష్టించండి',
  'auth.no_account': 'ఖాతా లేదా?',
  'auth.have_account': 'ఇప్పటికే ఉందా?',
  'auth.email': 'ఇమెయిల్ చిరునామా',
  'auth.password': 'పాస్‌వర్డ్',
  'auth.your_name': 'మీ పేరు',
  'auth.sign_in_btn': 'సైన్ ఇన్ చేయండి',
  'auth.create_btn': 'ఖాతా సృష్టించండి',
}

const ta: Dict = {
  'nav.sign_in': 'உள்நுழைக',
  'nav.join_free': 'இலவசமாக சேருங்கள்',
  'nav.browse_tasks': 'பணிகள் பார்க்க',
  'nav.post_task': 'பணி இடுங்கள்',
  'nav.dashboard': 'டாஷ்போர்டு',
  'auth.tab_sign_in': 'உள்நுழைக',
  'auth.tab_create': 'கணக்கு உருவாக்கு',
  'auth.no_account': 'கணக்கு இல்லையா?',
  'auth.have_account': 'ஏற்கனவே உள்ளதா?',
  'auth.email': 'மின்னஞ்சல் முகவரி',
  'auth.password': 'கடவுச்சொல்',
  'auth.your_name': 'உங்கள் பெயர்',
  'auth.sign_in_btn': 'உள்நுழைக',
  'auth.create_btn': 'கணக்கு உருவாக்கு',
}

const gu: Dict = {
  'nav.sign_in': 'સાઇન ઇન',
  'nav.join_free': 'મફત જોડાઓ',
  'nav.browse_tasks': 'કામ જુઓ',
  'nav.post_task': 'કામ પોસ્ટ કરો',
  'nav.dashboard': 'ડૅશબોર્ડ',
  'auth.tab_sign_in': 'સાઇન ઇન',
  'auth.tab_create': 'ખાતું બનાવો',
  'auth.no_account': 'ખાતું નથી?',
  'auth.have_account': 'પહેલેથી છે?',
  'auth.email': 'ઇમેઇલ સરનામું',
  'auth.password': 'પાસવર્ડ',
  'auth.your_name': 'તમારું નામ',
  'auth.sign_in_btn': 'સાઇન ઇન કરો',
  'auth.create_btn': 'ખાતું બનાવો',
}

const ur: Dict = {
  'nav.sign_in': 'سائن ان',
  'nav.join_free': 'مفت شامل ہوں',
  'nav.browse_tasks': 'کام دیکھیں',
  'nav.post_task': 'کام پوسٹ کریں',
  'nav.dashboard': 'ڈیش بورڈ',
  'auth.tab_sign_in': 'سائن ان',
  'auth.tab_create': 'اکاؤنٹ بنائیں',
  'auth.no_account': 'اکاؤنٹ نہیں ہے؟',
  'auth.have_account': 'پہلے سے ہے؟',
  'auth.email': 'ای میل پتہ',
  'auth.password': 'پاس ورڈ',
  'auth.your_name': 'آپ کا نام',
  'auth.sign_in_btn': 'سائن ان کریں',
  'auth.create_btn': 'اکاؤنٹ بنائیں',
}

const kn: Dict = {
  'nav.sign_in': 'ಸೈನ್ ಇನ್',
  'nav.join_free': 'ಉಚಿತವಾಗಿ ಸೇರಿ',
  'nav.browse_tasks': 'ಕೆಲಸ ನೋಡಿ',
  'nav.post_task': 'ಕೆಲಸ ಪೋಸ್ಟ್ ಮಾಡಿ',
  'nav.dashboard': 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್',
  'auth.tab_sign_in': 'ಸೈನ್ ಇನ್',
  'auth.tab_create': 'ಖಾತೆ ರಚಿಸಿ',
  'auth.email': 'ಇಮೇಲ್ ವಿಳಾಸ',
  'auth.password': 'ಪಾಸ್‌ವರ್ಡ್',
  'auth.your_name': 'ನಿಮ್ಮ ಹೆಸರು',
}

const or: Dict = {
  'nav.sign_in': 'ସାଇନ ଇନ',
  'nav.join_free': 'ମାଗଣା ଯୋଗ ଦିଅନ୍ତୁ',
  'nav.browse_tasks': 'କାମ ଦେଖନ୍ତୁ',
  'nav.post_task': 'କାମ ପୋଷ୍ଟ କରନ୍ତୁ',
  'nav.dashboard': 'ଡ୍ୟାସବୋର୍ଡ',
  'auth.tab_sign_in': 'ସାଇନ ଇନ',
  'auth.tab_create': 'ଖାତା ତିଆରି କରନ୍ତୁ',
  'auth.email': 'ଇମେଲ ଠିକଣା',
  'auth.password': 'ପାସୱାର୍ଡ',
  'auth.your_name': 'ଆପଣଙ୍କ ନାମ',
}

const ml: Dict = {
  'nav.sign_in': 'സൈൻ ഇൻ',
  'nav.join_free': 'സൗജന്യമായി ചേരൂ',
  'nav.browse_tasks': 'ജോലികൾ കാണുക',
  'nav.post_task': 'ജോലി പോസ്റ്റ് ചെയ്യുക',
  'nav.dashboard': 'ഡാഷ്‌ബോർഡ്',
  'auth.tab_sign_in': 'സൈൻ ഇൻ',
  'auth.tab_create': 'അക്കൗണ്ട് സൃഷ്ടിക്കുക',
  'auth.email': 'ഇമെയിൽ വിലാസം',
  'auth.password': 'പാസ്‌വേഡ്',
  'auth.your_name': 'നിങ്ങളുടെ പേര്',
}

const pa: Dict = {
  'nav.sign_in': 'ਸਾਈਨ ਇਨ',
  'nav.join_free': 'ਮੁਫ਼ਤ ਸ਼ਾਮਲ ਹੋਵੋ',
  'nav.browse_tasks': 'ਕੰਮ ਦੇਖੋ',
  'nav.post_task': 'ਕੰਮ ਪੋਸਟ ਕਰੋ',
  'nav.dashboard': 'ਡੈਸ਼ਬੋਰਡ',
  'auth.tab_sign_in': 'ਸਾਈਨ ਇਨ',
  'auth.tab_create': 'ਖਾਤਾ ਬਣਾਓ',
  'auth.email': 'ਈਮੇਲ ਪਤਾ',
  'auth.password': 'ਪਾਸਵਰਡ',
  'auth.your_name': 'ਤੁਹਾਡਾ ਨਾਮ',
}

export const translations: Record<Locale, Dict> = {
  en, hi, bn, mr, te, ta, gu, ur, kn, or, ml, pa,
}

export function t(locale: Locale, key: TranslationKey): string {
  return translations[locale]?.[key] ?? translations.en[key] ?? key
}
