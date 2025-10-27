import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import { 
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend 
} from 'recharts';

type Row = {
  month: string; 
  median_price: number; 
  sold_count: number; 
  listings_count: number; 
  avg_dom: number;
};

export default function Trends() {
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    supabase.from('market_monthly')
      .select('month, median_price, sold_count, listings_count, avg_dom')
      .eq('municipality_id','10597')
      .order('month', { ascending: true })
      .limit(60)
      .then(({ data, error }) => { 
        if (error) console.error(error); 
        else setRows(data as Row[]); 
      });
  }, []);

  return (
    <div style={{padding:16}}>
      <h2>Market Trends (Vancouver)</h2>
      <div style={{height:320}}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={rows}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="month" 
              tickFormatter={(m: string) => m.slice(0,7)} 
            />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip />
            <Legend />
            <Line yAxisId="left" type="monotone" dataKey="median_price" name="Median Price" dot={false}/>
            <Line yAxisId="right" type="monotone" dataKey="sold_count" name="Sales" strokeDasharray="5 5" dot={false}/>
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}