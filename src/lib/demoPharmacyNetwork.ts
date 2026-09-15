import { UserProfile } from '../types';

export interface EthiopianRegionDef {
  region: string;
  cities: {
    name: string;
    subCitiesOrAreas: string[];
  }[];
}

export const ETHIOPIAN_LOCATIONS: EthiopianRegionDef[] = [
  {
    region: 'Addis Ababa',
    cities: [
      {
        name: 'Addis Ababa City',
        subCitiesOrAreas: [
          'Bole Medhanealem', 'Bole Atlas', 'Bole Rwanda', 'Bole Bulbula',
          'Piazza Churchill', 'Arada Kebele 01', 'Arada Posta Bet',
          'Megenagna Yeka', 'Yeka Abado', 'Kotebe 02',
          'Kirkos Kazanchis', 'Kirkos Mexico Square', 'Kirkos Meskel Flower',
          'Lideta Balcha', 'Lideta Abinet',
          'Nifas Silk Lafto Jomo', 'Nifas Silk Lebu', 'Nifas Silk Gotera',
          'Kolfe Keranio 18/19', 'Kolfe Zenebework',
          'Akaki Kality Industrial', 'Akaki Kality Kebele 04',
          'Gullele Shiro Meda', 'Gullele Addisu Gebeya',
          'Merkato Military Tera', 'Merkato Bomb Tera'
        ]
      }
    ]
  },
  {
    region: 'Oromia',
    cities: [
      {
        name: 'Adama',
        subCitiesOrAreas: ['Posta Bet Kebele 03', 'Bole Area', 'Boku Shenen', 'Central Market Road']
      },
      {
        name: 'Bishoftu',
        subCitiesOrAreas: ['Hora Lake Road', 'Babogaya View', 'Central Hospital District', 'Kebele 01']
      },
      {
        name: 'Jimma',
        subCitiesOrAreas: ['Aba Jifar Palace Road', 'Hermata Market', 'Jimma Hospital Ave', 'Ginjo Kebele']
      },
      {
        name: 'Shashamane',
        subCitiesOrAreas: ['Awasho District', 'Arada Central', 'Kebele 08 Commercial Zone']
      }
    ]
  },
  {
    region: 'Amhara',
    cities: [
      {
        name: 'Bahir Dar',
        subCitiesOrAreas: ['Kebele 04 Lake Tana Ave', 'Gish Abay District', 'Fasilo Commercial Square', 'Felege Hiwot Road']
      },
      {
        name: 'Gondar',
        subCitiesOrAreas: ['Fasil Ghebbi Castle Square', 'Maraki Campus Gate', 'Azezo Airport Road', 'Piazza Gondar']
      },
      {
        name: 'Dessie',
        subCitiesOrAreas: ['Piazza Commercial', 'Hote Kebele 02', 'Boru Meda District']
      }
    ]
  },
  {
    region: 'Sidama',
    cities: [
      {
        name: 'Hawassa',
        subCitiesOrAreas: ['Lake View Kebele 05', 'Tabor Sub-City', 'Menaheria Commercial Hub', 'Kebele 02 Central']
      }
    ]
  },
  {
    region: 'Dire Dawa',
    cities: [
      {
        name: 'Dire Dawa',
        subCitiesOrAreas: ['Kebele 02 Commercial District', 'Kazira Railway Ave', 'Gende Kore Center', 'Taiwan Market Zone']
      }
    ]
  },
  {
    region: 'Tigray',
    cities: [
      {
        name: 'Mekelle',
        subCitiesOrAreas: ['Kedamay Weyane Square', 'Hawelti District', 'Ayder Hospital Road', 'Adi Haki Center']
      }
    ]
  },
  {
    region: 'Harari',
    cities: [
      {
        name: 'Harar',
        subCitiesOrAreas: ['Jugol Gate 01', 'Arat Kegna', 'Shenkor District']
      }
    ]
  },
  {
    region: 'Somali',
    cities: [
      {
        name: 'Jijiga',
        subCitiesOrAreas: ['Karamara Hospital Road', 'Kebele 06 Center', 'New Commercial Boulevard']
      }
    ]
  }
];

export interface DemoPharmacySpec {
  uid: string;
  email: string;
  role: 'pharmacy';
  displayName: string;
  pharmacyName: string;
  ownerName: string;
  phone: string;
  country: string;
  region: string;
  city: string;
  area: string;
  address: string;
  licenseNumber: string;
  verificationStatus: 'approved';
  subscriptionType: 'basic' | 'standard' | 'premium';
  subscriptionStatus: 'active';
  createdAt: number;
  branchCount: number;
  salesVolumeTier: 'flagship' | 'high' | 'medium' | 'boutique';
  isDemo: true;
}

const PHARMACY_NAME_PREFIXES = [
  'Care', 'LifeLine', 'Apex', 'Crown', 'Unity', 'Hope', 'Sunrise', 'MedHealth',
  'FirstChoice', 'CityShield', 'Grace', 'WellSpring', 'PrimeRx', 'GreenCross',
  'Guardian', 'Vitality', 'Metro', 'Pioneer', 'Horizon', 'TrustCare',
  'Golden', 'Beacon', 'Serenity', 'St. Mary', 'Abyssinia', 'Oasis', 'Alpha',
  'Zenith', 'National', 'Premier', 'Remedy', 'Nova', 'Harmony', 'Pulse'
];

const ETHIOPIAN_FIRST_NAMES = [
  'Abebe', 'Tigist', 'Dawit', 'Hiwot', 'Yohannes', 'Selamawit', 'Mulugeta', 'Almaz',
  'Kenenisa', 'Meron', 'Natnael', 'Bethlehem', 'Eskinder', 'Rahel', 'Solomon', 'Genet',
  'Tewodros', 'Senait', 'Haile', 'Helen', 'Yared', 'Meseret', 'Biniyam', 'Frehiwot',
  'Tamrat', 'Kalkidan', 'Nebiyu', 'Mahlet', 'Daniel', 'Tsion', 'Bereket', 'Hanna'
];

const ETHIOPIAN_LAST_NAMES = [
  'Bikila', 'Assefa', 'Kebede', 'Haile', 'Tadesse', 'Desta', 'Berhanu', 'Ayana',
  'Bekele', 'Tesfaye', 'Girma', 'Tilahun', 'Mengistu', 'Alemayehu', 'Worku', 'Zewde',
  'Kassa', 'Gebre', 'Wolde', 'Melaku', 'Demisse', 'Fikre', 'Bogale', 'Tekle',
  'Gashaw', 'Negash', 'Lemma', 'Mekonnen', 'Belay', 'Shiferaw', 'Abebaw', 'Endale'
];

export function generate120DemoPharmacies(): DemoPharmacySpec[] {
  const pharmacies: DemoPharmacySpec[] = [];
  let counter = 1;

  ETHIOPIAN_LOCATIONS.forEach(loc => {
    loc.cities.forEach(cityObj => {
      cityObj.subCitiesOrAreas.forEach(area => {
        // Distribute volume tiers
        let salesVolumeTier: 'flagship' | 'high' | 'medium' | 'boutique' = 'medium';
        if (loc.region === 'Addis Ababa' && (area.includes('Bole') || area.includes('Piazza') || area.includes('Merkato'))) {
          salesVolumeTier = counter % 2 === 0 ? 'flagship' : 'high';
        } else if (cityObj.name === 'Adama' || cityObj.name === 'Hawassa' || cityObj.name === 'Bahir Dar') {
          salesVolumeTier = counter % 3 === 0 ? 'high' : 'medium';
        } else {
          salesVolumeTier = counter % 4 === 0 ? 'boutique' : 'medium';
        }

        const prefix = PHARMACY_NAME_PREFIXES[(counter - 1) % PHARMACY_NAME_PREFIXES.length];
        const ownerFirst = ETHIOPIAN_FIRST_NAMES[(counter * 7) % ETHIOPIAN_FIRST_NAMES.length];
        const ownerLast = ETHIOPIAN_LAST_NAMES[(counter * 11) % ETHIOPIAN_LAST_NAMES.length];
        const ownerName = `DEMO ${ownerFirst} ${ownerLast} (Licensed Pharmacist)`;

        const cleanCityCode = cityObj.name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 5);
        const padId = String(counter).padStart(3, '0');
        const uid = `demo_pharm_${cleanCityCode}_${padId}`;
        const phone = `+251 90 000 ${String(1000 + counter).slice(-4)} (DEMO)`;
        const email = `demo.pharm.${padId}@atech-demo.et`;
        const licenseNumber = `EFDA-DEMO-RX-${2026}-${String(5000 + counter)}`;

        const shortName = `${prefix} Pharmacy`;
        const pharmacyName = `DEMO ${prefix} Pharmacy (${cityObj.name} - ${area.split(' ')[0]})`;

        const subTier: 'basic' | 'standard' | 'premium' = 
          salesVolumeTier === 'flagship' ? 'premium' :
          salesVolumeTier === 'high' ? (counter % 2 === 0 ? 'premium' : 'standard') :
          counter % 3 === 0 ? 'basic' : 'standard';

        const branchCount = salesVolumeTier === 'flagship' ? 3 : salesVolumeTier === 'high' ? 2 : 1;
        const daysAgo = 30 + ((counter * 17) % 150);

        pharmacies.push({
          uid,
          email,
          role: 'pharmacy',
          displayName: shortName,
          pharmacyName,
          ownerName,
          phone,
          country: 'Ethiopia',
          region: loc.region,
          city: cityObj.name,
          area,
          address: `${area}, Kebele District, ${cityObj.name}, ${loc.region}`,
          licenseNumber,
          verificationStatus: 'approved',
          subscriptionType: subTier,
          subscriptionStatus: 'active',
          createdAt: Date.now() - daysAgo * 24 * 60 * 60 * 1000,
          branchCount,
          salesVolumeTier,
          isDemo: true
        });

        counter++;
      });
    });
  });

  return pharmacies;
}
