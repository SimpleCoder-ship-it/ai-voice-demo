import React, { useState, useEffect } from 'react';
import { useAudioRecorder } from './useAudioRecorder';
import { 
  Mic, Square, Loader2, Home, Settings, Briefcase, 
  Shield, LayoutDashboard, Folder, Activity, LogOut,
  Bell, HelpCircle, ListTodo, ChevronDown, ChevronRight,
  Calendar, Clock, MapPin, AlertTriangle, Menu, Plane,
  Cloud, Wind, Users, FileText, CheckCircle2, Paperclip,
  Download, Save, Send, X, Sparkles, Check, RefreshCw
} from 'lucide-react';
import './index.css';

const ASR_TYPE_OPTIONS = [
  'Wildlife',
  'Call Sign Confusion',
  'ATC Incident',
  'Collision Avoidance (TCAS/RA)',
  'EGPWS',
  'GNSS Spoofing',
  'Injury',
  'Laser Interference',
  'Other'
];

const FLIGHT_PHASES = [
  'Pre-flight',
  'Pushback / Taxi',
  'Take-off',
  'Climb',
  'Cruise',
  'Descent',
  'Holding',
  'Approach',
  'Landing',
  'Go-Around',
  'After Landing / Taxi',
  'Parked / Ground'
];

const NATURE_OF_FLIGHT_OPTIONS = [
  'Scheduled Passenger',
  'Non-Scheduled / Charter',
  'Cargo',
  'Ferry / Positioning',
  'Training',
  'Test Flight',
  'Technical Stop',
  'Other'
];

export default function App() {
  const [formData, setFormData] = useState({
    // REPORT HEADER
    mor_vsr: 'MOR',
    reporter: '',
    asr_type: [],

    // FLIGHT DETAILS
    title: '',
    date_of_occurrence: '',
    time_of_occurrence_ist: '',
    time_of_occurrence_utc: '',
    flight_no: '',
    registration: '',
    callsign: 'QP-',
    flight_duration: '',
    location_position: '',

    // ASR - GENERAL (Flight Schedule)
    flight_schedule: '',
    aircraft_type: '',
    flight_status: 'Active',
    cargo_weight: '',

    // DETAILS (Position / Airport)
    lat_long: '',
    location_airport: '',
    departure: '',
    destination: '',
    diverted_to: '',
    flight_phase: '',
    ground_incident: false,
    nature_of_flight: 'Scheduled Passenger',
    number_of_crew: '',
    number_of_pax: '',
    speed_knots: '',
    speed_mach: '',
    altitude_ft: '',
    height_agl_ft: '',
    flight_level: '',
    runway_used: '',
    runway_condition: '',
    rvr: '',
    takeoff_weight: '',
    landing_weight: '',

    // Operations & ATC
    cvr_download_requested: false,
    techlog_entry: false,
    atc_informed: false,
    atc_unit: '',
    atc_time: '',
    delay: '',

    // AIRCRAFT CONFIGURATION
    autopilot: '',
    autothrottle: '',
    spoilers: '',
    flap_setting: '',
    slats: '',
    landing_gear: '',

    // DESCRIPTION
    description: '',

    // CREW
    captain: '',
    first_officer: '',
    sccm: '',
    ccm1: '',
    ccm2: '',
    ccm3: '',
    ccm4: '',
    ccm5: '',
    observer: '',
    observer_2: '',

    // FLIGHT METEOROLOGICAL
    wind_bearing: '',
    wind_velocity: '',
    temperature_c: '',
    qnh: '',
    visibility_m: '',
    meteorological_condition: '',
    light_condition: '',
    cloud_ceiling_ft: '',
    precipitation: '',
    icing: '',
    turbulence: '',
    flying_sun: '',
    additional_info: ''
  });

  const [currentTime, setCurrentTime] = useState('');
  const [lastExtractedFields, setLastExtractedFields] = useState(0);
  const [showVoiceHelp, setShowVoiceHelp] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const datePart = `${now.getUTCMonth() + 1}/${now.getUTCDate()}/${now.getUTCFullYear()}`;
      const timePart = now.toLocaleTimeString('en-US', { timeZone: 'UTC', hour12: true });
      setCurrentTime(`UTC Time: ${datePart}, ${timePart}`);
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const onExtractionComplete = (data) => {
    if (!data) return;
    let count = 0;
    const sanitized = {};

    Object.keys(data).forEach((key) => {
      const val = data[key];
      if (val !== undefined && val !== null && val !== '') {
        if (Array.isArray(val) && val.length > 0) {
          sanitized[key] = val;
          count += val.length;
        } else if (typeof val === 'string' && val.trim() !== '') {
          if (['cvr_download_requested', 'techlog_entry', 'atc_informed'].includes(key)) {
            sanitized[key] = val.toLowerCase().includes('yes') || val.toLowerCase().includes('true');
          } else {
            sanitized[key] = val;
          }
          count++;
        } else if (typeof val === 'boolean') {
          sanitized[key] = val;
          count++;
        }
      }
    });

    if (sanitized.title && !sanitized.incident_title) sanitized.incident_title = sanitized.title;
    if (sanitized.incident_title && !sanitized.title) sanitized.title = sanitized.incident_title;
    if (sanitized.description && !sanitized.incident_description) sanitized.incident_description = sanitized.description;
    if (sanitized.incident_description && !sanitized.description) sanitized.description = sanitized.incident_description;

    setFormData((prev) => ({
      ...prev,
      ...sanitized,
      asr_type: Array.isArray(sanitized.asr_type) && sanitized.asr_type.length > 0 
        ? Array.from(new Set([...prev.asr_type, ...sanitized.asr_type]))
        : prev.asr_type
    }));

    setLastExtractedFields(count);
  };

  const { isRecording, isLoading, startRecording, stopRecording } = useAudioRecorder(onExtractionComplete);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const toggleAsrType = (type) => {
    setFormData((prev) => {
      const exists = prev.asr_type.includes(type);
      return {
        ...prev,
        asr_type: exists ? prev.asr_type.filter((t) => t !== type) : [...prev.asr_type, type]
      };
    });
  };

  const handleReset = () => {
    if (window.confirm('Clear all form fields?')) {
      setFormData({
        mor_vsr: 'MOR',
        reporter: '',
        asr_type: [],
        title: '',
        date_of_occurrence: '',
        time_of_occurrence_ist: '',
        time_of_occurrence_utc: '',
        flight_no: '',
        registration: '',
        callsign: 'QP-',
        flight_duration: '',
        location_position: '',
        flight_schedule: '',
        aircraft_type: '',
        flight_status: 'Active',
        cargo_weight: '',
        lat_long: '',
        location_airport: '',
        departure: '',
        destination: '',
        diverted_to: '',
        flight_phase: '',
        ground_incident: false,
        nature_of_flight: 'Scheduled Passenger',
        number_of_crew: '',
        number_of_pax: '',
        speed_knots: '',
        speed_mach: '',
        altitude_ft: '',
        height_agl_ft: '',
        flight_level: '',
        runway_used: '',
        runway_condition: '',
        rvr: '',
        takeoff_weight: '',
        landing_weight: '',
        cvr_download_requested: false,
        techlog_entry: false,
        atc_informed: false,
        atc_unit: '',
        atc_time: '',
        delay: '',
        autopilot: '',
        autothrottle: '',
        spoilers: '',
        flap_setting: '',
        slats: '',
        landing_gear: '',
        description: '',
        captain: '',
        first_officer: '',
        sccm: '',
        ccm1: '',
        ccm2: '',
        ccm3: '',
        ccm4: '',
        ccm5: '',
        observer: '',
        observer_2: '',
        wind_bearing: '',
        wind_velocity: '',
        temperature_c: '',
        qnh: '',
        visibility_m: '',
        meteorological_condition: '',
        light_condition: '',
        cloud_ceiling_ft: '',
        precipitation: '',
        icing: '',
        turbulence: '',
        flying_sun: '',
        additional_info: ''
      });
      setLastExtractedFields(0);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title || !formData.date_of_occurrence || !formData.flight_no) {
      alert('Please fill in the required fields marked with an asterisk (Title, Date of Occurrence, Flight No).');
      return;
    }
    alert(`ASR form submitted successfully for Flight ${formData.flight_no}.`);
  };

  const SidebarItem = ({ icon: Icon, text, active = false, hasChevron = true }) => (
    <div className={`flex items-center justify-between px-4 py-2.5 cursor-pointer transition-colors text-xs font-semibold uppercase tracking-wider ${
      active 
        ? 'bg-slate-700/60 border-l-4 border-teal-500 text-white' 
        : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
    }`}>
      <div className="flex items-center gap-3">
        <Icon className="w-4 h-4 text-slate-400" />
        <span>{text}</span>
      </div>
      {hasChevron && <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
    </div>
  );

  return (
    <div className="flex h-screen bg-[#f1f5f9] font-sans overflow-hidden text-slate-800">
      {/* Left Navigation Sidebar */}
      <aside className="w-64 bg-[#111c2e] text-white flex flex-col h-full flex-shrink-0 z-20 shadow-xl border-r border-slate-800">
        <div className="p-4 bg-[#0d1624] flex items-center justify-between border-b border-slate-800">
          <div className="text-xl font-bold text-white flex flex-col leading-tight">
            <span className="text-xl font-black tracking-tight flex items-center gap-2">
              <Plane className="w-5 h-5 text-teal-400" /> QMSmart
            </span>
            <span className="text-[10px] tracking-widest text-slate-400 font-medium uppercase mt-0.5">Safety & Quality Systems</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-2 custom-scrollbar space-y-0.5">
          <SidebarItem icon={Home} text="Home" hasChevron={false} />
          <SidebarItem icon={Settings} text="Administration" />
          <SidebarItem icon={Briefcase} text="Audit Management" />
          <SidebarItem icon={Shield} text="Authorization" />
          <SidebarItem icon={LayoutDashboard} text="Dashboards" />
          <SidebarItem icon={Folder} text="DDS" />
          <SidebarItem icon={Activity} text="Dynamic Tasks" />
          <SidebarItem icon={AlertTriangle} text="FRAT" />
          <SidebarItem icon={AlertTriangle} text="Incident & Investigation" active={true} />
          <SidebarItem icon={Shield} text="Risk & MOC" />
          <SidebarItem icon={Activity} text="SPI" />
          <SidebarItem icon={Activity} text="SPM" />
          <SidebarItem icon={Folder} text="TRMS" />
          <SidebarItem icon={Folder} text="Master Data" />
          <SidebarItem icon={Calendar} text="Planner" />
        </div>

        {/* Generic Professional User Profile Footer */}
        <div className="border-t border-slate-800 p-3 bg-[#0d1624]">
          <div className="flex items-center gap-3 mb-2.5">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-teal-400 text-xs shadow-inner">
              <Users className="w-4 h-4" />
            </div>
            <div className="leading-tight">
              <div className="text-xs font-semibold text-slate-200">Flight Operations</div>
              <div className="text-[10px] text-teal-400 font-medium">Safety Reporting</div>
            </div>
          </div>
          <div className="flex items-center justify-between text-slate-400 text-xs py-1 border-t border-slate-800">
            <div className="flex items-center gap-1.5 cursor-pointer hover:text-white transition-colors">
              <Settings className="w-3.5 h-3.5" /> Settings
            </div>
            <span className="text-[10px] text-slate-500 font-mono">v1.14.b</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400 hover:text-rose-400 cursor-pointer text-xs pt-1.5 transition-colors">
            <LogOut className="w-3.5 h-3.5" /> Logout
          </div>
        </div>
      </aside>

      {/* Main Panel */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top App Header */}
        <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-5 shrink-0 z-10 shadow-xs">
          <div className="flex items-center gap-4 text-slate-700 text-xs font-medium">
            <button className="p-1.5 bg-slate-50 rounded border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors">
              <Menu className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2 bg-slate-50 px-2.5 py-1 rounded border border-slate-200 text-slate-600 font-mono">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>{currentTime}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center bg-slate-100 text-slate-700 rounded px-2.5 py-1 text-xs font-semibold border border-slate-200">
              <span>v1.14.c</span>
            </div>
            
            <button className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-white px-3 py-1.5 rounded text-xs font-medium transition-colors">
              <ListTodo className="w-3.5 h-3.5 text-teal-400" /> My Tasks <span className="ml-1 bg-teal-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">10</span>
            </button>

            <button 
              onClick={() => setShowVoiceHelp(true)}
              className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white px-3 py-1.5 rounded text-xs font-semibold transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" /> Voice Guide
            </button>
            
            <div className="relative cursor-pointer">
              <div className="w-8 h-8 rounded border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors">
                <Bell className="w-4 h-4" />
              </div>
              <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[9px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center">9</span>
            </div>
            
            <div className="w-8 h-8 rounded border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 cursor-pointer transition-colors">
              <HelpCircle className="w-4 h-4" />
            </div>
          </div>
        </header>

        {/* Scrollable Form Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar relative">
          
          {/* Breadcrumbs */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
              <LayoutDashboard className="w-4 h-4 text-slate-400" />
              <span>Dashboard</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
              <Folder className="w-4 h-4 text-teal-600" />
              <span className="font-semibold text-slate-800">ASR - SMS</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
              <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200 font-semibold">Initial Form Details</span>
            </div>

            {lastExtractedFields > 0 && (
              <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 rounded text-xs font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Extracted {lastExtractedFields} fields from audio recording.</span>
              </div>
            )}
          </div>

          {/* Clean Enterprise Voice Autofill Banner */}
          <div className="bg-[#111c2e] text-white rounded-lg p-5 mb-6 border border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`w-11 h-11 rounded-lg flex items-center justify-center transition-all ${
                isRecording 
                  ? 'bg-rose-600 ring-4 ring-rose-500/30' 
                  : isLoading 
                  ? 'bg-amber-600' 
                  : 'bg-teal-600'
              }`}>
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin text-white" /> : <Mic className="w-5 h-5 text-white" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold tracking-tight text-white">
                    AI Voice Autofill
                  </h2>
                  <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700 font-medium">
                    FastAPI + Azure
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1 max-w-xl">
                  {isRecording ? (
                    <span className="flex items-center gap-1.5 text-rose-300 font-medium">
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping inline-block"></span>
                      Recording in progress. Speak occurrence details clearly (Flight No, Route, Time, Level, Weather, Crew, Occurrence Description).
                    </span>
                  ) : isLoading ? (
                    <span className="flex items-center gap-1.5 text-amber-300 font-medium">
                      <Loader2 className="w-3.5 h-3.5 animate-spin inline-block" />
                      Processing audio with Azure Speech and mapping fields with Azure OpenAI...
                    </span>
                  ) : (
                    "Record a spoken incident report to automatically extract and populate all corresponding fields in the ASR sections below."
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isLoading}
                className={`flex items-center gap-2 px-4 py-2 rounded font-bold text-xs uppercase tracking-wider transition-all ${
                  isLoading 
                    ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                    : isRecording 
                    ? 'bg-rose-600 hover:bg-rose-700 text-white ring-2 ring-rose-400'
                    : 'bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold'
                }`}
              >
                {isLoading ? (
                  <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Processing</>
                ) : isRecording ? (
                  <><Square className="w-3.5 h-3.5" fill="currentColor" /> Stop Recording</>
                ) : (
                  <><Mic className="w-3.5 h-3.5" /> Start Voice Autofill</>
                )}
              </button>

              <button 
                type="button" 
                onClick={handleReset}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded text-xs font-medium border border-slate-700 transition-colors"
                title="Clear all fields"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Clean Professional Form Card */}
          <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden mb-12">
            
            <div className="bg-slate-50 border-b border-slate-200 px-6 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-800 font-bold text-xs uppercase tracking-wider">
                <Plane className="w-4 h-4 text-teal-600" />
                Air Safety Report (ASR - SMS)
              </div>
              <div className="text-xs text-slate-500 font-medium">
                Mandatory fields indicated by <span className="text-rose-500 font-bold">*</span>
              </div>
            </div>

            <div className="p-6 sm:p-8 space-y-7">
              
              {/* SECTION 1: REPORT HEADER */}
              <div className="border border-slate-200 rounded-md p-5 bg-white">
                <div className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5 text-teal-600" /> 1. Report Header
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      MOR / VSR <span className="text-rose-500">*</span>
                    </label>
                    <div className="flex items-center gap-3">
                      {['MOR', 'VSR'].map((option) => (
                        <label key={option} className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 border rounded cursor-pointer text-xs font-semibold transition-all ${
                          formData.mor_vsr === option ? 'bg-teal-50 border-teal-500 text-teal-800' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}>
                          <input
                            type="radio"
                            name="mor_vsr"
                            value={option}
                            checked={formData.mor_vsr === option}
                            onChange={handleInputChange}
                            className="text-teal-600 focus:ring-teal-500"
                          />
                          <span>{option}</span>
                          <span className="text-[10px] text-slate-400 font-normal">Auto Capture</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Reporter</label>
                    <input
                      type="text"
                      name="reporter"
                      value={formData.reporter}
                      onChange={handleInputChange}
                      placeholder="Enter reporter name or designation"
                      className="w-full rounded border border-slate-300 px-3.5 py-2 text-xs text-slate-700 focus:ring-1 focus:ring-teal-600 focus:border-teal-600 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    ASR Type (Select applicable categories)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {ASR_TYPE_OPTIONS.map((type) => {
                      const isSelected = formData.asr_type.includes(type);
                      return (
                        <button
                          type="button"
                          key={type}
                          onClick={() => toggleAsrType(type)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium border transition-colors ${
                            isSelected 
                              ? 'bg-teal-700 border-teal-700 text-white font-semibold shadow-xs' 
                              : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                          <span>{type}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* SECTION 2: FLIGHT DETAILS */}
              <div className="border border-slate-200 rounded-md p-5 bg-white">
                <div className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
                  <Plane className="w-3.5 h-3.5 text-teal-600" /> 2. Flight Details
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="sm:col-span-2 lg:col-span-4">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Title <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      placeholder="Enter occurrence title"
                      className="w-full rounded border border-slate-300 px-3.5 py-2 text-xs text-slate-800 focus:ring-1 focus:ring-teal-600 focus:border-teal-600 bg-white font-medium"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Date of Occurrence <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        name="date_of_occurrence"
                        value={formData.date_of_occurrence}
                        onChange={handleInputChange}
                        className="w-full rounded border border-slate-300 pl-3.5 pr-8 py-2 text-xs text-slate-700 focus:ring-1 focus:ring-teal-600 focus:border-teal-600 bg-white"
                        required
                      />
                      <Calendar className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Time of Occurrence (IST)
                    </label>
                    <div className="relative">
                      <input
                        type="time"
                        name="time_of_occurrence_ist"
                        value={formData.time_of_occurrence_ist}
                        onChange={handleInputChange}
                        className="w-full rounded border border-slate-300 pl-3.5 pr-8 py-2 text-xs text-slate-700 focus:ring-1 focus:ring-teal-600 focus:border-teal-600 bg-white"
                      />
                      <Clock className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Time of Occurrence (UTC)
                    </label>
                    <div className="relative">
                      <input
                        type="time"
                        name="time_of_occurrence_utc"
                        value={formData.time_of_occurrence_utc}
                        onChange={handleInputChange}
                        className="w-full rounded border border-slate-300 pl-3.5 pr-8 py-2 text-xs text-slate-700 focus:ring-1 focus:ring-teal-600 focus:border-teal-600 bg-white"
                      />
                      <Clock className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Flight Duration (HH:MM)
                    </label>
                    <input
                      type="text"
                      name="flight_duration"
                      value={formData.flight_duration}
                      onChange={handleInputChange}
                      placeholder="02:30"
                      className="w-full rounded border border-slate-300 px-3.5 py-2 text-xs text-slate-700 focus:ring-1 focus:ring-teal-600 focus:border-teal-600 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Flight No <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="flight_no"
                      value={formData.flight_no}
                      onChange={handleInputChange}
                      placeholder="e.g. QP-142"
                      className="w-full rounded border border-slate-300 px-3.5 py-2 text-xs text-slate-800 focus:ring-1 focus:ring-teal-600 focus:border-teal-600 bg-white font-semibold"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Registration <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="registration"
                      value={formData.registration}
                      onChange={handleInputChange}
                      placeholder="e.g. VT-YAA"
                      className="w-full rounded border border-slate-300 px-3.5 py-2 text-xs text-slate-700 focus:ring-1 focus:ring-teal-600 focus:border-teal-600 bg-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      CallSign
                    </label>
                    <div className="flex">
                      <span className="inline-flex items-center px-2.5 rounded-l border border-r-0 border-slate-300 bg-slate-100 text-slate-500 text-xs font-mono">
                        QP-
                      </span>
                      <input
                        type="text"
                        name="callsign"
                        value={formData.callsign.replace(/^QP-/, '')}
                        onChange={(e) => setFormData({ ...formData, callsign: `QP-${e.target.value}` })}
                        placeholder="Enter CallSign"
                        className="w-full rounded-r border border-slate-300 px-3.5 py-2 text-xs text-slate-700 focus:ring-1 focus:ring-teal-600 focus:border-teal-600 bg-white font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Location / Position
                    </label>
                    <input
                      type="text"
                      name="location_position"
                      value={formData.location_position}
                      onChange={handleInputChange}
                      placeholder="Complete if not near an airport"
                      className="w-full rounded border border-slate-300 px-3.5 py-2 text-xs text-slate-700 focus:ring-1 focus:ring-teal-600 focus:border-teal-600 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: ASR - GENERAL (Flight Schedule) */}
              <div className="border border-slate-200 rounded-md p-5 bg-white">
                <div className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-teal-600" /> 3. ASR - General (Flight Schedule)
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Flight Schedule</label>
                    <input
                      type="text"
                      name="flight_schedule"
                      value={formData.flight_schedule}
                      onChange={handleInputChange}
                      placeholder="Selected schedule reference"
                      className="w-full rounded border border-slate-300 px-3.5 py-2 text-xs text-slate-700 focus:ring-1 focus:ring-teal-600 focus:border-teal-600 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Aircraft Type</label>
                    <input
                      type="text"
                      name="aircraft_type"
                      value={formData.aircraft_type}
                      onChange={handleInputChange}
                      placeholder="e.g. B737-800, A320"
                      className="w-full rounded border border-slate-300 px-3.5 py-2 text-xs text-slate-700 focus:ring-1 focus:ring-teal-600 focus:border-teal-600 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Flight Status</label>
                    <input
                      type="text"
                      name="flight_status"
                      value={formData.flight_status}
                      onChange={handleInputChange}
                      placeholder="Status"
                      className="w-full rounded border border-slate-300 px-3.5 py-2 text-xs text-slate-700 focus:ring-1 focus:ring-teal-600 focus:border-teal-600 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Cargo Weight (kg)</label>
                    <input
                      type="text"
                      name="cargo_weight"
                      value={formData.cargo_weight}
                      onChange={handleInputChange}
                      placeholder="Weight in kg"
                      className="w-full rounded border border-slate-300 px-3.5 py-2 text-xs text-slate-700 focus:ring-1 focus:ring-teal-600 focus:border-teal-600 bg-white font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 4: DETAILS (Position & Airport) */}
              <div className="border border-slate-200 rounded-md p-5 bg-white">
                <div className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-teal-600" /> 4. Details (Position & Airport)
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Departure <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="departure"
                      value={formData.departure}
                      onChange={handleInputChange}
                      placeholder="e.g. BOM / VIDP"
                      className="w-full rounded border border-slate-300 px-3.5 py-2 text-xs text-slate-800 focus:ring-1 focus:ring-teal-600 focus:border-teal-600 bg-white font-semibold"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Destination <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="destination"
                      value={formData.destination}
                      onChange={handleInputChange}
                      placeholder="e.g. DEL / VABB"
                      className="w-full rounded border border-slate-300 px-3.5 py-2 text-xs text-slate-800 focus:ring-1 focus:ring-teal-600 focus:border-teal-600 bg-white font-semibold"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Diverted To</label>
                    <input
                      type="text"
                      name="diverted_to"
                      value={formData.diverted_to}
                      onChange={handleInputChange}
                      placeholder="Diversion airport"
                      className="w-full rounded border border-slate-300 px-3.5 py-2 text-xs text-slate-700 focus:ring-1 focus:ring-teal-600 focus:border-teal-600 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Flight Phase</label>
                    <select
                      name="flight_phase"
                      value={formData.flight_phase}
                      onChange={handleInputChange}
                      className="w-full rounded border border-slate-300 px-3.5 py-2 text-xs text-slate-700 focus:ring-1 focus:ring-teal-600 focus:border-teal-600 bg-white"
                    >
                      <option value="">Select Phase</option>
                      {FLIGHT_PHASES.map((phase) => (
                        <option key={phase} value={phase}>{phase}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Latitude / Longitude</label>
                    <input
                      type="text"
                      name="lat_long"
                      value={formData.lat_long}
                      onChange={handleInputChange}
                      placeholder="Coordinates"
                      className="w-full rounded border border-slate-300 px-3.5 py-2 text-xs text-slate-700 focus:ring-1 focus:ring-teal-600 focus:border-teal-600 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Location - Airport</label>
                    <input
                      type="text"
                      name="location_airport"
                      value={formData.location_airport}
                      onChange={handleInputChange}
                      placeholder="Airport name"
                      className="w-full rounded border border-slate-300 px-3.5 py-2 text-xs text-slate-700 focus:ring-1 focus:ring-teal-600 focus:border-teal-600 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Nature of Flight</label>
                    <select
                      name="nature_of_flight"
                      value={formData.nature_of_flight}
                      onChange={handleInputChange}
                      className="w-full rounded border border-slate-300 px-3.5 py-2 text-xs text-slate-700 focus:ring-1 focus:ring-teal-600 focus:border-teal-600 bg-white"
                    >
                      {NATURE_OF_FLIGHT_OPTIONS.map((nature) => (
                        <option key={nature} value={nature}>{nature}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Flight Level (FL)</label>
                    <input
                      type="text"
                      name="flight_level"
                      value={formData.flight_level}
                      onChange={handleInputChange}
                      placeholder="e.g. FL360"
                      className="w-full rounded border border-slate-300 px-3.5 py-2 text-xs text-slate-700 focus:ring-1 focus:ring-teal-600 focus:border-teal-600 bg-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Altitude (ft)</label>
                    <input
                      type="text"
                      name="altitude_ft"
                      value={formData.altitude_ft}
                      onChange={handleInputChange}
                      placeholder="e.g. 36000"
                      className="w-full rounded border border-slate-300 px-3.5 py-2 text-xs text-slate-700 focus:ring-1 focus:ring-teal-600 focus:border-teal-600 bg-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Height AGL (ft)</label>
                    <input
                      type="text"
                      name="height_agl_ft"
                      value={formData.height_agl_ft}
                      onChange={handleInputChange}
                      placeholder="e.g. 1500"
                      className="w-full rounded border border-slate-300 px-3.5 py-2 text-xs text-slate-700 focus:ring-1 focus:ring-teal-600 focus:border-teal-600 bg-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Speed (knots)</label>
                    <input
                      type="text"
                      name="speed_knots"
                      value={formData.speed_knots}
                      onChange={handleInputChange}
                      placeholder="e.g. 450"
                      className="w-full rounded border border-slate-300 px-3.5 py-2 text-xs text-slate-700 focus:ring-1 focus:ring-teal-600 focus:border-teal-600 bg-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Speed (mach)</label>
                    <input
                      type="text"
                      name="speed_mach"
                      value={formData.speed_mach}
                      onChange={handleInputChange}
                      placeholder="e.g. M 0.78"
                      className="w-full rounded border border-slate-300 px-3.5 py-2 text-xs text-slate-700 focus:ring-1 focus:ring-teal-600 focus:border-teal-600 bg-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Crew Count</label>
                    <input
                      type="number"
                      name="number_of_crew"
                      value={formData.number_of_crew}
                      onChange={handleInputChange}
                      placeholder="e.g. 6"
                      className="w-full rounded border border-slate-300 px-3.5 py-2 text-xs text-slate-700 focus:ring-1 focus:ring-teal-600 focus:border-teal-600 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Passenger Count</label>
                    <input
                      type="number"
                      name="number_of_pax"
                      value={formData.number_of_pax}
                      onChange={handleInputChange}
                      placeholder="e.g. 174"
                      className="w-full rounded border border-slate-300 px-3.5 py-2 text-xs text-slate-700 focus:ring-1 focus:ring-teal-600 focus:border-teal-600 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Runway Used</label>
                    <input
                      type="text"
                      name="runway_used"
                      value={formData.runway_used}
                      onChange={handleInputChange}
                      placeholder="e.g. 27R"
                      className="w-full rounded border border-slate-300 px-3.5 py-2 text-xs text-slate-700 focus:ring-1 focus:ring-teal-600 focus:border-teal-600 bg-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Condition</label>
                    <input
                      type="text"
                      name="runway_condition"
                      value={formData.runway_condition}
                      onChange={handleInputChange}
                      placeholder="Dry / Wet / Slush"
                      className="w-full rounded border border-slate-300 px-3.5 py-2 text-xs text-slate-700 focus:ring-1 focus:ring-teal-600 focus:border-teal-600 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">RVR</label>
                    <input
                      type="text"
                      name="rvr"
                      value={formData.rvr}
                      onChange={handleInputChange}
                      placeholder="e.g. 1200m"
                      className="w-full rounded border border-slate-300 px-3.5 py-2 text-xs text-slate-700 focus:ring-1 focus:ring-teal-600 focus:border-teal-600 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Take-off Weight (kg)</label>
                    <input
                      type="text"
                      name="takeoff_weight"
                      value={formData.takeoff_weight}
                      onChange={handleInputChange}
                      placeholder="e.g. 72000"
                      className="w-full rounded border border-slate-300 px-3.5 py-2 text-xs text-slate-700 focus:ring-1 focus:ring-teal-600 focus:border-teal-600 bg-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Landing Weight (kg)</label>
                    <input
                      type="text"
                      name="landing_weight"
                      value={formData.landing_weight}
                      onChange={handleInputChange}
                      placeholder="e.g. 64000"
                      className="w-full rounded border border-slate-300 px-3.5 py-2 text-xs text-slate-700 focus:ring-1 focus:ring-teal-600 focus:border-teal-600 bg-white font-mono"
                    />
                  </div>
                </div>

                {/* Operations & ATC Toggles */}
                <div className="pt-3 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                      <input
                        type="checkbox"
                        name="cvr_download_requested"
                        checked={formData.cvr_download_requested}
                        onChange={handleInputChange}
                        className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4"
                      />
                      <span>CVR Download Requested</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                      <input
                        type="checkbox"
                        name="techlog_entry"
                        checked={formData.techlog_entry}
                        onChange={handleInputChange}
                        className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4"
                      />
                      <span>Techlog Entry</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                      <input
                        type="checkbox"
                        name="atc_informed"
                        checked={formData.atc_informed}
                        onChange={handleInputChange}
                        className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4"
                      />
                      <span>ATC Informed</span>
                    </label>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">ATC Unit</label>
                    <input
                      type="text"
                      name="atc_unit"
                      value={formData.atc_unit}
                      onChange={handleInputChange}
                      placeholder="ATC frequency or unit"
                      className="w-full rounded border border-slate-300 px-3.5 py-2 text-xs text-slate-700 focus:ring-1 focus:ring-teal-600 focus:border-teal-600 bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">At Time</label>
                      <input
                        type="time"
                        name="atc_time"
                        value={formData.atc_time}
                        onChange={handleInputChange}
                        className="w-full rounded border border-slate-300 px-2 py-2 text-xs text-slate-700 focus:ring-1 focus:ring-teal-600 focus:border-teal-600 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Delay (HH:MM)</label>
                      <input
                        type="text"
                        name="delay"
                        value={formData.delay}
                        onChange={handleInputChange}
                        placeholder="00:20"
                        className="w-full rounded border border-slate-300 px-2 py-2 text-xs text-slate-700 focus:ring-1 focus:ring-teal-600 focus:border-teal-600 bg-white"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 5: AIRCRAFT CONFIGURATION */}
              <div className="border border-slate-200 rounded-md p-5 bg-white">
                <div className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
                  <Settings className="w-3.5 h-3.5 text-teal-600" /> 5. Aircraft Configuration
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Autopilot</label>
                    <input
                      type="text"
                      name="autopilot"
                      value={formData.autopilot}
                      onChange={handleInputChange}
                      placeholder="Engaged / Off"
                      className="w-full rounded border border-slate-300 px-3 py-2 text-xs text-slate-700 focus:ring-1 focus:ring-teal-600 focus:border-teal-600 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Autothrottle</label>
                    <input
                      type="text"
                      name="autothrottle"
                      value={formData.autothrottle}
                      onChange={handleInputChange}
                      placeholder="Engaged / Off"
                      className="w-full rounded border border-slate-300 px-3 py-2 text-xs text-slate-700 focus:ring-1 focus:ring-teal-600 focus:border-teal-600 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Spoilers</label>
                    <input
                      type="text"
                      name="spoilers"
                      value={formData.spoilers}
                      onChange={handleInputChange}
                      placeholder="Armed / Retracted"
                      className="w-full rounded border border-slate-300 px-3 py-2 text-xs text-slate-700 focus:ring-1 focus:ring-teal-600 focus:border-teal-600 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Flap Setting</label>
                    <input
                      type="text"
                      name="flap_setting"
                      value={formData.flap_setting}
                      onChange={handleInputChange}
                      placeholder="Flaps 1, 5, 15, 30"
                      className="w-full rounded border border-slate-300 px-3 py-2 text-xs text-slate-700 focus:ring-1 focus:ring-teal-600 focus:border-teal-600 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Slats</label>
                    <input
                      type="text"
                      name="slats"
                      value={formData.slats}
                      onChange={handleInputChange}
                      placeholder="Extended / Retracted"
                      className="w-full rounded border border-slate-300 px-3 py-2 text-xs text-slate-700 focus:ring-1 focus:ring-teal-600 focus:border-teal-600 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Landing Gear</label>
                    <input
                      type="text"
                      name="landing_gear"
                      value={formData.landing_gear}
                      onChange={handleInputChange}
                      placeholder="Up / Down"
                      className="w-full rounded border border-slate-300 px-3 py-2 text-xs text-slate-700 focus:ring-1 focus:ring-teal-600 focus:border-teal-600 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 6: DESCRIPTION */}
              <div className="border border-slate-200 rounded-md p-5 bg-white">
                <div className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-teal-600" /> 6. Occurrence Description
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Description <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={5}
                    placeholder="Provide a detailed narrative of the occurrence including sequence of events, symptoms, crew actions, and outcome..."
                    className="w-full rounded border border-slate-300 px-4 py-3 text-xs text-slate-800 focus:ring-1 focus:ring-teal-600 focus:border-teal-600 bg-white leading-relaxed"
                    required
                  />
                  <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1">
                    <span>Ensure all indications, altitudes, and communications are noted.</span>
                    <span>{formData.description.length} characters</span>
                  </div>
                </div>
              </div>

              {/* SECTION 7: CREW */}
              <div className="border border-slate-200 rounded-md p-5 bg-white">
                <div className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-teal-600" /> 7. Crew
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Captain</label>
                    <input
                      type="text"
                      name="captain"
                      value={formData.captain}
                      onChange={handleInputChange}
                      placeholder="Captain name"
                      className="w-full rounded border border-slate-300 px-3.5 py-2 text-xs text-slate-700 focus:ring-1 focus:ring-teal-600 focus:border-teal-600 bg-white font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">First Officer</label>
                    <input
                      type="text"
                      name="first_officer"
                      value={formData.first_officer}
                      onChange={handleInputChange}
                      placeholder="First Officer name"
                      className="w-full rounded border border-slate-300 px-3.5 py-2 text-xs text-slate-700 focus:ring-1 focus:ring-teal-600 focus:border-teal-600 bg-white font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">SCCM</label>
                    <input
                      type="text"
                      name="sccm"
                      value={formData.sccm}
                      onChange={handleInputChange}
                      placeholder="Senior Cabin Crew Member"
                      className="w-full rounded border border-slate-300 px-3.5 py-2 text-xs text-slate-700 focus:ring-1 focus:ring-teal-600 focus:border-teal-600 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">CCM 1</label>
                    <input
                      type="text"
                      name="ccm1"
                      value={formData.ccm1}
                      onChange={handleInputChange}
                      placeholder="Cabin Crew Member 1"
                      className="w-full rounded border border-slate-300 px-3.5 py-2 text-xs text-slate-700 focus:ring-1 focus:ring-teal-600 focus:border-teal-600 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">CCM 2</label>
                    <input
                      type="text"
                      name="ccm2"
                      value={formData.ccm2}
                      onChange={handleInputChange}
                      placeholder="Cabin Crew Member 2"
                      className="w-full rounded border border-slate-300 px-3.5 py-2 text-xs text-slate-700 focus:ring-1 focus:ring-teal-600 focus:border-teal-600 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">CCM 3</label>
                    <input
                      type="text"
                      name="ccm3"
                      value={formData.ccm3}
                      onChange={handleInputChange}
                      placeholder="Cabin Crew Member 3"
                      className="w-full rounded border border-slate-300 px-3.5 py-2 text-xs text-slate-700 focus:ring-1 focus:ring-teal-600 focus:border-teal-600 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">CCM 4</label>
                    <input
                      type="text"
                      name="ccm4"
                      value={formData.ccm4}
                      onChange={handleInputChange}
                      placeholder="Cabin Crew Member 4"
                      className="w-full rounded border border-slate-300 px-3.5 py-2 text-xs text-slate-700 focus:ring-1 focus:ring-teal-600 focus:border-teal-600 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">CCM 5</label>
                    <input
                      type="text"
                      name="ccm5"
                      value={formData.ccm5}
                      onChange={handleInputChange}
                      placeholder="Cabin Crew Member 5"
                      className="w-full rounded border border-slate-300 px-3.5 py-2 text-xs text-slate-700 focus:ring-1 focus:ring-teal-600 focus:border-teal-600 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Observer</label>
                    <input
                      type="text"
                      name="observer"
                      value={formData.observer}
                      onChange={handleInputChange}
                      placeholder="Observer"
                      className="w-full rounded border border-slate-300 px-3.5 py-2 text-xs text-slate-700 focus:ring-1 focus:ring-teal-600 focus:border-teal-600 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Observer 2</label>
                    <input
                      type="text"
                      name="observer_2"
                      value={formData.observer_2}
                      onChange={handleInputChange}
                      placeholder="Observer 2"
                      className="w-full rounded border border-slate-300 px-3.5 py-2 text-xs text-slate-700 focus:ring-1 focus:ring-teal-600 focus:border-teal-600 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 8: FLIGHT METEOROLOGICAL */}
              <div className="border border-slate-200 rounded-md p-5 bg-white">
                <div className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
                  <Cloud className="w-3.5 h-3.5 text-teal-600" /> 8. Flight Meteorological
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Wind Bearing (deg)</label>
                    <input
                      type="text"
                      name="wind_bearing"
                      value={formData.wind_bearing}
                      onChange={handleInputChange}
                      placeholder="e.g. 270"
                      className="w-full rounded border border-slate-300 px-3.5 py-2 text-xs text-slate-700 focus:ring-1 focus:ring-teal-600 focus:border-teal-600 bg-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Wind Velocity (kt)</label>
                    <input
                      type="text"
                      name="wind_velocity"
                      value={formData.wind_velocity}
                      onChange={handleInputChange}
                      placeholder="e.g. 15"
                      className="w-full rounded border border-slate-300 px-3.5 py-2 text-xs text-slate-700 focus:ring-1 focus:ring-teal-600 focus:border-teal-600 bg-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Temperature (°C)</label>
                    <input
                      type="text"
                      name="temperature_c"
                      value={formData.temperature_c}
                      onChange={handleInputChange}
                      placeholder="e.g. 24"
                      className="w-full rounded border border-slate-300 px-3.5 py-2 text-xs text-slate-700 focus:ring-1 focus:ring-teal-600 focus:border-teal-600 bg-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">QNH (mbar)</label>
                    <input
                      type="text"
                      name="qnh"
                      value={formData.qnh}
                      onChange={handleInputChange}
                      placeholder="e.g. 1013"
                      className="w-full rounded border border-slate-300 px-3.5 py-2 text-xs text-slate-700 focus:ring-1 focus:ring-teal-600 focus:border-teal-600 bg-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Visibility (m)</label>
                    <input
                      type="text"
                      name="visibility_m"
                      value={formData.visibility_m}
                      onChange={handleInputChange}
                      placeholder="e.g. 5000"
                      className="w-full rounded border border-slate-300 px-3.5 py-2 text-xs text-slate-700 focus:ring-1 focus:ring-teal-600 focus:border-teal-600 bg-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Condition</label>
                    <select
                      name="meteorological_condition"
                      value={formData.meteorological_condition}
                      onChange={handleInputChange}
                      className="w-full rounded border border-slate-300 px-3.5 py-2 text-xs text-slate-700 focus:ring-1 focus:ring-teal-600 focus:border-teal-600 bg-white"
                    >
                      <option value="">Select Condition</option>
                      <option value="VMC">VMC (Visual)</option>
                      <option value="IMC">IMC (Instrument)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Light Condition</label>
                    <select
                      name="light_condition"
                      value={formData.light_condition}
                      onChange={handleInputChange}
                      className="w-full rounded border border-slate-300 px-3.5 py-2 text-xs text-slate-700 focus:ring-1 focus:ring-teal-600 focus:border-teal-600 bg-white"
                    >
                      <option value="">Select Light</option>
                      <option value="Day">Day</option>
                      <option value="Night">Night</option>
                      <option value="Dawn">Dawn</option>
                      <option value="Dusk">Dusk</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Cloud Ceiling (ft)</label>
                    <input
                      type="text"
                      name="cloud_ceiling_ft"
                      value={formData.cloud_ceiling_ft}
                      onChange={handleInputChange}
                      placeholder="e.g. 3000"
                      className="w-full rounded border border-slate-300 px-3.5 py-2 text-xs text-slate-700 focus:ring-1 focus:ring-teal-600 focus:border-teal-600 bg-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Precipitation</label>
                    <input
                      type="text"
                      name="precipitation"
                      value={formData.precipitation}
                      onChange={handleInputChange}
                      placeholder="None / Rain / Hail"
                      className="w-full rounded border border-slate-300 px-3.5 py-2 text-xs text-slate-700 focus:ring-1 focus:ring-teal-600 focus:border-teal-600 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Icing</label>
                    <select
                      name="icing"
                      value={formData.icing}
                      onChange={handleInputChange}
                      className="w-full rounded border border-slate-300 px-3.5 py-2 text-xs text-slate-700 focus:ring-1 focus:ring-teal-600 focus:border-teal-600 bg-white"
                    >
                      <option value="">Select Icing</option>
                      <option value="None">None</option>
                      <option value="Trace">Trace</option>
                      <option value="Light">Light</option>
                      <option value="Moderate">Moderate</option>
                      <option value="Severe">Severe</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Turbulence</label>
                    <select
                      name="turbulence"
                      value={formData.turbulence}
                      onChange={handleInputChange}
                      className="w-full rounded border border-slate-300 px-3.5 py-2 text-xs text-slate-700 focus:ring-1 focus:ring-teal-600 focus:border-teal-600 bg-white"
                    >
                      <option value="">Select Turbulence</option>
                      <option value="None">None</option>
                      <option value="Light">Light</option>
                      <option value="Moderate">Moderate</option>
                      <option value="Severe">Severe</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Flying (Sun)</label>
                    <select
                      name="flying_sun"
                      value={formData.flying_sun}
                      onChange={handleInputChange}
                      className="w-full rounded border border-slate-300 px-3.5 py-2 text-xs text-slate-700 focus:ring-1 focus:ring-teal-600 focus:border-teal-600 bg-white"
                    >
                      <option value="">Select Direction</option>
                      <option value="Into the Sun">Into the Sun</option>
                      <option value="Out of the Sun">Out of the Sun</option>
                    </select>
                  </div>

                  <div className="sm:col-span-3 lg:col-span-4">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Additional Information</label>
                    <input
                      type="text"
                      name="additional_info"
                      value={formData.additional_info}
                      onChange={handleInputChange}
                      placeholder="Supplementary meteorological details"
                      className="w-full rounded border border-slate-300 px-3.5 py-2 text-xs text-slate-700 focus:ring-1 focus:ring-teal-600 focus:border-teal-600 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 9: ATTACHMENTS */}
              <div className="border border-slate-200 rounded-md p-5 bg-white">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
                  <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <Paperclip className="w-3.5 h-3.5 text-teal-600" /> 9. Attachments
                  </div>
                  <button type="button" className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1">
                    Upload File
                  </button>
                </div>

                <div className="border border-dashed border-slate-300 rounded p-6 text-center bg-slate-50">
                  <Paperclip className="w-5 h-5 text-slate-400 mx-auto mb-1.5" />
                  <p className="text-xs text-slate-600 font-medium">No attachments uploaded</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Attach relevant flight data, photos, or ATC logs</p>
                </div>
              </div>

            </div>

            {/* Bottom Actions */}
            <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                className="flex items-center gap-2 px-3.5 py-2 border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 rounded text-xs font-semibold transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" /> Download Blank Form
              </button>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 rounded text-xs font-semibold transition-colors"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => alert('Draft saved.')}
                  className="flex items-center gap-1.5 px-4 py-2 border border-teal-600 bg-white hover:bg-teal-50 text-teal-700 rounded text-xs font-semibold transition-colors"
                >
                  <Save className="w-3.5 h-3.5" /> Save Draft
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded text-xs font-bold transition-colors shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" /> Submit Report
                </button>
              </div>
            </div>

          </form>

        </div>
      </main>

      {/* Voice Prompt Help Modal */}
      {showVoiceHelp && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-lg w-full border border-slate-300 shadow-xl overflow-hidden">
            <div className="bg-[#111c2e] text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-sm">
                <Sparkles className="w-4 h-4 text-teal-400" /> Spoken Reporting Format
              </div>
              <button onClick={() => setShowVoiceHelp(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 text-xs text-slate-600 space-y-3 leading-relaxed">
              <p>
                Click <strong>"Start Voice Autofill"</strong> and speak your report in natural pilot reporting sequence:
              </p>
              <div className="bg-slate-50 border border-slate-200 p-3 rounded font-mono text-[11px] text-slate-800 leading-relaxed">
                "Flight QP 842, aircraft registration VT-YAA from Mumbai to Delhi on October 8th. Cruising at Flight Level 350 at 440 knots, encountered severe turbulence and moderate icing at 04:30 UTC. Autopilot disengaged. Captain Rohit and First Officer Rahul. ATC informed."
              </div>
              <p>
                Click <strong>"Stop Recording"</strong> when finished. Azure Speech and Azure OpenAI will transcribe the audio and populate the fields automatically.
              </p>
            </div>
            <div className="bg-slate-50 border-t border-slate-200 p-3 flex justify-end">
              <button 
                onClick={() => setShowVoiceHelp(false)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
