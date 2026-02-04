import type { QuoteSelection } from './types';
import { FORMULAS } from './data';

export const isFestiveRequired = (date: Date, service: string): boolean => {
    const day = date.getDay(); // 0 = Sunday, 5 = Friday, 6 = Saturday

    // "Pour rester sur les deux créneaux" - assumes checking if they want to stay long or just specific slots?
    // Implementation: If service is DINNER_FULL and it's Fri/Sat
    // PRD: "Condition : Pour rester sur les deux créneaux, sélection obligatoire d'une formule Festive."
    // This likely means if they book BOTH services or spans across? 
    // Or check if the user selected a "Long Service" option?
    // Re-reading PRD: "Vendredi/Samedi soir : Service 1 (19h30-21h50) ou Service 2 (22h15). Condition : Pour rester sur les deux créneaux, sélection obligatoire d'une formule Festive."
    // Interpretation: If they want to stay for the whole evening (Service 1 + Service 2), they must choose Festive.
    // Implementation: We probably need a "Whole Evening" service option in the UI, or if they select specific time.
    // Let's assume there's a 'DINNER_FULL' or similar, or we check if they selected "Service 1 & 2".

    // For now, let's implement validation: if service check indicates "Double Service", return true.
    // I'll assume 'DINNER_FULL' is a valid service key for "Both services".

    if (service === 'DINNER_FULL' && (day === 5 || day === 6)) {
        return true;
    }

    return false;
};

export const calculateQuoteTotal = (selection: QuoteSelection) => {
    const { formula, options, event } = selection;
    const guestCount = event.guests || 0;

    // Formula Totals (Adults)
    let formulaTotalTtc = formula.priceTtc * guestCount;
    let formulaHt10 = formula.breakdown.part10.ht * guestCount;
    let formulaTva10 = formula.breakdown.part10.tva * guestCount;
    let formulaHt20 = formula.breakdown.part20.ht * guestCount;
    let formulaTva20 = formula.breakdown.part20.tva * guestCount;

    // Children Totals (Only for Brunch)
    if (formula.id === 'BRUNCH_ADULT' && event.childrenGuests && event.childrenGuests > 0) {
        const childFormula = FORMULAS.find(f => f.id === 'BRUNCH_CHILD');
        if (childFormula) {
            const childCount = event.childrenGuests;
            formulaTotalTtc += childFormula.priceTtc * childCount;
            formulaHt10 += childFormula.breakdown.part10.ht * childCount;
            formulaTva10 += childFormula.breakdown.part10.tva * childCount;
            formulaHt20 += childFormula.breakdown.part20.ht * childCount;
            formulaTva20 += childFormula.breakdown.part20.tva * childCount;
        }
    }

    // Options Totals (Wines, DJ, etc.)
    let optionsTotalTtc = 0;
    let optionsHt10 = 0;
    let optionsTva10 = 0;
    let optionsHt20 = 0;
    let optionsTva20 = 0;

    options.forEach(opt => {
        const qty = opt.quantity;
        if (qty > 0) {
            let unitPrice = opt.unitPriceTtc;

            // DJ is free on Thu (4), Fri (5), Sat (6)
            if (opt.name === 'DJ') {
                const day = event.date.getDay();
                if (day === 4 || day === 5 || day === 6) {
                    unitPrice = 0;
                }
            }

            // Birthday Cake logic
            if (opt.name === 'Gâteau d’anniversaire') {
                if (formula.type === 'BRASSERIE') {
                    unitPrice = 0;
                } else if (formula.type === 'TAPAS') {
                    // 4.50€ per person
                    unitPrice = 4.50;
                }
            }

            const lineTtc = unitPrice * (opt.name === 'Gâteau d’anniversaire' ? guestCount : qty);
            optionsTotalTtc += lineTtc;

            // Calculate HT and TVA from TTC based on rate
            const rate = opt.vatRate;
            const ht = lineTtc / (1 + rate / 100);
            const tva = lineTtc - ht;

            if (rate === 10) {
                optionsHt10 += ht;
                optionsTva10 += tva;
            } else {
                optionsHt20 += ht;
                optionsTva20 += tva;
            }
        }
    });

    // Grand Totals
    let totalTtc = formulaTotalTtc + optionsTotalTtc;
    let totalHt = formulaHt10 + formulaHt20 + optionsHt10 + optionsHt20;

    // Apply Discount
    let discountAmount = 0;
    if (selection.discount) {
        if (selection.discount.type === 'PERCENT') {
            discountAmount = totalTtc * (selection.discount.value / 100);
        } else {
            discountAmount = selection.discount.value;
        }
    }

    const discountFactor = totalTtc > 0 ? (totalTtc - discountAmount) / totalTtc : 1;

    totalTtc = Math.max(0, totalTtc - discountAmount);

    const totalHt10 = (formulaHt10 + optionsHt10) * discountFactor;
    const totalTva10 = (formulaTva10 + optionsTva10) * discountFactor;
    const totalHt20 = (formulaHt20 + optionsHt20) * discountFactor;
    const totalTva20 = (formulaTva20 + optionsTva20) * discountFactor;

    totalHt = totalHt10 + totalHt20;
    const totalTva = totalTva10 + totalTva20;

    // Deposit (30%)
    const deposit = totalTtc * 0.3;

    return {
        totalTtc,
        totalHt,
        totalTva,
        deposit,
        breakdown: {
            vat10: { ht: totalHt10, tva: totalTva10 },
            vat20: { ht: totalHt20, tva: totalTva20 }
        }
    };
};
