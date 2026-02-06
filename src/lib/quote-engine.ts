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
    const { formulas = [], options = [], event, agencyCommission, formula: legacyFormula } = selection;

    // Totals accumulation
    let totalTtc = 0;
    let totalHt10 = 0;
    let totalTva10 = 0;
    let totalHt20 = 0;
    let totalTva20 = 0;

    // Handle legacy single-formula leads
    const effectiveFormulas = [...formulas];
    if (effectiveFormulas.length === 0 && legacyFormula) {
        effectiveFormulas.push({ formula: legacyFormula, quantity: event.guests || 0 });
    }

    // 1. Process Formulas
    effectiveFormulas.forEach(sf => {
        const { formula, quantity, customPrice } = sf;
        if (quantity <= 0) return;

        const priceTtc = customPrice !== undefined ? customPrice : formula.priceTtc;
        const lineTotalTtc = priceTtc * quantity;
        totalTtc += lineTotalTtc;

        // Breakdown VAT based on formula's breakdown ratio if standard price,
        // or proportional breakdown if custom price.
        // For simplicity, we use the breakdown ratio from the formula definition.
        // However, the formula definition already has ht/tva per person.
        // If price is custom, we scale these proportionately.
        const scaleFactor = priceTtc / formula.priceTtc;

        totalHt10 += formula.breakdown.part10.ht * quantity * scaleFactor;
        totalTva10 += formula.breakdown.part10.tva * quantity * scaleFactor;
        totalHt20 += formula.breakdown.part20.ht * quantity * scaleFactor;
        totalTva20 += formula.breakdown.part20.tva * quantity * scaleFactor;
    });

    // 2. Special case: Brunch Children (if not explicitly in formulas but Brunch Adult is)
    const hasBrunchAdult = formulas.some(f => f.formula.id === 'BRUNCH_ADULT');
    if (hasBrunchAdult && event.childrenGuests && event.childrenGuests > 0) {
        // Only if not already explicitly added
        const hasBrunchChild = formulas.some(f => f.formula.id === 'BRUNCH_CHILD');
        if (!hasBrunchChild) {
            const childFormula = FORMULAS.find(f => f.id === 'BRUNCH_CHILD');
            if (childFormula) {
                const childCount = event.childrenGuests;
                totalTtc += childFormula.priceTtc * childCount;
                totalHt10 += childFormula.breakdown.part10.ht * childCount;
                totalTva10 += childFormula.breakdown.part10.tva * childCount;
                totalHt20 += childFormula.breakdown.part20.ht * childCount;
                totalTva20 += childFormula.breakdown.part20.tva * childCount;
            }
        }
    }

    // 3. Process Options
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
                // If any formula is BRASSERIE, cake is free
                const hasBrasserie = formulas.some(f => f.formula.type === 'BRASSERIE');
                if (hasBrasserie) {
                    unitPrice = 0;
                } else {
                    unitPrice = 4.50; // per guest? PRD said 4.50/pers if Tapas
                }
            }

            const lineTtc = unitPrice * (opt.name === 'Gâteau d’anniversaire' ? event.guests : qty);
            totalTtc += lineTtc;

            const rate = opt.vatRate;
            const ht = lineTtc / (1 + rate / 100);
            const tva = lineTtc - ht;

            if (rate === 10) {
                totalHt10 += ht;
                totalTva10 += tva;
            } else {
                totalHt20 += ht;
                totalTva20 += tva;
            }
        }
    });

    // 4. Apply Discount
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

    totalHt10 *= discountFactor;
    totalTva10 *= discountFactor;
    totalHt20 *= discountFactor;
    totalTva20 *= discountFactor;

    // 5. Agency Commission (Calculated AFTER discount, added to total)
    let commissionAmount = 0;
    if (agencyCommission && agencyCommission.value > 0) {
        if (agencyCommission.type === 'PERCENT') {
            commissionAmount = totalTtc * (agencyCommission.value / 100);
        } else {
            commissionAmount = agencyCommission.value;
        }
    }

    // Commission is extra revenue, usually includes VAT 20%
    if (commissionAmount > 0) {
        totalTtc += commissionAmount;
        const commissionHt = commissionAmount / 1.2;
        const commissionTva = commissionAmount - commissionHt;
        totalHt20 += commissionHt;
        totalTva20 += commissionTva;
    }

    const totalHt = totalHt10 + totalHt20;
    const totalTva = totalTva10 + totalTva20;

    // Deposit (30%)
    const deposit = totalTtc * 0.3;

    return {
        totalTtc,
        totalHt,
        totalTva,
        deposit,
        commissionAmount,
        breakdown: {
            vat10: { ht: totalHt10, tva: totalTva10 },
            vat20: { ht: totalHt20, tva: totalTva20 }
        }
    };
};
