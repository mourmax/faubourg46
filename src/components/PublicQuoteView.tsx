import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LeadStore } from '../lib/leads-store';
import { calculateQuoteTotal } from '../lib/quote-engine';
import type { QuoteLead } from '../lib/types';
import { Button, Card } from './ui/components';
import { Download, Loader2, Utensils } from 'lucide-react';
import { pdf } from '@react-pdf/renderer';
import { PdfDocument } from './PdfDocument';

export function PublicQuoteView() {
    const { id } = useParams<{ id: string }>();
    const [lead, setLead] = useState<QuoteLead | null>(null);
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (!id) return;
        LeadStore.getLead(id).then(res => {
            setLead(res);
            setLoading(false);
        });
    }, [id]);

    const handleDownload = async () => {
        if (!lead) return;
        setDownloading(true);
        try {
            const quote = calculateQuoteTotal(lead.selection);
            const blob = await pdf(<PdfDocument selection={lead.selection} quote={quote} />).toBlob();
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Devis_Faubourg46_${lead.selection.contact.name.replace(/\s+/g, '_')}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (e) {
            console.error(e);
            alert("Erreur lors de la génération du PDF.");
        } finally {
            setDownloading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-gold-600 animate-spin" />
            </div>
        );
    }

    if (!lead) {
        return (
            <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center p-4">
                <h1 className="text-2xl font-black text-dark-900 uppercase tracking-widest mb-4">Devis non trouvé</h1>
                <Button onClick={() => navigate('/')} className="gold-gradient text-white px-8">Retour au site</Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f8f8f8] p-4 md:p-8 flex flex-col items-center justify-center">
             <div className="w-full max-w-2xl space-y-8 animate-in fade-in zoom-in duration-500">
                <div className="text-center space-y-4">
                    <h1 className="text-4xl font-black tracking-tighter uppercase gold-text-gradient">FAUBOURG 46</h1>
                    <p className="text-neutral-400 font-black uppercase tracking-[0.3em] text-[10px]">Votre demande de devis</p>
                </div>

                <Card className="bg-white p-8 md:p-12 border-none shadow-2xl rounded-[3rem] text-center space-y-8">
                    <div className="w-20 h-20 bg-gold-50 rounded-full flex items-center justify-center mx-auto">
                        <Utensils className="w-10 h-10 text-gold-600" />
                    </div>
                    
                    <div className="space-y-2">
                        <h2 className="text-2xl font-black text-dark-900 uppercase tracking-widest">Bonjour {lead.selection.contact.name}</h2>
                        <p className="text-neutral-500 text-sm font-medium">Votre estimation est prête à être téléchargée.</p>
                    </div>

                    <div className="py-8 border-y border-neutral-50 flex flex-col items-center gap-4">
                        <Button 
                            onClick={handleDownload} 
                            disabled={downloading}
                            className="w-full h-16 text-sm font-black uppercase tracking-widest gold-gradient text-white gap-3 shadow-xl hover:scale-[1.02] active:scale-95 transition-all rounded-2xl"
                        >
                            {downloading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                            Télécharger le devis PDF
                        </Button>
                        <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest">
                            Format PDF • {new Date(lead.createdAt).toLocaleDateString('fr-FR')}
                        </p>
                    </div>

                    <Button variant="ghost" onClick={() => navigate('/')} className="text-neutral-400 hover:text-dark-900 font-black uppercase tracking-widest text-[10px]">
                        Retour au site principal
                    </Button>
                </Card>
             </div>
        </div>
    );
}
