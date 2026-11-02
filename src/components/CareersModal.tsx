import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Briefcase,
  MapPin,
  Clock,
  GraduationCap,
  IndianRupee,
  Users,
  Send,
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  Search,
  Sparkles,
  ArrowRight,
  ChevronLeft,
} from 'lucide-react';
import { useContent } from '../context/ContentContext.tsx';
import { JobOpening } from '../shared/types.ts';

interface CareersModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialJobId?: string;
}

export const CareersModal: React.FC<CareersModalProps> = ({ isOpen, onClose, initialJobId }) => {
  const { activeCareers, refreshContent, submitJobApplication } = useContent();

  const [selectedJob, setSelectedJob] = useState<JobOpening | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Application form state
  const [formData, setFormData] = useState({
    fullName: '',
    mobileNumber: '',
    email: '',
    location: '',
    yearsOfExperience: '',
    qualification: '',
    message: '',
  });

  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Synchronize initial job if passed
  useEffect(() => {
    if (initialJobId && activeCareers.length > 0) {
      const match = activeCareers.find((j) => j.id === initialJobId);
      if (match) {
        setSelectedJob(match);
        setIsApplying(true);
      }
    }
  }, [initialJobId, activeCareers]);

  // Lock body scroll and pull fresh content when modal opens
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // Pull fresh data so any recently inactived jobs immediately disappear
      refreshContent();
    } else {
      document.body.style.overflow = '';
      setIsApplying(false);
      setSelectedJob(null);
      setSubmitStatus('idle');
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, refreshContent]);

  if (!isOpen) return null;

  const filteredJobs = (activeCareers || []).filter((job) => {
    // Only display strictly active jobs
    const isJobActive =
      job.isActive === true ||
      (job.isActive !== false &&
        (job.isActive as any) !== 'false' &&
        (job.isActive as any) !== 0 &&
        (job.isActive as any) !== '0' &&
        (job.isActive as any) !== 'closed' &&
        (job.isActive as any) !== 'inactive');

    if (!isJobActive) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      job.title.toLowerCase().includes(q) ||
      job.location.toLowerCase().includes(q) ||
      job.qualification.toLowerCase().includes(q) ||
      (Array.isArray(job.skills) && job.skills.some((s) => s.toLowerCase().includes(q)))
    );
  });

  const handleStartApply = (job: JobOpening) => {
    setSelectedJob(job);
    setIsApplying(true);
    setSubmitStatus('idle');
    setStatusMessage('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (!['pdf', 'doc', 'docx'].includes(ext || '')) {
        setSubmitStatus('error');
        setStatusMessage('Please upload a PDF, DOC, or DOCX resume document.');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setSubmitStatus('error');
        setStatusMessage('Resume file size must be under 10MB.');
        return;
      }
      setResumeFile(file);
      setSubmitStatus('idle');
      setStatusMessage('');
    }
  };

  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.fullName.trim() || !formData.mobileNumber.trim() || !formData.email.trim()) {
      setSubmitStatus('error');
      setStatusMessage('Please fill in your Full Name, Mobile Number, and Email.');
      return;
    }

    if (!resumeFile) {
      setSubmitStatus('error');
      setStatusMessage('Please attach your Resume/CV (PDF, DOC, or DOCX).');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const res = await submitJobApplication({
        jobId: selectedJob?.id || 'general',
        jobTitle: selectedJob?.title || 'General Engineering Role',
        fullName: formData.fullName.trim(),
        mobileNumber: formData.mobileNumber.trim(),
        email: formData.email.trim(),
        location: formData.location.trim() || 'Chennai',
        yearsOfExperience: formData.yearsOfExperience.trim() || '0',
        qualification: formData.qualification.trim() || 'Graduate',
        resumeFile: resumeFile || undefined,
        message: formData.message.trim(),
      });

      setIsSubmitting(false);

      if (res.success) {
        setSubmitStatus('success');
        setStatusMessage(res.message || 'Application submitted successfully! Our HR team will contact you.');
        setFormData({
          fullName: '',
          mobileNumber: '',
          email: '',
          location: '',
          yearsOfExperience: '',
          qualification: '',
          message: '',
        });
        setResumeFile(null);
      } else {
        setSubmitStatus('error');
        setStatusMessage(res.error || 'Failed to submit application. Please try again or WhatsApp our desk.');
      }
    } catch (err: any) {
      setIsSubmitting(false);
      setSubmitStatus('error');
      setStatusMessage(err.message || 'Network error occurred. Please try again.');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-4xl my-auto bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Deep Navy Blue Header matching VSHN Brand Style */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 px-6 py-5 sm:px-8 sm:py-6 text-white border-b border-slate-800 shrink-0">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Sparkles className="w-3 h-3" />
                <span>Careers at VSHN Builders</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold font-serif tracking-tight text-white">
                {isApplying && selectedJob ? `Apply for ${selectedJob.title}` : 'Build Your Career with VSHN Builders'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-300">
                {isApplying
                  ? 'Submit your profile and resume directly to our civil engineering leadership team.'
                  : 'Join Chennai’s trusted turnkey residential construction & architectural design family.'}
              </p>
            </div>

            <button
              onClick={onClose}
              aria-label="Close Careers Modal"
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search bar & Breadcrumb when on Job List */}
          {!isApplying && (
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row gap-2 sm:items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by job title, skill, or location..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-800/90 border border-slate-700 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                />
              </div>
              <div className="text-[11px] text-slate-300 font-medium">
                {filteredJobs.length} {filteredJobs.length === 1 ? 'Open Position' : 'Open Positions'} in Chennai
              </div>
            </div>
          )}

          {/* Back button when applying */}
          {isApplying && (
            <button
              type="button"
              onClick={() => {
                setIsApplying(false);
                setSubmitStatus('idle');
              }}
              className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back to all job openings</span>
            </button>
          )}
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 lg:p-8 overflow-y-auto flex-1 bg-slate-50/50 dark:bg-slate-950/60">
          {/* ================= VIEW 1: APPLICATION FORM ================= */}
          {isApplying && selectedJob ? (
            <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-right-2 duration-200">
              {/* Job Summary Banner */}
              <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 font-serif">
                      {selectedJob.title}
                    </h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                      {selectedJob.jobType}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400 mt-1">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {selectedJob.location}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {selectedJob.experience}
                    </span>
                    {selectedJob.salary && (
                      <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                        <IndianRupee className="w-3 h-3" />
                        {selectedJob.salary}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 shrink-0">
                  <span className="font-bold text-slate-800 dark:text-slate-200">{selectedJob.openingsCount}</span>{' '}
                  {selectedJob.openingsCount === 1 ? 'opening' : 'openings'}
                </div>
              </div>

              {submitStatus === 'success' ? (
                <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-emerald-200 dark:border-emerald-800/60 shadow-md space-y-4 animate-in fade-in">
                  <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold font-serif text-slate-900 dark:text-slate-100">
                    Application Submitted Successfully!
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                    Thank you for your interest in joining VSHN Builders. Our civil engineering HR desk has received your application and resume. We will contact you soon.
                  </p>
                  <div className="pt-2 flex flex-wrap justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setIsApplying(false);
                        setSubmitStatus('idle');
                      }}
                      className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 dark:hover:bg-emerald-500 text-white font-bold text-xs transition-colors cursor-pointer"
                    >
                      View Other Openings
                    </button>
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      Close Window
                    </button>
                  </div>
                </div>
              ) : (
                <form
                  onSubmit={handleSubmitApplication}
                  className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4"
                >
                  <h4 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 border-b border-slate-100 dark:border-slate-800 pb-2">
                    Applicant Information
                  </h4>

                  {submitStatus === 'error' && (
                    <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{statusMessage}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Full Name */}
                    <div>
                      <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                        Full Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        placeholder="e.g. Ramesh Kumar"
                        className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    {/* Mobile Number */}
                    <div>
                      <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                        Mobile Number <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        value={formData.mobileNumber}
                        onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                        placeholder="e.g. +91 98765 43210"
                        className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                        Email Address <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="e.g. ramesh@example.com"
                        className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    {/* Current Location */}
                    <div>
                      <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                        Current Location / City
                      </label>
                      <input
                        type="text"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        placeholder="e.g. Anna Nagar, Chennai"
                        className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    {/* Years of Experience */}
                    <div>
                      <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                        Years of Experience <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.yearsOfExperience}
                        onChange={(e) => setFormData({ ...formData, yearsOfExperience: e.target.value })}
                        placeholder="e.g. 3 Years or Fresher"
                        className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    {/* Highest Qualification */}
                    <div>
                      <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                        Highest Qualification <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.qualification}
                        onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                        placeholder="e.g. B.E. Civil / Diploma in Civil"
                        className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Resume Upload File Picker */}
                  <div className="pt-2">
                    <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                      Upload Resume / CV (PDF, DOC, DOCX up to 10MB) <span className="text-rose-500">*</span>
                    </label>

                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept=".pdf,.doc,.docx"
                      className="hidden"
                    />

                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
                        resumeFile
                          ? 'border-emerald-500 bg-emerald-500/5 dark:bg-emerald-950/20'
                          : 'border-slate-300 dark:border-slate-700 hover:border-emerald-500 bg-slate-50 dark:bg-slate-800/50'
                      }`}
                    >
                      {resumeFile ? (
                        <div className="flex items-center justify-center gap-3 text-emerald-700 dark:text-emerald-400">
                          <FileText className="w-6 h-6 shrink-0" />
                          <div className="text-left">
                            <span className="font-bold text-xs block">{resumeFile.name}</span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400">
                              {(resumeFile.size / 1024).toFixed(1)} KB — Click to change file
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <UploadCloud className="w-8 h-8 text-slate-400 mx-auto" />
                          <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                            Click to select or drag &amp; drop your resume document
                          </div>
                          <div className="text-[11px] text-slate-400">PDF, DOC, DOCX files supported (Max 10MB)</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Additional Message */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                      Additional Message / Cover Note (Optional)
                    </label>
                    <textarea
                      rows={3}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Share a brief overview of your background, current notice period, or key accomplishments..."
                      className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed"
                    />
                  </div>

                  {/* Submit Action */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setIsApplying(false)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{isSubmitting ? 'Submitting Application...' : 'Submit Application Now'}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            /* ================= VIEW 2: JOB OPENINGS LIST ================= */
            <div className="space-y-4">
              {filteredJobs.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  {filteredJobs.map((job) => (
                    <div
                      key={job.id}
                      className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                    >
                      <div>
                        {/* Title and Job Type Badge */}
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 uppercase tracking-wider mb-1.5">
                              {job.jobType}
                            </span>
                            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 font-serif">
                              {job.title}
                            </h3>
                          </div>

                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 shrink-0">
                            <Users className="w-3 h-3 text-emerald-500" />
                            <span>{job.openingsCount} {job.openingsCount === 1 ? 'Opening' : 'Openings'}</span>
                          </span>
                        </div>

                        {/* Quick Specs Pill Row */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 text-xs text-slate-600 dark:text-slate-400">
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{job.location}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{job.experience}</span>
                          </div>
                          <div className="flex items-center gap-1.5 sm:col-span-2">
                            <GraduationCap className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{job.qualification}</span>
                          </div>
                          {job.salary && (
                            <div className="flex items-center gap-1.5 sm:col-span-2 font-semibold text-emerald-600 dark:text-emerald-400">
                              <IndianRupee className="w-3.5 h-3.5 shrink-0" />
                              <span>{job.salary}</span>
                            </div>
                          )}
                        </div>

                        {/* Description */}
                        <p className="mt-3 text-xs text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-3">
                          {job.description}
                        </p>

                        {/* Skills Badges */}
                        {job.skills && job.skills.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1.5">
                              Skills Required:
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {job.skills.map((skill, sIdx) => (
                                <span
                                  key={sIdx}
                                  className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300"
                                >
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Card Footer: Apply Now CTA */}
                      <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                        <span className="text-[11px] text-slate-400">
                          Chennai On-site Position
                        </span>

                        <button
                          type="button"
                          onClick={() => handleStartApply(job)}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                        >
                          <span>Apply Now</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* Empty state as explicitly specified by requirements */
                <div className="p-12 sm:p-16 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm max-w-lg mx-auto space-y-4">
                  <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                    <Briefcase className="w-8 h-8" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold font-serif text-slate-800 dark:text-slate-200">
                    No Current Openings
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                    Currently, there are no open positions. Please check back later for future opportunities with VSHN Builders.
                  </p>
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white text-xs font-semibold"
                    >
                      Back to Website
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
