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

export interface SelectedFormula {
    formula: FormulaDefinition;
    quantity: number;
    customPrice?: number;
}

export interface QuoteItem {
    name: string;
    quantity: number;
    unitPriceTtc: number;
    totalTtc: number;
    vatRate: VatRate;
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
    formula?: FormulaDefinition;
    formulas: SelectedFormula[];
    options: QuoteItem[];
    discount?: {
        type: 'PERCENT' | 'AMOUNT';
        value: number;
    };
    agencyCommission?: {
        type: 'PERCENT' | 'FIXED';
        value: number;
    };
    internalNotes?: string;
    customItem?: {
        label: string;
        quantity: number;
        priceTtc: number;
        vatRate: VatRate;
    };
    lastReference?: string;
}

export interface QuoteLead {
    id: string;
    status: LeadStatus;
    selection: QuoteSelection;
    createdAt: Date;
    comments: LeadComment[];
    lastUpdated: Date;
    history?: QuoteSelection[];
    invoice?: InvoiceData;
}


export interface CustomLineItem {
    id: string;
    description: string;
    quantity: number;
    unitPriceHt: number;
    vatRate: VatRate;
    totalHt: number;
    totalTva: number;
    totalTtc: number;
}

export interface InvoiceData {
    invoiceNumber: string;
    invoiceDate: Date;
    customItems: CustomLineItem[];
    depositReceived: boolean;
    depositAmount?: number;
    depositDate?: Date;
    depositMethod?: string;
}

export interface AppSettings {
    whatsappEnabled: boolean;
    whatsappNumber: string;
    notificationEmail: string;
    emailJsPublicKey: string;
    emailJsTemplateId: string;
    emailJsServiceId: string;
    emailJsPrivateKey: string;
}

