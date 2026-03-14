import { useState, useMemo, useEffect, useRef } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, LineChart, Line, PieChart, Pie, Cell, ComposedChart, ReferenceLine } from "recharts";

const MODEL_DATA = {"years":[2025,2026,2027,2028,2029],"assumptions":{"eur_usd":[1.08,1.1,1.12,1.12,1.12],"eu_ets_carbon":[65,72,80,88,95],"api2_coal":[110,105,100,95,90],"brent":[78,75,72,70,70],"jkm":[12.5,11.8,11.0,10.5,10.0],"ttf_jkm_spread_threshold":[1.5,1.5,1.5,1.5,1.5],"shipping_us_eu":[0.8,0.8,0.75,0.75,0.7],"shipping_us_asia":[2.2,2.1,2.0,2.0,1.9],"storage_mandate_pct":[0.9,0.9,0.9,0.9,0.9],"storage_working_capacity":[110,112,114,115,115],"total_demand":[340,335,330,325,320],"power_demand":[95,92,88,85,82],"industrial_demand":[105,103,102,100,98],"resi_commercial_demand":[140,140,140,140,140]},"norway":{"fields":[{"name":"Troll","operator":"Equinor","capacity":[36.0,35.5,35.0,34.5,34.0],"decline_rate":0.028},{"name":"Ormen Lange","operator":"Shell","capacity":[14.0,13.5,13.0,12.5,12.0],"decline_rate":0.035},{"name":"Åsgard","operator":"Equinor","capacity":[7.5,7.2,6.9,6.6,6.3],"decline_rate":0.04},{"name":"Kristin","operator":"Equinor","capacity":[3.5,3.3,3.1,2.9,2.7],"decline_rate":0.06},{"name":"Kvitebjørn","operator":"Equinor","capacity":[5.0,4.8,4.6,4.4,4.2],"decline_rate":0.04},{"name":"Skarv","operator":"Aker BP","capacity":[4.0,3.8,3.6,3.4,3.2],"decline_rate":0.05},{"name":"Gjøa","operator":"Neptune","capacity":[2.5,2.3,2.1,2.0,1.9],"decline_rate":0.07},{"name":"Other fields","operator":"Various","capacity":[20.0,19.0,18.0,17.0,16.0],"decline_rate":0.05}],"gross_capacity":[92.5,89.4,86.3,83.3,80.3],"total_deductions":[12.5,13.0,13.5,14.0,14.5],"net_supply":[80.0,76.4,72.8,69.3,65.8],"planned_maintenance":[8.0,8.5,9.0,9.5,10.0],"unplanned_outage":[3.0,3.0,3.0,3.0,3.0],"processing_constraint":[1.5,1.5,1.5,1.5,1.5]},"lng":{"projects":[{"name":"Sabine Pass T1-6","country":"US","status":"Operating","nameplate":30.0,"output":[28.5,28.5,28.5,28.5,28.5]},{"name":"Cameron T1-3","country":"US","status":"Operating","nameplate":15.0,"output":[13.5,13.5,13.5,13.5,13.5]},{"name":"Freeport T1-3","country":"US","status":"Operating","nameplate":15.0,"output":[13.5,13.5,13.5,13.5,13.5]},{"name":"Corpus Christi S1-3 + SPL","country":"US","status":"Oper/Constr","nameplate":25.0,"output":[20.0,22.0,25.0,25.0,25.0]},{"name":"Plaquemines P1-P2","country":"US","status":"Construction","nameplate":20.0,"output":[5.0,12.0,18.0,20.0,20.0]},{"name":"Golden Pass T1-3","country":"US","status":"Construction","nameplate":18.0,"output":[0.0,4.0,12.0,16.0,18.0]},{"name":"Other US (FID wave)","country":"US","status":"Proposed","nameplate":25.0,"output":[0.0,0.0,0.0,5.0,12.0]},{"name":"Qatar NFE","country":"Qatar","status":"Construction","nameplate":32.0,"output":[0.0,8.0,20.0,32.0,32.0]},{"name":"Qatar NFS","country":"Qatar","status":"Construction","nameplate":16.0,"output":[0.0,0.0,0.0,4.0,12.0]},{"name":"Existing Qatar","country":"Qatar","status":"Operating","nameplate":77.0,"output":[77.0,77.0,77.0,77.0,77.0]},{"name":"Gorgon T1-3","country":"Australia","status":"Operating","nameplate":15.6,"output":[14.0,14.0,13.5,13.5,13.0]},{"name":"NW Shelf / Wheatstone / Ichthys","country":"Australia","status":"Operating","nameplate":40.0,"output":[36.0,35.5,35.0,34.5,34.0]},{"name":"Nigeria LNG T1-6 + T7","country":"Nigeria","status":"Oper/Constr","nameplate":30.0,"output":[22.0,22.0,25.0,28.0,30.0]},{"name":"Angola / Cameroon / EG","country":"W.Africa","status":"Operating","nameplate":10.0,"output":[7.5,7.5,7.5,7.5,7.5]},{"name":"Yamal + Arctic LNG 2","country":"Russia","status":"Sanctions","nameplate":36.5,"output":[20.0,22.0,24.0,26.0,28.0]},{"name":"Coral FLNG / Rovuma","country":"Mozambique","status":"Operating","nameplate":3.4,"output":[3.4,3.4,3.4,3.4,5.0]},{"name":"Greater Tortue FLNG","country":"Mauritania","status":"Commissioning","nameplate":2.5,"output":[0.5,2.0,2.5,2.5,2.5]},{"name":"Other (Trinidad, Peru etc)","country":"Various","status":"Operating","nameplate":25.0,"output":[22.0,22.0,22.0,22.0,22.0]}],"total_global_supply":[282.9,306.9,340.4,371.9,393.5],"global_demand_ex_europe":[210,230,260,290,315],"available_for_europe_bcm":[100.53,106.05,110.87,112.94,108.25],"max_deliverable_bcm":[100.53,106.05,110.87,112.94,108.25],"supply_by_country":{"US":[80.5,93.5,110.5,121.5,130.5],"Qatar":[77.0,85.0,97.0,113.0,121.0],"Australia":[50.0,49.5,48.5,48.0,47.0],"Nigeria":[22.0,22.0,25.0,28.0,30.0],"W.Africa":[7.5,7.5,7.5,7.5,7.5],"Russia":[20.0,22.0,24.0,26.0,28.0],"Mozambique":[3.4,3.4,3.4,3.4,5.0],"Mauritania":[0.5,2.0,2.5,2.5,2.5],"Various":[22.0,22.0,22.0,22.0,22.0]},"regas_terminals":[{"name":"Gate Terminal","country":"NL","capacity":16.0,"utilisation":[0.75,0.78,0.8,0.8,0.8]},{"name":"Grain Isle","country":"UK","capacity":19.5,"utilisation":[0.65,0.68,0.7,0.72,0.72]},{"name":"Dunkerque","country":"FR","capacity":13.0,"utilisation":[0.7,0.72,0.75,0.75,0.75]},{"name":"Zeebrugge","country":"BE","capacity":9.0,"utilisation":[0.6,0.65,0.68,0.7,0.7]},{"name":"Montoir","country":"FR","capacity":10.0,"utilisation":[0.55,0.58,0.6,0.62,0.62]},{"name":"Spain (aggregate)","country":"ES","capacity":60.0,"utilisation":[0.4,0.42,0.45,0.48,0.5]},{"name":"Sines / Figueira","country":"PT","capacity":7.6,"utilisation":[0.55,0.58,0.6,0.62,0.65]},{"name":"Italy (aggregate)","country":"IT","capacity":28.0,"utilisation":[0.5,0.55,0.58,0.6,0.62]},{"name":"Wilhelmshaven","country":"DE","capacity":13.5,"utilisation":[0.6,0.7,0.75,0.8,0.85]},{"name":"Brunsbüttel","country":"DE","capacity":5.0,"utilisation":[0.5,0.6,0.7,0.75,0.8]},{"name":"Lubmin","country":"DE","capacity":5.3,"utilisation":[0.4,0.5,0.55,0.6,0.6]},{"name":"Eemshaven","country":"NL","capacity":8.0,"utilisation":[0.55,0.6,0.65,0.68,0.7]},{"name":"Świnoujście","country":"PL","capacity":8.3,"utilisation":[0.8,0.82,0.85,0.85,0.85]},{"name":"Alexandroupolis","country":"GR","capacity":5.5,"utilisation":[0.3,0.5,0.6,0.65,0.7]},{"name":"Inkoo","country":"FI","capacity":4.0,"utilisation":[0.4,0.5,0.55,0.6,0.6]},{"name":"Klaipėda","country":"LT","capacity":4.0,"utilisation":[0.7,0.72,0.75,0.75,0.75]},{"name":"Krk","country":"HR","capacity":2.9,"utilisation":[0.8,0.82,0.85,0.85,0.85]},{"name":"Other / Expansion","country":"Various","capacity":10.0,"utilisation":[0.2,0.3,0.4,0.5,0.55]}]},"pipeline":{"routes":[{"name":"TurkStream","source":"Russia","via":"Turkey → SEE","capacity":15.75,"volumes":[12.0,10.0,8.0,6.0,5.0]},{"name":"Ukraine Transit","source":"Russia","via":"Ukraine → CEE","capacity":15.0,"volumes":[0.0,0.0,0.0,0.0,0.0]},{"name":"Transmed","source":"Algeria","via":"Tunisia → Italy","capacity":33.5,"volumes":[22.0,21.0,20.0,19.0,18.0]},{"name":"Medgaz","source":"Algeria","via":"Direct → Spain","capacity":10.5,"volumes":[8.0,8.0,8.0,7.5,7.5]},{"name":"Greenstream","source":"Libya","via":"Direct → Italy","capacity":11.0,"volumes":[3.0,3.0,3.0,3.0,3.0]},{"name":"TAP/TANAP","source":"Azerbaijan","via":"Turkey → IT/GR","capacity":10.0,"volumes":[10.0,10.0,10.0,10.0,12.0]}],"total_volumes":[55.0,52.0,49.0,45.5,45.5],"volumes_by_source":{"Russia":[12.0,10.0,8.0,6.0,5.0],"Algeria":[30.0,29.0,28.0,26.5,25.5],"Libya":[3.0,3.0,3.0,3.0,3.0],"Azerbaijan":[10.0,10.0,10.0,10.0,12.0]}},"indigenous":{"sources":[{"name":"Dutch small fields","country":"NL","volumes":[4.5,3.8,3.2,2.7,2.3]},{"name":"UKCS","country":"UK","volumes":[35.0,33.0,31.0,29.0,27.0]},{"name":"Romania (inc Neptun Deep)","country":"RO","volumes":[5.5,5.5,5.5,8.0,10.0]},{"name":"Denmark / Poland / Other","country":"Various","volumes":[3.0,2.8,2.6,2.4,2.2]},{"name":"Biomethane / RNG","country":"EU-wide","volumes":[3.5,4.5,5.5,7.0,9.0]}],"total_volumes":[51.5,49.6,47.8,49.1,50.5]},"storage":{"working_capacity":[110,112,114,115,115],"start_inventory":[75,70,68,66,65],"target_inventory":[99.0,100.8,102.6,103.5,103.5],"required_injection":[24.0,30.8,34.6,37.5,38.5],"winter_withdrawal":[55,54,53,52,51],"end_winter_inventory":[44.0,46.8,49.6,51.5,52.5],"monthly_profile":[[65.8,56.7,47.5,54.9,62.2,69.6,76.9,84.3,91.6,99.0,90.8,82.5],[61.0,52.0,43.0,51.3,59.5,67.8,76.0,84.3,92.5,100.8,92.7,84.6],[59.2,50.3,41.5,50.2,59.0,67.7,76.4,85.1,93.9,102.6,94.7,86.7],[57.3,48.7,40.0,49.1,58.1,67.2,76.3,85.4,94.4,103.5,95.7,87.9],[56.5,48.0,39.5,48.6,57.8,66.9,76.1,85.2,94.4,103.5,95.8,88.2]]},"supply_stack":{"entries":[{"name":"Norwegian Pipeline","volumes":[80.0,76.4,72.8,69.3,65.8],"marginal_cost":[6.0,6.2,6.4,6.6,6.8],"color":"#2E75B6"},{"name":"Indigenous EU","volumes":[51.5,49.6,47.8,49.1,50.5],"marginal_cost":[8.0,8.5,9.0,9.5,10.0],"color":"#70AD47"},{"name":"Russian Pipeline","volumes":[12.0,10.0,8.0,6.0,5.0],"marginal_cost":[20.0,20.0,20.0,20.0,20.0],"color":"#BF0000"},{"name":"Algerian Pipeline","volumes":[30.0,29.0,28.0,26.5,25.5],"marginal_cost":[22.0,21.0,20.0,19.5,19.0],"color":"#ED7D31"},{"name":"Libyan Pipeline","volumes":[3.0,3.0,3.0,3.0,3.0],"marginal_cost":[22.0,22.0,22.0,22.0,22.0],"color":"#A5A5A5"},{"name":"Azerbaijani Pipeline","volumes":[10.0,10.0,10.0,10.0,12.0],"marginal_cost":[24.0,23.5,23.0,22.5,22.0],"color":"#FFC000"},{"name":"Storage Withdrawal","volumes":[55,54,53,52,51],"marginal_cost":[28.0,29.0,30.0,31.0,32.0],"color":"#7030A0"},{"name":"LNG (Marginal)","volumes":[100.53,106.05,110.87,112.94,108.25],"marginal_cost":[32.0,30.0,28.0,26.0,25.0],"color":"#00B0F0"}],"total_supply":[342.03,338.05,333.47,328.84,321.05],"total_demand":[340,335,330,325,320],"surplus_deficit":[2.03,3.05,3.47,3.84,1.05],"implied_ttf_eur_mwh":[40.3,38.5,36.9,35.3,35.1],"implied_ttf_usd_mmbtu":[12.75,12.41,12.11,11.58,11.52],"stack_chart":[]},"scenarios":[{"name":"Base Case","supply_impact":0,"demand_impact":0,"ttf_impact":0,"probability":0.35},{"name":"Cold Winter","supply_impact":0,"demand_impact":25,"ttf_impact":8,"probability":0.10},{"name":"Mild Winter","supply_impact":0,"demand_impact":-20,"ttf_impact":-6,"probability":0.10},{"name":"Full Russian Cutoff","supply_impact":-12,"demand_impact":0,"ttf_impact":12,"probability":0.07},{"name":"Asian LNG Surge","supply_impact":-20,"demand_impact":0,"ttf_impact":10,"probability":0.07},{"name":"Major Norway Outage","supply_impact":-6,"demand_impact":0,"ttf_impact":15,"probability":0.03},{"name":"Accelerated Renewables","supply_impact":0,"demand_impact":-12,"ttf_impact":-4,"probability":0.07},{"name":"US LNG Disruption","supply_impact":-8,"demand_impact":0,"ttf_impact":8,"probability":0.05},{"name":"Qatar NFE Delay","supply_impact":-20,"demand_impact":0,"ttf_impact":5,"probability":0.10},{"name":"Industrial Recovery","supply_impact":0,"demand_impact":15,"ttf_impact":6,"probability":0.06}]};

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const TABS = ["Supply Stack","Norway","LNG","Pipeline","Storage","Scenarios","Price"];

const fmt = (n, d=1) => typeof n === "number" ? n.toFixed(d) : n;
const fmtInt = (n) => typeof n === "number" ? Math.round(n).toLocaleString() : n;

const CustomTooltip = ({ active, payload, label, unit="" }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{background:"#1a1a2e",border:"1px solid #333",borderRadius:6,padding:"10px 14px",fontSize:12,color:"#e0e0e0",boxShadow:"0 4px 20px rgba(0,0,0,0.5)"}}>
      <div style={{fontWeight:700,marginBottom:6,color:"#fff",borderBottom:"1px solid #333",paddingBottom:4}}>{label}</div>
      {payload.map((p,i) => (
        <div key={i} style={{display:"flex",alignItems:"center",gap:6,marginBottom:2}}>
          <span style={{width:8,height:8,borderRadius:2,background:p.color,display:"inline-block",flexShrink:0}}/>
          <span style={{flex:1}}>{p.name || p.dataKey}</span>
          <span style={{fontWeight:600,fontVariantNumeric:"tabular-nums"}}>{fmt(p.value)} {unit}</span>
        </div>
      ))}
    </div>
  );
};

function SupplyStackView({ data, yearIdx }) {
  const year = data.years[yearIdx];
  const entries = data.supply_stack.entries;
  const stackData = data.years.map((y,i) => {
    const row = { year: y.toString() };
    entries.forEach(e => { row[e.name] = e.volumes[i]; });
    row.demand = data.supply_stack.total_demand[i];
    return row;
  });
  const meritData = [];
  let cum = 0;
  entries.forEach(e => {
    const vol = e.volumes[yearIdx];
    if (vol > 0) {
      meritData.push({ name: e.name, volume: vol, start: cum, cost: e.marginal_cost[yearIdx], color: e.color });
      cum += vol;
    }
  });
  return (
    <div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:24}}>
        <div>
          <h3 style={{margin:"0 0 12px",fontSize:13,fontWeight:600,letterSpacing:1,textTransform:"uppercase",color:"#8892b0"}}>Supply Stack by Source — All Years</h3>
          <ResponsiveContainer width="100%" height={340}>
            <ComposedChart data={stackData} margin={{top:10,right:10,left:0,bottom:5}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2a3a" />
              <XAxis dataKey="year" tick={{fill:"#8892b0",fontSize:11}} />
              <YAxis tick={{fill:"#8892b0",fontSize:11}} label={{value:"bcm/yr",angle:-90,position:"insideLeft",fill:"#8892b0",fontSize:11}} />
              <Tooltip content={<CustomTooltip unit="bcm" />} />
              {entries.map(e => <Bar key={e.name} dataKey={e.name} stackId="a" fill={e.color} />)}
              <Line dataKey="demand" stroke="#ff4444" strokeWidth={2} dot={{r:4}} type="monotone" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <div>
          <h3 style={{margin:"0 0 12px",fontSize:13,fontWeight:600,letterSpacing:1,textTransform:"uppercase",color:"#8892b0"}}>Merit Order Curve — {year}</h3>
          <ResponsiveContainer width="100%" height={340}>
            <ComposedChart data={meritData} margin={{top:10,right:10,left:0,bottom:5}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2a3a" />
              <XAxis dataKey="name" tick={{fill:"#8892b0",fontSize:9}} angle={-20} textAnchor="end" height={60} />
              <YAxis yAxisId="vol" orientation="left" tick={{fill:"#8892b0",fontSize:11}} label={{value:"bcm",angle:-90,position:"insideLeft",fill:"#8892b0",fontSize:11}} />
              <YAxis yAxisId="cost" orientation="right" tick={{fill:"#ff9f43",fontSize:11}} label={{value:"EUR/MWh",angle:90,position:"insideRight",fill:"#ff9f43",fontSize:11}} />
              <Tooltip content={<CustomTooltip />} />
              <Bar yAxisId="vol" dataKey="volume" fill="#2E75B6" radius={[4,4,0,0]}>
                {meritData.map((d,i) => <Cell key={i} fill={d.color} />)}
              </Bar>
              <Line yAxisId="cost" dataKey="cost" stroke="#ff9f43" strokeWidth={2.5} dot={{r:4,fill:"#ff9f43"}} type="stepAfter" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:12,marginTop:20}}>
        {data.years.map((y,i) => {
          const sd = data.supply_stack.surplus_deficit[i];
          return (
            <div key={y} style={{background:i===yearIdx?"#162447":"#0d1b2a",border:i===yearIdx?"1px solid #00b0f0":"1px solid #1e2a3a",borderRadius:8,padding:"14px 16px"}}>
              <div style={{fontSize:11,color:"#8892b0",fontWeight:600}}>{y}</div>
              <div style={{fontSize:22,fontWeight:700,color:"#e0e0e0",marginTop:4}}>{fmt(data.supply_stack.total_supply[i],0)}</div>
              <div style={{fontSize:10,color:"#8892b0"}}>bcm supply</div>
              <div style={{fontSize:14,fontWeight:600,color:sd>=0?"#70AD47":"#ff6b6b",marginTop:6}}>{sd>=0?"+":""}{fmt(sd,1)} bcm</div>
              <div style={{fontSize:10,color:"#8892b0"}}>vs {data.supply_stack.total_demand[i]} demand</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function NorwayView({ data, yearIdx }) {
  const fieldData = data.norway.fields.map(f => ({
    name: f.name, ...Object.fromEntries(data.years.map((y,i) => [y.toString(), f.capacity[i]]))
  }));
  const deductionData = data.years.map((y,i) => ({
    year: y.toString(),
    "Planned Maintenance": data.norway.planned_maintenance[i],
    "Unplanned Outage": data.norway.unplanned_outage[i],
    "Processing Constraint": data.norway.processing_constraint[i],
  }));
  const netData = data.years.map((y,i) => ({
    year: y.toString(), gross: data.norway.gross_capacity[i], net: data.norway.net_supply[i], deductions: data.norway.total_deductions[i]
  }));
  const colors = ["#2E75B6","#4a90d9","#7ab3ef","#ED7D31","#FFC000","#70AD47","#BF0000","#A5A5A5"];
  return (
    <div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:24}}>
        <div>
          <h3 style={{margin:"0 0 12px",fontSize:13,fontWeight:600,letterSpacing:1,textTransform:"uppercase",color:"#8892b0"}}>Field-by-Field Production (bcm/yr)</h3>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={fieldData} layout="vertical" margin={{top:5,right:20,left:10,bottom:5}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2a3a" />
              <XAxis type="number" tick={{fill:"#8892b0",fontSize:11}} />
              <YAxis dataKey="name" type="category" tick={{fill:"#8892b0",fontSize:10}} width={90} />
              <Tooltip content={<CustomTooltip unit="bcm" />} />
              {data.years.map((y,i) => <Bar key={y} dataKey={y.toString()} fill={colors[i]} />)}
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div>
          <h3 style={{margin:"0 0 12px",fontSize:13,fontWeight:600,letterSpacing:1,textTransform:"uppercase",color:"#8892b0"}}>Gross vs Net Deliverable Supply</h3>
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart data={netData} margin={{top:5,right:20,left:0,bottom:5}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2a3a" />
              <XAxis dataKey="year" tick={{fill:"#8892b0",fontSize:11}} />
              <YAxis tick={{fill:"#8892b0",fontSize:11}} domain={[0,100]} />
              <Tooltip content={<CustomTooltip unit="bcm" />} />
              <Bar dataKey="net" fill="#2E75B6" name="Net Supply" radius={[4,4,0,0]} />
              <Bar dataKey="deductions" fill="#ED7D31" name="Deductions" stackId="b" radius={[4,4,0,0]} />
              <Line dataKey="gross" stroke="#70AD47" strokeWidth={2} dot={{r:4}} name="Gross Capacity" type="monotone" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={{marginTop:20}}>
        <h3 style={{margin:"0 0 12px",fontSize:13,fontWeight:600,letterSpacing:1,textTransform:"uppercase",color:"#8892b0"}}>Decline Rate by Field</h3>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          {data.norway.fields.map(f => (
            <div key={f.name} style={{background:"#0d1b2a",border:"1px solid #1e2a3a",borderRadius:8,padding:"10px 14px",minWidth:120}}>
              <div style={{fontSize:11,color:"#8892b0",fontWeight:600}}>{f.name}</div>
              <div style={{fontSize:18,fontWeight:700,color: f.decline_rate > 0.05 ? "#ff6b6b" : f.decline_rate > 0.04 ? "#ff9f43" : "#70AD47"}}>{(f.decline_rate*100).toFixed(1)}%</div>
              <div style={{fontSize:10,color:"#8892b0"}}>{f.operator}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function LNGView({ data, yearIdx }) {
  const year = data.years[yearIdx];
  const byCountry = data.lng.supply_by_country;
  const countryData = Object.entries(byCountry).map(([c,v]) => ({ name: c, value: v[yearIdx] })).sort((a,b)=>b.value-a.value);
  const PIE_COLORS = ["#2E75B6","#ED7D31","#70AD47","#FFC000","#7030A0","#00B0F0","#BF0000","#A5A5A5","#FF6B6B"];
  const globalData = data.years.map((y,i) => ({
    year: y.toString(),
    "Global Supply": data.lng.total_global_supply[i],
    "Ex-Europe Demand": data.lng.global_demand_ex_europe[i],
    "Available for EU": data.lng.available_for_europe_bcm[i],
  }));
  const regasData = data.lng.regas_terminals.map(t => ({
    name: t.name, capacity: t.capacity, throughput: +(t.capacity * t.utilisation[yearIdx]).toFixed(1), utilisation: +(t.utilisation[yearIdx]*100).toFixed(0)
  })).sort((a,b)=>b.capacity-a.capacity);
  return (
    <div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:24}}>
        <div>
          <h3 style={{margin:"0 0 12px",fontSize:13,fontWeight:600,letterSpacing:1,textTransform:"uppercase",color:"#8892b0"}}>Global LNG Supply vs Demand (MTPA)</h3>
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart data={globalData} margin={{top:5,right:20,left:0,bottom:5}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2a3a" />
              <XAxis dataKey="year" tick={{fill:"#8892b0",fontSize:11}} />
              <YAxis tick={{fill:"#8892b0",fontSize:11}} />
              <Tooltip content={<CustomTooltip unit="MTPA" />} />
              <Area dataKey="Global Supply" fill="#00b0f0" fillOpacity={0.15} stroke="#00b0f0" strokeWidth={2} type="monotone" />
              <Line dataKey="Ex-Europe Demand" stroke="#ff6b6b" strokeWidth={2} dot={{r:4}} type="monotone" />
              <Bar dataKey="Available for EU" fill="#70AD47" opacity={0.8} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <div>
          <h3 style={{margin:"0 0 12px",fontSize:13,fontWeight:600,letterSpacing:1,textTransform:"uppercase",color:"#8892b0"}}>LNG Supply by Country — {year}</h3>
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie data={countryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={110} innerRadius={55} paddingAngle={2} label={({name,value})=>`${name}: ${fmt(value,0)}`} labelLine={{stroke:"#555"}} style={{fontSize:10}}>
                {countryData.map((_,i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={{marginTop:20}}>
        <h3 style={{margin:"0 0 12px",fontSize:13,fontWeight:600,letterSpacing:1,textTransform:"uppercase",color:"#8892b0"}}>European Regasification Utilisation — {year}</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={regasData} layout="vertical" margin={{top:5,right:30,left:10,bottom:5}}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e2a3a" />
            <XAxis type="number" tick={{fill:"#8892b0",fontSize:11}} />
            <YAxis dataKey="name" type="category" tick={{fill:"#8892b0",fontSize:9}} width={110} />
            <Tooltip content={<CustomTooltip unit="bcm" />} />
            <Bar dataKey="capacity" fill="#1e2a3a" name="Capacity" radius={[0,4,4,0]} />
            <Bar dataKey="throughput" fill="#00b0f0" name="Throughput" radius={[0,4,4,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function PipelineView({ data, yearIdx }) {
  const year = data.years[yearIdx];
  const routeData = data.pipeline.routes.filter(r => r.volumes[yearIdx] > 0).map(r => ({
    name: r.name, volume: r.volumes[yearIdx], capacity: r.capacity, utilisation: +((r.volumes[yearIdx]/r.capacity)*100).toFixed(0), source: r.source
  }));
  const bySource = data.pipeline.volumes_by_source;
  const sourceTimeData = data.years.map((y,i) => {
    const row = { year: y.toString() };
    Object.entries(bySource).forEach(([s,v]) => { row[s] = v[i]; });
    return row;
  });
  const srcColors = { Russia:"#BF0000", Algeria:"#ED7D31", Libya:"#A5A5A5", Azerbaijan:"#FFC000" };
  const indData = data.years.map((y,i) => {
    const row = { year: y.toString() };
    data.indigenous.sources.forEach(s => { row[s.name] = s.volumes[i]; });
    return row;
  });
  const indColors = ["#70AD47","#2E75B6","#FFC000","#A5A5A5","#7030A0"];
  return (
    <div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:24}}>
        <div>
          <h3 style={{margin:"0 0 12px",fontSize:13,fontWeight:600,letterSpacing:1,textTransform:"uppercase",color:"#8892b0"}}>Pipeline Imports by Source (bcm/yr)</h3>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={sourceTimeData} margin={{top:5,right:20,left:0,bottom:5}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2a3a" />
              <XAxis dataKey="year" tick={{fill:"#8892b0",fontSize:11}} />
              <YAxis tick={{fill:"#8892b0",fontSize:11}} />
              <Tooltip content={<CustomTooltip unit="bcm" />} />
              {Object.keys(bySource).map(s => <Bar key={s} dataKey={s} stackId="a" fill={srcColors[s]||"#888"} />)}
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div>
          <h3 style={{margin:"0 0 12px",fontSize:13,fontWeight:600,letterSpacing:1,textTransform:"uppercase",color:"#8892b0"}}>Indigenous EU Production (bcm/yr)</h3>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={indData} margin={{top:5,right:20,left:0,bottom:5}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2a3a" />
              <XAxis dataKey="year" tick={{fill:"#8892b0",fontSize:11}} />
              <YAxis tick={{fill:"#8892b0",fontSize:11}} />
              <Tooltip content={<CustomTooltip unit="bcm" />} />
              {data.indigenous.sources.map((s,i) => <Bar key={s.name} dataKey={s.name} stackId="a" fill={indColors[i]} />)}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={{marginTop:20}}>
        <h3 style={{margin:"0 0 12px",fontSize:13,fontWeight:600,letterSpacing:1,textTransform:"uppercase",color:"#8892b0"}}>Pipeline Utilisation — {year}</h3>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:12}}>
          {routeData.map(r => (
            <div key={r.name} style={{background:"#0d1b2a",border:"1px solid #1e2a3a",borderRadius:8,padding:"12px 14px"}}>
              <div style={{fontSize:11,color:"#8892b0",fontWeight:600}}>{r.name}</div>
              <div style={{fontSize:10,color:"#666",marginBottom:6}}>{r.source}</div>
              <div style={{background:"#1e2a3a",borderRadius:4,height:8,overflow:"hidden",marginBottom:6}}>
                <div style={{height:"100%",width:`${Math.min(r.utilisation,100)}%`,background: r.utilisation > 80 ? "#ff6b6b" : r.utilisation > 60 ? "#ff9f43" : "#70AD47",borderRadius:4,transition:"width 0.8s ease"}} />
              </div>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:11}}>
                <span style={{color:"#e0e0e0",fontWeight:600}}>{r.volume} / {r.capacity} bcm</span>
                <span style={{color: r.utilisation > 80 ? "#ff6b6b" : "#8892b0"}}>{r.utilisation}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StorageView({ data, yearIdx }) {
  const year = data.years[yearIdx];
  const monthlyData = MONTHS.map((m,i) => ({
    month: m, ...Object.fromEntries(data.years.map((y,j) => [y.toString(), data.storage.monthly_profile[j][i]]))
  }));
  const invData = data.years.map((y,i) => ({
    year: y.toString(),
    "Start Inventory": data.storage.start_inventory[i],
    "Target (1 Nov)": data.storage.target_inventory[i],
    "End Winter": data.storage.end_winter_inventory[i],
    "Working Capacity": data.storage.working_capacity[i],
  }));
  const yrColors = ["#2E75B6","#00b0f0","#70AD47","#FFC000","#ED7D31"];
  return (
    <div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:24}}>
        <div>
          <h3 style={{margin:"0 0 12px",fontSize:13,fontWeight:600,letterSpacing:1,textTransform:"uppercase",color:"#8892b0"}}>Monthly Storage Profile (bcm)</h3>
          <ResponsiveContainer width="100%" height={340}>
            <LineChart data={monthlyData} margin={{top:10,right:20,left:0,bottom:5}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2a3a" />
              <XAxis dataKey="month" tick={{fill:"#8892b0",fontSize:11}} />
              <YAxis tick={{fill:"#8892b0",fontSize:11}} domain={[30,120]} />
              <Tooltip content={<CustomTooltip unit="bcm" />} />
              {data.years.map((y,i) => <Line key={y} dataKey={y.toString()} stroke={yrColors[i]} strokeWidth={i===yearIdx?3:1.5} dot={i===yearIdx?{r:3}:false} type="monotone" opacity={i===yearIdx?1:0.5} />)}
              <ReferenceLine y={data.storage.target_inventory[yearIdx]} stroke="#ff9f43" strokeDasharray="5 5" label={{value:"90% Target",fill:"#ff9f43",fontSize:10}} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div>
          <h3 style={{margin:"0 0 12px",fontSize:13,fontWeight:600,letterSpacing:1,textTransform:"uppercase",color:"#8892b0"}}>Inventory Levels by Year</h3>
          <ResponsiveContainer width="100%" height={340}>
            <ComposedChart data={invData} margin={{top:10,right:20,left:0,bottom:5}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2a3a" />
              <XAxis dataKey="year" tick={{fill:"#8892b0",fontSize:11}} />
              <YAxis tick={{fill:"#8892b0",fontSize:11}} domain={[0,130]} />
              <Tooltip content={<CustomTooltip unit="bcm" />} />
              <Bar dataKey="Start Inventory" fill="#2E75B6" />
              <Bar dataKey="Target (1 Nov)" fill="#70AD47" />
              <Bar dataKey="End Winter" fill="#ED7D31" />
              <Line dataKey="Working Capacity" stroke="#ff4444" strokeWidth={2} dot={{r:4}} type="monotone" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:12,marginTop:20}}>
        {data.years.map((y,i) => (
          <div key={y} style={{background:i===yearIdx?"#162447":"#0d1b2a",border:i===yearIdx?"1px solid #7030A0":"1px solid #1e2a3a",borderRadius:8,padding:"12px 14px"}}>
            <div style={{fontSize:11,color:"#8892b0",fontWeight:600}}>{y}</div>
            <div style={{fontSize:11,color:"#e0e0e0",marginTop:4}}>Injection needed: <strong>{fmt(data.storage.required_injection[i])} bcm</strong></div>
            <div style={{fontSize:11,color:"#e0e0e0",marginTop:2}}>Winter withdrawal: <strong>{data.storage.winter_withdrawal[i]} bcm</strong></div>
            <div style={{fontSize:11,color:"#e0e0e0",marginTop:2}}>End-winter level: <strong>{fmt(data.storage.end_winter_inventory[i])} bcm</strong></div>
            <div style={{background:"#1e2a3a",borderRadius:4,height:6,marginTop:6,overflow:"hidden"}}>
              <div style={{height:"100%",width:`${(data.storage.end_winter_inventory[i]/data.storage.working_capacity[i]*100)}%`,background:"#7030A0",borderRadius:4}} />
            </div>
            <div style={{fontSize:9,color:"#666",textAlign:"right",marginTop:2}}>{fmt(data.storage.end_winter_inventory[i]/data.storage.working_capacity[i]*100,0)}% full end-winter</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ScenariosView({ data }) {
  const base = data.supply_stack.implied_ttf_eur_mwh[0];
  const scenData = data.scenarios.map(s => ({
    name: s.name,
    ttf_impact: s.ttf_impact,
    implied_price: base + s.ttf_impact,
    probability: s.probability * 100,
    supply_impact: s.supply_impact,
    demand_impact: s.demand_impact,
  })).sort((a,b) => a.ttf_impact - b.ttf_impact);
  const probWeighted = data.scenarios.reduce((acc,s) => acc + (base + s.ttf_impact) * s.probability, 0);
  return (
    <div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:24}}>
        <div>
          <h3 style={{margin:"0 0 12px",fontSize:13,fontWeight:600,letterSpacing:1,textTransform:"uppercase",color:"#8892b0"}}>Scenario TTF Price Impact (EUR/MWh) — 2025</h3>
          <ResponsiveContainer width="100%" height={380}>
            <BarChart data={scenData} layout="vertical" margin={{top:5,right:30,left:10,bottom:5}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2a3a" />
              <XAxis type="number" tick={{fill:"#8892b0",fontSize:11}} domain={[-10,20]} />
              <YAxis dataKey="name" type="category" tick={{fill:"#8892b0",fontSize:10}} width={140} />
              <Tooltip content={<CustomTooltip unit="EUR/MWh" />} />
              <ReferenceLine x={0} stroke="#555" />
              <Bar dataKey="ttf_impact" name="TTF Impact" radius={[0,4,4,0]}>
                {scenData.map((d,i) => <Cell key={i} fill={d.ttf_impact >= 0 ? "#ff6b6b" : "#70AD47"} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div>
          <h3 style={{margin:"0 0 12px",fontSize:13,fontWeight:600,letterSpacing:1,textTransform:"uppercase",color:"#8892b0"}}>Probability × Price Distribution</h3>
          <div style={{background:"#0d1b2a",border:"1px solid #1e2a3a",borderRadius:8,padding:20,marginBottom:16}}>
            <div style={{fontSize:11,color:"#8892b0"}}>Probability-Weighted TTF (2025)</div>
            <div style={{fontSize:32,fontWeight:700,color:"#00b0f0",marginTop:4}}>€{fmt(probWeighted,1)}/MWh</div>
            <div style={{fontSize:11,color:"#666",marginTop:2}}>vs base case €{fmt(base,1)}/MWh</div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            {data.scenarios.filter(s=>s.name!=="Base Case").map(s => {
              const ip = base + s.ttf_impact;
              return (
                <div key={s.name} style={{background:"#0d1b2a",border:"1px solid #1e2a3a",borderRadius:6,padding:"8px 10px"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <span style={{fontSize:10,color:"#8892b0",fontWeight:600}}>{s.name}</span>
                    <span style={{fontSize:9,color:"#666",background:"#1e2a3a",padding:"2px 6px",borderRadius:3}}>{(s.probability*100)}%</span>
                  </div>
                  <div style={{fontSize:14,fontWeight:700,color:s.ttf_impact>=0?"#ff6b6b":"#70AD47",marginTop:2}}>€{fmt(ip,1)}</div>
                  <div style={{fontSize:9,color:"#666"}}>{s.ttf_impact>=0?"+":""}{s.ttf_impact} EUR/MWh</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function PriceView({ data }) {
  const priceData = data.years.map((y,i) => ({
    year: y.toString(),
    "TTF (EUR/MWh)": data.supply_stack.implied_ttf_eur_mwh[i],
    "TTF (USD/MMBtu)": data.supply_stack.implied_ttf_usd_mmbtu[i],
    "JKM (USD/MMBtu)": data.assumptions.jkm[i],
    "EU ETS (EUR/tCO2)": data.assumptions.eu_ets_carbon[i],
  }));
  const crossData = data.years.map((y,i) => ({
    year: y.toString(),
    "TTF": data.supply_stack.implied_ttf_eur_mwh[i],
    "Coal (API2 adj)": data.assumptions.api2_coal[i] * 0.30,
    "Brent (adj)": data.assumptions.brent[i] * 0.50,
    "Carbon cost": data.assumptions.eu_ets_carbon[i] * 0.055 * 10,
  }));
  return (
    <div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:12,marginBottom:24}}>
        {data.years.map((y,i) => (
          <div key={y} style={{background:"linear-gradient(135deg,#0d1b2a,#162447)",border:"1px solid #1e2a3a",borderRadius:10,padding:"16px 18px",position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",top:-10,right:-10,fontSize:60,fontWeight:900,color:"#ffffff06"}}>{y}</div>
            <div style={{fontSize:11,color:"#8892b0",fontWeight:600}}>{y}</div>
            <div style={{fontSize:28,fontWeight:800,color:"#00b0f0",marginTop:6}}>€{fmt(data.supply_stack.implied_ttf_eur_mwh[i],1)}</div>
            <div style={{fontSize:10,color:"#8892b0"}}>EUR/MWh</div>
            <div style={{fontSize:16,fontWeight:600,color:"#e0e0e0",marginTop:6}}>${fmt(data.supply_stack.implied_ttf_usd_mmbtu[i],2)}</div>
            <div style={{fontSize:10,color:"#8892b0"}}>USD/MMBtu</div>
            {i > 0 && (
              <div style={{fontSize:11,fontWeight:600,marginTop:8,color: data.supply_stack.implied_ttf_eur_mwh[i] < data.supply_stack.implied_ttf_eur_mwh[i-1] ? "#70AD47" : "#ff6b6b"}}>
                {data.supply_stack.implied_ttf_eur_mwh[i] < data.supply_stack.implied_ttf_eur_mwh[i-1] ? "▼" : "▲"} {fmt(Math.abs(data.supply_stack.implied_ttf_eur_mwh[i] - data.supply_stack.implied_ttf_eur_mwh[i-1]),1)} y/y
              </div>
            )}
          </div>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:24}}>
        <div>
          <h3 style={{margin:"0 0 12px",fontSize:13,fontWeight:600,letterSpacing:1,textTransform:"uppercase",color:"#8892b0"}}>Implied TTF Forward Curve</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={priceData} margin={{top:10,right:20,left:0,bottom:5}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2a3a" />
              <XAxis dataKey="year" tick={{fill:"#8892b0",fontSize:11}} />
              <YAxis tick={{fill:"#8892b0",fontSize:11}} />
              <Tooltip content={<CustomTooltip />} />
              <Line dataKey="TTF (EUR/MWh)" stroke="#00b0f0" strokeWidth={3} dot={{r:5,fill:"#00b0f0"}} type="monotone" />
              <Line dataKey="JKM (USD/MMBtu)" stroke="#ff9f43" strokeWidth={2} dot={{r:4}} type="monotone" strokeDasharray="5 5" />
              <Line dataKey="EU ETS (EUR/tCO2)" stroke="#70AD47" strokeWidth={2} dot={{r:4}} type="monotone" strokeDasharray="3 3" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div>
          <h3 style={{margin:"0 0 12px",fontSize:13,fontWeight:600,letterSpacing:1,textTransform:"uppercase",color:"#8892b0"}}>Cross-Commodity Comparison (Indexed)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={crossData} margin={{top:10,right:20,left:0,bottom:5}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2a3a" />
              <XAxis dataKey="year" tick={{fill:"#8892b0",fontSize:11}} />
              <YAxis tick={{fill:"#8892b0",fontSize:11}} />
              <Tooltip content={<CustomTooltip />} />
              <Area dataKey="TTF" fill="#00b0f0" fillOpacity={0.2} stroke="#00b0f0" strokeWidth={2} type="monotone" />
              <Area dataKey="Coal (API2 adj)" fill="#ED7D31" fillOpacity={0.1} stroke="#ED7D31" strokeWidth={1.5} type="monotone" />
              <Area dataKey="Brent (adj)" fill="#70AD47" fillOpacity={0.1} stroke="#70AD47" strokeWidth={1.5} type="monotone" />
              <Area dataKey="Carbon cost" fill="#7030A0" fillOpacity={0.1} stroke="#7030A0" strokeWidth={1.5} type="monotone" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export default function TTFDashboard() {
  const [activeTab, setActiveTab] = useState(0);
  const [yearIdx, setYearIdx] = useState(0);
  const data = MODEL_DATA;

  return (
    <div style={{
      fontFamily:"'DM Sans',sans-serif",
      background:"#0a0f1a",
      color:"#e0e0e0",
      minHeight:"100vh",
      padding:0,
    }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
      
      {/* HEADER */}
      <div style={{
        background:"linear-gradient(135deg,#0d1b2a 0%,#1b2838 50%,#162447 100%)",
        borderBottom:"1px solid #1e2a3a",
        padding:"20px 28px 16px",
      }}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div>
            <div style={{fontSize:10,fontWeight:700,letterSpacing:3,textTransform:"uppercase",color:"#00b0f0",marginBottom:4}}>Quantitative Framework</div>
            <h1 style={{margin:0,fontSize:24,fontWeight:800,color:"#ffffff",letterSpacing:"-0.02em"}}>TTF Gas Supply Stack Curve</h1>
            <div style={{fontSize:12,color:"#8892b0",marginTop:4}}>Merit-order supply aggregation • 5-year forward model • {data.supply_stack.entries.length} supply sources</div>
          </div>
          <div style={{display:"flex",gap:4,background:"#0a0f1a",borderRadius:8,padding:3}}>
            {data.years.map((y,i) => (
              <button key={y} onClick={()=>setYearIdx(i)} style={{
                background: i===yearIdx ? "#00b0f0" : "transparent",
                color: i===yearIdx ? "#0a0f1a" : "#8892b0",
                border:"none",
                borderRadius:6,
                padding:"6px 14px",
                fontSize:12,
                fontWeight:700,
                cursor:"pointer",
                fontFamily:"'JetBrains Mono',monospace",
                transition:"all 0.2s ease",
              }}>{y}</button>
            ))}
          </div>
        </div>

        {/* TABS */}
        <div style={{display:"flex",gap:2,marginTop:16}}>
          {TABS.map((t,i) => (
            <button key={t} onClick={()=>setActiveTab(i)} style={{
              background: i===activeTab ? "#162447" : "transparent",
              color: i===activeTab ? "#00b0f0" : "#8892b0",
              border: i===activeTab ? "1px solid #1e2a3a" : "1px solid transparent",
              borderBottom: i===activeTab ? "1px solid #162447" : "1px solid transparent",
              borderRadius:"8px 8px 0 0",
              padding:"8px 18px",
              fontSize:12,
              fontWeight:600,
              cursor:"pointer",
              fontFamily:"'DM Sans',sans-serif",
              transition:"all 0.2s ease",
              position:"relative",
              top:1,
            }}>{t}</button>
          ))}
        </div>
      </div>

      {/* CONTENT */}
      <div style={{padding:"24px 28px",background:"#0a0f1a",minHeight:"calc(100vh - 140px)"}}>
        {activeTab === 0 && <SupplyStackView data={data} yearIdx={yearIdx} />}
        {activeTab === 1 && <NorwayView data={data} yearIdx={yearIdx} />}
        {activeTab === 2 && <LNGView data={data} yearIdx={yearIdx} />}
        {activeTab === 3 && <PipelineView data={data} yearIdx={yearIdx} />}
        {activeTab === 4 && <StorageView data={data} yearIdx={yearIdx} />}
        {activeTab === 5 && <ScenariosView data={data} />}
        {activeTab === 6 && <PriceView data={data} />}
      </div>

      {/* FOOTER */}
      <div style={{borderTop:"1px solid #1e2a3a",padding:"12px 28px",display:"flex",justifyContent:"space-between",fontSize:10,color:"#555"}}>
        <span>Model assumptions are illustrative — connect live data feeds for production use</span>
        <span style={{fontFamily:"'JetBrains Mono',monospace"}}>TTF Supply Stack Framework v1.0</span>
      </div>
    </div>
  );
}
