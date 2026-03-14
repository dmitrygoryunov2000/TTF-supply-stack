"""
TTF Gas Supply Stack Curve — Quantitative Framework
====================================================
Core calculation engine for all supply-side drivers,
merit-order aggregation, and clearing price derivation.
"""

import json
from dataclasses import dataclass, field, asdict
from typing import Optional

YEARS = [2025, 2026, 2027, 2028, 2029]


# ─────────────────────────────────────────────
# DATA CLASSES
# ─────────────────────────────────────────────

@dataclass
class GlobalAssumptions:
    eur_usd: list = field(default_factory=lambda: [1.08, 1.10, 1.12, 1.12, 1.12])
    eu_ets_carbon: list = field(default_factory=lambda: [65, 72, 80, 88, 95])       # EUR/tCO2
    api2_coal: list = field(default_factory=lambda: [110, 105, 100, 95, 90])         # USD/t
    brent: list = field(default_factory=lambda: [78, 75, 72, 70, 70])               # USD/bbl
    jkm: list = field(default_factory=lambda: [12.5, 11.8, 11.0, 10.5, 10.0])       # USD/MMBtu
    ttf_jkm_spread_threshold: list = field(default_factory=lambda: [1.5]*5)          # USD/MMBtu
    shipping_us_eu: list = field(default_factory=lambda: [0.80, 0.80, 0.75, 0.75, 0.70])
    shipping_us_asia: list = field(default_factory=lambda: [2.20, 2.10, 2.00, 2.00, 1.90])
    storage_mandate_pct: list = field(default_factory=lambda: [0.90]*5)
    storage_working_capacity: list = field(default_factory=lambda: [110, 112, 114, 115, 115])
    total_demand: list = field(default_factory=lambda: [340, 335, 330, 325, 320])
    power_demand: list = field(default_factory=lambda: [95, 92, 88, 85, 82])
    industrial_demand: list = field(default_factory=lambda: [105, 103, 102, 100, 98])
    resi_commercial_demand: list = field(default_factory=lambda: [140]*5)


@dataclass
class NorwayField:
    name: str
    operator: str
    capacity: list  # bcm/yr for each year
    decline_rate: float
    notes: str = ""


@dataclass
class NorwayModel:
    fields: list = field(default_factory=lambda: [
        NorwayField("Troll", "Equinor", [36.0, 35.5, 35.0, 34.5, 34.0], 0.028, "Phase 3 extension"),
        NorwayField("Ormen Lange", "Shell", [14.0, 13.5, 13.0, 12.5, 12.0], 0.035, "Natural decline"),
        NorwayField("Åsgard", "Equinor", [7.5, 7.2, 6.9, 6.6, 6.3], 0.040, "Mature field"),
        NorwayField("Kristin", "Equinor", [3.5, 3.3, 3.1, 2.9, 2.7], 0.060, "Higher decline"),
        NorwayField("Kvitebjørn", "Equinor", [5.0, 4.8, 4.6, 4.4, 4.2], 0.040, "Steady decline"),
        NorwayField("Skarv", "Aker BP", [4.0, 3.8, 3.6, 3.4, 3.2], 0.050, "Moderate decline"),
        NorwayField("Gjøa", "Neptune", [2.5, 2.3, 2.1, 2.0, 1.9], 0.070, "Fast decline"),
        NorwayField("Other fields", "Various", [20.0, 19.0, 18.0, 17.0, 16.0], 0.050, "Aggregate tail"),
    ])
    planned_maintenance: list = field(default_factory=lambda: [8.0, 8.5, 9.0, 9.5, 10.0])
    unplanned_outage: list = field(default_factory=lambda: [3.0, 3.0, 3.0, 3.0, 3.0])
    processing_constraint: list = field(default_factory=lambda: [1.5, 1.5, 1.5, 1.5, 1.5])
    marginal_cost: list = field(default_factory=lambda: [6.0, 6.2, 6.4, 6.6, 6.8])  # EUR/MWh

    def gross_capacity(self) -> list:
        return [sum(f.capacity[i] for f in self.fields) for i in range(5)]

    def total_deductions(self) -> list:
        return [self.planned_maintenance[i] + self.unplanned_outage[i] + self.processing_constraint[i] for i in range(5)]

    def net_supply(self) -> list:
        gc = self.gross_capacity()
        td = self.total_deductions()
        return [gc[i] - td[i] for i in range(5)]


@dataclass
class LNGProject:
    name: str
    country: str
    status: str
    nameplate: float  # MTPA
    output: list      # MTPA per year
    notes: str = ""


@dataclass
class RegasTerminal:
    name: str
    country: str
    capacity: float       # bcm/yr
    utilisation: list     # % per year


@dataclass
class LNGModel:
    projects: list = field(default_factory=lambda: [
        LNGProject("Sabine Pass T1-6", "US", "Operating", 30.0, [28.5, 28.5, 28.5, 28.5, 28.5]),
        LNGProject("Cameron T1-3", "US", "Operating", 15.0, [13.5, 13.5, 13.5, 13.5, 13.5]),
        LNGProject("Freeport T1-3", "US", "Operating", 15.0, [13.5, 13.5, 13.5, 13.5, 13.5]),
        LNGProject("Corpus Christi S1-3 + SPL", "US", "Oper/Constr", 25.0, [20.0, 22.0, 25.0, 25.0, 25.0]),
        LNGProject("Plaquemines P1-P2", "US", "Construction", 20.0, [5.0, 12.0, 18.0, 20.0, 20.0]),
        LNGProject("Golden Pass T1-3", "US", "Construction", 18.0, [0.0, 4.0, 12.0, 16.0, 18.0]),
        LNGProject("Other US (FID wave)", "US", "Proposed", 25.0, [0.0, 0.0, 0.0, 5.0, 12.0]),
        LNGProject("Qatar NFE", "Qatar", "Construction", 32.0, [0.0, 8.0, 20.0, 32.0, 32.0]),
        LNGProject("Qatar NFS", "Qatar", "Construction", 16.0, [0.0, 0.0, 0.0, 4.0, 12.0]),
        LNGProject("Existing Qatar", "Qatar", "Operating", 77.0, [77.0, 77.0, 77.0, 77.0, 77.0]),
        LNGProject("Gorgon T1-3", "Australia", "Operating", 15.6, [14.0, 14.0, 13.5, 13.5, 13.0]),
        LNGProject("NW Shelf / Wheatstone / Ichthys", "Australia", "Operating", 40.0, [36.0, 35.5, 35.0, 34.5, 34.0]),
        LNGProject("Nigeria LNG T1-6 + T7", "Nigeria", "Oper/Constr", 30.0, [22.0, 22.0, 25.0, 28.0, 30.0]),
        LNGProject("Angola / Cameroon / EG", "W.Africa", "Operating", 10.0, [7.5, 7.5, 7.5, 7.5, 7.5]),
        LNGProject("Yamal + Arctic LNG 2", "Russia", "Sanctions", 36.5, [20.0, 22.0, 24.0, 26.0, 28.0]),
        LNGProject("Coral FLNG / Rovuma", "Mozambique", "Operating", 3.4, [3.4, 3.4, 3.4, 3.4, 5.0]),
        LNGProject("Greater Tortue FLNG", "Mauritania", "Commissioning", 2.5, [0.5, 2.0, 2.5, 2.5, 2.5]),
        LNGProject("Other (Trinidad, Peru etc)", "Various", "Operating", 25.0, [22.0, 22.0, 22.0, 22.0, 22.0]),
    ])
    global_demand_ex_europe: list = field(default_factory=lambda: [210, 230, 260, 290, 315])  # MTPA
    eu_regas_capacity: list = field(default_factory=lambda: [220, 230, 235, 240, 240])         # bcm/yr
    eu_regas_util_cap: list = field(default_factory=lambda: [0.85]*5)
    mtpa_to_bcm: float = 1.379
    marginal_cost: list = field(default_factory=lambda: [32.0, 30.0, 28.0, 26.0, 25.0])       # EUR/MWh

    regas_terminals: list = field(default_factory=lambda: [
        RegasTerminal("Gate Terminal", "NL", 16.0, [0.75, 0.78, 0.80, 0.80, 0.80]),
        RegasTerminal("Grain Isle", "UK", 19.5, [0.65, 0.68, 0.70, 0.72, 0.72]),
        RegasTerminal("Dunkerque", "FR", 13.0, [0.70, 0.72, 0.75, 0.75, 0.75]),
        RegasTerminal("Zeebrugge", "BE", 9.0, [0.60, 0.65, 0.68, 0.70, 0.70]),
        RegasTerminal("Montoir", "FR", 10.0, [0.55, 0.58, 0.60, 0.62, 0.62]),
        RegasTerminal("Spain (aggregate)", "ES", 60.0, [0.40, 0.42, 0.45, 0.48, 0.50]),
        RegasTerminal("Sines / Figueira", "PT", 7.6, [0.55, 0.58, 0.60, 0.62, 0.65]),
        RegasTerminal("Italy (aggregate)", "IT", 28.0, [0.50, 0.55, 0.58, 0.60, 0.62]),
        RegasTerminal("Wilhelmshaven", "DE", 13.5, [0.60, 0.70, 0.75, 0.80, 0.85]),
        RegasTerminal("Brunsbüttel", "DE", 5.0, [0.50, 0.60, 0.70, 0.75, 0.80]),
        RegasTerminal("Lubmin", "DE", 5.3, [0.40, 0.50, 0.55, 0.60, 0.60]),
        RegasTerminal("Eemshaven", "NL", 8.0, [0.55, 0.60, 0.65, 0.68, 0.70]),
        RegasTerminal("Świnoujście", "PL", 8.3, [0.80, 0.82, 0.85, 0.85, 0.85]),
        RegasTerminal("Alexandroupolis", "GR", 5.5, [0.30, 0.50, 0.60, 0.65, 0.70]),
        RegasTerminal("Inkoo", "FI", 4.0, [0.40, 0.50, 0.55, 0.60, 0.60]),
        RegasTerminal("Klaipėda", "LT", 4.0, [0.70, 0.72, 0.75, 0.75, 0.75]),
        RegasTerminal("Krk", "HR", 2.9, [0.80, 0.82, 0.85, 0.85, 0.85]),
        RegasTerminal("Other / Expansion", "Various", 10.0, [0.20, 0.30, 0.40, 0.50, 0.55]),
    ])

    def total_global_supply(self) -> list:
        return [sum(p.output[i] for p in self.projects) for i in range(5)]

    def available_for_europe_mtpa(self) -> list:
        gs = self.total_global_supply()
        return [max(0, gs[i] - self.global_demand_ex_europe[i]) for i in range(5)]

    def available_for_europe_bcm(self) -> list:
        return [v * self.mtpa_to_bcm for v in self.available_for_europe_mtpa()]

    def max_deliverable_bcm(self) -> list:
        avail = self.available_for_europe_bcm()
        max_regas = [self.eu_regas_capacity[i] * self.eu_regas_util_cap[i] for i in range(5)]
        return [min(avail[i], max_regas[i]) for i in range(5)]

    def regas_utilisation_by_terminal(self, year_idx: int) -> list:
        return [
            {"name": t.name, "country": t.country, "capacity": t.capacity,
             "utilisation": t.utilisation[year_idx],
             "throughput": t.capacity * t.utilisation[year_idx]}
            for t in self.regas_terminals
        ]

    def supply_by_country(self) -> dict:
        countries = {}
        for p in self.projects:
            if p.country not in countries:
                countries[p.country] = [0.0]*5
            for i in range(5):
                countries[p.country][i] += p.output[i]
        return countries


@dataclass
class PipelineRoute:
    name: str
    source: str
    via: str
    capacity: float
    volumes: list
    notes: str = ""


@dataclass
class IndigenousSource:
    name: str
    country: str
    volumes: list
    notes: str = ""


@dataclass
class PipelineModel:
    routes: list = field(default_factory=lambda: [
        PipelineRoute("TurkStream", "Russia", "Turkey → SEE", 15.75, [12.0, 10.0, 8.0, 6.0, 5.0], "Gradual decline"),
        PipelineRoute("Ukraine Transit", "Russia", "Ukraine → CEE", 15.0, [0.0, 0.0, 0.0, 0.0, 0.0], "Expired Dec 2024"),
        PipelineRoute("Transmed", "Algeria", "Tunisia → Italy", 33.5, [22.0, 21.0, 20.0, 19.0, 18.0]),
        PipelineRoute("Medgaz", "Algeria", "Direct → Spain", 10.5, [8.0, 8.0, 8.0, 7.5, 7.5]),
        PipelineRoute("Greenstream", "Libya", "Direct → Italy", 11.0, [3.0, 3.0, 3.0, 3.0, 3.0], "Political risk"),
        PipelineRoute("TAP/TANAP", "Azerbaijan", "Turkey → IT/GR", 10.0, [10.0, 10.0, 10.0, 10.0, 12.0], "Expansion post-2028"),
    ])
    marginal_costs: dict = field(default_factory=lambda: {
        "Algeria": [22.0, 21.0, 20.0, 19.5, 19.0],
        "Azerbaijan": [24.0, 23.5, 23.0, 22.5, 22.0],
        "Russia": [20.0]*5,
        "Libya": [22.0]*5,
    })

    def total_volumes(self) -> list:
        return [sum(r.volumes[i] for r in self.routes) for i in range(5)]

    def volumes_by_source(self) -> dict:
        sources = {}
        for r in self.routes:
            if r.source not in sources:
                sources[r.source] = [0.0]*5
            for i in range(5):
                sources[r.source][i] += r.volumes[i]
        return sources


@dataclass
class IndigenousModel:
    sources: list = field(default_factory=lambda: [
        IndigenousSource("Dutch small fields", "NL", [4.5, 3.8, 3.2, 2.7, 2.3]),
        IndigenousSource("UKCS", "UK", [35.0, 33.0, 31.0, 29.0, 27.0]),
        IndigenousSource("Romania (inc Neptun Deep)", "RO", [5.5, 5.5, 5.5, 8.0, 10.0]),
        IndigenousSource("Denmark / Poland / Other", "Various", [3.0, 2.8, 2.6, 2.4, 2.2]),
        IndigenousSource("Biomethane / RNG", "EU-wide", [3.5, 4.5, 5.5, 7.0, 9.0]),
    ])
    marginal_cost: list = field(default_factory=lambda: [8.0, 8.5, 9.0, 9.5, 10.0])

    def total_volumes(self) -> list:
        return [sum(s.volumes[i] for s in self.sources) for i in range(5)]


@dataclass
class StorageModel:
    working_capacity: list = field(default_factory=lambda: [110, 112, 114, 115, 115])
    start_inventory: list = field(default_factory=lambda: [75, 70, 68, 66, 65])
    mandate_pct: list = field(default_factory=lambda: [0.90]*5)
    winter_withdrawal: list = field(default_factory=lambda: [55, 54, 53, 52, 51])
    max_withdrawal_90pct: list = field(default_factory=lambda: [1800, 1850, 1900, 1920, 1950])  # mcm/d
    max_withdrawal_30pct: list = field(default_factory=lambda: [900, 920, 940, 950, 960])
    marginal_cost: list = field(default_factory=lambda: [28.0, 29.0, 30.0, 31.0, 32.0])  # opportunity cost

    def target_inventory(self) -> list:
        return [self.working_capacity[i] * self.mandate_pct[i] for i in range(5)]

    def required_injection(self) -> list:
        ti = self.target_inventory()
        return [ti[i] - self.start_inventory[i] for i in range(5)]

    def end_winter_inventory(self) -> list:
        ti = self.target_inventory()
        return [ti[i] - self.winter_withdrawal[i] for i in range(5)]

    def fill_percentage_monthly(self, year_idx: int) -> list:
        """Simplified monthly storage profile for charting."""
        start = self.start_inventory[year_idx]
        target = self.target_inventory()[year_idx]
        withdrawal = self.winter_withdrawal[year_idx]
        cap = self.working_capacity[year_idx]
        # Simplified: withdraw Jan-Mar, inject Apr-Oct, withdraw Nov-Dec
        monthly = []
        level = start
        for m in range(12):
            if m < 3:  # Jan-Mar: withdraw
                level -= withdrawal * 0.25 / 3 * 2  # heavier early winter
            elif m < 10:  # Apr-Oct: inject
                injection_needed = target - level
                level += injection_needed / (10 - m) if m < 10 else 0
                level = min(level, cap)
            else:  # Nov-Dec: withdraw
                level -= withdrawal * 0.15
            monthly.append(round(max(0, min(level, cap)), 1))
        return monthly


# ─────────────────────────────────────────────
# SUPPLY STACK AGGREGATION
# ─────────────────────────────────────────────

@dataclass
class SupplyStackEntry:
    name: str
    volumes: list       # bcm/yr
    marginal_cost: list # EUR/MWh
    color: str = "#888"


class SupplyStackModel:
    def __init__(self, assumptions=None):
        self.assumptions = assumptions or GlobalAssumptions()
        self.norway = NorwayModel()
        self.lng = LNGModel()
        self.pipeline = PipelineModel()
        self.indigenous = IndigenousModel()
        self.storage = StorageModel()

    def build_stack(self) -> list:
        """Build merit-order supply stack sorted by marginal cost."""
        pipe_by_source = self.pipeline.volumes_by_source()
        algeria_vols = [pipe_by_source.get("Algeria", [0]*5)[i] for i in range(5)]
        azerbaijan_vols = [pipe_by_source.get("Azerbaijan", [0]*5)[i] for i in range(5)]
        russia_vols = [pipe_by_source.get("Russia", [0]*5)[i] for i in range(5)]
        libya_vols = [pipe_by_source.get("Libya", [0]*5)[i] for i in range(5)]

        stack = [
            SupplyStackEntry("Norwegian Pipeline", self.norway.net_supply(), self.norway.marginal_cost, "#2E75B6"),
            SupplyStackEntry("Indigenous EU", self.indigenous.total_volumes(), self.indigenous.marginal_cost, "#70AD47"),
            SupplyStackEntry("Russian Pipeline", russia_vols, self.pipeline.marginal_costs["Russia"], "#BF0000"),
            SupplyStackEntry("Algerian Pipeline", algeria_vols, self.pipeline.marginal_costs["Algeria"], "#ED7D31"),
            SupplyStackEntry("Azerbaijani Pipeline", azerbaijan_vols, self.pipeline.marginal_costs["Azerbaijan"], "#FFC000"),
            SupplyStackEntry("Libyan Pipeline", libya_vols, self.pipeline.marginal_costs["Libya"], "#A5A5A5"),
            SupplyStackEntry("Storage Withdrawal", self.storage.winter_withdrawal, self.storage.marginal_cost, "#7030A0"),
            SupplyStackEntry("LNG (Marginal)", self.lng.max_deliverable_bcm(), self.lng.marginal_cost, "#00B0F0"),
        ]
        # Sort by marginal cost for each year (use year 0 for default ordering)
        stack.sort(key=lambda s: s.marginal_cost[0])
        return stack

    def total_supply(self, year_idx: int) -> float:
        return sum(s.volumes[year_idx] for s in self.build_stack())

    def surplus_deficit(self) -> list:
        stack = self.build_stack()
        return [
            sum(s.volumes[i] for s in stack) - self.assumptions.total_demand[i]
            for i in range(5)
        ]

    def implied_ttf_price(self) -> list:
        """Implied clearing price: LNG marginal cost + adjustments."""
        sd = self.surplus_deficit()
        result = []
        for i in range(5):
            lng_mc = self.lng.marginal_cost[i]
            sd_adj = -sd[i] * 0.15  # tighter = premium
            carbon = self.assumptions.eu_ets_carbon[i] * 0.055  # pass-through
            seasonality = 5.0  # flat winter premium assumption
            result.append(round(lng_mc + sd_adj + carbon + seasonality, 1))
        return result

    def implied_ttf_usd_mmbtu(self) -> list:
        eur_mwh = self.implied_ttf_price()
        return [round(eur_mwh[i] * 0.293 * self.assumptions.eur_usd[i], 2) for i in range(5)]

    def stack_chart_data(self, year_idx: int) -> list:
        """Return data formatted for a stacked bar / merit order chart."""
        stack = self.build_stack()
        cumulative = 0
        data = []
        for s in stack:
            vol = s.volumes[year_idx]
            data.append({
                "name": s.name,
                "volume": round(vol, 1),
                "cumulative_start": round(cumulative, 1),
                "cumulative_end": round(cumulative + vol, 1),
                "marginal_cost": s.marginal_cost[year_idx],
                "color": s.color,
            })
            cumulative += vol
        return data

    def to_json(self) -> str:
        """Export full model state as JSON for the frontend."""
        stack = self.build_stack()
        return json.dumps({
            "years": YEARS,
            "assumptions": asdict(self.assumptions),
            "norway": {
                "fields": [{"name": f.name, "operator": f.operator, "capacity": f.capacity,
                             "decline_rate": f.decline_rate} for f in self.norway.fields],
                "gross_capacity": self.norway.gross_capacity(),
                "total_deductions": self.norway.total_deductions(),
                "net_supply": self.norway.net_supply(),
                "planned_maintenance": self.norway.planned_maintenance,
                "unplanned_outage": self.norway.unplanned_outage,
                "processing_constraint": self.norway.processing_constraint,
            },
            "lng": {
                "projects": [{"name": p.name, "country": p.country, "status": p.status,
                               "nameplate": p.nameplate, "output": p.output}
                              for p in self.lng.projects],
                "total_global_supply": self.lng.total_global_supply(),
                "global_demand_ex_europe": self.lng.global_demand_ex_europe,
                "available_for_europe_bcm": self.lng.available_for_europe_bcm(),
                "max_deliverable_bcm": self.lng.max_deliverable_bcm(),
                "supply_by_country": self.lng.supply_by_country(),
                "regas_terminals": [
                    {"name": t.name, "country": t.country, "capacity": t.capacity,
                     "utilisation": t.utilisation}
                    for t in self.lng.regas_terminals
                ],
            },
            "pipeline": {
                "routes": [{"name": r.name, "source": r.source, "via": r.via,
                             "capacity": r.capacity, "volumes": r.volumes}
                            for r in self.pipeline.routes],
                "total_volumes": self.pipeline.total_volumes(),
                "volumes_by_source": self.pipeline.volumes_by_source(),
            },
            "indigenous": {
                "sources": [{"name": s.name, "country": s.country, "volumes": s.volumes}
                             for s in self.indigenous.sources],
                "total_volumes": self.indigenous.total_volumes(),
            },
            "storage": {
                "working_capacity": self.storage.working_capacity,
                "start_inventory": self.storage.start_inventory,
                "target_inventory": self.storage.target_inventory(),
                "required_injection": self.storage.required_injection(),
                "winter_withdrawal": self.storage.winter_withdrawal,
                "end_winter_inventory": self.storage.end_winter_inventory(),
                "monthly_profile": [self.storage.fill_percentage_monthly(i) for i in range(5)],
            },
            "supply_stack": {
                "entries": [{"name": s.name, "volumes": s.volumes,
                              "marginal_cost": s.marginal_cost, "color": s.color}
                             for s in stack],
                "total_supply": [self.total_supply(i) for i in range(5)],
                "total_demand": self.assumptions.total_demand,
                "surplus_deficit": self.surplus_deficit(),
                "implied_ttf_eur_mwh": self.implied_ttf_price(),
                "implied_ttf_usd_mmbtu": self.implied_ttf_usd_mmbtu(),
                "stack_chart": [self.stack_chart_data(i) for i in range(5)],
            },
            "scenarios": [
                {"name": "Base Case", "supply_impact": 0, "demand_impact": 0, "ttf_impact": 0, "probability": 0.35},
                {"name": "Cold Winter", "supply_impact": 0, "demand_impact": 25, "ttf_impact": 8, "probability": 0.10},
                {"name": "Mild Winter", "supply_impact": 0, "demand_impact": -20, "ttf_impact": -6, "probability": 0.10},
                {"name": "Full Russian Cutoff", "supply_impact": -12, "demand_impact": 0, "ttf_impact": 12, "probability": 0.07},
                {"name": "Asian LNG Surge", "supply_impact": -20, "demand_impact": 0, "ttf_impact": 10, "probability": 0.07},
                {"name": "Major Norway Outage", "supply_impact": -6, "demand_impact": 0, "ttf_impact": 15, "probability": 0.03},
                {"name": "Accelerated Renewables", "supply_impact": 0, "demand_impact": -12, "ttf_impact": -4, "probability": 0.07},
                {"name": "US LNG Disruption", "supply_impact": -8, "demand_impact": 0, "ttf_impact": 8, "probability": 0.05},
                {"name": "Qatar NFE Delay", "supply_impact": -20, "demand_impact": 0, "ttf_impact": 5, "probability": 0.10},
                {"name": "Industrial Recovery", "supply_impact": 0, "demand_impact": 15, "ttf_impact": 6, "probability": 0.06},
            ],
        }, indent=2)


if __name__ == "__main__":
    model = SupplyStackModel()
    print(model.to_json())
