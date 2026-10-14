'use client';

import { Area, AreaChart, CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useSimulator } from '@/store/simulator';

const palette = { grid: '#D9E7F2', tick: '#657A91', teal: '#5EC6E8', amber: '#F8C642', blue: '#2F7DD3', quiet: '#9CB1D3' };
const tick = { fontSize: 11, fill: palette.tick };
const tooltipStyle = { background: '#FFFFFF', border: '1px solid #D9E7F2', color: '#1F2D5A', borderRadius: 10, fontSize: 13, padding: '12px 16px' };
const margins = { top: 14, right: 14, bottom: 4, left: -12 };
const time = (n: unknown) => `เวลาจำลอง T+${n} นาที`;

export function PowerChart() {
  const samples = useSimulator(s => s.samples);
  return <div className="chart-wrap" role="img" aria-label={`กราฟแรงดันแหล่งหลักจำลอง ค่าล่าสุด ${samples.at(-1)?.voltage.toFixed(1)} โวลต์`}>
    <ResponsiveContainer width="100%" height="100%"><LineChart data={samples} margin={margins}>
      <CartesianGrid stroke={palette.grid} strokeDasharray="2 6" vertical={false} />
      <XAxis dataKey="minute" tickFormatter={n => `${n}m`} tick={tick} axisLine={false} tickLine={false} minTickGap={28} />
      <YAxis domain={[0, 14]} tick={tick} ticks={[0, 4, 8, 12]} axisLine={false} tickLine={false} unit=" V" />
      <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#657A91' }} labelFormatter={time} cursor={{ stroke: '#5E83BE' }} />
      <ReferenceLine y={12} stroke="#596F97" strokeDasharray="4 6" />
      <Line type="stepAfter" dataKey="voltage" name="แรงดันไฟหลัก · V" stroke={palette.teal} strokeWidth={2.4} dot={false} isAnimationActive={false} />
    </LineChart></ResponsiveContainer>
  </div>;
}

export function BatteryChart() {
  const samples = useSimulator(s => s.samples);
  return <div className="chart-wrap" role="img" aria-label={`กราฟพลังงานสำรองจำลอง ค่าล่าสุด ${samples.at(-1)?.battery}%`}>
    <ResponsiveContainer width="100%" height="100%"><AreaChart data={samples} margin={margins}>
      <defs><linearGradient id="battery-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={palette.amber} stopOpacity={.22} /><stop offset="100%" stopColor={palette.amber} stopOpacity={0} /></linearGradient></defs>
      <CartesianGrid stroke={palette.grid} strokeDasharray="2 6" vertical={false} />
      <XAxis dataKey="minute" tickFormatter={n => `${n}m`} tick={tick} axisLine={false} tickLine={false} minTickGap={28} />
      <YAxis domain={[0, 100]} tick={tick} ticks={[0, 28, 60, 100]} axisLine={false} tickLine={false} unit="%" />
      <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#657A91' }} labelFormatter={time} />
      <ReferenceLine y={28} stroke="#FF7A3C" strokeDasharray="4 6" />
      <Area type="linear" dataKey="battery" name="พลังงานสำรอง · %" stroke={palette.amber} fill="url(#battery-fill)" strokeWidth={2.4} isAnimationActive={false} />
    </AreaChart></ResponsiveContainer>
  </div>;
}

export function LoadChart() {
  const samples = useSimulator(s => s.samples);
  return <><div className="chart-wrap" role="img" aria-label="กราฟพื้นที่ซ้อนกำลังโหลด P0 ถึง P3 จำลอง หน่วยวัตต์">
    <ResponsiveContainer width="100%" height="100%"><AreaChart data={samples} margin={margins}>
      <CartesianGrid stroke={palette.grid} strokeDasharray="2 6" vertical={false} />
      <XAxis dataKey="minute" tickFormatter={n => `${n}m`} tick={tick} axisLine={false} tickLine={false} minTickGap={28} />
      <YAxis domain={[0, 500]} tick={tick} axisLine={false} tickLine={false} unit=" W" />
      <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#657A91' }} labelFormatter={time} />
      {([['p0', 'P0 · ควบคุม', palette.blue], ['p1', 'P1 · วิกฤต', palette.teal], ['p2', 'P2 · จำเป็น', palette.amber], ['p3', 'P3 · ทั่วไป', palette.quiet]] as const).map(([key, name, color]) => <Area key={key} type="stepAfter" dataKey={key} name={name} stackId="load" stroke={color} fill={color} fillOpacity={.24} strokeWidth={1.5} isAnimationActive={false} />)}
    </AreaChart></ResponsiveContainer>
  </div><div className="chart-legend"><span><i style={{ background: palette.blue }} />P0 ควบคุม</span><span><i style={{ background: palette.teal }} />P1 วิกฤต</span><span><i style={{ background: palette.amber }} />P2 จำเป็น</span><span><i style={{ background: palette.quiet }} />P3 ทั่วไป</span></div></>;
}

export function WaterChart() {
  const samples = useSimulator(s => s.samples);
  return <><div className="chart-wrap" role="img" aria-label="กราฟความเค็ม ppt และอุณหภูมิน้ำองศาเซลเซียส ข้อมูลจำลอง แสดงช่องว่างเมื่อเซนเซอร์ผิดปกติ">
    <ResponsiveContainer width="100%" height="100%"><LineChart data={samples} margin={{ ...margins, left: -14, right: -14 }}>
      <CartesianGrid stroke={palette.grid} strokeDasharray="2 6" vertical={false} />
      <XAxis dataKey="minute" tickFormatter={n => `${n}m`} tick={tick} axisLine={false} tickLine={false} minTickGap={28} />
      <YAxis yAxisId="salinity" domain={[18, 31]} tick={tick} axisLine={false} tickLine={false} />
      <YAxis yAxisId="temperature" orientation="right" domain={[27, 31]} tick={tick} axisLine={false} tickLine={false} />
      <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#657A91' }} labelFormatter={time} />
      <Line yAxisId="salinity" type="linear" dataKey="salinity" name="ความเค็ม · ppt" stroke={palette.teal} strokeWidth={2.4} dot={false} connectNulls={false} isAnimationActive={false} />
      <Line yAxisId="temperature" type="linear" dataKey="temperature" name="อุณหภูมิ · °C" stroke={palette.amber} strokeDasharray="5 3" strokeWidth={2} dot={false} connectNulls={false} isAnimationActive={false} />
    </LineChart></ResponsiveContainer>
  </div><div className="chart-legend"><span><i style={{ background: palette.teal }} />ความเค็ม · แกนซ้าย (ppt)</span><span><i style={{ background: palette.amber }} />อุณหภูมิ · แกนขวา (°C)</span></div></>;
}

export function CurrentChart(){
 const samples=useSimulator(s=>s.samples);
 return <div className="chart-wrap" role="img" aria-label={'กราฟกระแสบัส DC จำลอง ค่าล่าสุด '+samples.at(-1)?.current.toFixed(1)+' แอมแปร์'}><ResponsiveContainer width="100%" height="100%"><LineChart data={samples} margin={margins}><CartesianGrid stroke={palette.grid} strokeDasharray="2 6" vertical={false}/><XAxis dataKey="minute" tick={tick} tickFormatter={n=>n+'m'} axisLine={false} tickLine={false}/><YAxis domain={[0,'auto']} tick={tick} axisLine={false} tickLine={false} unit=" A"/><Tooltip contentStyle={tooltipStyle} labelStyle={{color:palette.tick}} labelFormatter={time}/><Line type="stepAfter" dataKey="current" name="กระแสบัส DC · A" stroke={palette.blue} strokeWidth={2.4} dot={false} isAnimationActive={false}/></LineChart></ResponsiveContainer></div>;
}
