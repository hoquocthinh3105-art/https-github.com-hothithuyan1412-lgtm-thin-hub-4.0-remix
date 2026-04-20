import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  FileText, 
  Download, 
  Calendar, 
  Users, 
  Search, 
  TrendingUp, 
  CheckCircle, 
  ShieldCheck, 
  Filter,
  BarChart as BarChartIcon,
  User,
  GraduationCap
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { cn } from '../lib/utils';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface ReportStats {
  attendanceRate: number;
  averageGrade: number;
  disciplineScore: number;
  studentStats: any[];
}

export const DetailedReportsPage = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<string[]>([]);
  
  // Filters
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedClass, setSelectedClass] = useState('');

  const fetchFilters = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const users = await res.json();
        const stds = Array.isArray(users) ? users.filter((u: any) => u.role === 'student') : [];
        setStudents(stds);
        
        const cls = Array.from(new Set(stds.map((s: any) => s.class_name))).filter(Boolean) as string[];
        setClasses(cls);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchReport = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        start_date: startDate,
        end_date: endDate
      });
      if (selectedStudent) params.append('student_id', selectedStudent);
      if (selectedClass) params.append('class_name', selectedClass);

      const res = await fetch(`/api/reports/summary?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.studentStats)) {
          setStats(data);
        } else {
          setStats(null);
        }
      }
    } catch (error) {
      toast.error('Không thể tải báo cáo');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFilters();
  }, []);

  useEffect(() => {
    fetchReport();
  }, [startDate, endDate, selectedStudent, selectedClass]);

  const handleExportCSV = () => {
    if (!stats) return;
    const headers = ["ID", "Học sinh", "Lớp", "Tỷ lệ chuyên cần (%)", "Điểm TB", "Điểm kỷ luật"];
    const rows = stats.studentStats.map(s => [
      s.id,
      s.name,
      s.class,
      s.attendanceRate.toFixed(1),
      s.averageGrade.toFixed(1),
      s.disciplinePoints
    ]);
    
    const csvContent = [
      headers.join(","),
      ...rows.map(r => r.join(","))
    ].join("\n");
    
    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `BaoCao_THINHUB_${format(new Date(), 'ddMMyyyy')}.csv`;
    link.click();
    toast.success('Đã xuất báo cáo CSV');
  };

  const chartData = useMemo(() => {
    if (!stats) return [];
    return stats.studentStats.slice(0, 10).map(s => ({
      name: s.name,
      grade: s.averageGrade,
      attendance: s.attendanceRate
    }));
  }, [stats]);

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight flex items-center gap-3">
            <BarChartIcon className="w-10 h-10 text-primary" />
            Báo cáo Phân tích
          </h1>
          <p className="text-slate-400 mt-2">Dữ liệu tổng hợp từ điểm danh, học tập và nề nếp.</p>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-6 py-3.5 bg-slate-900 border border-white/5 text-slate-300 font-bold rounded-2xl hover:bg-slate-800 transition-all"
          >
            <Download className="w-5 h-5" />
            XUẤT CSV
          </button>
          <button 
            onClick={() => window.print()}
            className="flex items-center gap-2 px-6 py-3.5 bg-primary text-slate-950 font-black rounded-2xl shadow-[0_0_20px_var(--primary-glow)] hover:scale-105 active:scale-95 transition-all"
          >
            <FileText className="w-5 h-5" />
            IN BÁO CÁO
          </button>
        </div>
      </header>

      {/* Filters Card */}
      <div className="bg-slate-900/50 border border-white/5 p-8 rounded-[2.5rem] shadow-xl backdrop-blur-md">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest pl-1">Từ ngày</label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-slate-950/50 border border-white/10 rounded-2xl pl-12 pr-4 py-3.5 text-white focus:outline-none focus:border-primary transition-all"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest pl-1">Đến ngày</label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
              <input 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-slate-950/50 border border-white/10 rounded-2xl pl-12 pr-4 py-3.5 text-white focus:outline-none focus:border-primary transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest pl-1">Lớp</label>
            <div className="relative">
              <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
              <select 
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full bg-slate-950/50 border border-white/10 rounded-2xl pl-12 pr-4 py-3.5 text-white focus:outline-none focus:border-primary transition-all appearance-none"
              >
                <option value="">Tất cả lớp</option>
                {classes.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest pl-1">Học sinh</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
              <select 
                value={selectedStudent}
                onChange={(e) => setSelectedStudent(e.target.value)}
                className="w-full bg-slate-950/50 border border-white/10 rounded-2xl pl-12 pr-4 py-3.5 text-white focus:outline-none focus:border-primary transition-all appearance-none"
              >
                <option value="">Tất cả học sinh</option>
                {students
                  .filter(s => !selectedClass || s.class_name === selectedClass)
                  .map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)
                }
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-8 rounded-[2rem] bg-slate-900/50 border border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <CheckCircle className="w-20 h-20 text-green-500" />
          </div>
          <h3 className="text-slate-400 font-black uppercase tracking-widest text-xs mb-2">Tỷ lệ Chuyên cần</h3>
          <p className="text-5xl font-black text-white">{stats ? stats.attendanceRate.toFixed(1) : 0}%</p>
          <div className="mt-4 w-full h-2 bg-white/5 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${stats ? stats.attendanceRate : 0}%` }}
              className="h-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]"
            />
          </div>
        </div>

        <div className="p-8 rounded-[2rem] bg-slate-900/50 border border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <TrendingUp className="w-20 h-20 text-primary" />
          </div>
          <h3 className="text-slate-400 font-black uppercase tracking-widest text-xs mb-2">Điểm học tập TB</h3>
          <p className="text-5xl font-black text-white">{stats ? stats.averageGrade.toFixed(1) : 0}</p>
          <div className="mt-4 flex items-center gap-2">
            <span className="text-xs font-bold text-primary px-2 py-0.5 bg-primary/10 rounded-full">Thang điểm 10</span>
          </div>
        </div>

        <div className="p-8 rounded-[2rem] bg-slate-900/50 border border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <ShieldCheck className="w-20 h-20 text-purple-500" />
          </div>
          <h3 className="text-slate-400 font-black uppercase tracking-widest text-xs mb-2">Tổng điểm nề nếp</h3>
          <p className="text-5xl font-black text-white">{stats ? stats.disciplineScore : 0}</p>
          <div className="mt-4 flex items-center gap-2">
            <span className={cn(
              "text-xs font-bold px-2 py-0.5 rounded-full",
              (stats?.disciplineScore || 0) >= 0 ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
            )}>
              {(stats?.disciplineScore || 0) >= 0 ? "Tích cực" : "Tiêu cực"}
            </span>
          </div>
        </div>
      </div>

      {/* Main Analysis Chart */}
      <div className="p-8 rounded-[2.5rem] bg-slate-900/50 border border-white/5">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-2xl font-black text-white flex items-center gap-3">
            <TrendingUp className="w-6 h-6 text-primary" />
            Phân tích chi tiết (Top 10)
          </h3>
        </div>
        
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis yAxisId="left" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} label={{ value: 'Học tập', angle: -90, position: 'insideLeft', fill: '#22d3ee' }} />
              <YAxis yAxisId="right" orientation="right" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} label={{ value: 'Chuyên cần (%)', angle: 90, position: 'insideRight', fill: '#10b981' }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', color: '#fff' }}
                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
              />
              <Legend verticalAlign="top" height={36}/>
              <Bar yAxisId="left" dataKey="grade" name="Điểm TB" fill="#22d3ee" radius={[6, 6, 0, 0]} />
              <Bar yAxisId="right" dataKey="attendance" name="Chuyên cần %" fill="#10b981" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Details Table */}
      <div className="bg-slate-900/30 border border-white/5 rounded-3xl overflow-hidden backdrop-blur-sm">
        <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between">
          <h3 className="text-xl font-black text-white">Bảng dữ liệu chi tiết</h3>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{stats?.studentStats.length} bản ghi</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950/20 border-b border-white/5">
                <th className="px-8 py-4 font-black text-slate-400 uppercase tracking-widest text-[10px]">Học sinh</th>
                <th className="px-8 py-4 font-black text-slate-400 uppercase tracking-widest text-[10px]">Lớp</th>
                <th className="px-8 py-4 font-black text-slate-400 uppercase tracking-widest text-[10px]">Chuyên cần</th>
                <th className="px-8 py-4 font-black text-slate-400 uppercase tracking-widest text-[10px]">Điểm TB</th>
                <th className="px-8 py-4 font-black text-slate-400 uppercase tracking-widest text-[10px]">Kỷ luật/Khen thưởng</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr><td colSpan={5} className="px-8 py-20 text-center text-slate-500 font-bold">Đang tổng hợp dữ liệu...</td></tr>
              ) : stats?.studentStats.map((s) => (
                <tr key={s.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-xs uppercase">
                        {s.name.charAt(0)}
                      </div>
                      <span className="font-bold text-slate-200">{s.name}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-slate-400 font-medium">{s.class}</td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-2">
                      <span className={cn("font-bold px-2 py-0.5 rounded-lg text-xs", s.attendanceRate >= 90 ? "bg-green-500/10 text-green-400" : "bg-amber-500/10 text-amber-400")}>
                        {s.attendanceRate.toFixed(1)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-5 font-bold text-primary">{s.averageGrade.toFixed(2)}</td>
                  <td className="px-8 py-5">
                    <span className={cn(
                      "font-black",
                      s.disciplinePoints > 0 ? "text-green-400" : s.disciplinePoints < 0 ? "text-red-400" : "text-slate-500"
                    )}>
                      {s.disciplinePoints > 0 ? `+${s.disciplinePoints}` : s.disciplinePoints}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
