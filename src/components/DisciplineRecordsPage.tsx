import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Search, 
  Plus, 
  Filter, 
  Trash2, 
  Edit2, 
  Calendar,
  User,
  AlertTriangle,
  History,
  TrendingDown,
  TrendingUp,
  X,
  ChevronRight,
  ChevronLeft,
  Info
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { format, startOfToday } from 'date-fns';
import { cn } from '../lib/utils';
import { StudentDiscipline, User as UserType } from '../types';

// Assuming you're importing useAuth and useTheme from App.tsx or similar
// For simplicity in this standalone file, we'll assume they are provided or just use localStorage
const useAuth = () => {
  const saved = localStorage.getItem('user');
  const user = saved ? JSON.parse(saved) : null;
  const token = localStorage.getItem('token');
  return { user, token };
};

export const DisciplineRecordsPage = () => {
  const { user, token } = useAuth();
  const [records, setRecords] = useState<StudentDiscipline[]>([]);
  const [students, setStudents] = useState<UserType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<StudentDiscipline | null>(null);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Tất cả');
  
  // Form State
  const [formData, setFormData] = useState({
    student_id: '',
    points: 0,
    reason: '',
    category: 'Nề nếp',
    violation_date: format(new Date(), 'yyyy-MM-dd')
  });

  const CATEGORIES = ['Tất cả', 'Nề nếp', 'Học tập', 'Đạo đức', 'Khác'];
  const FORM_CATEGORIES = ['Nề nếp', 'Học tập', 'Đạo đức', 'Khác'];

  const fetchRecords = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/student-discipline', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setRecords(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error(error);
      toast.error('Không thể tải dữ liệu kỷ luật');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStudents = async () => {
    if (user?.role === 'student') return;
    try {
      const res = await fetch('/api/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const allUsers = await res.json();
        setStudents(Array.isArray(allUsers) ? allUsers.filter((u: any) => u.role === 'student') : []);
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (token) {
      fetchRecords();
      fetchStudents();
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = editingRecord ? 'PUT' : 'POST';
      const url = editingRecord ? `/api/student-discipline/${editingRecord.id}` : '/api/student-discipline';
      
      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        toast.success(editingRecord ? 'Đã cập nhật bản ghi' : 'Đã thêm bản ghi kỷ luật mới');
        setIsModalOpen(false);
        setEditingRecord(null);
        setFormData({
          student_id: '',
          points: 0,
          reason: '',
          category: 'Nề nếp',
          violation_date: format(new Date(), 'yyyy-MM-dd')
        });
        fetchRecords();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Có lỗi xảy ra');
      }
    } catch (error) {
      console.error(error);
      toast.error('Lỗi kết nối máy chủ');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bản ghi này?')) return;
    try {
      const res = await fetch(`/api/student-discipline/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success('Đã xóa thành công');
        fetchRecords();
      }
    } catch (error) {
      toast.error('Xóa thất bại');
    }
  };

  const handleEdit = (record: StudentDiscipline) => {
    setEditingRecord(record);
    setFormData({
      student_id: record.student_id.toString(),
      points: record.points,
      reason: record.reason,
      category: record.category,
      violation_date: record.violation_date
    });
    setIsModalOpen(true);
  };

  const filteredRecords = records.filter(record => {
    const matchesSearch = 
      record.student_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.reason.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'Tất cả' || record.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight flex items-center gap-3">
            <ShieldAlert className="w-10 h-10 text-primary" />
            Sổ kỷ luật nề nếp
          </h1>
          <p className="text-slate-400 mt-2">Theo dõi và quản lý vi phạm, khen thưởng học sinh.</p>
        </div>
        
        {(user?.role === 'teacher' || user?.role === 'officer') && (
          <button 
            onClick={() => {
              setEditingRecord(null);
              setFormData({
                student_id: '',
                points: 0,
                reason: '',
                category: 'Nề nếp',
                violation_date: format(new Date(), 'yyyy-MM-dd')
              });
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-6 py-3.5 bg-primary text-slate-950 font-black rounded-2xl shadow-[0_0_20px_var(--primary-glow)] hover:scale-105 active:scale-95 transition-all"
          >
            <Plus className="w-5 h-5" />
            THÊM BẢN GHI MỚI
          </button>
        )}
      </header>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900/50 border border-white/5 p-6 rounded-3xl">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-red-500/20 text-red-400 rounded-2xl">
              <TrendingDown className="w-6 h-6" />
            </div>
            <p className="text-slate-400 font-bold">Tổng điểm phạt</p>
          </div>
          <p className="text-4xl font-black text-white">
            {records.filter(r => r.points < 0).reduce((acc, curr) => acc + curr.points, 0)}
          </p>
        </div>
        
        <div className="bg-slate-900/50 border border-white/5 p-6 rounded-3xl">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-green-500/20 text-green-400 rounded-2xl">
              <TrendingUp className="w-6 h-6" />
            </div>
            <p className="text-slate-400 font-bold">Điểm thưởng</p>
          </div>
          <p className="text-4xl font-black text-white">
            {records.filter(r => r.points > 0).reduce((acc, curr) => acc + curr.points, 0)}
          </p>
        </div>

        <div className="bg-slate-900/50 border border-white/5 p-6 rounded-3xl">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-primary/20 text-primary rounded-2xl">
              <History className="w-6 h-6" />
            </div>
            <p className="text-slate-400 font-bold">Tổng số bản ghi</p>
          </div>
          <p className="text-4xl font-black text-white">{records.length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <input 
            type="text" 
            placeholder="Tìm theo tên học sinh, nội dung..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900/50 border border-white/5 rounded-2xl pl-12 pr-4 py-4 text-white focus:outline-none focus:border-primary transition-all"
          />
        </div>
        
        <div className="flex gap-2 bg-slate-900/50 p-1.5 rounded-2xl border border-white/5 overflow-x-auto no-scrollbar">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                "px-6 py-2.5 rounded-xl font-bold transition-all whitespace-nowrap",
                selectedCategory === cat 
                  ? "bg-primary text-slate-950 shadow-[0_0_15px_var(--primary-glow)]" 
                  : "text-slate-400 hover:text-white"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Records Table */}
      <div className="bg-slate-900/30 border border-white/5 rounded-3xl overflow-hidden backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/50 border-b border-white/5">
                <th className="px-6 py-5 font-black text-slate-400 uppercase tracking-widest text-xs">Ngày</th>
                <th className="px-6 py-5 font-black text-slate-400 uppercase tracking-widest text-xs">Học sinh</th>
                <th className="px-6 py-5 font-black text-slate-400 uppercase tracking-widest text-xs">Phân loại</th>
                <th className="px-6 py-5 font-black text-slate-400 uppercase tracking-widest text-xs">Nội dung vi phạm/khen thưởng</th>
                <th className="px-6 py-5 font-black text-slate-400 uppercase tracking-widest text-xs text-center">Điểm</th>
                <th className="px-6 py-5 font-black text-slate-400 uppercase tracking-widest text-xs text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center text-slate-500">
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="inline-block w-8 h-8 border-2 border-primary border-t-transparent rounded-full mb-4"
                    />
                    <p className="font-bold">Đang tải dữ liệu...</p>
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center text-slate-500">
                    <ShieldCheck className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p className="text-xl font-bold">Không tìm thấy bản ghi nào</p>
                    <p className="text-sm">Hãy thử thay đổi tiêu chí lọc hoặc thêm bản ghi mới.</p>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => (
                  <tr key={record.id} className="group hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <Calendar className="w-4 h-4 text-slate-500" />
                        <span className="text-slate-300 font-medium">
                          {format(new Date(record.violation_date), 'dd/MM/yyyy')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-primary font-black border border-white/5">
                          {record.student_name?.charAt(0)}
                        </div>
                        <div>
                          <p className="text-white font-bold">{record.student_name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className={cn(
                        "px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest",
                        record.category === 'Nề nếp' ? "bg-amber-500/20 text-amber-400" :
                        record.category === 'Học tập' ? "bg-blue-500/20 text-blue-400" :
                        record.category === 'Đạo đức' ? "bg-purple-500/20 text-purple-400" :
                        "bg-slate-700/50 text-slate-400"
                      )}>
                        {record.category}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-slate-300 line-clamp-2 max-w-md">{record.reason}</p>
                      <p className="text-[10px] text-slate-500 mt-1 uppercase font-bold tracking-tighter">
                        Ghi bởi: {record.teacher_name}
                      </p>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className={cn(
                        "text-xl font-black",
                        record.points < 0 ? "text-red-400" : record.points > 0 ? "text-green-400" : "text-slate-500"
                      )}>
                        {record.points > 0 ? `+${record.points}` : record.points}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      {(user?.role === 'teacher' || user?.role === 'officer') && (
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => handleEdit(record)}
                            className="p-2 bg-blue-500/10 text-blue-400 hover:bg-blue-500 rounded-xl hover:text-white transition-all"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(record.id)}
                            className="p-2 bg-red-500/10 text-red-400 hover:bg-red-500 rounded-xl hover:text-white transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                      {(user?.role === 'student') && (
                        <button className="p-2 text-slate-500">
                          <Info className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal - Create/Edit */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-xl bg-slate-900 border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-white/5 flex justify-between items-center bg-slate-950/30">
                <div>
                  <h3 className="text-2xl font-black text-white">{editingRecord ? 'Chỉnh sửa bản ghi' : 'Thêm kỷ luật mới'}</h3>
                  <p className="text-slate-400 text-sm">Ghi nhận vi phạm hoặc khen thưởng cho học sinh.</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-3 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-slate-400">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2 col-span-2 md:col-span-1">
                    <label className="text-sm font-black text-slate-400 uppercase tracking-widest pl-1">Học sinh</label>
                    <select
                      value={formData.student_id}
                      onChange={(e) => setFormData({...formData, student_id: e.target.value})}
                      disabled={!!editingRecord}
                      required
                      className="w-full bg-slate-950/50 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-primary transition-all appearance-none"
                    >
                      <option value="">Chọn học sinh...</option>
                      {students.map(student => (
                        <option key={student.id} value={student.id}>{student.full_name} ({student.class_name})</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2 col-span-2 md:col-span-1">
                    <label className="text-sm font-black text-slate-400 uppercase tracking-widest pl-1">Ngày vi phạm</label>
                    <input
                      type="date"
                      value={formData.violation_date}
                      onChange={(e) => setFormData({...formData, violation_date: e.target.value})}
                      required
                      className="w-full bg-slate-950/50 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-primary transition-all"
                    />
                  </div>

                  <div className="space-y-2 col-span-2 md:col-span-1">
                    <label className="text-sm font-black text-slate-400 uppercase tracking-widest pl-1">Phân loại</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      required
                      className="w-full bg-slate-950/50 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-primary transition-all appearance-none"
                    >
                      {FORM_CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2 col-span-2 md:col-span-1">
                    <label className="text-sm font-black text-slate-400 uppercase tracking-widest pl-1">Điểm thưởng/phạt</label>
                    <input
                      type="number"
                      value={formData.points}
                      onChange={(e) => setFormData({...formData, points: parseInt(e.target.value)})}
                      required
                      className="w-full bg-slate-950/50 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-primary transition-all"
                      placeholder="Ví dụ: -5 hoặc +10"
                    />
                  </div>

                  <div className="space-y-2 col-span-2">
                    <label className="text-sm font-black text-slate-400 uppercase tracking-widest pl-1">Nội dung chi tiết</label>
                    <textarea
                      value={formData.reason}
                      onChange={(e) => setFormData({...formData, reason: e.target.value})}
                      required
                      rows={4}
                      className="w-full bg-slate-950/50 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-primary transition-all resize-none"
                      placeholder="Nhập chi tiết vi phạm hoặc lý do khen thưởng..."
                    />
                  </div>
                </div>

                <div className="pt-4 flex gap-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-4 bg-slate-800 text-white font-black rounded-2xl hover:bg-slate-700 transition-all"
                  >
                    HỦY BỎ
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-4 bg-primary text-slate-950 font-black rounded-2xl shadow-[0_0_20px_var(--primary-glow)] hover:shadow-[0_0_30px_var(--primary-glow)] transition-all active:scale-95"
                  >
                    {editingRecord ? 'CẬP NHẬT' : 'LƯU BẢN GHI'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
