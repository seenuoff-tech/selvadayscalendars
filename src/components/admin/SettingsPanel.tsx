import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, Loader2, CheckCircle2 } from 'lucide-react';

export const SettingsPanel: React.FC = () => {
  const [whatsappNumber, setWhatsappNumber] = useState('9080917850');
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.settings) {
          setWhatsappNumber(data.settings.whatsappNumber || '9080917850');
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ whatsappNumber })
      });
      if (res.ok) {
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-slate-500">Loading settings...</div>;
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden max-w-2xl">
      <div className="p-6 border-b border-slate-200 bg-slate-50 flex items-center gap-3">
        <SettingsIcon className="w-6 h-6 text-[#0C8D99]" />
        <h2 className="text-xl font-bold text-slate-900">Store Settings</h2>
      </div>

      <div className="p-6 space-y-6">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Admin WhatsApp Number</label>
          <p className="text-xs text-slate-500 mb-3">
            This is the phone number where customer orders will be sent when they click "Send via WhatsApp".
            Include country code if outside India, otherwise just the 10-digit number.
          </p>
          <input
            type="text"
            value={whatsappNumber}
            onChange={(e) => setWhatsappNumber(e.target.value)}
            placeholder="e.g. 9080917850"
            className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0C8D99] focus:border-transparent transition-all"
          />
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          {isSaved ? (
            <span className="text-emerald-600 font-semibold flex items-center gap-1.5 text-sm">
              <CheckCircle2 className="w-4 h-4" /> Settings Saved!
            </span>
          ) : <span></span>}
          
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-[#0C8D99] hover:bg-[#0a7983] text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-sm transition-colors disabled:opacity-70"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
};
