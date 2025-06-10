# The Augmented 4 Pty Ltd - Corporate Governance Dashboard

Interactive dashboard for visualizing and understanding the corporate governance structure of The Augmented 4 Pty Ltd, including the Shareholders Agreement and Constitution.

## Features

- **Interactive Game Mode**: Simulate KPI achievement and equity distribution changes
- **Valuation Calculator**: Real-time company valuation based on customer growth and investment terms
- **Protection Balance**: Analyze the balance between company and founder protections
- **Investor Pool Analysis**: Overview of share allocation for future investment rounds
- **Leaver Events**: Scenarios for different types of departures and their impact
- **Constitution Overview**: Comprehensive view of the 141-section constitution adopted June 9, 2025

## Technology Stack

- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **Recharts** for data visualization
- **Lucide React** for icons

## Corporate Structure Overview

### Shareholders Agreement (Updated Structure)
- **Domenico Rutigliano**: CTO, 50% equal partnership ownership (5,000,000 shares)
- **Michael Scheelhardt**: CRO, 50% equal partnership ownership (5,000,000 shares)
- **Partnership Structure**: Equal 50/50 ownership from day one, no KPI-based transfers
- **IP Ownership**: Domenico retains IP ownership until capital raise event, then assigns to company for AUD 80,000

### Constitution (9 June 2025)
- **141 comprehensive sections** covering all aspects of corporate governance
- **3 share classes**: Ordinary Voting (84%), Preference Non-Voting (10%), Employee Ordinary Non-Voting (6%)
- **Reserved matters** requiring unanimous director approval
- **Full compliance** with Corporations Act 2001 and ASIC requirements
- **Investment ready** structure for future funding rounds and potential IPO

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation
```bash
npm install
```

### Development
```bash
npm run dev
```

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

## Dashboard Sections

1. **Business Growth Simulation**: Simulate company growth phases with equal partnership structure
2. **Valuation Calculator**: Adjust investment parameters and see company valuation impact
3. **Protection Balance**: Radar chart showing balance between company and founder protections
4. **Investor Pool**: Analysis of share allocation for future investment rounds
5. **Leaver Events**: Impact analysis of different departure scenarios
6. **Constitution**: Comprehensive overview of the 141-section constitution

## Legal Documents

- **Shareholders Agreement**: Effective 30 May 2025
- **Constitution**: Adopted 9 June 2025 via special resolution
- **Company Details**: The Augmented 4 Pty Ltd (ACN 686 749 575)

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config({
  extends: [
    // Remove ...tseslint.configs.recommended and replace with this
    ...tseslint.configs.recommendedTypeChecked,
    // Alternatively, use this for stricter rules
    ...tseslint.configs.strictTypeChecked,
    // Optionally, add this for stylistic rules
    ...tseslint.configs.stylisticTypeChecked,
  ],
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config({
  plugins: {
    // Add the react-x and react-dom plugins
    'react-x': reactX,
    'react-dom': reactDom,
  },
  rules: {
    // other rules...
    // Enable its recommended typescript rules
    ...reactX.configs['recommended-typescript'].rules,
    ...reactDom.configs.recommended.rules,
  },
})
```
