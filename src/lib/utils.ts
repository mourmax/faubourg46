export const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR',
    }).format(amount).replace(/\s/g, ' '); // Replace non-breaking spaces with regular spaces for PDF compatibility
};

