/* eslint-disable */
// The inspection tool's page logic, carried over from the original single-page tool.
// It renders into #main inside components/ToolApp.js and reaches the server only through
// window.claude (see legacy/shim.js), so the original behaviour stays exactly the same.
let started = false;
export function start(opts){
  opts = opts || {};
  if(started){
    // React dev mode may mount twice; the page is already wired, nothing more to do.
    if(!document.getElementById('main') || !document.getElementById('main').children.length) location.reload();
    return;
  }
  started = true;
  const READ_ONLY = !!opts.readOnly;
let dbNS=null, downloadsNS=null, assetsNS=null, sampleNS=null, sampleCaps=null;

let state = { inspections: [], diary: [] };
let settings = { officerName:"શ્રી જી. એલ. ઢાંકેચા", designation:"ઈન્ડસ્ટ્રીયલ સેફ્ટી એન્ડ હેલ્થ ઓફીસર", city:"નવસારી",
  consultantList: ["Self","Parimal","J Mehta","Kalpesh Shah","Atik Marfatiya","Javedbhai","Kantibhai Surat","Nanavati bhai","Nehal Choksi","Sajan Vichare","Tarapara"],
  safetyAuthorizeList: ["Aditya Enterprise","Arena consultant","Globle HSE Association","Jayati Institute of training","RBMS Safety Training & Consultancy Services"]
};
// Data read back from the database can come as read-only objects/arrays; the page edits its data in place
// (typing in a field, ticking a box, adding to a list), so always work on a plain copy.
function plain(o){ try{ return JSON.parse(JSON.stringify(o)); }catch(e){ return o; } }
async function addToListIfNew(listName, value){
  value = (value||'').trim();
  if(!value) return;
  const cur = Array.isArray(settings[listName]) ? settings[listName] : [];
  if(cur.some(x=>String(x).toLowerCase()===value.toLowerCase())) return;
  settings[listName] = [...cur, value];          // a new list — never modifies the stored one
  try{ await saveSettings(); }catch(e){}
}
let draft = null;
let editReturnTab = null;   // when a case that is already in પડતર / દફતર / બંધ કેસ is opened in the full form: where to go back to
let activeTab = READ_ONLY ? "pending" : "new";

const OFFICE_NAME = "મદદનીશ નિયામક, ઔદ્યોગિક સલામતી અને સ્વાસ્થ્યની કચેરી, નવસારી";
const OFFICE_ADDR = "૨૦૨, બીજો માળ, વિશ્વંભરી એપાર્ટમેન્ટ, સયાજી લાયબ્રેરી પાસે. ડીગી સ્ટ્રીટ, વોર્ડ નં.૮, નવસારી.";
const OFFICE_PHONE = "ટેલીફોન નં. 02637-230745  E-mail :- astdish-nav@gujarat.gov.in";
const PENALTY_TEXT = "આપને જણાવવાનું કે થ ઓક્યુપેશનલ સેફ્ટી, હેલ્થ અને વર્કીંગ કંડીશન્સ કોડ, ૨૦૨૦ ની કલમ-૯૪ હેઠળ મીનીમમ ૨ લાખ અને મહત્તમ ૩ લાખ સુઘીનો દંડ, સ્વાસ્થય અંગેની બાબતમાં કલમ-૧૦૨ હેઠળ કબ્જેદારને ફરજીયાત મહત્તમ ૨ વર્ષ સુઘીની જેલ અને ૫ લાખ સુઘીનો દંડ, રેકર્ડ રજુ નહી કરવા માટે કલમ-૯૬ હેઠળ મીનીમમ ૫૦ હજાર અને મહત્તમ ૨ લાખ સુઘીનો દંડની જોગવાઇ છે, જો ફેકટરી મેડિકલ ઓફિસર ઓક્યુપેશંલ ડિસીઝ જાહેર નહી કરે અને ઇરાદાપુર્વક છુપાવે તો તેને કલમ-૧૨(૩) મુજબ ૧૦ હજાર સુઘીનો દંડની જોગવાઇ છે. જે આપની જાણ સારું.";
const COMPLIANCE_TEXT = "આપશ્રીને આથી જણાવવામાં આવે છે કે હુકમમાં દર્શાવેલ અનિયમિતતાઓનું નિવારણ કરી, આ નોટિસ જારી થયાની તારીખથી ૩૦ દિવસની અંદર ૨ નકલમાં પાલનનો અહેવાલ અત્રેની કચેરીએ રજૂ કરશો. જો ૩૦ દિવસ પૂરા થતા પહેલા પૂર્તતા રજૂ કરવામાં ન આવે તો આ કાયદા ભંગ The Occupational Safety, Health & Working Conditions Code, 2020 ની કલમ- ૧૧૪ મુજબ કમ્પાઉન્ડિંગને પાત્ર છે, આથી નોટિસની બજવણી થયાની તારીખથી ૩૦ દિવસની સમય મર્યાદા પૂર્ણ થયા બાદ કમ્પાઉન્ડિંગ ઓફિસર ને સાથે સામેલ નમુના મુજબ ત્યાર બાદના દિન - ૩૦ માં કમ્પાઉન્ડિંગ માટે અરજી કરી તેની એક નકલ અત્રેની કચેરીએ રજૂ કરવાની રહેશે. તેમ કરવામાં કસૂર થયેથી કમ્પાઉન્ડિંગ માટેના ૩૦ દિવસ પૂર્ણ થયા બાદ અન્ય કોઈ પત્ર વ્યવહાર કર્યા વગર કાયદા ભંગ અન્વયે નામદાર કોર્ટમાં ફરિયાદ દાખલ કરવામાં આવશે.અન્યથા, આ બાબતે વધુ કોઈ પત્રવ્યવહાર કર્યા વિના સંબંધિત કાનૂની જોગવાઈઓ મુજબ જરૂરી કાર્યવાહી હાથ ધરવામાં આવશે. જેની ગંભીરતાપૂર્વક નોંધ લેવા વિનંતી.";
const SAFETY_SUGGESTIONS = [
  "કારખાનામાં મોક ડ્રીલ કરાવી રીપોર્ટ રજુ કરવો.",
  "કારખાનાનો ફાયર એડેક્યુસી રીપોર્ટ કરાવી મારી કચેરીએ રજુ કરવો.",
  "કારખાનામાં આવેલ ઈલેક્ટ્રીક પેનલના નીચેના ભાગમા રબ્બર મેટ લગાવવી.",
  "કારખાનામાં કટોકટીના સમયે પ્રકાશીત થાય તેવી BIS માન્ય ઈમરજંસી લાઈટ લગાવવી.",
  "કારખાનામા આવેલ પ્રેશર વેસલના ટેસ્ટીંગ કરાવી રીપોર્ટ રજુ કરવા.",
  "કારખાનામાં સેફ્ટી ઓડીટ કરાવીને રીપોર્ટ રજુ કરવો.",
  "ફ્લોર સ્લીપરી થઈ ગયેલ હોય ત્યાં રબ્બર મેટ લગાવી વ્યવસ્થિત કરવું.",
  "કારખાનામાં લગાવેલ ફાયર એક્સટીંગ્યુશરનું રીફીલીંગ કરાવવું.",
  "કારખાનામાં ધુમાડો શોધક (Smoke Detector) સીસ્ટમ કાર્યરત કરવી.",
  "મશીનરીના ફરતા ભાગો (Moving Parts) પર યોગ્ય ગાર્ડિંગ લગાવવું.",
  "કારખાનાનુ રીસ્ક એસેસમેંટ કરાવી રીપોર્ટ રજુ કરવો.",
  "કારખાનામા HAZOP સ્ટડી કરાવી રીપોર્ટ રજુ કરવો.",
  "કારખાનામા ફાયર લોડની ગણતરી કરી ફાયર એડેક્યુસી રીપોર્ટ રજુ કરવો.",
  "કારખાનાનો ઓન સાઈટ ઈમરજંસી પ્લાન રજુ કરવો.",
  "કારખાનામા આવેલ મશીનરીના ટેસ્ટ રીપોર્ટ કરાવી ફોર્મ નં.૯,૧૦ અને ૧૧ ,આ રજુ કરવા.",
  "કારખાનામાં કાર્યરત એર કમ્પ્રેશરનો ટેસ્ટ રીપોર્ટ કરાવી આધાર પુરાવા રજૂ કરવા.",
  "કારખાનામાં આવેલ EOT ક્રેનનો ટેસ્ટ કરાવી આધાર પુરાવા રજુ કરવા.",
  "કારખાનામા જરૂરી SCBA સેટની વ્યવસ્થા કરવી.",
  "કેમીકલ એરીયામાં કેમીકલનુ નામ નિર્દેશીત કરી યોગ્ય જગ્યાએ મુકવા."
];
const GUJ_MONTHS = ["જાન્યુઆરી","ફેબ્રુઆરી","માર્ચ","એપ્રિલ","મે","જૂન","જુલાઈ","ઓગસ્ટ","સપ્ટેમ્બર","ઓક્ટોબર","નવેમ્બર","ડિસેમ્બર"];
const FACTORY_DB = [{"name": "RACHANA FLUORO POLYMERS", "address": "PLOT NO 172,GIDC,KABILPORE,NAVSARI, Kabilpor, Navsari, Navsari, 396424", "place": "Kabilpor", "taluka": "Navsari", "licNo": "31512", "worker": "50", "hp": "100", "validYear": "2027"}, {"name": "ADITYA TIMBERS", "address": "SR NO-11/P, 10P/1, 10P/2,9, 6P/2/2, GANDEVI ROAD, DEVSAR, Devsar, Gandevi, Navsari, 396380", "place": "Devsar", "taluka": "Gandevi", "licNo": "43649", "worker": "100", "hp": "1000", "validYear": "2030"}, {"name": "RAMAN ENG. AND PLASTIC INDUSTRIES.", "address": "BLOCK/SURVEY NO.: 195/1 PAIKEE 1, VILLAGE: AMADPORE, POST: DHOLAPIPLA, Amadpor, Navsari, Navsari, 396445", "place": "Amadpor", "taluka": "Navsari", "licNo": "49685", "worker": "20", "hp": "100", "validYear": "2027"}, {"name": "PAM INDUSTRIAL PLASTICS", "address": "PLOT NO. :433 & 434,G.I.D.C. KABILPOR, Navsari, Navsari, Navsari, 396424", "place": "Navsari", "taluka": "Navsari", "licNo": "50535", "worker": "50", "hp": "250", "validYear": "2032"}, {"name": "OM POLYMERS", "address": "PLOT NO - 102/A , AT - G I D C ANTALIA , BILIMORA, Antaliya (CT), Gandevi, Navsari, 396325", "place": "Antaliya (CT)", "taluka": "Gandevi", "licNo": "53366", "worker": "20", "hp": "250", "validYear": "2027"}, {"name": "PARAS PLASTICS", "address": "BLOCK NO- 1656/P5, VANSDA ROAD, VILLAGE- ALIPORE, Alipor, Chikhli, Navsari, 396409", "place": "Alipor", "taluka": "Chikhli", "licNo": "59686", "worker": "50", "hp": "250", "validYear": "2027"}, {"name": "SHREE RAM PLASTICS", "address": "SURVEY NO 334,PLOT NO 10, BEHIND GIDC,KABILPORE, Navsari, Navsari, Navsari, 396463", "place": "Navsari", "taluka": "Navsari", "licNo": "34826", "worker": "20", "hp": "500", "validYear": "2026"}, {"name": "SHREE AMBICA STONE AND WOODEN INDUSTRIES", "address": "PLOT NO.: 401/A, G.I.D.C.: NAVSARI, Kabilpor, Navsari, Navsari, 396424", "place": "Kabilpor", "taluka": "Navsari", "licNo": "52505", "worker": "20", "hp": "100", "validYear": "2027"}, {"name": "FARM FOOD DEHYDRATES PVT LTD.", "address": "BLOCK NO.849. AT&POST.KACHHOLI NAVSARI, Kachholi, Gandevi, Navsari", "place": "Kachholi", "taluka": "Gandevi", "licNo": "9604", "worker": "20", "hp": "250", "validYear": "2020"}, {"name": "SOMNATH INFRASTRUCTURE", "address": "Shed A-1/1, GIDC Antaliya, Billimora, Tal. Gandevi Dist. Navsari, Antaliya (CT), Gandevi, Navsari, 396380", "place": "Antaliya (CT)", "taluka": "Gandevi", "licNo": "36591", "worker": "20", "hp": "50", "validYear": "2022"}, {"name": "A. H. WADIA BOAT BUILDERS", "address": "CITY SR. NO. : 239 / 3 / A, AT VAKHARIA BUNDER ROAD, Bilimora, Gandevi, Navsari, 396321", "place": "Bilimora", "taluka": "Gandevi", "licNo": "57042", "worker": "20", "hp": "50", "validYear": "2033"}, {"name": "PATSON FOODS (INDIA) PVT LTD.", "address": "VADA ROAD, N. H. NO. 8.SISODRS(GANESH), Sisodra (ganesh), Navsari, Navsari", "place": "Sisodra (ganesh)", "taluka": "Navsari", "licNo": "3321", "worker": "50", "hp": "50", "validYear": "2030"}, {"name": "MANEKPUR VIVIDH KARYAKARI KHEDUT SAHAKARI MANDALI.LTD.", "address": "AT & POST MANEKPUR,GANDEVI, Manekpor, Gandevi, Navsari", "place": "Manekpor", "taluka": "Gandevi", "licNo": "3765", "worker": "20", "hp": "50", "validYear": "2027"}, {"name": "VEDCHHA DAMBHAR SEVA SAHKARI MANDALI.LTD.", "address": "AT& POST VEDCHHA,JALALPORE., Vedchha, Jalalpore, Navsari", "place": "Vedchha", "taluka": "Jalalpore", "licNo": "3791", "worker": "20", "hp": "50", "validYear": "2027"}, {"name": "KHETI VIKAS SEVA SAHAKARI MANDALI LIMITED", "address": "GANDEVI,AMLSAD ROAD,AT & POST AJRAI, Ajrai, Gandevi, Navsari", "place": "Ajrai", "taluka": "Gandevi", "licNo": "3831", "worker": "20", "hp": "10", "validYear": "2026"}, {"name": "SHREE NAVSARI JALALPORE TALUKA BAGAYAT SAHAKARI MANDALI LTD.", "address": "NEAR MASJID, TATA SCHOOL ROAD, NAVSARI, Navsari, Navsari, Navsari", "place": "Navsari", "taluka": "Navsari", "licNo": "5321", "worker": "50", "hp": "50", "validYear": "2011"}, {"name": "VALSAD NAVSARI JILLA FAL ANE SHAKBHAJI SAHAKARI SANGH LTD.", "address": "POST BOX NO. 30, AT & PO. GANDEVI., Gandevi, Gandevi, Navsari", "place": "Gandevi", "taluka": "Gandevi", "licNo": "8887", "worker": "250", "hp": "250", "validYear": "2026"}, {"name": "KALPTARU AGRO FOOD PRODUCTS", "address": "BLOCK NO 17, Fadvel, Chikhli, Navsari, 396540", "place": "Fadvel", "taluka": "Chikhli", "licNo": "44482", "worker": "50", "hp": "250", "validYear": "2035"}, {"name": "GREEN FIBER FOODS (INDIA) PVT.LTD.", "address": "NEW SR. NO. : 1977 & 1978,OLD SR. NO. : 952,NEAR RAILWAY CROSSING, N.H.8, Degam, Chikhli, Navsari, 396530", "place": "Degam", "taluka": "Chikhli", "licNo": "51459", "worker": "20", "hp": "100", "validYear": "2032"}, {"name": "PRATIK ENGINEERING CORPORATION", "address": "SHED NO - C-1/182 , AT - G I DC ANTALIA , BILIMORA , Antaliya (CT), Gandevi, Navsari, 396325", "place": "Antaliya (CT)", "taluka": "Gandevi", "licNo": "34485", "worker": "20", "hp": "50", "validYear": "2030"}, {"name": "KOTHARI METAL WORKS PVT. LTD.", "address": "BLOCK/SR. NO.:169 PAIKY, PLOT NO.-11, Sisodra (ganesh), Navsari, Navsari, 396463", "place": "Sisodra (ganesh)", "taluka": "Navsari", "licNo": "45321", "worker": "20", "hp": "100", "validYear": "2028"}, {"name": "SHREE LAXMI NARAYAN DIE CASTING INDUSTRIES", "address": "PLOT NO - 172 / 1 , AT - G I D C ANTALIA , BILIMORA, Antaliya (CT), Gandevi, Navsari, 39635", "place": "Antaliya (CT)", "taluka": "Gandevi", "licNo": "47975", "worker": "20", "hp": "500", "validYear": "2026"}, {"name": "BHARAT METAL WORKS", "address": "PLOT NO - 80 , AT - G I D C ANTALIA , BILIMORA, Antaliya (CT), Gandevi, Navsari, 396325", "place": "Antaliya (CT)", "taluka": "Gandevi", "licNo": "50236", "worker": "20", "hp": "10", "validYear": "2027"}, {"name": "SHARDA INDUSTRIES", "address": "PLOT NO 444, GIDC ESTATE,POST KABILPORE,NAVSARI, Navsari, Navsari, Navsari", "place": "Navsari", "taluka": "Navsari", "licNo": "34835", "worker": "20", "hp": "50", "validYear": "2031"}, {"name": "M/S ROSHAN ENGINEERING (UNIT I)", "address": "PLOT NO :18/R, GIDC : BILIMORA ANTALIA,TA - GANDEVI, DIST - NAVSARI, Bilimora, Gandevi, Navsari, 396325", "place": "Bilimora", "taluka": "Gandevi", "licNo": "35812", "worker": "100", "hp": "100", "validYear": "2028"}, {"name": "PATCO BRASS PRODUCTS", "address": "SHED NO - C1/1 , OPP. BANK OF BARODA , A - G I D C ANTALIA , BILIMORA, Antaliya (CT), Gandevi, Navsari, 396325", "place": "Antaliya (CT)", "taluka": "Gandevi", "licNo": "47974", "worker": "20", "hp": "50", "validYear": "2026"}, {"name": "SURYA EXIM LIMITED.", "address": "BLOCK NO. 172 - A, VILLAGE- AARAK, TALUKA- JALALPORE, DIST- NAVSARI., Arak, Jalalpore, Navsari, 395007", "place": "Arak", "taluka": "Jalalpore", "licNo": "34354", "worker": "50", "hp": "100", "validYear": "2021"}, {"name": "AATMIYA FOODS", "address": "GROUND FLOOR, PART - A, MAIN BUILDING, OLD REVENUE BLOCK NO. 116 & 117, NEW REVENUE BLOCK NO. 136 & 137, Kanbad, Navsari, Navsari, 396433", "place": "Kanbad", "taluka": "Navsari", "licNo": "52277", "worker": "100", "hp": "50", "validYear": "2028"}, {"name": "SURBHI WAFERS PVT. LTD.", "address": "C-28, UDYOGNAGAR, VIJALPUR, NAVSARI, Vejalpor, Navsari, Navsari", "place": "Vejalpor", "taluka": "Navsari", "licNo": "1435", "worker": "20", "hp": "50", "validYear": "2026"}, {"name": "PARSHWA FOODS (INDIA) PVT. LTD.", "address": "NR. MALLIKARJUN MAHADEV TEMPLE, N.H.NO. 8, MAJIGAM., Majigam, Chikhli, Navsari", "place": "Majigam", "taluka": "Chikhli", "licNo": "8933", "worker": "20", "hp": "100", "validYear": "2025"}, {"name": "MAFATLAL  INDUSTRIES  LTD (DENIM UNIT)", "address": "VEJALPAR ROAD,NAVSARI., Navsari, Navsari, Navsari", "place": "Navsari", "taluka": "Navsari", "licNo": "3145", "worker": "20", "hp": "2000", "validYear": "2021"}, {"name": "PRESSPIN PRODUCTS .", "address": "C/39 UDYOGNAGAR NAVSARI., Navsari, Navsari, Navsari", "place": "Navsari", "taluka": "Navsari", "licNo": "3192", "worker": "20", "hp": "50", "validYear": "2022"}, {"name": "NARMADA ENGINEERING", "address": "L-179-2,G.I.D.C,ANTALIA,BILIMORA, Gidc antlia, Gandevi, Navsari", "place": "Gidc antlia", "taluka": "Gandevi", "licNo": "3766", "worker": "20", "hp": "50", "validYear": "2030"}, {"name": "ENPEE INDUSTRIES", "address": "PLOT NO.30/R,G.I.D.C,ANTALIA,BILIMORA., Gidc antlia, Gandevi, Navsari", "place": "Gidc antlia", "taluka": "Gandevi", "licNo": "3883", "worker": "20", "hp": "250", "validYear": "2012"}, {"name": "SHASHWAT ENTERPRISE", "address": "PLOT NO - 8 , SR. NO - 334 , AT - SISODRA ( GANESH ) NAVSARI, Sisodra (ganesh), Navsari, Navsari, 396424", "place": "Sisodra (ganesh)", "taluka": "Navsari", "licNo": "49882", "worker": "20", "hp": "250", "validYear": "2024"}, {"name": "DHANHAR MASALA BHANDAR PVT. LTD.", "address": "SURVEY / BLOCK NO: 23, R. SURVEY NO: 23/1, 23/2, 23/3, 23/4, 23/5 & 23/6, KALODI - NAVSARI ROAD, Manekpor, Jalalpore, Navsari, 396445", "place": "Manekpor", "taluka": "Jalalpore", "licNo": "51660", "worker": "20", "hp": "500", "validYear": "2027"}, {"name": "MCON RASAYAN PVT. LTD.", "address": "SR. NO - 1656-B/P1, CHIKHLI - VANSDAS ROAD, BESIDE ANKIT PETROL PUMP, AT - VILLAGE ALIPOR , Alipor, Chikhli, Navsari, 396521", "place": "Alipor", "taluka": "Chikhli", "licNo": "48285", "worker": "20", "hp": "100", "validYear": "2026"}, {"name": "SAI KRUPA ENTERPRISE", "address": "PLOT NO 113/5, G.I.D.C.,KABILPORE,NAVSARI, NAVSARI, Navsari, Navsari, Navsari, 396424", "place": "Navsari", "taluka": "Navsari", "licNo": "34355", "worker": "20", "hp": "50", "validYear": "2022"}, {"name": "SHREE JALARAM ANODIZER", "address": "PLOT NO - 126 , 127 & 128 , AT - G I D C KABILPOR , NAVSARI , TAL & DIST - NAVSARI . PIN - 396424, Navsari, Navsari, Navsari, 396424", "place": "Navsari", "taluka": "Navsari", "licNo": "34488", "worker": "20", "hp": "100", "validYear": "2020"}, {"name": "BHAGYASHREE ENTERPRISES", "address": "Plot no. 116, G I D C Antalia, Billimora. Tal : Gandevi Dist. Navsari, Antaliya (CT), Gandevi, Navsari, 396325", "place": "Antaliya (CT)", "taluka": "Gandevi", "licNo": "52502", "worker": "20", "hp": "100", "validYear": "2025"}, {"name": "KAIRA MACHINE TOOLS PVT. LTD.", "address": "SHED NO : A1 / 207 , AT : G I D C KABILPOR , NAVSARI, Kabilpor, Navsari, Navsari, 396445", "place": "Kabilpor", "taluka": "Navsari", "licNo": "58505", "worker": "20", "hp": "100", "validYear": "2026"}, {"name": "A J ENGINEERING", "address": "46/A,2-3,GIDC KABILPORE, NAVSARI, Navsari, Navsari, Navsari, 396424", "place": "Navsari", "taluka": "Navsari", "licNo": "49917", "worker": "20", "hp": "250", "validYear": "2026"}, {"name": "NUTRITIUS", "address": "PLOT NO 1 ,NEAR NEW GIDC,TEBA INDUSTRIAL ESTATE, VILLAGE NASILPORE, Nasilpor, Navsari, Navsari, 396424", "place": "Nasilpor", "taluka": "Navsari", "licNo": "34366", "worker": "50", "hp": "50", "validYear": "2025"}, {"name": "S.P. FARM.", "address": "BLOCK 1354, KHAREL - DHARAMPUR ROAD, VILLAGE: SADADVEL. TAL. CHIKHLI. DIST. NAVSARI, Sadadvel, Chikhli, Navsari, 396560", "place": "Sadadvel", "taluka": "Chikhli", "licNo": "47145", "worker": "50", "hp": "100", "validYear": "2027"}, {"name": "RAJMOTI FARM", "address": "B/ SR. NO - 420 ,NEAR EURO FOOD PARK, UTHWAD PATIYA , N. H. NO - 48 , AT & POST - VILLAGE ALIPOR, Alipor, Chikhli, Navsari, 396521", "place": "Alipor", "taluka": "Chikhli", "licNo": "50538", "worker": "50", "hp": "100", "validYear": "2026"}, {"name": "FARHIN  GUR FARM", "address": "BLOCK NO.-1331, VIL-SADADVEL, Sadadvel, Chikhli, Navsari", "place": "Sadadvel", "taluka": "Chikhli", "licNo": "13021", "worker": "50", "hp": "10", "validYear": "2027"}, {"name": "PATEL FARM MANEKPORE.", "address": "VANSDA ROAD, TA.CHIKHALI DIST.NAVSARI, Chikhli, Chikhli, Navsari", "place": "Chikhli", "taluka": "Chikhli", "licNo": "13856", "worker": "20", "hp": "50", "validYear": "2012"}, {"name": "PATEL FARM MANEKPORE..", "address": "BLOCK NO.194/P, VIL-MANEKPOR., Manekpor, Chikhli, Navsari", "place": "Manekpor", "taluka": "Chikhli", "licNo": "14002", "worker": "20", "hp": "50", "validYear": "2026"}, {"name": "NATRAJ KHANDSARI INDUSTRIES", "address": "ADHARPIR,VANSDA ROAD,CHIKHLI., Alipor, Chikhli, Navsari", "place": "Alipor", "taluka": "Chikhli", "licNo": "4650", "worker": "250", "hp": "250", "validYear": "2019"}, {"name": "SHIVANI INDUSTRIES.", "address": "BLOCK NO. 1746 / P6, CHIKHLI - VANSDA ROAD, VILLAGE- ALIPORE., Alipor, Chikhli, Navsari", "place": "Alipor", "taluka": "Chikhli", "licNo": "9603", "worker": "20", "hp": "50", "validYear": "2015"}, {"name": "AVINASH ENTERPRISE", "address": "AT. & PO. Bamanvel, Vansda Road, Bamanvel, Chikhli, Navsari", "place": "Bamanvel", "taluka": "Chikhli", "licNo": "22470", "worker": "20", "hp": "50", "validYear": "2019"}, {"name": "KALPATARU INDUSTRIES", "address": "PLOT NO - 42/4 , AT - G I D C ANTALIA , BILIMORA, Antaliya (CT), Gandevi, Navsari, 396325", "place": "Antaliya (CT)", "taluka": "Gandevi", "licNo": "52726", "worker": "20", "hp": "50", "validYear": "2027"}, {"name": "GOODLUCK GARMENTS PVT. LTD", "address": "C/27,UDYOG NAGAR,P.O.NAVSARI, Navsari, Navsari, Navsari", "place": "Navsari", "taluka": "Navsari", "licNo": "3445", "worker": "100", "hp": "50", "validYear": "2019"}, {"name": "TROPICAL CLOTHING CO.PVT.LTD", "address": "PLOT NO.148,C1/B/516,C1/B8/138,G.I.D.C,ANTALIA, Gidc antlia, Gandevi, Navsari", "place": "Gidc antlia", "taluka": "Gandevi", "licNo": "3490", "worker": "500", "hp": "500", "validYear": "2021"}, {"name": "CEBON APPAREL PVT.LTD.", "address": "PLOT NO.C-4,C-5,C-18,C-19 & C-21, AT.- UDYOG NAGAR, Navsari, Navsari, Navsari", "place": "Navsari", "taluka": "Navsari", "licNo": "3895", "worker": "250", "hp": "250", "validYear": "2026"}, {"name": "OM SAI GARMENTS", "address": "B/SR. NO - 1180 , 1805 , 1806 & 1807 , STHAPATYA COMERCIAL CO. OP. HOUSING SOCIETY LTD. , CHIKHLI - BILIMORA ROAD , AT - VILLAGE NANDARKHA, Nandarkha, Gandevi, Navsari, 396325", "place": "Nandarkha", "taluka": "Gandevi", "licNo": "39509", "worker": "250", "hp": "100", "validYear": "2025"}, {"name": "ECOSSENTIAL CLOTHING PVT. LTD.", "address": "( 2ND, 3RD & TERRACE FLOOR ) SR. NO - 541 , OM SHOPERSTOP - B, CHAR RASTA , VANSDA ROAD , AT - VILLAGE HANUMANBARI - VANSDA, Hanumanbari, Vansada, Navsari, 396580", "place": "Hanumanbari", "taluka": "Vansada", "licNo": "43369", "worker": "500", "hp": "250", "validYear": "2027"}, {"name": "GINZA INDUSTRIES LIMITED", "address": "Shop No. 116 - 123, Keshav Complex, Nandarkha, Nandarkha, Gandevi, Navsari, 396325", "place": "Nandarkha", "taluka": "Gandevi", "licNo": "51857", "worker": "250", "hp": "50", "validYear": "2030"}, {"name": "TROPICAL CLOTHING COMPANY PRIVATE LIMITED", "address": "SHED NO- C1B/4,5,6,7 & 8, GIDC ANTALIA, BILIMORA, Antaliya (CT), Gandevi, Navsari, 396325", "place": "Antaliya (CT)", "taluka": "Gandevi", "licNo": "54028", "worker": "250", "hp": "250", "validYear": "2027"}, {"name": "SHRIJAY POLY COT PVT. LTD.", "address": "OLD BLOCK NO. : 452, 453, 454, 455, NEW BLOCK NO. : 507, 508, 509, 510, VILLAGE : SISODARA (ARKA), Sisodra [Arak], Jalalpore, Navsari, 396475", "place": "Sisodra [Arak]", "taluka": "Jalalpore", "licNo": "59603", "worker": "500", "hp": "1000", "validYear": "2029"}, {"name": "JM KNITWEAR PVT. LTD.", "address": "Sr.No.268/3/1, Ghelkhdi Road, Nr. Puneshwer complex, Vejalpor, Navsari, Navsari", "place": "Vejalpor", "taluka": "Navsari", "licNo": "22749", "worker": "100", "hp": "250", "validYear": "2028"}, {"name": "SHREE KASHI ENTERPRISES", "address": "C/1, UDAYOG NAGAR, Navsari, Navsari, Navsari", "place": "Navsari", "taluka": "Navsari", "licNo": "30806", "worker": "50", "hp": "50", "validYear": "2024"}, {"name": "RAMESHWAR POLYMER", "address": "PLOT NO 24/A, G. I. D. C. ANTALYA, BILIMORA., Bilimora, Gandevi, Navsari", "place": "Bilimora", "taluka": "Gandevi", "licNo": "31102", "worker": "20", "hp": "100", "validYear": "2026"}, {"name": "CEBON APPAREL PVT. LTD.", "address": "SHED NO.C1B/4,5,6,7 & 8, G.I.D.C., ANTALIA, BILIMORA, TA-GANDEVI, DIST-NAVSARI, Gandevi, Gandevi, Navsari, 400011", "place": "Gandevi", "taluka": "Gandevi", "licNo": "33011", "worker": "250", "hp": "250", "validYear": "2023"}, {"name": "LAXEE FABRICS PVT. LTD.", "address": "PLOT NO.: C-6/A, UDHYOG NAGAR SAHAKARI SANGH, Vejalpor, Navsari, Navsari, 396445", "place": "Vejalpor", "taluka": "Navsari", "licNo": "34490", "worker": "50", "hp": "10", "validYear": "2022"}, {"name": "SHREE MARUTI GARMENTS", "address": "PLOT NO.D-25 UDYOG NAGAR, VIJALPORE, NAVSARI., Vijalpor, Jalalpore, Navsari, 396445", "place": "Vijalpor", "taluka": "Jalalpore", "licNo": "47475", "worker": "20", "hp": "50", "validYear": "2029"}, {"name": "APTECH GARMENTS", "address": "SURVEY NO-14 & 15, SHOP NO- 1 TO 6 & 15 TO 21, FIRST FLOOR, ATMIYA COMPLEX, OPP, MAMLATDAR OFFICE, RAHEJ, Rahej, Gandevi, Navsari, 396360", "place": "Rahej", "taluka": "Gandevi", "licNo": "50488", "worker": "50", "hp": "50", "validYear": "2027"}, {"name": "PROMISE GARMENTS", "address": "PLOT NO. : D/27, WORD NO. : 8,H. NO. : 5695, 5696 & 5697, AT UDYOGNAGAR, Vejalpor, Navsari, Navsari, 396445", "place": "Vejalpor", "taluka": "Navsari", "licNo": "53472", "worker": "50", "hp": "100", "validYear": "2028"}, {"name": "HEPA LIFESTYLE", "address": "CITY SR. NO. 1757,PAIKI RCC TWO FLOOR BUILDING, NR.JALARAM MANDIR, KHABHLA ZAPA, VASDA, DT-NAVSARI, Vansada, Vansada, Navsari, 396580", "place": "Vansada", "taluka": "Vansada", "licNo": "53497", "worker": "50", "hp": "50", "validYear": "2028"}, {"name": "SHREE RADHE ENTERPRISE", "address": "PLOT NO. : C/3, AT UDYOGNAGAR, VIJALPORE, Vijalpor, Jalalpore, Navsari, 396421", "place": "Vijalpor", "taluka": "Jalalpore", "licNo": "53947", "worker": "50", "hp": "100", "validYear": "2028"}, {"name": "SELVOK PHARMACEUTICAL CO.", "address": "147,GIDC, ANTALIA.VIA .BILLIMORA., Gidc antlia, Gandevi, Navsari", "place": "Gidc antlia", "taluka": "Gandevi", "licNo": "3338", "worker": "50", "hp": "250", "validYear": "2026"}, {"name": "YASH LABORATORIES", "address": "VANSDA ROAD,216/6,KHUNDH,CHIKHLI, Khundh, Chikhli, Navsari", "place": "Khundh", "taluka": "Chikhli", "licNo": "3888", "worker": "100", "hp": "500", "validYear": "2030"}, {"name": "B-TEX OINTMENT MFG.CO.", "address": "C/17,UDYOG NAGAR,NAVSARI., Navsari, Navsari, Navsari", "place": "Navsari", "taluka": "Navsari", "licNo": "4264", "worker": "50", "hp": "100", "validYear": "2030"}, {"name": "GUFIC BIOSCIENCES LIMITED.", "address": "N. H. 8,NEAR GRID AT.&POST.KABILPORE., Navsari, Navsari, Navsari", "place": "Navsari", "taluka": "Navsari", "licNo": "4546", "worker": "1000", "hp": "2000", "validYear": "2030"}, {"name": "GUFIC BIOSCIENCES LIMITED, UNIT -2", "address": "SURVEY NO 171 , NH 48, NEAR GRID, KABILPORE, NAVSARI 396 424, Kabilpor, Navsari, Navsari", "place": "Kabilpor", "taluka": "Navsari", "licNo": "21696", "worker": "500", "hp": "2000", "validYear": "2026"}, {"name": "ALUFLY INDUSTRIES LLP.", "address": "CITY SR. NO. : NA84, AT, Tarsadi, Navsari, Navsari, 396418", "place": "Tarsadi", "taluka": "Navsari", "licNo": "59111", "worker": "50", "hp": "1000", "validYear": "2029"}, {"name": "SONA EXTRUSION PVT.LTD.", "address": "PLOT NO.471,NEW G.I.D.C,KABILPORE,NAVSARI, Kabilpor, Navsari, Navsari", "place": "Kabilpor", "taluka": "Navsari", "licNo": "5242", "worker": "250", "hp": "1000", "validYear": "2027"}, {"name": "G. K. INDUSTRIES.", "address": "SHED NO./ PLOT NO.: 2R/B, G.I.D.C. ANTALIA., Gidc antlia, Gandevi, Navsari", "place": "Gidc antlia", "taluka": "Gandevi", "licNo": "7015", "worker": "50", "hp": "250", "validYear": "2028"}, {"name": "KHODIYAR INDUSTRIES", "address": "SHED NO - C12-B / 10 , AT - G I D C KABILPOR , NAVSARI, Navsari, Navsari, Navsari, 396424", "place": "Navsari", "taluka": "Navsari", "licNo": "46759", "worker": "20", "hp": "250", "validYear": "2028"}, {"name": "U.N.SONS COMPANY", "address": "1660,SAT PIPLA BUS STATION, NR.AALIPORE VANSADA ROAD, CHIKHLI, Chikhli, Chikhli, Navsari", "place": "Chikhli", "taluka": "Chikhli", "licNo": "13283", "worker": "100", "hp": "100", "validYear": "2026"}, {"name": "SPAN HEAT TRANSFER EQUIPMENTS MFRS PVT LTD", "address": "413,G.I.D.C PHASE-II,KABILPORE,OFF,BARDOLI ROAD, Kabilpor, Navsari, Navsari", "place": "Kabilpor", "taluka": "Navsari", "licNo": "3438", "worker": "50", "hp": "250", "validYear": "2026"}, {"name": "ROLASTAR PVT.LTD.", "address": "Plot No.6 & 7, G.I.D.C. Antalia, Bilimora., Gidc antlia, Gandevi, Navsari", "place": "Gidc antlia", "taluka": "Gandevi", "licNo": "18477", "worker": "50", "hp": "100", "validYear": "2017"}, {"name": "HLE GLASCOAT LIMITED. (UNIT-3)", "address": "Plot No.A-3, Block No.140/A, Maroli udyognagar, Vill-Nadod, Nandod, Jalalpore, Navsari", "place": "Nandod", "taluka": "Jalalpore", "licNo": "20713", "worker": "50", "hp": "100", "validYear": "2030"}, {"name": "NAHAR PHARMACEUTICALS", "address": "MAROLI VILLGE ROAD,AT.POST.MAROLI, Maroli, Jalalpore, Navsari", "place": "Maroli", "taluka": "Jalalpore", "licNo": "3517", "worker": "20", "hp": "100", "validYear": "2031"}, {"name": "TREFFER PHARMACEUTICALS", "address": "PLOT NO. C/23,AT UDYOGNAGAR,NAVSARI, Navsari, Navsari, Navsari", "place": "Navsari", "taluka": "Navsari", "licNo": "3564", "worker": "50", "hp": "250", "validYear": "2030"}, {"name": "DHANVANTARY HEALTH CARE", "address": "410/2,G.I.D.C. KABILPORE., Kabilpor, Navsari, Navsari", "place": "Kabilpor", "taluka": "Navsari", "licNo": "3617", "worker": "20", "hp": "100", "validYear": "2031"}, {"name": "NAHAR AYURVEDIC PHARMACY", "address": "MAROLI BAZAR,JALALPORE., Maroli, Jalalpore, Navsari", "place": "Maroli", "taluka": "Jalalpore", "licNo": "3848", "worker": "20", "hp": "50", "validYear": "2026"}, {"name": "VECTOR BIOTEK PVT.LTD.", "address": "425, New G.I.D.C. Kabilpore, Kabilpor, Navsari, Navsari", "place": "Kabilpor", "taluka": "Navsari", "licNo": "17710", "worker": "250", "hp": "250", "validYear": "2032"}, {"name": "S.B.BIOTECH HERBALS PVT.LTD.", "address": "Plot No.439, g.i.d.c. Kabilpore, Kabilpor, Navsari, Navsari", "place": "Kabilpor", "taluka": "Navsari", "licNo": "18474", "worker": "20", "hp": "50", "validYear": "2030"}, {"name": "NEZAL HERBOCARE PVT. LTD", "address": "PLOT NO.C1/21, G.I.D.C., KABILPORE, Kabilpor, Navsari, Navsari", "place": "Kabilpor", "taluka": "Navsari", "licNo": "31709", "worker": "50", "hp": "50", "validYear": "2022"}, {"name": "ASIAN DRUGS AND PHARMA", "address": "PLOT NO - 50 / 3 , AT - G. I. D. C. KABILPOR, Navsari, Navsari, Navsari, 396424", "place": "Navsari", "taluka": "Navsari", "licNo": "47977", "worker": "20", "hp": "50", "validYear": "2026"}, {"name": "S.B. BIOTECH HERBALS PVT. LTD.", "address": "PLOT NO. :16,G.I.D.C. KABILPORE, NAVSARI, Kabilpor, Navsari, Navsari, 396424", "place": "Kabilpor", "taluka": "Navsari", "licNo": "51184", "worker": "20", "hp": "100", "validYear": "2027"}, {"name": "AMBROSIA LAB", "address": "SR. NO.: 122/C/3, AT BARDOLI ROAD, Sisodra (ganesh), Navsari, Navsari, 396424", "place": "Sisodra (ganesh)", "taluka": "Navsari", "licNo": "52628", "worker": "20", "hp": "50", "validYear": "2027"}, {"name": "PROPYLON PRODUCTS", "address": "BLOCK NO. 338/B, B/H. PLOT NO. 419, G.I.D.C. KABILPORE, GANESH SISODRA, Navsari, Navsari, Navsari", "place": "Navsari", "taluka": "Navsari", "licNo": "21413", "worker": "250", "hp": "1000", "validYear": "2029"}, {"name": "Athrees Electronics Pvt. Ltd.", "address": "First Floor, Block No.: 619, 628, 631, 633, 643, 651, 669, 672, 679, 682, 690, Plot No.: 44, Rajhans Zesto Phase-4, Vill.: Kalakachha, Kalakachha, Jalalpore, Navsari, 394615", "place": "Kalakachha", "taluka": "Jalalpore", "licNo": "59488", "worker": "50", "hp": "1000", "validYear": "2030"}, {"name": "M/s. Bionova Solutions Pvt. Ltd.", "address": "Plot No.: 6 & 7, GIDC Estate, Antalia, Bilimora-396325, Tal. Gandevi, Bilimora, Gandevi, Navsari, 396325", "place": "Bilimora", "taluka": "Gandevi", "licNo": "47719", "worker": "100", "hp": "1000", "validYear": "2027"}, {"name": "K-ELECTRONICS LLP", "address": "PLOT NO. 240, PHASE - III, G.I.D.C. ANTALIA, NEXT TO STICH MARK. BILIMORA. GUJARAT, Gidc antlia, Gandevi, Navsari", "place": "Gidc antlia", "taluka": "Gandevi", "licNo": "2075", "worker": "20", "hp": "50", "validYear": "2029"}, {"name": "KINJAL ELECTRICAL ENG.WORKS", "address": "PLOT NO.37,G.I.D.C,KABILPORE,NAVSARI, Kabilpor, Navsari, Navsari", "place": "Kabilpor", "taluka": "Navsari", "licNo": "3591", "worker": "20", "hp": "50", "validYear": "2009"}, {"name": "SHEETAL ELECTRICALS", "address": "RAJA ROAD, MAROLI, Maroli, Jalalpore, Navsari", "place": "Maroli", "taluka": "Jalalpore", "licNo": "3790", "worker": "20", "hp": "50", "validYear": "2029"}, {"name": "NHB BALL & ROLLER LTD. (UNIT-2)", "address": "SR NO- 113/1, 113/2, 130/1 & 130/2, ANDHKESHWAR ROAD, AMALSAD, Amalsad, Gandevi, Navsari", "place": "Amalsad", "taluka": "Gandevi", "licNo": "3152", "worker": "500", "hp": "5000", "validYear": "2028"}, {"name": "NHB  BALL & ROLLER LTD", "address": "PLOT NO.68 TO 74 & 22/R TO 28/R, AT-GIDC, ANTALIA, BILIMORA, Gidc antlia, Gandevi, Navsari", "place": "Gidc antlia", "taluka": "Gandevi", "licNo": "3431", "worker": "250", "hp": "2000", "validYear": "2028"}, {"name": "NAVDEEP SPG. & BLANKET MFG. INDUSTRIES", "address": "205-206-207.  OLD G.I.D.C. KABILPOR NAVSARI, Kabilpor, Navsari, Navsari", "place": "Kabilpor", "taluka": "Navsari", "licNo": "1085", "worker": "50", "hp": "250", "validYear": "2008"}, {"name": "NAVDEEP SPG.& BLANKET MFG.INDUSTRIES", "address": "205,206,207,OLD,G.I.D.C,KABILPORE, Kabilpor, Navsari, Navsari", "place": "Kabilpor", "taluka": "Navsari", "licNo": "3519", "worker": "50", "hp": "250", "validYear": "2009"}, {"name": "N. L. G. BRICKS", "address": "SR. NO - 31 , BLOCK NO - 69 , GANDEVI - NAVSARI ROAD , AT & POST - SALEJ, TAL. - GANDEVI. DIST - NAVSARI. PIN - 396350, Salej, Gandevi, Navsari, 396350", "place": "Salej", "taluka": "Gandevi", "licNo": "30338", "worker": "20", "hp": "10", "validYear": "2026"}, {"name": "TRIPLE NINE BRICKS FACTORY", "address": "SR. NO - 228-B / P2 , RUSTAM WADI , BEHIND MITHALA NAGRI, AT & POST - NAVSARI, Navsari, Navsari, Navsari, 396445", "place": "Navsari", "taluka": "Navsari", "licNo": "49450", "worker": "50", "hp": "100", "validYear": "2028"}, {"name": "A K B BRICKS", "address": "BLOCK/SURVEY NO.: 318, AT. VILLAGE: ASANA, Asana, Jalalpore, Navsari, 396415", "place": "Asana", "taluka": "Jalalpore", "licNo": "57539", "worker": "50", "hp": "10", "validYear": "2028"}, {"name": "PARTH BRICKS FACTORY", "address": "BLOCK NO.228/B,AT RUSTAMWADI,VILL:VIRAVAL., Navsari, Navsari, Navsari", "place": "Navsari", "taluka": "Navsari", "licNo": "5375", "worker": "50", "hp": "10", "validYear": "2015"}, {"name": "TRIPLE NINE BRICKS FACTORY.", "address": "RUSTAMWADI VIRAVAL, Viraval, Navsari, Navsari", "place": "Viraval", "taluka": "Navsari", "licNo": "6393", "worker": "250", "hp": "10", "validYear": "2020"}, {"name": "SHREE NARAYAN BRICKS FACTORY", "address": "RAICHAND ROAD, NAVSARI, Navsari, Navsari, Navsari", "place": "Navsari", "taluka": "Navsari", "licNo": "6413", "worker": "25", "hp": "10", "validYear": "2013"}, {"name": "H.M.BRICKS", "address": "BLOCK NO. 52-49, VILLAGE RANODRA., Ranodra, Jalalpore, Navsari", "place": "Ranodra", "taluka": "Jalalpore", "licNo": "7501", "worker": "50", "hp": "0", "validYear": "2014"}, {"name": "JALARAM BRICKS.", "address": "BLOCK NO 179,CHIKHALI-VASADA ROAD VILLAGE:KHUNDH.CHIKHALI., Khundh, Chikhli, Navsari", "place": "Khundh", "taluka": "Chikhli", "licNo": "7535", "worker": "50", "hp": "10", "validYear": "2027"}, {"name": "MAA KRUPA BRICKS", "address": "NEAR MANISH PACKAGING, OPP. NADOD PATIA, AT & PO. NADOD., Nandod, Jalalpore, Navsari", "place": "Nandod", "taluka": "Jalalpore", "licNo": "9158", "worker": "50", "hp": "10", "validYear": "2026"}, {"name": "S.R.P. BRICKS", "address": "SURVEY NO. 100/1 & 100/2, B/H. MAHAVIR SOCIRTY, ZAVERI SADAK, VILLAGE : CHOVISI., Chovisi, Navsari, Navsari", "place": "Chovisi", "taluka": "Navsari", "licNo": "9606", "worker": "50", "hp": "10", "validYear": "2020"}, {"name": "ABI-1 BRICKS", "address": "BLOCK NO.-207,VILLAGE:ASNA, Asana, Jalalpore, Navsari", "place": "Asana", "taluka": "Jalalpore", "licNo": "10871", "worker": "20", "hp": "10", "validYear": "2027"}, {"name": "DNB BRICKS", "address": "BLOCK NO.-121,VILLAGE:CHOKHD, Chokhad, Jalalpore, Navsari", "place": "Chokhad", "taluka": "Jalalpore", "licNo": "10873", "worker": "20", "hp": "10", "validYear": "2024"}, {"name": "TAPI BRICKS", "address": "BLOCK NO.-302 VILLAGE:ASNA, Asana, Jalalpore, Navsari", "place": "Asana", "taluka": "Jalalpore", "licNo": "10884", "worker": "20", "hp": "10", "validYear": "2024"}, {"name": "ABI BRICKS", "address": "BLOCK NO.-185,VILLAGE:ASNA, Asana, Jalalpore, Navsari", "place": "Asana", "taluka": "Jalalpore", "licNo": "10885", "worker": "20", "hp": "10", "validYear": "2027"}, {"name": "ASB BRICKS", "address": "BLOCK NO.-84,VILLAGE:CHOKHAD, Chokhad, Jalalpore, Navsari", "place": "Chokhad", "taluka": "Jalalpore", "licNo": "10886", "worker": "20", "hp": "10", "validYear": "2027"}, {"name": "TAPI   BRICKS", "address": "BLOCK NO.-117,VILLAGE:CHOKHAD, Chokhad, Jalalpore, Navsari", "place": "Chokhad", "taluka": "Jalalpore", "licNo": "10888", "worker": "20", "hp": "10", "validYear": "2018"}, {"name": "A.A.B. BRICKS", "address": "S.NO.326,VILLAGE-AASNA, JALALPORE, Asana, Jalalpore, Navsari", "place": "Asana", "taluka": "Jalalpore", "licNo": "13162", "worker": "20", "hp": "10", "validYear": "2023"}, {"name": "PRITI BRICKS", "address": "SR.NO. 138/P-1, PO.KABILPORE, VILLAGE-DHANAGIRI, Dharagiri, Navsari, Navsari", "place": "Dharagiri", "taluka": "Navsari", "licNo": "13262", "worker": "20", "hp": "10", "validYear": "2023"}, {"name": "THAKORBHAI KALIDAS PRAJAPATI.", "address": "SR.NO.62 PAIKEE 1, GANDEVI-BILIMORA ROAD, VILLEGE-VALOTI, TA.GANDEVI, Valoti, Gandevi, Navsari", "place": "Valoti", "taluka": "Gandevi", "licNo": "13648", "worker": "20", "hp": "50", "validYear": "2016"}, {"name": "M/S. OM BRICKS", "address": "NEAR SARA RLY. BRIDGE, AT.TORANGAM, TA.GANDEVI, DIST.NAVSARI., Torangam, Gandevi, Navsari", "place": "Torangam", "taluka": "Gandevi", "licNo": "13857", "worker": "20", "hp": "50", "validYear": "2013"}, {"name": "SAI BRICKS", "address": "BLOCK NO.589, NEAR SARA RLY BRIDGE, AT.TORANGAM, TA.GANDEVI DIST.NAVSARI, Torangam, Gandevi, Navsari", "place": "Torangam", "taluka": "Gandevi", "licNo": "13858", "worker": "20", "hp": "50", "validYear": "2013"}, {"name": "C.V.B BRICKS.", "address": "SR.NO.132 TO 136+138, AMALSAD ROAD, TA.GANDEVI, DIST-NAVSARI., Gandevi, Gandevi, Navsari", "place": "Gandevi", "taluka": "Gandevi", "licNo": "13956", "worker": "50", "hp": "10", "validYear": "2016"}, {"name": "OM BRICKS..", "address": "BLOCK NO 589, NEAR SARA RAILWAY BRIDGE, AT-TORANGAM, Torangam, Gandevi, Navsari", "place": "Torangam", "taluka": "Gandevi", "licNo": "14006", "worker": "20", "hp": "50", "validYear": "2026"}, {"name": "SAI BRICKS..", "address": "BLOCK NO. 589, NEAR SARA RLY BRIDGE, TORANGAM, Torangam, Gandevi, Navsari", "place": "Torangam", "taluka": "Gandevi", "licNo": "14008", "worker": "20", "hp": "50", "validYear": "2029"}, {"name": "C.V.BRICKS..", "address": "SR NO. 132 TO 136+138, AMALSAD ROAD, BILIMORA, Bilimora, Gandevi, Navsari", "place": "Bilimora", "taluka": "Gandevi", "licNo": "14010", "worker": "50", "hp": "10", "validYear": "2023"}, {"name": "MISHA BRICKS CO.", "address": "Block No.1411, Kharel Road, Near Deep Frozen, Gandeva, Gandevi, Navsari", "place": "Gandeva", "taluka": "Gandevi", "licNo": "19496", "worker": "20", "hp": "10", "validYear": "2018"}, {"name": "HARI OM BRICKS", "address": "At & Po. Thala, N.H.No.8, Pati Minor, Thala, Chikhli, Navsari", "place": "Thala", "taluka": "Chikhli", "licNo": "19564", "worker": "100", "hp": "10", "validYear": "2021"}, {"name": "CHiRAG BRiCKS.CO", "address": "SR.NO.1411/P,KHAREL ROAD,OPP.DEEP FROZEN.VILLAGE- GANDEVA.TA - GANDEVI,DIST - NAVSARI, Gandeva, Gandevi, Navsari, 396430", "place": "Gandeva", "taluka": "Gandevi", "licNo": "39964", "worker": "20", "hp": "10", "validYear": "2031"}, {"name": "MAGICRETE BUILDING SOLUTIONS PVT. LTD.", "address": "BLOCK NO.188/B,190, POST. ARAK., Arak, Jalalpore, Navsari", "place": "Arak", "taluka": "Jalalpore", "licNo": "7020", "worker": "50", "hp": "500", "validYear": "2026"}, {"name": "VALSAD DIST-CO.OP.MILK PRODUCERS UNION LIMITED", "address": "Block No.1869, Vill- Khergam, At. Khergam, Khergam, Chikhli, Navsari", "place": "Khergam", "taluka": "Chikhli", "licNo": "31064", "worker": "250", "hp": "2000", "validYear": "2026"}, {"name": "UMIYA MOSAIC TILES", "address": "PLOT NO.307,G.I.D.C,KABILPORE,NAVSARI, Kabilpor, Navsari, Navsari", "place": "Kabilpor", "taluka": "Navsari", "licNo": "3402", "worker": "20", "hp": "50", "validYear": "2026"}, {"name": "SHREE PRABHUKRUPA TILES & MARBLE CO.", "address": "VANSDA ROAD,VILLAGE KHUNDH,CHIKHLI., Khundh, Chikhli, Navsari", "place": "Khundh", "taluka": "Chikhli", "licNo": "4780", "worker": "20", "hp": "50", "validYear": "2027"}, {"name": "THE NEW PHENIX POTTERY COMPANY", "address": "SR NO.127,128,P.B.NO.09,NEAR BANDHARA,GANDEVI., Gandevi, Gandevi, Navsari", "place": "Gandevi", "taluka": "Gandevi", "licNo": "5703", "worker": "20", "hp": "50", "validYear": "2027"}, {"name": "AJANTA TILES", "address": "OPP.G.E.B. GREED CHOKDI, KABILPORE, Kabilpor, Navsari, Navsari", "place": "Kabilpor", "taluka": "Navsari", "licNo": "10880", "worker": "20", "hp": "50", "validYear": "2028"}, {"name": "KRISHNA CEMENT PRODUCTS", "address": "VANSDA ROAD, At. & Po. Manekpore, Manekpor, Chikhli, Navsari", "place": "Manekpor", "taluka": "Chikhli", "licNo": "19620", "worker": "20", "hp": "50", "validYear": "2024"}, {"name": "RAMESHWAR WOOD INDUSTRIES.", "address": "POLT NO.21/R,G.I.D.C,ANTALIA,BILIMORA, Gidc antlia, Gandevi, Navsari", "place": "Gidc antlia", "taluka": "Gandevi", "licNo": "3303", "worker": "50", "hp": "250", "validYear": "2032"}, {"name": "RAJ AGRO INDUSTRIES.", "address": "412, NEW GIDC. BARDOLI ROAD, KBILPORE., Kabilpor, Navsari, Navsari", "place": "Kabilpor", "taluka": "Navsari", "licNo": "3307", "worker": "20", "hp": "250", "validYear": "2030"}, {"name": "PARASNATH FOOD PRODUCTS", "address": "255,BARDOLI ROAD.OPP.NEW GIDC.AT. NASILPORE, TA.: NAVSARI, DIST.: NAVSARI, PIN CODE: 396427, Nasilpor, Navsari, Navsari", "place": "Nasilpor", "taluka": "Navsari", "licNo": "3310", "worker": "50", "hp": "250", "validYear": "2026"}, {"name": "SHREE SWASTIK FOOD PRODUCTS", "address": "278/2,BARDOLI ROAD, AT.NASILPORE., Kabilpor, Navsari, Navsari", "place": "Kabilpor", "taluka": "Navsari", "licNo": "3339", "worker": "20", "hp": "250", "validYear": "2029"}, {"name": "HAREE AUM AGRO INDUSTRIES", "address": "PLOTNO:775, OLD SISODRAROAD. N.H.-8 AT. GANESG SISODRA., Sisodra (ganesh), Navsari, Navsari", "place": "Sisodra (ganesh)", "taluka": "Navsari", "licNo": "3366", "worker": "50", "hp": "250", "validYear": "2030"}, {"name": "SHREE RUSHABH AGRO INDUSTRIES", "address": "278,NEAR GIDC BARDOLI ROAD .NASILPORE., Nasilpor, Navsari, Navsari", "place": "Nasilpor", "taluka": "Navsari", "licNo": "3371", "worker": "50", "hp": "250", "validYear": "2030"}, {"name": "DEVANSHI FOOD PRODUCTS.", "address": "C-46-A UDYOG NAGAR, VIJALPORE, Vejalpor, Navsari, Navsari", "place": "Vejalpor", "taluka": "Navsari", "licNo": "3418", "worker": "20", "hp": "50", "validYear": "2024"}, {"name": "DOSTEE FOOD PRODUCTS", "address": "402,NEW G.I.D.C,KABILPORE, Kabilpor, Navsari, Navsari", "place": "Kabilpor", "taluka": "Navsari", "licNo": "3495", "worker": "50", "hp": "250", "validYear": "2030"}, {"name": "SHREE KAILASH POHA MILL", "address": "432, NEW G.I.D.C,BARDOLI ROAD,KABILPORE, Kabilpor, Navsari, Navsari", "place": "Kabilpor", "taluka": "Navsari", "licNo": "3503", "worker": "100", "hp": "500", "validYear": "2031"}, {"name": "ROMA FOOD INDUSTRIES", "address": "NEAR G.I.D.C,BARDOLI ROAD,P.O.NASHILPORE,NAVSARI, Nasilpor, Navsari, Navsari", "place": "Nasilpor", "taluka": "Navsari", "licNo": "3507", "worker": "50", "hp": "250", "validYear": "2027"}, {"name": "VINAYAK FOOD PRODUCTS", "address": "PLOT NO.134,BARDOLI ROAD,KABILPORE, Kabilpor, Navsari, Navsari", "place": "Kabilpor", "taluka": "Navsari", "licNo": "3584", "worker": "50", "hp": "250", "validYear": "2023"}, {"name": "ARIHANT FOOD PRODUCTS.", "address": "134,BARDOLI ROAD,KABILPORE., Kabilpor, Navsari, Navsari", "place": "Kabilpor", "taluka": "Navsari", "licNo": "3759", "worker": "50", "hp": "250", "validYear": "2029"}, {"name": "SHREE JAY AMBE POHA MILL", "address": "403,NEW G.I.D.C,BARDOLI ROAD,KABILPORE, Kabilpor, Navsari, Navsari", "place": "Kabilpor", "taluka": "Navsari", "licNo": "3763", "worker": "50", "hp": "250", "validYear": "2024"}, {"name": "NAKODA AGRO INDUSTRIES", "address": "457,NEW G.I.D.C,BARDOLI ROAD,KABILPORE., Kabilpor, Navsari, Navsari", "place": "Kabilpor", "taluka": "Navsari", "licNo": "3769", "worker": "50", "hp": "250", "validYear": "2029"}, {"name": "ROYAL FOOD PRODUCTS", "address": "483,NEW G.I.D.C,BARDOLI ROAD,KABILPORE, Kabilpor, Navsari, Navsari", "place": "Kabilpor", "taluka": "Navsari", "licNo": "3771", "worker": "20", "hp": "250", "validYear": "2030"}, {"name": "SHREE KISHAN FOOD PROTEINS", "address": "BLOCK NO.1981,VADA ROAD,GANESH SISODRA., Sisodra (ganesh), Navsari, Navsari", "place": "Sisodra (ganesh)", "taluka": "Navsari", "licNo": "3785", "worker": "100", "hp": "500", "validYear": "2026"}, {"name": "SHREE VARDHAMAN POHA MILL", "address": "262,NEW G.I.D.C,BARDOLIROAD,NASHILPORE., Nasilpor, Navsari, Navsari", "place": "Nasilpor", "taluka": "Navsari", "licNo": "3786", "worker": "50", "hp": "250", "validYear": "2025"}, {"name": "SHREE SUBHAM FOOD PRODUCTS", "address": "BARDOLI ROAD,VILLAGE NASILPORE., Nasilpor, Navsari, Navsari", "place": "Nasilpor", "taluka": "Navsari", "licNo": "3870", "worker": "50", "hp": "250", "validYear": "2026"}, {"name": "ARVIND FOOD PRODUCTS", "address": "N.H.NO.8,MAJIGAM,CHIKHLI., Majigam, Chikhli, Navsari", "place": "Majigam", "taluka": "Chikhli", "licNo": "3933", "worker": "20", "hp": "100", "validYear": "2017"}, {"name": "DEEP FOOD PRODUCTS.", "address": "NAVSARI,BARDOLI ROAD,KABILPORE., Kabilpor, Navsari, Navsari", "place": "Kabilpor", "taluka": "Navsari", "licNo": "4249", "worker": "50", "hp": "100", "validYear": "2009"}, {"name": "NAVKAR FOOD PRODUCTS", "address": "125, BARDOLI ROAD,KABILPORE,NAVSARI., Kabilpor, Navsari, Navsari", "place": "Kabilpor", "taluka": "Navsari", "licNo": "4325", "worker": "50", "hp": "100", "validYear": "2028"}, {"name": "SHIV FOOD PRODUCTS", "address": "DHOLA PIPLA,N.H.NO.8,AMADPORE., Amadpor, Navsari, Navsari", "place": "Amadpor", "taluka": "Navsari", "licNo": "4529", "worker": "50", "hp": "250", "validYear": "2030"}, {"name": "LAXMI PROCESSING UNIT", "address": "PLOT NO.C1-25/26,G.I.D.C,KABILPORE., Kabilpor, Navsari, Navsari", "place": "Kabilpor", "taluka": "Navsari", "licNo": "4693", "worker": "20", "hp": "100", "validYear": "2030"}, {"name": "KRISHNA FOOD PRODUCTS", "address": "428 & 429, GIDC KABILPORE,NAVSARI, Kabilpor, Navsari, Navsari", "place": "Kabilpor", "taluka": "Navsari", "licNo": "5728", "worker": "50", "hp": "250", "validYear": "2026"}, {"name": "SHREE GURUNANAK POHA MILL", "address": "BLOCK NO.217,BARDOLI ROAD,KABILPORE,NAVSARI, Kabilpor, Navsari, Navsari", "place": "Kabilpor", "taluka": "Navsari", "licNo": "5744", "worker": "100", "hp": "500", "validYear": "2026"}, {"name": "PADMAVATI FOOD PRODUCTS", "address": "BLOCK NO. 263/7,8,9 OPP.NEW GIDC BARDOLI ROAD, KABILPORE, NAVSARI., Kabilpor, Navsari, Navsari", "place": "Kabilpor", "taluka": "Navsari", "licNo": "7550", "worker": "50", "hp": "1000", "validYear": "2030"}, {"name": "OMKAR FOOD PRODUCTS", "address": "BLOCK- 123, P-1, NEAR TARSADI, BARDOLI ROAD, ONCHI, NAVSARI., Onchi, Navsari, Navsari", "place": "Onchi", "taluka": "Navsari", "licNo": "9847", "worker": "50", "hp": "250", "validYear": "2026"}, {"name": "PRITAM AGRO PVT. LTD.", "address": "BLOCK NO. 269, PAIKI NO. 3, NEW G.I.D.C., BARDOLI ROAD, NASILPORE, NAVSARI., Nasilpor, Navsari, Navsari", "place": "Nasilpor", "taluka": "Navsari", "licNo": "9849", "worker": "50", "hp": "500", "validYear": "2030"}, {"name": "GAYATRI POHA MILL", "address": "BLOCK NO. 123, BARDOLI ROAD, TARSADI PATIYA, AT. PO. ONCHI, NAVSARI., Onchi, Navsari, Navsari", "place": "Onchi", "taluka": "Navsari", "licNo": "9850", "worker": "50", "hp": "250", "validYear": "2026"}, {"name": "BHAVANI FOOD PRODUCTS", "address": "BLOCK NO. 1509, NH.NO.8, AT. ENDHAL, TA. GANDEVI, NAVSARI., Gandevi, Gandevi, Navsari", "place": "Gandevi", "taluka": "Gandevi", "licNo": "9852", "worker": "50", "hp": "250", "validYear": "2018"}, {"name": "NAVSARI VALSAD JILLA PASHUAAHAR UTPADAK SAHKARI MANDLI LTD", "address": "NEAR SUGAR FACTORY, KHERGAM ROAD, GANDEVI., Khergam, Gandevi, Navsari", "place": "Khergam", "taluka": "Gandevi", "licNo": "12256", "worker": "20", "hp": "50", "validYear": "2026"}, {"name": "THE WINNING EDGE AGRO PRODUCTS..", "address": "BLOCK NO.219, VILLAGE MOLDHARA,(TARSADI) NAVSARI BARDOLI ROAD, TAL& DIST NAVSARI, Moldhara, Navsari, Navsari", "place": "Moldhara", "taluka": "Navsari", "licNo": "14147", "worker": "100", "hp": "500", "validYear": "2027"}, {"name": "NILKANTH AGRO PRODUCTS.", "address": "123, Near Tarsadi Road, Bardoli Road, Onchi, Navsari., ONCHI, Onchi, Navsari, Navsari", "place": "Onchi", "taluka": "Navsari", "licNo": "17717", "worker": "50", "hp": "250", "validYear": "2026"}, {"name": "SUN INDUSTRIES", "address": "SHED NO - C1 / 6 , AT - G I D C ATALIA - BILIMORA, Antaliya (CT), Gandevi, Navsari, 396325", "place": "Antaliya (CT)", "taluka": "Gandevi", "licNo": "43258", "worker": "20", "hp": "100", "validYear": "2029"}, {"name": "SHIV ENTERPRISE", "address": "BLOCK NO.1594,ALIPORE,CHIKHLI., Alipor, Chikhli, Navsari", "place": "Alipor", "taluka": "Chikhli", "licNo": "4331", "worker": "20", "hp": "250", "validYear": "2035"}, {"name": "MONO CHEM", "address": "Plot No.51, GIDC, Kabilpore, Kabilpor, Navsari, Navsari", "place": "Kabilpor", "taluka": "Navsari", "licNo": "22468", "worker": "20", "hp": "50", "validYear": "2033"}, {"name": "RAJ CEMENT PRODUCTS", "address": "Sr. No.331/Paiki, Vansda Road, Near Om Kameshwar Cement Articles, Rethvania, Chikhli, Navsari", "place": "Rethvania", "taluka": "Chikhli", "licNo": "20722", "worker": "20", "hp": "50", "validYear": "2019"}, {"name": "RONAK CEMENT PVT. LTD.", "address": "BLOCK NO.164, PAIKI, VANSDA ROAD, POST. BAMANVEL, Bamanvel, Chikhli, Navsari", "place": "Bamanvel", "taluka": "Chikhli", "licNo": "7021", "worker": "20", "hp": "100", "validYear": "2027"}, {"name": "PARASMANI  INDUSTRIES.", "address": "PLOT NO. 1/R, G.I.D.C., ANTALIA. VIA. BILIMORA., Gidc antlia, Gandevi, Navsari", "place": "Gidc antlia", "taluka": "Gandevi", "licNo": "7078", "worker": "20", "hp": "100", "validYear": "2025"}, {"name": "BALAJI CEMENT INDUSTRIES", "address": "9/R, G.I.D.C., ANTALIA, BILIMORA., Gidc antlia, Gandevi, Navsari", "place": "Gidc antlia", "taluka": "Gandevi", "licNo": "8858", "worker": "20", "hp": "250", "validYear": "2022"}, {"name": "Elysium Industries India Pvt. Ltd.", "address": "Block No.109, Arak, Jalalpore, Navsari, 396475", "place": "Arak", "taluka": "Jalalpore", "licNo": "44483", "worker": "250", "hp": "500", "validYear": "2030"}, {"name": "KAILASH PACKWELL", "address": "PLOT NO - C1B / 1 / 145 & 97 , AT - G. I. D. C. ANTALIA , BILIMORA . TAL - GANDEVI DIST - NAVSARI -396325, Bilimora, Gandevi, Navsari", "place": "Bilimora", "taluka": "Gandevi", "licNo": "32199", "worker": "20", "hp": "250", "validYear": "2027"}, {"name": "VIDHIK PRINTS PVT. LTD.", "address": "PLOT NO- 24/B, GIDC ANTALIA, BILIMORA, Antaliya (CT), Gandevi, Navsari, 396325", "place": "Antaliya (CT)", "taluka": "Gandevi", "licNo": "55773", "worker": "50", "hp": "250", "validYear": "2025"}, {"name": "BHAVYA PACKAGING SOLUTION", "address": "CITY SURVEY NO.NA679/003 KARANJDEVI CHAR RASTA. VILLAGE: VALOTI. TAL.- GANDEVI. DIST.-NAVSARI., Valoti, Gandevi, Navsari, 396380", "place": "Valoti", "taluka": "Gandevi", "licNo": "58504", "worker": "20", "hp": "250", "validYear": "2029"}, {"name": "JYOTI METAL & MECHENICAL INDUSTRIES", "address": "BEHIND TELEFONE OFFICE NAVSARI, Navsari, Navsari, Navsari", "place": "Navsari", "taluka": "Navsari", "licNo": "3190", "worker": "20", "hp": "50", "validYear": "2026"}, {"name": "ZAVERCHAND DAYARAM KANSARA METAL WORKS.", "address": "BAZAR STREET, BILIMORA., Bilimora, Gandevi, Navsari", "place": "Bilimora", "taluka": "Gandevi", "licNo": "7800", "worker": "50", "hp": "100", "validYear": "2027"}, {"name": "PLANET POWER TOOLS PVT. LTD.", "address": "Plot No.L/226-231, G.I.D.C.Indus.Estate,Kabilpore., Kabilpor, Navsari, Navsari", "place": "Kabilpor", "taluka": "Navsari", "licNo": "18536", "worker": "250", "hp": "50", "validYear": "2028"}, {"name": "SHAPOO TOOLS", "address": "Plot No.A2/3/59, G.I.D.C., Antalia, Gidc antlia, Gandevi, Navsari", "place": "Gidc antlia", "taluka": "Gandevi", "licNo": "21081", "worker": "100", "hp": "100", "validYear": "2026"}, {"name": "SANGHVI IMPEX", "address": "PLOT NO - 42/44 , AT - G I D C ANTALIA , BILIMORA, Antaliya (CT), Gandevi, Navsari, 396325", "place": "Antaliya (CT)", "taluka": "Gandevi", "licNo": "52723", "worker": "20", "hp": "100", "validYear": "2027"}, {"name": "HIGHBROW HEALTHCARE", "address": "ON PLOT NO. : 147 TO 150, AT G.I.D.C. : KABILPORE, NAVSARI, Kabilpor, Navsari, Navsari, 396424", "place": "Kabilpor", "taluka": "Navsari", "licNo": "47722", "worker": "50", "hp": "250", "validYear": "2026"}, {"name": "RATAN DETERGENT GRUH UDHYOG", "address": "CITY SR. NO. : NA209/1, AT, Onchi, Navsari, Navsari, 396427", "place": "Onchi", "taluka": "Navsari", "licNo": "54884", "worker": "20", "hp": "250", "validYear": "2028"}, {"name": "RHYTHM CHEMICALS", "address": "C1/234, AT GIDC KABILPORE NAVSARI 396424, Navsari, Navsari, Navsari, 396424", "place": "Navsari", "taluka": "Navsari", "licNo": "36687", "worker": "20", "hp": "50", "validYear": "2022"}, {"name": "AIM SALES CORPORATION", "address": "SHED NO : C1/234 & C1/235, AT GIDC :KABILPORE NAVSARI 396424, Navsari, Navsari, Navsari, 396424", "place": "Navsari", "taluka": "Navsari", "licNo": "36688", "worker": "20", "hp": "100", "validYear": "2027"}, {"name": "D & H ENGINEERING (BHARAT) PVT.LTD.", "address": "PLOT NO. 37/1,37/2, N.H.NO.8, MAJIGAM, CHIKHLI., Majigam, Chikhli, Navsari", "place": "Majigam", "taluka": "Chikhli", "licNo": "2457", "worker": "50", "hp": "500", "validYear": "2020"}, {"name": "JYOTI MECH INDUSTRIES", "address": "T-12/A, UDYOGNAGAR NAVSARI, Navsari, Navsari, Navsari", "place": "Navsari", "taluka": "Navsari", "licNo": "15176", "worker": "50", "hp": "100", "validYear": "2024"}, {"name": "MAHAVIR ORGANICS PVT.LTD.", "address": "AT & PO.RETHWANIA, CHIKHLI-VANSDA ROAD., Rethvania, Chikhli, Navsari", "place": "Rethvania", "taluka": "Chikhli", "licNo": "520", "worker": "20", "hp": "50", "validYear": "2008"}, {"name": "FLYING BOOK MFG CO.", "address": "210/211, OLD GIDC KABILPOE, Navsari, Navsari, Navsari", "place": "Navsari", "taluka": "Navsari", "licNo": "3252", "worker": "20", "hp": "50", "validYear": "2022"}, {"name": "VIKRANT TRANSFORMERS", "address": "MAROLI VILLAGE ROAD,MAROLI, Maroli, Jalalpore, Navsari", "place": "Maroli", "taluka": "Jalalpore", "licNo": "3585", "worker": "20", "hp": "100", "validYear": "2035"}, {"name": "WINDSON CHEMICAL PRIVATE LIMITED.", "address": "BLOCK NO.1834/P1 & P2,1827/PAIKI 2, AT CHIKHLI-VASDA ROAD, VILLAGE-ALIPORE, TA-CHIKHLI, DIST-NAVSARI, Alipor, Chikhli, Navsari", "place": "Alipor", "taluka": "Chikhli", "licNo": "3337", "worker": "250", "hp": "2000", "validYear": "2027"}, {"name": "RAJ CHEMICAL INDUSTRIES", "address": "VIJAY BAUG,GANDEVI, Navsari, Navsari, Navsari", "place": "Navsari", "taluka": "Navsari", "licNo": "3404", "worker": "20", "hp": "10", "validYear": "2029"}, {"name": "TIRUPATI PRODUCTS", "address": "NEAR COLLEGE CHOWK,VASANDA ROAD,CHIKHLI, Chikhli, Chikhli, Navsari", "place": "Chikhli", "taluka": "Chikhli", "licNo": "3432", "worker": "20", "hp": "100", "validYear": "2019"}, {"name": "ARVIND ENGINEERING & METAL WORKES.", "address": "CHIKHLI BILIMORA ROAD,AT NANDARAKHA, Nandarkha, Gandevi, Navsari", "place": "Nandarkha", "taluka": "Gandevi", "licNo": "3235", "worker": "20", "hp": "10", "validYear": "2027"}, {"name": "SHRE SOMNATH FOUNDRY", "address": "PLOT NO 84&95,G.I.D.C ESTATE,ANTALIA, Gidc antlia, Gandevi, Navsari", "place": "Gidc antlia", "taluka": "Gandevi", "licNo": "3437", "worker": "20", "hp": "50", "validYear": "2021"}, {"name": "HONEST IRON AND STEEL PRIVATE LIMITED", "address": "RAM KRISHNA COMPLEX,VILLAGE ALIPORE, Alipor, Chikhli, Navsari", "place": "Alipor", "taluka": "Chikhli", "licNo": "3453", "worker": "50", "hp": "250", "validYear": "2030"}, {"name": "GHELABHAI GOPALJI & CO.", "address": "DUDHIA TALAV,PETROL PUMP,NAVSARI, Navsari, Navsari, Navsari", "place": "Navsari", "taluka": "Navsari", "licNo": "3533", "worker": "50", "hp": "50", "validYear": "2026"}, {"name": "ARVIND INDUSTRIES", "address": "NADARKHA ,BILIMORA., Nandarkha, Gandevi, Navsari", "place": "Nandarkha", "taluka": "Gandevi", "licNo": "4104", "worker": "20", "hp": "10", "validYear": "2027"}, {"name": "AALIDHRA INDUSTRIES PVT LTD", "address": "Block No.: 212, Building No.: A-1 and B-2, Vill.: Ashtagam, NH-48, Dist.: Navsari - 396433, Ashtagam, Navsari, Navsari, 396433", "place": "Ashtagam", "taluka": "Navsari", "licNo": "42717", "worker": "250", "hp": "1000", "validYear": "2033"}, {"name": "RBM BEVERAGES", "address": "PLOT NO 184, KABILPORE,GIDC,NAVSARI, Navsari, Navsari, Navsari, 396424", "place": "Navsari", "taluka": "Navsari", "licNo": "35244", "worker": "20", "hp": "50", "validYear": "2022"}, {"name": "J R FOODS AND BEVERAGES", "address": "Plot No.: 13 & 14, Block No.: 1862, Euro Food Park, B/h Gujarat Hotel, N.H.48, Degam, Chikhli, Navsari, 396530", "place": "Degam", "taluka": "Chikhli", "licNo": "55309", "worker": "250", "hp": "1000", "validYear": "2028"}, {"name": "GUDDY WEFERS", "address": "SCHOOL NO.6,GAURISHANKAR STREET,JALALPORE ROAD., Navsari, Navsari, Navsari", "place": "Navsari", "taluka": "Navsari", "licNo": "3578", "worker": "20", "hp": "10", "validYear": "2009"}, {"name": "NAVSARI FOOD PRODUCTS PVT. LTD.", "address": "BLOCK NO.242, VILLAGE-AMRI., Amri, Navsari, Navsari", "place": "Amri", "taluka": "Navsari", "licNo": "8027", "worker": "50", "hp": "500", "validYear": "2029"}, {"name": "OZICO FOOD", "address": "BLOCK/SURVEY NO: 1862,PLOT NO: 24,EURO FOOD PARK,N.H. NO. 48, NR.GUJARAT HOTEL, Degam, Chikhli, Navsari, 396530", "place": "Degam", "taluka": "Chikhli", "licNo": "46084", "worker": "50", "hp": "500", "validYear": "2026"}, {"name": "DEEP FRESH FROZEN PRODUCTS", "address": "BLOCK NO: 1404/1, HARIPURA STREET, KHAREL - SAPUTARA STATE HIGHWAY, Gandeva, Gandevi, Navsari, 396430", "place": "Gandeva", "taluka": "Gandevi", "licNo": "37402", "worker": "20", "hp": "50", "validYear": "2028"}, {"name": "LUCKY FOOD PRODUCT COMPANY", "address": "BLOCK NO: 141, PLOT NO: 44 TO 56, SPARKLE INDUSTRIAL ESTATE, Chokhad, Jalalpore, Navsari, 396415", "place": "Chokhad", "taluka": "Jalalpore", "licNo": "51659", "worker": "20", "hp": "100", "validYear": "2027"}, {"name": "GANDEVI VIBHAG VIVIDH KARYAKARI SAHAKARI MANDALI LTD", "address": "S.NO:370/1,PAIKY GANDEVI., Gandevi, Gandevi, Navsari", "place": "Gandevi", "taluka": "Gandevi", "licNo": "3183", "worker": "50", "hp": "0", "validYear": "2030"}, {"name": "KHAREL VIBHAG VIVIDH KARYAKARI SAHAKARI MANDLI LTD.", "address": "KHAREL., Gandeva, Gandevi, Navsari", "place": "Gandeva", "taluka": "Gandevi", "licNo": "7040", "worker": "50", "hp": "50", "validYear": "2028"}, {"name": "DHANORI SEVA SAHAKARI MANDLI LTD.", "address": "DHANORI., Dhanori, Gandevi, Navsari", "place": "Dhanori", "taluka": "Gandevi", "licNo": "7042", "worker": "20", "hp": "10", "validYear": "2028"}, {"name": "VASUNDHARA V.V.J.V.S.M.LTD.", "address": "\"VRINDAVAN CAMPUS\" LACHHAKADI, PO. GANGPUR., Gangpur, Vasnda, Navsari", "place": "Gangpur", "taluka": "Vasnda", "licNo": "7355", "worker": "50", "hp": "100", "validYear": "2030"}, {"name": "VANIL UDHYOG G.S.F.D.C.LTD.", "address": "VILLAGE NAVTAR,VANSDA., Navtad, Vasnda, Navsari", "place": "Navtad", "taluka": "Vasnda", "licNo": "3889", "worker": "100", "hp": "250", "validYear": "2028"}, {"name": "UNIMAPLE MODUTECH PVT. LTD.", "address": "BLOCK NO.: 552, CITY SURVEY NO.: NA552, RITURAJ VILLA - CANEL ROAD, NEAR N.H.:48, Vesma, Jalalpore, Navsari, 396475", "place": "Vesma", "taluka": "Jalalpore", "licNo": "58986", "worker": "250", "hp": "500", "validYear": "2029"}, {"name": "ASANJO FURNITURE", "address": "PLOT NO 6 & 7, G. I. D. C. ANTALYA, BILIMORA, Bilimora, Gandevi, Navsari", "place": "Bilimora", "taluka": "Gandevi", "licNo": "31220", "worker": "50", "hp": "250", "validYear": "2019"}, {"name": "ZANE INDUSTRIES PVT. LTD.", "address": "SR. NO - 229 , NAVSARI - BARDOLI ROAD, AT - VILLAGE ONCHI , Onchi, Navsari, Navsari, 396427", "place": "Onchi", "taluka": "Navsari", "licNo": "49686", "worker": "20", "hp": "50", "validYear": "2026"}, {"name": "SHREE VISHVAKARMA FURNITURE MART.", "address": "CITY SURVEY No. NA28, TANKAL CHAR RASTA. RANKUVA ROAD. VILLAGE.- TANKAL. TAL.-CHIKHLI. DIST.-NAVSARI., Tankal, Chikhli, Navsari, 396560", "place": "Tankal", "taluka": "Chikhli", "licNo": "57885", "worker": "20", "hp": "50", "validYear": "2029"}, {"name": "PERFECT ORGANIC FERTILISER", "address": "AT.POST.SIMLAK.JALALPORE., Simlak, Jalalpore, Navsari", "place": "Simlak", "taluka": "Jalalpore", "licNo": "5217", "worker": "20", "hp": "50", "validYear": "2025"}, {"name": "SURAJ JEMS", "address": "2458/1,HOUSE OF MANILAL,GR.FLOOR,CHARPUL,NAVSARI, Navsari, Navsari, Navsari", "place": "Navsari", "taluka": "Navsari", "licNo": "3542", "worker": "100", "hp": "100", "validYear": "2009"}, {"name": "SEMPRE INTERNATIONAL", "address": "OLD G.I.D.C., PLOT NO . 162 TO 1644 SISODRA ROAD, KABILPORE, NAVSARI, Kabilpor, Navsari, Navsari", "place": "Kabilpor", "taluka": "Navsari", "licNo": "5792", "worker": "50", "hp": "100", "validYear": "2020"}, {"name": "UNI DESIGN ELITE JEWELLERY PRIVATE LIMITED", "address": "BHI. KOSALIYA PARK,AT&POST.JAMAPORE GANDEVI ROAD NAVSARI, Jamalpor, Navsari, Navsari", "place": "Jamalpor", "taluka": "Navsari", "licNo": "7995", "worker": "1000", "hp": "250", "validYear": "2026"}, {"name": "CDPL DIAMONDS LLP", "address": "FIRST FLOOR , C. S. NO - 3626 , OPP. PATEL SOCIETY , KASHAP ROAD , NAVSARI, Navsari, Navsari, Navsari, 396445", "place": "Navsari", "taluka": "Navsari", "licNo": "39996", "worker": "50", "hp": "10", "validYear": "2026"}, {"name": "MB DIAMONDS LLP", "address": "Sr. Block No. 194, Village : Chhapra, Sindhi camp, Navsari- 396445, Chhapra, Navsari, Navsari, 396445", "place": "Chhapra", "taluka": "Navsari", "licNo": "46869", "worker": "5000", "hp": "5000", "validYear": "2026"}, {"name": "R.C. GEMS", "address": "SUB PLOT No. 3, TIKA No.16,CITY SURVEY No. 2210,2211. R.SURVEY No.609/1+2,610/ 1, T.PNo.1, O.P. No. 233,F.P. No. 371,M.S. ROAD NAVSARI.TAL.- NAVSARI.DIST.-NAVSARI., Navsari, Navsari, Navsari, 396445", "place": "Navsari", "taluka": "Navsari", "licNo": "49491", "worker": "500", "hp": "1000", "validYear": "2027"}, {"name": "PARMES DIAMONDS MANUFACTURING LLP", "address": "SURVEY NO 194,THIRD & FOURTH FLOOR,VILLAGE CHHAPRA,TAL NAVSARI,DIST NAVSARI, Chhapra, Navsari, Navsari, 396445", "place": "Chhapra", "taluka": "Navsari", "licNo": "52549", "worker": "500", "hp": "500", "validYear": "2028"}, {"name": "FANCY MFG LLP UNIT 2", "address": "SARDAR PATEL TOWNSHIP NEAR NAVSARI COTTON MILLS,VIJALPORE NAVSARI -396445, Eru Char Rasta,abrama Road,vijalpore,navsari, Navsari, Navsari, Navsari, 396445", "place": "Navsari", "taluka": "Navsari", "licNo": "41645", "worker": "50", "hp": "100", "validYear": "2025"}, {"name": "REEMZ MANUFACTURING LLP", "address": "Near sai residency, Opp A One Bungalows, Eru Char Rasta, vijalpore navsari., Navsari, Navsari, Navsari, 396450", "place": "Navsari", "taluka": "Navsari", "licNo": "42085", "worker": "500", "hp": "1000", "validYear": "2027"}, {"name": "RAMDEV GEMS", "address": "CITY SR. NO. : 2233, PLOT NO : A, Nr. PRAKASH TALKIES, STATION ROAD, Navsari, Navsari, Navsari, 396445", "place": "Navsari", "taluka": "Navsari", "licNo": "52623", "worker": "50", "hp": "250", "validYear": "2025"}, {"name": "ANKIT JEWELLERS", "address": "PLOT NO. : D/26, (SECOND FLOOR), AT UDYOG NAGAR, Vejalpor, Navsari, Navsari, 396445", "place": "Vejalpor", "taluka": "Navsari", "licNo": "57642", "worker": "50", "hp": "100", "validYear": "2026"}, {"name": "UNI-DESIGN ELITE JEWELLERY PVT. LTD. (UNIT -II)", "address": "CITY SR. NO.: 00280091, MAHENDRA BROTHERS EXPORTS PVT. LTD., GANDEVI ROAD, Jamalpor, Navsari, Navsari, 396445", "place": "Jamalpor", "taluka": "Navsari", "licNo": "58684", "worker": "50", "hp": "5000", "validYear": "2026"}, {"name": "VIKAS INDUSTRIES", "address": "C-1/5,G.I.D.C,ANTALIA,BILIMORA., Bilimora, Gandevi, Navsari", "place": "Bilimora", "taluka": "Gandevi", "licNo": "4689", "worker": "20", "hp": "100", "validYear": "2020"}, {"name": "NEWPAR AROMATICS LLP", "address": "B-2,MAROLI UDHYOG NAGAR,POST.MAROLI BAZAR., Maroli, Jalalpore, Navsari", "place": "Maroli", "taluka": "Jalalpore", "licNo": "3893", "worker": "50", "hp": "500", "validYear": "2024"}, {"name": "SUNBEZ SPECIALITY FILMS PVT. LTD.", "address": "OLD BLOCK / SURVERY NO. : 133 & 129/1, NEW BLOCK / SURVEY NO. : 147 / 001 & 130/1, PARDI KAMBADA ROAD, Kanbad, Navsari, Navsari, 396433", "place": "Kanbad", "taluka": "Navsari", "licNo": "55414", "worker": "50", "hp": "2000", "validYear": "2033"}, {"name": "BHAVNA INDASTRIES", "address": "430/1,II PHASE,NEW GIDC,KABILPORE,NAVSARI, Kabilpor, Navsari, Navsari", "place": "Kabilpor", "taluka": "Navsari", "licNo": "3292", "worker": "20", "hp": "50", "validYear": "2026"}, {"name": "YASHASHVI RASAYAN PRIVATE LIMITED", "address": "PLOT NO.: B-1, B-3, B-4 (BLOCK NO.: 200), PLOT NO.: C-3/A,B (BLOCK NO.: 199), BLOCK NO.: 140/B PAIKEE, MAROLI UDHYOGNAGAR, VILLAGE: NADOD, Nandod, Jalalpore, Navsari, 396436", "place": "Nandod", "taluka": "Jalalpore", "licNo": "38012", "worker": "50", "hp": "500", "validYear": "2030"}, {"name": "SHREE CHEMICALS", "address": "SR. NO : 953 AND 954, (OLD SR. NO - 127 P8 / 9) VANSDA - CHIKHLI ROAD , AT : VILLAGE MANEKPOR, Manekpor, Chikhli, Navsari, 396560", "place": "Manekpor", "taluka": "Chikhli", "licNo": "56801", "worker": "50", "hp": "1000", "validYear": "2033"}, {"name": "SHANTI AGRO PRODUCTS", "address": "SHED NO. C1-B-13,OLD G.I.D.C.,KABILPORE., Kabilpor, Navsari, Navsari", "place": "Kabilpor", "taluka": "Navsari", "licNo": "4136", "worker": "20", "hp": "250", "validYear": "2034"}, {"name": "MARK POLYMERS", "address": "NEAR SUNRISE PUMP, VANSDA ROAD, ALIPORE, CHIKHLI., Alipor, Chikhli, Navsari", "place": "Alipor", "taluka": "Chikhli", "licNo": "7502", "worker": "20", "hp": "50", "validYear": "2015"}, {"name": "HARI OM INDUSTRIES.", "address": "OPP:CHIKHALI RAILWAY STATION. AT DEGAM., Degam, Chikhli, Navsari", "place": "Degam", "taluka": "Chikhli", "licNo": "3365", "worker": "20", "hp": "100", "validYear": "2033"}, {"name": "MISTRY SHUTTLE INDUSTRIES", "address": "PLOT NO.88, GIDC ANTALIA, BILIMORA, Gidc antlia, Gandevi, Navsari", "place": "Gidc antlia", "taluka": "Gandevi", "licNo": "3540", "worker": "20", "hp": "50", "validYear": "2033"}, {"name": "ASHISH ENTERPRISE", "address": "GANDEVI ROAD,P.O.DEVSAR,BILIMORA., Bilimora, Gandevi, Navsari", "place": "Bilimora", "taluka": "Gandevi", "licNo": "4074", "worker": "50", "hp": "100", "validYear": "2029"}, {"name": "JENSON VENEERS PLY", "address": "OPP BIPICO INDUSTRIES, BILIMORA-CHIKHLI ROAD, AT.PO- NANDARKHA, Nandarkha, Gandevi, Navsari", "place": "Nandarkha", "taluka": "Gandevi", "licNo": "4791", "worker": "20", "hp": "100", "validYear": "2027"}, {"name": "SHREE JYOTI INDUSTRISE", "address": "CHIKHLI ROAD,OPP.BIPICO IND.NANDARKHA,BILIMORA, Bilimora, Gandevi, Navsari", "place": "Bilimora", "taluka": "Gandevi", "licNo": "5374", "worker": "50", "hp": "100", "validYear": "2026"}, {"name": "VIRAT INDUSTRIES LTD.", "address": "A-1/2,G.I.D.C,INDUSTRIAL ESTATE,KABILPORE., Kabilpor, Navsari, Navsari", "place": "Kabilpor", "taluka": "Navsari", "licNo": "3891", "worker": "250", "hp": "1000", "validYear": "2026"}, {"name": "AARVIT INDUSTRIES", "address": "BLOCK NO: 454, PLOT NO: 10 & 11, FAIRDEAL INDUSTRIAL PARK - 1, VILLAGE: VESMA, Vesma, Jalalpore, Navsari, 396475", "place": "Vesma", "taluka": "Jalalpore", "licNo": "58248", "worker": "20", "hp": "500", "validYear": "2028"}, {"name": "SHREE RAMJI FAB", "address": "SURVEY NO: 600 & 635, BLOCK NO: 515/001, N. H. WAY NO: 08, SUB DIVISION-1, VILLAGE: VESMA, Vesma, Jalalpore, Navsari, 396475", "place": "Vesma", "taluka": "Jalalpore", "licNo": "58877", "worker": "50", "hp": "500", "validYear": "2029"}, {"name": "WORLD CRAFTERS", "address": "PLOT NO.78,G.I.D.C,ANTALIA,BILIMORA, Gidc antlia, Gandevi, Navsari", "place": "Gidc antlia", "taluka": "Gandevi", "licNo": "3570", "worker": "50", "hp": "50", "validYear": "2022"}, {"name": "SAI RAJ EMBROIDERIES PRIVATE LIMITED", "address": "PLOT NO.60A-2/4,G.I.D.C,ANTALIA., Gidc antlia, Gandevi, Navsari", "place": "Gidc antlia", "taluka": "Gandevi", "licNo": "3843", "worker": "50", "hp": "50", "validYear": "2029"}, {"name": "DECENT HONEST", "address": "PLOT NO. 63/4, DHAKWADA ROAD, ANTALIA, Gidc antlia, Gandevi, Navsari", "place": "Gidc antlia", "taluka": "Gandevi", "licNo": "1457", "worker": "20", "hp": "50", "validYear": "2009"}, {"name": "BILIMORA ENGINEERS PVT.LTD", "address": "MAHADEV NAGAR,BILIMORA., Bilimora, Gandevi, Navsari", "place": "Bilimora", "taluka": "Gandevi", "licNo": "4691", "worker": "50", "hp": "100", "validYear": "2023"}, {"name": "DEEP ENTERPRISE", "address": "Block No.9/404, Near Swaminarayan Mandir, Aru Road, Vejalpor, Navsari, Navsari", "place": "Vejalpor", "taluka": "Navsari", "licNo": "18880", "worker": "20", "hp": "50", "validYear": "2017"}, {"name": "PRISM MILLS LIMITED", "address": "PLOT NO. :175/2 PAIKE1, NEAR GRID, N.H.NO.8, Kadipor, Navsari, Navsari, 396424", "place": "Kadipor", "taluka": "Navsari", "licNo": "49617", "worker": "50", "hp": "500", "validYear": "2026"}, {"name": "VALSAD DIST. CO-OP. MILK PRODUCERS\" UNION LTD.", "address": "AT: ALIPUR, TAL: CHIKHLI, DIST: NAVSARI., Alipor, Chikhli, Navsari", "place": "Alipor", "taluka": "Chikhli", "licNo": "7659", "worker": "1000", "hp": "5000", "validYear": "2027"}, {"name": "PRIME SHUTTLES.", "address": "PLOT NO 4/R,GIDC. ANTALIA. VIA. BILLIMORA., Gidc antlia, Gandevi, Navsari", "place": "Gidc antlia", "taluka": "Gandevi", "licNo": "3311", "worker": "20", "hp": "50", "validYear": "2028"}, {"name": "MERCHANT INDUSTRIES", "address": "MAHADEV NAGAR, BEHIND STATE BANK OF INDIA ,BILIMORA, Bilimora, Gandevi, Navsari", "place": "Bilimora", "taluka": "Gandevi", "licNo": "4230", "worker": "20", "hp": "50", "validYear": "2024"}, {"name": "M/S. NARSIHDAS MORARJI WADIA", "address": "P.O.BOX NO.45, HANUMAN STREET,BILIMORA,NAVSARI, Bilimora, Gandevi, Navsari", "place": "Bilimora", "taluka": "Gandevi", "licNo": "5198", "worker": "20", "hp": "50", "validYear": "2030"}, {"name": "RATHOD PHARMACHEM PVT LTD", "address": "BLOCK/SR.NO-117,GANDEVI ROAD,VILLAGE:PIPALDHARA,TAL:GANDEVI,DIST:NAVSARI-396430, Pipaldhara, Gandevi, Navsari, 396430", "place": "Pipaldhara", "taluka": "Gandevi", "licNo": "49618", "worker": "50", "hp": "500", "validYear": "2026"}, {"name": "NEEL NAYAN PHARMA PVT.LTD.", "address": "PLOT NO.524-P/1,CHIKHLI ROAD,PO.PATI., TA-GANDEVI, DIST-NAVSARI, Pati, Gandevi, Navsari", "place": "Pati", "taluka": "Gandevi", "licNo": "4779", "worker": "50", "hp": "250", "validYear": "2027"}, {"name": "ACEY CONTROLFLEX ENGINEERING PVT. LTD.", "address": "PLOT NO- 104, GIDC ANTALIA, BILIMORA, Antaliya (CT), Gandevi, Navsari, 396325", "place": "Antaliya (CT)", "taluka": "Gandevi", "licNo": "54314", "worker": "20", "hp": "500", "validYear": "2028"}, {"name": "AJAY INDUSTRIES", "address": "PLOT NO -117 & 130 OLD G.I.D.C, KABILPORE NAVSARI,396424, Navsari, Navsari, Navsari, 396424", "place": "Navsari", "taluka": "Navsari", "licNo": "39934", "worker": "20", "hp": "50", "validYear": "2028"}, {"name": "KHUSHI FABRICATORS", "address": "PLOT NO- 30/R, G.I.D.C. ANTALIA,BILIMORA, Antaliya (CT), Gandevi, Navsari, 396325", "place": "Antaliya (CT)", "taluka": "Gandevi", "licNo": "36592", "worker": "20", "hp": "100", "validYear": "2030"}, {"name": "JAIN METAL", "address": "SHED NO.C-1/30 & C-1B/31,GIDC KABILPORE,NAVSARI, Navsari, Navsari, Navsari, 396424", "place": "Navsari", "taluka": "Navsari", "licNo": "39225", "worker": "20", "hp": "250", "validYear": "2030"}, {"name": "NAZ ENTERPRISE", "address": "SR. NO - 72 , NAVA FALIYA , NAVSARI - BARDOLI ROAD , AT - VILLAGE BHATTAI - NAVSARI, Bhattai, Navsari, Navsari, 396427", "place": "Bhattai", "taluka": "Navsari", "licNo": "44080", "worker": "50", "hp": "50", "validYear": "2030"}, {"name": "NEW GANESH METAL INDUSTRIES", "address": "SHED NO K-1/3, G.I.D.C.ANTALIA, BILIMORA, ANTALIYA, Bilimora, Gandevi, Navsari", "place": "Bilimora", "taluka": "Gandevi", "licNo": "31507", "worker": "20", "hp": "50", "validYear": "2021"}, {"name": "ACEY ENGINEERING PVT LTD", "address": "105 GIDC ANTALIA.BILLIMORA, Gidc antlia, Gandevi, Navsari", "place": "Gidc antlia", "taluka": "Gandevi", "licNo": "3223", "worker": "500", "hp": "500", "validYear": "2029"}, {"name": "DURGA INDSTRIES", "address": "J-302,G.I.D.C,PO.KABILPORE,NAVSARI, Kabilpor, Navsari, Navsari", "place": "Kabilpor", "taluka": "Navsari", "licNo": "3423", "worker": "20", "hp": "100", "validYear": "2027"}, {"name": "REEKVIK CHEMICALS", "address": "127, MANEKPORE, CHIKHLI-VANSDA ROAD, Manekpor, Chikhli, Navsari", "place": "Manekpor", "taluka": "Chikhli", "licNo": "517", "worker": "20", "hp": "50", "validYear": "2018"}, {"name": "INFICHEM PHARMA PVT.LTD", "address": "MFG. UNIT, PLOT NO. 1594, CHIKHLI - VANSDA ROAD ALIPORE, Alipor, Chikhli, Navsari", "place": "Alipor", "taluka": "Chikhli", "licNo": "1439", "worker": "100", "hp": "500", "validYear": "2027"}, {"name": "SWASTIK OIL PRODUCTS MANUFACTURING NAVSARI PVT. LTD.", "address": "VILLAGE UNN.P.O.KHADSUPA,BOARDING, Khadsupa, Navsari, Navsari", "place": "Khadsupa", "taluka": "Navsari", "licNo": "3501", "worker": "100", "hp": "500", "validYear": "2030"}, {"name": "TERZZET", "address": "C-24, UDYOGNAGAR, NAVSARI, Navsari, Navsari, Navsari", "place": "Navsari", "taluka": "Navsari", "licNo": "3566", "worker": "20", "hp": "50", "validYear": "2030"}, {"name": "SAMRUDDHI ENTERPRISE", "address": "BLOCK NO.186,MANEKPORE, Manekpor, Chikhli, Navsari", "place": "Manekpor", "taluka": "Chikhli", "licNo": "3574", "worker": "20", "hp": "50", "validYear": "2028"}, {"name": "CHOKSEY CHEMICAL INDUSTRIES", "address": "N.H.NO.8,P.O.KABILPORE,NAVSARI., Kabilpor, Navsari, Navsari", "place": "Kabilpor", "taluka": "Navsari", "licNo": "4261", "worker": "50", "hp": "100", "validYear": "2031"}, {"name": "NADOD CHEMICAL IND.PVT.LTD.", "address": "PLOT NO - C-1 , SR. NO - 199 , MAROLI UDHYOGNAGAR , UBHRAT ROAD , AT - VILLAGE - NADOD, TAL - JALALPORE , DIST - NAVSARI - 396436, Nandod, Jalalpore, Navsari", "place": "Nandod", "taluka": "Jalalpore", "licNo": "3514", "worker": "20", "hp": "100", "validYear": "2027"}, {"name": "BETA ORGANIC CHEMICAL IND.PVT.LTD.", "address": "C/1,MAROLI UDYOGNAGAR,VILL.UMBHRAT ROAD,MAROLI BAZAR., Maroli, Jalalpore, Navsari", "place": "Maroli", "taluka": "Jalalpore", "licNo": "4214", "worker": "20", "hp": "0", "validYear": "2028"}, {"name": "MAXO PRODUCTS", "address": "PLOT NO.213,G.I.D.C. KABILPORE,NAVSARI., Kabilpor, Navsari, Navsari", "place": "Kabilpor", "taluka": "Navsari", "licNo": "4303", "worker": "20", "hp": "250", "validYear": "2025"}, {"name": "HLE GLASCOAT LIMITED (CHEMICAL UNIT )", "address": "PLOT NO. A-7, BLOCK NO.140/P, BLOCK NO. 199, AT.MAROLI UDYOGNAGAR, VILL-NADOD, Maroli, Jalalpore, Navsari", "place": "Maroli", "taluka": "Jalalpore", "licNo": "4771", "worker": "50", "hp": "250", "validYear": "2021"}, {"name": "SATNAM ENGiNEERiNG WORKS", "address": "PLOT NO - 183 / B , AT - G I D C ANTALIA , BILIMORA , Antaliya (CT), Gandevi, Navsari, 396325", "place": "Antaliya (CT)", "taluka": "Gandevi", "licNo": "36833", "worker": "20", "hp": "50", "validYear": "2028"}, {"name": "ASPEE AGRO EQUIPMENT PRIVATE LIMITED.", "address": "Block / Survey No. 84 Near National Highway No. 48 Village : Balwada. - 396521 Tal.- Chikhli.Dist.- Navsari, Balwada, Chikhli, Navsari, 396521", "place": "Balwada", "taluka": "Chikhli", "licNo": "50036", "worker": "100", "hp": "1000", "validYear": "2027"}, {"name": "SAGAR VENEER INDUSTRIES.", "address": "BLOCK NO.1781, VANSDA ROAD,NEAR BHAVIN CONSTRUCTION, AT. ALIPORE, PO. BAMANVEL., Alipor, Chikhli, Navsari", "place": "Alipor", "taluka": "Chikhli", "licNo": "785", "worker": "20", "hp": "50", "validYear": "2026"}, {"name": "KIRTI PLY AND DOORS", "address": "PLOT NO.146,G.I.D.C,ANTALIA,BILIMORA., Gidc antlia, Gandevi, Navsari", "place": "Gidc antlia", "taluka": "Gandevi", "licNo": "3770", "worker": "20", "hp": "100", "validYear": "2012"}, {"name": "ADITYA INDUSTRIES.", "address": "Chikhli-Vansda Road, Block No.1834/1,Alipore., Alipor, Chikhli, Navsari", "place": "Alipor", "taluka": "Chikhli", "licNo": "15151", "worker": "50", "hp": "100", "validYear": "2026"}, {"name": "JIVYAM PLYBOARD CO", "address": "SR NO - 430/2/1, 430/2/2, 430/2/3, 430/2/4, & 430/2/5,BAMANVEL ROAD, KHUNDH, Khundh, Chikhli, Navsari, 396521", "place": "Khundh", "taluka": "Chikhli", "licNo": "40168", "worker": "50", "hp": "500", "validYear": "2027"}, {"name": "JAI AMBE BISCUIT BACKERY & FARSAN PRODUCTS", "address": "132,GIDC,KABILPOR,NAVSARI, Kabilpor, Navsari, Navsari", "place": "Kabilpor", "taluka": "Navsari", "licNo": "3187", "worker": "20", "hp": "50", "validYear": "2026"}, {"name": "JALARAM GRUH UDYOG", "address": "Shed No.C-1/B-54/3, G.I.D.C., Kabilpore, Kabilpor, Navsari, Navsari", "place": "Kabilpor", "taluka": "Navsari", "licNo": "18904", "worker": "20", "hp": "50", "validYear": "2035"}, {"name": "K. K. FOOD PROCESSORS", "address": "FIRST FLOOR, MAIN BUILDING, OLD REVENUE BLOCK NO. 116 & 117, NEW REVENUE BLOCK NO. 136 & 137, Kanbad, Navsari, Navsari, 396433", "place": "Kanbad", "taluka": "Navsari", "licNo": "52276", "worker": "50", "hp": "500", "validYear": "2028"}, {"name": "NIU FBA FACTORY", "address": "1556,OPP.G.I.D.C,KABILPORE,N.H.NO.8,NAVSARI., Kabilpor, Navsari, Navsari", "place": "Kabilpor", "taluka": "Navsari", "licNo": "5313", "worker": "20", "hp": "250", "validYear": "2031"}, {"name": "VERITAS HEALTH SCIENCE PVT. LTD.", "address": "SR NO- 519/1 TO 7, MANKADA FALIYA, VILLAGE - AMBHETA, Ambheta, Gandevi, Navsari, 396409", "place": "Ambheta", "taluka": "Gandevi", "licNo": "39222", "worker": "250", "hp": "500", "validYear": "2029"}, {"name": "B AND B INDUSTRIES", "address": "SR. NO - 104 / 1 / 1 / 11 , B/H TROPICAL , AT - NEAR G I D C ANTALIA , BILIMORA , Antaliya (CT), Gandevi, Navsari, 396325", "place": "Antaliya (CT)", "taluka": "Gandevi", "licNo": "40367", "worker": "20", "hp": "100", "validYear": "2029"}, {"name": "GAUTAM METAL TRADERS", "address": "PLOT NO 123,124, GIDC, KABILPORE,NAVSARI, Kabilpor, Navsari, Navsari, 396424", "place": "Kabilpor", "taluka": "Navsari", "licNo": "34830", "worker": "20", "hp": "100", "validYear": "2027"}, {"name": "PII SCIENTIFIC", "address": "SR. NO - 332 , NEAR ROYAL POLYPLAST , NEAR DESAI COLD STORAGE, AT - VILLAGE AMADPORE, Amadpor, Navsari, Navsari, 396445", "place": "Amadpor", "taluka": "Navsari", "licNo": "51186", "worker": "20", "hp": "50", "validYear": "2028"}, {"name": "JAI JALARAM CORPORATION", "address": "CITY SURVEY No. NA679/004 JYOTI FARM ROAD. VILLAGE:- VALOTI. TAL.:- GANDEVI. DIST.:- NAVSARI., Valoti, Gandevi, Navsari, 396380", "place": "Valoti", "taluka": "Gandevi", "licNo": "55450", "worker": "20", "hp": "100", "validYear": "2028"}, {"name": "SHASVAT TOOLS & SUPERABRASIVES PVT.LTD.", "address": "PLOTNO.35,OPP.BANK OF BARODA, G.I.D.C.KABILPORE, Kabilpor, Navsari, Navsari", "place": "Kabilpor", "taluka": "Navsari", "licNo": "12363", "worker": "50", "hp": "50", "validYear": "2028"}, {"name": "BHAVYA TUBES PVT.LTD.", "address": "J-67/2, G.I.D.C. Bilimora., Bilimora, Gandevi, Navsari", "place": "Bilimora", "taluka": "Gandevi", "licNo": "18476", "worker": "50", "hp": "100", "validYear": "2019"}, {"name": "TIDAN FORGING PVT.LTD.", "address": "Plot No. 253, G.I.D.C. Antalia, Bilimora, Gidc antlia, Gandevi, Navsari", "place": "Gidc antlia", "taluka": "Gandevi", "licNo": "18535", "worker": "20", "hp": "250", "validYear": "2024"}, {"name": "ASHOK PRESTRESS", "address": "AT. & POST MINDHABARI VASADA DHARAMPUR ROAD TA.VASADA DIST NAVSARI, Mindhabari, Vasnda, Navsari", "place": "Mindhabari", "taluka": "Vasnda", "licNo": "3239", "worker": "50", "hp": "50", "validYear": "2026"}, {"name": "LARSEN AND TOUBRO LIMITED.", "address": "MAHSR-C4 PROJECT, SECTION-2. NEW BLOCK / SURVEY No. 181/1, 194/1, 194/2/1, 195/1, 196, 198, 200, 212, 213, 214, 215, 216, 217. NAVAGAM ROAD, VILLAGE : KACHHOL PO. KHADSUPA, NAVSARI - 396433 GUJARAT., Kachhol, Navsari, Navsari, 396433", "place": "Kachhol", "taluka": "Navsari", "licNo": "59732", "worker": "500", "hp": "2000", "validYear": "2026"}, {"name": "SENDSTONE POTS PVT. LTD.", "address": "SR. NO - 588 , SAHKARI MANDLI , SADLAV ROAD , AT - VILLAGE NAVA TALAV, Sadlav, Navsari, Navsari, 396433", "place": "Sadlav", "taluka": "Navsari", "licNo": "53368", "worker": "50", "hp": "50", "validYear": "2027"}, {"name": "SHREE GAYATRI FOOD AND BEVERAGES", "address": "BLOCK/SR. NO. :41/1/7 & 41/1/8, NEAR KRISHNA WAY BRIDGE, BARDOLI ROAD, Tarsadi, Navsari, Navsari, 396418", "place": "Tarsadi", "taluka": "Navsari", "licNo": "57044", "worker": "20", "hp": "50", "validYear": "2028"}, {"name": "ROPI INDUSTRIES.", "address": "BARDOLI ROAD, KABILPORE., Kabilpor, Navsari, Navsari", "place": "Kabilpor", "taluka": "Navsari", "licNo": "3174", "worker": "20", "hp": "50", "validYear": "2021"}, {"name": "SHREE SURYA PACKAGING", "address": "PLOT NO.215,G.I.D.C,KABILPORE, Kabilpor, Navsari, Navsari", "place": "Kabilpor", "taluka": "Navsari", "licNo": "3434", "worker": "20", "hp": "250", "validYear": "2030"}, {"name": "MUKUL JAMSONS LLP", "address": "SHED NO.C1/233 & PLOT NO.232,GIDC KABILPORE,NAVSARI, Kabilpor, Navsari, Navsari", "place": "Kabilpor", "taluka": "Navsari", "licNo": "3504", "worker": "50", "hp": "100", "validYear": "2033"}, {"name": "NOBLE OFFSET", "address": "PLOT NO.C-1B/207, G.I.D.C., ANTALIA., Gidc antlia, Gandevi, Navsari", "place": "Gidc antlia", "taluka": "Gandevi", "licNo": "7498", "worker": "50", "hp": "50", "validYear": "2032"}, {"name": "DEVDEEP ENTERPRISE", "address": "PLOT NO.: 75/76, G.I.D.C., ANTALIA., Gidc antlia, Gandevi, Navsari", "place": "Gidc antlia", "taluka": "Gandevi", "licNo": "7499", "worker": "20", "hp": "100", "validYear": "2027"}, {"name": "KABIR PACKAGING", "address": "C1B-2 & C1B-3 /143, GIDC ANTALIA, BILIMORA, Gidc antlia, Gandevi, Navsari", "place": "Gidc antlia", "taluka": "Gandevi", "licNo": "10363", "worker": "20", "hp": "250", "validYear": "2028"}, {"name": "VIDHIK PRINTS PRIVATE LIMITED", "address": "Plot No. 24/B, G.I.D.C., Antalia, Bilimora, Gidc antlia, Gandevi, Navsari", "place": "Gidc antlia", "taluka": "Gandevi", "licNo": "21073", "worker": "100", "hp": "250", "validYear": "2027"}, {"name": "BHAGVATI FOOD PRODUCTS.", "address": "PLOT NO. 46, G.I.D.C. KABILPORE., Kabilpor, Navsari, Navsari", "place": "Kabilpor", "taluka": "Navsari", "licNo": "27142", "worker": "20", "hp": "100", "validYear": "2017"}, {"name": "PATCO FLAMEPROOF EQUIPMENTS", "address": "SHED NO - C-1-7/112 , AT - G. I. D. C. ANTALIA , BILIMORA, Antaliya (CT), Gandevi, Navsari, 396325", "place": "Antaliya (CT)", "taluka": "Gandevi", "licNo": "47973", "worker": "20", "hp": "50", "validYear": "2026"}, {"name": "TECHNO GRIP", "address": "BLOCK /SR. NO - 169 , PLOT NO - 12 ,NEAR BECON , AT - NEAR G I DC KABILPORE ,SISODRA , NAVSARI, Sisodra (ganesh), Navsari, Navsari, 396463", "place": "Sisodra (ganesh)", "taluka": "Navsari", "licNo": "44481", "worker": "20", "hp": "100", "validYear": "2030"}, {"name": "NOVA TECH ENGINEERS.", "address": "PLOT NO. 141 TO 146, G.I.D.C. KABILPORE., Kabilpor, Navsari, Navsari", "place": "Kabilpor", "taluka": "Navsari", "licNo": "2461", "worker": "50", "hp": "50", "validYear": "2024"}, {"name": "JAGJIT ENGINEERING WORKS", "address": "N. H. NO.8, DHOLAPIPLA, NAVSARI., Padgha, Navsari, Navsari", "place": "Padgha", "taluka": "Navsari", "licNo": "7463", "worker": "20", "hp": "50", "validYear": "2025"}, {"name": "ARUSHI STEEL INDUSTRIES", "address": "BLOCK NO 245,NEAR DESAI COLD STORAGE,AT.AMARI., Amri, Navsari, Navsari", "place": "Amri", "taluka": "Navsari", "licNo": "7906", "worker": "50", "hp": "500", "validYear": "2030"}, {"name": "DIPANKIT METAL WORKS", "address": "Plot No.10/R, G.I.D.C., Antalia, Bilimora, Gandevi, Navsari", "place": "Bilimora", "taluka": "Gandevi", "licNo": "18899", "worker": "20", "hp": "50", "validYear": "2024"}, {"name": "UNIVERSAL INDUSTRIES", "address": "Plot No.111, Old G.I.D.C., Kabilpore, Kabilpor, Navsari, Navsari", "place": "Kabilpor", "taluka": "Navsari", "licNo": "18900", "worker": "20", "hp": "10", "validYear": "2020"}, {"name": "JAILAXMI ENGINEERING CORPORATION", "address": "Plot No.C-30, Udhyognager, Vejalpor, Navsari, Navsari", "place": "Vejalpor", "taluka": "Navsari", "licNo": "20714", "worker": "20", "hp": "50", "validYear": "2032"}, {"name": "VIDHEE ENGG. WORKS", "address": "415, G.I.D.C., Kabilpore, Kabilpor, Navsari, Navsari", "place": "Kabilpor", "taluka": "Navsari", "licNo": "20759", "worker": "20", "hp": "100", "validYear": "2028"}, {"name": "TECHNO  CRAFT", "address": "SHED NO. 234-1 G.I.D.C.KABILPORE, Kabilpor, Navsari, Navsari", "place": "Kabilpor", "taluka": "Navsari", "licNo": "11170", "worker": "20", "hp": "50", "validYear": "2013"}, {"name": "WAAREE ENERGIES LIMITED", "address": "New Survey No. 1934, Plot No. 3, 4 and 6, Degam, Chikhli, Navsari, 396530", "place": "Degam", "taluka": "Chikhli", "licNo": "55719", "worker": "2000", "hp": "9999", "validYear": "2029"}, {"name": "DISTI CHEMI METAL WORKS", "address": "GANDEVI ROAD POST DEVSAR, BILIMORA., Deshad, Gandevi, Navsari", "place": "Deshad", "taluka": "Gandevi", "licNo": "1060", "worker": "50", "hp": "100", "validYear": "2019"}, {"name": "EM TECH FABRICATORS.", "address": "165,166.OLD, GIDC. KABILPORE.NAVSARI., Kabilpor, Navsari, Navsari", "place": "Kabilpor", "taluka": "Navsari", "licNo": "3251", "worker": "50", "hp": "50", "validYear": "2029"}, {"name": "NAINESH ENGINEERNG WORKS", "address": "PLOT NO.C1/27,G.I.D.C,KABILPORE, Kabilpor, Navsari, Navsari", "place": "Kabilpor", "taluka": "Navsari", "licNo": "3497", "worker": "20", "hp": "50", "validYear": "2009"}, {"name": "STEEL FABRICATORS.", "address": "MAHADEV NAGAR,COLLEGE ROAD,BILIMORA., Bilimora, Gandevi, Navsari", "place": "Bilimora", "taluka": "Gandevi", "licNo": "4172", "worker": "50", "hp": "100", "validYear": "2024"}, {"name": "PARESH ENGINEERING CORPORATION. UNIT NO, -1", "address": "89, GIDC. ANTALIA.VIA. BILIMORA, Gidc antlia, Gandevi, Navsari", "place": "Gidc antlia", "taluka": "Gandevi", "licNo": "4285", "worker": "50", "hp": "100", "validYear": "2033"}, {"name": "PARESH ENGINEERING CORPORATION.UNIT. NO. -2", "address": "88, GIDC. ANTALIA. VIA. BILLIMORA., Gidc antlia, Gandevi, Navsari", "place": "Gidc antlia", "taluka": "Gandevi", "licNo": "4286", "worker": "20", "hp": "50", "validYear": "2033"}, {"name": "ANIL (air) POLLUTION CONTROLLERS.", "address": "RATAN WADI BARDOLI ROAD., Kabilpor, Navsari, Navsari", "place": "Kabilpor", "taluka": "Navsari", "licNo": "4801", "worker": "50", "hp": "100", "validYear": "2021"}, {"name": "N. S. MACHINE SHOP & ENGINEERING SERVICES", "address": "PLOT NO. 238, PHASE-3, G.I.D.C., ANTALIA., Gidc antlia, Gandevi, Navsari", "place": "Gidc antlia", "taluka": "Gandevi", "licNo": "8856", "worker": "20", "hp": "50", "validYear": "2018"}, {"name": "VKTECH PRECISION ENGINEERING LLP", "address": "PLOT NO. 408, G.I.D.C. KABILPORE., Kabilpor, Navsari, Navsari", "place": "Kabilpor", "taluka": "Navsari", "licNo": "14159", "worker": "20", "hp": "50", "validYear": "2034"}, {"name": "MULTI PLAST INDUSTRIES", "address": "Plot No.C1B/9/137, G.I.D.C., Bilimora, Antalia, Bilimora, Gandevi, Navsari", "place": "Bilimora", "taluka": "Gandevi", "licNo": "18851", "worker": "20", "hp": "50", "validYear": "2027"}, {"name": "J.B.INDUSTRIES", "address": "N.H.NO.8, AT. BHULA FALIA, PO.KHADSUPA, Khadsupa, Navsari, Navsari", "place": "Khadsupa", "taluka": "Navsari", "licNo": "35910", "worker": "50", "hp": "250", "validYear": "2027"}, {"name": "AVIS METAL INDUSTRIES LTD.", "address": "SURVEY NO: 658, OPP: GANESH VAD, NAVSARI - MAHUVA ROAD, DIST - NAVSARI. PIN - 396360, Sisodra (ganesh), Navsari, Navsari, 396463", "place": "Sisodra (ganesh)", "taluka": "Navsari", "licNo": "34833", "worker": "100", "hp": "500", "validYear": "2029"}, {"name": "MY CHOICE HOME APPLIANCES", "address": "SHED NO C1B- 29/3, G.I.D.C. ANTALIA, Antaliya (CT), Gandevi, Navsari, 396321", "place": "Antaliya (CT)", "taluka": "Gandevi", "licNo": "48897", "worker": "50", "hp": "250", "validYear": "2026"}, {"name": "SHIV ENGINEERING WORKS", "address": "BLOCK NO /SR NO 318/P, CHIKHLI-VANSDA ROAD, AT- VILLAGE KHUNDH, Khundh, Chikhli, Navsari, 396521", "place": "Khundh", "taluka": "Chikhli", "licNo": "53948", "worker": "20", "hp": "50", "validYear": "2031"}, {"name": "HUTCH INDUSTRIES PRIVATE LIMITED", "address": "BLOCK NO. 204 & 205/003, AT.: VILL.: ARAK, Arak, Jalalpore, Navsari, 396445", "place": "Arak", "taluka": "Jalalpore", "licNo": "53950", "worker": "100", "hp": "2000", "validYear": "2030"}, {"name": "NILKANTH ENGINEERS", "address": "CITY SR. NO. : NA137/002, Chokhad, Jalalpore, Navsari, 396436", "place": "Chokhad", "taluka": "Jalalpore", "licNo": "54882", "worker": "20", "hp": "100", "validYear": "2028"}, {"name": "J D ENGINEERS", "address": "PLOT NO.: 19, AT G.I.D.C. : NAVSARI, Kabilpor, Navsari, Navsari, 396424", "place": "Kabilpor", "taluka": "Navsari", "licNo": "54883", "worker": "20", "hp": "100", "validYear": "2028"}, {"name": "FIBCOM INNOVATIONS LLP", "address": "BLOCK NO- 1657/P2, VANSDA ROAD, VILLGE- ALIPORE, Alipor, Chikhli, Navsari, 396409", "place": "Alipor", "taluka": "Chikhli", "licNo": "59687", "worker": "50", "hp": "250", "validYear": "2027"}, {"name": "VARDAN INDUSTRIES INDIA PVT. LTD.", "address": "Survey No.: NA660/002, Kharel, Pipaldhara, Gandevi, Navsari, 396430", "place": "Pipaldhara", "taluka": "Gandevi", "licNo": "55874", "worker": "50", "hp": "250", "validYear": "2033"}, {"name": "PRERAK ENTERPRISE", "address": "Plot No. C 1 / 17, At G.I.D.C. Antalia, Tal. Gandevi Dist. Navsari, Antaliya (CT), Gandevi, Navsari, 396321", "place": "Antaliya (CT)", "taluka": "Gandevi", "licNo": "35376", "worker": "20", "hp": "50", "validYear": "2030"}, {"name": "OILGEAR INDIA PRIVATE LIMITED.", "address": "Block No. / Sr. No. 37 Paiki 1/ Paiki 1, N.H.No. 48, Vill - Majigam. Tal. - Chikhli Dist. - Navsari, Majigam, Chikhli, Navsari, 396521", "place": "Majigam", "taluka": "Chikhli", "licNo": "45045", "worker": "20", "hp": "50", "validYear": "2030"}, {"name": "SANKET MILK AGENCY & DAIRY FARM", "address": "J-301, OLD G.I.D.C, NEAR G.I.D.C COLONY,KABILPORE,NAVSARI, Kabilpor, Navsari, Navsari", "place": "Kabilpor", "taluka": "Navsari", "licNo": "5729", "worker": "20", "hp": "100", "validYear": "2026"}, {"name": "MAYURA FURNITURE LLP", "address": "BLOCK / SR. NO - 1174 , MAJIVED , AT - VILLAGE ALIPOR, Alipor, Chikhli, Navsari, 396521", "place": "Alipor", "taluka": "Chikhli", "licNo": "45322", "worker": "50", "hp": "50", "validYear": "2025"}, {"name": "SUPER ENGINEERING WORKS.", "address": "BEHIND PATEL BATTERY VANSDA ROAD, AT POST. CHIKHLI., Chikhli, Chikhli, Navsari", "place": "Chikhli", "taluka": "Chikhli", "licNo": "975", "worker": "20", "hp": "50", "validYear": "2025"}, {"name": "BIPICO INDUSTRIES (TOOLS) PRIVATE LIMITED", "address": "P.B.NO.36, BILLIMORA. AT. NADARKHA., Nandarkha, Gandevi, Navsari", "place": "Nandarkha", "taluka": "Gandevi", "licNo": "3154", "worker": "250", "hp": "1000", "validYear": "2026"}, {"name": "HILTI MANUFACTURING INDIA PVT. LTD. UNIT-3", "address": "PLOT NO.52/2,54/1&2,53/1&2,G.I.D.C,KABILPORE,NAVSARI, Kabilpor, Navsari, Navsari", "place": "Kabilpor", "taluka": "Navsari", "licNo": "3678", "worker": "250", "hp": "1000", "validYear": "2025"}, {"name": "HILTI MANUFACTURING INDIA PVT. LTD. UNIT-1", "address": "PLOT NO.244 TO 251,48&49,G.I.D.C,KABILPORE,NAVSARI, Kabilpor, Navsari, Navsari", "place": "Kabilpor", "taluka": "Navsari", "licNo": "3681", "worker": "500", "hp": "2000", "validYear": "2026"}, {"name": "HILTI MANUFACTURING INDIAPVT. LTD.  ( UNIT IV)", "address": "PLOT NO. 423, G.I.D.C. INDUSTRIAL ESTATE, AT.PO. KABILPORE, Kabilpor, Navsari, Navsari", "place": "Kabilpor", "taluka": "Navsari", "licNo": "6798", "worker": "100", "hp": "250", "validYear": "2023"}, {"name": "PEASS INDUSTRIAL ENGINEERS PVT.LTD", "address": "A1/7,G.I.D.C,NAVSARI KABILPORE,TA & DIST - NAVSARI, Navsari, Navsari, Navsari, 396445", "place": "Navsari", "taluka": "Navsari", "licNo": "39709", "worker": "50", "hp": "250", "validYear": "2026"}, {"name": "RENU BHUMI ENGINEERING INDUSTRIES", "address": "PLOT NO- 105/A, GIDC ANTALIA, Antaliya (CT), Gandevi, Navsari, 396325", "place": "Antaliya (CT)", "taluka": "Gandevi", "licNo": "41644", "worker": "50", "hp": "250", "validYear": "2026"}, {"name": "PEASS INDUSTRIAL ENGINEERS PRIVATE LIMITED", "address": "SHED NO A1/06,GIDC PHASE 1,KABILPORE,DIST NAVSARI, Navsari, Navsari, Navsari, 396424", "place": "Navsari", "taluka": "Navsari", "licNo": "42531", "worker": "50", "hp": "100", "validYear": "2027"}, {"name": "N.M. PATEL AND CO.", "address": "SR NO- 370, CHIMODIA NAKA, TALODH, Bilimora (Talodh), Gandevi, Navsari, 396321", "place": "Bilimora (Talodh)", "taluka": "Gandevi", "licNo": "42532", "worker": "20", "hp": "50", "validYear": "2034"}, {"name": "PEASS INDUSTRIAL ENGINEERS PVT.LTD.", "address": "PLOT NO. 138,139,140, AT GIDC, NAVSARI, KABILPORE, TA & DIST. NAVSARI., Kabilpor, Navsari, Navsari, 396424", "place": "Kabilpor", "taluka": "Navsari", "licNo": "45782", "worker": "50", "hp": "250", "validYear": "2028"}, {"name": "PANAMA ENGINEERING COMPANY.", "address": "SR. NO.362,368,606.NEAR RAILWAY CROSSING AT. TALODH. VIA. BILIMORA, Torangam, Gandevi, Navsari", "place": "Torangam", "taluka": "Gandevi", "licNo": "3315", "worker": "20", "hp": "250", "validYear": "2028"}, {"name": "DEVGURU CAPLINERS.", "address": "L-180/2,GIDC,ANTALIA. VIA. BILLIMORA., Gidc antlia, Gandevi, Navsari", "place": "Gidc antlia", "taluka": "Gandevi", "licNo": "3327", "worker": "20", "hp": "50", "validYear": "2028"}, {"name": "J. R. WORKS", "address": "PLOT NO. K-1/17,G.I.D.C,ANTALIA,BILIMORA., Gidc antlia, Gandevi, Navsari", "place": "Gidc antlia", "taluka": "Gandevi", "licNo": "3936", "worker": "20", "hp": "50", "validYear": "2011"}, {"name": "NANUBHAI MAVJIBHAI PATEL", "address": "NEAR RAILWAY CROSSING, CHIMODIA NAKA P.B.NO.46, BILIMORA, Bilimora, Gandevi, Navsari", "place": "Bilimora", "taluka": "Gandevi", "licNo": "4792", "worker": "50", "hp": "250", "validYear": "2027"}, {"name": "NMP EQUIPMENT CORPORATION.", "address": "NEAR RAILWAY CROSSING, CHIMODIA NAKA, BILIMORA., Bilimora, Gandevi, Navsari", "place": "Bilimora", "taluka": "Gandevi", "licNo": "9605", "worker": "20", "hp": "50", "validYear": "2027"}, {"name": "NARAN LALA PVT. LTD.", "address": "NEAR RAILWAY STATION, NAVSARI., Navsari, Navsari, Navsari", "place": "Navsari", "taluka": "Navsari", "licNo": "11994", "worker": "250", "hp": "1000", "validYear": "2026"}, {"name": "KNITS N KNOTS INDUSTRIES PVT. LTD.", "address": "PLOT NO.:4, 5, 6 & 7, BLOCK NO.:454, FAIRDEAL INDUSTRIAL PARK, Vesma, Jalalpore, Navsari, 396475", "place": "Vesma", "taluka": "Jalalpore", "licNo": "53952", "worker": "100", "hp": "500", "validYear": "2030"}, {"name": "AKSHAYKALA INDUSTRIES PRIVATE LIMITED", "address": "PLOT No. 27/A (AS PER SITE), SUB PLOT No.1 RAJHANS ZESTO - PHASE 4 VILLAGE :- KALAKACHHA, TAL.- JALALPORE, DIST.- NAVSARI., Vesma, Jalalpore, Navsari, 396475", "place": "Vesma", "taluka": "Jalalpore", "licNo": "58887", "worker": "20", "hp": "500", "validYear": "2031"}, {"name": "HYDROMATIC CORPORATION", "address": "PLOT NO - 132 , SHED NO - C-1/25 , AT - G I D C ANTALIA , BILIMORA, Antaliya (CT), Gandevi, Navsari, 396325", "place": "Antaliya (CT)", "taluka": "Gandevi", "licNo": "50533", "worker": "20", "hp": "50", "validYear": "2026"}, {"name": "HYDROTRONICS INDUSTRIES", "address": "PLOT NO - 81 AND 82 , AT - G I D C ANTALIA , BILIMORA, Antaliya (CT), Gandevi, Navsari, 396325", "place": "Antaliya (CT)", "taluka": "Gandevi", "licNo": "50540", "worker": "20", "hp": "50", "validYear": "2026"}, {"name": "RAJKAMAL METAL INDUSTRIES", "address": "9/627,MANEKLAL ROAD,NEAR RIDDHI-SIDDHI APARTMENT, Navsari, Navsari, Navsari", "place": "Navsari", "taluka": "Navsari", "licNo": "3572", "worker": "20", "hp": "50", "validYear": "2027"}, {"name": "SURYA SPINDLE", "address": "H.NO.1109/3,OPP.MEGDOOT COLONY,SARDAR MARKET ROAD,DEVSAR,BILIMORA., Bilimora, Gandevi, Navsari", "place": "Bilimora", "taluka": "Gandevi", "licNo": "4181", "worker": "20", "hp": "50", "validYear": "2026"}, {"name": "PRADIP POLIFILS PVT.LTD.", "address": "CHHAPARA ROAD,NAVSARI, Navsari, Navsari, Navsari", "place": "Navsari", "taluka": "Navsari", "licNo": "3193", "worker": "250", "hp": "2000", "validYear": "2029"}, {"name": "MAMTA IRON WORKS.", "address": "DEVSAR .VIA. BILLIMORA., Bilimora, Gandevi, Navsari", "place": "Bilimora", "taluka": "Gandevi", "licNo": "4521", "worker": "20", "hp": "50", "validYear": "2024"}, {"name": "PRAKASH INDUSTRIES", "address": "183,G.I.D.C,KABILPORE,NAVSARI, Kabilpor, Navsari, Navsari", "place": "Kabilpor", "taluka": "Navsari", "licNo": "5715", "worker": "20", "hp": "50", "validYear": "2029"}, {"name": "N I F MECHANICAL WORKS PVT. LTD.", "address": "BLOCK NO. 338/A, B/H PLOT NO. 419, G.I.D.C. KABILPORE, GANESH SISODRA, Sisodra (ganesh), Navsari, Navsari", "place": "Sisodra (ganesh)", "taluka": "Navsari", "licNo": "21412", "worker": "250", "hp": "500", "validYear": "2029"}, {"name": "ROTECH", "address": "PLOT NO.266-267, GIDC, ANTALIA, Bilimora, Gandevi, Navsari", "place": "Bilimora", "taluka": "Gandevi", "licNo": "41235", "worker": "100", "hp": "50", "validYear": "2030"}, {"name": "PRADIP POLYFILS PVT. LTD. (UNIT-2)", "address": "Survey No.: 289, Behind Kabilpore G.I.D.C., Sisodra (ganesh), Navsari, Navsari, 396463", "place": "Sisodra (ganesh)", "taluka": "Navsari", "licNo": "54558", "worker": "100", "hp": "2000", "validYear": "2026"}, {"name": "TAHOE FOODS AND BEVERAGES PVT. LTD", "address": "PLOT NO. 105, BACK SIDE PART, NAVSARI INDUSTRIAL ESTATE, Kabilpor, Navsari, Navsari, 396424", "place": "Kabilpor", "taluka": "Navsari", "licNo": "49939", "worker": "20", "hp": "100", "validYear": "2024"}, {"name": "EXORA BEVERAGES PVT. LTD.", "address": "PLOT NO-38,39,40,41,42,43,50,51,52,53 AND 54, B/SR. NO - 220 , EPIC INDUSTRIAL ESTATE, MAROLI - VESHMA ROAD , AT - VILLAGE CHOKHAD, Chokhad, Jalalpore, Navsari, 396415", "place": "Chokhad", "taluka": "Jalalpore", "licNo": "53668", "worker": "20", "hp": "500", "validYear": "2027"}, {"name": "VISHVPRABHA FOODS PRIVATE LIMITED", "address": "B/SR. NO : 501 AND 192 , OFF. DHARAMPUR ROAD , AT & POST : VILLAGE TORANVERA, Toranvera, Khergam, Navsari, 396040", "place": "Toranvera", "taluka": "Khergam", "licNo": "55449", "worker": "50", "hp": "500", "validYear": "2028"}, {"name": "JAINAM INDUSTRIES", "address": "BLOCK NO. 132, PANCHAYAT HOUSE NO. 325, 1, 2 & 3, SHED NO. A -1 TO A -6, DANDESHWAR PATIYA, VILL.- BHATAI, Bhattai, Navsari, Navsari", "place": "Bhattai", "taluka": "Navsari", "licNo": "30339", "worker": "50", "hp": "500", "validYear": "2023"}, {"name": "BHUKHANVALA INDUSTRIES PVT. LTD.", "address": "PLOT NO.: 401/B, G.I.D.C.: NAVSARI KABILPORE, Navsari, Navsari, Navsari, 396424", "place": "Navsari", "taluka": "Navsari", "licNo": "58040", "worker": "50", "hp": "500", "validYear": "2029"}, {"name": "LAND MARK CLAYS & MINARALS.", "address": "SR. NO.61 AT. VALOTI. P.O.DEVSAR. GANDEVI ROAD.VIA:BILLIMORA., Valoti, Gandevi, Navsari", "place": "Valoti", "taluka": "Gandevi", "licNo": "3389", "worker": "20", "hp": "50", "validYear": "2027"}, {"name": "HIFIN SAWS AND TOOLS PVT.LTD", "address": "BLOCK/SURVEY NO.334/PAIKEE PLOT NO 7,VILLAGE - GANESH SISODRA NEAR G.I.D.C COLONY,NAVSARI, Sisodra (ganesh), Navsari, Navsari, 396463", "place": "Sisodra (ganesh)", "taluka": "Navsari", "licNo": "37401", "worker": "20", "hp": "250", "validYear": "2026"}, {"name": "HI TECH PAPERS", "address": "Block No.: 453, Plot No.: 9, 10, 11, 33, 34, 35, Fairdeal Industrial Park-2, Vesma, Jalalpore, Navsari, 396415", "place": "Vesma", "taluka": "Jalalpore", "licNo": "58871", "worker": "50", "hp": "1000", "validYear": "2034"}, {"name": "JAI PETROLEUM", "address": "DANDI ROAD, VIJALPORE, Vejalpor, Navsari, Navsari", "place": "Vejalpor", "taluka": "Navsari", "licNo": "29787", "worker": "20", "hp": "100", "validYear": "2035"}, {"name": "BEACON DIAGNOSTICS PVT.LTD", "address": "424,NEW G.I.D.C, P.O.KABILPORE,NAVSARI, Kabilpor, Navsari, Navsari", "place": "Kabilpor", "taluka": "Navsari", "licNo": "3293", "worker": "250", "hp": "250", "validYear": "2033"}, {"name": "MERIDIAN ENTERPRISES. PVT.LTD.", "address": "Plot No.418, G.I.D.C, KABILPORE, Kabilpor, Navsari, Navsari", "place": "Kabilpor", "taluka": "Navsari", "licNo": "3473", "worker": "250", "hp": "500", "validYear": "2026"}, {"name": "DINESH PLASTIC PRODUCTS.", "address": "PO.BOX.NO. 69,CHHAPARA ROAD,NAVSARI, Navsari, Navsari, Navsari", "place": "Navsari", "taluka": "Navsari", "licNo": "3146", "worker": "50", "hp": "250", "validYear": "2010"}, {"name": "ANAND AGRO TECH.", "address": "GANDEVI ROAD ,AT-DEVSAR. BILLIMORA., Devdha, Gandevi, Navsari", "place": "Devdha", "taluka": "Gandevi", "licNo": "3179", "worker": "20", "hp": "50", "validYear": "2021"}, {"name": "MANISH PACKAGING PVT.LTD.", "address": "BLOCK NO.689, 690 & 691,MAROLI UMBHRAT ROAD,VILL,MAROLI., Maroli, Jalalpore, Navsari", "place": "Maroli", "taluka": "Jalalpore", "licNo": "4357", "worker": "500", "hp": "1000", "validYear": "2030"}, {"name": "ADITYA TIMPACK PRIVATE LIMITED", "address": "NEW SR NO.801,985,987 & 988, AT VALOTI, TA-GANDEVI, DIST-NAVSARI, Bilimora, Gandevi, Navsari", "place": "Bilimora", "taluka": "Gandevi", "licNo": "21821", "worker": "500", "hp": "2000", "validYear": "2030"}, {"name": "AAREHA ELASTIN FIBC PVT LTD.", "address": "Block No-2363,Aru-Abrama Road, Abrama, Jalalpore, Navsari, 396450", "place": "Abrama", "taluka": "Jalalpore", "licNo": "40876", "worker": "500", "hp": "2000", "validYear": "2030"}, {"name": "OM PLAST", "address": "B/SR. NO : 465, KHAREL - GANDEVI ROAD , AT - VILLAGE KHAPARIYA, Khapariya, Gandevi, Navsari, 396430", "place": "Khapariya", "taluka": "Gandevi", "licNo": "54559", "worker": "20", "hp": "500", "validYear": "2028"}, {"name": "AUTOGRAPH INDUSTRIES", "address": "SR. NO - 10 / P1 & 10 / P2 , AT - DEVSAR ,BILIMORA - GANDEVI ROAD , Dhakwada, Gandevi, Navsari, 396380", "place": "Dhakwada", "taluka": "Gandevi", "licNo": "34594", "worker": "100", "hp": "100", "validYear": "2025"}, {"name": "OMEGA COATS & PLASTS", "address": "J/23, G.I.D.C., ANTALIA, BILIMORA., Gidc antlia, Gandevi, Navsari", "place": "Gidc antlia", "taluka": "Gandevi", "licNo": "8778", "worker": "20", "hp": "100", "validYear": "2024"}, {"name": "DINESH PLASTIC PRODUCTS", "address": "Block No.338 Paikee \"B\" Type, Behind Kabilpore G.I.D.C., Ganesh Sisodara, Navsari, Navsari, Navsari", "place": "Navsari", "taluka": "Navsari", "licNo": "21082", "worker": "100", "hp": "250", "validYear": "2028"}, {"name": "TANSIDDHI ENTERPRISES", "address": "SR.NO. 131/PAIKI-7 & 131/PAIKI-8, CHIKHLI BILLIMORA ROAD, VILLAGE ANTALIA, Bilimora, Gandevi, Navsari, 396325", "place": "Bilimora", "taluka": "Gandevi", "licNo": "30335", "worker": "20", "hp": "250", "validYear": "2021"}, {"name": "LEENA ENTERPRISES", "address": "HOUSE NO 2429,SR.NO. 131/PAIKI-7 & 131/PAIKI-8 CHIKHLI BILLIMORA ROAD VILLAGE ANTALIA, Bilimora, Gandevi, Navsari, 396325", "place": "Bilimora", "taluka": "Gandevi", "licNo": "30956", "worker": "20", "hp": "250", "validYear": "2021"}, {"name": "ANIL PRODUCTS", "address": "PLOT NO .479/2&480/1,NEW G.I.D.C, KABILPORE,NAVSARI -396424, Kabilpor, Navsari, Navsari, 396424", "place": "Kabilpor", "taluka": "Navsari", "licNo": "38736", "worker": "20", "hp": "100", "validYear": "2028"}, {"name": "C-TEL INFRA PRIVATE LIMITED", "address": "BLOCK / SURVEY No.315 & 316. VILLAGE : ANTALIA, TALUKA:- GANDEVI. DIST:- NAVSARI., Antaliya (CT), Gandevi, Navsari, 396325", "place": "Antaliya (CT)", "taluka": "Gandevi", "licNo": "56255", "worker": "20", "hp": "250", "validYear": "2026"}, {"name": "QREY PRIMIR LLP", "address": "CITY SURVEY NO: NA-91, NR. SUPA - PERA CROSS WAY, NAVSARI - BARDOLI ROAD, VILLAGE: PERA, Pera, Navsari, Navsari, 396418", "place": "Pera", "taluka": "Navsari", "licNo": "58249", "worker": "50", "hp": "2000", "validYear": "2029"}, {"name": "FLEXPRO ELECTRICALS PVT.LTD", "address": "PLOT NO 37 & C-1/22, G.I.D.C. KABILPORE, NAVSARI., Kabilpor, Navsari, Navsari", "place": "Kabilpor", "taluka": "Navsari", "licNo": "18809", "worker": "100", "hp": "100", "validYear": "2030"}, {"name": "FLEXPRO ELECTRICALS PVT LTD", "address": "Plot No. C-1 / 47/1 & 47 / 3, G.I.D.C. Kabilpore, Navsari, Navsari, Navsari, 396445", "place": "Navsari", "taluka": "Navsari", "licNo": "39708", "worker": "50", "hp": "250", "validYear": "2030"}, {"name": "PARAS. AGRO. PLAST. PVT. LTD.", "address": "BLOCK.NO. 1657. VASNDA ROAD. AT. ALIPORE., Alipor, Chikhli, Navsari", "place": "Alipor", "taluka": "Chikhli", "licNo": "3458", "worker": "100", "hp": "250", "validYear": "2028"}, {"name": "SHIVANAND FROZEN FOOD PRODUCTS", "address": "GROUND FLOOR, PART - B, MAIN BUILDING, OLD REVENUE BLOCK NO. 116 & 117, NEW REVENUE BLOCK NO. 136 & 137, Kanbad, Navsari, Navsari, 396433", "place": "Kanbad", "taluka": "Navsari", "licNo": "52275", "worker": "20", "hp": "50", "validYear": "2028"}, {"name": "JAL ENTERPRISE", "address": "SR. NO - 1603 / P1 & 1603 / P5 , POOJA INDUSTRIES COMPOUND , BEHIND HONEST IRON ,VANSDA ROAD, AT - VILLAGE ALIPOR , CHIKHLI, Alipor, Chikhli, Navsari, 396521", "place": "Alipor", "taluka": "Chikhli", "licNo": "45320", "worker": "50", "hp": "250", "validYear": "2028"}, {"name": "SHARAD MICRO DIE & ENGG. WORKS.", "address": "NISHAL EALIA DATEJ., Dantej, Navsari, Navsari", "place": "Dantej", "taluka": "Navsari", "licNo": "3367", "worker": "50", "hp": "100", "validYear": "2009"}, {"name": "SHARAD MICRO DIE AND ENGINEERING WORKS", "address": "PLOT NO:T-12,AT UDYOGNAGAR, VIJALPORE, DIST:NAVSARI, Vejalpor, Navsari, Navsari, 396445", "place": "Vejalpor", "taluka": "Navsari", "licNo": "49252", "worker": "50", "hp": "50", "validYear": "2026"}, {"name": "ADITYA INTERNATIONAL PACKAGING", "address": "NEW SURVEY NO- 987 & 988, AT- VALOTI, Valoti, Gandevi, Navsari, 396380", "place": "Valoti", "taluka": "Gandevi", "licNo": "51183", "worker": "250", "hp": "250", "validYear": "2028"}, {"name": "TREXO FAB INDUSTRIES", "address": "RE- SURVEY / BLOCK NO.:110, SISODARA ROAD, Arak, Jalalpore, Navsari, 396475", "place": "Arak", "taluka": "Jalalpore", "licNo": "58716", "worker": "50", "hp": "100", "validYear": "2029"}, {"name": "AANSHI WEAVES PVT. LTD.", "address": "R. SURVEY NO.: 33, NEW BLOCK NO.: 43, OLD BLOCK NO.: 32, SUB PLOT NO.: 4 & 5, NEAR FAIR DEAL INDUSTRIAL PARK, PALSANA - NAVSARI ROAD, AT. VILLAGE: RANODRA, Ranodra, Jalalpore, Navsari, 396475", "place": "Ranodra", "taluka": "Jalalpore", "licNo": "59337", "worker": "50", "hp": "1000", "validYear": "2029"}, {"name": "PEASS INDUSTRIAL ENGINEERS PVT. LTD.", "address": "MANEKLAL ROAD .NAVSARI, Navsari, Navsari, Navsari", "place": "Navsari", "taluka": "Navsari", "licNo": "3144", "worker": "100", "hp": "250", "validYear": "2023"}, {"name": "MUKESH ENTERPRISE", "address": "PLOT NO : C-33 , OPP. B-TEX , AT : UDHYOG NAGAR , VIJALPORE, Vijalpor, Jalalpore, Navsari, 396475", "place": "Vijalpor", "taluka": "Jalalpore", "licNo": "44486", "worker": "20", "hp": "100", "validYear": "2027"}, {"name": "EAGLE BOSS", "address": "NEW SURVEY NO: 268, OLD SURVEY NO: 246, SHREE LAXMI INDUSTRIES, VIBHAG-2, AMRI ROAD, Amri, Navsari, Navsari, 396427", "place": "Amri", "taluka": "Navsari", "licNo": "58238", "worker": "50", "hp": "1000", "validYear": "2029"}, {"name": "SUPER PAINTS & OIL INDUSTRIES", "address": "C1-B-12,G.I.D.C,ANTALIA,BILIMORA, Gidc antlia, Gandevi, Navsari", "place": "Gidc antlia", "taluka": "Gandevi", "licNo": "3460", "worker": "20", "hp": "50", "validYear": "2031"}, {"name": "SUNLIGHT PAINTS PVT. LTD", "address": "C1/11, G.I.D.C., ANTALIA, Bilimora, Gandevi, Navsari", "place": "Bilimora", "taluka": "Gandevi", "licNo": "19629", "worker": "20", "hp": "50", "validYear": "2031"}, {"name": "KRiSHNA DANA CHANA", "address": "SR.BLOCK-82,H.NO - 2699,GANESH SISODRA, NAVSARI,396463, Sisodra (ganesh), Navsari, Navsari, 396463", "place": "Sisodra (ganesh)", "taluka": "Navsari", "licNo": "37153", "worker": "20", "hp": "50", "validYear": "2028"}, {"name": "SUNDARAM PAPER PRODUCTS PVT.LTD.", "address": "BLOCK NO.569/P2, N.H.NO. O8, VILLAGE-PADGHA DHOLAPIPLA, Padgha, Navsari, Navsari", "place": "Padgha", "taluka": "Navsari", "licNo": "12503", "worker": "20", "hp": "100", "validYear": "2030"}, {"name": "ECOLATES INDIA PVT. LTD.", "address": "SR. NO. : 631, Khadsupa, Navsari, Navsari, 396445", "place": "Khadsupa", "taluka": "Navsari", "licNo": "53951", "worker": "50", "hp": "1000", "validYear": "2027"}, {"name": "UNIQUE PACKAGING", "address": "SHED NO C1/19 & PLOT NO.98 G.I.D.C, ANTALIA, Gidc antlia, Gandevi, Navsari", "place": "Gidc antlia", "taluka": "Gandevi", "licNo": "23580", "worker": "50", "hp": "50", "validYear": "2034"}, {"name": "UNITED CRAFT INDUSTRIES", "address": "BLOCK NO 1219,UNDACH BALVADA ROAD, VANIYA FALIYA,VILLAGE UNDACH, Undach vaniya faliya, Gandevi, Navsari", "place": "Undach vaniya faliya", "taluka": "Gandevi", "licNo": "24163", "worker": "50", "hp": "100", "validYear": "2029"}, {"name": "NATRAJ iNDUSTRiES", "address": "BLOCK NO - 130/1,SR.NO -189/P1,181/P-1,N.H.NO -8,KABILPORE,NAVSARI, Navsari, Navsari, Navsari, 396424", "place": "Navsari", "taluka": "Navsari", "licNo": "37154", "worker": "20", "hp": "50", "validYear": "2033"}, {"name": "UNIQUE ENTERPRISES", "address": "PLOT NO 116, G.I.D.C. ANTALIA, BILIMORA, Antaliya (CT), Gandevi, Navsari, 396325", "place": "Antaliya (CT)", "taluka": "Gandevi", "licNo": "43141", "worker": "20", "hp": "50", "validYear": "2024"}, {"name": "J.P.BISCUIT BAKERY", "address": "NAVSARI BARDOLI ROAD,NEAR G.ID.C,NAVSARI, Kabilpor, Navsari, Navsari", "place": "Kabilpor", "taluka": "Navsari", "licNo": "3386", "worker": "50", "hp": "50", "validYear": "2031"}, {"name": "K. K. BISCUIT BAKERY", "address": "G.I.D.C.PLOT NO.154-155,KABILPORE., Kabilpor, Navsari, Navsari", "place": "Kabilpor", "taluka": "Navsari", "licNo": "3930", "worker": "50", "hp": "50", "validYear": "2022"}, {"name": "NEW J. P. BISCUIT BAKERY", "address": "NEAR PARMESH DAIMOND FACTORY,CHHAPRA ROAD., Navsari, Navsari, Navsari", "place": "Navsari", "taluka": "Navsari", "licNo": "3934", "worker": "50", "hp": "50", "validYear": "2034"}, {"name": "R. K. BISCUIT BAKERY", "address": "C-1, 47/2, G.I.D.C,KABILPORE., Kabilpor, Navsari, Navsari", "place": "Kabilpor", "taluka": "Navsari", "licNo": "4182", "worker": "20", "hp": "50", "validYear": "2029"}, {"name": "JMK FOOD PRODUCTS", "address": "SHED NO - A2/1, AT : G. I. D. C. ANTALIA , BILIMORA, Antaliya (CT), Gandevi, Navsari, 396325", "place": "Antaliya (CT)", "taluka": "Gandevi", "licNo": "49257", "worker": "20", "hp": "50", "validYear": "2023"}, {"name": "AA AROMAS", "address": "R. S. No.: 165, Chokhad, Chokhad, Jalalpore, Navsari, 396415", "place": "Chokhad", "taluka": "Jalalpore", "licNo": "59487", "worker": "50", "hp": "1000", "validYear": "2029"}, {"name": "TRIMURTI ENTERPRISE", "address": "PLOT NO.251, III PHASE, G.I.D.C., ANTALIA, BILIMORA, Bilimora, Gandevi, Navsari", "place": "Bilimora", "taluka": "Gandevi", "licNo": "18368", "worker": "20", "hp": "10", "validYear": "2020"}, {"name": "LAMIOR PVT. LTD.", "address": "PLOT NO.:24 as per approved plan ( Plot No.:50 as per site), RAJHANS ZESTO - PHASE 4, Kalakachha, Jalalpore, Navsari, 396475", "place": "Kalakachha", "taluka": "Jalalpore", "licNo": "55872", "worker": "100", "hp": "250", "validYear": "2029"}, {"name": "SHREE SAINATH PHOTOCHEM.", "address": "SURVEY NO:454P. N.H.NO:8, AT.ALIPORE., Alipor, Chikhli, Navsari", "place": "Alipor", "taluka": "Chikhli", "licNo": "3369", "worker": "20", "hp": "50", "validYear": "2029"}, {"name": "EURASIA AGRO FOODS PRIVATE LIMITED", "address": "HOUSE NO .665,AT KARADIYA FARM,KALTHAN ROAD,VILLAGE : HASHAPOR,TA - JALAPORE,DIST -NAVSARI -396472, Kalthan, Jalalpore, Navsari, 396472", "place": "Kalthan", "taluka": "Jalalpore", "licNo": "41405", "worker": "50", "hp": "50", "validYear": "2029"}, {"name": "SHREE AMBICA PLAST", "address": "Ward No.11, H.No.524-0, Near Swaminarayan Temple, Eru Road, Vejalpor, Navsari, Navsari", "place": "Vejalpor", "taluka": "Navsari", "licNo": "20710", "worker": "20", "hp": "50", "validYear": "2022"}, {"name": "NX PACK PVT. LTD.", "address": "Shed No.A2/2, Plot No.58, G.I.D.C. Ind., Gidc antlia, Gandevi, Navsari", "place": "Gidc antlia", "taluka": "Gandevi", "licNo": "21718", "worker": "100", "hp": "1000", "validYear": "2027"}, {"name": "SPLENZO POLYFAB PRIVATE LIMITED", "address": "PLOT NO -487,NEW G.I.D.C,NAVSARI,BARDOLI ROAD,KABILPORE, TA & DIST - NAVSARI -396424, Kabilpor, Navsari, Navsari, 396424", "place": "Kabilpor", "taluka": "Navsari", "licNo": "38733", "worker": "100", "hp": "1000", "validYear": "2030"}, {"name": "SOM INDUSTRIES", "address": "Survey No.: 234, Bardoli - Navsari Road, Vill.: Tarsadi; Dist.: Navsari, Tarsadi, Navsari, Navsari, 396418", "place": "Tarsadi", "taluka": "Navsari", "licNo": "46751", "worker": "100", "hp": "1000", "validYear": "2030"}, {"name": "JAY KHODIYAR POLY PRINT", "address": "PLOT NO - 19 , SR. NO - 334 , AT - SISODRA ( GANESH ) NAVSARI, Sisodra (ganesh), Navsari, Navsari, 396424", "place": "Sisodra (ganesh)", "taluka": "Navsari", "licNo": "48649", "worker": "20", "hp": "250", "validYear": "2026"}, {"name": "CRYSTON POLYFLEX PVT. LTD.", "address": "PLOT NO. : 441, N.H. 48, UNN-MUNSAD ROAD, Un, Navsari, Navsari, 396433", "place": "Un", "taluka": "Navsari", "licNo": "49683", "worker": "50", "hp": "1000", "validYear": "2027"}, {"name": "G I POLYTECH", "address": "SHED NO- C1B/206, GIDC ANTALIA- BILIMORA, Antaliya (CT), Gandevi, Navsari, 396325", "place": "Antaliya (CT)", "taluka": "Gandevi", "licNo": "51178", "worker": "20", "hp": "100", "validYear": "2030"}, {"name": "KHAN POLYPACK", "address": "SHED NO- C1-174, G.I.D.C. ANTALIA, BILIMORA, Antaliya (CT), Gandevi, Navsari, 396325", "place": "Antaliya (CT)", "taluka": "Gandevi", "licNo": "51657", "worker": "20", "hp": "100", "validYear": "2024"}, {"name": "SHRI SOMNATH POLYTECH PRIVATE LIMITED", "address": "SR. NO - 1148 ( OLD SR. NO - 104/P1/P1/6) BEHIND TROPICAL , G. I. D. C. ANTALIA, AT - VILLAGE ANTALIA - BILIMORA, Antaliya (CT), Gandevi, Navsari, 396325", "place": "Antaliya (CT)", "taluka": "Gandevi", "licNo": "56481", "worker": "50", "hp": "250", "validYear": "2026"}, {"name": "ASPEE AGRO EQUIPMENT PVT.LTD.", "address": "OFF CHIKHLI ROAD, OPP. GRAM PANCHAYAT OFFICE, VILL: ANTALIA, BILLIMORA . TAL. GANDEVI DIST. NAVSARI, Gidc antlia, Gandevi, Navsari", "place": "Gidc antlia", "taluka": "Gandevi", "licNo": "3557", "worker": "50", "hp": "500", "validYear": "2026"}, {"name": "ASIAN AGRICO INDUSTRIES", "address": "POST BOX NO.29,GANDEVI ROAD,BILIMORA., Bilimora, Gandevi, Navsari", "place": "Bilimora", "taluka": "Gandevi", "licNo": "4250", "worker": "20", "hp": "100", "validYear": "2020"}, {"name": "RAVI PLYWOOD", "address": "PLOT NO-489/A, G.I.D.C., KABILPORE NAVSARI, Navsari, Navsari, Navsari, 396424", "place": "Navsari", "taluka": "Navsari", "licNo": "34357", "worker": "20", "hp": "50", "validYear": "2018"}, {"name": "ADARSH FOOD PRODUCT", "address": "SHED NO- C1/175, GIDC ANTALIA, BILIMORA, Antaliya (CT), Gandevi, Navsari, 396325", "place": "Antaliya (CT)", "taluka": "Gandevi", "licNo": "53670", "worker": "20", "hp": "50", "validYear": "2028"}, {"name": "J.R.TILES TRADING COMPANY", "address": "NEAR BANDHARA. AT & PO. GANDEVI., Gandevi, Gandevi, Navsari", "place": "Gandevi", "taluka": "Gandevi", "licNo": "786", "worker": "20", "hp": "50", "validYear": "2030"}, {"name": "OM KAMESHWAR CEMENT ARTICLES.", "address": "CHIKHALI -VASDA ROAD,AT RETHWANIA., Rethvania, Chikhli, Navsari", "place": "Rethvania", "taluka": "Chikhli", "licNo": "3299", "worker": "20", "hp": "50", "validYear": "2019"}, {"name": "PEEDEE TILES", "address": "C/O.GANDHI FARM,VIJALPORE,VIA.NAVSARI, Vejalpor, Navsari, Navsari", "place": "Vejalpor", "taluka": "Navsari", "licNo": "3393", "worker": "20", "hp": "50", "validYear": "2008"}, {"name": "SHIV SHAKTI SPUN PIPE INDUSTRIES", "address": "AT.DHOLAPIPALA,PO.AMADPOR,N.H.NO.8, Amadpor, Navsari, Navsari", "place": "Amadpor", "taluka": "Navsari", "licNo": "3509", "worker": "20", "hp": "50", "validYear": "2028"}, {"name": "MAHAVIR CEMENT PRODUCTS.", "address": "NERU FALIA,DHARAGIRI, Dharagiri, Navsari, Navsari", "place": "Dharagiri", "taluka": "Navsari", "licNo": "3757", "worker": "20", "hp": "10", "validYear": "2010"}, {"name": "BANSHIDHAR CEMENT PRODUCTS", "address": "VANSDA ROAD,MANEKPORE,CHIKHLI., Manekpor, Chikhli, Navsari", "place": "Manekpor", "taluka": "Chikhli", "licNo": "3835", "worker": "20", "hp": "50", "validYear": "2026"}, {"name": "AMIT SPUN PIPE & CEMENT PRODUCTS", "address": "F.B.SHAH ROAD, PO.BOX NO.22, BILIMORA, Bilimora, Gandevi, Navsari", "place": "Bilimora", "taluka": "Gandevi", "licNo": "14143", "worker": "20", "hp": "50", "validYear": "2021"}, {"name": "LARSEN AND TOUBRO LIMITED", "address": "Survey No.: 608, 609, 610, 611, 612, 613, 614, 615, 616, 617, 618, 619, 621, 622, 623/1, 623/2, 624, 630, Padgha, Navsari, Navsari, 396445", "place": "Padgha", "taluka": "Navsari", "licNo": "50070", "worker": "500", "hp": "1000", "validYear": "2026"}, {"name": "LAXMINARAYAN TILES", "address": "Sr.No.460/ Paiky1, Near Kathiyawadi Hotel, Alipore, Alipor, Chikhli, Navsari", "place": "Alipor", "taluka": "Chikhli", "licNo": "20708", "worker": "20", "hp": "100", "validYear": "2023"}, {"name": "SHIVAM TILES", "address": "Sr.No.1654, Near Alipore Metal, Alipore, Alipor, Chikhli, Navsari", "place": "Alipor", "taluka": "Chikhli", "licNo": "21717", "worker": "50", "hp": "50", "validYear": "2028"}, {"name": "HI-TECH CHEM PLAST CORPORATION", "address": "BLOCK / SR. NO - 1765 , N. H. NO - 48 , AT - VILLAGE ENDHAL, Endhal, Gandevi, Navsari, 396430", "place": "Endhal", "taluka": "Gandevi", "licNo": "46187", "worker": "20", "hp": "250", "validYear": "2030"}, {"name": "MADHAV CEMENT PRODUCT", "address": "BLOCK / SR. NO - 976 / B , AT & POST - DEGAM , N. H. NO - 8 , BEHIND METRO HOTEL , TAL - CHIKHLI . DIST - NAVSARI. PIN - 396530, Degam, Chikhli, Navsari, 396530", "place": "Degam", "taluka": "Chikhli", "licNo": "34487", "worker": "20", "hp": "50", "validYear": "2028"}, {"name": "VORTEX FLEX PVT. LTD", "address": "S. NO. 320, KALVACH ROAD, Alipor, Chikhli, Navsari, 396409", "place": "Alipor", "taluka": "Chikhli", "licNo": "37152", "worker": "250", "hp": "2000", "validYear": "2028"}, {"name": "SHREE NATHIJI CEMENT PRODUCTS", "address": "Block no. / Sr.no. 148 Chikhli - Vansda Road, Village. Manekpore tal. Chikhli dist. Navsari, Manekpor, Chikhli, Navsari, 396560", "place": "Manekpor", "taluka": "Chikhli", "licNo": "34832", "worker": "20", "hp": "50", "validYear": "2026"}, {"name": "SARTHI CEMENT PRODUCTS", "address": "SR. NO - 2302 ( OLD SR. NO - 2039 ) AT - VILLAGE VANDARVELA, Vandarvela, Vansada, Navsari, 396540", "place": "Vandarvela", "taluka": "Vansada", "licNo": "49503", "worker": "20", "hp": "50", "validYear": "2031"}, {"name": "SHRI SHYAM INFRACON", "address": "SR. NO - 369 ( OLD SR. NO - 333 ) AGASI ROAD , CHIRPADA FALIYA , AT - VILLAGE RUMLA, Rumla, Chikhli, Navsari, 396060", "place": "Rumla", "taluka": "Chikhli", "licNo": "49872", "worker": "20", "hp": "50", "validYear": "2031"}, {"name": "SHREE ARADHYA BUILDCON", "address": "SURVEY NO : 234/PAIKI-3 & 235/PAIKI-3, N.H. 8, VILLAGE : AMADPOR, Amadpor, Navsari, Navsari, 396445", "place": "Amadpor", "taluka": "Navsari", "licNo": "53367", "worker": "50", "hp": "250", "validYear": "2032"}, {"name": "Y. N. DHANANI", "address": "SR. NO.: 1782-A/P5, 1782-B, 1793/1 & 1794, Alipor, Chikhli, Navsari, 396409", "place": "Alipor", "taluka": "Chikhli", "licNo": "57502", "worker": "50", "hp": "50", "validYear": "2033"}, {"name": "VVF INDUSTRIES", "address": "SR.NO.-394, VILLAGE-HOND, TA.-CHIKHLI, DIST.-NAVSARI, Hond, Chikhli, Navsari, 396521", "place": "Hond", "taluka": "Chikhli", "licNo": "57639", "worker": "20", "hp": "250", "validYear": "2028"}, {"name": "MAHAVIR CEMENT PRODUCTS", "address": "BLOCK/SURVEY NO. 164. CHIKHLI - VANSDA ROAD. VILLAGE.- RETHVANIYA. TAL.- CHIKHLI.DIST.- NAVSARI., Rethvaniya, Chikhli, Navsari, 396560", "place": "Rethvaniya", "taluka": "Chikhli", "licNo": "57886", "worker": "20", "hp": "50", "validYear": "2029"}, {"name": "MAHAVIR CEMENT PIPE FACTORY.", "address": "CITY SURVEY No. NA162. VILLAGE-RETHVANIYA. TAL.- CHIKHLI. DIST.- NAVSARI., Rethvaniya, Chikhli, Navsari, 396560", "place": "Rethvaniya", "taluka": "Chikhli", "licNo": "57887", "worker": "20", "hp": "250", "validYear": "2029"}, {"name": "RIDDHHI PAINTS", "address": "PLOT NO. C1B-10, G.I.D.C KABILPORE, Navsari, Navsari, Navsari", "place": "Navsari", "taluka": "Navsari", "licNo": "12875", "worker": "20", "hp": "50", "validYear": "2020"}, {"name": "SUNRISE TEXTILE BEARINGS", "address": "H.NO.1109,OPP.MEGDOOT COLONY,SARDAR MARKET ROAD,DEVSAR,BILIMORA., Bilimora, Gandevi, Navsari", "place": "Bilimora", "taluka": "Gandevi", "licNo": "5298", "worker": "20", "hp": "50", "validYear": "2026"}, {"name": "S.A.INDUSTRIES", "address": "PLOT NO. 242, PHASE-III, G.I.D.C., ANTALIA, BILIMORA., Gidc antlia, Gandevi, Navsari", "place": "Gidc antlia", "taluka": "Gandevi", "licNo": "8700", "worker": "20", "hp": "50", "validYear": "2030"}, {"name": "R.K.METALS", "address": "Plot No.458,Phase-II,New G.I.D.C. Kabilpr., Kabilpor, Navsari, Navsari", "place": "Kabilpor", "taluka": "Navsari", "licNo": "17709", "worker": "20", "hp": "50", "validYear": "2025"}, {"name": "HI-SHINE INKS PVT.LTD.", "address": "PLOT NO-C1/- 202,203,204,205, & 208, G.I.D.C., ANTALIA, BILIMORA, Gandevi, Gandevi, Navsari", "place": "Gandevi", "taluka": "Gandevi", "licNo": "1069", "worker": "100", "hp": "500", "validYear": "2027"}, {"name": "R K DETERGENT", "address": "SR. NO. 320, NAVSARI- BARDOLI ROAD, Nasilpor, Navsari, Navsari, 396427", "place": "Nasilpor", "taluka": "Navsari", "licNo": "55775", "worker": "20", "hp": "100", "validYear": "2028"}, {"name": "INKIA INKS PVT. LTD.", "address": "Third Floor, Block No.: 619, 628, 631, 633, 643, 651, 669, 672, 679, 682, 690, Plot No.: 44, Rajhans Zesto Phase-4, Vill.: Kalakachha, Kalakachha, Jalalpore, Navsari, 396415", "place": "Kalakachha", "taluka": "Jalalpore", "licNo": "59490", "worker": "50", "hp": "2000", "validYear": "2026"}, {"name": "HI-SHINE INKS PVT. LTD.", "address": "PLOT NO - 31/R, G.I.D.C. ANTALIA, BILIMORA, Antaliya (CT), Gandevi, Navsari, 396325", "place": "Antaliya (CT)", "taluka": "Gandevi", "licNo": "40875", "worker": "20", "hp": "250", "validYear": "2028"}, {"name": "KWENG MAGNADYNE PRIVATE LIMITED", "address": "SHED NO.J-9/66.G.I.D.C ANTALIA, Gidc antlia, Gandevi, Navsari", "place": "Gidc antlia", "taluka": "Gandevi", "licNo": "3184", "worker": "100", "hp": "100", "validYear": "2029"}, {"name": "G & P ENGINEERING COMPANY", "address": "CHIKHALI -VASADA ROAD.NEAR BAMANVEL AT CHIKHALI., Chikhli, Chikhli, Navsari", "place": "Chikhli", "taluka": "Chikhli", "licNo": "3264", "worker": "50", "hp": "50", "validYear": "2035"}, {"name": "A. R. K. ENGINEERING ENTERPRISE", "address": "PLOT. NO. 136 GIDC. ANTALIA, Gidc antlia, Gandevi, Navsari", "place": "Gidc antlia", "taluka": "Gandevi", "licNo": "3320", "worker": "20", "hp": "50", "validYear": "2023"}, {"name": "PROTO PUMPS & MOTORS PVT.LTD.", "address": "BLOCK NO.1656,VANSDA ROAD,ALIPORE, Alipor, Chikhli, Navsari", "place": "Alipor", "taluka": "Chikhli", "licNo": "3463", "worker": "20", "hp": "50", "validYear": "2022"}, {"name": "LAXMIPRASAD PUMPS PVT.LTD.", "address": "BILIMORA-CHIKHLI ROAD,MAJIGAM,CHIKHLI., Majigam, Chikhli, Navsari", "place": "Majigam", "taluka": "Chikhli", "licNo": "4651", "worker": "20", "hp": "100", "validYear": "2021"}, {"name": "PRAKASH PUMPS", "address": "C-1,201, G.I.D.C,ANTALIA,BILIMORA,NAVSARI, Gidc antlia, Gandevi, Navsari", "place": "Gidc antlia", "taluka": "Gandevi", "licNo": "5906", "worker": "50", "hp": "50", "validYear": "2026"}, {"name": "MNF VALVES PVT. LTD.", "address": "PLOT NO 467/PT1 N. H. NO. 8 VILLAGE. BALWADA., Balwada, Chikhli, Navsari", "place": "Balwada", "taluka": "Chikhli", "licNo": "7536", "worker": "20", "hp": "50", "validYear": "2019"}, {"name": "KK PUMPS INDUSTRIES", "address": "K K PUMPS INDUSTRIES P.B 80 , K-1/20 , ANTALIA , BILIMORA , NAVSARI., Gidc antlia, Gandevi, Navsari", "place": "Gidc antlia", "taluka": "Gandevi", "licNo": "11229", "worker": "20", "hp": "50", "validYear": "2029"}, {"name": "SHREE RAM METAL INDUSTRIES", "address": "Word No.5, House No.1143/1, Mehta Chal, Behind Udhyognagar, vijalpore Road, Vejalpor, Navsari, Navsari", "place": "Vejalpor", "taluka": "Navsari", "licNo": "20704", "worker": "20", "hp": "100", "validYear": "2016"}, {"name": "OHM ENTERPRISE.", "address": "NEAR BHARWADIA POOL,IIA. BILLIMORA,AT&POST.VALOTI., Valoti, Gandevi, Navsari", "place": "Valoti", "taluka": "Gandevi", "licNo": "3305", "worker": "20", "hp": "100", "validYear": "2030"}, {"name": "PCM STRESCON OVERSEAS VENTURES LIMITED.", "address": "Survey No.166/1,167/1,169/1,170/1,171/1,172/1, Near Ancheli Railway Station, Village : Amalsad, Taluka : Gandevi, Dist.:Navsari-396310., Amalsad, Gandevi, Navsari, 396310", "place": "Amalsad", "taluka": "Gandevi", "licNo": "35919", "worker": "250", "hp": "250", "validYear": "2022"}, {"name": "QREGO FABTECH LLP", "address": "BLOCK NO: 217, MAIN SATEM ROAD, N.H. NO: 08, Ashtagam, Navsari, Navsari, 396433", "place": "Ashtagam", "taluka": "Navsari", "licNo": "40167", "worker": "100", "hp": "1000", "validYear": "2030"}, {"name": "RIKI RAINWEAR", "address": "PLOT NO - 37/R , AT - G. I. D. C. ANTALIA , BILIMORA, Antaliya (CT), Gandevi, Navsari, 396325", "place": "Antaliya (CT)", "taluka": "Gandevi", "licNo": "50852", "worker": "20", "hp": "10", "validYear": "2027"}, {"name": "GADAT V.V.KARYAKARI SAHAKARI KHEDUT MANDAL LTD.", "address": "AT. GADAT., Gadat, Gandevi, Navsari", "place": "Gadat", "taluka": "Gandevi", "licNo": "3250", "worker": "100", "hp": "100", "validYear": "2026"}, {"name": "AMALSAD VIBHAG VIVIDH KARYAKARRI SAHAKARI KHEDUT MANDALI LTD.", "address": "POST .AMALSAD.(W.RAILWAY), Amalsad, Gandevi, Navsari", "place": "Amalsad", "taluka": "Gandevi", "licNo": "3317", "worker": "50", "hp": "10", "validYear": "2027"}, {"name": "SAGAR AGRO INDUSTRIES", "address": "PLOT NO.467/468,NEW G.I.D.C,KABILPORE, Kabilpor, Navsari, Navsari", "place": "Kabilpor", "taluka": "Navsari", "licNo": "3582", "worker": "20", "hp": "100", "validYear": "2030"}, {"name": "SHREE NARAYAN TIMBER TRADING CO", "address": "VANSDA ROAD,AT.KHUNDH,CHIKHLI, Khundh, Chikhli, Navsari", "place": "Khundh", "taluka": "Chikhli", "licNo": "3583", "worker": "20", "hp": "10", "validYear": "2026"}, {"name": "SOMA ENTERPRISE LTD.", "address": "DFCC PROJECT, Nr. Vasundhara Dairy, Chikhli., Chikhli, Chikhli, Navsari", "place": "Chikhli", "taluka": "Chikhli", "licNo": "17438", "worker": "250", "hp": "250", "validYear": "2021"}, {"name": "ARED CHEKKERS", "address": "SR.NO.1885/P, VANSADA ROAD, ALIPORE, Alipor, Chikhli, Navsari", "place": "Alipor", "taluka": "Chikhli", "licNo": "27141", "worker": "20", "hp": "50", "validYear": "2027"}, {"name": "BHUKHANVALA .CERAMICS. PVT.LTD", "address": "PLOT NO,L/226-231,G.I.D.C,INDASTRIAL ESTATE,PHASE-I, KABILPORE,NAVSARI, Kabilpor, Navsari, Navsari", "place": "Kabilpor", "taluka": "Navsari", "licNo": "3291", "worker": "50", "hp": "500", "validYear": "2012"}, {"name": "M/S ROSHAN ENGINEERING (UNIT - II)", "address": "A2-6 GIDC, BILIMORA ANTALIA, TA - GANDEVI, DIST - NAVSARI, Bilimora, Gandevi, Navsari, 396325", "place": "Bilimora", "taluka": "Gandevi", "licNo": "35815", "worker": "100", "hp": "100", "validYear": "2028"}, {"name": "HARSH POLYMER", "address": "SR. NO.: 41/2/9, 41/2/10 & 41/2/11,PLOT NO.: 9, 10-B & 11-C, Tarsadi, Navsari, Navsari, 396418", "place": "Tarsadi", "taluka": "Navsari", "licNo": "51185", "worker": "20", "hp": "250", "validYear": "2030"}, {"name": "SHIV PLASTIC PRODUCTS", "address": "PLOT NO 451 NEW GIDC,KABILPORE,NAVSARI, Kabilpor, Navsari, Navsari, 396424", "place": "Kabilpor", "taluka": "Navsari", "licNo": "31505", "worker": "20", "hp": "50", "validYear": "2025"}, {"name": "RAMDEV CHEMICAL WORK", "address": "BHAGWATI SANKUL SOCIETY, NEAR SWAMINARAYAN TEMPLE, GREED,NAVSARI, Navsari, Navsari, Navsari", "place": "Navsari", "taluka": "Navsari", "licNo": "12871", "worker": "20", "hp": "50", "validYear": "2029"}, {"name": "SHREE AMAR JYOT TIMBER MART", "address": "Plot No. 477, New G.I.D.C. Kabilpore, Kabilpor, Navsari, Navsari", "place": "Kabilpor", "taluka": "Navsari", "licNo": "18534", "worker": "20", "hp": "50", "validYear": "2020"}, {"name": "OMEGA LABORATORIES", "address": "SHED NO - C1B-29/2, G.I.D.C. ANTALIA, Antaliya (CT), Gandevi, Navsari, 396325", "place": "Antaliya (CT)", "taluka": "Gandevi", "licNo": "41133", "worker": "20", "hp": "100", "validYear": "2027"}, {"name": "GURUKRUPA INDUSTRIES", "address": "BLOCK/SR. NO. : 122/P8/P1,(PLOT NO.: C-4), AT VILLAGE : SISHODRA(GANESH), Sisodra (ganesh), Navsari, Navsari, 396424", "place": "Sisodra (ganesh)", "taluka": "Navsari", "licNo": "59762", "worker": "20", "hp": "50", "validYear": "2029"}, {"name": "RASHIK SOAP FACTORY", "address": "OPP PEPER MILL,CHIKHLI ROAD,ANTALIA, Gidc antlia, Gandevi, Navsari", "place": "Gidc antlia", "taluka": "Gandevi", "licNo": "3421", "worker": "20", "hp": "100", "validYear": "2030"}, {"name": "RATAN SOAP FACTORY", "address": "BARDOLI ROAD.NEAR G.I.D.C.KABILPORE., Kabilpor, Navsari, Navsari", "place": "Kabilpor", "taluka": "Navsari", "licNo": "4778", "worker": "20", "hp": "250", "validYear": "2028"}, {"name": "DHANLAXMI SHOP FACTORY", "address": "NEAR YASH LABORATORY AT. KHUNDH, Khundh, Chikhli, Navsari", "place": "Khundh", "taluka": "Chikhli", "licNo": "15027", "worker": "20", "hp": "50", "validYear": "2030"}, {"name": "RASHIK DETERGENT GRUH UDYOG.", "address": "Sr./Block No. 558.,Kalvach Road, Vill. : Alipore. Tal.- Chikhli. Dist. Navsari, Alipor, Chikhli, Navsari, 396609", "place": "Alipor", "taluka": "Chikhli", "licNo": "36834", "worker": "20", "hp": "250", "validYear": "2030"}, {"name": "GOLDI SUN PRIVATE LIMITED", "address": "CITY SURVEY NO. 920/3, VIJALPORE ROAD, NAVSARI, Navsari, Navsari, Navsari, 396445", "place": "Navsari", "taluka": "Navsari", "licNo": "46191", "worker": "2000", "hp": "9999", "validYear": "2028"}, {"name": "BECQ RENEWABLES PVT.LTD.", "address": "PLOT NO.: 38 & 39, G.I.D.C.: NAVSARI, KABILPORE, Navsari, Navsari, Navsari, 396445", "place": "Navsari", "taluka": "Navsari", "licNo": "59110", "worker": "50", "hp": "250", "validYear": "2029"}, {"name": "REENA ENTERPRISES", "address": "473/1 & 2.G.I.D.C. KABILPORE.NAVSARI., Kabilpor, Navsari, Navsari", "place": "Kabilpor", "taluka": "Navsari", "licNo": "3181", "worker": "20", "hp": "100", "validYear": "2030"}, {"name": "PRATIK ENGINEERING CO.", "address": "PLOT NO.2 R/B,G.I.D.C.ANTALIA,BILIMORA,DIST.NAVSARI, Gidc antlia, Gandevi, Navsari", "place": "Gidc antlia", "taluka": "Gandevi", "licNo": "3196", "worker": "20", "hp": "50", "validYear": "2009"}, {"name": "SAI SAGAR FABRICATORS", "address": "310,G.I.D.C,INDASTRIAL ESTATE,KABILPORE., Kabilpor, Navsari, Navsari", "place": "Kabilpor", "taluka": "Navsari", "licNo": "3862", "worker": "20", "hp": "50", "validYear": "2020"}, {"name": "THIESE PRECISION PRIVATE LIMITED", "address": "OPP. GIDC. N. H. NO. 8. P.O. KABILPORE., Kabilpor, Navsari, Navsari", "place": "Kabilpor", "taluka": "Navsari", "licNo": "4381", "worker": "500", "hp": "5000", "validYear": "2033"}, {"name": "TRANSTEC OVERSEAS PVT.LTD", "address": "Sr.No.37/1,Behind  D & H.Engineering, Mazigam., Majigam, Chikhli, Navsari", "place": "Majigam", "taluka": "Chikhli", "licNo": "17696", "worker": "100", "hp": "50", "validYear": "2026"}, {"name": "DNM ENGITECH PVT.LTD.", "address": "Plot No.56, G.I.D.C.Kabilpore, Kabilpor, Navsari, Navsari", "place": "Kabilpor", "taluka": "Navsari", "licNo": "18745", "worker": "50", "hp": "100", "validYear": "2023"}, {"name": "SHRI SHIVAM AGROVET CORPORATION", "address": "448/1 GIDC BARDOLI ROAD KABILPORE NAVSARI GUJRAT 396424, Navsari, Navsari, Navsari, 396424", "place": "Navsari", "taluka": "Navsari", "licNo": "39702", "worker": "20", "hp": "250", "validYear": "2028"}, {"name": "NILKANTH SINK LLP", "address": "Block No.- 1594 , Vansda Road, B/H Kisan Quarry, Next To Indane Gas Godown Vill. Alipore, Alipor, Chikhli, Navsari, 396409", "place": "Alipor", "taluka": "Chikhli", "licNo": "39221", "worker": "20", "hp": "250", "validYear": "2028"}, {"name": "C.R.K.ENGINEERING WORKS", "address": "OPP.WIRELESS STATION,MAJIGAM, Majigam, Chikhli, Navsari", "place": "Majigam", "taluka": "Chikhli", "licNo": "3590", "worker": "20", "hp": "100", "validYear": "2028"}, {"name": "SHIVAM TIMBER MART", "address": "BARDOLI ROAD,KABILPORE,NAVSARI., Kabilpor, Navsari, Navsari", "place": "Kabilpor", "taluka": "Navsari", "licNo": "3928", "worker": "20", "hp": "50", "validYear": "2026"}, {"name": "NAVBHARAT INDUSTRIES", "address": "SOMNATH ROAD, BILIMORA., Bilimora, Gandevi, Navsari", "place": "Bilimora", "taluka": "Gandevi", "licNo": "4227", "worker": "20", "hp": "50", "validYear": "2024"}, {"name": "MISTRY SHUTTLE MFG.COMPANY PVT.LTD.", "address": "JALBHAIWADI,MAHADEV NAGAR,BILIMORA., Bilimora, Gandevi, Navsari", "place": "Bilimora", "taluka": "Gandevi", "licNo": "5310", "worker": "20", "hp": "50", "validYear": "2016"}, {"name": "Biogeny Diagnostics Pvt Ltd", "address": "PLOT NO 1& 2 SURVEY NO 169 (SISODRA, NEAR PLOT NO.425, NEW GIDC, KABILPORE, VILLAGE - SISODARA, NAVSARI, Sisodra (ganesh), Navsari, Navsari, 396424", "place": "Sisodra (ganesh)", "taluka": "Navsari", "licNo": "38735", "worker": "50", "hp": "100", "validYear": "2033"}, {"name": "SHREEJI CLOTHING", "address": "SHED NO:A2/1. G.I.D.C. ANTALIYA, BILIMORA. TAL:- GANDEVI. DIST:- NAVSARI., Antaliya (CT), Gandevi, Navsari, 396325", "place": "Antaliya (CT)", "taluka": "Gandevi", "licNo": "53672", "worker": "20", "hp": "50", "validYear": "2026"}, {"name": "ADWYN PETER", "address": "FIRST FLOOR, PLOT NO.: D/27, SHRI NAVSARI UDHYOGNAGAR SAHAKARI SANGH LTD, Vijalpor, Jalalpore, Navsari, 396445", "place": "Vijalpor", "taluka": "Jalalpore", "licNo": "57889", "worker": "50", "hp": "100", "validYear": "2026"}, {"name": "AMBERTEX SEKHSARIA EXPORTS", "address": "UNIT-2, ( SECOND FLOOR ) MILKAT NO : 909/41 TO 909/50, SILVER ICON BUILDING - A, SHOP NO : S-41 TO S-50, CHIKHLI - VANSDA ROAD , AT : VILLAGE SURKHAI, Surkhai, Chikhli, Navsari, 396560", "place": "Surkhai", "taluka": "Chikhli", "licNo": "58683", "worker": "50", "hp": "100", "validYear": "2029"}, {"name": "Aakanksha Clothing.", "address": "Second Floor, Hall-2, R.S.No.: 1242/P2(Old), New R.S.No.: 1950, Bilimora-Chikhali Road, At.: Nandarkha, Nandarkha, Gandevi, Navsari, 396325", "place": "Nandarkha", "taluka": "Gandevi", "licNo": "59230", "worker": "50", "hp": "50", "validYear": "2027"}, {"name": "UNITRIBES LIFESTYLE P. LTD.", "address": "CITY SURVEY NO. NA470/43, PLOT NO. 43, BLOCK NO. 470, FAIRDEAL INDUSTRIAL PARK, VILLAGE: VESMA, Vesma, Jalalpore, Navsari, 396415", "place": "Vesma", "taluka": "Jalalpore", "licNo": "59303", "worker": "50", "hp": "100", "validYear": "2029"}, {"name": "HLE GLASCOAT LIMITED. UNIT-1", "address": "A-6, MAROLIUDYOGNAGAR, POST:MAROLI BAZAR, DIST:NAVSARI., Maroli, Jalalpore, Navsari", "place": "Maroli", "taluka": "Jalalpore", "licNo": "3201", "worker": "250", "hp": "500", "validYear": "2030"}, {"name": "HLE GLASCOAT LIMITED. UNIT-2", "address": "A-6,MAROLI UDYOGNAGA,POST MAROLI BAZAR,DIST NAVSARI, Maroli, Jalalpore, Navsari", "place": "Maroli", "taluka": "Jalalpore", "licNo": "3245", "worker": "250", "hp": "100", "validYear": "2030"}, {"name": "MUKUND CHMI ENGINEERING", "address": "C-29,UDYOG NAGAR,VIJALPORE, Vejalpor, Navsari, Navsari", "place": "Vejalpor", "taluka": "Navsari", "licNo": "3440", "worker": "20", "hp": "100", "validYear": "2020"}, {"name": "TECHNOFEB ENGINEERING SERVICES", "address": "482,G.I.D.C.IND.ESTATE,KABILPORE, Navsari, Navsari, Navsari", "place": "Navsari", "taluka": "Navsari", "licNo": "3538", "worker": "100", "hp": "250", "validYear": "2027"}, {"name": "HLE GLASCOAT LIMITED (UNIT-4)", "address": "PLOT NO 4 & 5, BLOCK NO, 140/B/P, MAROLI UDHYOG NAGAR, VILAGE NADOD, Nandod, Jalalpore, Navsari", "place": "Nandod", "taluka": "Jalalpore", "licNo": "31266", "worker": "250", "hp": "250", "validYear": "2030"}, {"name": "TECHNOFAB ENGINEERING SERVICES", "address": "PLOT NO - C1 -236 & 237/1,G.I.D.C ,KABILPOR,NAVSARI - 396424, Kabilpor, Navsari, Navsari, 396424", "place": "Kabilpor", "taluka": "Navsari", "licNo": "38734", "worker": "50", "hp": "250", "validYear": "2029"}, {"name": "HARE KRISHNA PROCESSOR", "address": "B/SR. NO - 30 , NEAR BPCL PETROL PUMP ,N. H. NO - 48 , DHOLA PIPLA CROSS ROAD , AT - VILLAGE VEJALPORE, Vejalpor, Navsari, Navsari, 396475", "place": "Vejalpor", "taluka": "Navsari", "licNo": "51179", "worker": "20", "hp": "250", "validYear": "2027"}, {"name": "TIMBER TRADING CO.", "address": "SR. NO - 1742 ( OLD SR. NO - 549/P14) MISTRY IND. COMPOUND , BILIMORA - CHIKHLI ROAD , AT - VILLAGE NANDARKHA ( BILIMORA ), Nandarkha, Gandevi, Navsari, 396325", "place": "Nandarkha", "taluka": "Gandevi", "licNo": "51458", "worker": "20", "hp": "50", "validYear": "2027"}, {"name": "D. N. PATEL AND SONS", "address": "PLOT NO - 15/R AND 16/R , AT - G I D C ANTALIA , BILIMORA, Antaliya (CT), Gandevi, Navsari, 396325", "place": "Antaliya (CT)", "taluka": "Gandevi", "licNo": "53669", "worker": "20", "hp": "100", "validYear": "2027"}, {"name": "KWALITY WOOD CRAFTS", "address": "SR NO 87/P/1, NEAR ESSAR PETROL PUMP, GANDEVI-NAVSARI ROAD, AT- RAHEJ, Gandevi, Gandevi, Navsari", "place": "Gandevi", "taluka": "Gandevi", "licNo": "31218", "worker": "20", "hp": "50", "validYear": "2022"}, {"name": "UNITED PLYWOOD INDUSTRIES", "address": "BLOCK NO 273/P1/P1, OLD HARIJANWAS, VILLAGE- DHAKWADA, DHAKWADA, Dhakwada, Gandevi, Navsari", "place": "Dhakwada", "taluka": "Gandevi", "licNo": "31219", "worker": "50", "hp": "100", "validYear": "2026"}, {"name": "AAKRUTI CREATIONS", "address": "SHED NO- J-25 & J-26, GIDC ANTALIYA, BILIMORA, Antaliya (CT), Gandevi, Navsari, 396325", "place": "Antaliya (CT)", "taluka": "Gandevi", "licNo": "49251", "worker": "20", "hp": "100", "validYear": "2027"}, {"name": "RAJVEER FLEXO PLY INDUSTRIES", "address": "PLOT NO - 146 , AT - G I D C ANTALIA , BILIMORA, Antaliya (CT), Gandevi, Navsari, 396325", "place": "Antaliya (CT)", "taluka": "Gandevi", "licNo": "50534", "worker": "20", "hp": "100", "validYear": "2026"}, {"name": "ADITYA INDUSTRIES", "address": "B. SR. NO - 430/2/2 AND 430/2/3, BAMANVEL VILLAGE ROAD , AT & POST - VILLAGE KHUNDH, Khundh, Chikhli, Navsari, 396521", "place": "Khundh", "taluka": "Chikhli", "licNo": "53949", "worker": "20", "hp": "500", "validYear": "2027"}, {"name": "PARADISE INDUSTRIES", "address": "CITY SURVEY NO- NA1414/2, UNDACH, VANIYA FALIYA, Talodh, Gandevi, Navsari, 396325", "place": "Talodh", "taluka": "Gandevi", "licNo": "54151", "worker": "20", "hp": "250", "validYear": "2032"}, {"name": "ASHIRWAD GALLERY", "address": "SR. NO : 94 , (OLD SR. NO : 83/2), PLOT NO : 3 AND 4 , NAVSARI - BARDOLI ROAD , OPP. TARSADI BUS STOP , AT - VILLAGE TARSADI, Tarsadi, Navsari, Navsari, 396418", "place": "Tarsadi", "taluka": "Navsari", "licNo": "54881", "worker": "20", "hp": "100", "validYear": "2028"}, {"name": "VEERSON INDUSTRIES", "address": "SR. NO - 7 ( OLD SR. NO - 154 ), KALVACH ROAD , AT : VILLAGE KALVACH POST - ALIPORE, Kalvach, Gandevi, Navsari, 396409", "place": "Kalvach", "taluka": "Gandevi", "licNo": "58503", "worker": "20", "hp": "250", "validYear": "2029"}, {"name": "SAHAKARI KHAND UDYOG MANDAL LIMITED", "address": "AT & POST GANDEVI, TAL.GANDEVI., Gandevi, Gandevi, Navsari", "place": "Gandevi", "taluka": "Gandevi", "licNo": "3887", "worker": "2000", "hp": "9999", "validYear": "2030"}, {"name": "SHREE MAROLI VIBHG KHAND UDYOG SAHKARI MANDLI LTD", "address": "AT.KOLASANA. POST. MAROLI BAZAR., Kolasana, Jalalpore, Navsari", "place": "Kolasana", "taluka": "Jalalpore", "licNo": "3351", "worker": "1000", "hp": "5000", "validYear": "2018"}, {"name": "VARDHMAN SILK MILLS", "address": "PLOT NO.9 & 1, GIDC, KABILPORE, Kabilpor, Navsari, Navsari", "place": "Kabilpor", "taluka": "Navsari", "licNo": "7496", "worker": "100", "hp": "500", "validYear": "2024"}, {"name": "MOON FIBERS", "address": "PLOT NO.102 TO 111, SPARKLS INDUSTRIAL ESTATE, MAROLI-VESMA ROAD, Maroli, Jalalpore, Navsari", "place": "Maroli", "taluka": "Jalalpore", "licNo": "30803", "worker": "50", "hp": "250", "validYear": "2031"}, {"name": "AVTAR DYEING AND PRINTING", "address": "PLOT NO 175/2 NEAR GRID NH NO 8 KABILPORE,NAVSARI, Navsari, Navsari, Navsari, 396424", "place": "Navsari", "taluka": "Navsari", "licNo": "43648", "worker": "50", "hp": "500", "validYear": "2024"}, {"name": "SHREE KRISHNA SILK", "address": "SR. NO - 93 ( OLD SR. NO - 36 ) MAROLI - DABHEL ROAD , MAROLI CHAR RASHTA , AT - VILLAGE CHOKHAD, Chokhad, Jalalpore, Navsari, 396421", "place": "Chokhad", "taluka": "Jalalpore", "licNo": "52274", "worker": "20", "hp": "500", "validYear": "2027"}, {"name": "AAKASH YARN INDUSTRIES PVT. LTD.", "address": "BLOCK NO: 425 TO 427 & 434 TO 438, SUB PLOT NO: 02, (PLOT NO: 12 AS PER SITE) RAJHANS ZESTO INDUSTRIAL PARK, PHASE-3, Vesma, Jalalpore, Navsari, 39641", "place": "Vesma", "taluka": "Jalalpore", "licNo": "52570", "worker": "500", "hp": "1000", "validYear": "2030"}, {"name": "DORA INDUSTRIES PVT. LTD.", "address": "BLOCK NO: 425 TO 427 & 434 TO 438, SUB PLOT NO: 01, (PLOT NO: 11 AS PER SITE) RAJHANS ZESTO INDUSTRIAL PARK, PHASE-3, Vesma, Jalalpore, Navsari, 39641", "place": "Vesma", "taluka": "Jalalpore", "licNo": "52622", "worker": "500", "hp": "2000", "validYear": "2030"}, {"name": "SHIVAM ART", "address": "BLOCK NO: 169, PLOT NO: 9, Sisodra (ganesh), Navsari, Navsari, 396445", "place": "Sisodra (ganesh)", "taluka": "Navsari", "licNo": "57504", "worker": "20", "hp": "100", "validYear": "2025"}, {"name": "SHREEJI CREATION", "address": "SURVEY NO.: 0 VADA 28/4 PAIKEE 1,PLOT NO.: 12, SURVEY NO.: 0 VADA 28/4 PAIKEE 1 PAIKEE 10, PLOT NO.: 11, NEAR HANUMANJI MANDIR, AT. VILLAGE: JALALPORE, Jalalpore, Jalalpore, Navsari, 396421", "place": "Jalalpore", "taluka": "Jalalpore", "licNo": "57511", "worker": "50", "hp": "100", "validYear": "2029"}, {"name": "SHREE KARNI FABCOM LTD.", "address": "SUB PLOT NO.: 01 As per approved layout plan (PLOT NO.: 08 AS PER SITE), CITY SURVEY NO.: NA501, RAJHANS ZESTO - PHASE 2, Kalakachha, Jalalpore, Navsari, 396415", "place": "Kalakachha", "taluka": "Jalalpore", "licNo": "59604", "worker": "500", "hp": "1000", "validYear": "2029"}, {"name": "J K TRADING CORPORATION", "address": "55 G.I.D.C., KABILPORE,NAVSARI, NAVSARI, Kabilpor, Navsari, Navsari", "place": "Kabilpor", "taluka": "Navsari", "licNo": "31513", "worker": "20", "hp": "100", "validYear": "2029"}, {"name": "PARMES DIAMONDS EXPORTS PVT. LTD.", "address": "PARMES ROAD, AT.PO.CHHAPRA, NAVSARI., Chhapra, Navsari, Navsari", "place": "Chhapra", "taluka": "Navsari", "licNo": "3177", "worker": "5000", "hp": "5000", "validYear": "2022"}, {"name": "MODERN ROAD MAKERS PVT.LTD..", "address": "S.No.427,428,437 & 438, Village- Alipore., Alipor, Chikhli, Navsari", "place": "Alipor", "taluka": "Chikhli", "licNo": "15153", "worker": "20", "hp": "50", "validYear": "2022"}, {"name": "MODERN ROAD MAKERS PVT. LTD.", "address": "SURVEY NO.: 185, VILLAGE: KANBAD, Kanbad, Navsari, Navsari, 396433", "place": "Kanbad", "taluka": "Navsari", "licNo": "52258", "worker": "100", "hp": "5000", "validYear": "2026"}, {"name": "SHREEJI FOOD PRODUCTS", "address": "BARDOLI ROAD,KABILPORE, Kabilpor, Navsari, Navsari", "place": "Kabilpor", "taluka": "Navsari", "licNo": "3502", "worker": "50", "hp": "250", "validYear": "2029"}, {"name": "SHRI GANESH AGRO INDUSTRIES", "address": "BARDOLI ROAD,KABILPORE, Kabilpor, Navsari, Navsari", "place": "Kabilpor", "taluka": "Navsari", "licNo": "3530", "worker": "50", "hp": "250", "validYear": "2028"}, {"name": "H.M.GRAINS & PULSES PROCESSING PVT.LTD.", "address": "BLOK NO. 669,N.H.NO.-08, AT. & PO.-THALA, Thala, Chikhli, Navsari", "place": "Thala", "taluka": "Chikhli", "licNo": "10965", "worker": "50", "hp": "250", "validYear": "2029"}, {"name": "CREATIVE WOOD INDUSTRIES", "address": "PPLOT NO, 1782 A/7/1, NR, BHAVIN CONSTRUCTION, BAMANVEL PATIA, ALIPORE, CHIKHLI., Alipore, Alipor, Chikhli, Navsari, 396521", "place": "Alipor", "taluka": "Chikhli", "licNo": "31108", "worker": "50", "hp": "100", "validYear": "2026"}, {"name": "GANESH AGRO FOOD PRODUCTS", "address": "BLOCK NO.371/1,BEHIND T.J.AGRO,N.H.NO.8,VILLAGE -NAVATALAV-396433,TA& DIST -NAVSARI, Navsari, Navsari, Navsari, 396433", "place": "Navsari", "taluka": "Navsari", "licNo": "37150", "worker": "50", "hp": "250", "validYear": "2028"}, {"name": "SHREE SAIHASTI AGROPRODUCTS LIMITED", "address": "BLOCK NO -237/1,2 & 238 PUMP VARI NAAR, VILLAGE - SUPA(KUREL) TA & DIST -NAVSARI -396418, Kurel, Navsari, Navsari, 396418", "place": "Kurel", "taluka": "Navsari", "licNo": "38738", "worker": "50", "hp": "500", "validYear": "2025"}, {"name": "OM SAI FOOD PRODUCTS", "address": "BEHIND MAROLI SUGAR,VILLAGE KOLASANA, Kolasana, Jalalpore, Navsari, 396415", "place": "Kolasana", "taluka": "Jalalpore", "licNo": "39963", "worker": "50", "hp": "250", "validYear": "2017"}, {"name": "SHREENATH NAMKEENS", "address": "PLOT NO. C/20, AT UDHYOGNAGAR, VIJALPORE, NAVSARI., Navsari, Navsari, Navsari, 396450", "place": "Navsari", "taluka": "Navsari", "licNo": "44082", "worker": "20", "hp": "100", "validYear": "2026"}, {"name": "SRI KAILASH MARKETING", "address": "BLOCK/SR. NO.-277/P-1/3(439),PLOT NO.3,NEAR NEW GIDC, Nasilpor, Navsari, Navsari, 396350", "place": "Nasilpor", "taluka": "Navsari", "licNo": "52626", "worker": "20", "hp": "250", "validYear": "2027"}, {"name": "JYOTI INDUSTRIES", "address": "CITY SR. NO. NA636/3/2/7,NEAR SPRINT WATER,NAVA TALAV, KHADSUPA BOARDING, Ashtagam, Navsari, Navsari, 396433", "place": "Ashtagam", "taluka": "Navsari", "licNo": "56252", "worker": "20", "hp": "250", "validYear": "2028"}, {"name": "P.M. PAVERS", "address": "Plot No.1824, Chikhali Vasda Road, Nr. Hans Quarry, Opp. Raj Chemicals, Alipor, Chikhli, Navsari", "place": "Alipor", "taluka": "Chikhli", "licNo": "21072", "worker": "20", "hp": "100", "validYear": "2030"}, {"name": "A1 GEARS", "address": "SHED NO- C1-18/125, GIDC ANTALIA, BILIMORA, Antaliya (CT), Gandevi, Navsari, 396325", "place": "Antaliya (CT)", "taluka": "Gandevi", "licNo": "50747", "worker": "20", "hp": "50", "validYear": "2027"}, {"name": "A K ENTERPRISE", "address": "PLOT NO- 261 GIDC ANTALIA, BILIMORA, Antaliya (CT), Gandevi, Navsari, 396325", "place": "Antaliya (CT)", "taluka": "Gandevi", "licNo": "52504", "worker": "20", "hp": "50", "validYear": "2027"}, {"name": "MEHTA ENGINEERS AND ENTERPRISE", "address": "SHED NO.: 183,184/1, G.I.D.C.: NAVSARI, Kabilpor, Navsari, Navsari, 396424", "place": "Kabilpor", "taluka": "Navsari", "licNo": "52624", "worker": "20", "hp": "50", "validYear": "2027"}, {"name": "BAC PVT. LTD.", "address": "BLOCK NO.:83 (OLD BLOCK NO.:184), ARAK SISODRA ROAD, Arak, Jalalpore, Navsari, 396475", "place": "Arak", "taluka": "Jalalpore", "licNo": "54919", "worker": "50", "hp": "250", "validYear": "2025"}, {"name": "EFRA INDUSTRIES LLP", "address": "NEW BLOCK NO: 521, OLD BLOCK NO: 463, SOSIDARA - SARBHON ROAD, Sisodra [Arak], Jalalpore, Navsari, 396475", "place": "Sisodra [Arak]", "taluka": "Jalalpore", "licNo": "55021", "worker": "100", "hp": "250", "validYear": "2030"}, {"name": "ROSHAN ENGINEERING", "address": "SHED NO. : A1/1,G.I.D.C. BILIMORA, Antaliya (CT), Gandevi, Navsari, 396321", "place": "Antaliya (CT)", "taluka": "Gandevi", "licNo": "55776", "worker": "50", "hp": "50", "validYear": "2027"}, {"name": "STELLAR ADP PRIVATE LIMITED", "address": "PLOT NO: C-1/181-1, G.I.D.C. ANTALIA, BILIMORA, TALUKA: GANDEVI, Antaliya (CT), Gandevi, Navsari, 396325", "place": "Antaliya (CT)", "taluka": "Gandevi", "licNo": "56253", "worker": "20", "hp": "100", "validYear": "2026"}, {"name": "GUJARAT STATE TRANSPORT CO.LTD", "address": "NEAR OLD THANA S.T.DEAPO- NAVSARI 2, Navsari, Navsari, Navsari", "place": "Navsari", "taluka": "Navsari", "licNo": "3346", "worker": "50", "hp": "50", "validYear": "2032"}, {"name": "GUJARAT STATE TRANSPORT CO. LTD.", "address": "NEAR RAILWAY STATION BILIMORA S.T.DEAPO, Bilimora, Gandevi, Navsari", "place": "Bilimora", "taluka": "Gandevi", "licNo": "16898", "worker": "50", "hp": "50", "validYear": "2032"}, {"name": "TRUE COLORS PVT. LTD.", "address": "B/SR. NO - 619,628,631,633,643,651,669,672,679,682 & 690, SUB PLOT NO - 17 , PLOT NO - 44 & 51, RAJHANS ZESTO , AT - VILLAGE KALAKACHHA, NAVSARI, Kalakachha, Jalalpore, Navsari, 396145", "place": "Kalakachha", "taluka": "Jalalpore", "licNo": "54807", "worker": "250", "hp": "2000", "validYear": "2027"}, {"name": "MAFATLAL INDUSTRIES LTD.  (TEXTILE DIVISION) NAVSARI UNIT.", "address": "NAVSARI UNIT,VIJALPORE ROAD,NAVSARI, Vejalpor, Navsari, Navsari", "place": "Vejalpor", "taluka": "Navsari", "licNo": "4312", "worker": "20", "hp": "2000", "validYear": "2021"}, {"name": "SUNIDHI SPINNING LLP", "address": "BLOCK NO. 37, 38, 43 & 44, N.H. NO. 48, NEAR HOTAL HARE KRISHNA, VEJALPORE, Vejalpor, Navsari, Navsari, 396475", "place": "Vejalpor", "taluka": "Navsari", "licNo": "59100", "worker": "250", "hp": "2000", "validYear": "2029"}, {"name": "IHM AGRO FOODS PVT. LTD.", "address": "B/SR. NO - 671 , N. H. NO - 48 , OPP. BHARAT PETROLEUM , AT - VILLAGE THALA, Thala, Chikhli, Navsari, 396521", "place": "Thala", "taluka": "Chikhli", "licNo": "50539", "worker": "20", "hp": "100", "validYear": "2026"}, {"name": "B B PRODUCTS ( PRIME COLD STORAGE )", "address": "BLOCK / SR. NO - 28 , N. H. NO - 8 , NEAR TOLLTEX PLAZA BORIYACH , AT & POST - VILLAGE BORIYACH , TAL. & DIST - NAVSARI . PIN - 396433, Boriach, Navsari, Navsari, 396001", "place": "Boriach", "taluka": "Navsari", "licNo": "33589", "worker": "20", "hp": "500", "validYear": "2031"}, {"name": "FARM SONS FOODS", "address": "BLOCK / SR. NO - 800 / 1 , OPP. DINKAR BHAVAN, NATIONAL HIGHWAY NO - 8 , AT - VILLAGE MAJIGAM , TAL - CHIKHLI DIST - VALSAD, Majigam, Chikhli, Navsari, 396521", "place": "Majigam", "taluka": "Chikhli", "licNo": "35503", "worker": "20", "hp": "250", "validYear": "2020"}, {"name": "R. B. TRADELINKS LLP.", "address": "SURVEY NO.: 1072, OPP. NAIK FOUNDATION, VILLAGE: ENDHAL, Endhal, Gandevi, Navsari, 396430", "place": "Endhal", "taluka": "Gandevi", "licNo": "41139", "worker": "20", "hp": "500", "validYear": "2027"}, {"name": "AMALSAD VIBHAG VIVIDH KARYAKARI SAHAKARI KHEDUT MANDALI LTD.", "address": "NEW BLOCK NO: 131, OLD BLOCK NO: 236+237, POST: AMALSAD, VILLAGE: KACHHOLI, Kachholi, Gandevi, Navsari, 396310", "place": "Kachholi", "taluka": "Gandevi", "licNo": "57041", "worker": "20", "hp": "50", "validYear": "2026"}, {"name": "DESAI AGRIFOODS PRIVATE LIMITED", "address": "PLOT NO.49,AT-AMODPORE.NAVSARI., Amadpor, Navsari, Navsari", "place": "Amadpor", "taluka": "Navsari", "licNo": "3180", "worker": "100", "hp": "250", "validYear": "2027"}, {"name": "PURNA FROZEN FOODS PVT LTD.", "address": "BLOCK NO.183,DHOLAPIPLA,CHAR RASTA, N.H.NO.-8,PERA ROAD, AMADPORE, Amadpor, Navsari, Navsari", "place": "Amadpor", "taluka": "Navsari", "licNo": "11259", "worker": "20", "hp": "100", "validYear": "2030"}, {"name": "SHREE DATT AQUACULTURE FARMS PVT. LTD .", "address": "AT. TALODH. VIA. BILLIMORA., Torangam, Gandevi, Navsari", "place": "Torangam", "taluka": "Gandevi", "licNo": "3306", "worker": "250", "hp": "1000", "validYear": "2008"}, {"name": "SHREE DATT AQUACULTURE FARMS PVT. LTD", "address": "AT & POST-TALODH, BILIMORA, Devdha, Gandevi, Navsari", "place": "Devdha", "taluka": "Gandevi", "licNo": "18039", "worker": "250", "hp": "1000", "validYear": "2027"}, {"name": "ICEDREAM GLOBAL PRIVATE LIMITED", "address": "Block No.199, Plot No.C/5-8, Village-Nadod, Nandod, Jalalpore, Navsari", "place": "Nandod", "taluka": "Jalalpore", "licNo": "31101", "worker": "250", "hp": "1000", "validYear": "2025"}, {"name": "BHAMJI GRANITES LLLP", "address": "BLOCK /SR. NO. 289, CHIKHLI - VANSDA ROAD VILLAGE.- KHUNDH TAL.- CHIKHLI DIST.- NAVSARI., Khundh, Chikhli, Navsari, 396521", "place": "Khundh", "taluka": "Chikhli", "licNo": "48431", "worker": "50", "hp": "250", "validYear": "2026"}, {"name": "MAHENDRA BROTHERS EXPORTS PVT.LTD", "address": "GROUND FLOOR & BASEMENT,B/H,JAMNA PARK,GANDEVI ROAD,AT.POST.JAMALPORE., Jamalpor, Navsari, Navsari", "place": "Jamalpor", "taluka": "Navsari", "licNo": "4514", "worker": "2000", "hp": "1000", "validYear": "2026"}, {"name": "PURPLE DIAMOND PVT. LTD. (UNIT-2)", "address": "Near Sardar Patel Town Ship, 1st Floor, Station Road, Vijalpore, Vejalpor, Navsari, Navsari", "place": "Vejalpor", "taluka": "Navsari", "licNo": "4933", "worker": "250", "hp": "500", "validYear": "2010"}, {"name": "KANKSHA  MANUFACTURING L L P", "address": "Sr. No. 8,15 & 16, At. & Post. Jamalpore, B/H Jamna park, gandevi road, Jamalpor, Navsari, Navsari", "place": "Jamalpor", "taluka": "Navsari", "licNo": "7010", "worker": "2000", "hp": "500", "validYear": "2026"}, {"name": "INDIGO DIAMOAD PVT. LTD.", "address": "4/1134, CHAMUNDA NIVAS, ASHOKVAN, CHHAPRA ROAD, NAVSARI, Chhapra, Navsari, Navsari", "place": "Chhapra", "taluka": "Navsari", "licNo": "7011", "worker": "50", "hp": "250", "validYear": "2012"}, {"name": "ULTRA FILTECH", "address": "419, G.I.D.C. KABILPORE, Kabilpor, Navsari, Navsari", "place": "Kabilpor", "taluka": "Navsari", "licNo": "7013", "worker": "100", "hp": "100", "validYear": "2029"}, {"name": "RACHEL MANUFACTURING & COMPANY.", "address": "BAGMALBHAI LAXMICHAND PARIKH MARG, ASHANAGAR, NAVSARI., Navsari, Navsari, Navsari", "place": "Navsari", "taluka": "Navsari", "licNo": "7305", "worker": "500", "hp": "500", "validYear": "2017"}, {"name": "OSIA GEMS PVT.LTD..", "address": "3209/C, Anand Nagar, Shantadevi Road, Navsari., Navsari, Navsari, Navsari", "place": "Navsari", "taluka": "Navsari", "licNo": "15154", "worker": "250", "hp": "250", "validYear": "2029"}, {"name": "N. M. DIAM L.L.P", "address": "C-14, UDHYOG NAGAR, VIJALPORE ROAD, VIJALPORE, Navsari, Navsari, Navsari", "place": "Navsari", "taluka": "Navsari", "licNo": "21414", "worker": "250", "hp": "250", "validYear": "2028"}, {"name": "FANCY MFG. LLP. UNIT-1", "address": "SR.NO.25 C.S.NO.17/41, R.S.NO.336/1,336/2,336/3 & 336 PAIKI, At. VIJALPORE ROAD, Vejalpor, Navsari, Navsari", "place": "Vejalpor", "taluka": "Navsari", "licNo": "28134", "worker": "1000", "hp": "500", "validYear": "2026"}, {"name": "PRANAMI GEMS", "address": "SURVEY NO.338 BHUVNESHWARI SOC. NEAR CHHAPRA ROAD NAVSARI, Navsari, Navsari, Navsari, 396445", "place": "Navsari", "taluka": "Navsari", "licNo": "28754", "worker": "250", "hp": "250", "validYear": "2024"}, {"name": "RATNAKALA EXPORTS PVT LTD", "address": "CITY SURVEY NO 2258, ANANDNAGAR SHANTDEVI ROAD NAVSARI, Navsari, Navsari, Navsari, 396445", "place": "Navsari", "taluka": "Navsari", "licNo": "35405", "worker": "2000", "hp": "1000", "validYear": "2026"}, {"name": "H. K. DIAMONDS", "address": "( FIRST FLOOR AND SECOND FLOOR ) WARD NO - 2 , HOUSE NO - 3231 / 1 AND 3231 / 2, ANAND NAGAR , SHANTADEVI ROAD , AT - NAVSARI, Navsari, Navsari, Navsari, 396445", "place": "Navsari", "taluka": "Navsari", "licNo": "49516", "worker": "100", "hp": "500", "validYear": "2026"}, {"name": "RADHAKRISHNA IMPEX", "address": "CITY SURVEY NO: 57, HOUSE NO: 2250/0, 2251/0, 2252/0, 2253/0, 2254/0, 2255/0, JEMS STAR BUILDING, CHARPUL MAIN ROAD, Navsari, Navsari, Navsari, 396445", "place": "Navsari", "taluka": "Navsari", "licNo": "49585", "worker": "500", "hp": "250", "validYear": "2026"}, {"name": "NOUVEAU DIAMONDS MANUFACTURING INDIA LLP.", "address": "R. S. NO. 25 / A + 25 / B / 2, CITY SURVEY NO. 5031, T. P. SCHEME NO. 2, F. P. NO. 86, WARD : NAVSARI - 3, TAGORE NAGAR SOCIETY, JUNATHANA, NAVSARI, Navsari, Navsari, Navsari, 396445", "place": "Navsari", "taluka": "Navsari", "licNo": "50071", "worker": "2000", "hp": "2000", "validYear": "2026"}, {"name": "IPD POLISHING WORKS PVT. LTD.", "address": "PROPERTY OLD NO: 2871, 2872, 2872/1, 2872/2 & 2872/3 PROPERTY NEW NO: 7405/0, 7406/0, 7407/0, 7408/0 & 7409/0, VADI STREET, Navsari, Navsari, Navsari, 396444", "place": "Navsari", "taluka": "Navsari", "licNo": "54027", "worker": "250", "hp": "100", "validYear": "2030"}, {"name": "FOREVER GEMS", "address": "Plot No.:1516,1517 (Ground & First Floor), 1518(Ground Floor), New Block/Survey No.: 147,Behind Vaniya Mill High School, Antaliya (CT), Gandevi, Navsari, 396325", "place": "Antaliya (CT)", "taluka": "Gandevi", "licNo": "57533", "worker": "50", "hp": "50", "validYear": "2029"}, {"name": "PRIME GEMS", "address": "CITY SURVEY No. 2244/2, BLOCK/SURVEY No. 587/P1, TIKA No. 9, OPP. KAMDHENU APPARTMENT, SHANTADEVI ROAD, NAVSARI- 396445. DIST. NAVSARI, Navsari, Navsari, Navsari, 396445", "place": "Navsari", "taluka": "Navsari", "licNo": "59411", "worker": "50", "hp": "250", "validYear": "2029"}, {"name": "CLASSIC COOLENTS.", "address": "GANDEVI ROAD, VIA BILLIMORA. AT. VALOTI., Valoti, Gandevi, Navsari", "place": "Valoti", "taluka": "Gandevi", "licNo": "3331", "worker": "20", "hp": "50", "validYear": "2026"}, {"name": "THE WESTERN INDIA GENUINE GHEE CO. PVT. LTD.", "address": "SR. NO - 53 , NAVSARI - BARDOLI ROAD , AT - VILLAGE TARSADI, Tarsadi, Navsari, Navsari, 396418", "place": "Tarsadi", "taluka": "Navsari", "licNo": "49684", "worker": "50", "hp": "250", "validYear": "2026"}, {"name": "KRISHA BEVERAGIES", "address": "SR. NO - 632 , SATEM - TODO ROAD , AT - MOJE ASHTAGAM, NAVSARI, Ashtagam, Navsari, Navsari, 396433", "place": "Ashtagam", "taluka": "Navsari", "licNo": "45658", "worker": "20", "hp": "250", "validYear": "2027"}, {"name": "DEVESH AUTO GARAGE", "address": "AT.CHHAPRA,NAVSARI, Chhapra, Navsari, Navsari", "place": "Chhapra", "taluka": "Navsari", "licNo": "3521", "worker": "20", "hp": "50", "validYear": "2029"}, {"name": "TEJPAL MOTORS PVT. LTD.", "address": "N.H.NO.8, NEAR, SHIVSHAKTI FARM, VILL-UNN, NAVSARI., Un, Navsari, Navsari", "place": "Un", "taluka": "Navsari", "licNo": "9851", "worker": "100", "hp": "100", "validYear": "2028"}, {"name": "SHALU AUTOMOBILE", "address": "N.H.NO.8, NEAR ALFA HOTEL AT. & POST.-SISODRA, Sisodra (ganesh), Navsari, Navsari", "place": "Sisodra (ganesh)", "taluka": "Navsari", "licNo": "12179", "worker": "50", "hp": "50", "validYear": "2030"}, {"name": "RAGHUVANSHI MOTORS PVT.LTD.", "address": "AT.CHIKHLI-BILIMORA ROAD, VILLAGE-ANTALIA, Gidc antlia, Gandevi, Navsari", "place": "Gidc antlia", "taluka": "Gandevi", "licNo": "12501", "worker": "50", "hp": "50", "validYear": "2030"}, {"name": "RAGHUVANSHI MOTORS PVT. LTD.", "address": "N.H.NO.8, NEAR OVER BRIDGE AT.PO.-THALA, Thala, Chikhli, Navsari", "place": "Thala", "taluka": "Chikhli", "licNo": "12502", "worker": "50", "hp": "50", "validYear": "2030"}, {"name": "NAVJIVAN CARS PVT. LTD.", "address": "Vadi Faliya, Samroli, Chikhali Bilimora Road, Samaroli, Chikhli, Navsari", "place": "Samaroli", "taluka": "Chikhli", "licNo": "24142", "worker": "50", "hp": "50", "validYear": "2022"}, {"name": "VIJAY AUTOMOBILES", "address": "plot no 1-6,ishwarnagar land plot, NEAR BHANA PETROL PUMP,NH NO 8,GRID,NAVSARI, NAVSARI, Navsari, Navsari, Navsari, 396445", "place": "Navsari", "taluka": "Navsari", "licNo": "34890", "worker": "20", "hp": "100", "validYear": "2026"}, {"name": "KATARIA AUTOMOBILES PVT LTD", "address": "SURVEY NO176,VILLAGE RANI FALIYA, TAL- VANSDA, Ranifaliya, Vansada, Navsari, 396580", "place": "Ranifaliya", "taluka": "Vansada", "licNo": "35389", "worker": "50", "hp": "50", "validYear": "2029"}, {"name": "NAVJIVAN CARS P. LTD.", "address": "RS NO: 46/P-2, PLOT NO: 05, VANSDA-BHINAR ROAD, Nani Bhamti, Vansada, Navsari, 396580", "place": "Nani Bhamti", "taluka": "Vansada", "licNo": "37151", "worker": "50", "hp": "50", "validYear": "2027"}, {"name": "NAVJIVAN AUTOMOTIVE", "address": "BLOCK NO: 485, OPP: RANODRA PATIYA, N.H.WAY NO: 08, Vesma, Jalalpore, Navsari, 396475", "place": "Vesma", "taluka": "Jalalpore", "licNo": "37933", "worker": "50", "hp": "50", "validYear": "2023"}, {"name": "KATARIA AUTOMOBILES PVTLTD", "address": "BLOCK/SR.NO -461,OPP,WIRELESS TOWER CHIKHALI -BILIMORA ROAD, VILLAGE -MAJIGAM,TA - CHIKHALI, DIST -NAVSARI,396521, Majigam, Chikhli, Navsari, 396521", "place": "Majigam", "taluka": "Chikhli", "licNo": "38050", "worker": "50", "hp": "100", "validYear": "2033"}, {"name": "RATHOD CARS PRIVATE LIMITED", "address": "BLOCK NO.1064 OPP SAI MANDIR NH NO 8 AT VILLAGE: SISODRA, Sisodra (ganesh), Navsari, Navsari, 396463", "place": "Sisodra (ganesh)", "taluka": "Navsari", "licNo": "39965", "worker": "50", "hp": "250", "validYear": "2031"}, {"name": "SURAT MOTORCARS LLP", "address": "RS NO: 190/P, N.H.WAY NO: 08, PLOT NO: B-7 TO B-12 & B-13 TO B-28, GRID CHAR RASTA, Navsari, Navsari, Navsari, 396445", "place": "Navsari", "taluka": "Navsari", "licNo": "41406", "worker": "20", "hp": "50", "validYear": "2024"}, {"name": "PRESIDENT AUTOMOBILES", "address": "BLOCK NO. 189 / P1 & 181 / P1, N. H. NO. 48, VILLAGE: KABILPORE, TALUKA: NAVSARI, DIST: NAVSARI, Kabilpor, Navsari, Navsari, 396445", "place": "Kabilpor", "taluka": "Navsari", "licNo": "45405", "worker": "50", "hp": "100", "validYear": "2026"}, {"name": "PRESIDENT MOTORS", "address": "BLOCK NO. 189 / P1 & 181 / P1, N. H. NO. 48, VILLAGE: KABILPORE, TALUKA: NAVSARI, DIST: NAVSARI, Kabilpor, Navsari, Navsari, 396445", "place": "Kabilpor", "taluka": "Navsari", "licNo": "45406", "worker": "50", "hp": "100", "validYear": "2026"}, {"name": "AUTOMARK MOTORS PVT. LTD.", "address": "BLOCK / SURVEY NO.: 257 / PAIKEE & 257 / PAIKEE-5 / PAIKEE-1, PLOT NO.: 65 & 3, OPP. SWAMINARAYAN TEMPLE, N.H.NO.: 48, AT. & PO. KABILPORE, Navsari, Navsari, Navsari, 396445", "place": "Navsari", "taluka": "Navsari", "licNo": "47476", "worker": "20", "hp": "100", "validYear": "2026"}, {"name": "PRESIDENCY CARS PVT. LTD.", "address": "BLOCK NO. 189 / P1 & 181 / P1, N. H. NO. 48, VILLAGE: KABILPORE, TALUKA: NAVSARI, DIST: NAVSARI, Kabilpor, Navsari, Navsari, 396445", "place": "Kabilpor", "taluka": "Navsari", "licNo": "47635", "worker": "20", "hp": "50", "validYear": "2026"}, {"name": "SURAT MOTORCARS LLP.", "address": "City Survey No.: 1367, Sisodara Ganesh, Sisodara Road, Sisodra (ganesh), Navsari, Navsari, 396463", "place": "Sisodra (ganesh)", "taluka": "Navsari", "licNo": "54313", "worker": "50", "hp": "50", "validYear": "2028"}, {"name": "NAVJIVAN TRUCKS AND BUSES", "address": "BLOCK NO: 484, OPP. RANODRA PATIYA, N.H. NO: 48, Vesma, Jalalpore, Navsari, 396475", "place": "Vesma", "taluka": "Jalalpore", "licNo": "55873", "worker": "50", "hp": "50", "validYear": "2030"}, {"name": "LANDMARK AUTOMOBILES LTD.", "address": "NEW SURVEY NO.: 833 (OLD SURVEY NO.: 234 PAIKI 2), 834 (OLD SURVEY NO.: 234 PAIKI 5), N. H. 8, AT. VILLAGE: DHARAGIRI, Dharagiri, Navsari, Navsari, 396424", "place": "Dharagiri", "taluka": "Navsari", "licNo": "56251", "worker": "20", "hp": "50", "validYear": "2026"}, {"name": "PRAMUKH AUTOMOTIVE PVT. LTD.", "address": "BLOCK NO. 189 / P1 & 181 / P1, MILAKAT NO. 130 / 8, N. H. NO. 48, Kabilpor, Navsari, Navsari, 396424", "place": "Kabilpor", "taluka": "Navsari", "licNo": "56257", "worker": "20", "hp": "50", "validYear": "2026"}, {"name": "NANAVATI AUTOMOTIVE", "address": "Block No-673 Paikee 05, Thala, Chikhli, Navsari, 396521", "place": "Thala", "taluka": "Chikhli", "licNo": "57043", "worker": "50", "hp": "100", "validYear": "2026"}, {"name": "KATARIA AUTOMOBILES PVT. LTD.", "address": "SR. NO. : 334, OLD SR. NO. 51, Charanwada, Vansada, Navsari, 396580", "place": "Charanwada", "taluka": "Vansada", "licNo": "57501", "worker": "50", "hp": "100", "validYear": "2034"}, {"name": "WADIA BOAT BUILDERS", "address": "4531/1,HANUMAN STREET,BILIMORA, Bilimora, Gandevi, Navsari", "place": "Bilimora", "taluka": "Gandevi", "licNo": "4756", "worker": "20", "hp": "50", "validYear": "2011"}, {"name": "RAGHUVANSHI MOTORS PRIVATE LIMITED", "address": "Srvey No.161/Paiky 21, Near Swami Tyres,Vansada, Hanumanbari, Vasnda, Navsari", "place": "Hanumanbari", "taluka": "Vasnda", "licNo": "27140", "worker": "50", "hp": "50", "validYear": "2030"}, {"name": "RIDHAM MOTORS", "address": "BLOCK NO 1632, NEAR SATYASAI TRUST-SCHOOL, SISODARA, TA & DIST NAVSARI., Navsari, Navsari, Navsari, 396445", "place": "Navsari", "taluka": "Navsari", "licNo": "43257", "worker": "50", "hp": "50", "validYear": "2029"}, {"name": "THAAKORGEE INDUSTRIES", "address": "616/1, N.H.NO.8, Kharel Chokdi, Gandeva, Gandevi, Navsari", "place": "Gandeva", "taluka": "Gandevi", "licNo": "27462", "worker": "20", "hp": "50", "validYear": "2027"}, {"name": "METRO MOTORS", "address": "KALIAWADI,NAVSARI, Kaliawadi, Navsari, Navsari", "place": "Kaliawadi", "taluka": "Navsari", "licNo": "3436", "worker": "20", "hp": "50", "validYear": "2030"}, {"name": "HLE GLASCOAT LTD. (R AND D CENTER)", "address": "Old Block No.199, New Block No.: 140, At. Maroli Udyognagar, Nandod, Jalalpore, Navsari, 396436", "place": "Nandod", "taluka": "Jalalpore", "licNo": "44177", "worker": "50", "hp": "250", "validYear": "2030"}, {"name": "MAA KRUPA PETROLEUM", "address": "BLOCK NO - 2615 , AT & POST - KUKERI .CHIKHLI - VANSDA ROAD., Kukeri, Chikhli, Navsari", "place": "Kukeri", "taluka": "Chikhli", "licNo": "31104", "worker": "20", "hp": "250", "validYear": "2026"}, {"name": "NIRAJ AUTOMOBILES ( Deale I O C L )", "address": "BLOCK / SR. NO - 785 / 1 / P1 , AT - VILLAGE RUMLA , PANIKHADAK , TAL. - CHIKHLI. DIST - NAVSARI . PIN - 396040, Rumla, Chikhli, Navsari, 396040", "place": "Rumla", "taluka": "Chikhli", "licNo": "33586", "worker": "20", "hp": "50", "validYear": "2027"}, {"name": "SHREE DUTT PETROLEUM", "address": "BLOCK NO: 374/2/P, BILIMORA - GANDEVI ROAD, NEAR DUTT TEMPLE, Bilimora, Gandevi, Navsari, 396321", "place": "Bilimora", "taluka": "Gandevi", "licNo": "33588", "worker": "20", "hp": "250", "validYear": "2027"}, {"name": "OMKAR PETROLEUM", "address": "BLOCK NO: 1/2/P-1, NEAR SHREENATH HOUSE, GREEN ROAD, Kaliawadi, Navsari, Navsari, 396427", "place": "Kaliawadi", "taluka": "Navsari", "licNo": "34361", "worker": "20", "hp": "250", "validYear": "2027"}, {"name": "SAHAKARI KHAND UDYOG MANDAL LTD ( Dealer B P C L )", "address": "BLOCK / SR. NO - 98 , GANDEVI., AT & POST - GANDEVI. TAL - GANDEVI. DIST - NAVSARI. 396360, DIST - NAVSARI. PIN - 396360, Gandevi, Gandevi, Navsari, 396360", "place": "Gandevi", "taluka": "Gandevi", "licNo": "34363", "worker": "20", "hp": "50", "validYear": "2030"}, {"name": "JEEVANDHARA PETROLEUM", "address": "BLOCK NO: 246, N.H. WAY NO: 08, OPP: BHAGWAN MAHAVIR VISHVA KALYAN TRUST, Navsari, Navsari, Navsari, 396433", "place": "Navsari", "taluka": "Navsari", "licNo": "34391", "worker": "20", "hp": "50", "validYear": "2027"}, {"name": "GANDEVI TALUKA KHEDUT SAHAKARI SANGH LTD.", "address": "BLOCK NO. 128/P, GANDEVI ROAD, Rahej, Gandevi, Navsari, 396360", "place": "Rahej", "taluka": "Gandevi", "licNo": "34480", "worker": "20", "hp": "250", "validYear": "2030"}, {"name": "MAA GAYATRI KRUPA SERVICE STATION ( Deale I O C L )", "address": "SR. NO - 547 , AT & POST - AMBADA , TAL. & DIST - NAVSARI - PIN - 396469, TAL. & DIST - NAVSARI. PIN - 396469, Ambada, Navsari, Navsari, 396469", "place": "Ambada", "taluka": "Navsari", "licNo": "34481", "worker": "20", "hp": "50", "validYear": "2022"}, {"name": "RAJ PETROLEUM", "address": "Sr.no. 37/Paiki-1/ Paiki-1 & 38/1 Village: Hanumanbari, Tal. Vansada, Dist. Navsari, Hanumanbari, Vansada, Navsari, 396580", "place": "Hanumanbari", "taluka": "Vansada", "licNo": "34482", "worker": "20", "hp": "100", "validYear": "2032"}, {"name": "GOOD WILL AUTO STORES.", "address": "SURVEY NO.: 227/PAIKEE-1, VILLAGE: KHUNDH, Khundh, Chikhli, Navsari, 395007", "place": "Khundh", "taluka": "Chikhli", "licNo": "34483", "worker": "20", "hp": "50", "validYear": "2025"}, {"name": "ABRAMA SEVA SAHAKARI MANDLI LTD.( Dealer I O C L )", "address": "BLOCK / SR. NO. 686/P2, AT & PO. ABRAMA, Abrama, Jalalpore, Navsari", "place": "Abrama", "taluka": "Jalalpore", "licNo": "34484", "worker": "20", "hp": "10", "validYear": "2027"}, {"name": "NAGDHARA VIBHAG VIVIDH KARYAKARI SAHAKARI MANDLI LTD/ ( Deale I O C L )", "address": "SR. NO - 744 & 745, AT & POST - NAGDHARA , TAL. & DIST - NAVSARI - PIN - 396466, TAL. & DIST - NAVSARI. PIN - 396466, Nagdhara, Navsari, Navsari", "place": "Nagdhara", "taluka": "Navsari", "licNo": "34486", "worker": "20", "hp": "50", "validYear": "2027"}, {"name": "KANKUBA PETROLEUM ( Dealer B P C L )", "address": "BLOCK / SR. NO - 1125 / A , NEAR TANKAL CIRCLE , KHAREL - TANKAL ROAD , AT - VILLAGE TANKAL , TAL - CHIKHLI , DIST - NAVSARI , PIN - 396560, Tankal, Chikhli, Navsari, 396560", "place": "Tankal", "taluka": "Chikhli", "licNo": "34489", "worker": "20", "hp": "100", "validYear": "2027"}, {"name": "HIREN PETROLEUM ( Dealer Essar Oil Ltd )", "address": "BLOCK / SR. NO - 464 , N. H. NO - 8 , AT - SAMROLI , CHIKHLI PIN - 396521, Samaroli, Chikhli, Navsari, 396521", "place": "Samaroli", "taluka": "Chikhli", "licNo": "34491", "worker": "20", "hp": "50", "validYear": "2027"}, {"name": "DHARMA TRADING CO", "address": "NEAR RAILWAY STATION , NAVSARI, Navsari, Navsari, Navsari, 396445", "place": "Navsari", "taluka": "Navsari", "licNo": "34823", "worker": "20", "hp": "10", "validYear": "2032"}, {"name": "TAJ AUTOMOBILES", "address": "NH NO 8, AT POST VESMA, Vesma, Jalalpore, Navsari, 396475", "place": "Vesma", "taluka": "Jalalpore", "licNo": "34825", "worker": "20", "hp": "10", "validYear": "2022"}, {"name": "C F SHAH & CO", "address": "BLOCK NO.298, C.S. NO.15, AT & POST THALA, Thala, Chikhli, Navsari, 396521", "place": "Thala", "taluka": "Chikhli", "licNo": "34827", "worker": "20", "hp": "250", "validYear": "2029"}, {"name": "POOJA PETROLEUM", "address": "SR.NO.188 / PAIKI 7, KABILPORE, Navsari, Navsari, Navsari, 396424", "place": "Navsari", "taluka": "Navsari", "licNo": "34836", "worker": "20", "hp": "50", "validYear": "2029"}, {"name": "SHARDA PETROLIUM", "address": "AT-KASBAPAR,TA - NAVSARI, NAVSARI, Kasbapar, Navsari, Navsari, 396445", "place": "Kasbapar", "taluka": "Navsari", "licNo": "34891", "worker": "20", "hp": "50", "validYear": "2026"}, {"name": "PARAM PETROLEUM ( Dealer HPCL )", "address": "BLOCK NO - 419 , AT - THALA , N. H. NO - 8 , CHIKHLI, Thala, Chikhli, Navsari, 396521", "place": "Thala", "taluka": "Chikhli", "licNo": "35374", "worker": "20", "hp": "50", "validYear": "2027"}, {"name": "MEHTA & SONS", "address": "SR.NO 82/P2,83/P2 &84/P-1, MAROLI CHAR RASTA,TA - JALALPORE,DIST- NAVSARI, Maroli, Jalalpore, Navsari, 396436", "place": "Maroli", "taluka": "Jalalpore", "licNo": "35375", "worker": "20", "hp": "50", "validYear": "2032"}, {"name": "SALEJ PETROLEUM", "address": "BLOCK NO.630,SH NO.88,NAVSARI GANDEVI ROAD,SALEJ, Salej, Gandevi, Navsari, 396350", "place": "Salej", "taluka": "Gandevi", "licNo": "35813", "worker": "20", "hp": "50", "validYear": "2035"}, {"name": "NAVKAR PETROLEUM PRODUCT", "address": "BLOCK NO.112,SH NO.6,NAVSARI MAROLI ROAD,TANKOLI, Tankoli, Jalalpore, Navsari, 396445", "place": "Tankoli", "taluka": "Jalalpore", "licNo": "35814", "worker": "20", "hp": "50", "validYear": "2035"}, {"name": "KRISHAK PETROLEUM", "address": "BLOCK NO.579/A, R.S.NO.705/2, Bhula faliya, Navsari, Navsari", "place": "Bhula faliya", "taluka": "Navsari", "licNo": "36604", "worker": "20", "hp": "100", "validYear": "2029"}, {"name": "SHREE SAI VIBHUTI PETROLEUM", "address": "NH 8, PARTHAN PATIYA NEAR SUGAR N SPICE HOTEL, Parthan, Navsari, Navsari, 396475", "place": "Parthan", "taluka": "Navsari", "licNo": "36835", "worker": "20", "hp": "250", "validYear": "2033"}, {"name": "LOTUS PETROLEUM ( Deale H P C L )", "address": "BLOCK / SR. NO - 1764 / P 3, NEAR BAMANVEL PATIA , AT & POST - ALIPOR , CHIKHLI - VANSDA ROAD , TAL - CHIKHLI. DIST - NAVSARI. PIN - 396521, Alipor, Chikhli, Navsari, 396521", "place": "Alipor", "taluka": "Chikhli", "licNo": "36934", "worker": "20", "hp": "50", "validYear": "2023"}, {"name": "M/S RAMESH & CO", "address": "OPP,PRAJAPATI AASHRAM,DARGH ROAD, NAVSARI, Navsari, Navsari, Navsari, 396445", "place": "Navsari", "taluka": "Navsari", "licNo": "37403", "worker": "20", "hp": "10", "validYear": "2026"}, {"name": "AYUSH KISAN SEVA KENDRA ( Dealer I O C L )", "address": "B/SR. NO - 758-A/P1 , AT - VILLAGE VANZNA ( NANI VAGARWADI ) PO - RANKUVA , TAL - CHIKHLI, Vanzna, Chikhli, Navsari, 396560", "place": "Vanzna", "taluka": "Chikhli", "licNo": "37761", "worker": "20", "hp": "10", "validYear": "2023"}, {"name": "renuka automobiles", "address": "sr. no.-254, n.h. no-8, near railway crossing alipore, Chikhli, Chikhli, Navsari, 396520", "place": "Chikhli", "taluka": "Chikhli", "licNo": "37934", "worker": "20", "hp": "50", "validYear": "2029"}, {"name": "shroff & co.", "address": "sr. no.- 479, near collage chikhli, ta.- chikhli, dist.- navsari, Chikhli, Chikhli, Navsari, 396521", "place": "Chikhli", "taluka": "Chikhli", "licNo": "37935", "worker": "20", "hp": "10", "validYear": "2026"}, {"name": "GOPALJI & SONS", "address": "BLOCK/SR.NO :195/2, N.H. NO.8, NEAR GRID, AT & POST : KABILPORE, NAVSARI, Navsari, Navsari, Navsari, 396445", "place": "Navsari", "taluka": "Navsari", "licNo": "37936", "worker": "20", "hp": "50", "validYear": "2028"}, {"name": "SHROFF AND CO.- BiLiMORA", "address": "PLOT NO.- 401/1, MAHADEV NAGAR, NEAR RAILWAY STATION, BILIMOTA, TA.- GANDEVI, DIST.- NAVSARI., Bilimora, Gandevi, Navsari, 396321", "place": "Bilimora", "taluka": "Gandevi", "licNo": "37937", "worker": "20", "hp": "10", "validYear": "2028"}, {"name": "SHREE RANG PETROLEUM ( DELAR BPCL )", "address": "SR NO-231, MANCHA FALIA, AT- VILLAGE KHUDVEL, Khudvel, Chikhli, Navsari, 396540", "place": "Khudvel", "taluka": "Chikhli", "licNo": "38049", "worker": "20", "hp": "50", "validYear": "2026"}, {"name": "SAHJANAND PETROLEUM", "address": "BLOCK NO -74,VILLAGE :-NADOD,TA- JALALPORE,DIST -NAVSARI, Nandod, Jalalpore, Navsari, 396436", "place": "Nandod", "taluka": "Jalalpore", "licNo": "38560", "worker": "20", "hp": "250", "validYear": "2028"}, {"name": "URJA PETROLEUM", "address": "Pipalghabhan, Khergam road, Pipalgabhan, Chikhli, Navsari, 396521", "place": "Pipalgabhan", "taluka": "Chikhli", "licNo": "39703", "worker": "20", "hp": "50", "validYear": "2035"}, {"name": "M/s Ranchhodji Nagarji Desai", "address": "Near Pati minor canal, NH 8, Thala, Chikhli, Navsari, 396521", "place": "Thala", "taluka": "Chikhli", "licNo": "39704", "worker": "20", "hp": "250", "validYear": "2030"}, {"name": "THAKORBHAI R. DESAI & CO.", "address": "sr. no.812-3, village-bhinar, ta-vansda, dist- navsari, Bhinar, Vansada, Navsari, 396580", "place": "Bhinar", "taluka": "Vansada", "licNo": "39705", "worker": "20", "hp": "50", "validYear": "2035"}, {"name": "PRASHANSHA PETROLEUM", "address": "( DEALER I O C L ) SR NO - 465 P3 TO 11 , SUPA ON NAVSARI - BARDOLI ROAD , AT - VILLAGE SUPA, Supa, Navsari, Navsari, 396418", "place": "Supa", "taluka": "Navsari", "licNo": "41131", "worker": "20", "hp": "250", "validYear": "2029"}, {"name": "LAXMI PETROLEUM", "address": "( DEALER H P C L ) SR. NO - 117 , VIA AMALSAD - BILIMORA ROAD, AT - VILLAGE SARIKHURD , POST - LUSVADA , Sarikhurd, Gandevi, Navsari, 396310", "place": "Sarikhurd", "taluka": "Gandevi", "licNo": "41132", "worker": "20", "hp": "250", "validYear": "2030"}, {"name": "MONIL PETROLEUM", "address": "BLOCK NO - 664 P 2, VASUDHARA DAIRY-CHIKHLI COLLEGE ROAD, AT- THALA, Thala, Chikhli, Navsari, 396521", "place": "Thala", "taluka": "Chikhli", "licNo": "41134", "worker": "20", "hp": "50", "validYear": "2023"}, {"name": "RELIANCE BP MOBILITY LIMITED", "address": "S.R. NO:-304/P1, AHMEDABAD TO MUMBAI ROAD,, NH-8, Vejalpor, Navsari, Navsari, 396475", "place": "Vejalpor", "taluka": "Navsari", "licNo": "41137", "worker": "20", "hp": "50", "validYear": "2033"}, {"name": "HARE KRISHNA PETROLEUM", "address": "( DEALER B P C L ) SR. NO - 568/2/PAIKY2 , N. H. NO - 48 , NEAR DHOLAPIPLA , AT - VILLAGE PADGHA , Padgha, Navsari, Navsari, 396445", "place": "Padgha", "taluka": "Navsari", "licNo": "42086", "worker": "20", "hp": "250", "validYear": "2029"}, {"name": "KAUTILYA FUEL STATION", "address": "1764/P2,NR BAMANVEL PATIYA,AT POST ALIPORE, TA- CHIKHLI NAVSARI., Alipor, Chikhli, Navsari, 396409", "place": "Alipor", "taluka": "Chikhli", "licNo": "43140", "worker": "20", "hp": "50", "validYear": "2029"}, {"name": "SHIV SHAKTI PETROLEUM", "address": "( DEALER I O C L ) SR. NO - 2012 ( OLD SR. NO - 1889 ) AT - VILLAGE KUKERI , TAL - CHIKHLI , DIST - NAVSARI, Kukeri, Chikhli, Navsari, 396560", "place": "Kukeri", "taluka": "Chikhli", "licNo": "43142", "worker": "20", "hp": "250", "validYear": "2029"}, {"name": "BAPUJI PETROLEUM ( DEALER B P C L )", "address": "B/SR. NO - 34 / PAIKI1, KHATA NO - 1338, BILIMORA - AMALSAD ROAD,BILINAKA , AT - BILIMORA, Bilimora, Gandevi, Navsari, 396321", "place": "Bilimora", "taluka": "Gandevi", "licNo": "44081", "worker": "20", "hp": "50", "validYear": "2030"}, {"name": "SHRI SIDDHI PETROLEUM", "address": "SR NO- 332/P1, GANDEVI ROAD, DEVSAR, Devsar, Gandevi, Navsari, 396321", "place": "Devsar", "taluka": "Gandevi", "licNo": "44415", "worker": "20", "hp": "50", "validYear": "2026"}, {"name": "OM SAI PETROLEUM", "address": "( DEALER I O C L ) BLOCK / SR. NO - 967 , AMALSAD - BILIMORA ROAD ,VASHI STREET , AT - SARIBUJRAND , AMALSAD, Saribujrang, Gandevi, Navsari, 396310", "place": "Saribujrang", "taluka": "Gandevi", "licNo": "44902", "worker": "20", "hp": "50", "validYear": "2030"}, {"name": "SEVEN ELEVEN FUEL CENTRE", "address": "SR.NO 51/1 NAVSARI -GANDEVI ROAD,JAMALPORE,TA & DIST -NAVSARI 396445, Jamalpor, Navsari, Navsari, 396445", "place": "Jamalpor", "taluka": "Navsari", "licNo": "44903", "worker": "20", "hp": "50", "validYear": "2030"}, {"name": "SHREE SIDDHI VINAYAK PETROLEUM", "address": "Old Block / SR. No. 300/PaikiI 2,New Block /SR. No. 358,Village.- Charanwada. Tal.- Vansda. Dist.- Navsari, Charanwada, Vansada, Navsari, 396580", "place": "Charanwada", "taluka": "Vansada", "licNo": "45029", "worker": "20", "hp": "50", "validYear": "2030"}, {"name": "DREAM PETROLEUM", "address": "( DEALER H P C L ) BLOCK / SR. NO : 3238, DASHERA TEKARI, AT & POST : VILLAGE KHERGAM, Khergam, Khergam, Navsari, 396040", "place": "Khergam", "taluka": "Khergam", "licNo": "45511", "worker": "20", "hp": "50", "validYear": "2035"}, {"name": "HAREE OM PETROLEUM", "address": "N.H.NO. 48, OPP. MAHADEV HOTEL, BHULA FALIYA PATIYA, ASTAGAM, NAVSARI., Ashtagam, Navsari, Navsari, 396433", "place": "Ashtagam", "taluka": "Navsari", "licNo": "46085", "worker": "20", "hp": "50", "validYear": "2035"}, {"name": "PRABHU VINAYAK PETROLEUM", "address": "SURVEY NO.: 1404/PAIKEE 1, KHATA NO.: 1170, KHAREL - TANKAL ROAD, AT.MOJE: GANDEVA, Gandeva, Gandevi, Navsari, 396430", "place": "Gandeva", "taluka": "Gandevi", "licNo": "46749", "worker": "20", "hp": "50", "validYear": "2026"}, {"name": "ARHA PETROLEUM", "address": "BLOCK /SR. NO. 1395 VILLAGE.- GANDEVA. TAL.- GANDEVI.DIST.- NAVSARI., Gandeva, Gandevi, Navsari, 396430", "place": "Gandeva", "taluka": "Gandevi", "licNo": "46750", "worker": "20", "hp": "50", "validYear": "2035"}, {"name": "NAVSARI PETROLEUM", "address": "( DEALER H P C L ) CITY SR. NO - 1869 , STATION ROAD , AT - NAVSARI, Navsari, Navsari, Navsari, 396445", "place": "Navsari", "taluka": "Navsari", "licNo": "46753", "worker": "20", "hp": "10", "validYear": "2026"}, {"name": "SHIVSHAKTI PETROLEUM", "address": "Block / Survey No. 303/2, Chikhli-Vansda Road, Village: Khundh. Tal. Chikhli Dist. Navsari, Khundh, Chikhli, Navsari, 396521", "place": "Khundh", "taluka": "Chikhli", "licNo": "47636", "worker": "20", "hp": "50", "validYear": "2026"}, {"name": "NEW BHARAT FUEL STATION", "address": "SR. NO - 200, ( OLD SR. NO - 152 ) VANSDA - VAGHAI ROAD , AT - VILLAGE MAHUVAS, Mahuvas, Vansada, Navsari, 396580", "place": "Mahuvas", "taluka": "Vansada", "licNo": "47720", "worker": "20", "hp": "50", "validYear": "2026"}, {"name": "MAALAXMI PETROLEUN", "address": "( DEALER H P C L ) SR. NO - 220( OLD SR. NO - 191) , SH - 15 KHADKALA - CHIKHLI ROAD , AT & POST - LAKHAWADI , Lakhawadi, Vansada, Navsari, 396580", "place": "Lakhawadi", "taluka": "Vansada", "licNo": "47721", "worker": "20", "hp": "50", "validYear": "2026"}, {"name": "MITTAL PETROLEUM", "address": "Block / Survey No. 715/002 Chikhli-Vansda Road, Village: Doldha. Tal. Vansda Dist. Navsari, Doldha, Vansada, Navsari, 396321", "place": "Doldha", "taluka": "Vansada", "licNo": "48405", "worker": "20", "hp": "50", "validYear": "2031"}, {"name": "SHREE KUNJ PETROLEUM", "address": "Block / Survey No. 8 Chikhli-Vansda Road, Village: Doldha. Tal. Vansda Dist. Navsari, Doldha, Vansada, Navsari, 396580", "place": "Doldha", "taluka": "Vansada", "licNo": "48648", "worker": "20", "hp": "50", "validYear": "2026"}, {"name": "KRISHNA PETROLEUM", "address": "BLOCK NO -197/2, CHIKHLI-VANSDA ROAD, AT & POST - RETHVANIA, Rethvaniya, Chikhli, Navsari, 396560", "place": "Rethvaniya", "taluka": "Chikhli", "licNo": "48898", "worker": "20", "hp": "50", "validYear": "2029"}, {"name": "GYANI GAS STATION", "address": "SURVEY/BLOCK NO.: 217/2 , VANSDA - SAPUTARA ROAD , MOJE : MAHUVAS , TALUKA : VANSADA , DIST.: NAVSARI, Mahuvas, Vansada, Navsari, 396580", "place": "Mahuvas", "taluka": "Vansada", "licNo": "50069", "worker": "20", "hp": "100", "validYear": "2029"}, {"name": "HAREE OM GAS AND FUEL", "address": "BLOCK/SURVEY NO. : 127, OLD BLOCK/SURVEY NO.:377/PAIKI 2,ACCOUNT NO. 529. NEAR SAI BABA TEMPLE, Un, Navsari, Navsari, 396433", "place": "Un", "taluka": "Navsari", "licNo": "50536", "worker": "20", "hp": "250", "validYear": "2027"}, {"name": "HARSH PETROLEUM", "address": "BLOCK /SURVEY NO.36, VILLAGE.- RAVANIYA TAL.-VANSDA DIST.- NAVSARI., Ravaniya, Vansada, Navsari, 396060", "place": "Ravaniya", "taluka": "Vansada", "licNo": "50746", "worker": "20", "hp": "50", "validYear": "2032"}, {"name": "SHREEJI PETROLEUM", "address": "( DEALER H P C L ) B/SR. NO - 1240/P2 & 1240 /P3 , CHIKHLI - BILIMORA ROAD , AT - VILLAGE NANDARKHA , Nandarkha, Gandevi, Navsari, 396325", "place": "Nandarkha", "taluka": "Gandevi", "licNo": "51187", "worker": "20", "hp": "50", "validYear": "2027"}, {"name": "SRI SATYA SAI PETROLEUM", "address": "SR. NO - 812 / 1 , KHADKALA - CHIKHLI ROAD , KHADKALA FALIYA , AT - VILLAGE BHINAR, Bhinar, Vansada, Navsari, 396590", "place": "Bhinar", "taluka": "Vansada", "licNo": "51658", "worker": "20", "hp": "50", "validYear": "2027"}, {"name": "KESHAR BAA PETROLEUM", "address": "SR. NO - 339/001 , VANSDA - WAGHAI ROAD , AT - VILLAGE CHARANWADA, Charanwada, Vansada, Navsari, 396580", "place": "Charanwada", "taluka": "Vansada", "licNo": "52503", "worker": "20", "hp": "50", "validYear": "2027"}, {"name": "OM PETROLEUM", "address": "BLOCK/SR. NO. : 107/2/PAIKI1/PAIKI1, Dantej, Navsari, Navsari, 396445", "place": "Dantej", "taluka": "Navsari", "licNo": "52627", "worker": "20", "hp": "250", "validYear": "2032"}, {"name": "BHAGWATI PETROLEUM", "address": "DEALE I O C L SR. NO - 178 ( OLD SR. NO - 140/1/P1), VANSDA - DHARAMPUR ROAD ,VANARSHI CHAR RASHTA , AT & POST - VILLAGE JAMALIYA, Jamaliya, Vansada, Navsari, 396580", "place": "Jamaliya", "taluka": "Vansada", "licNo": "53369", "worker": "20", "hp": "50", "validYear": "2027"}, {"name": "NISARG PETROLEUM", "address": "SR. NO : 328, GANDEVI - NAVSARI ROAD , OPP. ISHWAR PARTY PLOT , AT : VILLAGE AJRAI, Ajrai, Gandevi, Navsari, 396360", "place": "Ajrai", "taluka": "Gandevi", "licNo": "54730", "worker": "20", "hp": "50", "validYear": "2028"}, {"name": "SHIVAM PETROLEUM", "address": "BLOCK NO.:489, NATIONAL HIGHWAY NO.:48, Vesma, Jalalpore, Navsari, 396475", "place": "Vesma", "taluka": "Jalalpore", "licNo": "55022", "worker": "20", "hp": "100", "validYear": "2024"}, {"name": "MITTAL FUEL STATION", "address": "BLOCK / SURVEY NO. 273. CHIKHLI -VANSDA ROAD. VILLAGE:- LAKHAWADI. TAL.:- VANSDA. DIST.:- NAVSARI., Lakhawadi, Vansada, Navsari, 396321", "place": "Lakhawadi", "taluka": "Vansada", "licNo": "55308", "worker": "20", "hp": "100", "validYear": "2033"}, {"name": "MOGRIBA PETROLEUM.", "address": "BLOCK / SURVEY NO. 501, VILLAGE: RUMLA, TAL. CHIKHLI, DIST. NAVSARI., Rumla, Chikhli, Navsari, 396060", "place": "Rumla", "taluka": "Chikhli", "licNo": "55310", "worker": "20", "hp": "50", "validYear": "2028"}, {"name": "AUM FILLING STATION", "address": "BLOCK/SURVEY NO.: 208/001, VANSDA-DHARMPUR ROAD, NH-56, AT. VILLAGE: MINDHABARI, Mindhabari, Vansada, Navsari, 396580", "place": "Mindhabari", "taluka": "Vansada", "licNo": "55735", "worker": "20", "hp": "50", "validYear": "2027"}, {"name": "BHANA AUTOMOBILES", "address": "SR. NO - 190/P , N. H. NO - 48, AT - KABILPOR , GRID , NAVSARI, Navsari, Navsari, Navsari, 396424", "place": "Navsari", "taluka": "Navsari", "licNo": "55871", "worker": "20", "hp": "10", "validYear": "2026"}, {"name": "VANITA PETROLEUM", "address": "SURVEY NO- 253, N.H. NO-48 VILLAGE- SANDALPORE, Sandalpor, Jalalpore, Navsari, 396475", "place": "Sandalpor", "taluka": "Jalalpore", "licNo": "56790", "worker": "20", "hp": "50", "validYear": "2033"}, {"name": "AMBICA PETROLIUM", "address": "BLOCK / SR. NO. : 2165/1,DHOLIKUVA, AMBICA PETROLIUM, Kukeri, Chikhli, Navsari, 396560", "place": "Kukeri", "taluka": "Chikhli", "licNo": "56791", "worker": "20", "hp": "50", "validYear": "2033"}, {"name": "FURAT ENTERPRISE", "address": "PLOT NO. 26 TO 31, R. S. NO. 131, BLOCK NO. 881 \"SPARKLE INDUSTRIAL ESTATE, PHASE - 3\", Chokhad, Jalalpore, Navsari, 396450", "place": "Chokhad", "taluka": "Jalalpore", "licNo": "58630", "worker": "20", "hp": "50", "validYear": "2029"}, {"name": "HAREE SHRADDHA PETROLEUM", "address": "BLOCK/SR. NO. - 256, NEAR SWASTIK OIL MILL, PO- KHADSUPA BOARDING, Un, Navsari, Navsari, 396433", "place": "Un", "taluka": "Navsari", "licNo": "59304", "worker": "20", "hp": "50", "validYear": "2029"}, {"name": "AMRUT FUEL STATION.", "address": "BLOCK / SURVEY NO. 93/001. VANSDA ROAD. VILLAGE:- NANI BHAMTI. TAL.:- VANSDA. DIST.:- NAVSARI., Nani Bhamti, Vansada, Navsari, 396580", "place": "Nani Bhamti", "taluka": "Vansada", "licNo": "59761", "worker": "20", "hp": "50", "validYear": "2035"}, {"name": "SEVAK SERVICES", "address": "BLOCK NO 1795,VALSAD ROAD, KHERGAM, Khergam, Khergam, Navsari, 396040", "place": "Khergam", "taluka": "Khergam", "licNo": "35323", "worker": "20", "hp": "50", "validYear": "2022"}, {"name": "NAVSARI TALUKA SAHKARI KHARID VECHAN SANGH LTD", "address": "N.H.NO.8, KABILPORE, Navsari, Navsari, Navsari", "place": "Navsari", "taluka": "Navsari", "licNo": "37366", "worker": "20", "hp": "100", "validYear": "2034"}, {"name": "THE AUTOMOBILES TRANSPORT SERVICE CO-OP.SOCIETY LTD.", "address": "KHURSHADWADI,NAVSARI, Navsari, Navsari, Navsari", "place": "Navsari", "taluka": "Navsari", "licNo": "3789", "worker": "20", "hp": "10", "validYear": "2031"}, {"name": "ANKIT PETROLEUM", "address": "Block No.1645,1646,1647, Vill-Alipore, Chikhali - Vansda Road, Alipor, Chikhli, Navsari", "place": "Alipor", "taluka": "Chikhli", "licNo": "23579", "worker": "20", "hp": "250", "validYear": "2035"}, {"name": "SHREE OM SAI AGRO", "address": "HOUSE NO. 2709, BLOCK NO. 1098 PAIKEE-2,VILLAGE KHUNDH, TALUKA : CHIKHLI, NAVSARI, TAL - CHIKHLI , DIST - NAVSARI , PIN - 396521, Khundh, Chikhli, Navsari", "place": "Khundh", "taluka": "Chikhli", "licNo": "27461", "worker": "20", "hp": "100", "validYear": "2020"}, {"name": "VISHAL AGRO PROCESSORS", "address": "BLOCK NO 932, OPP, CHIKHLI ROAD RLY STN, VILLAGE - DEGAM, Degam, Chikhli, Navsari", "place": "Degam", "taluka": "Chikhli", "licNo": "31105", "worker": "50", "hp": "250", "validYear": "2026"}, {"name": "SHREE SHYAM ENGINEERING WORKS", "address": "PLOT NO. 480 / 2 / B & 481 / 1, NEW G. I. D. C. KABILPORE, NAVSARI, Kabilpor, Navsari, Navsari, 396424", "place": "Kabilpor", "taluka": "Navsari", "licNo": "31508", "worker": "20", "hp": "50", "validYear": "2026"}, {"name": "SATYESH KNITWEAR PRIVATE LIMITED", "address": "PLOT NO.C1(G/F)&C2, AT UDYOG NAGAR, VIJALPORE, NAVSARI., Navsari, Navsari, Navsari, 396445", "place": "Navsari", "taluka": "Navsari", "licNo": "44688", "worker": "100", "hp": "100", "validYear": "2026"}, {"name": "JAGDAMBA FOOD PRODUCT", "address": "BLOCK/SR.NO:521/P/1 TO 521/P/4, VILLAGE: BHULA FALIYA,NAVSARI, Navsari, Navsari, Navsari, 396445", "place": "Navsari", "taluka": "Navsari", "licNo": "44901", "worker": "20", "hp": "250", "validYear": "2030"}, {"name": "SHREE KRISHNA ENTERPRISES", "address": "PLOT NO C/3, UDYOGNAGAR, VIJALPORE, NAVSARI., Vijalpor, Jalalpore, Navsari, 396445", "place": "Vijalpor", "taluka": "Jalalpore", "licNo": "46186", "worker": "50", "hp": "50", "validYear": "2030"}, {"name": "ARROW STITCH", "address": "PLOT NO. C/41, UDYOGNAGAR VIJALPORE,NAVSARI., Vejalpor, Navsari, Navsari, 396445", "place": "Vejalpor", "taluka": "Navsari", "licNo": "46317", "worker": "100", "hp": "100", "validYear": "2030"}, {"name": "SHREE SWASTIK RICE PRODUCT", "address": "CITY SR.NO. - NA102/1, Bhattai, Navsari, Navsari, 396427", "place": "Bhattai", "taluka": "Navsari", "licNo": "56480", "worker": "20", "hp": "500", "validYear": "2028"}, {"name": "SHREE SWASTIK FOOD PRODUCTS.", "address": "PLOT NO. 258/2, NASHILPOR, BARDOLI ROAD, NAVSARI., Nasilpor, Navsari, Navsari", "place": "Nasilpor", "taluka": "Navsari", "licNo": "3147", "worker": "20", "hp": "100", "validYear": "2009"}, {"name": "GANDEVI TALUKA KHEDOOT SAHAKARI SANGH.LTD.", "address": "AT & POST GANDEVI, Gandevi, Gandevi, Navsari", "place": "Gandevi", "taluka": "Gandevi", "licNo": "3577", "worker": "50", "hp": "50", "validYear": "2029"}, {"name": "SHREE SWASTIK AGRO PRODUCTS", "address": "Block No.97, At-Bhatai., Bhattai, Navsari, Navsari", "place": "Bhattai", "taluka": "Navsari", "licNo": "18475", "worker": "20", "hp": "250", "validYear": "2030"}, {"name": "KUSHAL AGRO INDUSTRIES", "address": "BLOCK NO.1975, AT. VILL.-SISODRA GANESH, Sisodra (ganesh), Navsari, Navsari", "place": "Sisodra (ganesh)", "taluka": "Navsari", "licNo": "30805", "worker": "50", "hp": "250", "validYear": "2027"}, {"name": "DHARTI AGRO PRODUCTS", "address": "BLOCK NO.96, NAVSARI-BARDOLI ROAD, Bhattai, Navsari, Navsari", "place": "Bhattai", "taluka": "Navsari", "licNo": "31708", "worker": "50", "hp": "250", "validYear": "2027"}, {"name": "SARVODAY SAW MILL.", "address": "CANNING FACTORY ROAD .GANDEVI., Gandevi, Gandevi, Navsari", "place": "Gandevi", "taluka": "Gandevi", "licNo": "3324", "worker": "20", "hp": "50", "validYear": "2026"}, {"name": "MILANO CNG STATION", "address": "PLOT NO.51/1, NAVSARI-GANDEVI ROAD, JAMALPORE, Jalalpore, Jalalpore, Navsari", "place": "Jalalpore", "taluka": "Jalalpore", "licNo": "12868", "worker": "20", "hp": "500", "validYear": "2030"}, {"name": "GSPC GAS COMPANY LTD", "address": "CNG Station At. Nandarkha, S.No.624/1+2/P, 631, Bilimora Road, Nandarkha, Gandevi, Navsari", "place": "Nandarkha", "taluka": "Gandevi", "licNo": "24180", "worker": "50", "hp": "250", "validYear": "2027"}, {"name": "ARIHANT PETROLEUM.", "address": "SR.NO.193/1,OPP.POWER HOUSE,N.H.NO.8, KABILPORE., Kabilpor, Navsari, Navsari", "place": "Kabilpor", "taluka": "Navsari", "licNo": "3619", "worker": "20", "hp": "250", "validYear": "2034"}, {"name": "ASHA METAL INDUSTRIES", "address": "PRAJAPATIWADI,VIJALPORE,NAVSARI, Vejalpor, Navsari, Navsari", "place": "Vejalpor", "taluka": "Navsari", "licNo": "3496", "worker": "20", "hp": "50", "validYear": "2032"}, {"name": "ROYAL SPECTRUM PVT.LTD.", "address": "PLOT NO.233/A & 233/B, 3RD PHASE, G.I.D.C., ANTALIA, BILIMORA, TA-GANDEVI, DIST-NAVSARI, Gidc antlia, Gandevi, Navsari", "place": "Gidc antlia", "taluka": "Gandevi", "licNo": "18478", "worker": "50", "hp": "500", "validYear": "2027"}, {"name": "Samved Bio Medical Waste Management.", "address": "Plot No.: 5, Ahmedabad-Mumbai Highway, Opp.Nirali Hospital, G.I.D.C.Kabilpore, At.: Kabilpore, Kabilpor, Navsari, Navsari, 396424", "place": "Kabilpor", "taluka": "Navsari", "licNo": "59491", "worker": "20", "hp": "250", "validYear": "2029"}, {"name": "NAIK FOUNDATION", "address": "BLOCK NO.1269,VILLAGE-ANDHEL, Endhal, Gandevi, Navsari", "place": "Endhal", "taluka": "Gandevi", "licNo": "10883", "worker": "250", "hp": "100", "validYear": "2030"}, {"name": "PRINCIPAL INDUSTRIAL TRAINING INSTITUTE", "address": "GANDEVI,BILIMORA., Bilimora, Gandevi, Navsari", "place": "Bilimora", "taluka": "Gandevi", "licNo": "4259", "worker": "250", "hp": "250", "validYear": "2015"}, {"name": "INDUSTRAL TRANING INSTITUTE", "address": "GANDEVA,KHAREL,CHIKHLI, Gandeva, Gandevi, Navsari", "place": "Gandeva", "taluka": "Gandevi", "licNo": "5176", "worker": "20", "hp": "100", "validYear": "2021"}, {"name": "MAHTMAGANDHI INSTITUTE OF TECHNICAL EDUCATION & RESEARCAL CENTRE.", "address": "B.NO-178, BHANUNAGAR-BHOOTSAR, Bhutsad, Jalalpore, Navsari", "place": "Bhutsad", "taluka": "Jalalpore", "licNo": "6698", "worker": "20", "hp": "50", "validYear": "2030"}, {"name": "J. P. ICE FACTORY", "address": "PLOT NO D- 28, UDYOGNAGAR, NAVSARI., Jalalpore, Jalalpore, Navsari", "place": "Jalalpore", "taluka": "Jalalpore", "licNo": "30843", "worker": "20", "hp": "250", "validYear": "2031"}, {"name": "KHODIYAR ICE FACTORY", "address": "PLOT NO 34, R/2 GIDC, ANTALIA BILIMORA, DIST- NAVSARI, Bilimora, Gandevi, Navsari, 396325", "place": "Bilimora", "taluka": "Gandevi", "licNo": "39224", "worker": "20", "hp": "250", "validYear": "2033"}, {"name": "JAY JALARAM ICE FACTORY", "address": "SHED NO.: C1/13, G.I.D.C., ANTALIYA, BILIMORA, Antaliya (CT), Gandevi, Navsari, 396325", "place": "Antaliya (CT)", "taluka": "Gandevi", "licNo": "52625", "worker": "20", "hp": "250", "validYear": "2025"}, {"name": "JAY HARSIDDHI ICE FACTORY", "address": "PLOT No. 42/2, G.I.D.C. ANTALIA, BILLIMORA TAL. GANDEVI DIST. NAVSARI, Antaliya (CT), Gandevi, Navsari, 396325", "place": "Antaliya (CT)", "taluka": "Gandevi", "licNo": "54150", "worker": "20", "hp": "100", "validYear": "2027"}, {"name": "MAA HARSIDDHI COLD STORAGE.", "address": "CITY SURVEY NO. NA 232/35. PLOT No. 35, SHARDA TEXPA 1, CANAL ROAD, BEHIND G.I.D.C. KABILPORE VILLAGE: SISODARA TAL.- NAVSARI. DIST.- NAVSARI., Sisodra (ganesh), Navsari, Navsari, 396463", "place": "Sisodra (ganesh)", "taluka": "Navsari", "licNo": "58239", "worker": "20", "hp": "250", "validYear": "2029"}, {"name": "CRYSTAL ICE FACTORY", "address": "PLOT No. 33/R, G.I.D.C. ANTALIYA, BILLIMORA. TAL.- GANDEVI DIST.- NAVSARI., Antaliya (CT), Gandevi, Navsari, 396325", "place": "Antaliya (CT)", "taluka": "Gandevi", "licNo": "59306", "worker": "20", "hp": "500", "validYear": "2028"}, {"name": "JALARAM ICE FACTORY", "address": "BLOCK NO.495,PLOT NO. 23 TO 28, VILLAGE-VAGRECH, Vaghrech, Gandevi, Navsari", "place": "Vaghrech", "taluka": "Gandevi", "licNo": "11169", "worker": "20", "hp": "100", "validYear": "2012"}, {"name": "MAHESH ICE FACTORY", "address": "C-44,UDHYOHNAGAR,NAVSARI, Navsari, Navsari, Navsari", "place": "Navsari", "taluka": "Navsari", "licNo": "3764", "worker": "20", "hp": "100", "validYear": "2026"}, {"name": "BHENKABHAI ICE FACTORY", "address": "VAKHARIA BANDER ROAD,BILIMORA., Bilimora, Gandevi, Navsari", "place": "Bilimora", "taluka": "Gandevi", "licNo": "4078", "worker": "20", "hp": "100", "validYear": "2023"}, {"name": "JAY HARISIDDHI ICE FACTORY", "address": "SARDAR MARKET ROAD,DEVSAR,BILIMORA., Bilimora, Gandevi, Navsari", "place": "Bilimora", "taluka": "Gandevi", "licNo": "4781", "worker": "20", "hp": "100", "validYear": "2025"}, {"name": "HARSIDHDHI ICE FACTORY.", "address": "PLOT NO. 478/2,NEW GIDC KABILPORE., Kabilpor, Navsari, Navsari", "place": "Kabilpor", "taluka": "Navsari", "licNo": "6338", "worker": "20", "hp": "100", "validYear": "2025"}, {"name": "NAVSARI VIJALPOR NAGAR PALIKA WATER FILTERATION PLANT (30MLD)", "address": "DUDHIYA TALAV,NAVSARI., Navsari, Navsari, Navsari", "place": "Navsari", "taluka": "Navsari", "licNo": "4125", "worker": "20", "hp": "1000", "validYear": "2025"}, {"name": "HARMONY INDUSTRIES.", "address": "BLOCK NO.:94 PAIKEE EAST SIDE, Arak, Jalalpore, Navsari, 396475", "place": "Arak", "taluka": "Jalalpore", "licNo": "52724", "worker": "50", "hp": "1000", "validYear": "2032"}, {"name": "MANGALAM WEAVETECH PRIVATE LIMITED", "address": "PLOT NO: 48 (AS PER SITE) PLOT NO: 21 (AS PER APPROVED PLAN) RAJHANS ZESTO, PHASE - 4, Kalakachha, Jalalpore, Navsari, 396415", "place": "Kalakachha", "taluka": "Jalalpore", "licNo": "57489", "worker": "250", "hp": "1000", "validYear": "2026"}, {"name": "SILVERLINE TECHNO SPIN LTD.", "address": "PLOT NO.216/A, 216/B & 217, GIDC KABILPORE, Kabilpor, Navsari, Navsari", "place": "Kabilpor", "taluka": "Navsari", "licNo": "8063", "worker": "100", "hp": "500", "validYear": "2030"}, {"name": "SUPREME AUTO", "address": "VILLAGE SAMROLI,KALAPUL,CHIKHLI., Samaroli, Chikhli, Navsari", "place": "Samaroli", "taluka": "Chikhli", "licNo": "3881", "worker": "50", "hp": "50", "validYear": "2030"}, {"name": "KATARIA  AUTOMOBILES  PVT. LTD.", "address": "PLOT NO. 891, OPP. HARI OM PAVA MILL, NR. GANESH SISODRA CHOKDI, N.H.NO.8., Sisodra (ganesh), Navsari, Navsari", "place": "Sisodra (ganesh)", "taluka": "Navsari", "licNo": "7019", "worker": "50", "hp": "100", "validYear": "2029"}, {"name": "KAIZAD INDUSTRIES.", "address": "DHARA NAGAR.OPP.SHEETAL HOTAL.AT.KABILPORE., Kabilpor, Navsari, Navsari", "place": "Kabilpor", "taluka": "Navsari", "licNo": "3323", "worker": "20", "hp": "50", "validYear": "2025"}, {"name": "RAGHUVANSHI MOTOR PVT.LTD.", "address": "REG.OFFICE.NEAR GRID,KABILPORE,NAVSARI., Kabilpor, Navsari, Navsari", "place": "Kabilpor", "taluka": "Navsari", "licNo": "3795", "worker": "50", "hp": "50", "validYear": "2030"}, {"name": "INAL MOTORS", "address": "CHIKHLI,BILIMORA ROAD,POST.MAJIGAM, Majigam, Chikhli, Navsari", "place": "Majigam", "taluka": "Chikhli", "licNo": "3761", "worker": "20", "hp": "50", "validYear": "2021"}];
// Column AC "Chemical Sub-Type New" of the factory sheet (NIC_2025_mujab.xlsx › Final Sheet), for ALL its rows:
const CHEM_BY_LIC = {"31512":"Others","43649":"Others","49685":"Others","50535":"Others","53366":"Others","59686":"Others","34826":"A","52505":"Others","9604":"Others","36591":"Others","57042":"Others","3321":"Others","3765":"Others","3791":"Others","3831":"Others","5321":"Others","8887":"Others","44482":"Others","51459":"Others","34485":"Others","45321":"Others","47975":"Others","50236":"Others","34835":"Others","35812":"Others","47974":"Others","34354":"Others","52277":"Others","1435":"Others","8933":"Others","3145":"Others","3192":"Others","3766":"Others","3883":"Others","49882":"Others","51660":"Others","48285":"Others","34355":"Others","34488":"Others","52502":"Others","58505":"Others","49917":"Others","34366":"Others","47145":"Others","50538":"Others","13021":"Others","13856":"Others","14002":"Others","4650":"A","9603":"Others","22470":"Others","52726":"Others","3445":"Others","3490":"Others","3895":"Others","39509":"Others","43369":"Others","51857":"Others","54028":"Others","59603":"Others","22749":"Others","30806":"Others","31102":"Others","33011":"Others","34490":"Others","45657":"Others","47475":"Others","50488":"Others","53472":"Others","53497":"Others","53947":"Others","3338":"B","3888":"B","4264":"C","4546":"A","21696":"C","59111":"Others","5242":"Others","7015":"Others","46759":"Others","13283":"Others","3438":"Others","18477":"Others","20713":"Others","3517":"C","3564":"B","3617":"C","3848":"C","17710":"C","18474":"C","31709":"C","47977":"C","51184":"C","52628":"C","21413":"Others","59488":"Others","47719":"Others","2075":"Others","2076":"Others","3591":"Others","3790":"Others","3152":"Others","3431":"Others","1085":"Others","1086":"Others","3519":"Others","30338":"Others","49450":"Others","57539":"Others","5375":"Others","6393":"Others","6413":"Others","7501":"Others","7535":"Others","9158":"Others","9606":"Others","10871":"Others","10873":"Others","10884":"Others","10885":"Others","10886":"Others","10888":"Others","13162":"Others","13262":"Others","13648":"Others","13857":"Others","13858":"Others","13956":"Others","14006":"Others","14008":"Others","14010":"Others","19496":"Others","19564":"Others","39964":"Others","7020":"Others","31064":"A","3402":"Others","4780":"Others","5703":"Others","10880":"Others","19620":"Others","3303":"Others","3307":"Others","3310":"Others","3339":"Others","3366":"Others","3371":"Others","3418":"Others","3495":"Others","3503":"Others","3507":"Others","3584":"Others","3759":"Others","3763":"Others","3769":"Others","3771":"Others","3785":"Others","3786":"Others","3870":"Others","3933":"Others","4249":"Others","4325":"Others","4529":"Others","4693":"Others","5728":"Others","5744":"Others","7550":"Others","9847":"Others","9849":"Others","9850":"Others","9852":"Others","11543":"Others","12256":"Others","14147":"Others","17717":"Others","43258":"B","4331":"C","22468":"C","20722":"Others","7021":"Others","7078":"Others","8858":"Others","44483":"Others","32199":"Others","55773":"Others","57640":"Others","58504":"Others","3190":"Others","7800":"Others","18536":"Others","21081":"Others","52723":"Others","47722":"C","54884":"C","36687":"C","36688":"C","50072":"C","2457":"Others","15176":"Others","520":"C","3252":"Others","3585":"Others","3337":"MAH","3404":"C","3432":"Others","3235":"Others","3437":"Others","3453":"Others","3533":"Others","4104":"Others","42717":"Others","35244":"C","55309":"Others","3578":"Others","8027":"Others","46084":"Others","37402":"Others","51659":"Others","3183":"Others","7040":"Others","7042":"Others","7355":"Others","3889":"Others","58986":"Others","31220":"Others","49686":"Others","57885":"Others","5217":"Others","3542":"Others","5792":"Others","7995":"Others","39996":"Others","46869":"Others","49491":"Others","52549":"Others","41645":"Others","42085":"Others","46752":"Others","52623":"Others","57642":"Others","58684":"Others","4689":"C","3893":"C","55414":"C","3292":"A","38012":"B","56801":"A","4136":"Others","7502":"Others","3365":"C","3540":"C","4074":"C","4791":"C","5374":"C","3891":"Others","58248":"Others","58877":"Others","3570":"Others","3843":"Others","1457":"Others","4691":"Others","18880":"Others","49617":"Others","7659":"Others","3311":"Others","4230":"Others","5198":"Others","49618":"Others","4779":"C","54314":"Others","39934":"Others","36592":"Others","39225":"Others","44080":"Others","31507":"Others","3223":"Others","3423":"Others","517":"Others","1439":"Others","3501":"MAH","3566":"B","3574":"B","4261":"B","3514":"A","4214":"C","4303":"C","4771":"B","36833":"Others","50036":"Others","785":"C","3770":"C","15151":"C","31106":"C","40168":"B","3187":"Others","18904":"Others","52276":"Others","5313":"C","39222":"C","40367":"B","34830":"Others","51186":"Others","55450":"Others","12363":"Others","18476":"Others","18535":"Others","3239":"Others","59732":"Others","53368":"Others","57044":"Others","3174":"Others","3434":"Others","3504":"Others","7498":"Others","7499":"Others","10363":"Others","21073":"Others","27142":"Others","47973":"Others","44481":"Others","2461":"Others","7463":"Others","7906":"Others","18899":"Others","18900":"Others","20714":"Others","20759":"Others","11170":"Others","55719":"Others","1060":"Others","3251":"Others","3497":"Others","4172":"Others","4285":"Others","4286":"Others","4801":"Others","8856":"Others","14159":"Others","18851":"Others","35910":"Others","34833":"Others","48897":"Others","53948":"Others","53950":"Others","54882":"Others","54883":"Others","58240":"Others","59687":"Others","55874":"C","35376":"Others","45045":"Others","5729":"Others","45322":"Others","975":"Others","3154":"Others","3678":"Others","3681":"Others","6798":"Others","39709":"Others","41644":"Others","42531":"Others","42532":"Others","45782":"Others","3315":"Others","3327":"Others","3936":"Others","4792":"Others","9605":"Others","11994":"Others","53952":"Others","58887":"Others","50533":"Others","50540":"Others","3572":"Others","4181":"Others","3193":"Others","4521":"Others","5715":"Others","21412":"Others","41235":"Others","54558":"Others","49939":"Others","50745":"Others","53668":"Others","55449":"Others","30339":"Others","58040":"Others","3389":"Others","37401":"Others","58871":"Others","29787":"B","3293":"C","3473":"B","3146":"Others","3179":"Others","4357":"Others","21821":"Others","40876":"Others","54559":"Others","34594":"A","8778":"Others","21082":"Others","30335":"Others","30956":"Others","38736":"Others","56255":"Others","58249":"Others","18809":"Others","39708":"Others","43139":"Others","3458":"Others","52275":"Others","45320":"Others","3367":"Others","3368":"Others","49252":"Others","51183":"Others","58716":"Others","59337":"Others","3144":"Others","44486":"Others","58238":"Others","3460":"B","19629":"C","37153":"Others","12503":"Others","53951":"Others","23580":"Others","24163":"Others","37154":"Others","43141":"Others","3386":"Others","3930":"Others","3934":"Others","4182":"Others","42142":"Others","49257":"Others","53671":"Others","59487":"B","18368":"Others","55872":"Others","3369":"A","41405":"Others","20710":"Others","21718":"Others","38733":"Others","46751":"Others","48649":"Others","49683":"Others","51178":"Others","51657":"Others","56481":"Others","3557":"Others","4250":"Others","34357":"Others","53670":"Others","786":"Others","3299":"Others","3393":"Others","3509":"Others","3757":"Others","3835":"Others","14143":"Others","50070":"Others","20708":"Others","21717":"Others","46187":"Others","34487":"Others","37152":"Others","57449":"Others","34832":"Others","49503":"Others","49872":"Others","53367":"Others","57502":"Others","57639":"Others","57886":"Others","57887":"Others","12875":"Others","5298":"Others","8700":"Others","17709":"Others","1069":"C","55775":"A","59490":"Others","40875":"Others","3184":"Others","3264":"Others","3320":"Others","3463":"Others","4651":"Others","5906":"Others","7536":"Others","11229":"Others","20704":"Others","3305":"Others","35919":"Others","40167":"Others","50852":"Others","3250":"Others","3317":"Others","3582":"Others","3583":"Others","17438":"Others","21125":"Others","27141":"Others","3291":"Others","35815":"Others","51185":"Others","58764":"Others","31505":"Others","12871":"Others","18534":"C","41133":"C","59762":"C","3421":"C","4778":"C","15027":"C","36834":"C","46191":"Others","46650":"Others","59110":"Others","3181":"Others","3196":"Others","3862":"Others","4381":"Others","17696":"Others","18745":"Others","18898":"Others","39702":"Others","39221":"C","3590":"Others","3928":"Others","4227":"Others","5310":"Others","38735":"C","53672":"Others","56794":"Others","57889":"Others","58683":"Others","59230":"Others","59303":"Others","3201":"Others","3245":"Others","3440":"Others","3538":"Others","31266":"Others","38734":"Others","51179":"Others","51458":"Others","53669":"Others","31218":"Others","31219":"Others","49251":"Others","50534":"Others","53949":"Others","54151":"Others","54881":"Others","58503":"Others","3887":"MAH","3351":"Others","7496":"Others","30803":"Others","43648":"C","52274":"Others","52570":"Others","52622":"Others","57504":"Others","57511":"Others","59604":"A","31513":"Others","3177":"Others","15153":"Others","52258":"Others","3502":"Others","3530":"Others","10965":"Others","31108":"Others","31511":"Others","37150":"Others","38738":"Others","39963":"Others","44082":"Others","52626":"Others","56252":"Others","21072":"Others","50747":"Others","52504":"Others","52624":"Others","54919":"Others","55021":"Others","55776":"Others","56253":"Others","56254":"Others","3346":"Others","16898":"Others","54807":"A","4312":"Others","59100":"A","50539":"Others","33589":"C","35503":"B","41139":"A","57041":"Others","3180":"Others","11259":"A","3306":"Others","18039":"Others","31101":"Others","48431":"Others","4514":"Others","4933":"Others","7010":"Others","7011":"Others","7013":"Others","7305":"Others","15154":"Others","21414":"Others","28134":"Others","28754":"Others","35405":"Others","49516":"Others","49585":"Others","50071":"Others","54027":"Others","57533":"Others","59411":"Others","3331":"C","49684":"Others","45658":"Others","3521":"Others","9851":"Others","12179":"Others","12501":"Others","12502":"Others","24142":"Others","34890":"Others","35389":"Others","37151":"Others","37933":"Others","38050":"Others","39965":"Others","41406":"Others","45405":"Others","45406":"Others","47476":"Others","47635":"Others","48899":"Others","54313":"Others","55873":"Others","56251":"Others","56257":"Others","57043":"Others","57501":"Others","4756":"Others","27140":"Others","43257":"Others","27462":"Others","3436":"Others","44177":"C","31104":"A","33586":"A","33588":"A","34361":"A","34363":"A","34391":"A","34480":"A","34481":"A","34482":"A","34483":"A","34484":"A","34486":"A","34489":"A","34491":"A","34823":"A","34825":"A","34827":"A","34836":"A","34891":"A","35374":"A","35375":"A","35813":"A","35814":"A","36604":"A","36835":"A","36934":"A","37403":"A","37761":"A","37934":"A","37935":"A","37936":"A","37937":"A","38049":"A","38560":"A","39703":"A","39704":"A","39705":"A","41131":"A","41132":"A","41134":"A","41137":"A","41138":"A","42086":"A","43140":"A","43142":"A","44081":"A","44415":"A","44902":"A","44903":"A","45029":"A","45511":"A","46085":"A","46749":"A","46750":"A","46753":"A","47636":"A","47720":"A","47721":"A","48405":"A","48648":"A","48898":"A","50069":"A","50536":"A","50746":"A","51187":"A","51658":"A","52503":"A","52627":"A","53369":"A","54730":"A","55022":"A","55308":"A","55310":"A","55735":"A","55871":"A","56482":"A","56790":"A","56791":"A","57503":"A","58630":"A","59304":"A","59761":"A","35323":"A","37366":"A","3789":"A","23579":"A","27461":"Others","31105":"Others","31508":"Others","44688":"Others","44901":"Others","46186":"Others","46317":"Others","56480":"Others","3147":"Others","3577":"Others","18475":"Others","30805":"Others","31708":"Others","3324":"Others","12868":"B","24180":"C","3619":"Others","3496":"Others","18478":"Others","59491":"Others","10883":"Others","4259":"Others","5176":"Others","6698":"Others","30843":"A","39224":"A","52625":"A","54150":"A","58239":"A","59305":"A","59306":"A","11169":"C","3764":"A","4078":"A","4781":"A","6210":"A","6338":"A","4125":"Others","52724":"Others","57489":"Others","8063":"Others","3881":"Others","7019":"Others","9602":"Others","3323":"Others","3795":"Others","3761":"Others"};
const CHEM_BY_NAME = {"rachana fluoro polymers":"Others","aditya timbers":"Others","raman eng. and plastic industries.":"Others","pam industrial plastics":"Others","om polymers":"Others","paras plastics":"Others","shree ram plastics":"A","shree ambica stone and wooden industries":"Others","farm food dehydrates pvt ltd.":"Others","somnath infrastructure":"Others","a. h. wadia boat builders":"Others","patson foods (india) pvt ltd.":"Others","manekpur vividh karyakari khedut sahakari mandali.ltd.":"Others","vedchha dambhar seva sahkari mandali.ltd.":"Others","kheti vikas seva sahakari mandali limited":"Others","shree navsari jalalpore taluka bagayat sahakari mandali ltd.":"Others","valsad navsari jilla fal ane shakbhaji sahakari sangh ltd.":"Others","kalptaru agro food products":"Others","green fiber foods (india) pvt.ltd.":"Others","pratik engineering corporation":"Others","kothari metal works pvt. ltd.":"Others","shree laxmi narayan die casting industries":"Others","bharat metal works":"Others","sharda industries":"Others","m/s roshan engineering (unit i)":"Others","patco brass products":"Others","surya exim limited.":"Others","aatmiya foods":"Others","surbhi wafers pvt. ltd.":"Others","parshwa foods (india) pvt. ltd.":"Others","mafatlal industries ltd (denim unit)":"Others","presspin products .":"Others","narmada engineering":"Others","enpee industries":"Others","shashwat enterprise":"Others","dhanhar masala bhandar pvt. ltd.":"Others","mcon rasayan pvt. ltd.":"Others","sai krupa enterprise":"Others","shree jalaram anodizer":"Others","bhagyashree enterprises":"Others","kaira machine tools pvt. ltd.":"Others","a j engineering":"Others","nutritius":"Others","s.p. farm.":"Others","rajmoti farm":"Others","farhin gur farm":"Others","patel farm manekpore.":"Others","patel farm manekpore..":"Others","natraj khandsari industries":"A","shivani industries.":"Others","avinash enterprise":"Others","kalpataru industries":"Others","goodluck garments pvt. ltd":"Others","tropical clothing co.pvt.ltd":"Others","cebon apparel pvt.ltd.":"Others","om sai garments":"Others","ecossential clothing pvt. ltd.":"Others","ginza industries limited":"Others","tropical clothing company private limited":"Others","shrijay poly cot pvt. ltd.":"Others","jm knitwear pvt. ltd.":"Others","shree kashi enterprises":"Others","rameshwar polymer":"Others","cebon apparel pvt. ltd.":"Others","laxee fabrics pvt. ltd.":"Others","shree maruti garments":"Others","aptech garments":"Others","promise garments":"Others","hepa lifestyle":"Others","shree radhe enterprise":"Others","selvok pharmaceutical co.":"B","yash laboratories":"B","b-tex ointment mfg.co.":"C","gufic biosciences limited.":"A","gufic biosciences limited, unit -2":"C","alufly industries llp.":"Others","sona extrusion pvt.ltd.":"Others","g. k. industries.":"Others","khodiyar industries":"Others","u.n.sons company":"Others","span heat transfer equipments mfrs pvt ltd":"Others","rolastar pvt.ltd.":"Others","hle glascoat limited. (unit-3)":"Others","nahar pharmaceuticals":"C","treffer pharmaceuticals":"B","dhanvantary health care":"C","nahar ayurvedic pharmacy":"C","vector biotek pvt.ltd.":"C","s.b.biotech herbals pvt.ltd.":"C","nezal herbocare pvt. ltd":"C","asian drugs and pharma":"C","s.b. biotech herbals pvt. ltd.":"C","ambrosia lab":"C","propylon products":"Others","athrees electronics pvt. ltd.":"Others","m/s. bionova solutions pvt. ltd.":"Others","k-electronics llp":"Others","kinjal electrical eng.works":"Others","sheetal electricals":"Others","nhb ball & roller ltd. (unit-2)":"Others","nhb ball & roller ltd":"Others","navdeep spg. & blanket mfg. industries":"Others","navdeep spg.& blanket mfg.industries":"Others","n. l. g. bricks":"Others","triple nine bricks factory":"Others","a k b bricks":"Others","parth bricks factory":"Others","triple nine bricks factory.":"Others","shree narayan bricks factory":"Others","h.m.bricks":"Others","jalaram bricks.":"Others","maa krupa bricks":"Others","s.r.p. bricks":"Others","abi-1 bricks":"Others","dnb bricks":"Others","tapi bricks":"Others","abi bricks":"Others","asb bricks":"Others","a.a.b. bricks":"Others","priti bricks":"Others","thakorbhai kalidas prajapati.":"Others","m/s. om bricks":"Others","sai bricks":"Others","c.v.b bricks.":"Others","om bricks..":"Others","sai bricks..":"Others","c.v.bricks..":"Others","misha bricks co.":"Others","hari om bricks":"Others","chirag bricks.co":"Others","magicrete building solutions pvt. ltd.":"Others","valsad dist-co.op.milk producers union limited":"A","umiya mosaic tiles":"Others","shree prabhukrupa tiles & marble co.":"Others","the new phenix pottery company":"Others","ajanta tiles":"Others","krishna cement products":"Others","rameshwar wood industries.":"Others","raj agro industries.":"Others","parasnath food products":"Others","shree swastik food products":"Others","haree aum agro industries":"Others","shree rushabh agro industries":"Others","devanshi food products.":"Others","dostee food products":"Others","shree kailash poha mill":"Others","roma food industries":"Others","vinayak food products":"Others","arihant food products.":"Others","shree jay ambe poha mill":"Others","nakoda agro industries":"Others","royal food products":"Others","shree kishan food proteins":"Others","shree vardhaman poha mill":"Others","shree subham food products":"Others","arvind food products":"Others","deep food products.":"Others","navkar food products":"Others","shiv food products":"Others","laxmi processing unit":"Others","krishna food products":"Others","shree gurunanak poha mill":"Others","padmavati food products":"Others","omkar food products":"Others","pritam agro pvt. ltd.":"Others","gayatri poha mill":"Others","bhavani food products":"Others","navsari valsad jilla pashuaahar utpadak sahkari mandli ltd":"Others","the winning edge agro products..":"Others","nilkanth agro products.":"Others","sun industries":"B","shiv enterprise":"C","mono chem":"C","raj cement products":"Others","ronak cement pvt. ltd.":"Others","parasmani industries.":"Others","balaji cement industries":"Others","elysium industries india pvt. ltd.":"Others","kailash packwell":"Others","vidhik prints pvt. ltd.":"Others","bhavya packaging solution":"Others","jyoti metal & mechenical industries":"Others","zaverchand dayaram kansara metal works.":"Others","planet power tools pvt. ltd.":"Others","shapoo tools":"Others","sanghvi impex":"Others","highbrow healthcare":"C","ratan detergent gruh udhyog":"C","rhythm chemicals":"C","aim sales corporation":"C","d & h engineering (bharat) pvt.ltd.":"Others","jyoti mech industries":"Others","mahavir organics pvt.ltd.":"C","flying book mfg co.":"Others","vikrant transformers":"Others","windson chemical private limited.":"MAH","raj chemical industries":"C","tirupati products":"Others","arvind engineering & metal workes.":"Others","shre somnath foundry":"Others","honest iron and steel private limited":"Others","ghelabhai gopalji & co.":"Others","arvind industries":"Others","aalidhra industries pvt ltd":"Others","rbm beverages":"C","j r foods and beverages":"Others","guddy wefers":"Others","navsari food products pvt. ltd.":"Others","ozico food":"Others","deep fresh frozen products":"Others","lucky food product company":"Others","gandevi vibhag vividh karyakari sahakari mandali ltd":"Others","kharel vibhag vividh karyakari sahakari mandli ltd.":"Others","dhanori seva sahakari mandli ltd.":"Others","vasundhara v.v.j.v.s.m.ltd.":"Others","vanil udhyog g.s.f.d.c.ltd.":"Others","unimaple modutech pvt. ltd.":"Others","asanjo furniture":"Others","zane industries pvt. ltd.":"Others","shree vishvakarma furniture mart.":"Others","perfect organic fertiliser":"Others","suraj jems":"Others","sempre international":"Others","uni design elite jewellery private limited":"Others","cdpl diamonds llp":"Others","mb diamonds llp":"Others","r.c. gems":"Others","parmes diamonds manufacturing llp":"Others","fancy mfg llp unit 2":"Others","reemz manufacturing llp":"Others","ramdev gems":"Others","ankit jewellers":"Others","uni-design elite jewellery pvt. ltd. (unit -ii)":"Others","vikas industries":"C","newpar aromatics llp":"C","sunbez speciality films pvt. ltd.":"C","bhavna indastries":"A","yashashvi rasayan private limited":"B","shree chemicals":"A","mark polymers":"Others","hari om industries.":"C","mistry shuttle industries":"C","ashish enterprise":"C","jenson veneers ply":"C","shree jyoti industrise":"C","virat industries ltd.":"Others","aarvit industries":"Others","shree ramji fab":"Others","world crafters":"Others","sai raj embroideries private limited":"Others","decent honest":"Others","bilimora engineers pvt.ltd":"Others","deep enterprise":"Others","prism mills limited":"Others","valsad dist. co-op. milk producers\" union ltd.":"Others","prime shuttles.":"Others","merchant industries":"Others","m/s. narsihdas morarji wadia":"Others","rathod pharmachem pvt ltd":"Others","neel nayan pharma pvt.ltd.":"C","acey controlflex engineering pvt. ltd.":"Others","ajay industries":"Others","khushi fabricators":"Others","jain metal":"Others","naz enterprise":"Others","new ganesh metal industries":"Others","acey engineering pvt ltd":"Others","durga indstries":"Others","reekvik chemicals":"Others","infichem pharma pvt.ltd":"Others","swastik oil products manufacturing navsari pvt. ltd.":"MAH","terzzet":"B","samruddhi enterprise":"B","choksey chemical industries":"B","nadod chemical ind.pvt.ltd.":"A","beta organic chemical ind.pvt.ltd.":"C","maxo products":"C","hle glascoat limited (chemical unit )":"B","satnam engineering works":"Others","aspee agro equipment private limited.":"Others","sagar veneer industries.":"C","kirti ply and doors":"C","aditya industries.":"C","jivyam plyboard co":"B","jai ambe biscuit backery & farsan products":"Others","jalaram gruh udyog":"Others","k. k. food processors":"Others","niu fba factory":"C","veritas health science pvt. ltd.":"C","b and b industries":"B","gautam metal traders":"Others","pii scientific":"Others","jai jalaram corporation":"Others","shasvat tools & superabrasives pvt.ltd.":"Others","bhavya tubes pvt.ltd.":"Others","tidan forging pvt.ltd.":"Others","ashok prestress":"Others","larsen and toubro limited.":"Others","sendstone pots pvt. ltd.":"Others","shree gayatri food and beverages":"Others","ropi industries.":"Others","shree surya packaging":"Others","mukul jamsons llp":"Others","noble offset":"Others","devdeep enterprise":"Others","kabir packaging":"Others","vidhik prints private limited":"Others","bhagvati food products.":"Others","patco flameproof equipments":"Others","techno grip":"Others","nova tech engineers.":"Others","jagjit engineering works":"Others","arushi steel industries":"Others","dipankit metal works":"Others","universal industries":"Others","jailaxmi engineering corporation":"Others","vidhee engg. works":"Others","techno craft":"Others","waaree energies limited":"Others","disti chemi metal works":"Others","em tech fabricators.":"Others","nainesh engineerng works":"Others","steel fabricators.":"Others","paresh engineering corporation. unit no, -1":"Others","paresh engineering corporation.unit. no. -2":"Others","anil (air) pollution controllers.":"Others","n. s. machine shop & engineering services":"Others","vktech precision engineering llp":"Others","multi plast industries":"Others","j.b.industries":"Others","avis metal industries ltd.":"Others","my choice home appliances":"Others","shiv engineering works":"Others","hutch industries private limited":"Others","nilkanth engineers":"Others","j d engineers":"Others","fibcom innovations llp":"Others","vardan industries india pvt. ltd.":"C","prerak enterprise":"Others","oilgear india private limited.":"Others","sanket milk agency & dairy farm":"Others","mayura furniture llp":"Others","super engineering works.":"Others","bipico industries (tools) private limited":"Others","hilti manufacturing india pvt. ltd. unit-3":"Others","hilti manufacturing india pvt. ltd. unit-1":"Others","hilti manufacturing indiapvt. ltd. ( unit iv)":"Others","peass industrial engineers pvt.ltd":"Others","renu bhumi engineering industries":"Others","peass industrial engineers private limited":"Others","n.m. patel and co.":"Others","peass industrial engineers pvt.ltd.":"Others","panama engineering company.":"Others","devguru capliners.":"Others","j. r. works":"Others","nanubhai mavjibhai patel":"Others","nmp equipment corporation.":"Others","naran lala pvt. ltd.":"Others","knits n knots industries pvt. ltd.":"Others","akshaykala industries private limited":"Others","hydromatic corporation":"Others","hydrotronics industries":"Others","rajkamal metal industries":"Others","surya spindle":"Others","pradip polifils pvt.ltd.":"Others","mamta iron works.":"Others","prakash industries":"Others","n i f mechanical works pvt. ltd.":"Others","rotech":"Others","pradip polyfils pvt. ltd. (unit-2)":"Others","tahoe foods and beverages pvt. ltd":"Others","exora beverages pvt. ltd.":"Others","vishvprabha foods private limited":"Others","jainam industries":"Others","bhukhanvala industries pvt. ltd.":"Others","land mark clays & minarals.":"Others","hifin saws and tools pvt.ltd":"Others","hi tech papers":"Others","jai petroleum":"B","beacon diagnostics pvt.ltd":"C","meridian enterprises. pvt.ltd.":"B","dinesh plastic products.":"Others","anand agro tech.":"Others","manish packaging pvt.ltd.":"Others","aditya timpack private limited":"Others","aareha elastin fibc pvt ltd.":"Others","om plast":"Others","autograph industries":"A","omega coats & plasts":"Others","dinesh plastic products":"Others","tansiddhi enterprises":"Others","leena enterprises":"Others","anil products":"Others","c-tel infra private limited":"Others","qrey primir llp":"Others","flexpro electricals pvt.ltd":"Others","flexpro electricals pvt ltd":"Others","paras. agro. plast. pvt. ltd.":"Others","shivanand frozen food products":"Others","jal enterprise":"Others","sharad micro die & engg. works.":"Others","sharad micro die and engineering works":"Others","aditya international packaging":"Others","trexo fab industries":"Others","aanshi weaves pvt. ltd.":"Others","peass industrial engineers pvt. ltd.":"Others","mukesh enterprise":"Others","eagle boss":"Others","super paints & oil industries":"B","sunlight paints pvt. ltd":"C","krishna dana chana":"Others","sundaram paper products pvt.ltd.":"Others","ecolates india pvt. ltd.":"Others","unique packaging":"Others","united craft industries":"Others","natraj industries":"Others","unique enterprises":"Others","j.p.biscuit bakery":"Others","k. k. biscuit bakery":"Others","new j. p. biscuit bakery":"Others","r. k. biscuit bakery":"Others","jmk food products":"Others","aa aromas":"B","trimurti enterprise":"Others","lamior pvt. ltd.":"Others","shree sainath photochem.":"A","eurasia agro foods private limited":"Others","shree ambica plast":"Others","nx pack pvt. ltd.":"Others","splenzo polyfab private limited":"Others","som industries":"Others","jay khodiyar poly print":"Others","cryston polyflex pvt. ltd.":"Others","g i polytech":"Others","khan polypack":"Others","shri somnath polytech private limited":"Others","aspee agro equipment pvt.ltd.":"Others","asian agrico industries":"Others","ravi plywood":"Others","adarsh food product":"Others","j.r.tiles trading company":"Others","om kameshwar cement articles.":"Others","peedee tiles":"Others","shiv shakti spun pipe industries":"Others","mahavir cement products.":"Others","banshidhar cement products":"Others","amit spun pipe & cement products":"Others","larsen and toubro limited":"Others","laxminarayan tiles":"Others","shivam tiles":"Others","hi-tech chem plast corporation":"Others","madhav cement product":"Others","vortex flex pvt. ltd":"Others","shree nathiji cement products":"Others","sarthi cement products":"Others","shri shyam infracon":"Others","shree aradhya buildcon":"Others","y. n. dhanani":"Others","vvf industries":"Others","mahavir cement products":"Others","mahavir cement pipe factory.":"Others","riddhhi paints":"Others","sunrise textile bearings":"Others","s.a.industries":"Others","r.k.metals":"Others","hi-shine inks pvt.ltd.":"C","r k detergent":"A","inkia inks pvt. ltd.":"Others","hi-shine inks pvt. ltd.":"Others","kweng magnadyne private limited":"Others","g & p engineering company":"Others","a. r. k. engineering enterprise":"Others","proto pumps & motors pvt.ltd.":"Others","laxmiprasad pumps pvt.ltd.":"Others","prakash pumps":"Others","mnf valves pvt. ltd.":"Others","kk pumps industries":"Others","shree ram metal industries":"Others","ohm enterprise.":"Others","pcm strescon overseas ventures limited.":"Others","qrego fabtech llp":"Others","riki rainwear":"Others","gadat v.v.karyakari sahakari khedut mandal ltd.":"Others","amalsad vibhag vividh karyakarri sahakari khedut mandali ltd.":"Others","sagar agro industries":"Others","shree narayan timber trading co":"Others","soma enterprise ltd.":"Others","ared chekkers":"Others","bhukhanvala .ceramics. pvt.ltd":"Others","m/s roshan engineering (unit - ii)":"Others","harsh polymer":"Others","shiv plastic products":"Others","ramdev chemical work":"Others","shree amar jyot timber mart":"C","omega laboratories":"C","gurukrupa industries":"C","rashik soap factory":"C","ratan soap factory":"C","dhanlaxmi shop factory":"C","rashik detergent gruh udyog.":"C","goldi sun private limited":"Others","becq renewables pvt.ltd.":"Others","reena enterprises":"Others","pratik engineering co.":"Others","sai sagar fabricators":"Others","thiese precision private limited":"Others","transtec overseas pvt.ltd":"Others","dnm engitech pvt.ltd.":"Others","shri shivam agrovet corporation":"Others","nilkanth sink llp":"C","c.r.k.engineering works":"Others","shivam timber mart":"Others","navbharat industries":"Others","mistry shuttle mfg.company pvt.ltd.":"Others","biogeny diagnostics pvt ltd":"C","shreeji clothing":"Others","adwyn peter":"Others","ambertex sekhsaria exports":"Others","aakanksha clothing.":"Others","unitribes lifestyle p. ltd.":"Others","hle glascoat limited. unit-1":"Others","hle glascoat limited. unit-2":"Others","mukund chmi engineering":"Others","technofeb engineering services":"Others","hle glascoat limited (unit-4)":"Others","technofab engineering services":"Others","hare krishna processor":"Others","timber trading co.":"Others","d. n. patel and sons":"Others","kwality wood crafts":"Others","united plywood industries":"Others","aakruti creations":"Others","rajveer flexo ply industries":"Others","aditya industries":"Others","paradise industries":"Others","ashirwad gallery":"Others","veerson industries":"Others","sahakari khand udyog mandal limited":"MAH","shree maroli vibhg khand udyog sahkari mandli ltd":"Others","vardhman silk mills":"Others","moon fibers":"Others","avtar dyeing and printing":"C","shree krishna silk":"Others","aakash yarn industries pvt. ltd.":"Others","dora industries pvt. ltd.":"Others","shivam art":"Others","shreeji creation":"Others","shree karni fabcom ltd.":"A","j k trading corporation":"Others","parmes diamonds exports pvt. ltd.":"Others","modern road makers pvt.ltd..":"Others","modern road makers pvt. ltd.":"Others","shreeji food products":"Others","shri ganesh agro industries":"Others","h.m.grains & pulses processing pvt.ltd.":"Others","creative wood industries":"Others","ganesh agro food products":"Others","shree saihasti agroproducts limited":"Others","om sai food products":"Others","shreenath namkeens":"Others","sri kailash marketing":"Others","jyoti industries":"Others","p.m. pavers":"Others","a1 gears":"Others","a k enterprise":"Others","mehta engineers and enterprise":"Others","bac pvt. ltd.":"Others","efra industries llp":"Others","roshan engineering":"Others","stellar adp private limited":"Others","gujarat state transport co.ltd":"Others","gujarat state transport co. ltd.":"Others","true colors pvt. ltd.":"A","mafatlal industries ltd. (textile division) navsari unit.":"Others","sunidhi spinning llp":"A","ihm agro foods pvt. ltd.":"Others","b b products ( prime cold storage )":"C","farm sons foods":"B","r. b. tradelinks llp.":"A","amalsad vibhag vividh karyakari sahakari khedut mandali ltd.":"Others","desai agrifoods private limited":"Others","purna frozen foods pvt ltd.":"A","shree datt aquaculture farms pvt. ltd .":"Others","shree datt aquaculture farms pvt. ltd":"Others","icedream global private limited":"Others","bhamji granites lllp":"Others","mahendra brothers exports pvt.ltd":"Others","purple diamond pvt. ltd. (unit-2)":"Others","kanksha manufacturing l l p":"Others","indigo diamoad pvt. ltd.":"Others","ultra filtech":"Others","rachel manufacturing & company.":"Others","osia gems pvt.ltd..":"Others","n. m. diam l.l.p":"Others","fancy mfg. llp. unit-1":"Others","pranami gems":"Others","ratnakala exports pvt ltd":"Others","h. k. diamonds":"Others","radhakrishna impex":"Others","nouveau diamonds manufacturing india llp.":"Others","ipd polishing works pvt. ltd.":"Others","forever gems":"Others","prime gems":"Others","classic coolents.":"C","the western india genuine ghee co. pvt. ltd.":"Others","krisha beveragies":"Others","devesh auto garage":"Others","tejpal motors pvt. ltd.":"Others","shalu automobile":"Others","raghuvanshi motors pvt.ltd.":"Others","raghuvanshi motors pvt. ltd.":"Others","navjivan cars pvt. ltd.":"Others","vijay automobiles":"Others","kataria automobiles pvt ltd":"Others","navjivan cars p. ltd.":"Others","navjivan automotive":"Others","kataria automobiles pvtltd":"Others","rathod cars private limited":"Others","surat motorcars llp":"Others","president automobiles":"Others","president motors":"Others","automark motors pvt. ltd.":"Others","presidency cars pvt. ltd.":"Others","surat motorcars llp.":"Others","navjivan trucks and buses":"Others","landmark automobiles ltd.":"Others","pramukh automotive pvt. ltd.":"Others","nanavati automotive":"Others","kataria automobiles pvt. ltd.":"Others","wadia boat builders":"Others","raghuvanshi motors private limited":"Others","ridham motors":"Others","thaakorgee industries":"Others","metro motors":"Others","hle glascoat ltd. (r and d center)":"C","maa krupa petroleum":"A","niraj automobiles ( deale i o c l )":"A","shree dutt petroleum":"A","omkar petroleum":"A","sahakari khand udyog mandal ltd ( dealer b p c l )":"A","jeevandhara petroleum":"A","gandevi taluka khedut sahakari sangh ltd.":"A","maa gayatri krupa service station ( deale i o c l )":"A","raj petroleum":"A","good will auto stores.":"A","abrama seva sahakari mandli ltd.( dealer i o c l )":"A","nagdhara vibhag vividh karyakari sahakari mandli ltd/ ( deale i o c l )":"A","kankuba petroleum ( dealer b p c l )":"A","hiren petroleum ( dealer essar oil ltd )":"A","dharma trading co":"A","taj automobiles":"A","c f shah & co":"A","pooja petroleum":"A","sharda petrolium":"A","param petroleum ( dealer hpcl )":"A","mehta & sons":"A","salej petroleum":"A","navkar petroleum product":"A","krishak petroleum":"A","shree sai vibhuti petroleum":"A","lotus petroleum ( deale h p c l )":"A","m/s ramesh & co":"A","ayush kisan seva kendra ( dealer i o c l )":"A","renuka automobiles":"A","shroff & co.":"A","gopalji & sons":"A","shroff and co.- bilimora":"A","shree rang petroleum ( delar bpcl )":"A","sahjanand petroleum":"A","urja petroleum":"A","m/s ranchhodji nagarji desai":"A","thakorbhai r. desai & co.":"A","prashansha petroleum":"A","laxmi petroleum":"A","monil petroleum":"A","reliance bp mobility limited":"A","hare krishna petroleum":"A","kautilya fuel station":"A","shiv shakti petroleum":"A","bapuji petroleum ( dealer b p c l )":"A","shri siddhi petroleum":"A","om sai petroleum":"A","seven eleven fuel centre":"A","shree siddhi vinayak petroleum":"A","dream petroleum":"A","haree om petroleum":"A","prabhu vinayak petroleum":"A","arha petroleum":"A","navsari petroleum":"A","shivshakti petroleum":"A","new bharat fuel station":"A","maalaxmi petroleun":"A","mittal petroleum":"A","shree kunj petroleum":"A","krishna petroleum":"A","gyani gas station":"A","haree om gas and fuel":"A","harsh petroleum":"A","shreeji petroleum":"A","sri satya sai petroleum":"A","keshar baa petroleum":"A","om petroleum":"A","bhagwati petroleum":"A","nisarg petroleum":"A","shivam petroleum":"A","mittal fuel station":"A","mogriba petroleum.":"A","aum filling station":"A","bhana automobiles":"A","vanita petroleum":"A","ambica petrolium":"A","furat enterprise":"A","haree shraddha petroleum":"A","amrut fuel station.":"A","sevak services":"A","navsari taluka sahkari kharid vechan sangh ltd":"A","the automobiles transport service co-op.society ltd.":"A","ankit petroleum":"A","shree om sai agro":"Others","vishal agro processors":"Others","shree shyam engineering works":"Others","satyesh knitwear private limited":"Others","jagdamba food product":"Others","shree krishna enterprises":"Others","arrow stitch":"Others","shree swastik rice product":"Others","shree swastik food products.":"Others","gandevi taluka khedoot sahakari sangh.ltd.":"Others","shree swastik agro products":"Others","kushal agro industries":"Others","dharti agro products":"Others","sarvoday saw mill.":"Others","milano cng station":"B","gspc gas company ltd":"C","arihant petroleum.":"Others","asha metal industries":"Others","royal spectrum pvt.ltd.":"Others","samved bio medical waste management.":"Others","naik foundation":"Others","principal industrial training institute":"Others","industral traning institute":"Others","mahtmagandhi institute of technical education & researcal centre.":"Others","j. p. ice factory":"A","khodiyar ice factory":"A","jay jalaram ice factory":"A","jay harsiddhi ice factory":"A","maa harsiddhi cold storage.":"A","crystal ice factory":"A","jalaram ice factory":"C","mahesh ice factory":"A","bhenkabhai ice factory":"A","jay harisiddhi ice factory":"A","harsidhdhi ice factory.":"A","navsari vijalpor nagar palika water filteration plant (30mld)":"Others","harmony industries.":"Others","mangalam weavetech private limited":"Others","silverline techno spin ltd.":"Others","supreme auto":"Others","kaizad industries.":"Others","raghuvanshi motor pvt.ltd.":"Others","inal motors":"Others"};
function getFactoryPlaceFor(ins){
  if(ins.factoryPlace && ins.factoryPlace.trim()) return ins.factoryPlace;
  const hit = lookupFactory(ins.factory);
  if(hit && hit.place) return hit.place;
  return ins.place || "";
}
// Chemical type for a case: the person's own entry if there is one, otherwise column AC of the factory sheet —
// found by licence no. first, then by exact factory name (only when every sheet row of that name agrees). Never a guess.
function chemTypeFor(ins){
  if(ins.chemType!==undefined && ins.chemType!==null) return String(ins.chemType);
  const lic = String(ins.licNo||'').trim();
  if(lic && CHEM_BY_LIC[lic]) return CHEM_BY_LIC[lic];
  const n = String(ins.factory||'').replace(/\s+/g,' ').trim().toLowerCase();
  return (n && CHEM_BY_NAME[n]) || '';
}
function lookupFactory(name){
  if(!name) return null;
  return FACTORY_DB.find(f=>f.name.trim().toLowerCase()===name.trim().toLowerCase()) || null;
}

function uid(){ return 'i'+Date.now()+Math.random().toString(36).slice(2,7); }
function todayISO(){ return new Date().toISOString().slice(0,10); }
// Text typed by people (names, addresses, remarks) goes into HTML attributes; a stray " or < in it used to
// cut the field short on screen. Always escape before putting it inside value="...".
function escAttr(v){ return String(v==null?'':v).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function toDMY(iso){ if(!iso) return "__/__/____"; const d=new Date(iso); return toGujNum(d.getDate())+"/"+toGujNum(d.getMonth()+1)+"/"+toGujNum(d.getFullYear()); }
function addDays(iso, n){ const d=new Date(iso); d.setDate(d.getDate()+n); return d.toISOString().slice(0,10); }
function daysBetween(a,b){ return Math.round((new Date(b)-new Date(a))/86400000); }
function buildLicenseSentence(){
  return `કારખાનાનુ લાયસન્સ નં. ${toGujNum(draft.licNo||'____')} છે જે ${toGujNum(draft.worker||'____')} કામદાર અને ${toGujNum(draft.hp||'____')} હોર્સપાવર માટે વર્ષ -${toGujNum(draft.validYear||'____')} સુધી રિન્યુ થયેલ જાણવા મળેલ છે.`;
}
// A count counts as "given" only if it is filled in and not zero.
function workerGiven(v){ const t = String(v==null?'':v).trim(); return t!=='' && !/^[0૦]+$/.test(t); }
// text inside the brackets after the total:  only males / only females / both ("અને"),
// and contract workers as "જે પૈકી N કોંટ્રાક્ટ પેટે".  '' when none of the three is given.
function workerBreakdownText(){
  const parts = [];
  if(workerGiven(draft.maleWorkers))   parts.push(`${toGujNum(draft.maleWorkers)} પુરુષ શ્રમયોગી`);
  if(workerGiven(draft.femaleWorkers)) parts.push(`${toGujNum(draft.femaleWorkers)} સ્ત્રી શ્રમયોગી`);
  let inner = parts.join(' અને ');
  if(workerGiven(draft.contractWorkers)) inner += (inner ? ' જે પૈકી ' : 'જે પૈકી ') + `${toGujNum(draft.contractWorkers)} કોંટ્રાક્ટ પેટે`;
  return inner;
}
const PROCESS_TAIL = () => `${draft.rawMaterial||'____'} નો ઉપયોગ કરી ${draft.machinery||'____'} ની મદદથી ${draft.finalProduct||'____'} બનાવવાની ઉત્પાદન પ્રક્રિયા કરવામાં આવે છે. જે “ઓક્યુપેશનલ સેફ્ટી, હેલ્થ એન્ડ વર્કીંગ કંડીશન્સ કોડ-૨૦૨૦” ની કલમ-૨(૧)(ઝેડઆઈ) મુજબની ઉત્પાદન પ્રક્રિયા છે. કારખાનું “ઓક્યુપેશનલ સેફ્ટી, હેલ્થ એન્ડ વર્કીંગ કંડીશન્સ કોડ-૨૦૨૦” ની કલમ-૨(૧)(ડબલ્યુ)(આઈ) હેઠળ પાત્ર છે.`;
function buildProcessSentence(){
  const inner = workerBreakdownText();
  const total = toGujNum(draft.totalWorkers||'____');
  const head = inner ? `કારખાનામાં કુલ ${total} શ્રમયોગી ( ${inner} ) શ્રમયોગી ની મદદથી` : `કારખાનામાં કુલ ${total} શ્રમયોગી ની મદદથી`;
  return `${head} ${PROCESS_TAIL()}`;
}
// the wording used before (kept only to recognise and re-word untouched, older saved sentences)
function legacyProcessSentence(){
  let inner = `${toGujNum(draft.maleWorkers||'____')} પુરુષ શ્રમયોગી અને ${toGujNum(draft.femaleWorkers||'____')} સ્ત્રી શ્રમયોગી`;
  if(draft.contractWorkers && draft.contractWorkers.trim()!==''){
    inner += ` અને ${toGujNum(draft.contractWorkers)} કોંટ્રાક્ટ પેટે`;
  }
  return `કારખાનામાં કુલ ${toGujNum(draft.totalWorkers||'____')} શ્રમયોગી ( ${inner} ) શ્રમયોગી ની મદદથી ${PROCESS_TAIL()}`;
}
function buildHazardSentence(){
  return `કારખાનામા કરવામા આવતી ઉત્પાદન પ્ર્ક્રિયા ધી ઓક્યુપેશનલ સેફ્ટી, હેલ્થ એન્ડ વર્કીંગ કંડીશન્સ કોડ ૨૦૨૦ ની કલમ '2(za)' અને ${draft.hazardScheduleNo||'Schedule-1'} મુજબ જોખમી ઉત્પાદન પ્રક્રિયા છે.`;
}
function buildMapApprovalSentence(){
  const base = `કારખાનાનાં નક્શા તા.${draft.mapApprovalDate? toDMY(draft.mapApprovalDate):'__/__/____'} ના રોજ નં. ${toGujNum(draft.mapApprovalNo||'____')} થી મંજુર થયેલ છે`;
  const revs = (draft.mapRevisions||[]).filter(r=>r.date||(r.no&&r.no.trim()));
  if(!revs.length) return base + '.';
  const revText = revs.map(r=>`તા.${r.date? toDMY(r.date):'__/__/____'} ના રોજ નં. ${toGujNum(r.no||'____')} થી`).join(' તથા ');
  return `${base} તથા ${revText} રીવાઈઝ્ડ વિથ એક્સ્ટેંશનથી મંજુર થયેલ હોવાનુ જણાયેલ છે.`;
}
function syncMapRemarkTop(){
  while(draft.remarks.length<3) draft.remarks.push("");
  draft.remarks[2] = buildMapApprovalSentence();
  const remarksBox = document.getElementById('remarksBox');
  if(remarksBox) renderRemarksEditor(remarksBox);
}
function renderMapRevEditor(container){
  if(!draft.mapRevisions) draft.mapRevisions=[];
  container.innerHTML = draft.mapRevisions.map((r,i)=>`
    <div class="remarkRow"><span>${i+1}.</span>
      <input type="text" data-i="${i}" class="mapRevDate dp-trigger" readonly placeholder="રીવાઈઝ્ડ નકશા તારીખ" value="${isoToDMYInput(r.date)}" style="flex:1;">
      <input type="text" data-i="${i}" class="mapRevNo" placeholder="રીવાઈઝ્ડ નકશા નં." value="${escAttr(r.no||'')}" style="flex:1;">
      <button class="btn small danger delMapRev" data-i="${i}">✕</button></div>`).join('');
  container.querySelectorAll('.mapRevDate').forEach(inp=>inp.onclick=e=>{
    const i=+e.target.dataset.i;
    openDatePicker(e.target, draft.mapRevisions[i].date, iso=>{ draft.mapRevisions[i].date=iso; e.target.value=isoToDMYInput(iso); syncMapRemarkTop(); });
  });
  container.querySelectorAll('.mapRevNo').forEach(inp=>inp.oninput=e=>{ draft.mapRevisions[+e.target.dataset.i].no=e.target.value; syncMapRemarkTop(); });
  container.querySelectorAll('.delMapRev').forEach(b=>b.onclick=e=>{ draft.mapRevisions.splice(+e.target.dataset.i,1); renderMapRevEditor(container); syncMapRemarkTop(); });
}
function stabFilled(o){ return !!(o.stabCompetentPerson && o.stabCompetentPerson.trim()!=='' && o.stabCertDate); }
// which remark slot holds which stability sentence: slots 3, 19, 22 in order
function stabSlotPlan(o){
  const items=[];
  if(stabFilled(o)) items.push('compliance');
  if(o.includeStabilityOffence) items.push('generic');
  if(o.includeStabilityLoadOffence) items.push('load');
  const plan={};
  [3,19,22].forEach((sl,i)=>{ plan[sl]=items[i]||null; });
  return plan;
}
function stabOffenceCount(o){ return (o.includeStabilityOffence?1:0)+(o.includeStabilityLoadOffence?1:0); }
function buildStabilityLoadOffenceSentence(){
  return `કારખાનાના કબજેદારશ્રીએ 'ધી ગુજરાત ઓક્યુપેશનલ સેફ્ટી, હેલ્થ એન્ડ વર્કિંગ કન્ડિશન્સ રૂલ્સ, ૨૦૨૫' ના નિયમ-૭૦(૨) મુજબ, કારખાનાની ઇમારત તથા તેના વિસ્તરણ, ફેરફાર અથવા વધારાના બાંધકામની માળખાકીય સલામતી (Structural Stability) અંગે નિયત ફોર્મમાં સક્ષમ વ્યક્તિ (Competent Person) દ્વારા આપવામાં આવેલ માન્ય સ્ટેબિલિટી સર્ટિફિકેટ (Stability Certificate) મેળવવાનો તથા માંગણી કરવામાં આવે ત્યારે નિરીક્ષણ માટે રજૂ કરવાનો રહે છે. તપાસણી દરમિયાન જાણવા મળ્યું કે કારખાનામાં નિયમ-૭૦(૨) મુજબ જરૂરી સ્ટેબિલિટી સર્ટિફિકેટ (Stability Certificate) કારખાનાના મકાન તેના ફ્લોર સહિત એક ચોરસ મીટર ક્ષેત્રફળમા કેટલુ વજન સહન કરી શકશે અને તેની સામે મુકવા ધારેલ વજન એક ચોરસ મીટરમા કેટલુ છે ત્યા કઈ રીતે બાંધકામ સલામત છે તેની ગણતરી સહિતની વિગત સ્ટેબીલીટી સર્ટીફીકેટ ઉપલબ્ધ નથી. વધુમાં, તપાસ દરમિયાન સક્ષમ વ્યક્તિ (Competent Person) દ્વારા જારી કરાયેલ સ્ટેબિલિટી સર્ટિફિકેટ અથવા અન્ય સંબંધિત દસ્તાવેજી પુરાવા કબજેદારશ્રી દ્વારા રજૂ કરવામાં આવેલ નથી. આમ કરીને કારખાનાના કબજેદારશ્રીએ 'ધી ગુજરાત ઓક્યુપેશનલ સેફ્ટી, હેલ્થ એન્ડ વર્કિંગ કન્ડિશન્સ રૂલ્સ, ૨૦૨૫' ના નિયમ-૭૦(૨) ની જોગવાઈનો ભંગ કરેલ છે.`;
}
function buildStabilityComplianceSentence(){
  return `કારખાનાના મકાન બાંધકામ અંગેનુ સ્ટેબીલીટી સર્ટીફીકેટ નિયામકશ્રી, ઔદ્યોગિક સલામતી અને સ્વાસ્થ્ય, ગુજરાત રાજ્ય અમદાવાદ દ્વારા માન્ય સક્ષમ વ્યક્તિ ${draft.stabCompetentPerson} પાસે નમુના નં.૩૨ માં તા.${toDMY(draft.stabCertDate)} ના રોજ મેળવેલ છે.`;
}
function buildStabilityOffenceSentence(){
  return `કારખાનાના કબજેદારશ્રીએ 'ધી ગુજરાત ઓક્યુપેશનલ સેફ્ટી, હેલ્થ એન્ડ વર્કિંગ કન્ડિશન્સ રૂલ્સ, ૨૦૨૫' ના નિયમ-૭૦(૧) મુજબ, કારખાનાની ઇમારત તથા તેના વિસ્તરણ, ફેરફાર અથવા વધારાના બાંધકામની માળખાકીય સલામતી (Structural Stability) અંગે નિયત ફોર્મમાં સક્ષમ વ્યક્તિ (Competent Person) દ્વારા આપવામાં આવેલ માન્ય સ્ટેબિલિટી સર્ટિફિકેટ (Stability Certificate) મેળવવાનો તથા માંગણી કરવામાં આવે ત્યારે નિરીક્ષણ માટે રજૂ કરવાનો રહે છે. તપાસણી દરમિયાન જાણવા મળ્યું કે કારખાનામાં નિયમ-૭૦(૧) મુજબ જરૂરી સ્ટેબિલિટી સર્ટિફિકેટ (Stability Certificate) મેળવવામાં આવેલ નથી/માન્ય સ્ટેબિલિટી સર્ટિફિકેટ ઉપલબ્ધ નથી. વધુમાં, તપાસ દરમિયાન સક્ષમ વ્યક્તિ (Competent Person) દ્વારા જારી કરાયેલ સ્ટેબિલિટી સર્ટિફિકેટ અથવા અન્ય સંબંધિત દસ્તાવેજી પુરાવા કબજેદારશ્રી દ્વારા રજૂ કરવામાં આવેલ નથી. આમ કરીને કારખાનાના કબજેદારશ્રીએ 'ધી ગુજરાત ઓક્યુપેશનલ સેફ્ટી, હેલ્થ એન્ડ વર્કિંગ કન્ડિશન્સ રૂલ્સ, ૨૦૨૫' ના નિયમ-૭૦(૧) ની જોગવાઈનો ભંગ કરેલ છે.`;
}
const LOGO1_B64 = "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";
const LOGO2_B64 = "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";
const GUJ_DIGITS = ['૦','૧','૨','૩','૪','૫','૬','૭','૮','૯'];
function formatNoticeNo(num){
  if(!num || !String(num).trim()) return 'મ.નિ./ ઔ.સ. અને સ્વા./નવ/______/૨૦૨૬';
  return `મ.નિ./ ઔ.સ. અને સ્વા./નવ/${toGujNum(num)}/૨૦૨૬`;
}
function toGujNum(n){ return String(n).split('').map(d=> /[0-9]/.test(d) ? GUJ_DIGITS[+d] : d).join(''); }
function buildWorkersSentence(){
  const rows = draft.workers.filter(w=>w.name.trim()||w.work.trim());
  if(!rows.length) return "";
  const th = 'style="border:1px solid #999;padding:4px;text-decoration:underline;"';
  const td = 'style="border:1px solid #999;padding:4px;"';
  const showHours = !!draft.includeOvertimeRemark;
  let table = `<table style="border-collapse:collapse;margin-top:6px;"><tr><th ${th}>ક્ર.નં</th><th ${th}>શ્રમયોગીનું નામ</th><th ${th}>કામનો પ્રકાર</th>${showHours?`<th ${th}>કામના કલાક</th>`:''}</tr>`;
  rows.forEach((w,i)=>{ table += `<tr><td ${td}>${toGujNum(i+1)}</td><td ${td}>${w.name}</td><td ${td}>${w.work}</td>${showHours?`<td ${td}>${w.hours||''}</td>`:''}</tr>`; });
  table += `</table>`;
  return `મુલાકાત સમયે નીચે જણાવેલા પુખ્તવયના શ્રમયોગીઓ ઉપરોક્ત સ્થળ પરના કારખાનામાં તેમના નામ સામે જણાવ્યા મુજબની ઉત્પાદન પ્રક્રિયામાં કામ કરતા જોવા મળેલ હતા.${table}`;
}
function buildTrainingSentence(){
  const rows = draft.workers.filter(w=>w.name.trim()||w.work.trim());
  const n = rows.length;
  const base1 = `કારખાનાના કબજેદારશ્રીએ 'ધી ગુજરાત ઓક્યુપેશનલ સેફ્ટી, હેલ્થ એન્ડ વર્કિંગ કન્ડિશન્સ રૂલ્સ, ૨૦૨૫' ના નિયમ-૧૪(૨)(બી) મુજબ, કારખાનામાં કાર્યરત દરેક શ્રમયોગીને 'ચીફ ઇન્સ્પેક્ટર-કમ-ફેસિલિટેટર ફોર ફેક્ટરીઝ' દ્વારા માન્યતા પ્રાપ્ત સંસ્થા પાસેથી આરોગ્ય અને કામમાં સલામતી (Health & Safety) બાબતની વાર્ષિક તાલીમ અપાવવાની રહે છે.`;
  const trailer = `શ્રમયોગીઓને રૂબરૂમાં પૂછપરછ કરતાં તેમણે જણાવેલ કે તેમને 'ચીફ ઇન્સ્પેક્ટર-કમ-ફેસિલિટેટર ફોર ફેક્ટરીઝ' દ્વારા માન્યતા પ્રાપ્ત સંસ્થા પાસેથી આરોગ્ય અને કામમાં સલામતી બાબતની વાર્ષિક તાલીમ આપવામાં આવેલ નથી. વધુમાં, તપાસ દરમિયાન સંબંધિત શ્રમયોગીઓને આવી તાલીમ આપવામાં આવેલ હોવાના કોઈ તાલીમ રેકોર્ડ (Training Record), હાજરી પત્રક (Attendance Sheet), તાલીમ પ્રમાણપત્ર (Training Certificate) અથવા અન્ય દસ્તાવેજી પુરાવા કબજેદારશ્રી/જવાબદાર વ્યક્તિ દ્વારા રજૂ કરવામાં આવેલ નથી. આમ કરીને કારખાનાના કબજેદારશ્રીએ 'ધી ગુજરાત ઓક્યુપેશનલ સેફ્ટી, હેલ્થ એન્ડ વર્કિંગ કન્ડિશન્સ રૂલ્સ, ૨૦૨૫' ના નિયમ-૧૪(૨)(બી) ની જોગવાઈનો`;
  if(n>0){
    const nn = String(n).padStart(2,'0');
    return `${base1} ઉપરોક્ત રીમાર્કસ નં.-6 ના ક્રમાંક ${toGujNum(1)} થી ${toGujNum(n)} માં દર્શાવેલ ${trailer}, સદરહુ ${toGujNum(nn)} શ્રમયોગી દીઠ અલગ-અલગ ભંગ કરેલ છે.`;
  }
  return `${base1} ${trailer} ભંગ કરેલ છે.`;
}
function buildAppointmentSentence(){
  const rows = draft.workers.filter(w=>w.name.trim()||w.work.trim());
  const n = rows.length;
  const base1 = `કારખાનાના કબજેદારશ્રીએ 'ધી ઓક્યુપેશનલ સેફ્ટી, હેલ્થ એન્ડ વર્કિંગ કન્ડિશન્સ કોડ, ૨૦૨૦' ની કલમ-૬(૧)(એફ) હેઠળ તથા તે હેઠળના 'ધી ગુજરાત ઓક્યુપેશનલ સેફ્ટી, હેલ્થ એન્ડ વર્કિંગ કન્ડિશન્સ રૂલ્સ, ૨૦૨૫' ના નિયમ-૧૦ મુજબ, કારખાનામાં કાર્યરત દરેક શ્રમયોગીને નિયત વિગતો સાથેનું નિમણૂક પત્ર (Appointment Letter) આપવાનું રહે છે.`;
  const trailer = `શ્રમયોગીઓને રૂબરૂમાં પૂછપરછ કરતાં તેમણે જણાવેલ કે તેમને નિમણૂક પત્ર આપવામાં આવેલ નથી અને તેઓ કારખાનામાં કાર્યરત છે. વધુમાં, તપાસ દરમિયાન સંબંધિત શ્રમયોગીઓને નિમણૂક પત્ર આપવામાં આવેલ હોવાના કોઈ દસ્તાવેજી પુરાવા કબજેદારશ્રી/જવાબદાર વ્યક્તિ દ્વારા રજૂ કરવામાં આવેલ નથી. આમ કરીને કારખાનાના કબજેદારશ્રીએ 'ધી ઓક્યુપેશનલ સેફ્ટી, હેલ્થ એન્ડ વર્કિંગ કન્ડિશન્સ કોડ, ૨૦૨૦' ની કલમ-૬(૧)(એફ) સાથે વાંચતા 'ધી ગુજરાત ઓક્યુપેશનલ સેફ્ટી, હેલ્થ એન્ડ વર્કિંગ કન્ડિશન્સ રૂલ્સ, ૨૦૨૫' ના નિયમ-૧૦ ની જોગવાઈનો`;
  if(n>0){
    const nn = String(n).padStart(2,'0');
    return `${base1} ઉપરોક્ત રીમાર્કસ નં.-6 ના ક્રમાંક ${toGujNum(1)} થી ${toGujNum(n)} માં દર્શાવેલ ${trailer}, સદરહુ ${toGujNum(nn)} શ્રમયોગી દીઠ અલગ-અલગ ભંગ કરેલ છે.`;
  }
  return `${base1} ${trailer} ભંગ કરેલ છે.`;
}
function buildIdCardSentence(){
  const rows = draft.workers.filter(w=>w.name.trim()||w.work.trim());
  const n = rows.length;
  const base1 = `કારખાનાના વ્યવસ્થાપકશ્રીએ 'ધી ઓક્યુપેશનલ સેફ્ટી, હેલ્થ એન્ડ વર્કિંગ કન્ડિશન્સ કોડ, ૨૦૨૦' તથા તે હેઠળના 'ધી ગુજરાત ઓક્યુપેશનલ સેફ્ટી, હેલ્થ એન્ડ વર્કિંગ કન્ડિશન્સ રૂલ્સ, ૨૦૨૫' ના નિયમ-૩૧(૧) મુજબ, કારખાનામાં કાર્યરત તમામ શ્રમયોગીઓને ફોટાવાળા ઓળખકાર્ડ (Identity Card) નમૂના નં.-૧૮ મુજબ આપવાના રહે છે.`;
  const trailer = `રૂબરૂમાં પૂછપરછ કરતા તેઓને ફોટાવાળા ઓળખકાર્ડ નમૂના નં.-૧૮ મુજબ અથવા અન્ય કોઈ માન્ય નમૂનામાં ઓળખકાર્ડ આપવામાં આવેલ નથી તથા તપાસ સમયે તે રજૂ કરવામાં આવેલ નથી. આમ, ઉપરોક્ત શ્રમયોગીઓને ફોટાવાળા ઓળખકાર્ડ આપ્યા સિવાય કામ પર રોકી રાખીને/કામ કરવા દઈને કારખાનાના વ્યવસ્થાપકશ્રીએ 'ધી ગુજરાત ઓક્યુપેશનલ સેફ્ટી, હેલ્થ એન્ડ વર્કિંગ કન્ડિશન્સ રૂલ્સ, ૨૦૨૫' ના નિયમ-૩૧(૧) ની જોગવાઈનો`;
  if(n>0){
    const nn = String(n).padStart(2,'0');
    return `${base1} કારખાનાની તપાસણી દરમિયાન ઉપરોક્ત રીમાર્કસ નં.-6 ના ક્રમાંક ${toGujNum(1)} થી ${toGujNum(n)} માં દર્શાવેલ શ્રમયોગીઓને ${trailer} સદરહુ ${toGujNum(nn)} શ્રમયોગી દીઠ અલગ-અલગ ભંગ કરેલ છે.`;
  }
  return `${base1} કારખાનાની તપાસણી દરમિયાન શ્રમયોગીઓને ${trailer} ભંગ કરેલ છે.`;
}
function buildLeaveCardSentence(){
  return `કારખાનાના મેનેજરશ્રીએ/નિયોજકશ્રીએ 'ધી ઓક્યુપેશનલ સેફ્ટી, હેલ્થ એન્ડ વર્કિંગ કન્ડિશન્સ કોડ, ૨૦૨૦' તથા તે હેઠળના 'ધી ગુજરાત ઓક્યુપેશનલ સેફ્ટી, હેલ્થ એન્ડ વર્કિંગ કન્ડિશન્સ રૂલ્સ, ૨૦૨૫' ના નિયમ-૩૩ મુજબ, કારખાનામાં કાર્યરત કામદારોને નિયત ફોર્મ નં.-૨૦ (Leave Card) મુજબનું રજાનું કાર્ડ આપવાનું રહે છે, જે સંબંધિત કામદારની માલિકીનું દસ્તાવેજ છે. કારખાનાની તપાસણી દરમિયાન જણાયેલ કે, કારખાનામાં કાર્યરત કામદારોને નિયત ફોર્મ નં.-૨૦ મુજબનું લીવ કાર્ડ આપવામાં આવેલ નથી તથા તે અંગેનો જરૂરી રેકોર્ડ તપાસ સમયે રજૂ કરવામાં આવેલ નથી. આમ, કારખાનાના મેનેજરશ્રી/નિયોજકશ્રીએ (Employer) 'ધી ઓક્યુપેશનલ સેફ્ટી, હેલ્થ એન્ડ વર્કિંગ કન્ડિશન્સ કોડ, ૨૦૨૦' ની જોગવાઈઓ સાથે વાંચતા 'ધી ગુજરાત ઓક્યુપેશનલ સેફ્ટી, હેલ્થ એન્ડ વર્કિંગ કન્ડિશન્સ રૂલ્સ, ૨૦૨૫' ના નિયમ-૩૩ ની જોગવાઈનો ભંગ કરેલ છે.`;
}
function buildAttendanceSentence(){
  return `કારખાનાના કબજેદારશ્રીએ 'ધી ઓક્યુપેશનલ સેફ્ટી, હેલ્થ એન્ડ વર્કિંગ કન્ડિશન્સ કોડ, ૨૦૨૦' તથા તે હેઠળના 'ધી ગુજરાત ઓક્યુપેશનલ સેફ્ટી, હેલ્થ એન્ડ વર્કિંગ કન્ડિશન્સ રૂલ્સ, ૨૦૨૫' ના નિયમ-૨૯(૧)(બી) મુજબ, કારખાનામાં કાર્યરત કામદારોની હાજરી અંગેનું નિયત ફોર્મ-૧૪ (Attendance Register/Muster Roll) માં રજિસ્ટર નિભાવવાનું રહે છે. કારખાનાની તપાસણી દરમિયાન જણાયેલ કે, સદરહુ ફોર્મ-૧૪ રજિસ્ટર નિભાવવામાં આવેલ નથી/નિયમ મુજબ પૂર્ણ અને અદ્યતન રાખવામાં આવેલ નથી તથા તપાસ સમયે નિરીક્ષણ માટે રજૂ કરવામાં આવેલ નથી. વધુમાં, તેમાં કામદારોના નામ, કામનું સ્વરૂપ, દૈનિક હાજરી તથા જરૂરી વિગતો નિયમ મુજબ નોંધવામાં આવેલ નથી. આમ, કારખાનાના કબજેદારશ્રીએ (Employer) 'ધી ઓક્યુપેશનલ સેફ્ટી, હેલ્થ એન્ડ વર્કિંગ કન્ડિશન્સ કોડ, ૨૦૨૦' ની જોગવાઈઓ સાથે વાંચતા 'ધી ગુજરાત ઓક્યુપેશનલ સેફ્ટી, હેલ્થ એન્ડ વર્કિંગ કન્ડિશન્સ રૂલ્સ, ૨૦૨૫' ના નિયમ-૨૯(૧)(બી) ની જોગવાઈનો ભંગ કરેલ છે.`;
}
function buildLwrSentence(){
  return `કારખાનાના મેનેજરશ્રીએ/નિયોજકશ્રીએ 'ધી ઓક્યુપેશનલ સેફ્ટી, હેલ્થ એન્ડ વર્કિંગ કન્ડિશન્સ કોડ, ૨૦૨૦' ની કલમ-૩૨ તથા તે હેઠળના 'ધી ગુજરાત ઓક્યુપેશનલ સેફ્ટી, હેલ્થ એન્ડ વર્કિંગ કન્ડિશન્સ રૂલ્સ, ૨૦૨૫' ના નિયમ-૩૨ મુજબ, કામદારોને આપવામાં આવેલ પગાર સહિતની રજાની વિગતો દર્શાવતું નિયત ફોર્મ નં.-૧૯ (Leave with Wages Register) માં રજિસ્ટર નિભાવવાનું તથા છેલ્લી નોંધ કર્યા બાદ ત્રણ વર્ષ સુધી તેનો રેકોર્ડ જાળવી રાખવાનો રહે છે. કારખાનાની તપાસણી દરમિયાન સને ${toGujNum(draft.lwrYear||'____')} વર્ષનું પગાર સહિતની રજાનું રજિસ્ટર તપાસ માટે માંગવા છતાં રજૂ કરવામાં આવેલ નથી તથા સદરહુ રજિસ્ટર નિયમ મુજબ અદ્યતન નિભાવેલ હોવાનું જણાયેલ નથી. વધુમાં, છેલ્લી નોંધ બાદ ત્રણ વર્ષ સુધીનો રેકોર્ડ જાળવી રાખેલ હોવાનું પણ જણાયેલ નથી. આમ, કારખાનાના મેનેજરશ્રી/નિયોજકશ્રીએ (Employer) 'ધી ઓક્યુપેશનલ સેફ્ટી, હેલ્થ એન્ડ વર્કિંગ કન્ડિશન્સ કોડ, ૨૦૨૦' ની કલમ-૩૨ સાથે વાંચતા 'ધી ગુજરાત ઓક્યુપેશનલ સેફ્ટી, હેલ્થ એન્ડ વર્કિંગ કન્ડિશન્સ રૂલ્સ, ૨૦૨૫' ના નિયમ-૩૨ ની જોગવાઈનો ભંગ કરેલ છે.`;
}
function buildAccidentRegSentence(){
  return `કારખાનાના મેનેજરશ્રીએ/નિયોજકશ્રીએ 'ધી ઓક્યુપેશનલ સેફ્ટી, હેલ્થ એન્ડ વર્કિંગ કન્ડિશન્સ કોડ, ૨૦૨૦' તથા તે હેઠળના 'ધી ગુજરાત ઓક્યુપેશનલ સેફ્ટી, હેલ્થ એન્ડ વર્કિંગ કન્ડિશન્સ રૂલ્સ, ૨૦૨૫' ના નિયમ-૩૬ મુજબ, કારખાનામાં બનેલા તમામ અકસ્માતો તથા જોખમી બનાવોની વિગતો દર્શાવતું નિયત ફોર્મ નં.-૨૨ (Register of Accident and Dangerous Occurrences) મુજબનું રજિસ્ટર નિભાવવાનું તથા તેને અદ્યતન રાખવાનું રહે છે. કારખાનાની તપાસણી દરમિયાન જણાયેલ કે, સદરહુ ફોર્મ નં.-૨૨ મુજબનું રજિસ્ટર નિભાવવામાં આવેલ નથી તથા તપાસ સમયે માંગવા છતાં નિરીક્ષણ માટે રજૂ કરવામાં આવેલ નથી. આમ, કારખાનાના મેનેજરશ્રી/નિયોજકશ્રીએ (Employer) 'ધી ઓક્યુપેશનલ સેફ્ટી, હેલ્થ એન્ડ વર્કિંગ કન્ડિશન્સ કોડ, ૨૦૨૦' ની જોગવાઈઓ સાથે વાંચતા 'ધી ગુજરાત ઓક્યુપેશનલ સેફ્ટી, હેલ્થ એન્ડ વર્કિંગ કન્ડિશન્સ રૂલ્સ, ૨૦૨૫' ના નિયમ-૩૬ ની જોગવાઈનો ભંગ કરેલ છે.`;
}
function buildCrecheSentence(){
  return `કારખાનાના કબજેદારશ્રીએ 'ધી ઓક્યુપેશનલ સેફ્ટી, હેલ્થ એન્ડ વર્કિંગ કન્ડિશન્સ કોડ, ૨૦૨૦' ની કલમ-૨૪(૩) તથા તે હેઠળના 'ધી ઓક્યુપેશનલ સેફ્ટી, હેલ્થ એન્ડ વર્કિંગ કન્ડિશન્સ (સેન્ટ્રલ) રૂલ્સ, ૨૦૨૬' ના નિયમ-૫૮ મુજબ, કારખાનામાં ઉત્પાદન પ્રક્રિયામાં ૫૦ થી વધુ શ્રમયોગીઓ રોકાયેલ હોય ત્યારે શ્રમયોગીઓના બાળકો માટે નિયત જોગવાઈઓ મુજબનું ઘોડિયાઘર (Crèche) બનાવવાનું અને નિભાવવાનું રહે છે.કારખાનાની તપાસણી દરમિયાન જણાયેલ કે, કારખાનામાં ઉત્પાદન પ્રક્રિયામાં ૫૦ થી વધુ શ્રમયોગીઓ રોકાયેલ છે, જેથી સદરહુ નિયમ-૫૮ ની જોગવાઈઓ કારખાનાને લાગુ પડે છે. તેમ છતાં, તપાસણી સમયે નિયમ-૫૮ મુજબની જરૂરી સુવિધાઓ સાથેનું ઘોડિયાઘર (Crèche) કારખાનામાં ઉપલબ્ધ હોવાનું જણાયેલ નથી.આમ, કારખાનાના કબજેદારશ્રીએ/વ્યવસ્થાપકશ્રીએ 'ધી ઓક્યુપેશનલ સેફ્ટી, હેલ્થ એન્ડ વર્કિંગ કન્ડિશન્સ કોડ, ૨૦૨૦' ની કલમ-૨૪(૩) સાથે વાંચતા 'ધી ઓક્યુપેશનલ સેફ્ટી, હેલ્થ એન્ડ વર્કિંગ કન્ડિશન્સ (સેન્ટ્રલ) રૂલ્સ, ૨૦૨૬' ના નિયમ-૫૮ ની જોગવાઈનો ભંગ કરેલ છે.`;
}
function buildCanteenSentence(){
  return `કારખાનાના કબજેદારશ્રીએ 'ધી ઓક્યુપેશનલ સેફ્ટી, હેલ્થ એન્ડ વર્કિંગ કન્ડિશન્સ કોડ, ૨૦૨૦' ની કલમ-૨૪(૧)(વી) તથા તે હેઠળના 'ધી ઓક્યુપેશનલ સેફ્ટી, હેલ્થ એન્ડ વર્કિંગ કન્ડિશન્સ (સેન્ટ્રલ) રૂલ્સ, ૨૦૨૬' ના નિયમ-૫૩ મુજબ, કારખાનામાં ઉત્પાદન પ્રક્રિયામાં ૧૦૦ કે તેથી વધુ શ્રમયોગીઓ રોકાયેલ હોય ત્યારે નિયત જોગવાઈઓ મુજબની કેન્ટીન (Canteen) ની સુવિધા ઉપલબ્ધ કરાવવાની રહે છે.કારખાનાની તપાસણી દરમિયાન જણાયેલ કે, કારખાનામાં ઉત્પાદન પ્રક્રિયામાં ૧૦૦ થી વધુ શ્રમયોગીઓ રોકાયેલ છે, જેથી સદરહુ નિયમ-૫૩ ની જોગવાઈઓ કારખાનાને લાગુ પડે છે. તેમ છતાં, તપાસણી સમયે નિયમ-૫૩ મુજબની જરૂરી સુવિધાઓ સાથેની કેન્ટીન (Canteen) કારખાનામાં ઉપલબ્ધ હોવાનું જણાયેલ નથી.આમ, કારખાનાના કબજેદારશ્રીએ/વ્યવસ્થાપકશ્રીએ 'ધી ઓક્યુપેશનલ સેફ્ટી, હેલ્થ એન્ડ વર્કિંગ કન્ડિશન્સ કોડ, ૨૦૨૦' ની કલમ-૨૪(૧)(વી) સાથે વાંચતા 'ધી ઓક્યુપેશનલ સેફ્ટી, હેલ્થ એન્ડ વર્કિંગ કન્ડિશન્સ (સેન્ટ્રલ) રૂલ્સ, ૨૦૨૬' ના નિયમ-૫૩ ની જોગવાઈનો ભંગ કરેલ છે.`;
}
function buildSafetyCommMissingSentence(){
  return `કારખાનાના કબજેદારશ્રીએ 'ધી ઓક્યુપેશનલ સેફ્ટી, હેલ્થ એન્ડ વર્કિંગ કન્ડિશન્સ કોડ, ૨૦૨૦' ની કલમ-૨૨(૧) હેઠળ તથા તે હેઠળના 'ધી ગુજરાત ઓક્યુપેશનલ સેફ્ટી, હેલ્થ એન્ડ વર્કિંગ કન્ડિશન્સ રૂલ્સ, ૨૦૨૫' ના નિયમ-૧૭(૧)(બી) મુજબ, 'ધી ઓક્યુપેશનલ સેફ્ટી, હેલ્થ એન્ડ વર્કિંગ કન્ડિશન્સ કોડ, ૨૦૨૦' ની પ્રથમ અનુસૂચિ (First Schedule) મુજબની હેઝાર્ડસ પ્રોસેસ (Hazardous Process) હાથ ધરતા તથા કારખાનામાં ૫૦ અથવા તેથી વધુ શ્રમયોગીઓ કાર્યરત હોય તેવા કારખાનામાં સેફ્ટી કમિટી (Safety Committee) ની રચના કરવાની રહે છે. તપાસણી દરમિયાન જાણવા મળ્યું કે કારખાનામાં થતી ઉત્પાદન પ્રક્રિયા 'ધી ઓક્યુપેશનલ સેફ્ટી, હેલ્થ એન્ડ વર્કિંગ કન્ડિશન્સ કોડ, ૨૦૨૦' ની પ્રથમ અનુસૂચિ (First Schedule) ના અનુક્રમ-${toGujNum(draft.hazardScheduleNo||'______')} મુજબની હેઝાર્ડસ પ્રોસેસ છે તથા કારખાનામાં કુલ ${toGujNum(draft.totalWorkers||'______')} શ્રમયોગીઓ કાર્યરત છે. તેમ છતાં, નિયમ-૧૭(૧)(બી) મુજબ સેફ્ટી કમિટી (Safety Committee) ની રચના કરવામાં આવેલ નથી. વધુમાં, તપાસ દરમિયાન સેફ્ટી કમિટીની રચના અંગેનો હુકમ (Constitution Order), સભ્યોની યાદી (Members List) અથવા અન્ય સંબંધિત દસ્તાવેજી પુરાવા કબજેદારશ્રી/જવાબદાર વ્યક્તિ દ્વારા રજૂ કરવામાં આવેલ નથી. આમ કરીને કારખાનાના કબજેદારશ્રીએ 'ધી ઓક્યુપેશનલ સેફ્ટી, હેલ્થ એન્ડ વર્કિંગ કન્ડિશન્સ કોડ, ૨૦૨૦' ની કલમ-૨૨(૧) સાથે વાંચતા 'ધી ગુજરાત ઓક્યુપેશનલ સેફ્ટી, હેલ્થ એન્ડ વર્કિંગ કન્ડિશન્સ રૂલ્સ, ૨૦૨૫' ના નિયમ-૧૭(૧)(બી) ની જોગવાઈનો ભંગ કરેલ છે.`;
}
function buildSafetyCommCompositionSentence(){
  return `કારખાનાના કબજેદારશ્રીએ 'ધી ઓક્યુપેશનલ સેફ્ટી, હેલ્થ એન્ડ વર્કિંગ કન્ડિશન્સ કોડ, ૨૦૨૦' ની કલમ-૨૨(૧) હેઠળ તથા તે હેઠળના 'ધી ગુજરાત ઓક્યુપેશનલ સેફ્ટી, હેલ્થ એન્ડ વર્કિંગ કન્ડિશન્સ રૂલ્સ, ૨૦૨૫' ના નિયમ-૧૮ મુજબ રચવામાં આવેલ સેફ્ટી કમિટી (Safety Committee) માં મેનેજમેન્ટ તથા શ્રમયોગીઓના સમાન પ્રતિનિધિત્વની જોગવાઈ જાળવવાની, શ્રમયોગી પ્રતિનિધિઓની નિયમ મુજબ પસંદગી અથવા નામાંકન કરવાની, સમિતિની નિયમિત બેઠકો યોજવાની, બેઠકની કાર્યવાહી નોંધ (Minutes of Meeting) તૈયાર કરી જાળવવાની તેમજ સમિતિના સભ્યોની યાદી (Members List) અને અન્ય સંબંધિત રેકોર્ડ નિયમ મુજબ નિભાવી ઉપલબ્ધ રાખવાની રહે છે. તપાસણી દરમિયાન જાણવા મળ્યું કે કારખાનામાં રચવામાં આવેલ સેફ્ટી કમિટી નિયમ-૧૮ મુજબની નિર્ધારિત રચના ધરાવતી નથી. વધુમાં, સમિતિમાં મેનેજમેન્ટ તથા શ્રમયોગીઓના સમાન પ્રતિનિધિત્વની જોગવાઈ જાળવવામાં આવેલ નથી તથા શ્રમયોગી પ્રતિનિધિઓની નિયમ મુજબ પસંદગી અથવા નામાંકન કરવામાં આવેલ નથી. ઉપરાંત, સમિતિની નિયમિત બેઠકો યોજવામાં આવેલ નથી તથા બેઠકની કાર્યવાહી નોંધ (Minutes of Meeting), સભ્યોની યાદી (Members List) અને અન્ય સંબંધિત રેકોર્ડ તપાસ દરમિયાન કબજેદારશ્રી/જવાબદાર વ્યક્તિ દ્વારા રજૂ કરવામાં આવેલ નથી. આમ કરીને કારખાનાના કબજેદારશ્રીએ 'ધી ઓક્યુપેશનલ સેફ્ટી, હેલ્થ એન્ડ વર્કિંગ કન્ડિશન્સ કોડ, ૨૦૨૦' ની કલમ-૨૨(૧) સાથે વાંચતા 'ધી ગુજરાત ઓક્યુપેશનલ સેફ્ટી, હેલ્થ એન્ડ વર્કિંગ કન્ડિશન્સ રૂલ્સ, ૨૦૨૫' ના નિયમ-૧૮ ની જોગવાઈઓનો ભંગ કરેલ છે.`;
}
function buildEmergencyPlanSentence(){
  return `કારખાનાના કબજેદારશ્રીએ 'ધી ઓક્યુપેશનલ સેફ્ટી, હેલ્થ એન્ડ વર્કિંગ કન્ડિશન્સ કોડ, ૨૦૨૦' ની કલમ-૮૪(૪) મુજબ, જોખમી પ્રક્રિયા (Hazardous Process) ધરાવતા કારખાનામાં ચીફ ઇન્સ્પેક્ટર-કમ-ફેસિલિટેટરની પૂર્વ મંજૂરીથી ઓન-સાઇટ ઇમરજન્સી પ્લાન (On-site Emergency Plan) તથા વિગતવાર ડિઝાસ્ટર કન્ટ્રોલ યોજના (Disaster Control Plan) તૈયાર કરવાની તથા તેની જાણકારી કારખાનામાં કાર્યરત શ્રમયોગીઓ તેમજ કારખાનાની આસપાસ વસતા સામાન્ય જનતાને આપવાની રહે છે.કારખાનાની તપાસણી દરમિયાન જણાયેલ કે, સદરહુ ઓન-સાઇટ ઇમરજન્સી પ્લાન તથા ડિઝાસ્ટર કન્ટ્રોલ યોજના તૈયાર કરવામાં આવેલ નથી તથા તેની જાણકારી/પ્રચાર-પ્રસાર કરવામાં આવેલ હોવાનું જણાયેલ નથી.આમ, કારખાનાના કબજેદારશ્રીએ 'ધી ઓક્યુપેશનલ સેફ્ટી, હેલ્થ એન્ડ વર્કિંગ કન્ડિશન્સ કોડ, ૨૦૨૦' ની કલમ-૮૪(૪) ની જોગવાઈનો ભંગ કરેલ છે.`;
}
function buildLicenceAmendSentence(){
  return `કારખાનાના મેનેજરશ્રીએ/નિયોજકશ્રીએ 'ધી ઓક્યુપેશનલ સેફ્ટી, હેલ્થ એન્ડ વર્કિંગ કન્ડિશન્સ કોડ, ૨૦૨૦' તથા તે હેઠળના 'ધી ગુજરાત ઓક્યુપેશનલ સેફ્ટી, હેલ્થ એન્ડ વર્કિંગ કન્ડિશન્સ રૂલ્સ, ૨૦૨૫' ના નિયમ-૭૬(૧) મુજબ, કારખાનાના નામ, સ્થળ, સ્થાપિત હોર્સ પાવર (Installed Horse Power), કામદારોની મહત્તમ સંખ્યા અથવા લાઇસન્સમાં દર્શાવેલ અન્ય વિગતોમાં ફેરફાર થાય ત્યારે ફેક્ટરી લાઇસન્સમાં જરૂરી સુધારો (Amendment of Factory Licence) કરાવવાનો રહે છે.કારખાનાની તપાસણી દરમિયાન જણાયેલ કે, લાઇસન્સમાં દર્શાવેલ વિગતોમાં ફેરફાર થયેલ હોવા છતાં ફેક્ટરી લાઇસન્સમાં જરૂરી સુધારો કરાવવામાં આવેલ નથી તથા આવા ફેરફાર અંગે મુખ્ય નિરીક્ષક-કમ-ફેસિલિટેટર/સંયુક્ત મુખ્ય નિરીક્ષક-કમ-ફેસિલિટેટર સમક્ષ નિયત અરજી કરવામાં આવેલ નથી. વધુમાં, સુધારેલ લાઇસન્સ તપાસ સમયે રજૂ કરવામાં આવેલ નથી. પરિણામે કારખાનું લાઇસન્સમાં નોંધાયેલ વિગતો વિરુદ્ધ પરિસ્થિતિમાં ચલાવવામાં આવતું હોવાનું જણાય છે.આમ, કારખાનાના મેનેજરશ્રીએ/નિયોજકશ્રીએ (Employer) 'ધી ઓક્યુપેશનલ સેફ્ટી, હેલ્થ એન્ડ વર્કિંગ કન્ડિશન્સ કોડ, ૨૦૨૦' ની જોગવાઈઓ સાથે વાંચતા 'ધી ગુજરાત ઓક્યુપેશનલ સેફ્ટી, હેલ્થ એન્ડ વર્કિંગ કન્ડિશન્સ રૂલ્સ, ૨૦૨૫' ના નિયમ-૭૬(૧) ની જોગવાઈનો ભંગ કરેલ છે.`;
}
function buildSafetyComm250Sentence(){
  return `કારખાનાના કબજેદારશ્રીએ 'ધી ઓક્યુપેશનલ સેફ્ટી, હેલ્થ એન્ડ વર્કિંગ કન્ડિશન્સ કોડ, ૨૦૨૦' ની કલમ-૨૨(૧) હેઠળ તથા તે હેઠળના 'ધી ગુજરાત ઓક્યુપેશનલ સેફ્ટી, હેલ્થ એન્ડ વર્કિંગ કન્ડિશન્સ રૂલ્સ, ૨૦૨૫' ના નિયમ-૧૭(૧)(સી) મુજબ, કારખાનામાં ૨૫૦ અથવા તેથી વધુ શ્રમયોગીઓ કાર્યરત હોય તેવા કારખાનામાં સેફ્ટી કમિટી (Safety Committee) ની રચના કરવાની રહે છે. તેમ છતાં, નિયમ-૧૭(૧)(સી) મુજબ સેફ્ટી કમિટી (Safety Committee) ની રચના કરવામાં આવેલ નથી. વધુમાં, તપાસ દરમિયાન સેફ્ટી કમિટીની રચના અંગેનો હુકમ (Constitution Order), સભ્યોની યાદી (Members List) અથવા અન્ય સંબંધિત દસ્તાવેજી પુરાવા કબજેદારશ્રી/જવાબદાર વ્યક્તિ દ્વારા રજૂ કરવામાં આવેલ નથી. આમ કરીને કારખાનાના કબજેદારશ્રીએ 'ધી ઓક્યુપેશનલ સેફ્ટી, હેલ્થ એન્ડ વર્કિંગ કન્ડિશન્સ કોડ, ૨૦૨૦' ની કલમ-૨૨(૧) સાથે વાંચતા 'ધી ગુજરાત ઓક્યુપેશનલ સેફ્ટી, હેલ્થ એન્ડ વર્કિંગ કન્ડિશન્સ રૂલ્સ, ૨૦૨૫' ના નિયમ-૧૭(૧)(સી) ની જોગવાઈનો ભંગ કરેલ છે.`;
}
function buildNewMapApprovalSentence(){
  return `ઉપરોક્ત કારખાનાના કબ્જેદાર વ્યવસ્થાપકશ્રી દ્વારા ધી ઓક્યુપેશનલ સેફટી, હેલ્થ એન્ડ વર્કિંગ કન્ડીશન્સ કોડ, ૨૦૨૦ની કલમ-૭૯ સાથે વાંચતા ધી ગુજરાત ઓક્યુપેશનલ સેફટી, હેલ્થ એન્ડ વર્કિંગ કન્ડીશન્સ રુલ્સ, ૨૦૨૫ ના નિયમ-૬૯(૧) મુજબ ઉપરોક્ત કારખાનાનું સ્થળ,મકાન બાંધકામ, મશીનરી લે-આઉટ સહિત ના નકશા નમૂના નં.૩૧ સાથે ફેક્ટરીઓના ચીફ ઇન્સ્પેક્ટર ક્રમ ફેસીલીટેટર ની કચેરીએ (નિયામકશ્રી, ઔદ્યોગિક સલામતી અને સ્વાસ્થ્ય,ગુજરાત રાજ્ય અમદાવાદ)/ સંયુક્ત નિયામકશ્રી, ઔધોગિક સલામતી અને સ્વાસ્થ્યની કચેરી,સુરત) ને અમારી કારખાનાની તા.${toDMY(draft.date)} ના રોજની મુલાકાત સુધીમાં કે આજ દિન સુધી નિયમો અનુસાર રજુ કરેલ નથી/મંજુર કરાવેલ નથી. આમ ઉપરોક્ત સ્થળ પરના કારખાનાના મકાન બાંધકામને કારખાના તરીકે વાપરવા અંગેની કારખાનાના ચીફ ઇન્સ્પેક્ટર કમ ફેસીલીટેટર,ગુજરાત રાજ્ય અમદાવાદની (નિયામકશ્રી, ઔદ્યોગિક સલામતી અને સ્વાસ્થ્ય ગુજરાત રાજ્ય અમદાવાદ)/કારખાનાના જોઈન્ટ ચીફ ઇન્સ્પેક્ટર ક્રમ ફેસીલીટેટર (સંયુકત નિયામકશ્રી, ઔદ્યોગિક સલામતી અને સ્વાસ્થ્ય, સુરત રીજીયન,સુરત)ની લેખિત પૂર્વ મંજૂરી નહીં મેળવ્યા છતાં, તેને કારખાના તરીકે વાપરવાનું ચાલુ રાખીને કારખાનાના કબ્જેદાર વ્યવસ્થાપકશ્રીએ ધી ગુજરાત ઓક્યુપેશનલ સેફટી, હેલ્થ એન્ડ વર્કિંગ કન્ડીશન્સ રુલ્સ, ૨૦૨૫ ના નિયમ-૬૯(૧) નો ભંગ કરેલ છે.`;
}
function buildLicenceApplicationSentence(){
  return `સદરહુ કારખાનાના કબ્જેદાર વ્યવસ્થાપકશ્રી દ્વારા ધી ઓક્યુપેશનલ સેફટી, હેલ્થ એન્ડ વર્કિંગ કન્ડીશન્સ કોડ, ૨૦૨૦ના નોટીફીકેશન બાદ ના દિન-૩૦ માં ધી ઓક્યુપેશનલ સેફટી હેલ્થ એન્ડ વર્કિંગ કન્ડીશન્સ કોડ, ૨૦૨૦ની કલમ-૭૯ સાથે વાચતાં. ફેક્ટરી લાયસન્સ અંગેની અરજી ધી ગુજરાત ઓક્યુપેશનલ સેફટી હેલ્થ એન્ડ વર્કિંગ કન્ડીશન્સ રુલ્સ,૨૦૨૫ ના નિયમ-૭૫(૧) મુજબ નમૂના નં.૩૩માં જરૂરી ફીના ચલણ સહિતની અરજી ફેક્ટરીઓના ચીફ ઇન્સ્પેક્ટર ક્રમ ફેસીલીટેટર, ઔધોગિક સલામતી અને સ્વાસ્થ્યની કચેરી, ગુજરાત રાજ્ય,અમદવાદ / જોઈન્ટ ચીફ ઇન્સ્પેક્ટર કમ ફેસીલીટેટર, ઔધોગિક સલામતી અને સ્વાસ્થ્યની કચેરી,સુરતને નિયમોઅનુસાર રજુ કરવાની જોગવાઈ છે. આમ કારખાનાના કબ્જેદારશ્રીએ ઉપર મુજબ સંસ્થાની કારખાનાનું લાયસન્સ મેળવવાની તથા નોંધણી સહિત અંગેની ફેક્ટરી લાયસન્સ અંગેની અરજી લેખિતમાં કે ઓનલાઈન અત્રેની કચેરીએ અમારી કારખાનાની તા.${toDMY(draft.date)} ના રોજની મુલાકાત સુધીમાં કે આજ દિન સુધીમાં નિયમોઅનુસાર કચેરીએ રજુ કરેલ નથી. આમ કારખાનાનું લાયસન્સ મેળવવા અંગેની અરજી અમારી કચેરીએ રજુ નહિં કરીને કારખાનાના કબ્જેદાર વ્યવસ્થાપકશ્રીએ ધી ગુજરાત ઓક્યુપેશનલ સેટી, હેલ્થ એન્ડ વર્કિંગ કન્ડીશન્સ રુલ્સ, ૨૦૨૫ ના નિયમ-૭૫(૧) નો ભંગ કરેલ છે.`;
}
function buildOvertimeSentence(){
  const n = draft.workers.filter(w=>w.name.trim()||w.work.trim()).length;
  const hrs = toGujNum((draft.overtimeHours||'').trim() || '____');
  const intro = n>0
    ? `કારખાનામાં અમારી તપાસણી સમયે તપાસ કરતા તેમજ રૂબરૂમાં કારખાનામાં ઉપરોક્ત રીમાર્કસ નં.-6 ના ક્રમાંક ${toGujNum(1)} થી ${toGujNum(n)} માં દર્શાવેલ શ્રમયોગીઓને પુછતા ઉપર મુજબના વેતન પત્રકની ચકાસણી કરતા જણાયેલ કે,`
    : `કારખાનામાં અમારી તપાસણી સમયે તપાસ કરતા તેમજ રૂબરૂમાં કારખાનામાં શ્રમયોગીઓને પુછતા વેતન પત્રકની ચકાસણી કરતા જણાયેલ કે,`;
  const who = n>0 ? 'ઉપરોક્ત શ્રમયોગીઓને' : 'શ્રમયોગીઓને';
  return `${intro} કારખાનામાં કામે રાખેલ કામદારોને દિવસના ${hrs} કલાક કામ કરાવતા હોવાનું જણાયેલ છે. ઓક્યુપેશનલ સેફ્ટી, હેલ્થ એન્ડ વર્કિંગ કન્ડિશન્સ કોડ, ૨૦૨૦ (OSH Code, 2020)ની કલમ-૨૫ (૧)(એ) મુજબ કારખાનામાં કામ કરતા શ્રમયોગીઓને દિવસના ૮ કલાક કરતા વધુ સમય માટે કામ કરાવી શકાય નહિ, કામ કરવાની પરવાનગી આપી શકાય નહિ. આમ ${who} દિવસના ૮ કલાકથી વધારે કામ કરાવીને, કામ કરવાની પરવાનગી આપીને કારખાનાના કબજેદારશ્રીએ/વ્યવસ્થાપકશ્રીએ, ઓક્યુપેશનલ સેફ્ટી, હેલ્થ એન્ડ વર્કિંગ કન્ડિશન્સ કોડ, ૨૦૨૦ (OSH Code, 2020)ની કલમ-૨૫ (૧)(એ)${n>0?' શ્રમયોગી દીઠ':''} ભંગ કરેલ છે.`;
}
function buildRevisedMapSentence(){
  return `ઉપરોક્ત કારખાનામા હયાતીની સ્થીતી જોતા કારખાનામા પ્લાંટ તથા લે-આઉટની સ્થીતી બદલાયેલ છે જેથી કબ્જેદાર વ્યવસ્થાપકશ્રી દ્વારા ધી ઓક્યુપેશનલ સેફટી, હેલ્થ એન્ડ વર્કિંગ કન્ડીશન્સ કોડ, ૨૦૨૦ની કલમ-૭૯ સાથે વાંચતા ધી ગુજરાત ઓક્યુપેશનલ સેફટી, હેલ્થ એન્ડ વર્કિંગ કન્ડીશન્સ રુલ્સ, ૨૦૨૫ ના નિયમ-૬૯(૧) મુજબ ઉપરોક્ત કારખાનાનું સ્થળ,મકાન બાંધકામ, મશીનરી લે-આઉટ બદલાય ત્યારે રીવાઈઝ્ડ નક્શા મંજુર કરાવવા જરૂરી છે જે કરેલ નથી. આમ કારખાનાના કબજેદારશ્રીએ 'ધી ગુજરાત ઓક્યુપેશનલ સેફ્ટી, હેલ્થ એન્ડ વર્કિંગ કન્ડિશન્સ રૂલ્સ, ૨૦૨૫' ના નિયમ- ૬૯(૧) ની જોગવાઈનો ભંગ કરેલ છે.`;
}
function buildProcessSentenceFull(){
  let s = buildProcessSentence();
  if(draft.includeHazardRemark){ s += " " + buildHazardSentence(); }
  return s;
}
const POINT_CHECKLIST = [
  {p:1, topic:"તપાસણી લાઈન", rule:"—"},
  {p:2, topic:"લાયસન્સ વિગત", rule:"—"},
  {p:3, topic:"ઉત્પાદન પ્રક્રિયા (+ જોખમી હોય તો)", rule:"કલમ-૨(૧)(ઝેડઆઈ), કલમ-૨(૧)(ડબલ્યુ)(આઈ) / જોખમી: કલમ-2(za) + Schedule"},
  {p:4, topic:"નકશા મંજૂરી", rule:"—"},
  {p:5, topic:"સ્ટેબિલિટી સર્ટિફિકેટ", rule:"નિયમ-૭૦(૧)"},
  {p:5, topic:"સ્ટેબિલિટી - લોડ કેલ્ક્યુલેશન", rule:"નિયમ-૭૦(૨)"},
  {p:6, topic:"શ્રમયોગી યાદી", rule:"—"},
  {p:7, topic:"સલામતીની તાલીમ", rule:"નિયમ-૧૪(૨)(બી)"},
  {p:8, topic:"નિમણૂક પત્ર", rule:"કલમ-૬(૧)(એફ) સાથે નિયમ-૧૦"},
  {p:9, topic:"ઓળખકાર્ડ", rule:"નિયમ-૩૧(૧)"},
  {p:10, topic:"લીવ કાર્ડ", rule:"નિયમ-૩૩"},
  {p:11, topic:"હાજરી રજિસ્ટર (ફોર્મ-૧૪)", rule:"નિયમ-૨૯(૧)(બી)"},
  {p:12, topic:"લીવ વિથ વેજીસ રજિસ્ટર (ફોર્મ-૧૯)", rule:"કલમ-૩૨ સાથે નિયમ-૩૨"},
  {p:13, topic:"અકસ્માત રજિસ્ટર (ફોર્મ-૨૨)", rule:"નિયમ-૩૬"},
  {p:14, topic:"ઘોડિયાઘર - Crèche (>50 શ્રમયોગી)", rule:"કલમ-૨૪(૩) સાથે નિયમ-૫૮"},
  {p:15, topic:"કેન્ટીન - Canteen (≥100 શ્રમયોગી)", rule:"કલમ-૨૪(૧)(વી) સાથે નિયમ-૫૩"},
  {p:16, topic:"સેફ્ટી કમિટી રચના નથી", rule:"કલમ-૨૨(૧) સાથે નિયમ-૧૭(૧)(બી)"},
  {p:17, topic:"સેફ્ટી કમિટી રચના યોગ્ય નથી", rule:"કલમ-૨૨(૧) સાથે નિયમ-૧૮"},
  {p:18, topic:"ઓન-સાઇટ ઇમરજન્સી પ્લાન નથી", rule:"કલમ-૮૪(૪)"},
  {p:19, topic:"લાઇસન્સ સુધારો (Amendment) નથી કરાવ્યો", rule:"નિયમ-૭૬(૧)"},
  {p:20, topic:"સેફ્ટી કમિટી રચના નથી (૨૫૦+ શ્રમયોગી)", rule:"કલમ-૨૨(૧) સાથે નિયમ-૧૭(૧)(સી)"},
  {p:21, topic:"નવા નકશા મંજૂર કરાવ્યા નથી", rule:"કલમ-૭૯ સાથે નિયમ-૬૯(૧)"},
  {p:22, topic:"ફેક્ટરી લાયસન્સ અરજી રજુ કરેલ નથી", rule:"કલમ-૭૯ સાથે નિયમ-૭૫(૧)"},
  {p:23, topic:"દિવસના ૮ કલાકથી વધુ કામ (ઓવરટાઇમ)", rule:"કલમ-૨૫(૧)(એ)"},
  {p:24, topic:"રીવાઈઝ્ડ નક્શા મંજૂર કરાવ્યા નથી", rule:"કલમ-૭૯ સાથે નિયમ-૬૯(૧)"}
];
function computeOffenceSummary(ins){
  // reads the generated remark TEXT itself (see classifyOffences/OFFENCE_REGISTRY above) rather than
  // trusting checkbox flags, so it stays correct even for records saved under an older code version.
  return classifyOffences(ins).map(x=>({p:x.p, topic:x.topic, rule:x.rule, count:x.nos}));
}
function buildOffenceSummaryHTML(ins){
  const list = computeOffenceSummary(ins);
  const total = list.reduce((a,b)=>a+b.count,0);
  let rows = list.map(r=>`<tr><td style="border:1px solid #999;padding:4px;text-align:center;">${r.p}</td><td style="border:1px solid #999;padding:4px;">${r.topic}</td><td style="border:1px solid #999;padding:4px;">${r.rule}</td><td style="border:1px solid #999;padding:4px;text-align:center;">${r.count}</td></tr>`).join('');
  return `<h3>ભંગોનો સારાંશ (Offence Summary)</h3><table style="border-collapse:collapse;width:100%;"><tr><th style="border:1px solid #999;padding:4px;">પોઈન્ટ</th><th style="border:1px solid #999;padding:4px;">વિષય</th><th style="border:1px solid #999;padding:4px;">નિયમ/કલમ નં.</th><th style="border:1px solid #999;padding:4px;">ભંગ સંખ્યા</th></tr>${rows}<tr><td colspan="3" style="border:1px solid #999;padding:4px;text-align:right;"><b>કુલ ભંગ</b></td><td style="border:1px solid #999;padding:4px;text-align:center;"><b>${total}</b></td></tr></table>`;
}
function refreshOffenceSummaryBox(){
  const box = document.getElementById('offenceSummaryBox');
  if(!box) return;
  const list = computeOffenceSummary(draft);
  const total = list.reduce((a,b)=>a+b.count,0);
  box.innerHTML = `<table class="diary"><tr><th>પોઈન્ટ</th><th>વિષય</th><th>નિયમ નં.</th><th>ભંગ સંખ્યા</th></tr>
    ${list.map(r=>`<tr><td>${r.p}</td><td class="wrap">${r.topic}</td><td class="wrap">${r.rule}</td><td>${r.count}</td></tr>`).join('')}
    <tr><td colspan="3" style="text-align:right;"><b>કુલ ભંગ</b></td><td><b>${total}</b></td></tr></table>`;
}
function letterFor(i){ return "અ બ ક ડ ઈ ફ ગ હ".split(" ")[i] || (i+1); }
function monthKey(iso){ return iso.slice(0,7); }
let activeDp = null;
function closeDatePicker(){ if(activeDp){ activeDp.remove(); activeDp=null; } }
document.addEventListener('click', e=>{
  if(activeDp && !activeDp.contains(e.target) && !e.target.classList.contains('dp-trigger')) closeDatePicker();
});
function openDatePicker(input, isoValue, onPick){
  closeDatePicker();
  const base = isoValue ? new Date(isoValue+'T00:00:00') : new Date();
  let viewY = base.getFullYear(), viewM = base.getMonth();
  const pop = document.createElement('div');
  pop.className = 'dp-popup';
  document.body.appendChild(pop);
  function render(){
    const first = new Date(viewY, viewM, 1);
    const startDow = first.getDay();
    const daysInMonth = new Date(viewY, viewM+1, 0).getDate();
    const todayIso = todayISO();
    const curYear = new Date().getFullYear();
    let yearOpts = '';
    for(let y=1990; y<=curYear+1; y++){ yearOpts += `<option value="${y}" ${y===viewY?'selected':''}>${y}</option>`; }
    let monthOpts = GUJ_MONTHS.map((m,i)=>`<option value="${i}" ${i===viewM?'selected':''}>${m}</option>`).join('');
    let html = `<div class="dp-header"><button type="button" class="dp-prev">‹</button><select class="dp-month">${monthOpts}</select><select class="dp-year">${yearOpts}</select><button type="button" class="dp-next">›</button></div><div class="dp-grid">`;
    ['ર','સો','મં','બુ','ગુ','શુ','શ'].forEach(d=>html+=`<div class="dp-wd">${d}</div>`);
    for(let i=0;i<startDow;i++) html += `<div></div>`;
    for(let d=1; d<=daysInMonth; d++){
      const iso = `${viewY}-${String(viewM+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      let cls = 'dp-day';
      if(iso===todayIso) cls+=' dp-today';
      if(iso===isoValue) cls+=' dp-selected';
      html += `<div class="${cls}" data-iso="${iso}">${d}</div>`;
    }
    html += `</div>`;
    pop.innerHTML = html;
    pop.querySelector('.dp-prev').onclick=()=>{ viewM--; if(viewM<0){viewM=11;viewY--;} render(); };
    pop.querySelector('.dp-next').onclick=()=>{ viewM++; if(viewM>11){viewM=0;viewY++;} render(); };
    pop.querySelector('.dp-month').onchange=e=>{ viewM=+e.target.value; render(); };
    pop.querySelector('.dp-year').onchange=e=>{ viewY=+e.target.value; render(); };
    pop.querySelectorAll('.dp-day[data-iso]').forEach(el=>{
      el.onclick=()=>{ onPick(el.dataset.iso); closeDatePicker(); };
    });
  }
  render();
  const rect = input.getBoundingClientRect();
  pop.style.left = (rect.left + window.scrollX) + 'px';
  pop.style.top = (rect.bottom + window.scrollY + 4) + 'px';
  activeDp = pop;
}
function isoToDMYInput(iso){ if(!iso) return ''; const [y,m,d]=iso.split('-'); return `${d}/${m}/${y}`; }
function dmyInputToISO(str){ if(!str) return null; const m = str.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/); if(!m) return null; const d=m[1].padStart(2,'0'), mo=m[2].padStart(2,'0'), y=m[3]; return `${y}-${mo}-${d}`; }

async function initCapabilities(){
  // window.claude is provided by legacy/shim.js and talks to this app's own API routes.
  try{
    if(typeof window.claude !== 'undefined' && window.claude && typeof window.claude.use === 'function'){
      try{ dbNS = await window.claude.use("db"); }catch(e){ dbNS=null; }
      try{ downloadsNS = await window.claude.use("downloads"); }catch(e){ downloadsNS=null; }
      try{ assetsNS = await window.claude.use("assets"); }catch(e){ assetsNS=null; }
      try{
        sampleNS = await window.claude.use("sample");
        if(sampleNS){ sampleCaps = await sampleNS.limits().catch(()=>null); }
      }catch(e){ sampleNS=null; sampleCaps=null; }
    }
  }catch(e){ downloadsNS=null; assetsNS=null; sampleNS=null; sampleCaps=null; }
}
async function loadAll(){
  if(!dbNS){ render(); return; }
  try{
    const insSnap = await dbNS.collection("inspections").get();
    state.inspections = (insSnap && insSnap.docs) ? insSnap.docs.map(d=>plain(d.data())) : [];
  }catch(e){}
  try{
    const diarySnap = await dbNS.collection("diary").get();
    state.diary = (diarySnap && diarySnap.docs) ? diarySnap.docs.map(d=>plain(d.data())) : [];
    // rename old follow-up visit wording on existing entries
    for(const d of state.diary){
      if(d.note==='સુધારા રીમાર્ક બાબતે મુલાકાત કરી'){ d.note='પુર્તતા અહેવાલ ચકાસણી'; try{ await saveDiaryEntry(d); }catch(e){} }
    }
  }catch(e){}
  try{ const s = await dbNS.doc("settings/officer").get(); if(s && s.data) settings = {...settings, ...plain(s.data())}; }catch(e){}
  render();
}
const saveChains = {}; // one per inspection id — stops a quick field edit (consultant/remark/...)
// and the "કન્ફર્મ કરી દફતરે મોકલો" save from racing and letting the wrong one land last.
async function saveInspection(ins){
  const idx = state.inspections.findIndex(x=>x.id===ins.id);
  if(idx>=0) state.inspections[idx]=ins; else state.inspections.push(ins);
  const prevChain = saveChains[ins.id] || Promise.resolve();
  const thisChain = prevChain.then(async ()=>{
    if(dbNS){ try{ await dbNS.doc("inspections/"+ins.id).set(ins); }catch(e){} }
  });
  saveChains[ins.id] = thisChain;
  await thisChain;
  await syncDiaryFromInspection(ins);
}
async function saveDiaryEntry(entry){
  const idx = state.diary.findIndex(x=>x.id===entry.id);
  if(idx>=0) state.diary[idx]=entry; else state.diary.push(entry);
  if(dbNS){ try{ await dbNS.doc("diary/"+entry.id).set(entry); }catch(e){} }
}
async function syncDiaryFromInspection(ins){
  if(!ins.date || !ins.factory) return;
  if(!ins.noticeNo || ins.status==='draft') return; // only outward-numbered cases go to diary
  let entry = state.diary.find(d=>d.linkedInspectionId===ins.id);
  if(!entry){ entry = { id:'d'+ins.id, linkedInspectionId: ins.id }; }
  entry.date = ins.date;
  entry.place = getFactoryPlaceFor(ins);
  entry.work = ins.factory;   // diary: factory name only (address deliberately left out)
  entry.note = ins.visitPurpose || "તપાસણી";
  entry.remarksPage = entry.remarksPage || "";
  entry.lawBreach = entry.lawBreach || "";
  await saveDiaryEntry(entry);
}
async function saveSettings(){
  if(dbNS){ try{ await dbNS.doc("settings/officer").set(settings); }catch(e){} }
}

function newDraft(){
  editReturnTab = null;
  draft = {
    id: uid(), date: todayISO(), noticeNo:"", caseType:"", factory:"", address:"", factoryPlace:"",
    inspectors: "શ્રી એચ.બી.પટેલ અને શ્રી જી.એલ.ઢાંકેચા",
    visitPurpose: "તપાસણી",
    licNo:"", worker:"", hp:"", validYear:"",
    totalWorkers:"", maleWorkers:"", femaleWorkers:"", contractWorkers:"",
    rawMaterial:"", machinery:"", finalProduct:"",
    hazardScheduleNo:"Schedule-1", includeHazardRemark:true,
    mapApprovalDate:"", mapApprovalNo:"", mapRevisions:[],
    stabCompetentPerson:"", stabCertDate:"", includeStabilityOffence:false, includeStabilityLoadOffence:false,
    workers: [{name:"", work:"", age:""}], includeTrainingRemark:false, includeAppointmentRemark:false, includeIdCardRemark:false, includeLeaveCardRemark:false, includeAttendanceRemark:false, includeLwrRemark:false, lwrYear:"", includeAccidentRegRemark:false, includeCrecheRemark:false, includeCanteenRemark:false,
    includeSafetyCommMissingRemark:false, includeSafetyCommCompositionRemark:false, includeEmergencyPlanRemark:false, includeLicenceAmendRemark:false, includeSafetyComm250Remark:false, includeNewMapApprovalRemark:false, includeLicenceApplicationRemark:false, includeOvertimeRemark:false, overtimeHours:"", includeRevisedMapRemark:false,
    remarks: ["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""], safetyPoints: [], includeSafetyOrder:false, includePenalty:true,
    presentPerson:"", ownerName:"", ownerAddress:"", ownerPhone:"", ownerEmail:"", consultant:"", summaryRemark:"", safetyAuthorize:"", complianceRefNos:"", place:"નવસારી",
    status:"draft", outwardDate:null, replyDeadline:null, replyDate:null, replyChecked:false, closedDate:null
  };
  draft.remarks[1] = buildProcessSentenceFull();
  draft.remarks[2] = buildMapApprovalSentence();
  draft.remarks[3] = "";
  draft.remarks[4] = buildWorkersSentence();
}
newDraft();

document.getElementById('tabs').addEventListener('click', e=>{
  const tabBtn = e.target.closest ? e.target.closest('button[data-tab]') : null;
  if(tabBtn){ try{ window.scrollTo(0,0); }catch(err){} activeTab=tabBtn.dataset.tab; document.querySelectorAll('#tabs button').forEach(b=>b.classList.toggle('active', b.dataset.tab===activeTab)); render(); }
});
// how many cases sit at each stage of the pipeline; amber = waiting for a reply, red = reply overdue
function updateNavCounts(){
  try{
    const list = (state && state.inspections) || [];
    const today = todayISO();
    const pending = list.filter(i=>i.status==='outward_sent');
    const overdue = pending.filter(i=>i.replyDeadline && i.replyDeadline < today).length;
    const put = (tab, n, cls, tip)=>{
      const el = document.querySelector('#tabs .tabcount[data-count="'+tab+'"]'); if(!el) return;
      el.textContent = n ? toGujNum(n) : '';
      el.className = 'tabcount' + (cls ? ' '+cls : '');
      el.style.display = n ? '' : 'none';
      el.title = tip || '';
    };
    put('new',      list.filter(i=>i.status==='draft').length, '', 'ડ્રાફ્ટ');
    put('pending',  pending.length, overdue ? 'danger' : 'warn', overdue ? (toGujNum(overdue)+' કેસની મુદત વીતી') : 'જવાબ બાકી');
    put('records',  list.filter(i=>i.status==='closed' && !i.daftareOutwardNo).length, '', 'દફતરે મોકલવાના બાકી');
    put('archived', list.filter(i=>i.status==='closed' && i.daftareOutwardNo).length, 'ok', 'બંધ થયેલા');
  }catch(e){}
}
// search box (+ optional quick-filter chips) above a list of case cards; filters by hiding cards,
// so every button on the cards keeps working exactly as before
function listToolbarHTML(chips){
  const c = (chips||[]).filter((x,i)=>i===0 || x.count>0);
  return '<div class="listbar"><input type="text" class="list-search" placeholder="ફેક્ટરીનું નામ શોધો...">' +
    (c.length>1 ? '<div class="chips">'+c.map((x,i)=>'<button type="button" class="chip'+(i===0?' active':'')+'" data-chip="'+x.key+'">'+x.label+' <b>'+toGujNum(x.count)+'</b></button>').join('')+'</div>' : '') +
    '<span class="list-count"></span></div>';
}
function wireListFilter(main){
  const input = main.querySelector('.list-search'); if(!input) return;
  const chips = [...main.querySelectorAll('.chip')];
  let chip = 'all';
  const apply = ()=>{
    const q = input.value.trim().toLowerCase();
    const items = [...main.querySelectorAll('.cardgrid > .item')];
    let shown = 0;
    items.forEach(el=>{
      const ok = (!q || (el.dataset.name||'').includes(q)) && (chip==='all' || el.dataset.state===chip);
      el.style.display = ok ? '' : 'none'; if(ok) shown++;
    });
    const cnt = main.querySelector('.list-count');
    if(cnt) cnt.textContent = (q || chip!=='all') ? (toGujNum(shown)+' / '+toGujNum(items.length)+' કેસ') : '';
  };
  input.oninput = apply;
  chips.forEach(c=>{ c.onclick = ()=>{ chip = c.dataset.chip; chips.forEach(x=>x.classList.toggle('active', x===c)); apply(); }; });
}
function refreshOptSummary(itemEl){
  const v = c => ((itemEl.querySelector(c)||{}).value||'').trim();
  const t = [v('.p-consultant'), v('.p-safetyauth'), v('.p-remark')].filter(Boolean).join(', ');
  const el = itemEl.querySelector('.optval'); if(el) el.textContent = t;
}
// ---------- correcting a case after it has gone out ----------
const CASE_TYPES = [['','ખાલી રાખો'],['કાનૂની બાબત','કાનૂની બાબત'],['ઈમ્પ્રુવમેન્ટ નોટીસ','ઈમ્પ્રુવમેન્ટ નોટીસ'],['નોટીસ','નોટીસ']];
function isEditingCase(){ return !!(draft && draft.status && draft.status!=='draft'); }
// the small "correct the numbers and dates" form that opens on a case card (fields depend on the stage)
function editPanelHTML(ins){
  const pending = ins.status==='outward_sent';
  const archived = ins.status==='closed' && !!ins.daftareOutwardNo;
  const closed = ins.status==='closed';
  const dateF = (label, cls, iso) => '<div><label>'+label+'</label><input type="text" class="'+cls+' dp-trigger" readonly value="'+escAttr(isoToDMYInput(iso))+'" placeholder="DD/MM/YYYY"></div>';
  const textF = (label, cls, v)  => '<div><label>'+label+'</label><input type="text" class="'+cls+'" value="'+escAttr(v||'')+'"></div>';
  let h = '<div class="optgrid">';
  h += dateF('ઇન્સ્પેક્શન તારીખ','ep-date',ins.date);
  h += '<div><label>કેસ પ્રકાર (નોટિસનું હેડિંગ)</label><select class="ep-casetype">'+CASE_TYPES.map(c=>'<option value="'+escAttr(c[0])+'"'+((ins.caseType||'')===c[0]?' selected':'')+'>'+c[1]+'</option>').join('')+'</select></div>';
  h += textF('આઉટવર્ડ નંબર (જા.નં.)','ep-noticeno',ins.noticeNo);
  h += dateF('આઉટવર્ડ તારીખ','ep-outdate',ins.outwardDate);
  if(pending) h += dateF('જવાબની મુદત','ep-deadline',ins.replyDeadline) + '<div class="hint full" style="margin:-2px 0 4px;">આઉટવર્ડ તારીખ બદલો અને મુદત જાતે ન બદલો તો મુદત આપોઆપ ૩૦ દિવસ પછીની થશે.</div>';
  if(closed){ h += textF('ઇનવર્ડ નંબર','ep-inwardno',ins.inwardNo); h += dateF('ઇનવર્ડ તારીખ','ep-inwarddate',ins.inwardDate); }
  if(archived){ h += textF('સુરત રિજિયન ક્રમાંક','ep-daftno',ins.daftareOutwardNo); h += dateF('સુરત આઉટવર્ડ તારીખ','ep-daftdate',ins.daftareOutwardDate); }
  h += '</div><div class="pc-actions"><button type="button" class="btn small ep-save">ફેરફાર સેવ કરો</button><button type="button" class="btn small secondary ep-cancel">રદ કરો</button><button type="button" class="btn small secondary ep-full">બધી વિગત ફોર્મમાં એડિટ કરો</button></div><div class="hint ep-msg"></div>';
  return '<div class="editPanel" style="display:none;">'+h+'</div>';
}
function wireEditPanel(itemEl, returnTab){
  const id = itemEl.dataset.id;
  const panel = itemEl.querySelector('.editPanel'); if(!panel) return;
  const first = state.inspections.find(x=>x.id===id); if(!first) return;
  const vals = { date:first.date||'', outdate:first.outwardDate||'', deadline:first.replyDeadline||'', inwarddate:first.inwardDate||'', daftdate:first.daftareOutwardDate||'' };
  const q = c => panel.querySelector('.'+c);
  ['date','outdate','deadline','inwarddate','daftdate'].forEach(k=>{
    const el = q('ep-'+k); if(!el) return;
    el.onclick = e=>openDatePicker(e.target, vals[k], iso=>{ vals[k]=iso; e.target.value = isoToDMYInput(iso); });
  });
  const toggle = itemEl.querySelector('.edit-case-btn');
  if(toggle) toggle.onclick = ()=>{ panel.style.display = panel.style.display==='none' ? 'block' : 'none'; };
  q('ep-cancel').onclick = ()=>{ panel.style.display = 'none'; };
  q('ep-full').onclick = ()=>openCaseInForm(id, returnTab);
  q('ep-save').onclick = async ()=>{
    const msg = q('ep-msg'), btn = q('ep-save');
    const ins = state.inspections.find(x=>x.id===id); if(!ins) return;
    const noEl = q('ep-noticeno');
    const noticeNo = noEl ? noEl.value.trim() : ins.noticeNo;
    if(!vals.date){ msg.textContent = 'ઇન્સ્પેક્શન તારીખ પસંદ કરો.'; return; }
    if(noEl && !noticeNo){ msg.textContent = 'આઉટવર્ડ નંબર ખાલી ન રાખી શકાય.'; return; }
    if(q('ep-outdate') && !vals.outdate){ msg.textContent = 'આઉટવર્ડ તારીખ પસંદ કરો.'; return; }
    const outwardChanged = vals.outdate !== (ins.outwardDate||'');
    const deadlineEdited = !!q('ep-deadline') && vals.deadline !== (ins.replyDeadline||'');
    ins.date = vals.date;
    ins.caseType = q('ep-casetype').value;
    if(noEl){ ins.noticeNo = noticeNo; ins.outwardDate = vals.outdate; }
    if(q('ep-deadline')) ins.replyDeadline = deadlineEdited ? vals.deadline : (outwardChanged ? addDays(vals.outdate, 30) : ins.replyDeadline);
    if(q('ep-inwardno')){ ins.inwardNo = q('ep-inwardno').value.trim(); if(vals.inwarddate){ ins.inwardDate = vals.inwarddate; ins.replyDate = vals.inwarddate; } }
    if(q('ep-daftno')){ const v = q('ep-daftno').value.trim(); if(v) ins.daftareOutwardNo = v; if(vals.daftdate) ins.daftareOutwardDate = vals.daftdate; }
    btn.disabled = true; msg.textContent = 'સેવ થાય છે...';
    try{ await saveInspection(ins); render(); }
    catch(e){ btn.disabled = false; msg.textContent = 'સેવ થયું નહીં, ફરી પ્રયાસ કરો.'; }
  };
}
// opens a case that is already in પડતર / દફતર / બંધ કેસ in the full form; saving updates that same case
function openCaseInForm(id, returnTab){
  const ins = state.inspections.find(x=>x.id===id); if(!ins) return;
  draft = {...ins,
    remarks:[...(ins.remarks||[])], safetyPoints:[...(ins.safetyPoints||[])],
    workers:(ins.workers||[]).map(w=>({...w})), mapRevisions:(ins.mapRevisions||[]).map(r=>({...r}))};
  editReturnTab = returnTab || 'pending';
  repairDraftSlots();
  setTab('new');
}
function editBannerHTML(){
  if(!isEditingCase()) return '';
  const st = draft.status==='outward_sent' ? 'પડતર' : (draft.daftareOutwardNo ? 'બંધ કેસ' : 'દફતર');
  return '<div class="card editbanner"><div><b>✎ એડિટ મોડ</b> — '+escAttr(draft.factory||'')+' <span class="badge warn">'+st+'</span>' +
    '<div class="hint">ફેરફાર સેવ કરશો તો આ જ કેસ અપડેટ થશે, નવો કેસ નહીં બને. આઉટવર્ડ / ઇનવર્ડ નંબર-તારીખ સુધારવા કાર્ડ પરનું "એડિટ" વાપરો.</div></div>' +
    '<button type="button" class="btn small secondary" id="cancel-case-edit">રદ કરો</button></div>';
}
// light / dark: both choices are always visible in the top bar; the choice is kept on this device
// (with none made yet, the device's own light/dark setting is followed)
function effectiveDark(){
  const a = document.documentElement.getAttribute('data-theme');
  return a==='dark' || (!a && !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches));
}
function applyTheme(t){
  try{
    const r = document.documentElement;
    if(t==='dark' || t==='light') r.setAttribute('data-theme', t); else r.removeAttribute('data-theme');
    const dark = effectiveDark();
    document.querySelectorAll('.themeopt').forEach(b=>{
      const on = (b.dataset.mode==='dark') === dark;
      b.classList.toggle('active', on); b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }catch(e){}
}
(function initTheme(){
  try{
    let saved = null; try{ saved = localStorage.getItem('theme'); }catch(e){}
    applyTheme(saved);
    document.querySelectorAll('.themeopt').forEach(b=>{
      b.onclick = ()=>{ const m = b.dataset.mode; try{ localStorage.setItem('theme', m); }catch(e){} applyTheme(m); };
    });
  }catch(e){}
})();
function setTab(t){ try{ window.scrollTo(0,0); }catch(err){} activeTab=t; document.querySelectorAll('#tabs button').forEach(b=>b.classList.toggle('active', b.dataset.tab===t)); render(); }

function statusBadge(ins){
  if(ins.status==='draft') return '<span class="badge warn">ડ્રાફ્ટ</span>';
  if(ins.status==='outward_sent'){
    const left = daysBetween(todayISO(), ins.replyDeadline);
    if(left<0) return '<span class="badge danger">મુદત વીતી ('+Math.abs(left)+' દિવસ)</span>';
    if(left===0) return '<span class="badge danger">આજે છેલ્લો દિવસ!</span>';
    if(left<=5) return '<span class="badge danger">જવાબ બાકી ('+left+' દિવસ)</span>';
    if(left<=10) return '<span class="badge warn">જવાબ બાકી ('+left+' દિવસ)</span>';
    return '<span class="badge ok">જવાબ બાકી ('+left+' દિવસ)</span>';
  }
  if(ins.status==='closed') return '<span class="badge ok">પૂર્ણ / દફતરે</span>';
  return '';
}
function checkOverdueNotifications(){
  if(typeof Notification === 'undefined') return;
  const dueToday = state.inspections.filter(i=>i.status==='outward_sent' && daysBetween(todayISO(), i.replyDeadline)<=0);
  if(!dueToday.length) return;
  if(Notification.permission === 'granted'){
    dueToday.forEach(ins=>{
      try{ new Notification('મુદત પૂરી થઈ', {body:(ins.factory||'ફેક્ટરી')+' ની ૩૦ દિવસની મુદત આજે પૂરી થાય છે'}); }catch(e){}
    });
  } else if(Notification.permission !== 'denied'){
    Notification.requestPermission();
  }
}

const LETTERHEAD_TABLE_HTML = `<table data-outerborder="1" style="border-collapse:collapse;width:100%;border:3px solid #000;"><tr>
  <td style="padding:6px;width:20%;text-align:center;"><img data-logo="1" src="data:image/png;base64,${LOGO1_B64}" style="width:80px;height:auto;"></td>
  <td style="padding:6px;text-align:center;"><b>${OFFICE_NAME}</b><br>${OFFICE_ADDR}<br>${OFFICE_PHONE}</td>
  <td style="padding:6px;width:20%;text-align:center;"><img data-logo="2" src="data:image/png;base64,${LOGO2_B64}" style="width:80px;height:auto;"></td>
</tr></table>`;
// an offence remark always ends with "... ભંગ કરેલ છે." — detect by text so slot/flag mix-ups can't hide it
function isOffenceText(t){ return /ભંગ કરેલ છે\.?\s*$/.test(String(t||'').trim()); }
function fromGujNum(s){ return String(s||'').split('').map(d=>{ const i=GUJ_DIGITS.indexOf(d); return i>=0?String(i):d; }).join(''); }
// one canonical registry, matched against the REMARK TEXT itself (not a flag) — so it works for
// every record regardless of which code version generated its text, old drafts included.
const OFFENCE_REGISTRY = [
  {p:5,  topic:"સ્ટેબિલિટી સર્ટિફિકેટ", rule:"નિયમ-૭૦(૧)", cat:'Safety', en:'Stability certificate not maintained', flag:'includeStabilityOffence', marker:"નિયમ-૭૦(૧)"},
  {p:5,  topic:"સ્ટેબિલિટી - લોડ કેલ્ક્યુલેશન", rule:"નિયમ-૭૦(૨)", cat:'Safety', en:'Stability certificate without load calculation', flag:'includeStabilityLoadOffence', marker:"નિયમ-૭૦(૨)"},
  {p:7,  topic:"સલામતીની તાલીમ", rule:"નિયમ-૧૪(૨)(બી)", cat:'Safety', en:'Safety training not imparted', flag:'includeTrainingRemark', perWorker:true, marker:"નિયમ-૧૪(૨)(બી)"},
  {p:8,  topic:"નિમણૂક પત્ર", rule:"કલમ-૬(૧)(એફ) સાથે નિયમ-૧૦", cat:'Documents', en:'Appointment letter not issued', flag:'includeAppointmentRemark', perWorker:true, marker:"નિમણૂક પત્ર આપવામાં આવેલ નથી"},
  {p:9,  topic:"ઓળખકાર્ડ", rule:"નિયમ-૩૧(૧)", cat:'Documents', en:'Id card not issued', flag:'includeIdCardRemark', perWorker:true, marker:"નિયમ-૩૧(૧)"},
  {p:10, topic:"લીવ કાર્ડ", rule:"નિયમ-૩૩", cat:'Documents', en:'Leave card not given', flag:'includeLeaveCardRemark', marker:"નિયત ફોર્મ નં.-૨૦ (Leave Card)"},
  {p:11, topic:"હાજરી રજિસ્ટર (ફોર્મ-૧૪)", rule:"નિયમ-૨૯(૧)(બી)", cat:'Documents', en:'Attendance register not maintained', flag:'includeAttendanceRemark', marker:"નિયમ-૨૯(૧)(બી)"},
  {p:12, topic:"લીવ વિથ વેજીસ રજિસ્ટર (ફોર્મ-૧૯)", rule:"કલમ-૩૨ સાથે નિયમ-૩૨", cat:'Documents', en:'Leave with wages register not maintained', flag:'includeLwrRemark', marker:"Leave with Wages Register"},
  {p:13, topic:"અકસ્માત રજિસ્ટર (ફોર્મ-૨૨)", rule:"નિયમ-૩૬", cat:'Documents', en:'Accident register not maintained', flag:'includeAccidentRegRemark', marker:"Register of Accident and Dangerous Occurrences"},
  {p:14, topic:"ઘોડિયાઘર - Crèche", rule:"કલમ-૨૪(૩) સાથે નિયમ-૫૮", cat:'Welfare', en:'Crèche facility not available', flag:'includeCrecheRemark', marker:"ઘોડિયાઘર"},
  {p:15, topic:"કેન્ટીન - Canteen", rule:"કલમ-૨૪(૧)(વી) સાથે નિયમ-૫૩", cat:'Welfare', en:'Canteen facility not available', flag:'includeCanteenRemark', marker:"કેન્ટીન"},
  {p:16, topic:"સેફ્ટી કમિટી રચના નથી", rule:"કલમ-૨૨(૧) સાથે નિયમ-૧૭(૧)(બી)", cat:'Safety', en:'Safety Committee not constituted', flag:'includeSafetyCommMissingRemark', marker:"નિયમ-૧૭(૧)(બી)"},
  {p:17, topic:"સેફ્ટી કમિટી રચના યોગ્ય નથી", rule:"કલમ-૨૨(૧) સાથે નિયમ-૧૮", cat:'Safety', en:'Safety Committee composition not proper', flag:'includeSafetyCommCompositionRemark', marker:"નિયમ-૧૮"},
  {p:18, topic:"ઓન-સાઇટ ઇમરજન્સી પ્લાન નથી", rule:"કલમ-૮૪(૪)", cat:'Safety', en:'On-site Emergency Plan not prepared', flag:'includeEmergencyPlanRemark', marker:"ઇમરજન્સી પ્લાન"},
  {p:19, topic:"લાઇસન્સ સુધારો (Amendment) નથી કરાવ્યો", rule:"નિયમ-૭૬(૧)", cat:'Safety', en:'Licence amendment not obtained', flag:'includeLicenceAmendRemark', marker:"નિયમ-૭૬(૧)"},
  {p:20, topic:"સેફ્ટી કમિટી રચના નથી (૨૫૦+ શ્રમયોગી)", rule:"કલમ-૨૨(૧) સાથે નિયમ-૧૭(૧)(સી)", cat:'Safety', en:'Safety Committee not constituted (250+ workers)', flag:'includeSafetyComm250Remark', marker:"નિયમ-૧૭(૧)(સી)"},
  {p:21, topic:"નવા નકશા મંજૂર કરાવ્યા નથી", rule:"કલમ-૭૯ સાથે નિયમ-૬૯(૧)", cat:'Safety', en:'New building plan approval not obtained', flag:'includeNewMapApprovalRemark', marker:"નકશા નમૂના નં.૩૧"},
  {p:22, topic:"ફેક્ટરી લાયસન્સ અરજી રજુ કરેલ નથી", rule:"કલમ-૭૯ સાથે નિયમ-૭૫(૧)", cat:'Safety', en:'Factory licence application not submitted', flag:'includeLicenceApplicationRemark', marker:"નિયમ-૭૫(૧)"},
  {p:23, topic:"દિવસના ૮ કલાકથી વધુ કામ (ઓવરટાઇમ)", rule:"કલમ-૨૫(૧)(એ)", cat:'Safety', en:'Working more than 8 hours per day', flag:'includeOvertimeRemark', perWorker:true, marker:"કલમ-૨૫ (૧)(એ)"},
  {p:24, topic:"રીવાઈઝ્ડ નક્શા મંજૂર કરાવ્યા નથી", rule:"કલમ-૭૯ સાથે નિયમ-૬૯(૧)", cat:'Safety', en:'Revised building plan approval not obtained', flag:'includeRevisedMapRemark', marker:"પ્લાંટ તથા લે-આઉટની સ્થીતી"}
];
// reads every remark that reads as an offence and classifies it against the registry above —
// works for ANY saved record, regardless of which checkbox/flag code version produced the text.
// An offence remark is either the legal wording (ends "... ભંગ કરેલ છે.") or the suggestion wording used
// for ઈમ્પ્રુવમેન્ટ નોટીસ / blank (no such ending) — the latter is recognised by the rule it cites.
// Fixed slots only: 0,1,2,4 (licence/process/plan/workers) and typed-in extras are never offences by marker.
function isOffenceRemark(idx, t){
  t = String(t||'').trim();
  if(!t) return false;
  if(isOffenceText(t)) return true;
  if(idx>=25 || idx===0 || idx===1 || idx===2 || idx===4) return false;
  return OFFENCE_REGISTRY.some(x=>t.includes(x.marker));
}
// how many offences a remark stands for: "સદરહુ ૦૩ શ્રમયોગી દીઠ" (legal wording) or, when that
// closing sentence is not there, the "ક્રમાંક ૧ થી ૩" range of workers the remark itself quotes.
function offenceCountFromText(r){
  let m = r.match(/સદરહુ\s*([૦૧૨૩૪૫૬૭૮૯0-9]+)\s*શ્રમયોગી દીઠ/);
  if(m) return parseInt(fromGujNum(m[1]))||1;
  m = r.match(/ક્રમાંક\s*([૦૧૨૩૪૫૬૭૮૯0-9]+)\s*થી\s*([૦૧૨૩૪૫૬૭૮૯0-9]+)/);
  if(m){ const a=parseInt(fromGujNum(m[1])), b=parseInt(fromGujNum(m[2])); if(a>0 && b>=a) return b-a+1; }
  return 1;
}
// A slot counts as an offence if its text reads as one, OR its tick is on (a person may have typed over
// the sentence — e.g. pasted their own wording — but the tick still says "this is an offence").
function slotTickOn(ins, idx){
  const fs = FLAG_SLOTS.find(x=>x[1]===idx);
  if(fs) return !!ins[fs[0]];
  if(idx===3 || idx===19 || idx===22){ const t = stabSlotPlan(ins)[idx]; return t==='generic' || t==='load'; }
  return false;
}
function isOffenceSlot(ins, idx, t){
  if(isOffenceRemark(idx, t)) return true;
  return !!String(t||'').trim() && slotTickOn(ins, idx);
}
function classifyOffences(ins){
  const out = [], seen = new Set(), classifiedSlots = new Set();
  ins = withRepairedRemarks(ins);
  const key = x => x.p+'|'+x.rule+'|'+x.en;
  (ins.remarks||[]).forEach((r,idx)=>{
    if(!isOffenceRemark(idx, r)) return;
    const hit = OFFENCE_REGISTRY.find(x=>r.includes(x.marker));
    if(!hit) return;
    classifiedSlots.add(idx);
    if(seen.has(key(hit))) return;            // one offence type is counted once
    seen.add(key(hit));
    out.push({p:hit.p, topic:hit.topic, rule:hit.rule, cat:hit.cat, en:hit.en, nos:offenceCountFromText(r)});
  });
  // Ticked, but that slot's sentence no longer reads like the offence (a person typed over it / pasted
  // their own wording): the tick still counts. A slot whose text already classified as an offence is
  // never counted a second time from its tick.
  const workerCount = Math.max(1, (ins.workers||[]).filter(w=>(w.name||'').trim()||(w.work||'').trim()).length);
  OFFENCE_REGISTRY.forEach(x=>{
    if(!x.flag || !ins[x.flag] || seen.has(key(x))) return;
    const fs = FLAG_SLOTS.find(f=>f[0]===x.flag);
    if(fs && classifiedSlots.has(fs[1])) return;
    seen.add(key(x));
    out.push({p:x.p, topic:x.topic, rule:x.rule, cat:x.cat, en:x.en, nos: x.perWorker ? workerCount : 1});
  });
  return out;
}
// "ઈમ્પ્રુવમેન્ટ નોટીસ" or blank heading = suggestions only, not a legal violation case
function isSuggestionMode(ins){ return !ins.caseType || ins.caseType==='ઈમ્પ્રુવમેન્ટ નોટીસ'; }
// suggestion wording: drop the concluding "આમ ... ભંગ કરેલ છે." sentence and turn a trailing
// "દ્વારા રજૂ કરવામાં આવેલ નથી." into "દ્વારા રજૂ કરવા." Only the NOTICE TEXT changes — the stored
// remark (and so the Summary / દફતરે counts, which read it) still treats it as an offence.
function toSuggestionText(txt){
  let last = -1, m;
  const re = /(^|[\s.])આમ(?=[,\s])/g;
  while((m = re.exec(txt))) last = m.index + m[1].length;
  let out = last>=0 ? txt.slice(0,last).replace(/\s+$/,'') : txt;
  out = out.replace(/દ્વારા રજૂ કરવામાં આવેલ નથી\.?\s*$/, 'દ્વારા રજૂ કરવા.');
  return out;
}
// makes the concluding "કારખાનાના કબજેદારશ્રીએ … ભંગ કરેલ છે." part of an offence remark bold + underlined
function decorateOffenceText(txt){
  let last = -1, m;
  const re = /(^|[\s.])આમ(?=[,\s])/g;
  while((m = re.exec(txt))) last = m.index + m[1].length;
  if(last < 0) return txt;
  const rest = txt.slice(last);
  const sm = /કારખાનાના (કબજેદાર|કબ્જેદાર|મેનેજરશ્રી|વ્યવસ્થાપકશ્રી)/.exec(rest);
  if(!sm) return txt;
  const start = last + sm.index;
  return txt.slice(0,start) + '<b><u>' + txt.slice(start) + '</u></b>';
}
function buildComplianceRefLine(ins, idxToPointNum, safetyOrderNo){
  let offenceNums = [];
  (ins.remarks||[]).forEach((r,idx)=>{ if(isOffenceSlot(ins, idx, r) && idxToPointNum[idx]) offenceNums.push(idxToPointNum[idx]); });
  offenceNums = [...new Set(offenceNums)].sort((a,b)=>a-b).map(x=>toGujNum(x));
  let offenceListStr = '';
  if(offenceNums.length===1) offenceListStr = String(offenceNums[0]);
  else if(offenceNums.length>1) offenceListStr = offenceNums.slice(0,-1).join(', ') + ' અને ' + offenceNums[offenceNums.length-1];
  if(safetyOrderNo) safetyOrderNo = toGujNum(safetyOrderNo);

  const what = isSuggestionMode(ins) ? 'મુદ્દાઓ' : 'કાયદાભંગ';
  if(offenceListStr && safetyOrderNo){
    return `ઉપરોકત રીમાર્કસ નં. ${offenceListStr} માં દર્શાવેલ ${what} અને ${safetyOrderNo} માં દર્શાવેલ હુકુમનું`;
  } else if(offenceListStr){
    return `ઉપરોકત રીમાર્કસ નં. ${offenceListStr} માં દર્શાવેલ ${what}નું`;
  } else if(safetyOrderNo){
    return `ઉપરોકત રીમાર્કસ નં. ${safetyOrderNo} માં દર્શાવેલ હુકુમનું`;
  }
  return `ઉપરોકત રીમાર્કસમાં દર્શાવેલ બાબતોનું`;
}
const DAFTARE_RULES = [
  {key:'stab', rule:'નિયમ-૭૦(૧)', check:ins=>!!ins.includeStabilityOffence, nos:ins=>1},
  {key:'stabload', rule:'નિયમ-૭૦(૨)', check:ins=>!!ins.includeStabilityLoadOffence, nos:ins=>1},
  {key:'training', rule:'નિયમ-૧૪(૨)(બી)', check:ins=>!!ins.includeTrainingRemark, nos:ins=>(ins.workers||[]).filter(w=>w.name.trim()||w.work.trim()).length},
  {key:'appointment', rule:'નિયમ-૧૦', check:ins=>!!ins.includeAppointmentRemark, nos:ins=>(ins.workers||[]).filter(w=>w.name.trim()||w.work.trim()).length},
  {key:'idcard', rule:'નિયમ-૩૧(૧)', check:ins=>!!ins.includeIdCardRemark, nos:ins=>(ins.workers||[]).filter(w=>w.name.trim()||w.work.trim()).length},
  {key:'leavecard', rule:'નિયમ-૩૩', check:ins=>!!ins.includeLeaveCardRemark, nos:ins=>1},
  {key:'attendance', rule:'નિયમ-૨૯(૧)(બી)', check:ins=>!!ins.includeAttendanceRemark, nos:ins=>1},
  {key:'lwr', rule:'નિયમ-૩૨', check:ins=>!!ins.includeLwrRemark, nos:ins=>1},
  {key:'accidentreg', rule:'નિયમ-૩૬', check:ins=>!!ins.includeAccidentRegRemark, nos:ins=>1},
  {key:'creche', rule:'નિયમ-૫૮', check:ins=>!!ins.includeCrecheRemark, nos:ins=>1},
  {key:'canteen', rule:'નિયમ-૫૩', check:ins=>!!ins.includeCanteenRemark, nos:ins=>1},
  {key:'safetycommmissing', rule:'નિયમ-૧૭(૧)(બી)', check:ins=>!!ins.includeSafetyCommMissingRemark, nos:ins=>1},
  {key:'safetycommcomp', rule:'નિયમ-૧૮', check:ins=>!!ins.includeSafetyCommCompositionRemark, nos:ins=>1},
  {key:'emergencyplan', rule:'કલમ-૮૪(૪)', check:ins=>!!ins.includeEmergencyPlanRemark, nos:ins=>1},
  {key:'licenceamend', rule:'નિયમ-૭૬(૧)', check:ins=>!!ins.includeLicenceAmendRemark, nos:ins=>1},
  {key:'safetycomm250', rule:'નિયમ-૧૭(૧)(સી)', check:ins=>!!ins.includeSafetyComm250Remark, nos:ins=>1},
  {key:'newmapapproval', rule:'નિયમ-૬૯(૧)', check:ins=>!!ins.includeNewMapApprovalRemark, nos:ins=>1},
  {key:'licenceapplication', rule:'નિયમ-૭૫(૧)', check:ins=>!!ins.includeLicenceApplicationRemark, nos:ins=>1},
  {key:'revisedmap', rule:'નિયમ-૬૯(૧)', check:ins=>!!ins.includeRevisedMapRemark, nos:ins=>1},
  {key:'overtime', rule:'કલમ-૨૫(૧)(એ)', check:ins=>!!ins.includeOvertimeRemark, nos:ins=>(ins.workers||[]).filter(w=>w.name.trim()||w.work.trim()).length}
];
function buildDaftareLetterHTML(ins){
  const violations = classifyOffences(ins).map(x=>({rule:x.rule, nos:x.nos}));
  const violationHTML = violations.map((v,i)=>`(${i+1}) ${v.rule}....${v.nos} કાયદાભંગ`).join('<br>');
  const totalCases = violations.reduce((s,v)=>s+v.nos,0);
  const noteText = `કારખાનેદારે અત્રેની કચેરીમાં તા.${ins.inwardDate?toDMY(ins.inwardDate):'____'} ના રોજ ખુલાસો રજુ કરેલ છે. જે અન્વયે કારખાનામાં તા-${ins.followUpVisitDate?toDMY(ins.followUpVisitDate):'____'} ના રોજ મુલાકાત લીધી, કારખાનાના કબજેદારશ્રી દ્વારા રજુ કરેલ ખુલાસો ચકાસતા કબજેદારશ્રીએ ઉપરોક્ત દર્શાવેલ તમામ ભંગનું પાલન કરેલ હોય રિમાર્ક્સ દફતરે કરવા આપ સાહેબશ્રીને ભલામણ છે.`;
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="font-family:'Noto Sans Gujarati',sans-serif; line-height:1.6;">
  ${LETTERHEAD_TABLE_HTML}
  <table data-colwidths="65,35" style="border:none;width:100%;"><tr>
    <td style="width:65%;vertical-align:top;"><b>જા.નં.મ.નિ./ઔ.સ. અને સ્વા./નવ/______/૨૦૨૬</b></td>
    <td style="text-align:right;vertical-align:top;"><b>તા. ${toDMY(null)}</b></td>
  </tr></table>
  <p style="text-align:left;">પ્રતિ,<br>જોઈન્ટ ચીફ ઈન્સ્પેક્ટર કમ ફેસીલીટેટર ફોર ધ ફેકટરીઝ,<br>ઔદ્યોગિક, સલામતી અને સ્વાસ્થ્ય,<br>સુરત રીજિયન, સુરત</p>
  <p style="text-align:center;">વિષય: ઓક્યુપેશનલ સેફ્ટી, હેલ્થ અને વર્કિંગ કન્ડિશન કોડ,૨૦૨૦ કેસોની રીમાર્ક્સ દફતરે કરવા બાબતે.</p>
  <table style="border-collapse:collapse;width:100%;">
  <tr><td style="border:1px solid #999;padding:4px;">૧</td><td style="border:1px solid #999;padding:4px;">કારખાનાનું નામ અને સરનામું</td><td style="border:1px solid #999;padding:4px;">${ins.factory||''}, ${ins.address||''}</td></tr>
  <tr><td style="border:1px solid #999;padding:4px;">૨</td><td style="border:1px solid #999;padding:4px;">કારખાનાનું વર્ગીકરણ</td><td style="border:1px solid #999;padding:4px;">કલમ- ૨(૧)(ડબલ્યુ)(આઈ)</td></tr>
  <tr><td style="border:1px solid #999;padding:4px;">૩</td><td style="border:1px solid #999;padding:4px;">જેમની સામે કેસ કરવાનો હોય તે વ્યક્તિનું નામ અને હોદ્દો</td><td style="border:1px solid #999;padding:4px;">${ins.ownerName||''} -- કબજેદારશ્રી</td></tr>
  <tr><td style="border:1px solid #999;padding:4px;">૪</td><td style="border:1px solid #999;padding:4px;">કારખાનાનાં કાયદા અથવા ગુજરાત ફેકટરી રૂલ્સની કઇ કલમ અથવા નિયમ માટે ભંગ લીધો છે.</td><td style="border:1px solid #999;padding:4px;">${violationHTML}</td></tr>
  <tr><td style="border:1px solid #999;padding:4px;">૫</td><td style="border:1px solid #999;padding:4px;">કોર્ટ કેસની સંખ્યા</td><td style="border:1px solid #999;padding:4px;">કુલ- ${toGujNum(totalCases)} કેસ</td></tr>
  <tr><td style="border:1px solid #999;padding:4px;">૬</td><td style="border:1px solid #999;padding:4px;">ગુનાની તારીખ</td><td style="border:1px solid #999;padding:4px;">${toDMY(ins.date)}</td></tr>
  <tr><td style="border:1px solid #999;padding:4px;">૭</td><td style="border:1px solid #999;padding:4px;">ગુનો શોધ્યાની તારીખ</td><td style="border:1px solid #999;padding:4px;">${ins.outwardDate?toDMY(ins.outwardDate):'--------'}</td></tr>
  <tr><td style="border:1px solid #999;padding:4px;">૮</td><td style="border:1px solid #999;padding:4px;">ગુના બાબતમાં કોઇ ફરીયાદ મળેલ છે કે કેમ ?</td><td style="border:1px solid #999;padding:4px;">ના.જી.</td></tr>
  <tr><td style="border:1px solid #999;padding:4px;">૯</td><td style="border:1px solid #999;padding:4px;">કોઇ ખુલાસો આપેલ છે કે કેમ ?</td><td style="border:1px solid #999;padding:4px;">હા.જી. તા.${toDMY(ins.inwardDate)} ના રોજ ખુલાસો કરેલ છે.</td></tr>
  <tr><td style="border:1px solid #999;padding:4px;">૧૦</td><td style="border:1px solid #999;padding:4px;">કારખાના સામે અગાઉ કરવામાં આવેલ કેસો તથા રીમાર્કસ દફતરે કરવામાં આવ્યાની વિગત.</td><td style="border:1px solid #999;padding:4px;">--------</td></tr>
  <tr><td style="border:1px solid #999;padding:4px;">૧૧</td><td style="border:1px solid #999;padding:4px;">અગાઉ બે વર્ષ દરમ્યાન આજ ભંગ બદલ ગુનેગાર ઠરેલ છે કે કેમ ?</td><td style="border:1px solid #999;padding:4px;">--------</td></tr>
  <tr><td style="border:1px solid #999;padding:4px;">૧૨</td><td style="border:1px solid #999;padding:4px;">સાથે જોડેલ બિડાણ</td><td style="border:1px solid #999;padding:4px;">૧. રીમાર્કસની નકલ<br>૨. કારખાનાના કબજેદારશ્રી દ્વારા રજુ કરેલ ખુલાસો</td></tr>
  <tr><td style="border:1px solid #999;padding:4px;">૧૩</td><td style="border:1px solid #999;padding:4px;"><u>નિરીક્ષકની નોંધ</u>:</td><td style="border:1px solid #999;padding:4px;">${noteText}</td></tr>
  </table>
  <p></p>
  <table style="width:100%;border:none;border-collapse:collapse;"><tr>
    <td style="border:none;width:50%;vertical-align:top;"></td>
    <td style="border:none;text-align:center;vertical-align:top;">એચ.બી. પટેલ<br>આસીસ્ટન્ટ ચીફ-ઇન્સ્પેક્ટર કમ ફેસિલિટેટર ફોર ફેક્ટરીઝ<br>નવસારી</td>
  </tr></table>
  <p style="text-align:left;">જોઈન્ટ ચીફ-ઇન્સ્પેક્ટર કમ ફેસિલિટેટર ફોર ફેક્ટરીઝ, સુરત રીજિયન, સુરતને હુકમ અર્થે સાદર રજુ</p>
  <p></p>
  <p style="text-align:left;">ક્રમાંક : સં.નિ.ઔ.સ.સ્વા./સુ.રીજી./${ins.daftareOutwardNo?toGujNum(ins.daftareOutwardNo):' '}/૨૦૨૬</p>
  <table style="width:100%;border:none;border-collapse:collapse;"><tr>
    <td style="border:none;width:50%;vertical-align:top;">જોઈન્ટ ચીફ-ઇન્સ્પેક્ટર કમ ફેસિલિટેટર ફોર ફેક્ટરીઝ</td>
    <td style="border:none;text-align:center;vertical-align:top;">જોઈન્ટ ચીફ-ઇન્સ્પેક્ટર કમ ફેસિલિટેટર ફોર ફેક્ટરીઝ</td>
  </tr><tr>
    <td style="border:none;vertical-align:top;">જિલ્લા સેવા સદન - ૨, "બી- બ્લોક" છઠો માળ,</td>
    <td style="border:none;text-align:center;vertical-align:top;">સુરત રીજિયન, સુરત</td>
  </tr><tr>
    <td style="border:none;vertical-align:top;">અઠવાલાઇન્સ,સુરત. તારીખ ${toDMY(ins.daftareOutwardDate)}</td>
    <td style="border:none;vertical-align:top;"></td>
  </tr></table>
  <p style="text-align:left;">રવાના જરૂરી કાર્યવાહી અર્થે</p>
  <p style="text-align:left;">આસીસ્ટન્ટ ચીફ-ઇન્સ્પેક્ટર કમ ફેસિલિટેટર ફોર ફેક્ટરીઝ, નવસારી</p>
  </body></html>`;
}
async function downloadDaftareLetter(ins){
  const html = buildDaftareLetterHTML(ins);
  if(downloadsNS && typeof JSZip !== 'undefined'){
    try{
      setDocxFontSize(20); // daftare file: 10 pt
      const blob = await htmlToDocxBlob(html);
      await downloadsNS.save({filename:'daftare_'+(ins.factory||'case')+'.docx', data: blob});
      return;
    }catch(e){}
  }
  if(downloadsNS){ try{ await downloadsNS.save({filename:'daftare_'+(ins.factory||'case')+'.html', data:html}); return; }catch(e){} }
  const w = window.open('', '_blank'); if(w){ w.document.write(html); w.document.close(); w.print(); }
}
function buildLetterHTML(ins){
  ins = withRepairedRemarks(ins); // ticked box without its sentence → sentence is generated now
  let n = 1; const remarkLines = []; const idxToPointNum = {};
  remarkLines.push(`<li>કારખાનાની તા. ${toDMY(ins.date)} ના રોજ ${ins.inspectors} સાથે ચાલુમાં તપાસણી કરી.</li>`); n++;
  // point number of the workers table (remark slot 4), used by the "રીમાર્કસ નં.-X ના ક્રમાંક" sentences
  let wnoCounter = 2, workersPointNo = null;
  ins.remarks.forEach((r,idx)=>{ if(r.trim()){ if(idx===4) workersPointNo = wnoCounter; wnoCounter++; } });
  const wnoText = workersPointNo ? toGujNum(workersPointNo) : '____';
  const suggestionMode = isSuggestionMode(ins);
  ins.remarks.forEach((r,idx)=>{
    if(r.trim()){
      let txt = r.replace(/^\s*[0-9૦-૯]+[.)]\s+/, '').replace(/રીમાર્કસ નં\.-6 ના ક્રમાંક/g, `રીમાર્કસ નં.-${wnoText} ના ક્રમાંક`);
      if(isOffenceText(r)) txt = suggestionMode ? toSuggestionText(txt) : decorateOffenceText(txt);
      remarkLines.push(`<li>${txt.replace(/\n/g,'<br>')}</li>`); idxToPointNum[idx]=n; n++;
    }
  });
  let safetyOrderNo = null;
  if(ins.includeSafetyOrder && ins.safetyPoints.filter(p=>p.trim()).length){
    safetyOrderNo = n;
    remarkLines.push(`<li>કારખાનામાં તપાસ કરતા નીચે જણાવેલ સલામતીની જોગવાઈ સિવાય ઉત્પાદન પ્રકિયા કરવામાં આવે તો કારખાનામાં કામ કરતા શ્રમયોગી તથા આસપાસમાં સલામતીને જોખમ ઉત્પન્ન થાય તેમ છે. આથી હું શ્રી એચ. બી. પટેલ, જે ધ ઓક્યુપેશનલ સેફ્ટી, હેલ્થ એંડ વર્કીંગ કંડીશંસ કોડ-૨૦૨૦ ની કલમ-૧૪૩(૨) સાથે વાંચતા કલમ-૩૪ હેઠળ નિમાયેલ ઈસ્પેક્ટર કમ ફેસીલીટેટર, ગુજરાત ઓક્યુપેશનલ સેફ્ટી, હેલ્થ એંડવર્કીંગ કંડીશંસ રુલ્સ-૨૦૨૫ના નિયમ-૪૦(૧) હેઠળ મળેલ સત્તાની રૂએ નીચે જણાવેલ સલામતીના પગલાનુ પાલન દિન-૩૦ માં કરવા માટે હુકમ કરૂ છુ.</li>`);
    n++;
  }
  const escH = t => String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;');
  const safetyHTML = safetyOrderNo
    ? `<p style="text-align:left;"><b>સલામતી સુચનો :</b></p>` + ins.safetyPoints.filter(p=>p.trim()).map((p,i)=>`<p style="text-align:left;" data-hanging="420">${letterFor(i)})\t${escH(p)}</p>`).join('')
    : '';
  const continuationLines = [];
  // the standard-penalty checkbox controls BOTH the penalty paragraph and the 30-day
  // compliance / compounding paragraph (they are one standard-provision block).
  const penaltyNo = ins.includePenalty ? n++ : null;
  if(penaltyNo) continuationLines.push(`<li>${PENALTY_TEXT}</li>`);
  const complianceNo = ins.includePenalty ? n++ : null;
  if(complianceNo) continuationLines.push(`<li>${COMPLIANCE_TEXT}</li>`);
  const personNo = n++;
  continuationLines.push(`<li>કારખાનામાં મુલાકાત સમયે કારખાનાના જવાબદાર તરીકે ${ins.presentPerson||'________'} હાજર છે. તેમના જાણાવ્યા મુજબ કબજેદારશ્રી ${ins.ownerName||'________'}${(ins.ownerAddress&&ins.ownerAddress.trim())?', રહેઠાણ-'+ins.ownerAddress.trim():''}, મો. ${toGujNum(ins.ownerPhone||'________')}${(ins.ownerEmail&&ins.ownerEmail.trim())?', ઈ-મેલ: '+ins.ownerEmail.trim():''} છે. તેમાં કોઈ ફેરફાર હોય તો દિન-૩ માં આધાર સાથે લેખિતમાં જાણ કરશો.</li>`);
  const continuationStart = penaltyNo || complianceNo || personNo;

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="font-family:'Noto Sans Gujarati',sans-serif; line-height:1.6;">
  ${LETTERHEAD_TABLE_HTML}
  <table data-colwidths="65,35" style="border:none;width:100%;"><tr>
    <td style="width:65%;vertical-align:top;"><b>જા.નં. ${formatNoticeNo(ins.noticeNo)}</b></td>
    <td style="text-align:right;vertical-align:top;"><b>તા. ${toDMY(ins.outwardDate)}</b></td>
  </tr></table>
  ${ins.caseType? `<p style="text-align:left;"><b>${ins.caseType}</b></p>` : ''}
  <p style="text-align:left;" data-space-before="200"><b>પ્રતિ,<br>કબજેદારશ્રી/વ્યવસ્થાપકશ્રી<br>${ins.factory}<br>${ins.address}</b></p>
  <p style="text-align:center;" data-space-before="200" data-space-after="200"><b>વિષય: ઓક્યુપેશનલ સેફ્ટી, હેલ્થ એન્ડ વર્કીંગ કંડીશન્સ કોડ-૨૦૨૦ હેઠળની તપાસણી નોંધ.</b></p>
  <ol>${remarkLines.join('')}</ol>
  ${safetyHTML}
  <ol start="${continuationStart}">${continuationLines.join('')}</ol>
  <p>${buildComplianceRefLine(ins, idxToPointNum, safetyOrderNo)} પાલન કરી લેખિતમાં અમારી કચેરીએ પુરાવાઓ સાથે બે નકલમાં રજુ કરશો તથા આ રીમાર્કસ ઇન્સ્પેક્શન બુકમાં લગાવીને જાણ કરશો.</p>
  <p></p>
  <p></p>
  <table style="width:100%;border:none;border-collapse:collapse;margin-top:20px;"><tr>
    <td style="border:none;width:40%;vertical-align:top;">સ્થળ : ${ins.place}</td>
    <td style="border:none;text-align:center;">આસીસટ્ન્ટ ચીફ ઈંસ્પેક્ટર<br>કમ ફેસીલીટેટર ફોર ધ ફેકટરીઝ<br>${ins.place}</td>
  </tr></table>
  </body></html>`;
}
function xmlEsc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;'); }
// A4 page: left margin 0.75 inch, right margin 0.6 inch (1 inch = 1440 twips)
const PAGE_W = 11906, PAGE_LEFT = 1080, PAGE_RIGHT = 864;
const PAGE_TEXT_W = PAGE_W - PAGE_LEFT - PAGE_RIGHT; // 9962
// font size is set per document (in half-points: 22 = 11pt, 20 = 10pt) before generating it
let DOCX_FONT = '';
function setDocxFontSize(halfPts){
  DOCX_FONT = `<w:rFonts w:ascii="Shruti" w:hAnsi="Shruti" w:cs="Shruti"/><w:sz w:val="${halfPts}"/><w:szCs w:val="${halfPts}"/><w:noProof/><w:lang w:val="gu-IN" w:bidi="gu-IN"/>`;
}
setDocxFontSize(20);
const LOGO_DRAWING_XML = {
  '1': `<w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"><wp:extent cx="731520" cy="753533"/><wp:docPr id="101" name="Logo1"/><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="101" name="Logo1"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="rIdLogo1" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="731520" cy="753533"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r>`,
  '2': `<w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"><wp:extent cx="731520" cy="818515"/><wp:docPr id="102" name="Logo2"/><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="102" name="Logo2"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="rIdLogo2" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="731520" cy="818515"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r>`
};
function docxRunsFromInline(node, bold, underline){
  let xml = '';
  node.childNodes.forEach(ch=>{
    if(ch.nodeType===3){
      const text = ch.textContent;
      if(text){
        const rPr = `<w:rPr>${DOCX_FONT}${bold?'<w:b/>':''}${underline?'<w:u w:val="single"/>':''}</w:rPr>`;
        text.split('\t').forEach((part,pi)=>{
          if(pi>0) xml += `<w:r>${rPr}<w:tab/></w:r>`;
          if(part) xml += `<w:r>${rPr}<w:t xml:space="preserve">${xmlEsc(part)}</w:t></w:r>`;
        });
      }
    } else if(ch.nodeType===1){
      const tag = ch.tagName.toLowerCase();
      if(tag==='br'){ xml += `<w:r><w:rPr>${DOCX_FONT}</w:rPr><w:br/></w:r>`; }
      else if(tag==='img' && ch.getAttribute('data-logo')){ xml += LOGO_DRAWING_XML[ch.getAttribute('data-logo')] || ''; }
      else if(tag==='b'||tag==='strong'){ xml += docxRunsFromInline(ch, true, underline); }
      else if(tag==='u'){ xml += docxRunsFromInline(ch, bold, true); }
      else { xml += docxRunsFromInline(ch, bold, underline); }
    }
  });
  return xml;
}
function docxParagraph(node, opts){
  opts = opts || {};
  const style = (node.getAttribute && node.getAttribute('style')) || '';
  const center = style.includes('text-align:center') || opts.center;
  const left = style.includes('text-align:left');
  const runs = docxRunsFromInline(node, !!opts.bold) || `<w:r><w:rPr>${DOCX_FONT}</w:rPr><w:t></w:t></w:r>`;
  const jc = center ? '<w:jc w:val="center"/>' : ((opts.noJustify || left) ? '' : '<w:jc w:val="both"/>');
  const dataSpaceBefore = node.getAttribute && node.getAttribute('data-space-before');
  const dataSpaceAfter = node.getAttribute && node.getAttribute('data-space-after');
  const spacing = `<w:spacing w:before="${dataSpaceBefore || opts.spacingBefore || 0}" w:after="${dataSpaceAfter || 0}" w:line="240" w:lineRule="auto"/>`;
  const hang = node.getAttribute && node.getAttribute('data-hanging');
  const ind = hang ? `<w:ind w:left="${hang}" w:hanging="${hang}"/>` : '';
  return `<w:p><w:pPr>${spacing}${ind}${jc}</w:pPr>${runs}</w:p>`;
}
function docxTable(tableEl){
  const noBorder = (tableEl.getAttribute('style')||'').includes('border:none') || (tableEl.getAttribute('border')==='0');
  const outerOnly = tableEl.getAttribute('data-outerborder')==='1';
  const cellBorderXml = (noBorder || outerOnly) ? '' : `<w:tcBorders><w:top w:val="single" w:sz="4" w:space="0" w:color="999999"/><w:left w:val="single" w:sz="4" w:space="0" w:color="999999"/><w:bottom w:val="single" w:sz="4" w:space="0" w:color="999999"/><w:right w:val="single" w:sz="4" w:space="0" w:color="999999"/></w:tcBorders>`;
  let tblBorderXml;
  if(noBorder){
    tblBorderXml = `<w:tblBorders><w:top w:val="none"/><w:left w:val="none"/><w:bottom w:val="none"/><w:right w:val="none"/><w:insideH w:val="none"/><w:insideV w:val="none"/></w:tblBorders>`;
  } else if(outerOnly){
    tblBorderXml = `<w:tblBorders><w:top w:val="single" w:sz="24" w:color="000000"/><w:left w:val="single" w:sz="24" w:color="000000"/><w:bottom w:val="single" w:sz="24" w:color="000000"/><w:right w:val="single" w:sz="24" w:color="000000"/><w:insideH w:val="none"/><w:insideV w:val="none"/></w:tblBorders>`;
  } else {
    tblBorderXml = `<w:tblBorders><w:top w:val="single" w:sz="4" w:color="999999"/><w:left w:val="single" w:sz="4" w:color="999999"/><w:bottom w:val="single" w:sz="4" w:color="999999"/><w:right w:val="single" w:sz="4" w:color="999999"/><w:insideH w:val="single" w:sz="4" w:color="999999"/><w:insideV w:val="single" w:sz="4" w:color="999999"/></w:tblBorders>`;
  }
  const firstRow = tableEl.querySelector('tr');
  const numCols = firstRow ? firstRow.querySelectorAll('td,th').length : 0;
  const TOTAL_WIDTH = PAGE_TEXT_W; // printable width between the margins
  let colWidths = [];
  const pctAttr = tableEl.getAttribute('data-colwidths');
  if(numCols>0 && !outerOnly && pctAttr){
    const pcts = pctAttr.split(',').map(Number);
    if(pcts.length===numCols && pcts.every(n=>n>0)){
      const sum = pcts.reduce((a,b)=>a+b,0);
      colWidths = pcts.map(n=>Math.floor(TOTAL_WIDTH*n/sum));
    }
  }
  if(numCols>0 && !outerOnly && !colWidths.length){
    const firstCellText = firstRow.querySelectorAll('td,th')[0].textContent.trim();
    if(numCols>=3 && firstCellText.length<=6){
      const first = 700;
      const rest = Math.floor((TOTAL_WIDTH-first)/(numCols-1));
      colWidths = [first, ...Array(numCols-1).fill(rest)];
    } else {
      const each = Math.floor(TOTAL_WIDTH/numCols);
      colWidths = Array(numCols).fill(each);
    }
  }
  const gridXml = (colWidths.length && !outerOnly) ? `<w:tblGrid>${colWidths.map(w=>`<w:gridCol w:w="${w}"/>`).join('')}</w:tblGrid>` : '';
  let rowsXml = '';
  tableEl.querySelectorAll('tr').forEach(tr=>{
    let cellsXml = '';
    tr.querySelectorAll('td,th').forEach((cell,colIdx)=>{
      const bold = cell.tagName.toLowerCase()==='th';
      const underline = (cell.getAttribute('style')||'').includes('text-decoration:underline');
      const cellStyle = (cell.getAttribute('style')||'');
      const center = cellStyle.includes('text-align:center');
      const right = cellStyle.includes('text-align:right');
      const runs = docxRunsFromInline(cell, bold, underline) || `<w:r><w:rPr>${DOCX_FONT}</w:rPr><w:t></w:t></w:r>`;
      const tcWXml = (outerOnly || !colWidths.length) ? '' : `<w:tcW w:w="${colWidths[colIdx]||Math.floor(TOTAL_WIDTH/numCols)}" w:type="dxa"/>`;
      const cellPPr = `<w:pPr>${center?'<w:jc w:val="center"/>':(right?'<w:jc w:val="right"/>':'')}<w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/></w:pPr>`;
      cellsXml += `<w:tc><w:tcPr>${tcWXml}${cellBorderXml}</w:tcPr><w:p>${cellPPr}${runs}</w:p></w:tc>`;
    });
    rowsXml += `<w:tr>${cellsXml}</w:tr>`;
  });
  const tblWXml = outerOnly ? `<w:tblW w:w="0" w:type="auto"/>` : `<w:tblW w:w="${TOTAL_WIDTH}" w:type="dxa"/>`;
  const trailingP = `<w:p><w:pPr><w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/></w:pPr></w:p>`;
  return `<w:tbl><w:tblPr><w:tblStyle w:val="TableGrid"/>${tblWXml}${tblBorderXml}</w:tblPr>${gridXml}${rowsXml}</w:tbl>${trailingP}`;
}
function docxBodyFromHtml(html){
  const doc = new DOMParser().parseFromString(html, 'text/html');
  let xml = '';
  doc.body.childNodes.forEach(node=>{
    if(node.nodeType!==1) return;
    const tag = node.tagName.toLowerCase();
    if(tag==='p'){
      const bold = node.querySelector('b,strong') && node.children.length===1 && node.children[0].tagName.toLowerCase()==='b';
      xml += docxParagraph(node, {bold});
    } else if(tag==='h3'){
      xml += docxParagraph(node, {bold:true, spacingBefore:200});
    } else if(tag==='ol'){
      let i = parseInt(node.getAttribute('start')||'1', 10) || 1;
      node.querySelectorAll('li').forEach(li=>{
        const tbl = li.querySelector('table');
        let textSource = li;
        if(tbl){
          textSource = li.cloneNode(true);
          const tblClone = textSource.querySelector('table');
          if(tblClone) tblClone.remove();
        }
        const runs = docxRunsFromInline(textSource, false);
        xml += `<w:p><w:pPr><w:ind w:left="615" w:hanging="615"/><w:jc w:val="both"/><w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/></w:pPr><w:r><w:rPr>${DOCX_FONT}</w:rPr><w:t xml:space="preserve">(${toGujNum(i)})</w:t></w:r><w:r><w:rPr>${DOCX_FONT}</w:rPr><w:tab/></w:r>${runs}</w:p>`;
        if(tbl) xml += docxTable(tbl);
        i++;
      });
    } else if(tag==='table'){
      xml += docxTable(node);
    }
  });
  return xml;
}
async function htmlToDocxBlob(html){
  const bodyXml = docxBodyFromHtml(html);
  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${bodyXml}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1440" w:right="${PAGE_RIGHT}" w:bottom="1440" w:left="${PAGE_LEFT}"/></w:sectPr></w:body></w:document>`;
  const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>`;
  const relsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`;
  const docRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdLogo1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/image1.png"/><Relationship Id="rIdLogo2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/image2.png"/></Relationships>`;
  const zip = new JSZip();
  zip.file('[Content_Types].xml', contentTypesXml);
  zip.folder('_rels').file('.rels', relsXml);
  const wordFolder = zip.folder('word');
  wordFolder.file('document.xml', documentXml);
  wordFolder.folder('_rels').file('document.xml.rels', docRelsXml);
  wordFolder.folder('media').file('image1.png', LOGO1_B64, {base64:true});
  wordFolder.folder('media').file('image2.png', LOGO2_B64, {base64:true});
  return await zip.generateAsync({type:'blob', mimeType:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'});
}
async function downloadReport(ins){
  const html = buildLetterHTML(ins);
  if(downloadsNS && typeof JSZip !== 'undefined'){
    try{
      setDocxFontSize(22); // inspection notice: 11 pt
      const blob = await htmlToDocxBlob(html);
      await downloadsNS.save({filename:(ins.factory||'notice')+'_'+ins.date+'.docx', data: blob});
      return;
    }catch(e){ /* fall through */ }
  }
  if(downloadsNS){ try{ await downloadsNS.save({filename:(ins.factory||'notice')+'_'+ins.date+'.html', data:html}); return; }catch(e){} }
  const w = window.open('', '_blank'); if(w){ w.document.write(html); w.document.close(); w.print(); }
}

function render(){
  const main = document.getElementById('main');
  const wideTabs = ['summary','inspsummary','diary','pending','records','archived'];
  const stage = document.getElementById('stage');
  if(stage) stage.classList.toggle('wide-view', wideTabs.includes(activeTab));
  updateNavCounts();
  if(activeTab==='new') return renderNew(main);
  if(activeTab==='pending') return renderPending(main);
  if(activeTab==='records') return renderRecords(main);
  if(activeTab==='diary') return renderDiary(main);
  if(activeTab==='summary') return renderSummary(main);
  if(activeTab==='annual') return renderAnnual(main);
  if(activeTab==='archived') return renderArchived(main);
  if(activeTab==='inspsummary') return renderInspSummary(main);
}

const FLAG_SLOTS = [
  ['includeTrainingRemark',5,()=>buildTrainingSentence()],
  ['includeAppointmentRemark',6,()=>buildAppointmentSentence()],
  ['includeIdCardRemark',7,()=>buildIdCardSentence()],
  ['includeLeaveCardRemark',8,()=>buildLeaveCardSentence()],
  ['includeAttendanceRemark',9,()=>buildAttendanceSentence()],
  ['includeLwrRemark',10,()=>buildLwrSentence()],
  ['includeAccidentRegRemark',11,()=>buildAccidentRegSentence()],
  ['includeCrecheRemark',12,()=>buildCrecheSentence()],
  ['includeCanteenRemark',13,()=>buildCanteenSentence()],
  ['includeSafetyCommMissingRemark',14,()=>buildSafetyCommMissingSentence()],
  ['includeSafetyCommCompositionRemark',15,()=>buildSafetyCommCompositionSentence()],
  ['includeEmergencyPlanRemark',16,()=>buildEmergencyPlanSentence()],
  ['includeLicenceAmendRemark',17,()=>buildLicenceAmendSentence()],
  ['includeSafetyComm250Remark',18,()=>buildSafetyComm250Sentence()],
  ['includeNewMapApprovalRemark',20,()=>buildNewMapApprovalSentence()],
  ['includeLicenceApplicationRemark',21,()=>buildLicenceApplicationSentence()],
  ['includeOvertimeRemark',23,()=>buildOvertimeSentence()],
  ['includeRevisedMapRemark',24,()=>buildRevisedMapSentence()]
];
// fills in any ticked checkbox whose sentence is missing (never overwrites or deletes existing text)
// Returns a copy of `ins` in which every ticked checkbox has its notice sentence. A saved record can
// hold the tick without the sentence (e.g. ticked quickly, saved from another path); the notice, the
// Summary and the દફતરે file all read through this, so a tick can never silently vanish.
// (The sentence builders read the global `draft`, so it is swapped for the copy while they run.)
// Fills the notice sentence for every ticked box whose remark slot is empty (never overwrites text).
// Works on `target` in place; the sentence builders read the global `draft`, so it is swapped meanwhile.
function fillMissingRemarks(target){
  while(target.remarks.length<25) target.remarks.push("");
  const backup = draft;
  draft = target;
  try{
    if(!(target.remarks[0]||'').trim() && [target.licNo, target.worker, target.hp, target.validYear].some(v=>String(v||'').trim()))
      target.remarks[0] = buildLicenseSentence();
    // point 3 saved with the earlier wording of the workers bracket and never edited → use the new wording
    if((target.remarks[1]||'').trim()){
      const oldFull = legacyProcessSentence() + (target.includeHazardRemark ? ' ' + buildHazardSentence() : '');
      if(target.remarks[1].trim() === oldFull.trim()) target.remarks[1] = buildProcessSentenceFull();
    }
    FLAG_SLOTS.forEach(([flag,slot,fn])=>{
      if(target[flag] && !(target.remarks[slot]||'').trim()) target.remarks[slot] = fn();
    });
    const plan = stabSlotPlan(target);
    const stabText = { compliance: buildStabilityComplianceSentence, generic: buildStabilityOffenceSentence, load: buildStabilityLoadOffenceSentence };
    [3,19,22].forEach(sl=>{ if(plan[sl] && !(target.remarks[sl]||'').trim()) target.remarks[sl] = stabText[plan[sl]](); });
  } finally { draft = backup; }
}
// The remark text on screen / in the draft must read exactly as it will in the notice:
//  • ઈમ્પ્રુવમેન્ટ નોટીસ / blank → suggestion wording (closing "આમ … ભંગ કરેલ છે." sentence removed)
//  • કાનૂની બાબત / નોટીસ   → legal wording; a sentence that is still the untouched suggestion version
//    is regenerated in full. A sentence the person has edited is never regenerated or overwritten.
function legalSentenceFor(target, slot){
  const backup = draft; draft = target;
  try{
    const fs = FLAG_SLOTS.find(x=>x[1]===slot);
    if(fs && target[fs[0]]) return fs[2]();
    if(slot===3 || slot===19 || slot===22){
      const plan = stabSlotPlan(target)[slot];
      if(plan==='generic') return buildStabilityOffenceSentence();
      if(plan==='load') return buildStabilityLoadOffenceSentence();
    }
    return null;
  } finally { draft = backup; }
}
function normalizeRemarksForMode(target){
  const suggestion = isSuggestionMode(target);
  const slots = new Set([3,19,22, ...FLAG_SLOTS.map(x=>x[1])]);
  (target.remarks||[]).forEach((t,idx)=>{
    if(!slots.has(idx) || !(t||'').trim()) return;
    if(suggestion){
      if(isOffenceText(t)) target.remarks[idx] = toSuggestionText(t);
    } else if(!isOffenceText(t)){
      const legal = legalSentenceFor(target, idx);
      if(legal && t.trim() === toSuggestionText(legal).trim()) target.remarks[idx] = legal;
    }
  });
}
function withRepairedRemarks(ins){
  const copy = {...ins, remarks:[...(ins.remarks||[])]};
  fillMissingRemarks(copy);
  normalizeRemarksForMode(copy);
  return copy;
}
function repairDraftSlots(){
  while(draft.remarks.length<25) draft.remarks.push("");
  FLAG_SLOTS.forEach(([flag,slot,fn])=>{
    if(draft[flag] && !(draft.remarks[slot]||'').trim()) draft.remarks[slot] = fn();
  });
  // stability (slots 3, 19, 22) always regenerated fresh so a rule-text fix always applies, even to old drafts
  const plan = stabSlotPlan(draft);
  const stabText = { compliance: buildStabilityComplianceSentence, generic: buildStabilityOffenceSentence, load: buildStabilityLoadOffenceSentence };
  [3,19,22].forEach(sl=>{ draft.remarks[sl] = plan[sl] ? stabText[plan[sl]]() : ""; });
}
function renderRemarksEditor(container){
  normalizeRemarksForMode(draft);
  container.innerHTML = draft.remarks.map((r,i)=>`
    <div class="remarkRow"><span>${i+2}.</span>
      <textarea data-i="${i}" class="remarkInput" placeholder="રીમાર્ક લખો">${escAttr(r)}</textarea>
      <button class="btn small danger delRemark" data-i="${i}">✕</button></div>`).join('');
  container.querySelectorAll('.remarkInput').forEach(t=>t.oninput=e=>{ draft.remarks[+e.target.dataset.i]=e.target.value; });
  container.querySelectorAll('.delRemark').forEach(b=>b.onclick=e=>{
    const i = +e.target.dataset.i;
    if(i < 25){
      // fixed slots: only empty the text (splicing would shift the later slots) and untick the matching checkbox
      draft.remarks[i] = "";
      const fs = FLAG_SLOTS.find(x=>x[1]===i);
      if(fs) draft[fs[0]] = false;
      if(i===3 || i===19 || i===22){ draft.includeStabilityOffence=false; draft.includeStabilityLoadOffence=false; }
    } else {
      draft.remarks.splice(i,1);
    }
    render();
  });
}
function renderWorkersEditor(container){
  container.innerHTML = draft.workers.map((w,i)=>`
    <div class="remarkRow"><span>${i+1}.</span>
      <input type="text" data-i="${i}" class="workerName" placeholder="શ્રમયોગીનું નામ" value="${escAttr(w.name)}" style="flex:2;">
      <input type="text" data-i="${i}" class="workerWork" placeholder="કામનો પ્રકાર" value="${escAttr(w.work)}" style="flex:2;">
      ${draft.includeOvertimeRemark?`<input type="text" data-i="${i}" class="workerHours" placeholder="કામના કલાક (સવારે ૭:૦૦ થી સાંજે ૭:૦૦)" value="${escAttr(w.hours||'')}" style="flex:2;">`:''}
      <button class="btn small danger delWorker" data-i="${i}">✕</button></div>`).join('');
  container.querySelectorAll('.workerName').forEach(t=>t.oninput=e=>{ draft.workers[+e.target.dataset.i].name=e.target.value; syncWorkersRemark(); });
  container.querySelectorAll('.workerWork').forEach(t=>t.oninput=e=>{ draft.workers[+e.target.dataset.i].work=e.target.value; syncWorkersRemark(); });
  container.querySelectorAll('.workerHours').forEach(t=>t.oninput=e=>{ draft.workers[+e.target.dataset.i].hours=e.target.value; syncWorkersRemark(); });
  container.querySelectorAll('.delWorker').forEach(b=>b.onclick=e=>{ draft.workers.splice(+e.target.dataset.i,1); if(!draft.workers.length) draft.workers=[{name:"",work:""}]; render(); });
}
function syncWorkersRemark(){
  while(draft.remarks.length<24) draft.remarks.push("");
  draft.remarks[4] = buildWorkersSentence();
  if(draft.includeTrainingRemark){ draft.remarks[5] = buildTrainingSentence(); }
  if(draft.includeAppointmentRemark){ draft.remarks[6] = buildAppointmentSentence(); }
  if(draft.includeIdCardRemark){ draft.remarks[7] = buildIdCardSentence(); }
  if(draft.includeLeaveCardRemark){ draft.remarks[8] = buildLeaveCardSentence(); }
  if(draft.includeOvertimeRemark){ draft.remarks[23] = buildOvertimeSentence(); }
  const remarksBox = document.getElementById('remarksBox');
  if(remarksBox) renderRemarksEditor(remarksBox);
  refreshOffenceSummaryBox();
}
function renderSafetyEditor(container){
  container.innerHTML = `<datalist id="safetySuggestList">${SAFETY_SUGGESTIONS.map(s=>`<option value="${s.replace(/"/g,'&quot;')}">`).join('')}</datalist>` +
    draft.safetyPoints.map((p,i)=>`
    <div class="remarkRow"><span>${letterFor(i)})</span>
      <input type="text" list="safetySuggestList" data-i="${i}" class="safetyInput" placeholder="સલામતી સુચન ટાઈપ કરો અથવા લિસ્ટમાંથી પસંદ કરો" value="${escAttr(p)}" style="flex:1;">
      <button class="btn small danger delSafety" data-i="${i}">✕</button></div>`).join('') || '<p class="hint">કોઈ સલામતી સુચન નથી</p>';
  container.querySelectorAll('.safetyInput').forEach(t=>t.oninput=e=>{ draft.safetyPoints[+e.target.dataset.i]=e.target.value; });
  container.querySelectorAll('.delSafety').forEach(b=>b.onclick=e=>{ draft.safetyPoints.splice(+e.target.dataset.i,1); render(); });
}

function renderNew(main){
  fillMissingRemarks(draft); // a ticked box must always show its point in the remarks list
  main.innerHTML = `
  ${editBannerHTML()}
  ${sampleNS && sampleCaps && sampleCaps.images ? `<div class="card">
    <label style="margin-top:0;">📷 ફિલ્ડ ફોર્મનો ફોટો અપલોડ કરો (AI થી ભરાવો)</label>
    <p class="hint" style="margin:2px 0 8px;">ફોર્મના ૧, ૨ કે ૩ પેજ, બધા ફોટા એકસાથે પસંદ કરો. ફોર્મ સ્પષ્ટ, પૂરેપૂરું અને સીધું દેખાય એ રીતે ફોટો પાડો. ભરાયા પછી દરેક ફિલ્ડ જાતે ચકાસી લેજો.</p>
    <input type="file" id="f-ocr-photos" accept="image/*" multiple>
    <button class="btn small" id="f-ocr-run" style="margin-top:8px;">ફોટા પરથી ફોર્મ ભરો</button>
    <div id="ocrStatus" style="margin-top:8px;"></div>
  </div>` : `<div class="card">
    <label style="margin-top:0;">📷 ફોટોથી ફોર્મ ભરવાની સુવિધા</label>
    <p class="hint" style="margin:2px 0;">આ સુવિધા હાલ બંધ છે — સર્વરમાં ANTHROPIC_API_KEY સેટ કર્યા પછી ચાલુ થશે (README જુઓ).</p>
    ${sampleNS ? '<button class="btn small secondary" id="f-ocr-recheck">ફરી ચેક કરો</button>' : ''}
  </div>`}
  <div class="card">
    <label style="margin-top:0;">તારીખ (કેલેન્ડરમાંથી પસંદ કરો)</label><input type="text" id="f-date" class="dp-trigger" readonly value="${isoToDMYInput(draft.date)}" placeholder="DD/MM/YYYY">
    <label>તપાસણી કરનાર ઇન્સ્પેક્ટરના નામ</label><input type="text" id="f-inspectors" value="${escAttr(draft.inspectors)}">
    <label>કાનૂની બાબત (નોટિસમાં હેડિંગ તરીકે આવશે) — ઈમ્પ્રુવમેન્ટ નોટીસ / ખાલી = સૂચન-સ્વરૂપ લખાણ, કાનૂની બાબત / નોટીસ = ભંગ સાથેનું લખાણ</label>
    <select id="f-casetype">
      <option value="" ${draft.caseType===''?'selected':''}>ખાલી રાખો</option>
      <option value="કાનૂની બાબત" ${draft.caseType==='કાનૂની બાબત'?'selected':''}>કાનૂની બાબત</option>
      <option value="ઈમ્પ્રુવમેન્ટ નોટીસ" ${draft.caseType==='ઈમ્પ્રુવમેન્ટ નોટીસ'?'selected':''}>ઈમ્પ્રુવમેન્ટ નોટીસ</option>
      <option value="નોટીસ" ${draft.caseType==='નોટીસ'?'selected':''}>નોટીસ</option>
    </select>
    <label>ફેક્ટરીનું નામ (લિસ્ટમાંથી ટાઈપ કરી શોધો)</label>
    <input type="text" id="f-factory" list="factoryDataList" value="${escAttr(draft.factory)}" placeholder="ફેક્ટરીનું નામ ટાઈપ કરો...">
    <datalist id="factoryDataList">${FACTORY_DB.map(f=>`<option value="${f.name.replace(/"/g,'&quot;')}">`).join('')}</datalist>
    <label>સરનામું (લિસ્ટમાં મળે તો આપોઆપ ભરાશે, જરૂર પડે એડિટ કરો)</label><input type="text" id="f-address" value="${escAttr(draft.address)}" placeholder="સરનામું">
    <label>મુલાકાતનો હેતુ (રોજનીશી માટે)</label>
    <input type="text" id="f-purpose" list="purposeList" value="${escAttr(draft.visitPurpose)}" placeholder="તપાસણી / મુલાકાત / તમારે જે લખવું હોય તે">
    <datalist id="purposeList"><option value="તપાસણી"><option value="મુલાકાત"></datalist>
  </div>
  <div class="card">
    <label style="margin-top:0;">લાયસન્સ વિગત (ફેક્ટરી પસંદ કરો એટલે આપોઆપ ભરાય, જરૂર પડે એડિટ કરો)</label>
    <div class="row">
      <div style="flex:1;min-width:120px;"><label>લાયસન્સ નં.</label><input type="text" id="f-licno" value="${escAttr(draft.licNo)}"></div>
      <div style="flex:1;min-width:100px;"><label>કામદાર</label><input type="text" id="f-worker" value="${escAttr(draft.worker)}"></div>
      <div style="flex:1;min-width:100px;"><label>હોર્સપાવર</label><input type="text" id="f-hp" value="${escAttr(draft.hp)}"></div>
      <div style="flex:1;min-width:100px;"><label>રિન્યુ વર્ષ</label><input type="text" id="f-validyear" value="${escAttr(draft.validYear)}"></div>
    </div>
    <button class="btn small secondary" id="addLicRemark">+ લાયસન્સ રીમાર્ક તરીકે ઉમેરો</button>
  </div>
  <div class="card">
    <label style="margin-top:0;">ઉત્પાદન પ્રક્રિયા વિગત (પોઈન્ટ નં.૩ માટે)</label>
    <div class="row">
      <div style="flex:1;min-width:90px;"><label>પુરુષ</label><input type="text" id="f-male" value="${escAttr(draft.maleWorkers)}"></div>
      <div style="flex:1;min-width:90px;"><label>સ્ત્રી</label><input type="text" id="f-female" value="${escAttr(draft.femaleWorkers)}"></div>
      <div style="flex:1;min-width:90px;"><label>કોંટ્રાક્ટ</label><input type="text" id="f-contract" value="${escAttr(draft.contractWorkers)}"></div>
      <div style="flex:1;min-width:90px;"><label>કુલ</label><input type="text" id="f-total" value="${escAttr(draft.totalWorkers)}"></div>
    </div>
    <label>કાચો માલ</label><input type="text" id="f-rawmat" value="${escAttr(draft.rawMaterial)}" placeholder="દા.ત. ગ્રે ફેબ્રિક, કલર">
    <label>મશીનરી</label><input type="text" id="f-machinery" value="${escAttr(draft.machinery)}" placeholder="દા.ત. ડિજિટલ પ્રિન્ટીંગ મશીન">
    <label>અંતિમ ઉત્પાદન</label><input type="text" id="f-finalprod" value="${escAttr(draft.finalProduct)}" placeholder="દા.ત. પ્રિન્ટીંગ કાપડ">
    <label style="margin-top:14px;"><input type="checkbox" id="f-hazardinclude" ${draft.includeHazardRemark?'checked':''}> આ જ પોઈન્ટમાં જોખમી ઉત્પાદન પ્રક્રિયાનું વાક્ય પણ ઉમેરવું (જરૂર પડે)</label>
    <label>શેડ્યુલ નંબર</label><input type="text" id="f-schedule" value="${escAttr(draft.hazardScheduleNo)}" placeholder="Schedule-1">
    <button class="btn small secondary" id="addProcessRemark">+ ઉત્પાદન પ્રક્રિયા રીમાર્ક ઉમેરો</button>
  </div>
  <div class="card">
    <label style="margin-top:0;">નકશા મંજૂરી વિગત (પોઈન્ટ નં.૪ માટે)</label>
    <div class="row">
      <div style="flex:1;min-width:140px;"><label>નકશા મંજૂરી તારીખ (કેલેન્ડરમાંથી)</label><input type="text" id="f-mapdate" class="dp-trigger" readonly value="${isoToDMYInput(draft.mapApprovalDate)}" placeholder="DD/MM/YYYY"></div>
      <div style="flex:1;min-width:100px;"><label>નકશા મંજૂરી નં.</label><input type="text" id="f-mapno" value="${escAttr(draft.mapApprovalNo)}"></div>
    </div>
    <label>રીવાઈઝ્ડ / એક્સ્ટેંશન નકશા (૨ કે વધુ નકશા હોય તો)</label>
    <div id="mapRevBox"></div>
    <button class="btn small secondary" id="addMapRev">+ રીવાઈઝ્ડ નકશો ઉમેરો</button>
  </div>
  <div class="card">
    <label style="margin-top:0;">સ્ટેબિલિટી સર્ટિફિકેટ — નિયમ-૭૦(૧) (પોઈન્ટ નં.૫): ડિટેલ્સ ભરો તો કમ્પ્લાયન્સ મુદ્દો આપોઆપ ઉમેરાશે</label>
    <div class="row">
      <div style="flex:1;min-width:140px;"><label>સક્ષમ વ્યક્તિ (Competent Person)</label><input type="text" id="f-stabperson" value="${escAttr(draft.stabCompetentPerson)}" placeholder="દા.ત. Mr.Tarapara"></div>
      <div style="flex:1;min-width:140px;"><label>સર્ટિફિકેટ તારીખ (કેલેન્ડરમાંથી)</label><input type="text" id="f-stabdate" class="dp-trigger" readonly value="${isoToDMYInput(draft.stabCertDate)}" placeholder="DD/MM/YYYY"></div>
    </div>
    <label><input type="checkbox" id="f-stab-offence" ${draft.includeStabilityOffence?'checked':''}> ડિટેલ્સ ન હોય અને ભંગ (offence) ઉમેરવો હોય તો આ ચેકબોક્સ ઓન કરો</label>
    <label><input type="checkbox" id="f-stab-load" ${draft.includeStabilityLoadOffence?'checked':''}> લોડ કેલ્ક્યુલેશન (ફ્લોર/ચોરસ મીટર વજન ગણતરી) ઉપલબ્ધ નથી — ભંગ ઉમેરવો</label>
  </div>
  <div class="card">
    <label style="margin-top:0;">શ્રમયોગી યાદી (પોઈન્ટ નં.૬ માટે — નામ અને કામનો પ્રકાર)</label>
    <div id="workersBox"></div>
    <button class="btn small secondary" id="addWorker">+ શ્રમયોગી ઉમેરો</button>
  </div>
  <div class="card">
    <label style="margin-top:0;"><input type="checkbox" id="f-training" ${draft.includeTrainingRemark?'checked':''}> સલામતીની તાલીમ — નિયમ-૧૪(૨)(બી) (પોઈન્ટ નં.૭ — પોઈન્ટ ૬ ના શ્રમયોગીઓ મુજબ આપોઆપ બનશે)</label>
    <label><input type="checkbox" id="f-appointment" ${draft.includeAppointmentRemark?'checked':''}> નિમણૂક પત્ર — કલમ-૬(૧)(એફ) સાથે નિયમ-૧૦ (પોઈન્ટ નં.૮ — પોઈન્ટ ૬ ના શ્રમયોગીઓ મુજબ આપોઆપ બનશે)</label>
    <label><input type="checkbox" id="f-idcard" ${draft.includeIdCardRemark?'checked':''}> ઓળખકાર્ડ — નિયમ-૩૧(૧) (પોઈન્ટ નં.૯ — પોઈન્ટ ૬ ના શ્રમયોગીઓ મુજબ આપોઆપ બનશે)</label>
    <label><input type="checkbox" id="f-overtime" ${draft.includeOvertimeRemark?'checked':''}> દિવસના ૮ કલાકથી વધુ કામ (ઓવરટાઇમ) — કલમ-૨૫(૧)(એ) (પોઈન્ટ ૬ ના શ્રમયોગી મુજબ; ઓન કરો તો શ્રમયોગી યાદીમાં "કામના કલાક" કોલમ ઉમેરાશે)</label>
    <label>દિવસના કામના કલાક (દા.ત. 12 — ઓવરટાઇમ ઓન હોય ત્યારે વાક્યમાં આવશે)</label><input type="text" id="f-overtimehours" value="${escAttr(draft.overtimeHours||'')}" placeholder="દા.ત. 12">
    <label><input type="checkbox" id="f-leavecard" ${draft.includeLeaveCardRemark?'checked':''}> લીવ કાર્ડ — નિયમ-૩૩ (પોઈન્ટ નં.૧૦)</label>
    <label><input type="checkbox" id="f-attendance" ${draft.includeAttendanceRemark?'checked':''}> હાજરી રજિસ્ટર - ફોર્મ-૧૪ — નિયમ-૨૯(૧)(બી) (પોઈન્ટ નં.૧૧)</label>
    <label><input type="checkbox" id="f-lwr" ${draft.includeLwrRemark?'checked':''}> લીવ વિથ વેજીસ રજિસ્ટર - ફોર્મ-૧૯ — કલમ-૩૨ સાથે નિયમ-૩૨ (પોઈન્ટ નં.૧૨)</label>
    <label>વર્ષ (સને)</label><input type="text" id="f-lwryear" value="${escAttr(draft.lwrYear)}" placeholder="દા.ત. ૨૦૨૬">
    <label><input type="checkbox" id="f-accidentreg" ${draft.includeAccidentRegRemark?'checked':''}> અકસ્માત રજિસ્ટર - ફોર્મ-૨૨ — નિયમ-૩૬ (પોઈન્ટ નં.૧૩)</label>
    <label><input type="checkbox" id="f-creche" ${draft.includeCrecheRemark?'checked':''}> ઘોડિયાઘર (Crèche) ઉપલબ્ધ નથી — કલમ-૨૪(૩) સાથે નિયમ-૫૮ (પોઈન્ટ નં.૧૪ — કુલ શ્રમયોગી ${draft.totalWorkers||'?'}, >50 હોય તો લાગુ પડે)</label>
    <label><input type="checkbox" id="f-canteen" ${draft.includeCanteenRemark?'checked':''}> કેન્ટીન (Canteen) ઉપલબ્ધ નથી — કલમ-૨૪(૧)(વી) સાથે નિયમ-૫૩ (પોઈન્ટ નં.૧૫ — કુલ શ્રમયોગી ${draft.totalWorkers||'?'}, ≥100 હોય તો લાગુ પડે)</label>
    <label><input type="checkbox" id="f-safetycomm-missing" ${draft.includeSafetyCommMissingRemark?'checked':''}> સેફ્ટી કમિટી રચના નથી (જોખમી પ્રક્રિયા, ૫૦+ શ્રમયોગી) — કલમ-૨૨(૧) સાથે નિયમ-૧૭(૧)(બી) (પોઈન્ટ નં.૧૬ — શેડ્યુલ અનુક્રમ અને કુલ શ્રમયોગી પોઈન્ટ ૩ માંથી લેવાય)</label>
    <label><input type="checkbox" id="f-safetycomm-comp" ${draft.includeSafetyCommCompositionRemark?'checked':''}> સેફ્ટી કમિટી રચના યોગ્ય નથી — કલમ-૨૨(૧) સાથે નિયમ-૧૮ (પોઈન્ટ નં.૧૭)</label>
    <label><input type="checkbox" id="f-emergencyplan" ${draft.includeEmergencyPlanRemark?'checked':''}> ઓન-સાઇટ ઇમરજન્સી પ્લાન નથી — કલમ-૮૪(૪) (પોઈન્ટ નં.૧૮)</label>
    <label><input type="checkbox" id="f-licenceamend" ${draft.includeLicenceAmendRemark?'checked':''}> લાઇસન્સ સુધારો (Amendment) નથી કરાવ્યો — નિયમ-૭૬(૧) (પોઈન્ટ નં.૧૯)</label>
    <label><input type="checkbox" id="f-safetycomm250" ${draft.includeSafetyComm250Remark?'checked':''}> સેફ્ટી કમિટી રચના નથી (૨૫૦+ શ્રમયોગી, જોખમી ન હોય તોય) — કલમ-૨૨(૧) સાથે નિયમ-૧૭(૧)(સી) (પોઈન્ટ નં.૨૦)</label>
    <label><input type="checkbox" id="f-newmapapproval" ${draft.includeNewMapApprovalRemark?'checked':''}> નવા નકશા મંજૂર કરાવ્યા નથી — કલમ-૭૯ સાથે નિયમ-૬૯(૧) (પોઈન્ટ નં.૨૧ — ઇન્સ્પેક્શન તારીખ આપોઆપ વાક્યમાં આવે)</label>
    <label><input type="checkbox" id="f-revisedmap" ${draft.includeRevisedMapRemark?'checked':''}> રીવાઈઝ્ડ નક્શા મંજૂર કરાવ્યા નથી — કલમ-૭૯ સાથે નિયમ-૬૯(૧) (પ્લાંટ/લે-આઉટ બદલાયેલ હોય ત્યારે)</label>
    <label><input type="checkbox" id="f-licenceapplication" ${draft.includeLicenceApplicationRemark?'checked':''}> ફેક્ટરી લાયસન્સ અરજી રજુ કરેલ નથી — કલમ-૭૯ સાથે નિયમ-૭૫(૧) (પોઈન્ટ નં.૨૨ — ઇન્સ્પેક્શન તારીખ આપોઆપ વાક્યમાં આવે)</label>
  </div>
  <div class="card">
    <label style="margin-top:0;">રીમાર્ક્સ (નં. ૧ આપોઆપ તપાસણી-લાઈન છે, અહીંથી નં. ૨ થી શરૂ)</label>
    <div id="remarksBox"></div>
    <button class="btn small secondary" id="addRemark">+ રીમાર્ક ઉમેરો</button>
  </div>
  <div class="card">
    <label style="margin-top:0;"><input type="checkbox" id="f-safetyorder" ${draft.includeSafetyOrder?'checked':''}> સલામતી હુકમ (સેફ્ટી ઓર્ડર) ઉમેરવો</label>
    <div id="safetyBox" style="margin-top:8px;"></div>
    <button class="btn small secondary" id="addSafety">+ સલામતી સુચન ઉમેરો</button>
  </div>
  <div class="card">
    <label style="margin-top:0;"><input type="checkbox" id="f-penalty" ${draft.includePenalty?'checked':''}> સ્ટાન્ડર્ડ દંડની જોગવાઈવાળો ફકરો ઉમેરવો (દંડની જોગવાઈ + ૩૦ દિવસ/કમ્પાઉન્ડિંગવાળો ફકરો — બંને આમાં આવે)</label>
    <label>હાજર વ્યક્તિનું નામ</label><input type="text" id="f-present" value="${escAttr(draft.presentPerson)}">
    <label>કબજેદારશ્રીનું નામ</label><input type="text" id="f-owner" value="${escAttr(draft.ownerName)}">
    <label>કબજેદારશ્રીનું સરનામું / રહેઠાણ (ભરો તો જ વાક્યમાં "રહેઠાણ-…" આવશે)</label><input type="text" id="f-owneraddress" value="${escAttr(draft.ownerAddress||'')}" placeholder="દા.ત. ૧૨, સોસાયટી, નવસારી">
    <label>કબજેદારશ્રીનો ફોન નંબર</label><input type="text" id="f-ownerphone" value="${escAttr(draft.ownerPhone)}">
    <label>કબજેદારશ્રીનું ઈ-મેલ (ભરો તો જ વાક્યમાં આવશે)</label><input type="text" id="f-owneremail" value="${escAttr(draft.ownerEmail||'')}" placeholder="દા.ત. name@example.com">
    <label>કંસલટંટ (ઇન્સ્પેક્શન સમરી માટે — લિસ્ટમાંથી પસંદ કરો અથવા નવું ટાઈપ કરો)</label>
    <input type="text" id="f-consultant" list="consultantOptions" value="${escAttr(draft.consultant||'')}" placeholder="દા.ત. Self / Parimal">
    <datalist id="consultantOptions">${(settings.consultantList||[]).map(c=>`<option value="${c.replace(/"/g,'&quot;')}">`).join('')}</datalist>
    <label>Remark (ઇન્સ્પેક્શન સમરી માટે)</label><input type="text" id="f-summaryremark" value="${escAttr(draft.summaryRemark||'')}">
    <label>Safety Authorize (ઇન્સ્પેક્શન સમરી માટે — લિસ્ટમાંથી પસંદ કરો અથવા નવું ટાઈપ કરો)</label>
    <input type="text" id="f-safetyauth" list="safetyAuthOptions" value="${escAttr(draft.safetyAuthorize||'')}">
    <datalist id="safetyAuthOptions">${(settings.safetyAuthorizeList||[]).map(c=>`<option value="${c.replace(/"/g,'&quot;')}">`).join('')}</datalist>
    <label class="hint">પાલન સંદર્ભ (રીમાર્કસ નં.) હવે નોટિસમાં આપોઆપ સાચા પોઈન્ટ નં. પ્રમાણે ગણાઈ જાય છે</label>
    <label>સ્થળ</label><input type="text" id="f-place" value="${escAttr(draft.place)}">
  </div>
  <div class="card">
    <div class="row">
      <button class="btn secondary" id="save-draft">ડ્રાફ્ટ સેવ કરો (રોજનીશીમાં પણ નોંધાશે)</button>
      <button class="btn" id="download-rep">નોટિસ ડાઉનલોડ (Word)</button>
      <button class="btn warn" id="mark-outward">આઉટવર્ડ મોકલ્યું</button>
    </div>
    <div id="outwardPanel" style="display:none; margin-top:10px; padding-top:10px; border-top:1px dashed var(--line);">
      <label style="margin-top:0;">આઉટવર્ડ નંબર (ફક્ત નંબર — "નવ/____/૨૦૨૬" માં આપોઆપ ગોઠવાશે)</label>
      <input type="text" id="f-noticeno-out" placeholder="દા.ત. 123">
      <label>આઉટવર્ડ તારીખ</label>
      <input type="text" id="f-outdate" class="dp-trigger" readonly placeholder="DD/MM/YYYY">
      <button class="btn small" id="confirm-outward">કન્ફર્મ આઉટવર્ડ</button>
      <button class="btn small secondary" id="cancel-outward">રદ કરો</button>
    </div>
  </div>
  <div class="card">
    <label style="margin-top:0;">ભંગોનો સારાંશ (નોટિસમાં ઉમેરાતું નથી, ફક્ત જોવા માટે)</label>
    <div id="offenceSummaryBox"></div>
  </div>
  <div class="card">
    <label style="margin-top:0;">સેવ કરેલા ડ્રાફ્ટ</label>
    <div id="draftsBox"></div>
  </div>`;
  renderRemarksEditor(document.getElementById('remarksBox'));
  renderSafetyEditor(document.getElementById('safetyBox'));
  renderWorkersEditor(document.getElementById('workersBox'));
  refreshOffenceSummaryBox();
  renderDraftsList();
  document.getElementById('addWorker').onclick=()=>{ draft.workers.push({name:"",work:"",age:""}); render(); };
  document.getElementById('f-training').onchange=e=>{
    draft.includeTrainingRemark = e.target.checked;
    while(draft.remarks.length<7) draft.remarks.push("");
    draft.remarks[5] = e.target.checked ? buildTrainingSentence() : "";
    const remarksBox = document.getElementById('remarksBox');
    if(remarksBox) renderRemarksEditor(remarksBox);
    refreshOffenceSummaryBox();
  };
  document.getElementById('f-appointment').onchange=e=>{
    draft.includeAppointmentRemark = e.target.checked;
    while(draft.remarks.length<8) draft.remarks.push("");
    draft.remarks[6] = e.target.checked ? buildAppointmentSentence() : "";
    const remarksBox = document.getElementById('remarksBox');
    if(remarksBox) renderRemarksEditor(remarksBox);
    refreshOffenceSummaryBox();
  };
  document.getElementById('f-idcard').onchange=e=>{
    draft.includeIdCardRemark = e.target.checked;
    while(draft.remarks.length<9) draft.remarks.push("");
    draft.remarks[7] = e.target.checked ? buildIdCardSentence() : "";
    const remarksBox = document.getElementById('remarksBox');
    if(remarksBox) renderRemarksEditor(remarksBox);
    refreshOffenceSummaryBox();
  };
  document.getElementById('f-leavecard').onchange=e=>{
    draft.includeLeaveCardRemark = e.target.checked;
    while(draft.remarks.length<9) draft.remarks.push("");
    draft.remarks[8] = e.target.checked ? buildLeaveCardSentence() : "";
    const remarksBox = document.getElementById('remarksBox');
    if(remarksBox) renderRemarksEditor(remarksBox);
    refreshOffenceSummaryBox();
  };
  document.getElementById('f-attendance').onchange=e=>{
    draft.includeAttendanceRemark = e.target.checked;
    while(draft.remarks.length<10) draft.remarks.push("");
    draft.remarks[9] = e.target.checked ? buildAttendanceSentence() : "";
    const remarksBox = document.getElementById('remarksBox');
    if(remarksBox) renderRemarksEditor(remarksBox);
    refreshOffenceSummaryBox();
  };
  document.getElementById('f-lwr').onchange=e=>{
    draft.includeLwrRemark = e.target.checked;
    while(draft.remarks.length<11) draft.remarks.push("");
    draft.remarks[10] = e.target.checked ? buildLwrSentence() : "";
    const remarksBox = document.getElementById('remarksBox');
    if(remarksBox) renderRemarksEditor(remarksBox);
    refreshOffenceSummaryBox();
  };
  document.getElementById('f-lwryear').oninput=e=>{
    draft.lwrYear = e.target.value;
    if(draft.includeLwrRemark){
      while(draft.remarks.length<11) draft.remarks.push("");
      draft.remarks[10] = buildLwrSentence();
      const remarksBox = document.getElementById('remarksBox');
      if(remarksBox) renderRemarksEditor(remarksBox);
    }
  };
  document.getElementById('f-accidentreg').onchange=e=>{
    draft.includeAccidentRegRemark = e.target.checked;
    while(draft.remarks.length<12) draft.remarks.push("");
    draft.remarks[11] = e.target.checked ? buildAccidentRegSentence() : "";
    const remarksBox = document.getElementById('remarksBox');
    if(remarksBox) renderRemarksEditor(remarksBox);
    refreshOffenceSummaryBox();
  };
  document.getElementById('f-creche').onchange=e=>{
    draft.includeCrecheRemark = e.target.checked;
    while(draft.remarks.length<14) draft.remarks.push("");
    draft.remarks[12] = e.target.checked ? buildCrecheSentence() : "";
    const remarksBox = document.getElementById('remarksBox');
    if(remarksBox) renderRemarksEditor(remarksBox);
    refreshOffenceSummaryBox();
  };
  document.getElementById('f-canteen').onchange=e=>{
    draft.includeCanteenRemark = e.target.checked;
    while(draft.remarks.length<14) draft.remarks.push("");
    draft.remarks[13] = e.target.checked ? buildCanteenSentence() : "";
    const remarksBox = document.getElementById('remarksBox');
    if(remarksBox) renderRemarksEditor(remarksBox);
    refreshOffenceSummaryBox();
  };
  document.getElementById('f-safetycomm-missing').onchange=e=>{
    draft.includeSafetyCommMissingRemark = e.target.checked;
    while(draft.remarks.length<16) draft.remarks.push("");
    draft.remarks[14] = e.target.checked ? buildSafetyCommMissingSentence() : "";
    const remarksBox = document.getElementById('remarksBox');
    if(remarksBox) renderRemarksEditor(remarksBox);
    refreshOffenceSummaryBox();
  };
  document.getElementById('f-safetycomm-comp').onchange=e=>{
    draft.includeSafetyCommCompositionRemark = e.target.checked;
    while(draft.remarks.length<16) draft.remarks.push("");
    draft.remarks[15] = e.target.checked ? buildSafetyCommCompositionSentence() : "";
    const remarksBox = document.getElementById('remarksBox');
    if(remarksBox) renderRemarksEditor(remarksBox);
    refreshOffenceSummaryBox();
  };
  document.getElementById('f-emergencyplan').onchange=e=>{
    draft.includeEmergencyPlanRemark = e.target.checked;
    while(draft.remarks.length<17) draft.remarks.push("");
    draft.remarks[16] = e.target.checked ? buildEmergencyPlanSentence() : "";
    const remarksBox = document.getElementById('remarksBox');
    if(remarksBox) renderRemarksEditor(remarksBox);
    refreshOffenceSummaryBox();
  };
  document.getElementById('f-licenceamend').onchange=e=>{
    draft.includeLicenceAmendRemark = e.target.checked;
    while(draft.remarks.length<18) draft.remarks.push("");
    draft.remarks[17] = e.target.checked ? buildLicenceAmendSentence() : "";
    const remarksBox = document.getElementById('remarksBox');
    if(remarksBox) renderRemarksEditor(remarksBox);
    refreshOffenceSummaryBox();
  };
  document.getElementById('f-safetycomm250').onchange=e=>{
    draft.includeSafetyComm250Remark = e.target.checked;
    while(draft.remarks.length<19) draft.remarks.push("");
    draft.remarks[18] = e.target.checked ? buildSafetyComm250Sentence() : "";
    const remarksBox = document.getElementById('remarksBox');
    if(remarksBox) renderRemarksEditor(remarksBox);
    refreshOffenceSummaryBox();
  };
  document.getElementById('f-newmapapproval').onchange=e=>{
    draft.includeNewMapApprovalRemark = e.target.checked;
    while(draft.remarks.length<21) draft.remarks.push("");
    draft.remarks[20] = e.target.checked ? buildNewMapApprovalSentence() : "";
    const remarksBox = document.getElementById('remarksBox');
    if(remarksBox) renderRemarksEditor(remarksBox);
    refreshOffenceSummaryBox();
  };
  document.getElementById('f-licenceapplication').onchange=e=>{
    draft.includeLicenceApplicationRemark = e.target.checked;
    while(draft.remarks.length<22) draft.remarks.push("");
    draft.remarks[21] = e.target.checked ? buildLicenceApplicationSentence() : "";
    const remarksBox = document.getElementById('remarksBox');
    if(remarksBox) renderRemarksEditor(remarksBox);
    refreshOffenceSummaryBox();
  };
  document.getElementById('f-overtime').onchange=e=>{
    draft.includeOvertimeRemark = e.target.checked;
    while(draft.remarks.length<24) draft.remarks.push("");
    draft.remarks[23] = e.target.checked ? buildOvertimeSentence() : "";
    const workersBox = document.getElementById('workersBox');
    if(workersBox) renderWorkersEditor(workersBox);
    syncWorkersRemark();
  };
  document.getElementById('f-overtimehours').oninput=e=>{
    draft.overtimeHours = e.target.value;
    if(draft.includeOvertimeRemark){
      while(draft.remarks.length<24) draft.remarks.push("");
      draft.remarks[23] = buildOvertimeSentence();
      const remarksBox = document.getElementById('remarksBox');
      if(remarksBox) renderRemarksEditor(remarksBox);
    }
  };
  document.getElementById('f-revisedmap').onchange=e=>{
    draft.includeRevisedMapRemark = e.target.checked;
    while(draft.remarks.length<25) draft.remarks.push("");
    draft.remarks[24] = e.target.checked ? buildRevisedMapSentence() : "";
    const remarksBox = document.getElementById('remarksBox');
    if(remarksBox) renderRemarksEditor(remarksBox);
    refreshOffenceSummaryBox();
  };
  document.getElementById('addRemark').onclick=()=>{ draft.remarks.push(""); render(); };
  document.getElementById('addSafety').onclick=()=>{
    draft.safetyPoints.push("");
    const safetyBox = document.getElementById('safetyBox');
    if(safetyBox) renderSafetyEditor(safetyBox);
  };
  if(document.getElementById('f-ocr-recheck')){
    document.getElementById('f-ocr-recheck').onclick = async ()=>{
      const btn = document.getElementById('f-ocr-recheck');
      btn.disabled = true; btn.textContent = 'ચેક થાય છે...';
      try{ sampleCaps = await sampleNS.limits(); }catch(e){ sampleCaps = null; }
      render();
    };
  }
  if(document.getElementById('f-ocr-run')){
    document.getElementById('f-ocr-run').onclick = async ()=>{
      const fileInput = document.getElementById('f-ocr-photos');
      const statusEl = document.getElementById('ocrStatus');
      const files = fileInput.files;
      if(!files || !files.length){ statusEl.innerHTML = '<span class="badge warn">પહેલા ફોટો પસંદ કરો</span>'; return; }
      const btn = document.getElementById('f-ocr-run');
      btn.disabled = true;
      statusEl.innerHTML = '<span class="badge warn">ફોર્મ વાંચાય છે… (થોડી સેકંડ લાગશે)</span>';
      const result = await runOcrFill(files);
      btn.disabled = false;
      if(result.error){
        const msg = result.error==='not_granted' ? 'પરવાનગી આપી નહીં, ફરી ટ્રાય કરો.'
          : result.error==='images_unavailable' ? 'આ વ્યુમાં ફોટો સપોર્ટ નથી.'
          : result.error==='image_rejected' ? 'ફોટો સ્વીકારાયો નહીં (ફોર્મેટ/સાઈઝ ચેક કરો).'
          : 'ફોર્મ વાંચવામાં ભૂલ આવી, ફરી ટ્રાય કરો.';
        statusEl.innerHTML = `<span class="badge danger">${msg}</span>`;
        return;
      }
      const warnings = applyOcrResult(result.data);
      let html = '<span class="badge ok">ફોર્મ ભરાઈ ગયું — નીચે દરેક વિગત ચકાસી લો</span>';
      if(warnings.length) html += '<div style="margin-top:6px;">' + warnings.map(w=>`<div class="badge danger" style="display:block;margin-top:4px;">⚠ ${w}</div>`).join('') + '</div>';
      statusEl.innerHTML = html;
      render();
      document.getElementById('ocrStatus').innerHTML = html;
    };
  }
  document.getElementById('f-date').onclick=e=>{
    openDatePicker(e.target, draft.date, iso=>{ draft.date = iso; e.target.value = isoToDMYInput(iso); });
  };
  document.getElementById('f-inspectors').oninput=e=>draft.inspectors=e.target.value;
  document.getElementById('f-casetype').onchange=e=>{
    draft.caseType = e.target.value;
    const rb = document.getElementById('remarksBox');
    if(rb) renderRemarksEditor(rb);      // re-words the points for the chosen heading
    refreshOffenceSummaryBox();
  };
  document.getElementById('f-factory').oninput=e=>{
    draft.factory=e.target.value;
    const hit = lookupFactory(e.target.value);
    if(hit){
      draft.address=hit.address; document.getElementById('f-address').value=hit.address;
      draft.licNo=hit.licNo||""; document.getElementById('f-licno').value=draft.licNo;
      draft.worker=hit.worker||""; document.getElementById('f-worker').value=draft.worker;
      draft.hp=hit.hp||""; document.getElementById('f-hp').value=draft.hp;
      draft.validYear=hit.validYear||""; document.getElementById('f-validyear').value=draft.validYear;
      draft.factoryPlace = hit.place||"";
      if(!draft.remarks.length) draft.remarks=[""];
      draft.remarks[0] = buildLicenseSentence();
      const remarksBox = document.getElementById('remarksBox');
      if(remarksBox) renderRemarksEditor(remarksBox);
    }
  };
  document.getElementById('f-address').oninput=e=>draft.address=e.target.value;
  // Licence details typed by hand now create / refresh point 2 as well (before, only picking the factory
  // from the list did). A sentence the person has edited themselves is left alone.
  function setLicenceField(field, val){
    const before = buildLicenseSentence();          // what the OLD values produced
    const cur = draft.remarks[0] || '';
    draft[field] = val;
    if(!cur.trim() || cur === before){
      const any = [draft.licNo, draft.worker, draft.hp, draft.validYear].some(v=>String(v||'').trim());
      draft.remarks[0] = any ? buildLicenseSentence() : '';
      const rb = document.getElementById('remarksBox'); if(rb) renderRemarksEditor(rb);
    }
  }
  document.getElementById('f-licno').oninput=e=>setLicenceField('licNo', e.target.value);
  document.getElementById('f-worker').oninput=e=>setLicenceField('worker', e.target.value);
  document.getElementById('f-hp').oninput=e=>setLicenceField('hp', e.target.value);
  document.getElementById('f-validyear').oninput=e=>setLicenceField('validYear', e.target.value);
  document.getElementById('addLicRemark').onclick=()=>{
    draft.remarks[0] = buildLicenseSentence();
    render();
  };
  function recalcTotal(){
    // a total the person typed by hand is not overwritten — but the sentences that quote the male /
    // female / contract counts must still refresh (before, they silently stopped once the total was typed)
    if(draft.autoTotal!==false){
      const m=parseInt(draft.maleWorkers)||0, f=parseInt(draft.femaleWorkers)||0, c=parseInt(draft.contractWorkers)||0;
      draft.totalWorkers = String(m+f+c);
      document.getElementById('f-total').value = draft.totalWorkers;
    }
    syncSafetyCommMissing();
    syncProcessRemark();
  }
  document.getElementById('f-male').oninput=e=>{ draft.maleWorkers=e.target.value; recalcTotal(); };
  document.getElementById('f-female').oninput=e=>{ draft.femaleWorkers=e.target.value; recalcTotal(); };
  document.getElementById('f-contract').oninput=e=>{ draft.contractWorkers=e.target.value; recalcTotal(); };
  function syncSafetyCommMissing(){
    if(draft.includeSafetyCommMissingRemark){
      while(draft.remarks.length<16) draft.remarks.push("");
      draft.remarks[14] = buildSafetyCommMissingSentence();
      const remarksBox = document.getElementById('remarksBox');
      if(remarksBox) renderRemarksEditor(remarksBox);
    }
  }
  document.getElementById('f-total').oninput=e=>{
    draft.totalWorkers=e.target.value;
    draft.autoTotal = (e.target.value.trim()==='') ? true : false;
    syncSafetyCommMissing();
    syncProcessRemark();
  };
  function syncProcessRemark(){
    draft.remarks[1] = buildProcessSentenceFull();
    const remarksBox = document.getElementById('remarksBox');
    if(remarksBox) renderRemarksEditor(remarksBox);
    refreshOffenceSummaryBox();
  }
  document.getElementById('f-rawmat').oninput=e=>{ draft.rawMaterial=e.target.value; syncProcessRemark(); };
  document.getElementById('f-machinery').oninput=e=>{ draft.machinery=e.target.value; syncProcessRemark(); };
  document.getElementById('f-finalprod').oninput=e=>{ draft.finalProduct=e.target.value; syncProcessRemark(); };
  document.getElementById('addProcessRemark').onclick=()=>{
    if(!draft.remarks.length) draft.remarks=[""];
    if(draft.remarks.length<2) draft.remarks.push("");
    draft.remarks[1] = buildProcessSentenceFull();
    render();
  };
  document.getElementById('f-hazardinclude').onchange=e=>{
    draft.includeHazardRemark = e.target.checked;
    draft.remarks[1] = buildProcessSentenceFull();
    const workersBox = document.getElementById('workersBox');
    if(workersBox) renderWorkersEditor(workersBox);
    syncWorkersRemark();
  };
  document.getElementById('f-schedule').oninput=e=>{
    draft.hazardScheduleNo = e.target.value;
    if(draft.includeHazardRemark){
      draft.remarks[1] = buildProcessSentenceFull();
      const remarksBox = document.getElementById('remarksBox');
      if(remarksBox) renderRemarksEditor(remarksBox);
    }
    syncSafetyCommMissing();
  };
  function syncMapRemark(){
    while(draft.remarks.length<3) draft.remarks.push("");
    draft.remarks[2] = buildMapApprovalSentence();
    const remarksBox = document.getElementById('remarksBox');
    if(remarksBox) renderRemarksEditor(remarksBox);
  }
  document.getElementById('f-mapdate').onclick=e=>{
    openDatePicker(e.target, draft.mapApprovalDate, iso=>{
      draft.mapApprovalDate = iso; e.target.value = isoToDMYInput(iso); syncMapRemark();
    });
  };
  document.getElementById('f-mapno').oninput=e=>{ draft.mapApprovalNo=e.target.value; syncMapRemark(); };
  renderMapRevEditor(document.getElementById('mapRevBox'));
  document.getElementById('addMapRev').onclick=()=>{
    if(!draft.mapRevisions) draft.mapRevisions=[];
    draft.mapRevisions.push({date:"",no:""});
    renderMapRevEditor(document.getElementById('mapRevBox'));
    syncMapRemarkTop();
  };
  function syncStabRemark(){
    while(draft.remarks.length<23) draft.remarks.push("");
    const plan = stabSlotPlan(draft);
    const text = {
      compliance: buildStabilityComplianceSentence,
      generic: buildStabilityOffenceSentence,
      load: buildStabilityLoadOffenceSentence
    };
    [3,19,22].forEach(sl=>{ draft.remarks[sl] = plan[sl] ? text[plan[sl]]() : ""; });
    const remarksBox = document.getElementById('remarksBox');
    if(remarksBox) renderRemarksEditor(remarksBox);
    refreshOffenceSummaryBox();
  }
  document.getElementById('f-stab-offence').onchange=e=>{ draft.includeStabilityOffence=e.target.checked; syncStabRemark(); };
  document.getElementById('f-stab-load').onchange=e=>{ draft.includeStabilityLoadOffence=e.target.checked; syncStabRemark(); };
  document.getElementById('f-stabperson').oninput=e=>{ draft.stabCompetentPerson=e.target.value; syncStabRemark(); };
  document.getElementById('f-stabdate').onclick=e=>{
    openDatePicker(e.target, draft.stabCertDate, iso=>{
      draft.stabCertDate = iso; e.target.value = isoToDMYInput(iso); syncStabRemark();
    });
  };
  document.getElementById('f-purpose').oninput=e=>draft.visitPurpose=e.target.value;
  document.getElementById('f-safetyorder').onchange=e=>draft.includeSafetyOrder=e.target.checked;
  document.getElementById('f-penalty').onchange=e=>draft.includePenalty=e.target.checked;
  document.getElementById('f-present').oninput=e=>draft.presentPerson=e.target.value;
  document.getElementById('f-owner').oninput=e=>draft.ownerName=e.target.value;
  document.getElementById('f-owneraddress').oninput=e=>draft.ownerAddress=e.target.value;
  document.getElementById('f-ownerphone').oninput=e=>draft.ownerPhone=e.target.value;
  document.getElementById('f-owneremail').oninput=e=>draft.ownerEmail=e.target.value;
  document.getElementById('f-consultant').oninput=e=>draft.consultant=e.target.value;
  document.getElementById('f-consultant').onchange=e=>addToListIfNew('consultantList', e.target.value);
  document.getElementById('f-summaryremark').oninput=e=>draft.summaryRemark=e.target.value;
  document.getElementById('f-safetyauth').oninput=e=>draft.safetyAuthorize=e.target.value;
  document.getElementById('f-safetyauth').onchange=e=>addToListIfNew('safetyAuthorizeList', e.target.value);
  document.getElementById('f-place').oninput=e=>draft.place=e.target.value;
  if(isEditingCase()){
    const mo = document.getElementById('mark-outward'); if(mo) mo.style.display = 'none';   // already sent out
    const sd = document.getElementById('save-draft'); if(sd) sd.textContent = 'ફેરફાર સેવ કરો';
    const cce = document.getElementById('cancel-case-edit');
    if(cce) cce.onclick = ()=>{ const back = editReturnTab || 'pending'; newDraft(); setTab(back); };
  }
  document.getElementById('save-draft').onclick=async()=>{
    const btn = document.getElementById('save-draft');
    btn.disabled = true; const orig = btn.textContent; btn.textContent = 'સેવ થાય છે...';
    try{
      const editing = isEditingCase(), back = editReturnTab || 'pending';
      await saveInspection({...draft});
      newDraft();
      if(editing) setTab(back); else render();
    }catch(e){
      btn.disabled = false; btn.textContent = orig;
      alert('ડ્રાફ્ટ સેવ કરવામાં ભૂલ આવી, ફરી ટ્રાય કરો.');
    }
  };
  document.getElementById('download-rep').onclick=async()=>{ await saveInspection({...draft}); downloadReport(draft); };
  let outwardPickedDate = todayISO();
  document.getElementById('mark-outward').onclick=()=>{
    document.getElementById('outwardPanel').style.display = 'block';
    document.getElementById('f-noticeno-out').value = draft.noticeNo || '';
    document.getElementById('f-outdate').value = isoToDMYInput(outwardPickedDate);
  };
  document.getElementById('cancel-outward').onclick=()=>{
    document.getElementById('outwardPanel').style.display = 'none';
  };
  document.getElementById('f-outdate').onclick=e=>{
    openDatePicker(e.target, outwardPickedDate, iso=>{ outwardPickedDate = iso; e.target.value = isoToDMYInput(iso); });
  };
  document.getElementById('confirm-outward').onclick=async()=>{
    const noticeNoInput = document.getElementById('f-noticeno-out');
    const noticeNo = noticeNoInput.value.trim();
    if(!noticeNo){ noticeNoInput.style.borderColor = 'var(--danger)'; noticeNoInput.placeholder = 'આઉટવર્ડ નંબર ભરવો જરૂરી છે'; return; }
    draft.noticeNo = noticeNo;
    draft.status='outward_sent'; draft.outwardDate=outwardPickedDate; draft.replyDeadline=addDays(outwardPickedDate,30);
    await saveInspection({...draft}); newDraft(); setTab('pending');
  };
}

function renderDraftsList(){
  const box = document.getElementById('draftsBox');
  if(!box) return;
  const list = state.inspections.filter(i=>i.status==='draft').sort((a,b)=>a.date<b.date?1:-1);
  if(!list.length){ box.innerHTML = '<div class="empty">કોઈ ડ્રાફ્ટ સેવ નથી</div>'; return; }
  box.innerHTML = list.map(ins=>`
    <div class="item" data-id="${ins.id}">
      <h4>${ins.factory||'(નામ નથી)'}</h4>
      <div class="meta">તારીખ: ${ins.date}</div>
      <div class="row">
        <button class="btn small edit-draft-btn">ખોલો / એડિટ કરો</button>
        <button class="btn small secondary rep-draft-btn">ડાઉનલોડ</button>
        <button class="btn small danger del-draft-btn">✕ કાઢી નાખો</button>
      </div>
    </div>`).join('');
  box.querySelectorAll('.edit-draft-btn').forEach(b=>b.onclick=e=>{
    const id = e.target.closest('.item').dataset.id;
    const ins = state.inspections.find(x=>x.id===id);
    if(ins){ draft = {...ins}; repairDraftSlots(); render(); }
  });
  box.querySelectorAll('.rep-draft-btn').forEach(b=>b.onclick=e=>{
    const id = e.target.closest('.item').dataset.id;
    downloadReport(state.inspections.find(x=>x.id===id));
  });
  box.querySelectorAll('.del-draft-btn').forEach(b=>{
    b.onclick=async e=>{
      const btn = e.target;
      if(btn.dataset.confirming!=='1'){
        btn.dataset.confirming='1';
        const orig = btn.textContent;
        btn.textContent = 'ખરેખર કાઢવું છે? ફરી દબાવો';
        setTimeout(()=>{ if(btn.dataset.confirming==='1'){ btn.dataset.confirming='0'; btn.textContent = orig; } }, 4000);
        return;
      }
      const id = btn.closest('.item').dataset.id;
      const idx = state.inspections.findIndex(x=>x.id===id);
      if(idx>=0) state.inspections.splice(idx,1);
      if(dbNS){ try{ await dbNS.doc("inspections/"+id).delete(); }catch(err){} }
      renderDraftsList();
    };
  });
}
async function deleteInspectionCascade(id){
  const idx = state.inspections.findIndex(x=>x.id===id);
  if(idx>=0) state.inspections.splice(idx,1);
  if(dbNS){ try{ await dbNS.doc("inspections/"+id).delete(); }catch(e){} }
  // remove any linked diary entries (original visit + follow-up visit)
  const diaryIdsToRemove = state.diary.filter(d=>d.linkedInspectionId===id || d.linkedInspectionId==='followup-'+id).map(d=>d.id);
  for(const did of diaryIdsToRemove){
    const di = state.diary.findIndex(x=>x.id===did);
    if(di>=0) state.diary.splice(di,1);
    if(dbNS){ try{ await dbNS.doc("diary/"+did).delete(); }catch(e){} }
  }
}
function attachDeleteButton(itemEl, id, onDone){
  const btn = itemEl.querySelector('.del-ins-btn');
  if(!btn) return;
  btn.onclick = async ()=>{
    if(btn.dataset.confirming!=='1'){
      btn.dataset.confirming='1';
      const orig = btn.textContent;
      btn.textContent = 'ખરેખર કાઢવું છે? ફરી દબાવો';
      setTimeout(()=>{ if(btn.dataset.confirming==='1'){ btn.dataset.confirming='0'; btn.textContent = orig; } }, 4000);
      return;
    }
    await deleteInspectionCascade(id);
    onDone();
  };
}
function renderPending(main){
  checkOverdueNotifications();
  const list = state.inspections.filter(i=>i.status==='outward_sent').sort((a,b)=>a.replyDeadline<b.replyDeadline?-1:1);
  if(!list.length){ main.innerHTML='<div class="empty">કોઈ પડતર કેસ નથી</div>'; return; }
  const stOf = ins=>{ const left = daysBetween(todayISO(), ins.replyDeadline); return left<0 ? 'overdue' : (left<=10 ? 'soon' : 'ok'); };
  const cnt = k=>list.filter(i=>stOf(i)===k).length;
  const optList = (id, arr)=>'<datalist id="'+id+'">'+(arr||[]).map(c=>'<option value="'+escAttr(c)+'">').join('')+'</datalist>';
  main.innerHTML = listToolbarHTML([
      {key:'all', label:'બધા', count:list.length},
      {key:'overdue', label:'મુદત વીતી', count:cnt('overdue')},
      {key:'soon', label:'૧૦ દિવસમાં', count:cnt('soon')},
      {key:'ok', label:'હજુ સમય છે', count:cnt('ok')}
    ]) + optList('consultantOptions', settings.consultantList) + optList('safetyAuthOptions', settings.safetyAuthorizeList) +
    '<div class="cardgrid">' + list.map(ins=>`
    <div class="item" data-id="${ins.id}" data-state="${stOf(ins)}" data-name="${escAttr((ins.factory||'').toLowerCase())}">
      <div class="pc-head"><h4>${escAttr(ins.factory||'(નામ નથી)')}</h4>${statusBadge(ins)}</div>
      <div class="dates"><span>ઇન્સ્પેક્શન <b>${toDMY(ins.date)}</b></span><span>આઉટવર્ડ <b>${toDMY(ins.outwardDate)}</b></span><span>મુદત <b>${toDMY(ins.replyDeadline)}</b></span></div>
      <div class="pc-actions">
        <button class="btn small reply-btn">જવાબ મળ્યો</button>
        <button class="btn small secondary rep-btn">નોટિસ ડાઉનલોડ</button>
        <button class="btn small secondary edit-case-btn">✎ એડિટ</button>
        <button class="btn small danger del-ins-btn">✕ કાઢી નાખો</button>
        <details class="optfields">
          <summary><span>કંસલટંટ / રીમાર્ક</span><span class="optval">${escAttr([ins.consultant, ins.safetyAuthorize, ins.summaryRemark].filter(x=>x&&String(x).trim()).join(', '))}</span></summary>
          <div class="optgrid">
            <div><label>કંસલટંટ</label><input type="text" class="p-consultant" list="consultantOptions" value="${escAttr(ins.consultant||'')}"></div>
            <div><label>Safety Authorize</label><input type="text" class="p-safetyauth" list="safetyAuthOptions" value="${escAttr(ins.safetyAuthorize||'')}"></div>
            <div class="full"><label>રીમાર્ક</label><input type="text" class="p-remark" value="${escAttr(ins.summaryRemark||'')}"></div>
          </div>
        </details>
      </div>
      ${editPanelHTML(ins)}
      <div class="replyPanel" id="replyPanel-${ins.id}" style="display:none; margin-top:10px; padding-top:10px; border-top:1px dashed var(--line);">
        <label style="margin-top:0;">ઇનવર્ડ નંબર</label>
        <input type="text" class="inward-no-input" placeholder="ઇનવર્ડ નં.">
        <label>ઇનવર્ડ તારીખ</label>
        <input type="text" class="inward-date-input dp-trigger" readonly placeholder="DD/MM/YYYY" value="${isoToDMYInput(todayISO())}">
        <label>જવાબની PDF અપલોડ કરો</label>
        <input type="file" class="reply-pdf-input" accept="application/pdf">
        <div class="hint upload-status"></div>
        <button class="btn small confirm-reply-btn" style="margin-top:8px;">કન્ફર્મ કરી દફતરે મોકલો</button>
      </div>
    </div>`).join('') + '</div>';
  wireListFilter(main);
  main.querySelectorAll('.reply-btn').forEach(b=>b.onclick=e=>{
    const id = e.target.closest('.item').dataset.id;
    const panel = document.getElementById('replyPanel-'+id);
    panel.style.display = panel.style.display==='none' ? 'block' : 'none';
  });
  main.querySelectorAll('.item').forEach(itemEl=>{
    const id = itemEl.dataset.id;
    try{ attachDeleteButton(itemEl, id, render); }catch(e){}
    try{ wireEditPanel(itemEl, 'pending'); }catch(e){}
    const dateInput = itemEl.querySelector('.inward-date-input');
    let inwardPickedDate = todayISO();
    // wire the confirm/date controls FIRST so a problem in the optional fields below can
    // never prevent "કન્ફર્મ કરી દફતરે મોકલો" itself from working.
    dateInput.onclick = e=>{ openDatePicker(e.target, inwardPickedDate, iso=>{ inwardPickedDate=iso; e.target.value=isoToDMYInput(iso); }); };
    itemEl.querySelector('.confirm-reply-btn').onclick = async e=>{
      const ins = state.inspections.find(x=>x.id===id);
      const noInput = itemEl.querySelector('.inward-no-input');
      const inwardNo = noInput.value.trim();
      if(!inwardNo){ noInput.style.borderColor='var(--danger)'; noInput.placeholder='ઇનવર્ડ નંબર જરૂરી છે'; return; }
      const fileInput = itemEl.querySelector('.reply-pdf-input');
      const statusEl = itemEl.querySelector('.upload-status');
      const file = fileInput.files[0];
      const btn = e.target; btn.disabled = true; const origTxt = btn.textContent;
      try{
        if(file){
          statusEl.textContent = 'PDF અપલોડ થાય છે...';
          if(!assetsNS) assetsNS = await window.claude.use("assets").catch(()=>null);
          if(assetsNS){
            const res = await assetsNS.upload(file, {type:'application/pdf'});
            ins.replyPdfAssetId = res.id;
          } else {
            statusEl.textContent = 'PDF અપલોડ થઈ શક્યું નહીં (અસેટ સપોર્ટ નથી), બાકીનું સેવ થશે.';
          }
        }
        ins.inwardNo = inwardNo;
        ins.inwardDate = inwardPickedDate;
        ins.replyDate = inwardPickedDate;
        ins.status = 'closed';
        ins.closedDate = todayISO();
        await saveInspection(ins);
        // jump to દફતર so the move is visible — otherwise the card just silently
        // disappears from "પડતર" and can look like the button did nothing.
        setTab('records');
      }catch(err){
        btn.disabled=false; btn.textContent=origTxt;
        statusEl.textContent = 'ભૂલ આવી, ફરી ટ્રાય કરો: ' + (err && err.message ? err.message : String(err));
      }
    };
    try{
      itemEl.querySelectorAll('.optfields input').forEach(inp=>inp.addEventListener('input', ()=>refreshOptSummary(itemEl)));
      itemEl.querySelector('.p-consultant').oninput = async e=>{
        const ins = state.inspections.find(x=>x.id===id); ins.consultant = e.target.value; await saveInspection(ins);
      };
      itemEl.querySelector('.p-consultant').onchange = e=>addToListIfNew('consultantList', e.target.value);
      itemEl.querySelector('.p-safetyauth').oninput = async e=>{
        const ins = state.inspections.find(x=>x.id===id); ins.safetyAuthorize = e.target.value; await saveInspection(ins);
      };
      itemEl.querySelector('.p-safetyauth').onchange = e=>addToListIfNew('safetyAuthorizeList', e.target.value);
      itemEl.querySelector('.p-remark').oninput = async e=>{
        const ins = state.inspections.find(x=>x.id===id); ins.summaryRemark = e.target.value; await saveInspection(ins);
      };
    }catch(e){ /* these fields are optional UI sugar — never let a problem here block the confirm button above */ }
  });
  main.querySelectorAll('.rep-btn').forEach(b=>b.onclick=e=>{ const id=e.target.closest('.item').dataset.id; downloadReport(state.inspections.find(x=>x.id===id)); });
}
function renderRecords(main){
  const list = state.inspections.filter(i=>i.status==='closed' && !i.daftareOutwardNo).sort((a,b)=>a.date<b.date?1:-1);
  if(!list.length){ main.innerHTML='<div class="empty">દફતરે કંઈ નથી</div>'; return; }
  main.innerHTML = listToolbarHTML() + '<div class="cardgrid">' + list.map(ins=>`
    <div class="item" data-id="${ins.id}" data-name="${escAttr((ins.factory||'').toLowerCase())}">
      <h4>${escAttr(ins.factory||'(નામ નથી)')} <span class="badge ok">પૂર્ણ</span></h4>
      <div class="meta">આઉટવર્ડ: ${ins.outwardDate||'-'} | ઇનવર્ડ: ${ins.inwardDate||'-'} | મુલાકાત: <input type="text" class="followup-date-input dp-trigger" readonly value="${isoToDMYInput(ins.followUpVisitDate)}" placeholder="DD/MM/YYYY" style="display:inline-block;width:110px;padding:2px 6px;font-size:0.8rem;"></div>
      <div class="row">
        <button class="btn small secondary rep-btn">નોટિસ ડાઉનલોડ</button>
        <button class="btn small secondary daftare-btn">"કેસ દફતરે" ફાઈલ</button>
        ${ins.replyPdfAssetId?`<a class="btn small secondary" href="/_blob/${ins.replyPdfAssetId}" target="_blank">જવાબ PDF</a>`:''}
        <button class="btn small secondary edit-case-btn">✎ એડિટ</button>
        <button class="btn small danger del-ins-btn">✕</button>
      </div>
      ${editPanelHTML(ins)}
      <div class="row" style="margin-top:6px;">
        <button class="btn small warn daftare-outward-btn">સુરત રિજિયન આઉટવર્ડ નોંધો (કેસ બંધ કરો)</button>
      </div>
      <div class="daftareOutwardPanel" id="daftareOutwardPanel-${ins.id}" style="display:none; margin-top:10px; padding-top:10px; border-top:1px dashed var(--line);">
        <label style="margin-top:0;">સુરત રિજિયન ક્રમાંક (ફક્ત નંબર — "સં.નિ.ઔ.સ.સ્વા./સુ.રીજી./____/૨૦૨૬" માં આપોઆપ ગોઠવાશે)</label>
        <input type="text" class="daftare-outward-no-input" placeholder="દા.ત. 45">
        <label>આઉટવર્ડ તારીખ</label>
        <input type="text" class="daftare-outward-date-input dp-trigger" readonly placeholder="DD/MM/YYYY">
        <button class="btn small confirm-daftare-outward-btn" style="margin-top:8px;">કન્ફર્મ કરી કેસ બંધ કરો</button>
        <button class="btn small secondary cancel-daftare-outward-btn">રદ કરો</button>
      </div>
    </div>`).join('') + '</div>';
  wireListFilter(main);
  main.querySelectorAll('.rep-btn').forEach(b=>b.onclick=e=>{ const id=e.target.closest('.item').dataset.id; downloadReport(state.inspections.find(x=>x.id===id)); });
  main.querySelectorAll('.item').forEach(itemEl=>{
    const id = itemEl.dataset.id;
    attachDeleteButton(itemEl, id, render);
    try{ wireEditPanel(itemEl, 'records'); }catch(e){}
    const dateInput = itemEl.querySelector('.followup-date-input');
    dateInput.onclick = e=>{
      const ins = state.inspections.find(x=>x.id===id);
      openDatePicker(e.target, ins.followUpVisitDate, async iso=>{
        ins.followUpVisitDate = iso;
        e.target.value = isoToDMYInput(iso);
        await saveInspection(ins);
        // also log this compliance-check visit in the diary
        const entry = { id:'followup-'+ins.id, linkedInspectionId:'followup-'+ins.id,
          date: iso, place: getFactoryPlaceFor(ins), work: ins.factory,
          note: "પુર્તતા અહેવાલ ચકાસણી", remarksPage:"", lawBreach:"" };
        await saveDiaryEntry(entry);
      });
    };
    itemEl.querySelector('.daftare-btn').onclick = ()=>{ downloadDaftareLetter(state.inspections.find(x=>x.id===id)); };
    let daftareOutPickedDate = todayISO();
    itemEl.querySelector('.daftare-outward-btn').onclick = ()=>{
      const panel = itemEl.querySelector('.daftareOutwardPanel');
      panel.style.display = panel.style.display==='none' ? 'block' : 'none';
      itemEl.querySelector('.daftare-outward-date-input').value = isoToDMYInput(daftareOutPickedDate);
    };
    itemEl.querySelector('.cancel-daftare-outward-btn').onclick = ()=>{ itemEl.querySelector('.daftareOutwardPanel').style.display = 'none'; };
    itemEl.querySelector('.daftare-outward-date-input').onclick = e=>{
      openDatePicker(e.target, daftareOutPickedDate, iso=>{ daftareOutPickedDate = iso; e.target.value = isoToDMYInput(iso); });
    };
    itemEl.querySelector('.confirm-daftare-outward-btn').onclick = async ()=>{
      const noInput = itemEl.querySelector('.daftare-outward-no-input');
      const no = noInput.value.trim();
      if(!no){ noInput.style.borderColor = 'var(--danger)'; noInput.placeholder = 'ક્રમાંક જરૂરી છે'; return; }
      const ins = state.inspections.find(x=>x.id===id);
      ins.daftareOutwardNo = no;
      ins.daftareOutwardDate = daftareOutPickedDate;
      await saveInspection(ins);
      render();
    };
  });
}
function renderArchived(main){
  const list = state.inspections.filter(i=>i.status==='closed' && i.daftareOutwardNo).sort((a,b)=>(a.daftareOutwardDate||'')<(b.daftareOutwardDate||'')?1:-1);
  if(!list.length){ main.innerHTML='<div class="empty">કોઈ કેસ બંધ નથી</div>'; return; }
  main.innerHTML = listToolbarHTML() + '<div class="cardgrid">' + list.map(ins=>`
    <div class="item" data-id="${ins.id}" data-name="${escAttr((ins.factory||'').toLowerCase())}">
      <h4>${escAttr(ins.factory||'(નામ નથી)')} <span class="badge ok">સંપૂર્ણ બંધ</span></h4>
      <div class="meta">આઉટવર્ડ: ${ins.outwardDate||'-'} | ઇનવર્ડ: ${ins.inwardDate||'-'} | સુરત ક્રમાંક: ${toGujNum(ins.daftareOutwardNo)} | સુરત તારીખ: ${toDMY(ins.daftareOutwardDate)}</div>
      <div class="row">
        <button class="btn small secondary rep-btn">નોટિસ ડાઉનલોડ</button>
        <button class="btn small secondary daftare-btn">"કેસ દફતરે" ફાઈલ</button>
        ${ins.replyPdfAssetId?`<a class="btn small secondary" href="/_blob/${ins.replyPdfAssetId}" target="_blank">જવાબ PDF</a>`:''}
        <button class="btn small secondary edit-case-btn">✎ એડિટ</button>
        <button class="btn small danger del-ins-btn">✕</button>
      </div>
      ${editPanelHTML(ins)}
    </div>`).join('') + '</div>';
  wireListFilter(main);
  main.querySelectorAll('.rep-btn').forEach(b=>b.onclick=e=>{ const id=e.target.closest('.item').dataset.id; downloadReport(state.inspections.find(x=>x.id===id)); });
  main.querySelectorAll('.daftare-btn').forEach(b=>b.onclick=e=>{ const id=e.target.closest('.item').dataset.id; downloadDaftareLetter(state.inspections.find(x=>x.id===id)); });
  main.querySelectorAll('.item').forEach(itemEl=>{ attachDeleteButton(itemEl, itemEl.dataset.id, render); try{ wireEditPanel(itemEl, 'archived'); }catch(e){} });
}

function diaryTableHTML(monthKeyStr, entries, opts){
  opts = opts || {};
  const [y,m] = monthKeyStr.split('-').map(Number);
  const title = `${settings.officerName} , ${settings.designation}, ${settings.city}ની માહે -${GUJ_MONTHS[m-1]} - ${y} માસીક ડાયરી`;
  const sorted = [...entries].sort((a,b)=>a.date<b.date?-1:(a.date>b.date?1:0));
  const groups = [];
  sorted.forEach(e=>{ let g = groups.find(x=>x.date===e.date && x.place===(e.place||'')); if(!g){ g={date:e.date, place:e.place||'', rows:[]}; groups.push(g);} g.rows.push(e); });
  let rowsHTML = '';
  groups.forEach((g,gi)=>{
    g.rows.forEach((r,ri)=>{
      rowsHTML += `<tr data-diary-id="${r.id}">`;
      if(ri===0){
        rowsHTML += `<td rowspan="${g.rows.length}">${gi+1}</td>`;
        rowsHTML += `<td rowspan="${g.rows.length}">${r.place||''}</td>`;
        rowsHTML += `<td rowspan="${g.rows.length}">${toDMY(r.date)}</td>`;
      }
      rowsHTML += `<td class="wrap">${r.work||''}</td><td>${r.remarksPage||''}</td><td>${r.lawBreach||''}</td><td class="wrap">${r.note||''}</td>`;
      if(opts.editable){
        rowsHTML += `<td><div class="row"><button class="btn small secondary edit-diary-btn" data-id="${r.id}">એડિટ</button><button class="btn small danger del-diary-btn" data-id="${r.id}">✕</button></div></td>`;
      }
      rowsHTML += '</tr>';
    });
  });
  const actionsHeader = opts.editable ? '<th>ક્રિયા</th>' : '';
  return { title, html: `<table class="diary"><caption style="font-weight:bold;padding:8px;">${title}</caption>
    <tr><th>અ.નં</th><th>સ્થળ</th><th>તારીખ</th><th>કરેલા કામની વિગત</th><th>રીમાર્ક્સ પાના નં</th><th>કાયદા ભંગ</th><th>નોંધ</th>${actionsHeader}</tr>
    ${rowsHTML}</table>` };
}
function buildDiaryXlsxData(monthKeyStr, entries){
  const [y,m] = monthKeyStr.split('-').map(Number);
  const title = `${settings.officerName} , ${settings.designation}, ${settings.city}ની માહે -${GUJ_MONTHS[m-1]} - ${y} માસીક ડાયરી`;
  const sorted = [...entries].sort((a,b)=>a.date<b.date?-1:(a.date>b.date?1:0));
  const groups = [];
  sorted.forEach(e=>{ let g = groups.find(x=>x.date===e.date && x.place===(e.place||'')); if(!g){ g={date:e.date, place:e.place||'', rows:[]}; groups.push(g);} g.rows.push(e); });
  const headers = ['અ.નં','સ્થળ','તારીખ','કરેલા કામની વિગત','રીમાર્ક્સ પાના નં','કાયદા ભંગ','નોંધ'];
  const aoa = [ [title], headers ];
  const merges = [ {s:{r:0,c:0}, e:{r:0,c:6}} ]; // title spans all 7 columns
  let rowIdx = 2; // 0=title,1=header, data starts at row index 2
  groups.forEach((g,gi)=>{
    g.rows.forEach((r,ri)=>{
      if(ri===0){
        aoa.push([gi+1, r.place||'', toDMY(r.date), r.work||'', r.remarksPage||'', r.lawBreach||'', r.note||'']);
        if(g.rows.length>1){
          merges.push({s:{r:rowIdx,c:0}, e:{r:rowIdx+g.rows.length-1,c:0}});
          merges.push({s:{r:rowIdx,c:1}, e:{r:rowIdx+g.rows.length-1,c:1}});
          merges.push({s:{r:rowIdx,c:2}, e:{r:rowIdx+g.rows.length-1,c:2}});
        }
      } else {
        aoa.push(['', '', '', r.work||'', r.remarksPage||'', r.lawBreach||'', r.note||'']);
      }
      rowIdx++;
    });
  });
  return {title, aoa, merges};
}
async function downloadDiaryMonth(monthKeyStr){
  const entries = state.diary.filter(e=>monthKey(e.date)===monthKeyStr);
  const {title, aoa, merges} = buildDiaryXlsxData(monthKeyStr, entries);
  if(downloadsNS && typeof XLSX !== 'undefined'){
    try{
      const ws = XLSX.utils.aoa_to_sheet(aoa);
      ws['!merges'] = merges;
      ws['!cols'] = [{wch:6},{wch:14},{wch:12},{wch:45},{wch:12},{wch:12},{wch:20}];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Diary');
      const arrBuf = XLSX.write(wb, {type:'array', bookType:'xlsx'});
      const blob = new Blob([arrBuf], {type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
      await downloadsNS.save({filename:title.replace(/[^a-zA-Z0-9ぁ-んア-ンа-яА-Я\u0A80-\u0AFF ]/g,'')+'.xlsx', data: blob});
      return;
    }catch(e){ /* fall through */ }
  }
  const {html} = diaryTableHTML(monthKeyStr, entries);
  const full = `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body>${html}</body></html>`;
  if(downloadsNS){ try{ await downloadsNS.save({filename:title.replace(/[^a-zA-Z0-9ぁ-んア-ンа-яА-Я\u0A80-\u0AFF ]/g,'')+'.html', data: full}); return; }catch(e){} }
  const w = window.open('', '_blank'); if(w){ w.document.write(full); w.document.close(); w.print(); }
}

const BREACH_DEFS = [
  {key:'stab', cat:'Safety', label:'stability certificate not maintained', rule:'G 70(1)', check:ins=>!!ins.includeStabilityOffence, nos:ins=>1},
  {key:'stabload', cat:'Safety', label:'stability certificate without load calculation', rule:'G 70(2)', check:ins=>!!ins.includeStabilityLoadOffence, nos:ins=>1},
  {key:'training', cat:'Safety', label:'Safety Training not imparted', rule:'G 14(2)(b)', check:ins=>!!ins.includeTrainingRemark, nos:ins=>(ins.workers||[]).filter(w=>w.name.trim()||w.work.trim()).length},
  {key:'safetycommmissing', cat:'Safety', label:'Safety Committee not constituted', rule:'G 17(1)(b)', check:ins=>!!ins.includeSafetyCommMissingRemark, nos:ins=>1},
  {key:'safetycommcomp', cat:'Safety', label:'Safety Committee composition not proper', rule:'G 18', check:ins=>!!ins.includeSafetyCommCompositionRemark, nos:ins=>1},
  {key:'emergencyplan', cat:'Safety', label:'On-site Emergency Plan not prepared', rule:'Sec 84(4)', check:ins=>!!ins.includeEmergencyPlanRemark, nos:ins=>1},
  {key:'licenceamend', cat:'Safety', label:'Licence Amendment not obtained', rule:'G 76(1)', check:ins=>!!ins.includeLicenceAmendRemark, nos:ins=>1},
  {key:'safetycomm250', cat:'Safety', label:'Safety Committee not constituted (250+ workers)', rule:'G 17(1)(c)', check:ins=>!!ins.includeSafetyComm250Remark, nos:ins=>1},
  {key:'newmapapproval', cat:'Safety', label:'New building plan approval not obtained', rule:'Sec 79 with G 69(1)', check:ins=>!!ins.includeNewMapApprovalRemark, nos:ins=>1},
  {key:'licenceapplication', cat:'Safety', label:'Factory licence application not submitted', rule:'Sec 79 with G 75(1)', check:ins=>!!ins.includeLicenceApplicationRemark, nos:ins=>1},
  {key:'revisedmap', cat:'Safety', label:'Revised building plan approval not obtained', rule:'Sec 79 with G 69(1)', check:ins=>!!ins.includeRevisedMapRemark, nos:ins=>1},
  {key:'overtime', cat:'Safety', label:'Working more than 8 hours per day', rule:'Sec 25(1)(a)', check:ins=>!!ins.includeOvertimeRemark, nos:ins=>(ins.workers||[]).filter(w=>w.name.trim()||w.work.trim()).length},
  {key:'creche', cat:'Welfare', label:'Crèche facility not available', rule:'G 58', check:ins=>!!ins.includeCrecheRemark, nos:ins=>1},
  {key:'canteen', cat:'Welfare', label:'Canteen facility not available', rule:'G 53', check:ins=>!!ins.includeCanteenRemark, nos:ins=>1},
  {key:'appointment', cat:'Documents', label:'Appointment Letter not issued', rule:'G10', check:ins=>!!ins.includeAppointmentRemark, nos:ins=>(ins.workers||[]).filter(w=>w.name.trim()||w.work.trim()).length},
  {key:'idcard', cat:'Documents', label:'Id Card not issued', rule:'G 31(1)', check:ins=>!!ins.includeIdCardRemark, nos:ins=>(ins.workers||[]).filter(w=>w.name.trim()||w.work.trim()).length},
  {key:'leavecard', cat:'Documents', label:'Leave card not given', rule:'G 33', check:ins=>!!ins.includeLeaveCardRemark, nos:ins=>1},
  {key:'attendance', cat:'Documents', label:'Attendance Register not maintained', rule:'G 29(1)(b)', check:ins=>!!ins.includeAttendanceRemark, nos:ins=>1},
  {key:'lwr', cat:'Documents', label:'Leave with Wages Register not maintained', rule:'G 32', check:ins=>!!ins.includeLwrRemark, nos:ins=>1},
  {key:'accidentreg', cat:'Documents', label:'Accident Register not maintained', rule:'G 36', check:ins=>!!ins.includeAccidentRegRemark, nos:ins=>1}
];
const SUMMARY_CATS = ['Safety','Health','Welfare','Documents','Other'];
function computeSummaryRow(ins){
  const byCat = {Safety:[], Health:[], Welfare:[], Documents:[], Other:[]};
  classifyOffences(ins).forEach(x=>{ byCat[x.cat].push({label:x.en, rule:x.rule, nos:x.nos}); });
  const total = SUMMARY_CATS.reduce((sum,c)=> sum + byCat[c].reduce((s,x)=>s+x.nos,0), 0);
  return {byCat, total};
}
// Lets the person drag column borders in a wide data table to resize them; the chosen
// widths are a per-viewer convenience and are remembered (localStorage) for next time.
// unitSpans (optional): how many actual table-columns each resizable unit covers, in order
// (e.g. [1,1,1,1,1,1,4,4,4,4,4,1,1,1] for the Summary tab, where each "4" is one Safety/
// Health/... group resized as a whole so its own Nos/Breach/Rule/Section stay aligned).
function makeColumnsResizable(table, storageKey, colCount, unitSpans){
  if(!table) return;
  table.classList.add('resizable');
  const spans = unitSpans || Array(colCount).fill(1);
  let saved = {};
  try{ saved = JSON.parse(localStorage.getItem('colw_'+storageKey)||'{}') || {}; }catch(e){ saved = {}; }
  let cg = table.querySelector(':scope > colgroup');
  if(!cg){ cg = document.createElement('colgroup'); table.insertBefore(cg, table.firstChild); }
  cg.innerHTML = '';
  spans.forEach((span,i)=>{
    const col = document.createElement('col');
    if(span>1) col.setAttribute('span', span);
    if(saved[i]) col.style.width = saved[i]+'px';
    cg.appendChild(col);
  });
  function attach(th, unitIndex){
    if(th.querySelector('.col-resizer')) return;
    const handle = document.createElement('div');
    handle.className = 'col-resizer';
    th.appendChild(handle);
    const start = (clientX)=>{
      const col = cg.querySelectorAll('col')[unitIndex];
      const startW = col.offsetWidth || th.offsetWidth;
      const onMove = (cx)=>{ col.style.width = Math.max(40, startW + (cx - clientX))+'px'; };
      const mouseMove = e=>onMove(e.clientX);
      const touchMove = e=>{ onMove(e.touches[0].clientX); e.preventDefault(); };
      const stop = ()=>{
        document.removeEventListener('mousemove', mouseMove);
        document.removeEventListener('mouseup', stop);
        document.removeEventListener('touchmove', touchMove);
        document.removeEventListener('touchend', stop);
        handle.classList.remove('active');
        saved[unitIndex] = col.offsetWidth;
        try{ localStorage.setItem('colw_'+storageKey, JSON.stringify(saved)); }catch(e){}
      };
      handle.classList.add('active');
      document.addEventListener('mousemove', mouseMove);
      document.addEventListener('mouseup', stop);
      document.addEventListener('touchmove', touchMove, {passive:false});
      document.addEventListener('touchend', stop);
    };
    handle.addEventListener('mousedown', e=>{ e.preventDefault(); e.stopPropagation(); start(e.clientX); });
    handle.addEventListener('touchstart', e=>{ e.stopPropagation(); start(e.touches[0].clientX); }, {passive:true});
  }
  // table.rows (native) always finds every <tr> regardless of a browser-inserted <tbody> —
  // a plain ":scope > tr" selector misses them since bare rows get auto-wrapped in <tbody>.
  const rows = table.rows;
  if(!rows.length) return;
  Array.from(rows[0].cells).forEach((th,i)=>attach(th, i));
}
function categoryCellHTML(items, unitIdx){
  const unitAttr = unitIdx!==undefined ? ` data-unit="${unitIdx}"` : '';
  if(!items.length) return `<td colspan="4"${unitAttr}></td>`;
  // a nested 4-column table keeps Nos/Breach Details/Rule/Section aligned
  // per breach line even when a label wraps onto multiple lines.
  const nestedRows = items.map(x=>`<tr>
      <td style="border:none;padding:3px 4px;text-align:center;width:10%;">${x.nos}</td>
      <td style="border:none;padding:3px 4px;text-align:left;width:55%;">${x.label}</td>
      <td style="border:none;padding:3px 4px;text-align:left;width:25%;">${x.rule}</td>
      <td style="border:none;padding:3px 4px;text-align:left;width:10%;"></td>
    </tr>`).join('');
  return `<td colspan="4" style="padding:0;text-align:left;"${unitAttr}><table style="width:100%;border-collapse:collapse;font-size:0.8rem;">${nestedRows}</table></td>`;
}
function getSummaryBaseList(){
  return state.inspections.filter(i=>i.noticeNo && i.status!=='draft').sort((a,b)=>a.date<b.date?-1:(a.date>b.date?1:0));
}
const SUMMARY_UNITS = ['Sr No','Office','Officer','કેસ પ્રકાર','Date','Factory','Safety','Health','Welfare','Documents','Other','Total','Hazardous Process','Remarks'];
function getHiddenSummaryUnits(){
  try{ return JSON.parse(localStorage.getItem('summary-hidden-units')||'[]'); }catch(e){ return []; }
}
function renderSummaryTableHTML(monthFilter, searchFilter){
  let list = getSummaryBaseList();
  if(monthFilter) list = list.filter(i=>monthKey(i.date)===monthFilter);
  if(searchFilter) list = list.filter(i=>(i.factory||'').toLowerCase().includes(searchFilter));
  let rowsHtml = '';
  list.forEach((ins,i)=>{
    const {byCat, total} = computeSummaryRow(ins);
    let cells = '';
    SUMMARY_CATS.forEach((cat,ci)=>{ cells += categoryCellHTML(byCat[cat], 6+ci); });
    rowsHtml += `<tr><td data-unit="0">${i+1}</td><td data-unit="1" class="wrap">${settings.city}</td><td data-unit="2" class="wrap">${settings.officerName}</td><td data-unit="3" class="wrap">${ins.caseType||''}</td><td data-unit="4">${toDMY(ins.date)}</td><td data-unit="5" class="wrap">${ins.factory||''}</td>${cells}<td data-unit="11">${total}</td><td data-unit="12">${ins.includeHazardRemark?'Yes':'No'}</td><td data-unit="13"></td></tr>`;
  });
  const catHeaders = SUMMARY_CATS.map((c,ci)=>`<th colspan="4" data-unit="${6+ci}">${c}</th>`).join('');
  const subHeaders = SUMMARY_CATS.map((c,ci)=>`<th data-unit="${6+ci}">Nos</th><th data-unit="${6+ci}">Breach Details</th><th data-unit="${6+ci}">Rule</th><th data-unit="${6+ci}">Section (OSH)</th>`).join('');
  return `<table class="diary"><tr><th rowspan="2" data-unit="0">Sr No</th><th rowspan="2" data-unit="1">Office</th><th rowspan="2" data-unit="2">Officer</th><th rowspan="2" data-unit="3">કેસ પ્રકાર</th><th rowspan="2" data-unit="4">Date</th><th rowspan="2" data-unit="5">Factory</th>${catHeaders}<th rowspan="2" data-unit="11">Total</th><th rowspan="2" data-unit="12">Hazardous Process</th><th rowspan="2" data-unit="13">Remarks</th></tr><tr>${subHeaders}</tr>${rowsHtml}</table>`;
}
function buildSummaryXlsxData(monthFilter, searchFilter){
  let list = getSummaryBaseList();
  if(monthFilter) list = list.filter(i=>monthKey(i.date)===monthFilter);
  if(searchFilter) list = list.filter(i=>(i.factory||'').toLowerCase().includes(searchFilter));
  const FIXED = ['Sr No','Office','Officer','Case Type','Date','Factory'];
  const TAIL = ['Total','Hazardous Process','Remarks'];
  const row1 = [...FIXED.map(()=>''), ...SUMMARY_CATS.flatMap(c=>[c,'','','']), ...TAIL.map(()=>'')];
  const row2 = [...FIXED, ...SUMMARY_CATS.flatMap(()=>['Nos','Breach Details','Rule','Section (OSH)']), ...TAIL];
  const aoa = [row1, row2];
  const merges = [];
  // merge each category's 4-col header over row0, and each FIXED/TAIL header vertically over row0-1
  let col = 0;
  FIXED.forEach(()=>{ merges.push({s:{r:0,c:col}, e:{r:1,c:col}}); col++; });
  SUMMARY_CATS.forEach(()=>{ merges.push({s:{r:0,c:col}, e:{r:0,c:col+3}}); col+=4; });
  TAIL.forEach(()=>{ merges.push({s:{r:0,c:col}, e:{r:1,c:col}}); col++; });
  let rIdx = 2;
  list.forEach((ins,i)=>{
    const {byCat, total} = computeSummaryRow(ins);
    const lineCount = Math.max(1, ...SUMMARY_CATS.map(c=>byCat[c].length));
    for(let line=0; line<lineCount; line++){
      const row = [];
      if(line===0){ row.push(i+1, settings.city, settings.officerName, ins.caseType||'', toDMY(ins.date), ins.factory||''); }
      else { row.push('', '', '', '', '', ''); }
      SUMMARY_CATS.forEach(cat=>{
        const item = byCat[cat][line];
        if(item) row.push(item.nos, item.label, item.rule, '');
        else row.push('', '', '', '');
      });
      if(line===0){ row.push(total, ins.includeHazardRemark?'Yes':'No', ''); }
      else { row.push('', '', ''); }
      aoa.push(row);
    }
    if(lineCount>1){
      [0,1,2,3,4,5,aoa[0].length-3,aoa[0].length-2,aoa[0].length-1].forEach(c=>{
        merges.push({s:{r:rIdx,c}, e:{r:rIdx+lineCount-1,c}});
      });
    }
    rIdx += lineCount;
  });
  return {aoa, merges};
}
async function downloadSummary(monthFilter, searchFilter){
  const fname = monthFilter ? 'inspection_summary_'+monthFilter : 'inspection_summary';
  if(downloadsNS && typeof XLSX !== 'undefined'){
    try{
      const {aoa, merges} = buildSummaryXlsxData(monthFilter, searchFilter);
      const ws = XLSX.utils.aoa_to_sheet(aoa);
      ws['!merges'] = merges;
      ws['!cols'] = [{wch:5},{wch:10},{wch:14},{wch:12},{wch:11},{wch:22},
        ...Array(20).fill(0).map((_,i)=> i%4===1?{wch:22}:{wch:10}),
        {wch:8},{wch:10},{wch:14}];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Summary');
      const arrBuf = XLSX.write(wb, {type:'array', bookType:'xlsx'});
      const blob = new Blob([arrBuf], {type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
      await downloadsNS.save({filename:fname+'.xlsx', data: blob});
      return;
    }catch(e){ /* fall through */ }
  }
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body>${renderSummaryTableHTML(monthFilter, searchFilter)}</body></html>`;
  if(downloadsNS){ try{ await downloadsNS.save({filename:fname+'.html', data: html}); return; }catch(e){} }
  const w = window.open('', '_blank'); if(w){ w.document.write(html); w.document.close(); w.print(); }
}
function getLastCompletedInspectionMap(){
  // factory name (lowercase) -> most recent inspection date that actually got an outward/notice number
  const map = {};
  state.inspections.forEach(ins=>{
    if(ins.date && ins.factory && ins.noticeNo && ins.noticeNo.trim()){
      const key = ins.factory.trim().toLowerCase();
      if(!map[key] || ins.date > map[key]) map[key] = ins.date;
    }
  });
  return map;
}
function findLatestInspectionForFactory(name){
  const matches = state.inspections.filter(i=>i.factory && i.factory.trim().toLowerCase()===name.trim().toLowerCase());
  if(!matches.length) return null;
  matches.sort((a,b)=> a.date<b.date?1:-1);
  return matches[0];
}
const OCR_PROMPT = `તમે ગુજરાતી ફેક્ટરી ઇન્સ્પેક્શન ફિલ્ડ ફોર્મના ફોટા જોઈ રહ્યા છો (૧ થી ૩ પેજ, હાથે ભરેલા — ટાઈપ કરેલો પ્રિન્ટ ફોર્મેટ અને ઉપર હાથે લખેલી/ટિક કરેલી વિગત). દરેક પેજ કાળજીથી વાંચો. હાથે લખેલા ગુજરાતી અક્ષરો અને આંકડા શ્રેષ્ઠ પ્રયાસે વાંચો; જે સ્પષ્ટ ન વંચાય એ ખાલી ("") રાખો, અડસટ્ટો ના મારો. ✓ / X / ગોળ કરેલ બોક્સ ટિક ગણો.

ફક્ત નીચેના શેપ પ્રમાણે એક JSON ઓબ્જેક્ટ પાછો આપો, બીજું કંઈ લખ્યા વગર:

{
  "date": "YYYY-MM-DD અથવા ''",
  "factory": "ફેક્ટરીનું નામ",
  "address": "સરનામું (ફક્ત જો ફોર્મમાં લખેલું હોય)",
  "visitPurpose": "તપાસણી/મુલાકાત/બીજું ટેક્સ્ટ",
  "caseType": "કાનૂની બાબત / ઈમ્પ્રુવમેન્ટ નોટીસ / નોટીસ / ''",
  "licNo": "", "worker": "", "hp": "", "validYear": "",
  "mapApprovalDate": "YYYY-MM-DD અથવા ''", "mapApprovalNo": "",
  "mapRevisions": [ {"date":"YYYY-MM-DD","no":""} ],
  "stabCompetentPerson": "", "stabCertDate": "YYYY-MM-DD અથવા ''",
  "includeStabilityOffence": false, "includeStabilityLoadOffence": false,
  "maleWorkers": "", "femaleWorkers": "", "contractWorkers": "", "totalWorkers": "",
  "rawMaterial": "", "machinery": "", "finalProduct": "",
  "includeHazardRemark": false, "hazardScheduleNo": "",
  "workers": [ {"name":"", "work":"", "hours":""} ],
  "includeTrainingRemark": false, "includeAppointmentRemark": false, "includeIdCardRemark": false,
  "includeOvertimeRemark": false, "overtimeHours": "",
  "includeLeaveCardRemark": false, "includeAttendanceRemark": false,
  "includeLwrRemark": false, "lwrYear": "", "includeAccidentRegRemark": false,
  "includeCrecheRemark": false, "includeCanteenRemark": false,
  "includeSafetyCommMissingRemark": false, "includeSafetyComm250Remark": false,
  "includeSafetyCommCompositionRemark": false, "includeEmergencyPlanRemark": false,
  "includeLicenceAmendRemark": false, "includeNewMapApprovalRemark": false,
  "includeRevisedMapRemark": false, "includeLicenceApplicationRemark": false,
  "otherOffenceText": "",
  "includeSafetyOrder": false,
  "safetyPoints": ["ટિક કરેલા સલામતી સૂચનોનું લખાણ, ફોર્મમાં છપાયેલું જ, અને હાથે લખેલા 'અન્ય' સૂચનો"],
  "presentPerson": "", "ownerName": "", "ownerAddress": "", "ownerPhone": "", "ownerEmail": ""
}

નિયમો:
- ટિક-બોક્સ (✓/X) જ્યાં ટિક ના હોય ત્યાં false/'' રાખો.
- તારીખ ફોર્મમાં "DD/MM/YYYY" કે "DD-MM-YYYY" લખેલી હોય તો "YYYY-MM-DD" માં ફેરવો.
- "શ્રમયોગી સંખ્યા" ની લાઈનમાં પુરુષ/સ્ત્રી/કોંટ્રાક્ટ/કુલ અલગ-અલગ છે, ભેગા ના કરો.\n- totalWorkers ('કુલ') ફોર્મમાં લખેલ હોય એ જ મુકો, સરવાળો જાતે ના કરો.
- workers લિસ્ટમાં ફોર્મમાં જેટલી લાઈન ભરેલી હોય એટલી જ મુકો, ખાલી લાઈન છોડો.
- "અન્ય ભંગ" લાઈનમાં કંઈ લખેલું હોય તો otherOffenceText માં મુકો.
- કોઈ ફિલ્ડ ફોર્મમાં જ ના હોય અથવા સાવ ખાલી હોય તો "" અથવા false અથવા [] રાખો, ક્યારેય ના છોડો.`;

async function runOcrFill(files){
  if(!sampleNS) return {error:'sample_unavailable'};
  try{
    const data = await sampleNS.json(OCR_PROMPT, { images: files, modelTier: 'complex', cache:false });
    return {data};
  }catch(e){
    return {error: e && e.code ? e.code : 'failed', message: e && e.message};
  }
}

function applyOcrResult(data){
  const warnings = [];
  const setIf = (key, val)=>{ if(val!==undefined && val!==null) draft[key]=val; };
  ['date','factory','address','visitPurpose','caseType','licNo','worker','hp','validYear',
   'mapApprovalDate','mapApprovalNo','stabCompetentPerson','stabCertDate',
   'includeStabilityOffence','includeStabilityLoadOffence',
   'maleWorkers','femaleWorkers','contractWorkers','rawMaterial','machinery','finalProduct',
   'includeHazardRemark','hazardScheduleNo','includeTrainingRemark','includeAppointmentRemark',
   'includeIdCardRemark','includeOvertimeRemark','overtimeHours','includeLeaveCardRemark',
   'includeAttendanceRemark','includeLwrRemark','lwrYear','includeAccidentRegRemark',
   'includeCrecheRemark','includeCanteenRemark','includeSafetyCommMissingRemark',
   'includeSafetyComm250Remark','includeSafetyCommCompositionRemark','includeEmergencyPlanRemark',
   'includeLicenceAmendRemark','includeNewMapApprovalRemark','includeRevisedMapRemark',
   'includeLicenceApplicationRemark','includeSafetyOrder',
   'presentPerson','ownerName','ownerAddress','ownerPhone','ownerEmail'
  ].forEach(k=> setIf(k, data[k]));
  if(!draft.date) draft.date = todayISO();
  if(Array.isArray(data.mapRevisions)) draft.mapRevisions = data.mapRevisions.filter(r=>r&&(r.date||r.no));
  if(Array.isArray(data.workers)){
    const ws = data.workers.filter(w=>w && (w.name||w.work)).map(w=>({name:w.name||'',work:w.work||'',hours:w.hours||''}));
    draft.workers = ws.length ? ws : [{name:"",work:""}];
  }
  if(Array.isArray(data.safetyPoints)) draft.safetyPoints = data.safetyPoints.filter(p=>p&&p.trim());
  // total workers: use the form's own count if it gave one distinctly, else sum male+female+contract
  if(data.totalWorkers!==undefined && data.totalWorkers!==null && String(data.totalWorkers).trim()!==''){
    draft.totalWorkers = String(data.totalWorkers).trim(); draft.autoTotal = false;
  } else {
    const m=parseInt(draft.maleWorkers)||0, f=parseInt(draft.femaleWorkers)||0, c=parseInt(draft.contractWorkers)||0;
    draft.totalWorkers = String(m+f+c); draft.autoTotal = true;
  }
  if(data.otherOffenceText && data.otherOffenceText.trim()){
    draft.remarks[draft.remarks.length] = data.otherOffenceText.trim();
  }
  // factory lookup + mismatch check against our own Excel list
  if(draft.factory){
    const hit = lookupFactory(draft.factory);
    if(hit){
      draft.factoryPlace = hit.place || draft.factoryPlace;
      if(!draft.address) draft.address = hit.address;
      const checks = [
        ['licNo','લાયસન્સ નં.'], ['worker','કામદાર સંખ્યા (લાયસન્સ)'], ['hp','હોર્સપાવર']
      ];
      checks.forEach(([field,label])=>{
        const formVal = (data[field]||'').toString().trim();
        const listVal = (hit[field]||'').toString().trim();
        if(formVal && listVal && formVal!==listVal){
          warnings.push(`${label}: ફોર્મમાં "${formVal}" પણ યાદીમાં "${listVal}" છે — ચકાસી લો.`);
        }
      });
      // fill from our list wherever the form left it blank
      if(!draft.licNo) draft.licNo = hit.licNo||'';
      if(!draft.worker) draft.worker = hit.worker||'';
      if(!draft.hp) draft.hp = hit.hp||'';
      if(!draft.validYear) draft.validYear = hit.validYear||'';
    } else {
      warnings.push('આ ફેક્ટરી અમારી ૭૬૪ ફેક્ટરીની યાદીમાં મળી નથી — સરનામું/લાયસન્સ જાતે ચકાસી લેજો.');
    }
  }
  // regenerate every dependent sentence from the fields we just set
  draft.remarks[0] = buildLicenseSentence();
  draft.remarks[1] = buildProcessSentenceFull();
  draft.remarks[2] = buildMapApprovalSentence();
  draft.remarks[4] = buildWorkersSentence();
  while(draft.remarks.length<25) draft.remarks.push("");
  { // stability: same rule as the manual checkboxes (slots 3, 19, 22)
    const plan = stabSlotPlan(draft);
    const text = { compliance: buildStabilityComplianceSentence, generic: buildStabilityOffenceSentence, load: buildStabilityLoadOffenceSentence };
    [3,19,22].forEach(sl=>{ draft.remarks[sl] = plan[sl] ? text[plan[sl]]() : ""; });
  }
  repairDraftSlots();
  return warnings;
}

function startInspectionFromFactory(factoryName){
  const prev = findLatestInspectionForFactory(factoryName);
  if(prev){
    draft = {...prev};
    draft.id = uid();
    draft.date = todayISO();
    draft.status = 'draft';
    draft.noticeNo = ""; draft.caseType = ""; draft.outwardDate=null; draft.replyDeadline=null;
    draft.replyDate=null; draft.inwardNo=""; draft.inwardDate=null; draft.replyPdfAssetId=null;
    draft.closedDate=null; draft.followUpVisitDate="";
    draft.workers = (prev.workers||[]).map(w=>({...w}));
    draft.mapRevisions = (prev.mapRevisions||[]).map(r=>({...r}));
    draft.remarks = [...(prev.remarks||[])];
    draft.safetyPoints = [...(prev.safetyPoints||[])];
  } else {
    newDraft();
    draft.factory = factoryName;
    const hit = lookupFactory(factoryName);
    if(hit){
      draft.address = hit.address; draft.licNo = hit.licNo||""; draft.worker = hit.worker||"";
      draft.hp = hit.hp||""; draft.validYear = hit.validYear||""; draft.factoryPlace = hit.place||"";
      draft.remarks[0] = buildLicenseSentence();
    }
  }
  repairDraftSlots();
  activeTab = 'new';
  render();
}
function renderAnnual(main){
  const lastMap = getLastCompletedInspectionMap();
  const talukas = [...new Set(FACTORY_DB.map(f=>f.taluka).filter(Boolean))].sort();
  main.innerHTML = `
  <div class="card">
    <label style="margin-top:0;">જે ફેક્ટરીનું ઇન્સ્પેક્શન ક્યારેય નથી થયું, અથવા છેલ્લા ઇન્સ્પેક્શન (આઉટવર્ડ થયેલ) ને ૩૬૫ દિવસ પૂરા થઈ ગયા છે — ફરી ઇન્સ્પેક્શન બાકી</label>
    <div class="row">
      <div style="flex:1;min-width:140px;"><label>તાલુકો (B કોલમ)</label>
        <select id="an-place"><option value="">બધા</option>${talukas.map(p=>`<option value="${escAttr(p)}">${p}</option>`).join('')}</select>
      </div>
      <div style="flex:1;min-width:140px;"><label>સ્થિતિ</label>
        <select id="an-status">
          <option value="pending">ઇન્સ્પેક્શન બાકી</option>
          <option value="done">થઈ ગયું (૩૬૫ દિવસમાં)</option>
          <option value="all">બધા</option>
        </select>
      </div>
      <div style="flex:1;min-width:100px;"><label>ન્યૂનતમ કામદાર (R કોલમ)</label><input type="text" id="an-worker-min" placeholder="દા.ત. 50"></div>
    </div>
  </div>
  <div id="an-list"></div>`;
  function renderList(){
    const placeVal = document.getElementById('an-place').value;
    const statusVal = document.getElementById('an-status').value;
    const workerMin = parseInt(document.getElementById('an-worker-min').value)||0;
    const today = todayISO();
    let list = FACTORY_DB.filter(f=>{
      if(placeVal && f.taluka!==placeVal) return false;
      if(workerMin && (parseInt(f.worker)||0) < workerMin) return false;
      return true;
    }).map(f=>{
      const last = lastMap[f.name.trim().toLowerCase()];
      const isPending = !last || daysBetween(last, today) >= 365;
      const daysRemaining = last ? 365-daysBetween(last, today) : null;
      return {...f, lastDate: last||null, overdueDays: last? daysBetween(last, today)-365 : null, daysRemaining, isPending};
    });
    if(statusVal==='pending') list = list.filter(f=>f.isPending);
    else if(statusVal==='done') list = list.filter(f=>!f.isPending);
    if(statusVal==='done'){
      list.sort((a,b)=> (a.daysRemaining||0) - (b.daysRemaining||0));
    } else {
      list.sort((a,b)=>{
        if(a.lastDate===null && b.lastDate!==null) return -1;
        if(b.lastDate===null && a.lastDate!==null) return 1;
        if(a.lastDate===null && b.lastDate===null) return 0;
        return (b.overdueDays||0) - (a.overdueDays||0);
      });
    }
    const listBox = document.getElementById('an-list');
    if(!list.length){ listBox.innerHTML = '<div class="empty">આ ફિલ્ટર પ્રમાણે કોઈ ફેક્ટરી નથી</div>'; return; }
    listBox.innerHTML = `<div class="hint" style="margin-bottom:8px;">કુલ ${list.length} ફેક્ટરી</div>` + list.slice(0,200).map(f=>`
      <div class="item"><h4>${f.name}</h4>
        <div class="meta">તાલુકો: ${f.taluka||'-'} | સ્થળ: ${f.place||'-'} | કામદાર: ${f.worker||'-'}</div>
        ${f.lastDate
          ? (f.isPending
              ? `<span class="badge danger">છેલ્લું ઇન્સ્પેક્શન: ${toDMY(f.lastDate)} (${f.overdueDays} દિવસ મુદત વીતી)</span>`
              : `<span class="badge ok">છેલ્લું ઇન્સ્પેક્શન: ${toDMY(f.lastDate)} (${f.daysRemaining} દિવસ બાકી)</span>`)
          : '<span class="badge warn">ક્યારેય ઇન્સ્પેક્શન નથી થયું</span>'}
        <div class="row" style="margin-top:6px;"><button class="btn small start-ins-btn" data-name="${f.name.replace(/"/g,'&quot;')}">ઇન્સ્પેક્શન શરૂ કરો</button></div>
      </div>`).join('') + (list.length>200?`<div class="hint">પ્રથમ 200 બતાવેલ છે, વધુ માટે ફિલ્ટર સંકોચો</div>`:'');
    listBox.querySelectorAll('.start-ins-btn').forEach(b=>b.onclick=()=>startInspectionFromFactory(b.dataset.name));
  }
  document.getElementById('an-place').onchange = renderList;
  document.getElementById('an-status').onchange = renderList;
  document.getElementById('an-worker-min').oninput = renderList;
  renderList();
}
function getInspSummaryList(){
  return state.inspections.filter(i=>i.noticeNo && i.status!=='draft').sort((a,b)=>a.date<b.date?-1:(a.date>b.date?1:0));
}
const INSPSUMMARY_COLS = ['Sr No.','નિરીક્ષણ તારીખ','કેસ પ્ર્કાર','કારખાનુ નામ','કેમિકલ ટાઇપ','કંસલટંટ',
  'નોટીસ આઉટવર્ડ નમ્બર','નોટીસ આઉટવર્ડ તારીખ','જવાબ મળ્યા નંબર','જવાબ મળ્યા તારીખ',
  'દફતરે માટે અરજી કર્યા નંબર','દફતરે માટે અરજી કર્યા તારીખ','Remark','Safety Authorize'];
function getHiddenInspCols(){
  try{
    const v2 = localStorage.getItem('inspsummary-hidden-cols-v2');
    if(v2!==null) return JSON.parse(v2||'[]');
    const old = JSON.parse(localStorage.getItem('inspsummary-hidden-cols')||'[]');   // before "કેમિકલ ટાઇપ" was added
    const moved = old.map(i=>i>=4 ? i+1 : i);
    localStorage.setItem('inspsummary-hidden-cols-v2', JSON.stringify(moved));
    return moved;
  }catch(e){ return []; }
}
function renderInspSummary(main){
  let list = getInspSummaryList();
  const months = [...new Set(list.map(i=>monthKey(i.date)))].sort().reverse();
  const hidden = getHiddenInspCols();
  const consultants = [...new Set(list.map(i=>(i.consultant||'').trim()).filter(Boolean))].sort();
  function applyFilters(){
    const monthVal = document.getElementById('is-month-filter').value;
    const searchVal = (document.getElementById('is-search').value||'').trim().toLowerCase();
    const consultantVal = document.getElementById('is-consultant-filter').value;
    let filtered = getInspSummaryList();
    if(monthVal) filtered = filtered.filter(i=>monthKey(i.date)===monthVal);
    if(searchVal) filtered = filtered.filter(i=>(i.factory||'').toLowerCase().includes(searchVal));
    if(consultantVal) filtered = filtered.filter(i=>(i.consultant||'').trim()===consultantVal);
    document.getElementById('is-table-box').innerHTML = buildInspSummaryTableHTML(filtered);
    wireInspSummaryRows(main);
    applyColVisibility();
  }
  function applyColVisibility(){
    const hid = getHiddenInspCols();
    main.querySelectorAll('#is-table-box [data-col]').forEach(el=>{
      el.style.display = hid.includes(+el.dataset.col) ? 'none' : '';
    });
  }
  main.innerHTML = `<div class="card">
    <label style="margin-top:0;">ઇન્સ્પેક્શન સમરી (કંસલટંટ / Remark / Safety Authorize સિવાય બધું આપોઆપ ભરાય છે)</label>
    <div class="row">
      <div style="flex:1;min-width:140px;"><label>મહિનો</label>
        <select id="is-month-filter"><option value="">બધા</option>${months.map(k=>{ const [y,m]=k.split('-').map(Number); return `<option value="${k}">${GUJ_MONTHS[m-1]} - ${y}</option>`; }).join('')}</select></div>
      <div style="flex:1;min-width:160px;"><label>ફેક્ટરીનું નામ શોધો</label><input type="text" id="is-search" placeholder="ટાઈપ કરો..."></div>
      <div style="flex:1;min-width:140px;"><label>કંસલટંટ</label>
        <select id="is-consultant-filter"><option value="">બધા</option>${consultants.map(c=>`<option value="${c.replace(/"/g,'&quot;')}">${c}</option>`).join('')}</select></div>
    </div>
    <label>કોલમ બતાવો/છુપાવો</label>
    <div id="is-col-toggles" style="display:flex;flex-wrap:wrap;gap:4px 14px;margin-bottom:10px;">
      ${INSPSUMMARY_COLS.map((c,i)=>`<label style="margin:0;font-weight:normal;display:flex;align-items:center;gap:4px;"><input type="checkbox" class="is-col-chk" data-col="${i}" ${hidden.includes(i)?'':'checked'}> ${c}</label>`).join('')}
    </div>
    <div style="overflow-x:auto;" id="is-table-box">${buildInspSummaryTableHTML(list)}</div>
    <datalist id="consultantOptions">${(settings.consultantList||[]).map(c=>`<option value="${c.replace(/"/g,'&quot;')}">`).join('')}</datalist>
    <datalist id="safetyAuthOptions">${(settings.safetyAuthorizeList||[]).map(c=>`<option value="${c.replace(/"/g,'&quot;')}">`).join('')}</datalist>
    <datalist id="chemTypeOptions"><option value="Others"><option value="A"><option value="B"><option value="C"><option value="MAH"></datalist>
    <button class="btn small secondary" id="dl-inspsummary">Excel ડાઉનલોડ</button>
  </div>`;
  document.getElementById('is-month-filter').onchange = applyFilters;
  document.getElementById('is-search').oninput = applyFilters;
  document.getElementById('is-consultant-filter').onchange = applyFilters;
  main.querySelectorAll('.is-col-chk').forEach(chk=>{
    chk.onchange = ()=>{
      let hid = getHiddenInspCols();
      const col = +chk.dataset.col;
      if(chk.checked) hid = hid.filter(x=>x!==col); else if(!hid.includes(col)) hid.push(col);
      try{ localStorage.setItem('inspsummary-hidden-cols-v2', JSON.stringify(hid)); }catch(e){}
      applyColVisibility();
    };
  });
  document.getElementById('dl-inspsummary').onclick = ()=>downloadInspSummary(
    document.getElementById('is-month-filter').value,
    (document.getElementById('is-search').value||'').trim().toLowerCase(),
    document.getElementById('is-consultant-filter').value
  );
  wireInspSummaryRows(main);
  applyColVisibility();
}
function buildInspSummaryTableHTML(list){
  return `<table class="diary left-align"><tr>
    ${INSPSUMMARY_COLS.map((c,i)=>`<th data-col="${i}">${c}</th>`).join('')}
  </tr>
  ${list.map((ins,i)=>`<tr data-id="${ins.id}">
    <td data-col="0">${i+1}</td><td data-col="1">${toDMY(ins.date)}</td><td data-col="2" class="wrap">${ins.caseType||''}</td><td data-col="3" class="wrap">${ins.factory||''}</td>
    <td data-col="4" class="wrap"><input type="text" class="is-chem" list="chemTypeOptions" value="${escAttr(chemTypeFor(ins))}" style="width:100%;min-width:70px;border:none;background:transparent;"></td>
    <td data-col="5" class="wrap"><input type="text" class="is-consultant" list="consultantOptions" value="${escAttr(ins.consultant||'')}" style="width:100%;min-width:130px;border:none;background:transparent;"></td>
    <td data-col="6">${toGujNum(ins.noticeNo||'')}</td><td data-col="7">${toDMY(ins.outwardDate)}</td>
    <td data-col="8">${toGujNum(ins.inwardNo||'')}</td><td data-col="9">${toDMY(ins.inwardDate)}</td>
    <td data-col="10">${ins.daftareOutwardNo?toGujNum(ins.daftareOutwardNo):''}</td><td data-col="11">${ins.daftareOutwardDate?toDMY(ins.daftareOutwardDate):''}</td>
    <td data-col="12" class="wrap"><input type="text" class="is-remark" value="${escAttr(ins.summaryRemark||'')}" style="width:100%;min-width:200px;border:none;background:transparent;"></td>
    <td data-col="13" class="wrap"><input type="text" class="is-safetyauth" list="safetyAuthOptions" value="${escAttr(ins.safetyAuthorize||'')}" style="width:100%;min-width:170px;border:none;background:transparent;"></td>
  </tr>`).join('')}
  </table>`;
}
function wireInspSummaryRows(main){
  main.querySelectorAll('tr[data-id]').forEach(tr=>{
    const id = tr.dataset.id;
    const save = async (field, val)=>{
      const ins = state.inspections.find(x=>x.id===id);
      if(!ins) return;
      ins[field] = val;
      await saveInspection(ins);
    };
    tr.querySelector('.is-chem').oninput = e=>save('chemType', e.target.value);
    tr.querySelector('.is-consultant').oninput = e=>save('consultant', e.target.value);
    tr.querySelector('.is-consultant').onchange = e=>addToListIfNew('consultantList', e.target.value);
    tr.querySelector('.is-remark').oninput = e=>save('summaryRemark', e.target.value);
    tr.querySelector('.is-safetyauth').oninput = e=>save('safetyAuthorize', e.target.value);
    tr.querySelector('.is-safetyauth').onchange = e=>addToListIfNew('safetyAuthorizeList', e.target.value);
  });
}
async function downloadInspSummary(monthFilter, searchFilter, consultantFilter){
  let list = getInspSummaryList();
  if(monthFilter) list = list.filter(i=>monthKey(i.date)===monthFilter);
  if(searchFilter) list = list.filter(i=>(i.factory||'').toLowerCase().includes(searchFilter));
  if(consultantFilter) list = list.filter(i=>(i.consultant||'').trim()===consultantFilter);
  const headers = ['Sr No.','નિરીક્ષણ તારીખ','કેસ પ્ર્કાર','કારખાનુ નામ','કેમિકલ ટાઇપ','કંસલટંટ',
    'નોટીસ આઉટવર્ડ નમ્બર','નોટીસ આઉટવર્ડ તારીખ','જવાબ મળ્યા નંબર','જવાબ મળ્યા તારીખ',
    'દફતરે માટે અરજી કર્યા નંબર','દફતરે માટે અરજી કર્યા તારીખ','Remark','Safety Authorize'];
  const aoa = [headers, ...list.map((ins,i)=>[
    i+1, toDMY(ins.date), ins.caseType||'', ins.factory||'', chemTypeFor(ins), ins.consultant||'',
    toGujNum(ins.noticeNo||''), toDMY(ins.outwardDate), toGujNum(ins.inwardNo||''), toDMY(ins.inwardDate),
    ins.daftareOutwardNo?toGujNum(ins.daftareOutwardNo):'', ins.daftareOutwardDate?toDMY(ins.daftareOutwardDate):'',
    ins.summaryRemark||'', ins.safetyAuthorize||''
  ])];
  if(downloadsNS && typeof XLSX !== 'undefined'){
    try{
      const ws = XLSX.utils.aoa_to_sheet(aoa);
      ws['!cols'] = [{wch:5},{wch:12},{wch:10},{wch:26},{wch:12},{wch:14},{wch:10},{wch:12},{wch:10},{wch:12},{wch:14},{wch:14},{wch:30},{wch:18}];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Inspection Summary');
      const arrBuf = XLSX.write(wb, {type:'array', bookType:'xlsx'});
      const blob = new Blob([arrBuf], {type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
      await downloadsNS.save({filename:'inspection_summary_feed.xlsx', data: blob});
      return;
    }catch(e){ /* fall through */ }
  }
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body><table border="1">${aoa.map(r=>`<tr>${r.map(c=>`<td>${c}</td>`).join('')}</tr>`).join('')}</table></body></html>`;
  if(downloadsNS){ try{ await downloadsNS.save({filename:'inspection_summary_feed.html', data: html}); return; }catch(e){} }
  const w = window.open('', '_blank'); if(w){ w.document.write(html); w.document.close(); w.print(); }
}
function renderSummary(main){
  const months = [...new Set(getSummaryBaseList().map(i=>monthKey(i.date)))].sort().reverse();
  const hidden = getHiddenSummaryUnits();
  function applyUnitVisibility(){
    const hid = getHiddenSummaryUnits();
    main.querySelectorAll('#sum-table-box [data-unit]').forEach(el=>{
      el.style.display = hid.includes(+el.dataset.unit) ? 'none' : '';
    });
  }
  function refreshTable(){
    const monthVal = document.getElementById('sum-month-filter').value;
    const searchVal = (document.getElementById('sum-search').value||'').trim().toLowerCase();
    document.getElementById('sum-table-box').innerHTML = renderSummaryTableHTML(monthVal, searchVal);
    applyUnitVisibility();
  }
  main.innerHTML = `<div class="card">
    <label style="margin-top:0;">ઈન્સ્પેક્શન સારાંશ (Safety / Health / Welfare / Documents / Other)</label>
    <div class="row">
      <div style="flex:1;min-width:140px;"><label>મહિનો</label>
        <select id="sum-month-filter"><option value="">બધા</option>${months.map(k=>{ const [y,m]=k.split('-').map(Number); return `<option value="${k}">${GUJ_MONTHS[m-1]} - ${y}</option>`; }).join('')}</select></div>
      <div style="flex:1;min-width:160px;"><label>ફેક્ટરીનું નામ શોધો</label><input type="text" id="sum-search" placeholder="ટાઈપ કરો..."></div>
    </div>
    <label>કોલમ બતાવો/છુપાવો</label>
    <div style="display:flex;flex-wrap:wrap;gap:4px 14px;margin-bottom:10px;">
      ${SUMMARY_UNITS.map((c,i)=>`<label style="margin:0;font-weight:normal;display:flex;align-items:center;gap:4px;"><input type="checkbox" class="sum-unit-chk" data-unit="${i}" ${hidden.includes(i)?'':'checked'}> ${c}</label>`).join('')}
    </div>
    <div style="overflow-x:auto;" id="sum-table-box">${renderSummaryTableHTML('','')}</div>
    <button class="btn small secondary" id="dl-summary">ડાઉનલોડ (Excel-style HTML)</button>
  </div>`;
  document.getElementById('sum-month-filter').onchange = refreshTable;
  document.getElementById('sum-search').oninput = refreshTable;
  main.querySelectorAll('.sum-unit-chk').forEach(chk=>{
    chk.onchange = ()=>{
      let hid = getHiddenSummaryUnits();
      const u = +chk.dataset.unit;
      if(chk.checked) hid = hid.filter(x=>x!==u); else if(!hid.includes(u)) hid.push(u);
      try{ localStorage.setItem('summary-hidden-units', JSON.stringify(hid)); }catch(e){}
      applyUnitVisibility();
    };
  });
  document.getElementById('dl-summary').onclick = ()=>downloadSummary(
    document.getElementById('sum-month-filter').value,
    (document.getElementById('sum-search').value||'').trim().toLowerCase()
  );
  applyUnitVisibility();
}
function renderDiary(main){
  main.innerHTML = `
  <div class="card">
    <label style="margin-top:0;">ઓફિસરનું નામ</label><input type="text" id="s-name" value="${settings.officerName}">
    <label>હોદ્દો</label><input type="text" id="s-desig" value="${settings.designation}">
    <label>સ્થળ/જિલ્લો</label><input type="text" id="s-city" value="${settings.city}">
  </div>
  <div class="card">
    <label style="margin-top:0;">તારીખ (કેલેન્ડરમાંથી)</label><input type="text" id="d-date" class="dp-trigger" readonly value="${isoToDMYInput(todayISO())}" placeholder="DD/MM/YYYY">
    <label>સ્થળ</label><input type="text" id="d-place" value="${settings.city}">
    <label>કરેલા કામની વિગત (દા.ત. કચેરીએ હાજરી / રજા / ફેક્ટરીનું નામ)</label><textarea id="d-work"></textarea>
    <label>નોંધ</label><input type="text" id="d-note">
    <div class="row">
      <button class="btn" id="d-save">રોજનીશીમાં નોંધ ઉમેરો</button>
      <button class="btn small secondary" id="d-cancel-edit" style="display:none;">રદ કરો</button>
    </div>
  </div>
  <div id="d-months"></div>`;
  document.getElementById('s-name').onchange=async e=>{ settings.officerName=e.target.value; await saveSettings(); };
  document.getElementById('s-desig').onchange=async e=>{ settings.designation=e.target.value; await saveSettings(); };
  document.getElementById('s-city').onchange=async e=>{ settings.city=e.target.value; await saveSettings(); };
  let diaryPickedDate = todayISO();
  let editingDiaryId = null;
  document.getElementById('d-date').onclick=e=>{
    openDatePicker(e.target, diaryPickedDate, iso=>{ diaryPickedDate = iso; e.target.value = isoToDMYInput(iso); });
  };
  document.getElementById('d-save').onclick=async()=>{
    const date=diaryPickedDate;
    const place=document.getElementById('d-place').value;
    const work=document.getElementById('d-work').value.trim();
    const note=document.getElementById('d-note').value.trim();
    if(!work) return;
    if(editingDiaryId){
      const existing = state.diary.find(x=>x.id===editingDiaryId) || {};
      await saveDiaryEntry({...existing, id:editingDiaryId, date, place, work, note});
    } else {
      await saveDiaryEntry({id:uid(), date, place, work, note, remarksPage:"", lawBreach:""});
    }
    editingDiaryId = null;
    render();
  };
  document.getElementById('d-cancel-edit').onclick=()=>{ render(); };
  const monthsBox = document.getElementById('d-months');
  const keys = [...new Set(state.diary.map(e=>monthKey(e.date)))].sort().reverse();
  if(!keys.length){ monthsBox.innerHTML = '<div class="empty">કોઈ રોજનીશી નોંધ નથી</div>'; return; }
  monthsBox.innerHTML = keys.map(k=>{
    const entries = state.diary.filter(e=>monthKey(e.date)===k);
    const {html} = diaryTableHTML(k, entries, {editable:true});
    return `<div class="monthHead"><span></span><button class="btn small secondary dl-month" data-k="${k}">Excel ડાઉનલોડ</button></div>${html}`;
  }).join('');
  monthsBox.querySelectorAll('.dl-month').forEach(b=>b.onclick=e=>downloadDiaryMonth(e.target.dataset.k));
  monthsBox.querySelectorAll('.edit-diary-btn').forEach(b=>b.onclick=()=>{
    const entry = state.diary.find(x=>x.id===b.dataset.id);
    if(!entry) return;
    editingDiaryId = entry.id;
    diaryPickedDate = entry.date;
    document.getElementById('d-date').value = isoToDMYInput(entry.date);
    document.getElementById('d-place').value = entry.place || '';
    document.getElementById('d-work').value = entry.work || '';
    document.getElementById('d-note').value = entry.note || '';
    document.getElementById('d-save').textContent = 'નોંધ અપડેટ કરો';
    document.getElementById('d-cancel-edit').style.display = 'inline-block';
    document.getElementById('d-date').scrollIntoView({behavior:'smooth', block:'center'});
  });
  monthsBox.querySelectorAll('.del-diary-btn').forEach(b=>{
    b.onclick=async()=>{
      if(b.dataset.confirming!=='1'){
        b.dataset.confirming='1';
        const orig=b.textContent; b.textContent='ખરેખર?';
        setTimeout(()=>{ if(b.dataset.confirming==='1'){ b.dataset.confirming='0'; b.textContent=orig; } }, 4000);
        return;
      }
      const idx = state.diary.findIndex(x=>x.id===b.dataset.id);
      if(idx>=0) state.diary.splice(idx,1);
      if(dbNS){ try{ await dbNS.doc("diary/"+b.dataset.id).delete(); }catch(e){} }
      render();
    };
  });
}

render();
(async function boot(){
  try{ await initCapabilities(); }catch(e){}
  try{ await loadAll(); }catch(e){ render(); }
})();
function showAppError(msg){
  try{
    let bar=document.getElementById('appErrorBar');
    if(!bar){
      bar=document.createElement('div'); bar.id='appErrorBar';
      bar.style.cssText='position:fixed;left:8px;right:8px;bottom:8px;z-index:9999;background:#b3261e;color:#fff;padding:8px 12px;border-radius:8px;font-size:0.8rem;cursor:pointer;';
      bar.title='બંધ કરવા ક્લિક કરો';
      bar.onclick=()=>bar.remove();
      document.body.appendChild(bar);
    }
    bar.textContent='ભૂલ: '+String(msg||'અજ્ઞાત').slice(0,220)+'  (બંધ કરવા ક્લિક કરો, અને આ લખાણ મને મોકલો)';
  }catch(e){}
}
window.addEventListener('error', function(ev){ showAppError(ev && ev.message); try{ render(); }catch(e){} });
window.addEventListener('unhandledrejection', function(ev){ showAppError(ev && ev.reason && (ev.reason.message||ev.reason)); });
}
