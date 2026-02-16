import type { QuoteSelection } from './types';
import { formatCurrency } from './utils';
import { calculateQuoteTotal } from './quote-engine';

export const sendNotificationEmail = async (
    selection: QuoteSelection,
    settings: {
        notificationEmail: string;
        emailJsPublicKey: string;
        emailJsTemplateId: string;
    },
    pdfBlob?: Blob
) => {
    if (!settings.emailJsPublicKey || !settings.emailJsTemplateId) {
        console.warn('[Notification] EmailJS credentials missing, skipping email.');
        return;
    }

    const quote = calculateQuoteTotal(selection);
    
    // Format individual items breakdown
    const formulasHtml = selection.formulas
        .filter(f => f.quantity > 0)
        .map(f => `<li>${f.quantity}x ${f.formula.name} - ${formatCurrency((f.customPrice ?? f.formula.priceTtc) * f.quantity)}</li>`)
        .join('');

    const optionsHtml = selection.options
        .filter(o => o.quantity > 0)
        .map(o => `<li>${o.quantity}x ${o.name} - ${formatCurrency(o.totalTtc)}</li>`)
        .join('');

    const customItemHtml = selection.customItem && selection.customItem.priceTtc !== 0
        ? `<li>1x ${selection.customItem.label} - ${formatCurrency(selection.customItem.priceTtc * selection.customItem.quantity)}</li>`
        : '';

    const summaryHtml = `
        <div style="font-family: sans-serif; line-height: 1.5; color: #333;">
            <h2 style="color: #af8936;">Nouveau Devis Faubourg 46</h2>
            <p><strong>Client:</strong> ${selection.contact.name} (${selection.contact.email} / ${selection.contact.phone})</p>
            <p><strong>Événement:</strong> ${new Date(selection.event.date).toLocaleDateString('fr-FR')} - ${selection.event.service}</p>
            <p><strong>Convives:</strong> ${selection.event.guests} Adultes ${selection.event.childrenGuests ? `+ ${selection.event.childrenGuests} Enfants` : ''}</p>
            
            <h3 style="border-bottom: 1px solid #eee; padding-bottom: 5px;">Sélection</h3>
            <ul>
                ${formulasHtml}
                ${optionsHtml}
                ${customItemHtml}
            </ul>
            
            <p style="font-size: 18px;"><strong>Total Estimation: ${formatCurrency(quote.totalTtc)}</strong></p>
            <p>Acompte requis: ${formatCurrency(quote.deposit)}</p>
            
            <div style="margin-top: 20px; padding: 10px; background: #f9f9f9; border-radius: 5px;">
                <p><strong>Notes Internes:</strong> ${selection.internalNotes || 'Aucune'}</p>
            </div>
        </div>
    `;

    // Convert PDF Blob to base64 if provided
    let pdfBase64 = '';
    if (pdfBlob) {
        pdfBase64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64data = reader.result as string;
                resolve(base64data.split(',')[1]); // Remove data:application/pdf;base64,
            };
            reader.readAsDataURL(pdfBlob);
        });
    }

    const templateParams = {
        to_email: settings.notificationEmail,
        client_name: selection.contact.name,
        client_email: selection.contact.email,
        client_phone: selection.contact.phone,
        event_date: new Date(selection.event.date).toLocaleDateString('fr-FR'),
        event_service: selection.event.service,
        total_ttc: formatCurrency(quote.totalTtc),
        summary_html: summaryHtml,
        content: `Nouveau devis de ${selection.contact.name} pour le ${new Date(selection.event.date).toLocaleDateString('fr-FR')}`,
        // Handle attachment for EmailJS REST API
        // Note: EmailJS REST API expects attachments as an array of objects
        // or a base64 string depending on the configuration. 
        // We'll use the variable name 'my_attachment' in the template
        content_base64: pdfBase64 
    };

    try {
        const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                service_id: 'service_54e2uef',
                template_id: settings.emailJsTemplateId,
                user_id: settings.emailJsPublicKey,
                template_params: templateParams
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`EmailJS Error: ${response.status} - ${errorText}`);
        }

        console.log('[Notification] Email sent successfully');
    } catch (error) {
        console.error('[Notification] Failed to send email:', error);
    }
};
