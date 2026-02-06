import type { FormulaDefinition, QuoteSelection, QuoteItem } from './types';

// Helper to create price detail
const createDetail = (
    ht10: number, tva10: number,
    ht20: number, tva20: number
) => {
    return {
        baseHt: ht10 + ht20,
        vat10: tva10,
        vat20: tva20,
        totalTtc: ht10 + tva10 + ht20 + tva20,
        part10: { ht: ht10, tva: tva10 },
        part20: { ht: ht20, tva: tva20 }
    };
};

export const FORMULAS: FormulaDefinition[] = [
    // --- TAPAS ---
    {
        id: 'TAPAS_FAUBOURG',
        name: 'FBG 46',
        type: 'TAPAS',
        priceTtc: 49.00,
        breakdown: createDetail(35.45, 3.55, 8.33, 1.67),
        included: [
            "Charcuterie", "Avocado Toast", "Saumon fumé maison", "St Marcellin rôti au miel",
            "Gyoza poulet légumes", "Frites maison", "Croque à la truffe", "Assortiment de desserts",
            "1 bouteille de vin pour 3 personnes"
        ],
        restrictions: {
            days: [0, 1, 2, 3, 4], // Sun-Thu (Standard)
            services: ['DINNER_2'] // Added to Weekends via logic in StepMenu
        }
    },
    {
        id: 'TAPAS_COCKTAILS',
        name: 'COCKTAIL',
        type: 'TAPAS',
        priceTtc: 59.00,
        breakdown: createDetail(35.45, 3.55, 16.67, 3.33),
        included: [
            "Charcuterie", "Avocado Toast", "Saumon fumé maison", "St Marcellin miel",
            "Gyoza poulet légumes", "Frites maison", "Croque à la truffe", "Assortiment de desserts",
            "1 bouteille de vin pour 3 personnes", "1 Cocktail par personne"
        ],
        restrictions: {
            days: [0, 1, 2, 3, 4],
            services: ['DINNER_2']
        }
    },
    {
        id: 'TAPAS_FESTIF',
        name: 'FESTIVE',
        type: 'TAPAS',
        priceTtc: 85.00,
        breakdown: createDetail(35.45, 3.55, 38.33, 7.67),
        description: "Disponible 7/7. Permet de rester sur les deux services le vendredi et samedi à partir de 21h.",
        included: [
            "Charcuterie", "Avocado Toast", "Saumon fumé maison", "St Marcellin miel",
            "Gyoza poulet légumes", "Frites maison", "Croque à la truffe", "Assortiment de desserts",
            "1 bouteille de vin pour 3 personnes", "3 Cocktails par personne", "Eau pétillante"
        ]
    },
    // --- BRASSERIE ---
    {
        id: 'BRASSERIE_PARTIAL',
        name: 'Brasserie (ENTRÉE / PLAT ou PLAT / DESSERT)',
        type: 'BRASSERIE',
        priceTtc: 42.00,
        breakdown: createDetail(29.09, 2.91, 8.33, 1.67),
        included: [
            "Entrée / Plat ou Plat / Dessert au choix",
            "Ex: Œuf Parfait ou Gravelax de Saumon",
            "Ex: Suprême de Volaille ou Filet de lieu noir",
            "1 bouteille de vin pour 3 personnes"
        ],
        restrictions: {
            days: [0, 1, 2, 3, 4],
            maxGuests: 30
        }
    },
    {
        id: 'BRASSERIE_FULL',
        name: 'Brasserie (ENTRÉE + PLAT + DESSERT)',
        type: 'BRASSERIE',
        priceTtc: 55.00,
        breakdown: createDetail(40.91, 4.09, 8.33, 1.67),
        included: [
            "Entrée + Plat + Dessert au choix",
            "Ex: Carpaccio de Bœuf, Filet de Bœuf, Brioche Perdue",
            "1 bouteille de vin pour 3 personnes"
        ],
        restrictions: {
            days: [0, 1, 2, 3, 4],
            maxGuests: 30
        }
    },
    {
        id: 'BRASSERIE_COCKTAILS',
        name: 'Brasserie Cocktail',
        type: 'BRASSERIE',
        priceTtc: 65.00,
        breakdown: createDetail(40.91, 4.09, 16.67, 3.33),
        included: [
            "Détail : Entrée + Plat + Dessert",
            "1 bouteille de vin pour 3 personnes",
            "1 Cocktail sur mesure"
        ],
        restrictions: {
            days: [0, 1, 2, 3, 4],
            maxGuests: 30
        }
    },
    {
        id: 'BRASSERIE_FESTIVE',
        name: 'Brasserie Festive',
        type: 'BRASSERIE',
        priceTtc: 89.00,
        breakdown: createDetail(40.91, 4.09, 36.67, 7.33),
        description: "Disponible 7/7. Permet de rester sur les deux services le vendredi et samedi à partir de 21h.",
        included: [
            "Menu complet Entrée Plat Dessert",
            "1 bouteille de vin pour 3 personnes",
            "3 Cocktails par personne",
            "Eau pétillante & Café"
        ]
    },
    // --- BRUNCH ---
    {
        id: 'BRUNCH_ADULT',
        name: 'Brunch (Adulte)',
        type: 'BRASSERIE',
        priceTtc: 36.00,
        breakdown: createDetail(32.73, 3.27, 0, 0),
        included: ["Buffet Brunch à volonté", "Boissons chaudes & jus de fruits frais"],
        restrictions: {
            services: ['LUNCH'],
            days: [0, 6] // Dim, Sam
        }
    },
    {
        id: 'BRUNCH_CHILD',
        name: 'Brunch (Enfant)',
        type: 'BRASSERIE',
        priceTtc: 16.00,
        breakdown: createDetail(14.55, 1.45, 0, 0),
        included: ["Buffet Brunch à volonté (-12 ans)"],
        restrictions: {
            services: ['LUNCH'],
            days: [0, 6]
        }
    },
    {
        id: 'PLAT_DU_JOUR',
        name: 'Formule Plat du Jour',
        type: 'BRASSERIE',
        priceTtc: 26.00,
        breakdown: createDetail(23.64, 2.36, 0, 0), // 10% VAT
        included: ["Plat du Jour + Dessert", "UNIQUEMENT LE MIDI", "Du lundi au vendredi"],
        restrictions: {
            services: ['LUNCH'],
            days: [1, 2, 3, 4, 5]
        }
    }
];

export const INITIAL_SELECTION: QuoteSelection = {
    contact: {
        name: '',
        email: '',
        phone: '',
        isCompany: false,
        company: '',
        address: '',
        vatNumber: '',
        internalRef: '',
        allergies: ''
    },
    event: { date: new Date(), service: 'DINNER_1', guests: 10 },
    formula: FORMULAS[0],
    formulas: [],
    options: []
};

export const CHAMPAGNES: QuoteItem[] = [
    { name: 'Théophile (75cl)', unitPriceTtc: 85.00, quantity: 0, totalTtc: 0, vatRate: 20 },
    { name: 'Louis Roederer Collection 245 (75cl)', unitPriceTtc: 98.00, quantity: 0, totalTtc: 0, vatRate: 20 },
    { name: 'Gosset « Grande Reserve » (75cl)', unitPriceTtc: 98.00, quantity: 0, totalTtc: 0, vatRate: 20 },
    { name: 'Veuve Clicquot « Reserve » (75cl)', unitPriceTtc: 110.00, quantity: 0, totalTtc: 0, vatRate: 20 },
    { name: 'Veuve Clicquot « Rosé » (75cl)', unitPriceTtc: 120.00, quantity: 0, totalTtc: 0, vatRate: 20 },
    { name: 'Dom Pérignon « Vintage » (75cl)', unitPriceTtc: 300.00, quantity: 0, totalTtc: 0, vatRate: 20 },
    { name: 'Veuve Clicquot (Magnum)', unitPriceTtc: 205.00, quantity: 0, totalTtc: 0, vatRate: 20 },
    { name: 'Veuve Clicquot (Jeroboam)', unitPriceTtc: 550.00, quantity: 0, totalTtc: 0, vatRate: 20 },
    { name: 'Prosecco (75cl)', unitPriceTtc: 36.00, quantity: 0, totalTtc: 0, vatRate: 20 },
];

export const EXTRAS: QuoteItem[] = [
    { name: 'DJ', unitPriceTtc: 288.00, quantity: 0, totalTtc: 0, vatRate: 20 },
    { name: 'Gâteau d’anniversaire', unitPriceTtc: 4.5, quantity: 0, totalTtc: 0, vatRate: 10 },
    { name: 'Café (par pers.)', unitPriceTtc: 2.00, quantity: 0, totalTtc: 0, vatRate: 10 },
    { name: 'Eau minérale plate/gazeuse (btl 2 pers)', unitPriceTtc: 3.00, quantity: 0, totalTtc: 0, vatRate: 10 }
];
