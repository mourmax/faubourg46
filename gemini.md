# Project Constitution - FAUBOURG

## Business Logic Rules

### 1. Formula Availability (The "Golden Rules")

#### Midi (Lunch)
- **Semaine (Lun-Ven):** Formules Brasserie + **Plat du Jour**.
- **Weekend (Sam-Dim):** **STRICTEMENT Brunch** uniquement (Adulte/Enfant). Les autres formules (Tapas, Brasserie) sont désactivées.

#### Soir (Dinner)
- **Dimanche au Jeudi:** Toutes les formules (Tapas & Brasserie).
- **Vendredi & Samedi (Soirées Festives):**
  - **Premier Service (DINNER_1) / Soirée Complète (DINNER_FULL):** Uniquement les formules **Festives** (Tapas Festif, Brasserie Festive).
  - **Deuxième Service (DINNER_2 - dès 22h15):** Toutes les formules disponibles.

### 2. Operational Constraints
- **Capacité Brasserie:** Les formules Brasserie classiques sont limitées à **30 personnes maximum**. Au-delà, passer sur du Festif ou Tapas (ou validation manuelle).
- **Validation Convives:** Le nombre total de formules sélectionnées doit être **égal** au nombre de convives déclaré dans l'étape 1.

### 3. Centralisation de la Logique
- **Fichier de référence :** [quote-engine.ts](file:///c:/Users/matis/Desktop/FAUBOURG%20-%20DEVIS%20GROUPE/src/lib/quote-engine.ts)
- **Fonction :** `getFormulaAvailability`
- **Utilisation :** Cette fonction est utilisée à la fois par le parcours utilisateur (`StepMenu.tsx`) et par l'éditeur admin (`LeadEditor.tsx`) pour garantir une application uniforme des règles de restriction.

### Formula Definition (`FormulaDefinition`)
```typescript
{
    id: string;
    name: string;
    type: 'TAPAS' | 'BRASSERIE';
    priceTtc: number;
    breakdown: { ... };
    included: string[];
    restrictions?: {
        days?: number[]; // 0=Dim, 1=Lun...
        services?: string[]; // LUNCH, DINNER_1, DINNER_2, DINNER_FULL
        maxGuests?: number;
    };
}
```

### Contact Schema (`contact`)
```typescript
{
    name: string;
    email: string;
    phone: string;
    isCompany: boolean;
    company?: string;
    address?: string;
    vatNumber?: string;
    internalRef?: string;
    allergies?: string;
}
```

### Custom Item Schema (`customItem`)
```typescript
{
    label: string;
    quantity: number;
    priceTtc: number; // Unit Price
    vatRate: 10 | 20;
}
```

