import React, { useState, useEffect } from 'react';
import { Coins, Save, Check, RefreshCw, AlertCircle, Eye, HelpCircle, CheckCircle2 } from 'lucide-react';
import { WebsiteContent } from '../shared/types.ts';
import { useContent } from '../context/ContentContext.tsx';

interface EstimatedInvestmentManagerProps {
  editableData: WebsiteContent;
  setEditableData: React.Dispatch<React.SetStateAction<WebsiteContent>>;
  onSave?: () => Promise<void>;
  showToast?: (type: 'success' | 'error' | 'info', message: string) => void;
}

export const EstimatedInvestmentManager: React.FC<EstimatedInvestmentManagerProps> = ({
  editableData,
  setEditableData,
  onSave,
  showToast,
}) => {
  const { content, publishContent } = useContent();

  const savedEstimate = content.settings?.estimatedInvestment || {
    minAmount: 2500000,
    maxAmount: 4500000,
    currency: '₹',
    currencyCode: 'INR',
    shortDescription:
      'Estimated construction budget; final cost depends on design, materials, specifications, and site conditions.',
    isActive: true,
  };

  const currentEstimate = editableData.settings?.estimatedInvestment || savedEstimate;

  const [minInput, setMinInput] = useState<string>(String(currentEstimate.minAmount || '2500000'));
  const [maxInput, setMaxInput] = useState<string>(
    currentEstimate.maxAmount ? String(currentEstimate.maxAmount) : '4500000'
  );
  const [currency, setCurrency] = useState<string>(currentEstimate.currency || '₹');
  const [currencyCode, setCurrencyCode] = useState<string>(currentEstimate.currencyCode || 'INR');
  const [description, setDescription] = useState<string>(
    currentEstimate.shortDescription ||
      'Estimated construction budget; final cost depends on design, materials, specifications, and site conditions.'
  );
  const [isActive, setIsActive] = useState<boolean>(currentEstimate.isActive !== false);

  const [validationError, setValidationError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [isSavingLocal, setIsSavingLocal] = useState<boolean>(false);

  // Sync state if external editableData updates
  useEffect(() => {
    if (editableData.settings?.estimatedInvestment) {
      const est = editableData.settings.estimatedInvestment;
      setMinInput(String(est.minAmount ?? ''));
      setMaxInput(est.maxAmount ? String(est.maxAmount) : '');
      setCurrency(est.currency || '₹');
      setCurrencyCode(est.currencyCode || 'INR');
      setDescription(est.shortDescription || '');
      setIsActive(est.isActive !== false);
    }
  }, [editableData.settings?.estimatedInvestment]);

  // Clean numeric string
  const cleanNumber = (val: string): number => {
    const cleaned = val.replace(/[^0-9]/g, '');
    return cleaned ? parseInt(cleaned, 10) : 0;
  };

  const parsedMin = cleanNumber(minInput);
  const parsedMax = cleanNumber(maxInput);

  // Validate form
  const validate = (): string | null => {
    if (!minInput.trim() || parsedMin <= 0) {
      return 'Please enter a valid minimum estimated investment amount greater than zero.';
    }
    if (maxInput.trim() && parsedMax > 0 && parsedMax < parsedMin) {
      return 'Maximum investment must be greater than or equal to the minimum investment.';
    }
    return null;
  };

  // Apply changes to parent editableData state
  const applyToState = (
    newMin: number,
    newMax: number,
    newCurr: string,
    newCode: string,
    newDesc: string,
    newActive: boolean
  ) => {
    setEditableData((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        estimatedInvestment: {
          minAmount: newMin,
          maxAmount: newMax > 0 ? newMax : undefined,
          currency: newCurr,
          currencyCode: newCode,
          shortDescription: newDesc.trim(),
          isActive: newActive,
        },
      },
    }));
  };

  // Handle Save
  const handleSave = async () => {
    setValidationError(null);
    const err = validate();
    if (err) {
      setValidationError(err);
      if (showToast) showToast('error', err);
      return;
    }

    setIsSavingLocal(true);
    setSaveSuccess(false);

    try {
      const updatedInvestment = {
        minAmount: parsedMin,
        maxAmount: parsedMax > 0 ? parsedMax : undefined,
        currency: currency.trim() || '₹',
        currencyCode: currencyCode.trim() || 'INR',
        shortDescription: description.trim(),
        isActive,
      };

      const updatedData: WebsiteContent = {
        ...editableData,
        settings: {
          ...editableData.settings,
          estimatedInvestment: updatedInvestment,
        },
      };

      // Update editableData in parent
      setEditableData(updatedData);

      // Persist live to backend and Supabase
      const res = await publishContent(updatedData);

      if (res.success) {
        setSaveSuccess(true);
        if (showToast) {
          showToast('success', 'Estimated Investment updated and saved live to public website!');
        }
        setTimeout(() => setSaveSuccess(false), 4000);
      } else {
        setValidationError(res.error || 'Failed to save changes to server.');
        if (showToast) {
          showToast('error', res.error || 'Failed to save changes.');
        }
      }
    } catch (saveErr: any) {
      setValidationError(saveErr.message || 'An error occurred while saving.');
      if (showToast) {
        showToast('error', saveErr.message || 'Save error.');
      }
    } finally {
      setIsSavingLocal(false);
    }
  };

  // Restore currently saved values from server/live content
  const handleRestoreSaved = () => {
    const orig = content.settings?.estimatedInvestment || savedEstimate;
    setMinInput(String(orig.minAmount || '2500000'));
    setMaxInput(orig.maxAmount ? String(orig.maxAmount) : '4500000');
    setCurrency(orig.currency || '₹');
    setCurrencyCode(orig.currencyCode || 'INR');
    setDescription(orig.shortDescription || '');
    setIsActive(orig.isActive !== false);
    setValidationError(null);

    applyToState(
      orig.minAmount || 2500000,
      orig.maxAmount || 4500000,
      orig.currency || '₹',
      orig.currencyCode || 'INR',
      orig.shortDescription || '',
      orig.isActive !== false
    );

    if (showToast) {
      showToast('info', 'Reverted inputs to currently saved values.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200 dark:border-stone-800">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Coins className="w-3.5 h-3.5" />
            <span>Pricing &amp; Investment</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-serif text-stone-900 dark:text-stone-100">
            Estimated Investment
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 max-w-2xl leading-relaxed">
            Manage the overall estimated construction budget range displayed on the public website (Cost Calculator &amp; Packages sections). Note: This is distinct from the construction rate per square foot.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRestoreSaved}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 transition-colors cursor-pointer"
            title="Restore last saved values from server"
          >
            Review Saved
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSavingLocal}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-stone-950 flex items-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-60"
          >
            {isSavingLocal ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Saving to Supabase...</span>
              </>
            ) : saveSuccess ? (
              <>
                <Check className="w-4 h-4 text-emerald-950 font-bold" />
                <span>Saved &amp; Published!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Status Feedback Banners */}
      {saveSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-3 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <p className="font-bold">Estimated Investment successfully updated!</p>
            <p className="text-[11px] opacity-90 mt-0.5">
              The updated figures are now live on the public website and saved permanently in your Supabase database.
            </p>
          </div>
        </div>
      )}

      {validationError && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-800 text-red-800 dark:text-red-300 text-xs font-semibold flex items-center gap-3 animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <div>
            <p className="font-bold">Invalid Value</p>
            <p className="text-[11px] opacity-90 mt-0.5">{validationError}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Editor Form (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-stone-900 rounded-xl p-5 sm:p-6 border border-stone-200 dark:border-stone-800 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
            <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 uppercase tracking-wider">
              Budget Range Configuration
            </h3>
            <label className="flex items-center gap-2 text-xs font-semibold text-stone-700 dark:text-stone-300 cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => {
                  setIsActive(e.target.checked);
                  applyToState(parsedMin, parsedMax, currency, currencyCode, description, e.target.checked);
                }}
                className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 cursor-pointer"
              />
              <span>Display on Public Website</span>
            </label>
          </div>

          {/* Currency Configuration */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                Currency Symbol
              </label>
              <select
                value={currency}
                onChange={(e) => {
                  const val = e.target.value;
                  setCurrency(val);
                  const code = val === '₹' ? 'INR' : val === '$' ? 'USD' : val === '€' ? 'EUR' : 'INR';
                  setCurrencyCode(code);
                  applyToState(parsedMin, parsedMax, val, code, description, isActive);
                }}
                className="w-full px-3 py-2.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs font-bold"
              >
                <option value="₹">₹ (INR - Indian Rupee)</option>
                <option value="$">$ (USD - US Dollar)</option>
                <option value="€">€ (EUR - Euro)</option>
                <option value="AED">AED (UAE Dirham)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                Currency Code
              </label>
              <input
                type="text"
                value={currencyCode}
                onChange={(e) => {
                  setCurrencyCode(e.target.value);
                  applyToState(parsedMin, parsedMax, currency, e.target.value, description, isActive);
                }}
                className="w-full px-3 py-2.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs font-mono font-bold"
                placeholder="INR"
              />
            </div>
          </div>

          {/* Min & Max Investment */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                Minimum Investment ({currency}) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-stone-400 font-bold">{currency}</span>
                <input
                  type="text"
                  value={minInput}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^0-9]/g, '');
                    setMinInput(raw);
                    const num = parseInt(raw || '0', 10);
                    applyToState(num, parsedMax, currency, currencyCode, description, isActive);
                  }}
                  placeholder="2500000"
                  className="w-full pl-8 pr-3 py-2.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs font-mono font-bold text-stone-900 dark:text-stone-100"
                />
              </div>
              <p className="text-[10px] text-stone-400 mt-1">
                Formatted: {currency}
                {parsedMin.toLocaleString('en-IN')}
                {parsedMin >= 100000 && ` (${(parsedMin / 100000).toFixed(2)} Lakhs)`}
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                Maximum Investment ({currency}) <span className="text-stone-400 font-normal">(Optional range)</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-stone-400 font-bold">{currency}</span>
                <input
                  type="text"
                  value={maxInput}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^0-9]/g, '');
                    setMaxInput(raw);
                    const num = parseInt(raw || '0', 10);
                    applyToState(parsedMin, num, currency, currencyCode, description, isActive);
                  }}
                  placeholder="4500000"
                  className="w-full pl-8 pr-3 py-2.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs font-mono font-bold text-stone-900 dark:text-stone-100"
                />
              </div>
              <p className="text-[10px] text-stone-400 mt-1">
                {parsedMax > 0 ? (
                  <>
                    Formatted: {currency}
                    {parsedMax.toLocaleString('en-IN')}
                    {parsedMax >= 100000 && ` (${(parsedMax / 100000).toFixed(2)} Lakhs)`}
                  </>
                ) : (
                  'Leave blank or 0 for single price instead of range'
                )}
              </p>
            </div>
          </div>

          {/* Short Description Below Amount */}
          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
              Short Description &amp; Disclaimer Below Amount
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                applyToState(parsedMin, parsedMax, currency, currencyCode, e.target.value, isActive);
              }}
              placeholder="Estimated construction budget; final cost depends on design, materials, specifications, and site conditions."
              className="w-full px-3 py-2.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs text-stone-900 dark:text-stone-100"
            />
            <p className="text-[10px] text-stone-400 mt-1">
              Appears directly under the investment figures on the public website to set clear client expectations.
            </p>
          </div>
        </div>

        {/* Live Public Website Preview (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-stone-900 text-white rounded-2xl p-6 border border-stone-800 shadow-xl">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-stone-800">
              <Eye className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Live Public Website Preview
              </span>
            </div>

            {/* Simulated Public Showcase Card */}
            <div className="p-5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-stone-100">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[11px] uppercase font-bold text-amber-400 tracking-wider">
                  Estimated Investment
                </span>
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
                  {isActive ? 'Active' : 'Hidden'}
                </span>
              </div>

              <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-mono">
                {currency}
                {parsedMin > 0 ? parsedMin.toLocaleString('en-IN') : '25,00,000'}
                {parsedMax > 0
                  ? ` – ${currency}${parsedMax.toLocaleString('en-IN')}`
                  : ''}
              </div>

              {description && (
                <p className="text-xs text-stone-300/90 mt-2 italic leading-relaxed">
                  {description}
                </p>
              )}
            </div>

            <div className="mt-4 p-3 rounded-lg bg-stone-800/80 border border-stone-700 text-[11px] text-stone-300 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-amber-400">
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Where does this show on the website?</span>
              </div>
              <p className="text-[10px] leading-relaxed text-stone-400">
                1. Prominently in the <strong>Cost Calculator</strong> right beside the custom sq.ft calculation.
              </p>
              <p className="text-[10px] leading-relaxed text-stone-400">
                2. In the <strong>Construction Packages</strong> section as a benchmark for turnkey house building.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
