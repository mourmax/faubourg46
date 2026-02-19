import type { QuoteSelection } from './types';
import { FORMULAS } from './data';

export const isFestiveRequired = (date: Date, service: string): boolean => {
    const day = date.getDay(); // 0 = Sunday, 5 = Friday, 6 = Saturday

    if (service === 'DINNER_FULL' && (day === 5 || day === 6)) {
        return true;
    }

    return false;
};

export const getFormulaAvailability = (
    formula: { id: string; type: string; restrictions?: any },
    date: Date,
    service: string,
    guests: number
): { available: boolean; reason?: string } => {
    const day = date.getDay(); // 0 = Dimanche, 1-5 = Lun-Ven, 6 = Samedi
    const isWeekend = day === 0 || day === 6;
    const isFestiveNight = day === 5 || day === 6; // Vendredi, Samedi

    // Rule 1: Midi Weekend (S, D) -> Brunch Only (STRICT)
    if (service === 'LUNCH' && isWeekend) {
        if (formula.id.includes('BRUNCH')) {
            return { available: true };
        }
        return { available: false, reason: "Brunch UNIQUEMENT" };
    }

    // Rule 2: Brunch is ONLY for Lunch
    if (formula.id.includes('BRUNCH') && service !== 'LUNCH') {
        return { available: false, reason: "Brunch midi uniquement" };
    }

    // Rule 3: Tapas is always available (except during Weekend Brunch or Festive Night constraints)
    if (formula.type === 'TAPAS' && !formula.id.includes('FESTIF')) {
        return { available: true };
    }

    // Rule 4: Midi Weekday (L-V)
    if (service === 'LUNCH' && !isWeekend) {
        return { available: true };
    }

    // Rule 5: Soir (Festif) V, S
    if (isFestiveNight && (service === 'DINNER_1' || service === 'DINNER_FULL')) {
        if (formula.id.includes('FESTIF') || formula.id.includes('FESTIVE')) {
            return { available: true };
        }
        return { available: false, reason: "Soirée Festive uniquement" };
    }

    // Rule 6: Soir (Autres) V, S -> Only from 22h15 (Service 2)
    if (isFestiveNight && service === 'DINNER_2') {
        return { available: true };
    }

    // General Restrictions from data.ts
    if (formula.restrictions?.days && !formula.restrictions.days.includes(day)) {
        return { available: false, reason: "Indisponible ce jour" };
    }

    if (formula.restrictions?.maxGuests && guests > formula.restrictions.maxGuests) {
        return { available: false, reason: `Max ${formula.restrictions.maxGuests} pers.` };
    }

    return { available: true };
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

        // If price is custom, we scale HT parts proportionately based on the original formula parts
        const originalTtc = formula.priceTtc || (formula.part10Ht * 1.1 + formula.part20Ht * 1.2);
        const scaleFactor = originalTtc > 0 ? priceTtc / originalTtc : 1;

        const lineHt10 = formula.part10Ht * quantity * scaleFactor;
        const lineHt20 = formula.part20Ht * quantity * scaleFactor;

        totalHt10 += lineHt10;
        totalTva10 += lineHt10 * 0.1;
        totalHt20 += lineHt20;
        totalTva20 += lineHt20 * 0.2;
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
                const lineHt10 = childFormula.part10Ht * childCount;
                const lineHt20 = childFormula.part20Ht * childCount;

                totalTtc += (lineHt10 * 1.1) + (lineHt20 * 1.2);
                totalHt10 += lineHt10;
                totalTva10 += lineHt10 * 0.1;
                totalHt20 += lineHt20;
                totalTva20 += lineHt20 * 0.2;
            }
        }
    }

    // 3. Process Options
    options.forEach(opt => {
        const qty = opt.quantity;
        if (qty > 0) {
            let unitPriceHt = opt.unitPriceHt;
            const rate = opt.vatRate;

            // DJ is free on Thu (4), Fri (5), Sat (6)
            if (opt.name === 'DJ') {
                const day = event.date.getDay();
                if (day === 4 || day === 5 || day === 6) {
                    unitPriceHt = 0;
                }
            }

            const multiplier = opt.name === 'Gâteau d’anniversaire' ? event.guests : qty;
            const lineHt = unitPriceHt * multiplier;
            const lineTva = lineHt * (rate / 100);
            const lineTtc = lineHt + lineTva;

            totalTtc += lineTtc;

            if (rate === 10) {
                totalHt10 += lineHt;
                totalTva10 += lineTva;
            } else {
                totalHt20 += lineHt;
                totalTva20 += lineTva;
            }
        }
    });

    // 3.5 Process Custom Item (Champs Libre)
    if (selection.customItem && selection.customItem.priceTtc !== 0) {
        const { priceTtc, vatRate, quantity = 1 } = selection.customItem;
        const totalLineTtc = priceTtc * quantity;
        totalTtc += totalLineTtc;

        const ht = totalLineTtc / (1 + vatRate / 100);
        const tva = totalLineTtc - ht;

        if (vatRate === 10) {
            totalHt10 += ht;
            totalTva10 += tva;
        } else {
            totalHt20 += ht;
            totalTva20 += tva;
        }
    }

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
