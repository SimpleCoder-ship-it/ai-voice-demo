import React, { useState, useEffect } from 'react';
import { useAudioRecorder } from './useAudioRecorder';
import { 
  Mic, Square, Loader2, Home, Settings, Briefcase, 
  Shield, LayoutDashboard, Folder, Activity, LogOut,
  Bell, HelpCircle, ListTodo, ChevronDown, ChevronRight,
  Calendar, Clock, MapPin, AlertTriangle, Menu
} from 'lucide-react';
import './index.css';

export default function App() {
  const [formData, setFormData] = useState({
    incident_title: '', 
    incident_description: '', 
    date_of_occurrence: '', 
    time_of_occurrence: '',
    department: '', 
    place_of_occurrence: ''
  });

  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const formatted = now.toUTCString().replace('GMT', '').trim();
      setCurrentTime(`UTC Time: ${formatted}`);
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const onExtractionComplete = (data) => {
    const sanitizedData = Object.keys(data).reduce((acc, key) => {
      acc[key] = data[key] || '';
      return acc;
    }, {});
    setFormData((prev) => ({ ...prev, ...sanitizedData }));
  };

  const { isRecording, isLoading, startRecording, stopRecording } = useAudioRecorder(onExtractionComplete);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const SidebarItem = ({ icon: Icon, text, active = false, hasChevron = true }) => (
    <div className={`flex items-center justify-between px-4 py-3 cursor-pointer transition-colors ${active ? 'bg-slate-700/50 border-l-4 border-teal-500 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}>
      <div className="flex items-center gap-3">
        <Icon className="w-5 h-5" />
        <span className="text-sm font-medium">{text}</span>
      </div>
      {hasChevron && <ChevronDown className="w-4 h-4 text-slate-400" />}
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-[#192b45] text-white flex flex-col h-full flex-shrink-0 z-20 shadow-xl">
        <div className="p-4 bg-[#e6f0f3] flex items-center justify-center">
          <div className="text-xl font-bold text-[#192b45] flex flex-col items-center leading-tight">
            <span className="text-3xl tracking-tighter">QM</span>
            <span className="text-[10px] tracking-widest text-teal-600">SMART TECHNOLOGIES</span>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto py-4 custom-scrollbar">
          <SidebarItem icon={Home} text="Home" hasChevron={false} />
          <SidebarItem icon={Settings} text="Administration" />
          <SidebarItem icon={Briefcase} text="AUDIT MANAGEMENT" />
          <SidebarItem icon={Shield} text="AUTHORIZATION MANAGEMENT" />
          <SidebarItem icon={LayoutDashboard} text="DASHBOARDS" />
          <SidebarItem icon={Folder} text="DDS" />
          <SidebarItem icon={Activity} text="DYNAMIC TASK MANAGEMENT" active={true} />
        </div>

        <div className="border-t border-slate-700 p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#192b45] font-bold text-xs shadow-inner">
              QM
            </div>
            <div>
              <div className="text-sm font-medium">presentation</div>
              <div className="text-xs text-slate-300">admin</div>
              <div className="text-xs text-slate-400">test@qmsmart.net</div>
            </div>
          </div>
          <div className="flex items-center justify-between text-slate-400 text-sm mb-2 px-2">
            <div className="flex items-center gap-2 cursor-pointer hover:text-white">
              <Settings className="w-4 h-4" /> Settings
            </div>
            <span className="text-xs">v1.14.b.5</span>
          </div>
          <div className="flex items-center gap-2 text-red-400 hover:text-red-300 cursor-pointer px-2 mt-4">
            <LogOut className="w-4 h-4" /> Logout
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-[#e6f0f3] border-b border-slate-200 flex items-center justify-between px-4 shrink-0 z-10 shadow-sm">
          <div className="flex items-center gap-4 text-slate-600 text-sm font-medium">
            <button className="p-1.5 bg-white rounded-full shadow-sm text-slate-700 hover:bg-slate-50 transition-colors">
              <Menu className="w-5 h-5" />
            </button>
            <span className="hidden sm:inline-block">{currentTime}</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center bg-[#192b45] text-white rounded-md overflow-hidden text-sm font-medium">
              <span className="px-3 py-1.5">v1.14.c</span>
              <div className="bg-slate-700 px-2 py-1.5 border-l border-slate-600 cursor-pointer hover:bg-slate-600 transition-colors">
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>
            
            <button className="flex items-center gap-2 bg-[#192b45] hover:bg-[#253d61] text-white px-4 py-1.5 rounded-md text-sm font-medium transition-colors shadow-sm">
              <ListTodo className="w-4 h-4" /> My Task
            </button>
            
            <div className="relative cursor-pointer">
              <div className="w-8 h-8 bg-[#192b45] rounded-md flex items-center justify-center text-white hover:bg-[#253d61] transition-colors">
                <Bell className="w-4 h-4" />
              </div>
              <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-sm">9</span>
            </div>
            
            <div className="w-8 h-8 bg-[#192b45] rounded-md flex items-center justify-center text-white cursor-pointer hover:bg-[#253d61] transition-colors shadow-sm">
              <HelpCircle className="w-4 h-4" />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 custom-scrollbar relative">
          
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-sm text-slate-600 mb-6 font-medium">
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
            <ChevronRight className="w-4 h-4 text-slate-400" />
            <Folder className="w-4 h-4 text-teal-600" />
            <span className="text-slate-800">Technical Safety Reporting Form (TSR)</span>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden relative">
            
            {/* Form Header */}
            <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 flex justify-between items-center relative">
              <div className="flex-1 text-center flex items-center justify-center gap-2 text-slate-700 font-bold text-sm tracking-wide">
                <AlertTriangle className="w-4 h-4 text-slate-400" />
                INCIDENT DETAILS
              </div>
              
              {/* Voice Record Button integrated into the header */}
              <button
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isLoading}
                className={`absolute right-4 top-1/2 -translate-y-1/2 inline-flex items-center justify-center px-4 py-1.5 rounded-full text-xs font-bold transition-all shadow-sm ${
                  isLoading ? 'bg-slate-200 text-slate-500 cursor-not-allowed' :
                  isRecording ? 'bg-red-100 text-red-600 hover:bg-red-200 ring-2 ring-red-500 ring-offset-2 animate-pulse' : 'bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200'
                }`}
              >
                {isLoading ? (
                  <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Processing</>
                ) : isRecording ? (
                  <><Square className="w-3.5 h-3.5 mr-1.5" fill="currentColor" /> Stop Voice Autofill</>
                ) : (
                  <><Mic className="w-3.5 h-3.5 mr-1.5 text-teal-600" /> Use Voice Autofill</>
                )}
              </button>
            </div>

            {/* Form Body */}
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                
                <div className="md:col-span-2 relative">
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Incident Title <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="incident_title"
                      value={formData.incident_title}
                      onChange={handleInputChange}
                      placeholder="Enter Incident Title"
                      className="w-full rounded border border-slate-300 px-4 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent shadow-sm"
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Incident Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="incident_description"
                    value={formData.incident_description}
                    onChange={handleInputChange}
                    placeholder="Enter Incident Description"
                    rows="4"
                    className="w-full rounded border border-slate-300 px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-y shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Date of Occurrence <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      name="date_of_occurrence"
                      value={formData.date_of_occurrence}
                      onChange={handleInputChange}
                      className="w-full rounded border border-slate-300 pl-4 pr-10 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent shadow-sm"
                    />
                    <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Time of Occurrence(UTC) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="time"
                      name="time_of_occurrence"
                      value={formData.time_of_occurrence}
                      onChange={handleInputChange}
                      className="w-full rounded border border-slate-300 pl-4 pr-10 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent shadow-sm"
                    />
                    <Clock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Department <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      name="department"
                      value={formData.department}
                      onChange={handleInputChange}
                      className="w-full appearance-none rounded border border-slate-300 px-4 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white shadow-sm"
                    >
                      <option value="">Department</option>
                      <option value="Engineering">Engineering</option>
                      <option value="Operations">Operations</option>
                      <option value="Maintenance">Maintenance</option>
                      <option value="Safety">Safety</option>
                      {formData.department && !["Engineering", "Operations", "Maintenance", "Safety"].includes(formData.department) && (
                        <option value={formData.department}>{formData.department}</option>
                      )}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Place of Occurrence <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="place_of_occurrence"
                      value={formData.place_of_occurrence}
                      onChange={handleInputChange}
                      placeholder="Enter Place of Occurrence"
                      className="w-full rounded border border-slate-300 pl-4 pr-10 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent shadow-sm"
                    />
                    <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
                
              </div>
            </div>
            
          </div>
          
        </div>
      </main>
    </div>
  );
}
