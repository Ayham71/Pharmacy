import React, { useState, useEffect } from 'react';
import { TrendingUp, BarChart3, Package } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import StatCard from '../pages/StatCard';

const data = [
  { name: 'MON', value: 18000 },
  { name: 'TUE', value: 24000 },
  { name: 'WED', value: 20000 },
  { name: 'THU', value: 34000 },
  { name: 'FRI', value: 22000 },
  { name: 'SAT', value: 40000 },
  { name: 'SUN', value: 38000 },
];

const FinancialReports = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  const formatDateTime = (date) => {
    const options = { 
      month: 'short', 
      day: '2-digit', 
      year: 'numeric',
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    };
    return date.toLocaleDateString('en-US', options).replace(',', ' at');
  };

  return (
    <div style={{padding: '2rem'}}>
      <section className="overview-header">
        <div className="overview-title">
          <h2>Financial Reports</h2>
          <p>Last updated: {formatDateTime(currentTime)}</p>
        </div>
      </section>

      <section className="stats-grid">
        <StatCard 
          title="Monthly Revenue" 
          value="$45,230.00" 
          icon={TrendingUp} 
          colorClass="sales"
        />
        <StatCard 
          title="Profit Margin" 
          value="32.4%" 
          icon={BarChart3} 
          colorClass="orders"
        />
        <StatCard 
          title="Top Product" 
          value="Panadol"  
          icon={Package} 
          colorClass="items"
        />
        <StatCard 
          title="Avg Order Value" 
          value="$87.50" 
          icon={TrendingUp} 
          colorClass="delivery"
        />
      </section>

      <div className="card">
        <div className="card-title">Revenue Chart</div>
        <div style={{ height: 300, width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="var(--accent)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#9ca3af'}} dy={10} />
              <YAxis hide={true} />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke="var(--accent)" 
                strokeWidth={3} 
                fillOpacity={1} 
                fill="url(#colorRevenue)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default FinancialReports;