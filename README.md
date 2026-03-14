# TTF Gas Supply Stack Curve — Quantitative Framework

A fundamental supply-side model for building a TTF (Title Transfer Facility) forward price curve from merit-order supply aggregation. Covers Norwegian pipeline, global LNG, other pipeline imports, indigenous EU production, and storage dynamics across a 5-year horizon (2025–2029).

---

## Project Structure

```
TTF supply stack/
├── TTF_Supply_Stack_Framework.ipynb    # Jupyter notebook — full model + charts
├── TTF_Supply_Stack_Framework.xlsx     # Excel workbook — 7-tab financial model
├── ttf_supply_stack_model.py           # Python engine — dataclass calculation core
├── ttf_dashboard.jsx                   # React dashboard — interactive 7-tab UI
├── TTF_Thought_Process.docx            # Methodology — design decisions & trade-offs
└── README.md                           # This file
```

---

## Components

### 1. Jupyter Notebook (`TTF_Supply_Stack_Framework.ipynb`)

Self-contained notebook with 28 cells (10 markdown, 18 code) covering the entire model pipeline. Run top-to-bottom — all data is embedded, no external files required.

**Sections:**

| # | Section | What it does |
|---|---------|-------------|
| 1 | Global Assumptions | FX, carbon, coal, oil, JKM, shipping, demand breakdown |
| 2 | Norwegian Supply | Field-by-field production (Troll, Ormen Lange, Åsgard, etc.), maintenance deductions, decline curves |
| 3 | LNG Supply | 18 global liquefaction projects, Atlantic-Pacific arbitrage allocation, regasification utilisation |
| 4 | Pipeline & Indigenous | Russian, Algerian, Libyan, Azerbaijani routes + Dutch, UKCS, Romanian, biomethane production |
| 5 | Storage Dynamics | Monthly fill profiles, injection requirements, withdrawal deliverability, mandate targets |
| 6 | Supply Stack | Merit-order aggregation, supply-demand balance, implied TTF clearing price |
| 7 | Scenario Analysis | 10 risk scenarios with waterfall impacts and probability-weighted pricing |
| 8 | Sensitivity | Tornado chart of TTF price elasticity to each key driver |
| 9 | Executive Summary | Dashboard with price cards, mini supply stack, and key metrics |

**Dependencies:**

```
numpy
pandas
matplotlib
```

**Usage:**

```bash
pip install numpy pandas matplotlib
jupyter notebook TTF_Supply_Stack_Framework.ipynb
```

---

### 2. Excel Workbook (`TTF_Supply_Stack_Framework.xlsx`)

Seven-tab financial model with formula linkages. Blue cells are editable inputs; black cells are formulas. Follows industry-standard colour coding (blue = hardcoded input, black = formula, green = cross-sheet link).

**Tabs:**

| Tab | Purpose |
|-----|---------|
| Assumptions | Global macro/commodity parameters (EUR/USD, ETS, coal, oil, JKM, demand) |
| Norway Supply | Field production, maintenance, processing constraints, export pipeline allocation |
| LNG Supply | Global liquefaction projects, arbitrage model, European regasification terminals |
| Pipeline & Storage | Other pipeline routes, indigenous EU production, storage dynamics |
| Supply Stack | Merit-order aggregation, clearing price derivation, surplus/deficit |
| Scenarios | 10 risk scenarios with supply/demand/price impacts and probability weights |
| Data Sources | 16 required data feeds to operationalise in production |

**Usage:**

Open in Excel or LibreOffice. Change any blue input cell and formulas cascade automatically.

---

### 3. Python Engine (`ttf_supply_stack_model.py`)

Standalone calculation engine using Python dataclasses. No external dependencies beyond the standard library. Exports the full model state as JSON for consumption by any frontend.

**Key classes:**

| Class | Responsibility |
|-------|---------------|
| `GlobalAssumptions` | FX, commodity prices, demand forecasts |
| `NorwayModel` | Field-by-field production, maintenance, net deliverable supply |
| `LNGModel` | Global projects, arbitrage allocation, regasification constraints |
| `PipelineModel` | Russian, Algerian, Libyan, Azerbaijani pipeline routes |
| `IndigenousModel` | EU domestic production + biomethane |
| `StorageModel` | Inventory dynamics, fill targets, monthly profiles |
| `SupplyStackModel` | Merit-order aggregation, clearing price, scenario analysis |

**Usage:**

```python
from ttf_supply_stack_model import SupplyStackModel

model = SupplyStackModel()

# Access individual components
print(model.norway.net_supply())          # [80.0, 76.4, 72.8, 69.3, 65.8]
print(model.lng.max_deliverable_bcm())    # LNG deliverable to Europe
print(model.implied_ttf_price())          # [40.3, 38.5, 36.9, 35.3, 35.1]

# Export full state as JSON (for frontend or API)
json_str = model.to_json()

# Modify assumptions
model.assumptions.jkm = [14.0, 13.0, 12.0, 11.5, 11.0]  # Higher Asian demand
print(model.implied_ttf_price())  # Recalculates automatically
```

**CLI:**

```bash
python ttf_supply_stack_model.py > model_output.json
```

---

### 4. React Dashboard (`ttf_dashboard.jsx`)

Interactive 7-tab dashboard built with React and Recharts. Dark-themed, designed for energy trading desk aesthetics. Year selector (2025–2029) dynamically updates all charts.

**Tabs:**

| Tab | Charts |
|-----|--------|
| Supply Stack | Stacked bar (all sources), merit-order curve with cost overlay |
| Norway | Field production bars, gross vs net, decline rate cards |
| LNG | Global supply vs demand, country pie, regasification utilisation |
| Pipeline | Source breakdown, indigenous production, utilisation gauges |
| Storage | Monthly fill curves, inventory comparison, injection metrics |
| Scenarios | Waterfall impact chart, probability-weighted pricing grid |
| Price | Forward curve, cross-commodity comparison, year-on-year cards |

**Dependencies:**

```
react
recharts
```

**Usage:**

Drop the `.jsx` file into any React project, or render directly in Claude's artifact viewer. Model data is embedded — to connect live data, replace the `MODEL_DATA` constant with output from `ttf_supply_stack_model.py`.

---

## Model Architecture

```
Global Assumptions (FX, commodities, demand)
    │
    ├── Norwegian Pipeline Model
    │   ├── Field-by-field production (8 fields)
    │   ├── Maintenance deductions (planned + unplanned + processing)
    │   └── Net deliverable supply → Stack entry #1
    │
    ├── LNG Supply Model
    │   ├── Global liquefaction (18 projects, 9 countries)
    │   ├── Atlantic-Pacific arbitrage (TTF-JKM spread − shipping)
    │   ├── European regasification constraints (18 terminals)
    │   └── Max deliverable LNG to Europe → Stack entry #8
    │
    ├── Other Pipeline Model
    │   ├── Russian (TurkStream)
    │   ├── Algerian (Transmed + Medgaz)
    │   ├── Libyan (Greenstream)
    │   └── Azerbaijani (TAP/TANAP) → Stack entries #3–6
    │
    ├── Indigenous EU Model
    │   ├── Dutch small fields, UKCS, Romania, biomethane
    │   └── Total domestic production → Stack entry #2
    │
    └── Storage Model
        ├── Inventory levels, fill targets, injection demand
        ├── Withdrawal deliverability curves
        └── Winter withdrawal volumes → Stack entry #7
            │
            ▼
    ┌─────────────────────────────────────┐
    │     SUPPLY STACK (Merit Order)      │
    │  Sorted by marginal cost (EUR/MWh)  │
    │                                     │
    │  1. Norway        @ €6.0–6.8        │
    │  2. Indigenous EU  @ €8.0–10.0      │
    │  3. Russia         @ €20.0          │
    │  4. Algeria        @ €19.0–22.0     │
    │  5. Azerbaijan     @ €22.0–24.0     │
    │  6. Libya          @ €22.0          │
    │  7. Storage        @ €28.0–32.0     │
    │  8. LNG (marginal) @ €25.0–32.0    │
    │                                     │
    │  Σ Supply vs Demand → S/D Balance   │
    │  LNG marginal cost + adjustments    │
    │  → Implied TTF clearing price       │
    └─────────────────────────────────────┘
            │
            ▼
    Scenario Analysis (10 scenarios)
    Sensitivity Table (10 drivers)
    Probability-Weighted Pricing
```

---

## Key Model Assumptions

- **LNG is the marginal source.** The TTF clearing price is derived from the cost at which Europe attracts enough LNG cargoes to balance, adjusted for supply-demand tightness, carbon pass-through, and seasonality.
- **Norwegian supply is baseload.** Lowest marginal cost, most predictable, but subject to maintenance and decline.
- **Storage operates on opportunity cost.** Withdrawal is priced at the expected future value of stored gas, not its injection cost.
- **Demand is exogenous.** This is a supply-side model — demand is an input assumption, not endogenously modelled (though power sector demand responds to gas-coal switching, which is captured via the carbon and coal price assumptions).
- **All volumes are annual averages.** Monthly and seasonal granularity can be layered on top.

---

## Data Sources for Production Use

To move from illustrative assumptions to a live model, connect these feeds:

| Feed | Source | Frequency |
|------|--------|-----------|
| TTF & JKM futures | ICE / CME | Real-time |
| EU ETS carbon | ICE Endex | Real-time |
| Norwegian gas flows | Gassco / ENTSOG TP | Hourly |
| Norwegian maintenance | Gassco UMM (REMIT) | As published |
| EU storage levels | GIE AGSI+ | Daily |
| LNG cargo tracking | Kpler / Vortexa | Daily |
| European regas | GIE ALSI | Daily |
| Weather / HDD | ECMWF / DTN | Daily |
| Wind/solar forecasts | ENTSO-E TP | Hourly |
| Pipeline flows | ENTSOG TP | Hourly |
| Global LNG production | GIIGNL / S&P Global | Monthly |
| Shipping rates | Spark Commodities | Daily |
| FX rates | ECB | Daily |

---

## Extending the Model

**Monthly granularity:** Decompose annual volumes into monthly profiles using seasonal shaping factors (Norwegian maintenance calendar, storage injection/withdrawal cycles, heating demand curves).

**Stochastic modelling:** Replace point estimates with distributions — Monte Carlo simulation on weather, LNG arrivals, and outage probabilities to generate a price distribution rather than a single curve.

**Demand-side integration:** Add endogenous power sector switching (gas-to-coal as a function of clean spark vs clean dark spread), industrial demand response curves, and temperature-driven residential demand.

**Real-time updating:** Connect the Python engine to live data APIs and run on a scheduler (cron/Airflow) to produce an updated curve daily.

---

## Licence

This framework is provided as-is for analytical and educational purposes. All data is illustrative — verify against current market data before use in any trading or investment decision.
