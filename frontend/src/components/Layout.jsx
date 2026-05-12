import { Link, useLocation } from "react-router-dom";
import { Activity, BarChart2, Cpu, FileText } from "lucide-react";

export default function Layout({ children }) {
  const location = useLocation();

  const navItems = [
    { path: "/", label: "Live", icon: <Activity className="w-4 h-4" /> },
    { path: "/analytics", label: "Analytics", icon: <BarChart2 className="w-4 h-4" /> },
    { path: "/devices", label: "Devices", icon: <Cpu className="w-4 h-4" /> },
    { path: "/billing", label: "Billing", icon: <FileText className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen flex bg-black text-white font-sans">
      
      {/* --- LEFT SIDEBAR --- */}
      <aside className="w-64 bg-black/60 backdrop-blur-xl border-r border-white/5 flex flex-col">
        
        {/* Logo at top of sidebar */}
        <div className="p-8 border-b border-white/5">
          <h1 className="text-3xl font-black tracking-tighter bg-gradient-to-r from-sky-300 via-emerald-300 to-amber-300 bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(56,189,248,0.35)]">
            VoltStream
          </h1>
        </div>

        {/* Navigation Items */} 
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              style={location.pathname === item.path ? {
                borderColor: '#3b82f655',
                boxShadow: 'inset 0 0 12px #3b82f622, 0 0 18px #3b82f61f',
                color: '#60a5fa',
              } : undefined}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                location.pathname === item.path 
                  ? "border bg-white/5"
                  : "text-slate-500 hover:text-slate-200 hover:bg-white/5"
              }`}
            >
              {item.icon}
              <span className="font-semibold">{item.label}</span>
            </Link>
          ))}
        </nav>

      </aside>

      {/* --- MAIN CONTENT AREA --- */}  
      <main className="flex-1 bg-black">
        {children}
      </main>

    </div>
  );
}
