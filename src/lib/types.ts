export type VatRate = 10 | 20;

export interface PriceComponent {
    ht: number;
    rate: VatRate;
    tva: number;
}

export interface FormulaPriceDetail {
    baseHt: number;
    vat10: number;
    vat20: number;
    totalTtc: number;
    // Specific breakdown as per PRD
    part10: { ht: number; tva: number };
    part20: { ht: number; tva: number };
}

export interface FormulaDefinition {
    id: string;
    name: string;
    type: 'TAPAS' | 'BRASSERIE';
    priceTtc: number;
    breakdown: FormulaPriceDetail;
    restrictions?: {
        days?: number[]; // [0,1,2,3,4] for Sun-Thu
        services?: ('LUNCH' | 'DINNER_1' | 'DINNER_2' | 'DINNER_FULL')[];
        maxGuests?: number;
    };
    description?: string;
    included?: string[];
}

export interface QuoteItem {
    name: string;
    quantity: number;
    unitPriceTtc: number;
    totalTtc: number;
    vatRate: VatRate; // Options usually stick to one rate (e.g. Alcohol 20%)
}

export type LeadStatus = 'NEW' | 'CONTACTED' | 'WAITING' | 'VALIDATED' | 'CANCELLED';

export interface LeadComment {
    id: string;
    text: string;
    date: Date;
    author: string;
}

export interface QuoteSelection {
    contact: {
        name: string;
        email: string;
        phone: string;
        isCompany: boolean;
        company?: string;
        address?: string;
        internalRef?: string;
        vatNumber?: string;
        allergies?: string;
    };
    event: {
        date: Date;
        service: 'LUNCH' | 'DINNER_1' | 'DINNER_2' | 'DINNER_FULL';
        guests: number;
        childrenGuests?: number;
    };
    formula: FormulaDefinition;
    options: QuoteItem[];
    discount?: {
        type: 'PERCENT' | 'AMOUNT';
        value: number;
    };
    internalNotes?: string;
}

export interface QuoteLead {
    id: string;
    status: LeadStatus;
    selection: QuoteSelection;
    createdAt: Date;
    comments: LeadComment[];
    lastUpdated: Date;
}
export interface AppSettings {
    whatsappEnabled: boolean;
    whatsappNumber: string;
}
