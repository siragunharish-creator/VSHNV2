import React, { useState } from 'react';
import {
  Phone,
  MessageCircle,
  Plus,
  Trash2,
  Edit2,
  Check,
  Star,
  ChevronUp,
  ChevronDown,
  AlertCircle,
  Save,
  CheckCircle2,
  PhoneCall,
  Power,
  ShieldCheck,
} from 'lucide-react';
import { BusinessContact } from '../shared/types.ts';
import {
  formatDisplayPhone,
  normalizePhoneNumber,
  validateBusinessContact,
  getWhatsAppUrl,
  getCallUrl,
  INITIAL_BUSINESS_CONTACTS,
} from '../lib/contactUtils.ts';
import { WhatsAppIcon } from '../components/WhatsAppIcon.tsx';

interface ContactManagerProps {
  contacts: BusinessContact[];
  onChange: (contacts: BusinessContact[]) => void;
  onSaveAndPublish: (contacts: BusinessContact[]) => Promise<void>;
  isSaving?: boolean;
}

export const ContactManager: React.FC<ContactManagerProps> = ({
  contacts,
  onChange,
  onSaveAndPublish,
  isSaving = false,
}) => {
  // Ensure we have a valid list of contacts
  const contactList = Array.isArray(contacts) && contacts.length > 0 ? contacts : INITIAL_BUSINESS_CONTACTS;

  const [editingContact, setEditingContact] = useState<BusinessContact | null>(null);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [formState, setFormState] = useState<{
    label: string;
    phoneNumber: string;
    isWhatsAppEnabled: boolean;
    isCallEnabled: boolean;
    isPrimary: boolean;
    isActive: boolean;
  }>({
    label: '',
    phoneNumber: '',
    isWhatsAppEnabled: true,
    isCallEnabled: true,
    isPrimary: false,
    isActive: true,
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Set single primary contact
  const handleSetPrimary = (contactId: string) => {
    const updated = contactList.map((c) => ({
      ...c,
      isPrimary: c.id === contactId,
      // If setting an inactive contact as primary, also activate it
      isActive: c.id === contactId ? true : c.isActive,
    }));
    onChange(updated);
  };

  // Toggle active/inactive status
  const handleToggleActive = (contactId: string) => {
    const target = contactList.find((c) => c.id === contactId);
    if (!target) return;

    // If trying to deactivate the primary contact, warn or prevent if it's the only one
    if (target.isPrimary && target.isActive) {
      const otherActive = contactList.find((c) => c.id !== contactId && c.isActive);
      if (!otherActive) {
        alert('You must have at least one active contact number as Primary.');
        return;
      }
      // Reassign primary to the other active contact
      const updated = contactList.map((c) => {
        if (c.id === contactId) return { ...c, isActive: false, isPrimary: false };
        if (c.id === otherActive.id) return { ...c, isPrimary: true };
        return c;
      });
      onChange(updated);
      return;
    }

    const updated = contactList.map((c) => (c.id === contactId ? { ...c, isActive: !c.isActive } : c));
    onChange(updated);
  };

  // Move order up / down
  const handleMoveOrder = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === contactList.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const items = [...contactList];
    const [moved] = items.splice(index, 1);
    items.splice(targetIndex, 0, moved);

    // Re-index display orders
    const reordered = items.map((item, idx) => ({
      ...item,
      displayOrder: idx + 1,
    }));
    onChange(reordered);
  };

  // Delete contact
  const handleDelete = (contactId: string) => {
    if (contactList.length <= 1) {
      alert('You must keep at least one contact number configured.');
      return;
    }
    const target = contactList.find((c) => c.id === contactId);
    if (target?.isPrimary) {
      alert('This is currently the Primary Contact. Please mark another contact as Primary before deleting this one.');
      return;
    }
    if (window.confirm(`Are you sure you want to delete "${target?.label}"?`)) {
      const updated = contactList
        .filter((c) => c.id !== contactId)
        .map((c, idx) => ({ ...c, displayOrder: idx + 1 }));
      onChange(updated);
    }
  };

  // Open add new modal
  const handleOpenAdd = () => {
    setFormState({
      label: '',
      phoneNumber: '',
      isWhatsAppEnabled: true,
      isCallEnabled: true,
      isPrimary: contactList.length === 0,
      isActive: true,
    });
    setFormError(null);
    setIsNewModalOpen(true);
  };

  // Open edit modal
  const handleOpenEdit = (contact: BusinessContact) => {
    setEditingContact(contact);
    setFormState({
      label: contact.label,
      phoneNumber: contact.phoneNumber,
      isWhatsAppEnabled: contact.isWhatsAppEnabled,
      isCallEnabled: contact.isCallEnabled,
      isPrimary: contact.isPrimary,
      isActive: contact.isActive,
    });
    setFormError(null);
  };

  // Save add/edit
  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const validation = validateBusinessContact(
      formState,
      contactList,
      editingContact ? editingContact.id : undefined
    );

    if (!validation.valid) {
      setFormError(validation.error || 'Please provide a valid phone number and label.');
      return;
    }

    const normalized = normalizePhoneNumber(formState.phoneNumber);
    const display = formatDisplayPhone(normalized);

    if (editingContact) {
      // Edit existing
      let updated = contactList.map((c) => {
        if (c.id === editingContact.id) {
          return {
            ...c,
            label: formState.label.trim(),
            phoneNumber: normalized,
            displayPhone: display,
            isWhatsAppEnabled: formState.isWhatsAppEnabled,
            isCallEnabled: formState.isCallEnabled,
            isPrimary: formState.isPrimary,
            isActive: formState.isActive,
            updatedAt: new Date().toISOString(),
          };
        }
        // If this contact became primary, unset others
        if (formState.isPrimary) {
          return { ...c, isPrimary: false };
        }
        return c;
      });

      // Ensure at least one primary
      if (!updated.some((c) => c.isActive && c.isPrimary)) {
        const firstActive = updated.find((c) => c.isActive) || updated[0];
        if (firstActive) firstActive.isPrimary = true;
      }

      onChange(updated);
      setEditingContact(null);
    } else {
      // Add new
      const newContact: BusinessContact = {
        id: `contact-${Date.now()}`,
        label: formState.label.trim(),
        phoneNumber: normalized,
        displayPhone: display,
        isWhatsAppEnabled: formState.isWhatsAppEnabled,
        isCallEnabled: formState.isCallEnabled,
        isPrimary: formState.isPrimary || contactList.length === 0,
        displayOrder: contactList.length + 1,
        isActive: formState.isActive,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      let updated = formState.isPrimary
        ? contactList.map((c) => ({ ...c, isPrimary: false }))
        : [...contactList];

      updated.push(newContact);
      onChange(updated);
      setIsNewModalOpen(false);
    }
  };

  const handleSavePublish = async () => {
    setSaveSuccessMsg(null);
    await onSaveAndPublish(contactList);
    setSaveSuccessMsg('All business contact numbers saved and published live to website!');
    setTimeout(() => setSaveSuccessMsg(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200 dark:border-stone-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <PhoneCall className="w-5 h-5" />
            </span>
            <h3 className="text-lg font-bold font-serif text-stone-900 dark:text-stone-100">
              Business Contact Numbers &amp; Multi-Line Management
            </h3>
          </div>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 max-w-2xl">
            Manage your company phone lines. Configure one active <strong>Primary Contact</strong> that powers the floating WhatsApp button, Call Now header button, and hero consultation CTAs. Additional numbers appear in the Contact Us section.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-stone-950 shadow-sm transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Contact Number</span>
        </button>
      </div>

      {/* Success Notification */}
      {saveSuccessMsg && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* Contacts List Grid */}
      <div className="space-y-3">
        {contactList.map((contact, index) => {
          const isPrimary = Boolean(contact.isPrimary);
          const isActive = contact.isActive !== false;

          return (
            <div
              key={contact.id}
              className={`p-4 sm:p-5 rounded-xl border transition-all duration-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                isPrimary
                  ? 'bg-amber-500/5 dark:bg-amber-500/10 border-amber-300 dark:border-amber-500/40 shadow-xs'
                  : isActive
                  ? 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700'
                  : 'bg-stone-100/70 dark:bg-stone-900/40 border-stone-200 dark:border-stone-800/60 opacity-65'
              }`}
            >
              {/* Left Details */}
              <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
                {/* Order Reordering Controls */}
                <div className="flex flex-col gap-0.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleMoveOrder(index, 'up')}
                    disabled={index === 0}
                    aria-label="Move contact up"
                    className="p-1 rounded text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 disabled:opacity-20 cursor-pointer"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMoveOrder(index, 'down')}
                    disabled={index === contactList.length - 1}
                    aria-label="Move contact down"
                    className="p-1 rounded text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 disabled:opacity-20 cursor-pointer"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Primary or Number Badge */}
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    isPrimary
                      ? 'bg-amber-500 text-stone-950 font-bold shadow-sm ring-2 ring-amber-400/50'
                      : 'bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-semibold'
                  }`}
                >
                  {isPrimary ? <Star className="w-5 h-5 fill-current" /> : <Phone className="w-4 h-4" />}
                </div>

                {/* Name, Phone, and Feature Pills */}
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100 truncate">
                      {contact.label}
                    </h4>

                    {isPrimary && (
                      <span className="px-2 py-0.5 rounded-md bg-amber-500 text-stone-950 text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1 shadow-xs">
                        <Star className="w-3 h-3 fill-current" />
                        <span>Primary Contact</span>
                      </span>
                    )}

                    {!isActive && (
                      <span className="px-2 py-0.5 rounded-md bg-stone-300 dark:bg-stone-800 text-stone-600 dark:text-stone-400 text-[10px] font-semibold uppercase">
                        Inactive
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs">
                    <span className="font-mono font-bold text-stone-900 dark:text-stone-100 text-sm">
                      {contact.displayPhone || formatDisplayPhone(contact.phoneNumber)}
                    </span>
                    <span className="text-[11px] font-mono text-stone-400">
                      ({contact.phoneNumber})
                    </span>
                  </div>

                  {/* Channel Capability Badges */}
                  <div className="flex items-center gap-2 mt-2">
                    {contact.isCallEnabled && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-500/10 text-blue-700 dark:text-blue-400 text-[10px] font-semibold">
                        <Phone className="w-3 h-3" />
                        <span>Call Enabled</span>
                      </span>
                    )}
                    {contact.isWhatsAppEnabled && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[10px] font-semibold">
                        <MessageCircle className="w-3 h-3" />
                        <span>WhatsApp Enabled</span>
                      </span>
                    )}
                    {!contact.isCallEnabled && !contact.isWhatsAppEnabled && (
                      <span className="text-[10px] text-stone-400 italic">No channels enabled</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end pt-2 md:pt-0 border-t md:border-t-0 border-stone-200 dark:border-stone-800">
                {/* Set as Primary Button */}
                {!isPrimary && (
                  <button
                    type="button"
                    onClick={() => handleSetPrimary(contact.id)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-amber-400/80 dark:border-amber-500/60 text-amber-700 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500 hover:text-stone-950 text-xs font-bold transition-all cursor-pointer"
                    title="Make this the primary contact for floating WhatsApp and Call Now CTAs"
                  >
                    <Star className="w-3.5 h-3.5" />
                    <span>Set as Primary</span>
                  </button>
                )}

                {/* Quick Toggle Active/Inactive */}
                <button
                  type="button"
                  onClick={() => handleToggleActive(contact.id)}
                  className={`p-2 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                    isActive
                      ? 'border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                      : 'border-stone-300 dark:border-stone-700 text-stone-500 hover:bg-stone-200 dark:hover:bg-stone-800'
                  }`}
                  title={isActive ? 'Click to deactivate' : 'Click to activate'}
                  aria-label={isActive ? 'Deactivate contact' : 'Activate contact'}
                >
                  <Power className="w-3.5 h-3.5" />
                </button>

                {/* Edit Button */}
                <button
                  type="button"
                  onClick={() => handleOpenEdit(contact)}
                  className="p-2 rounded-lg border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                  title="Edit contact details"
                  aria-label="Edit contact details"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>

                {/* Delete Button */}
                {!isPrimary && (
                  <button
                    type="button"
                    onClick={() => handleDelete(contact.id)}
                    className="p-2 rounded-lg border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                    title="Delete contact"
                    aria-label="Delete contact"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Primary Contact Live Synchronization Notice */}
      <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold">
            Live Synchronization Guarantee
          </p>
          <p className="text-stone-600 dark:text-stone-400 text-[11px] leading-relaxed">
            When you select or change the <strong>Primary Contact</strong>, the floating WhatsApp button, the "Call Now" header CTA, and main consultation links immediately update across the entire website. All active numbers will also be prominently displayed in the "Contact VSHN Builders" section.
          </p>
        </div>
      </div>

      {/* Save & Publish Action Bar */}
      <div className="pt-4 border-t border-stone-200 dark:border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <span className="text-xs text-stone-500 dark:text-stone-400">
          {contactList.filter((c) => c.isActive !== false).length} active contacts configured · 1 Primary contact selected
        </span>

        <button
          type="button"
          onClick={handleSavePublish}
          disabled={isSaving}
          className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-stone-950 flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-60"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? 'Publishing Changes...' : 'Save & Publish Contacts Live'}</span>
        </button>
      </div>

      {/* Add / Edit Contact Modal */}
      {(isNewModalOpen || editingContact) && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs animate-in fade-in"
          onClick={() => {
            setIsNewModalOpen(false);
            setEditingContact(null);
          }}
        >
          <div
            className="relative max-w-lg w-full bg-white dark:bg-stone-900 rounded-2xl p-6 sm:p-7 border border-stone-200 dark:border-stone-800 shadow-2xl space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-3">
              <h3 className="text-base font-bold font-serif text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <PhoneCall className="w-4 h-4 text-amber-500" />
                <span>{editingContact ? 'Edit Contact Number' : 'Add New Contact Number'}</span>
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsNewModalOpen(false);
                  setEditingContact(null);
                }}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveModal} className="space-y-4 text-xs">
              {/* Contact Label */}
              <div>
                <label className="font-bold text-stone-900 dark:text-stone-100 block mb-1">
                  Contact Label / Role <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Primary contact, Secondary contact, Additional contact"
                  value={formState.label}
                  onChange={(e) => setFormState({ ...formState, label: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                />
                <span className="text-[11px] text-stone-500 mt-0.5 block">
                  Identifies this contact on the website (e.g. Primary contact, Customer Support, Site Engineers).
                </span>
              </div>

              {/* Mobile Phone Number */}
              <div>
                <label className="font-bold text-stone-900 dark:text-stone-100 block mb-1">
                  Mobile Number with Country Code <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="+91 70925 07374 or 8668181232"
                  value={formState.phoneNumber}
                  onChange={(e) => setFormState({ ...formState, phoneNumber: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-mono text-sm"
                />
                {formState.phoneNumber.trim() && (
                  <div className="mt-1.5 p-2 rounded bg-stone-100 dark:bg-stone-800 text-[11px] space-y-0.5 font-mono text-stone-600 dark:text-stone-400">
                    <div>Display: <strong className="text-stone-900 dark:text-stone-200">{formatDisplayPhone(normalizePhoneNumber(formState.phoneNumber))}</strong></div>
                    <div>Link format: <span className="text-amber-600 dark:text-amber-400">{normalizePhoneNumber(formState.phoneNumber)}</span></div>
                  </div>
                )}
              </div>

              {/* Capabilities & Status */}
              <div className="space-y-2.5 pt-2 border-t border-stone-200 dark:border-stone-800">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formState.isWhatsAppEnabled}
                    onChange={(e) => setFormState({ ...formState, isWhatsAppEnabled: e.target.checked })}
                    className="w-4 h-4 rounded text-amber-500 accent-amber-500"
                  />
                  <span className="font-semibold text-stone-800 dark:text-stone-200">
                    Enable WhatsApp button for this contact
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formState.isCallEnabled}
                    onChange={(e) => setFormState({ ...formState, isCallEnabled: e.target.checked })}
                    className="w-4 h-4 rounded text-amber-500 accent-amber-500"
                  />
                  <span className="font-semibold text-stone-800 dark:text-stone-200">
                    Enable direct Phone Call button for this contact
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formState.isPrimary}
                    onChange={(e) => setFormState({ ...formState, isPrimary: e.target.checked })}
                    className="w-4 h-4 rounded text-amber-500 accent-amber-500"
                  />
                  <span className="font-bold text-amber-700 dark:text-amber-400">
                    Set as Primary Contact (Used for floating WhatsApp &amp; Call Now CTAs)
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formState.isActive}
                    onChange={(e) => setFormState({ ...formState, isActive: e.target.checked })}
                    className="w-4 h-4 rounded text-amber-500 accent-amber-500"
                  />
                  <span className="font-semibold text-stone-800 dark:text-stone-200">
                    Active (Visible on public website)
                  </span>
                </label>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-stone-200 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsNewModalOpen(false);
                    setEditingContact(null);
                  }}
                  className="px-4 py-2 rounded-lg border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold shadow-sm cursor-pointer"
                >
                  {editingContact ? 'Save Changes' : 'Add Contact'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
