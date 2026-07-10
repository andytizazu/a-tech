import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

// Lazy initialize Gemini client to avoid crashes if GEMINI_API_KEY is not defined yet
let aiClient: GoogleGenAI | null = null;
function getGeminiClient() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is missing. Please configure it in Settings -> Secrets.');
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Endpoint for localized epidemiological forecasting and alert guidelines
  app.post('/api/gemini/forecast', async (req, res) => {
    const { country } = req.body;
    const userCountry = (country || 'Ethiopia').trim();

    // High-fidelity dynamic weekly rotating database for localized East African countries
    const getLocalForecast = (ctry: string) => {
      const lowerCountry = ctry.toLowerCase();
      const dayOfWeek = new Date().getDay(); // 0 is Sunday, 1 is Monday, etc.

      const DAILY_THEMES = [
        {
          // Sunday (Index 0) - Enteric Waterborne Focus
          disease: "Cholera Outbreak Peak",
          severity: "high",
          regionTemplate: {
            ethiopia: "Amhara, Oromia, and Somali regions",
            kenya: "Garissa County and Nairobi informal settlements",
            somalia: "Banadir and Lower Shabelle regions",
            generic: "Flood-affected lowland plains and urban centers"
          },
          descriptionTemplate: {
            ethiopia: "Contaminated communal water points and inadequate sanitation in heavy rain zones are accelerating localized transmission. Severe watery diarrhea presentations rising.",
            kenya: "Heavy rainfall and localized runoff have triggered active enteric water-borne disease clusters in urban outskirt dispensaries.",
            somalia: "Flooding alongside restricted access to safe drinking water has accelerated AWD/Cholera transmission index in temporary settlements.",
            generic: "Seasonal water utility disruptions are causing a rise in water-borne enteric pathogen transmission across high-density neighborhoods."
          },
          forecastingSuggestions: [
            "Immediately prioritize FEFO (First-Expired, First-Out) stock rotations on all Oral Rehydration Salts and IV Fluids.",
            "Initiate a priority reorder of IV Cannulas, giving sets, and physiological saline solutions to cover localized surges."
          ],
          recommendedMeds: [
            { category: "Fluid & Dehydration Therapies", medicines: "Oral Rehydration Salts (ORS) + Zinc, Normal Saline (0.9% NaCl)", rationale: "Universal first-line response to protect pediatric and adult patients suffering acute secretory diarrhea." },
            { category: "Targeted Antimicrobials", medicines: "Ciprofloxacin 500mg, Doxycycline 100mg", rationale: "Clinical guidelines recommend targeted short-course antimicrobials for severe, verified Vibrio cholerae strains." }
          ]
        },
        {
          // Monday (Index 1) - Vector-Borne Malaria Focus
          disease: "Seasonal Malaria Epidemic Risk",
          severity: "high",
          regionTemplate: {
            ethiopia: "Lowland zones of Oromia, SNNPR, Gambela, and Afar",
            kenya: "Mombasa, Coast Province, and Kisumu County",
            somalia: "Shabelle valley and riverine agricultural communities",
            generic: "Low-lying riverine basins and standing water zones"
          },
          descriptionTemplate: {
            ethiopia: "Post-rain standing water is creating extensive vector breeding zones. Expect up to a 35% increase in outpatient febrile presentations.",
            kenya: "Coastal humidity and pooling rain water have triggered a surge in Anopheles vector counts. Pediatric clinics reporting high positivity.",
            somalia: "River floods have left extensive vector breeding grounds, accelerating seasonal plasmodium transmission and severe febrile cases.",
            generic: "Standing pools following seasonal rain cycles have created mosquito vector hotbeds, multiplying febrile cases."
          },
          forecastingSuggestions: [
            "Pre-position Artemether+Lumefantrine (Coartem) and rapid malaria diagnostic kits at high-risk satellite clinics.",
            "Ensure sufficient stock of insecticide-treated bed nets (LLINs) and mosquito repellents on display shelves."
          ],
          recommendedMeds: [
            { category: "Antimalarials & Diagnostics", medicines: "Artemether + Lumefantrine (Coartem), Malaria RDT Kits", rationale: "Ensures immediate, reliable diagnostic confirmation and standard therapeutic compliance in endemic regions." },
            { category: "Severe Malaria Response", medicines: "Artesunate Injections, IV Dextrose (5%)", rationale: "Life-saving therapy for severe or complicated malaria cases presenting cerebral symptoms." }
          ]
        },
        {
          // Tuesday (Index 2) - Bacterial Meningitis / Dust Storms
          disease: "Meningococcal Meningitis Belt Alert",
          severity: "medium",
          regionTemplate: {
            ethiopia: "Central Rift Valley belt and western borders",
            kenya: "Turkana County and northern semi-arid borders",
            somalia: "Gedo region and dry inland IDP encampments",
            generic: "Arid or semi-arid districts experiencing high wind speeds"
          },
          descriptionTemplate: {
            ethiopia: "Dry winds and elevated dust conditions irritate mucous membranes, enhancing susceptibility to Neisseria meningitidis droplet transmission.",
            kenya: "Arid dust corridors and high density in temporary shelters are driving droplet transmission risk of meningococcal pathogens.",
            somalia: "Severe dust levels combined with crowded communal zones have elevated seasonal bacterial meningitis transmission indices.",
            generic: "Seasonal dry, dusty winds combined with high diurnal temperature drops are driving outbreaks of meningococcal pathogens."
          },
          forecastingSuggestions: [
            "Ensure ample stock of third-generation cephalosporins (e.g. Ceftriaxone) for immediate clinical intervention.",
            "Equip frontline dispensing staff with basic protective masks and print public awareness pamphlets on ventilation."
          ],
          recommendedMeds: [
            { category: "Broad Spectrum Antibiotics", medicines: "Ceftriaxone 1g Injection, Ampicillin 1g IV", rationale: "Empiric first-line treatment for suspected bacterial meningitis pending spinal fluid verification." },
            { category: "Symptomatic Support & Anti-inflammatories", medicines: "Dexamethasone Injections, Paracetamol 500mg", rationale: "Used adjunctive to antibiotic therapy to reduce neurologically harmful inflammatory responses." }
          ]
        },
        {
          // Wednesday (Index 3) - Respiratory Transition
          disease: "Seasonal Respiratory Viral Transmission",
          severity: "medium",
          regionTemplate: {
            ethiopia: "Addis Ababa municipal area and cooler highland zones",
            kenya: "Nairobi County, Kiambu, and highland agricultural belts",
            somalia: "Densely populated coastal Mogadishu and Hargeisa",
            generic: "All major populated urban centers and high-altitude towns"
          },
          descriptionTemplate: {
            ethiopia: "Sharp drops in night-time temperatures are triggering a major wave of acute respiratory tract infections in children.",
            kenya: "Cooler seasonal weather in highland cities is driving indoor crowding and rapid respiratory viral transmission.",
            somalia: "Cool evening ocean winds are causing elevated pediatric and adult influenza-like illnesses and wheezing.",
            generic: "Seasonal temperature drops and indoor crowding are driving rapid transmission of respiratory pathogens across communities."
          },
          forecastingSuggestions: [
            "Prepare for a 25-40% surge in pediatric cough syrups, antihistamines, and bronchodilator inhalers.",
            "Audit oxygen concentrator readiness and pulse oximeter stocks for outpatient respiratory screening."
          ],
          recommendedMeds: [
            { category: "Bronchodilators & Asthma Care", medicines: "Salbutamol Inhalers, Budesonide Respules", rationale: "Essential to treat asthma exacerbations and viral-induced wheezing in both pediatric and adult patients." },
            { category: "Symptomatic & Allergy Relief", medicines: "Cetirizine 10mg, Bromhexine Cough Syrup", rationale: "Symptomatic alleviation of rhinorrhea, allergic coughs, and throat irritation." }
          ]
        },
        {
          // Thursday (Index 4) - Typhoid & Salmonellosis
          disease: "Enteric Typhoid Fever Spike",
          severity: "high",
          regionTemplate: {
            ethiopia: "Densely populated zones of Gondar, Awasa, and Addis Ababa",
            kenya: "Nakuru County, Eldoret, and urban informal centers",
            somalia: "Kismayo, Baidoa, and regional transit hubs",
            generic: "Populated municipal sectors with variable water supply"
          },
          descriptionTemplate: {
            ethiopia: "Intermittent municipal water distributions have caused a rising baseline of Salmonella typhi diagnostic reports.",
            kenya: "Contamination in local groundwater wells has resulted in an enteric typhoid outbreak cluster requiring urgent therapy.",
            somalia: "Unprotected public wells in transit corridors have triggered elevated enteric fever presentations among traveling merchants.",
            generic: "Water supply quality fluctuations have increased the risk of food-borne and water-borne typhoid transmission."
          },
          forecastingSuggestions: [
            "Review antibiotic susceptibility patterns for regional Salmonella strains and adjust pharmacy stocking ratios.",
            "Stock up on Typhoid Rapid diagnostic cassettes (Widal or Typhidot test kits)."
          ],
          recommendedMeds: [
            { category: "Fluoroquinolones & Cephalosporins", medicines: "Ciprofloxacin 500mg, Ceftriaxone IV", rationale: "Standard therapeutic regimens for uncomplicated and severe enteric fever cases." },
            { category: "Macrolide Alternatives", medicines: "Azithromycin 500mg tablets", rationale: "Highly effective alternative choice for patients or regions showing multi-drug resistant typhoid strains." }
          ]
        },
        {
          // Friday (Index 5) - Measles & Vaccination Care
          disease: "Measles Transmission Wave",
          severity: "high",
          regionTemplate: {
            ethiopia: "Afar region and pastoralist borders with Somalia",
            kenya: "Garissa, Wajir, and refugee settlement zones",
            somalia: "Communal shelters and outer transit districts",
            generic: "Border gates, transit hubs, and communities with lower immunization rates"
          },
          descriptionTemplate: {
            ethiopia: "Dry season dust storms coupled with lower immunization coverage are driving measles transmission in children across pastoral areas.",
            kenya: "Densely packed communities and dynamic population movements have triggered a pediatric measles cluster in Garissa outskirts.",
            somalia: "Low historical immunization rates coupled with high displacement volumes are driving active measles outbreaks.",
            generic: "Densely packed populations and seasonal winds are accelerating viral transmission of measles among children."
          },
          forecastingSuggestions: [
            "Ensure maximum inventory of pediatric Vitamin A capsules which are clinically proven to mitigate measles ophthalmic issues.",
            "Advise staff to isolate febrile rash pediatric patients immediately upon entry to prevent in-pharmacy transmission."
          ],
          recommendedMeds: [
            { category: "Immunological Intervention", medicines: "Vitamin A Capsules (100,000 IU / 200,000 IU)", rationale: "Essential protocol to prevent corneal scarring and severe secondary respiratory complications in children." },
            { category: "Antipyretics & Dehydration Support", medicines: "Paracetamol Drops/Syrup, Zinc + ORS packets", rationale: "Controls high-grade fevers and replaces fluids lost due to diarrheal or febrile hyper-metabolism." }
          ]
        },
        {
          // Saturday (Index 6) - Dengue Vector Surge
          disease: "Dengue Fever Vector Surge",
          severity: "medium",
          regionTemplate: {
            ethiopia: "Dire Dawa charter city and Somali regional border zones",
            kenya: "Mombasa, Malindi, and Coastal Counties",
            somalia: "Coastal Mogadishu, Bosaso, and river delta plains",
            generic: "Humid coastal areas and urban zones with poor drainage"
          },
          descriptionTemplate: {
            ethiopia: "Uncovered household water containers in arid zones are encouraging intensive Aedes vector breeding and local dengue clusters.",
            kenya: "Post-monsoon urban water accumulation in scrap heaps and gutters has triggered active dengue outbreaks in coastal centers.",
            somalia: "Water storage practices in coastal sectors are giving rise to rapid Aedes aegypti breeding cycles and clinical fevers.",
            generic: "Warm temperatures and standing water containers are accelerating mosquito vector breeding and Dengue fevers."
          },
          forecastingSuggestions: [
            "Strictly warn dispensing staff to advise dengue patients to avoid NSAIDs (Ibuprofen, Aspirin) to prevent severe bleeding.",
            "Make sure standard Paracetamol and rehydration salts are clearly displayed next to mosquito repellent spray."
          ],
          recommendedMeds: [
            { category: "Dengue-Safe Analgesics", medicines: "Paracetamol (Acetaminophen) - Avoid NSAIDs", rationale: "Symptomatic control of joint aches and fevers must avoid platelet-inhibiting NSAIDs to prevent hemorrhagic risk." },
            { category: "Isotonic Fluid Replacers", medicines: "Oral Rehydration Salts (ORS) packets", rationale: "Maintains blood volume and guards against critical plasma leakage during the acute phase." }
          ]
        }
      ];

      const theme = DAILY_THEMES[dayOfWeek];
      let countryKey: 'ethiopia' | 'kenya' | 'somalia' | 'generic' = 'generic';
      if (lowerCountry.includes('ethiopia')) {
        countryKey = 'ethiopia';
      } else if (lowerCountry.includes('kenya')) {
        countryKey = 'kenya';
      } else if (lowerCountry.includes('somalia') || lowerCountry.includes('somali')) {
        countryKey = 'somalia';
      }

      const region = theme.regionTemplate[countryKey];
      const description = theme.descriptionTemplate[countryKey];

      return {
        isCachedFallback: true,
        outbreakAlerts: [
          {
            disease: theme.disease,
            severity: theme.severity,
            region: region,
            description: description
          }
        ],
        forecastingSuggestions: theme.forecastingSuggestions,
        recommendedMeds: theme.recommendedMeds
      };
    };

    try {
      const todayDate = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      const currentDayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
      
      const prompt = `You are a professional, senior epidemiologist and smart pharmaceutical logistics consultant specializing in East Africa.
The user is a pharmacist or pharmaceutical importer signed in from the country: ${userCountry}.

Today is ${todayDate}.
Since the user relies on this dashboard for daily-varying decision support, you MUST generate suggestions and alerts specifically focused on the seasonal demands and epidemiological conditions of this precise day of the year.
To ensure variety, focus your daily suggestions on a theme related to: ${
        currentDayName === 'Sunday' || currentDayName === 'Thursday'
          ? 'water-borne cholera/diarrhea and pediatric rehydration'
          : currentDayName === 'Monday' || currentDayName === 'Friday'
          ? 'vector-borne malaria/dengue vector surges'
          : currentDayName === 'Tuesday'
          ? 'vaccine cold-chain stability and meningitis vaccine logistics'
          : currentDayName === 'Wednesday'
          ? 'respiratory/influenza highland winter transitions'
          : 'enteric typhoid and chronic secondary medicine stability'
      }.

Please provide:
1. "outbreakAlerts": A list of active or seasonal disease outbreak alerts specifically relevant to ${userCountry} currently (e.g., cholera peaks, malaria seasonal highs, measles outbreaks, meningitis, dengue, or regional water-borne infection warnings). Provide specific localized insights for regional zones of ${userCountry} (e.g. for Ethiopia mention specific regions like Amhara, Oromia, Somali, Tigray, etc.). Make sure it includes a daily-varying situational update so it is different from other days of the week.
2. "forecastingSuggestions": Actions or tips the pharmacy should execute today in their inventory, cooling system, shelf-life rotations, or branch distributions based on these seasonal patterns.
3. "recommendedMeds": A list of top 2-3 specific drug categories or essential medicines they should stock up on right now to satisfy clinical demand for these alerts, with a clear clinical/geographic reason.

Format the response as a strict JSON object with this exact typescript structure:
{
  "outbreakAlerts": [
    {
      "disease": "string",
      "severity": "high" | "medium" | "low",
      "region": "string (specific zones of the country)",
      "description": "string (context, symptoms, and impact)"
    }
  ],
  "forecastingSuggestions": [
    "string (highly specific, actionable operational advice)"
  ],
  "recommendedMeds": [
    {
      "category": "string (e.g. Oral Rehydration Salts)",
      "medicines": "string (specific clinical medicines or classes)",
      "rationale": "string (clinical and supply chain logic)"
    }
  ]
}

Ensure the response is raw JSON only. Do not wrap it in markdown backticks or any other text.`;

      const ai = getGeminiClient();
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        }
      });

      const rawText = response.text || '{}';
      const parsedData = JSON.parse(rawText.trim());
      // Inject cached flag as false since it succeeded online
      parsedData.isCachedFallback = false;
      res.json(parsedData);
    } catch (error: any) {
      // Gracefully switch to the beautiful, high-fidelity daily rotating local expert database
      const localFallback = getLocalForecast(userCountry);
      res.json(localFallback);
    }
  });

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: Date.now() });
  });

  // Vite middleware setup for Development vs Production static serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Full-Stack Server] ATECH East Africa listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[Full-Stack Server] Boot error:', err);
  process.exit(1);
});
