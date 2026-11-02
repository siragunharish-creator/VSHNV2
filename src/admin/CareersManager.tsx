import React, { useState } from 'react';
import {
  Briefcase,
  Users,
  Plus,
  Trash2,
  Edit2,
  Check,
  ChevronUp,
  ChevronDown,
  AlertCircle,
  Save,
  CheckCircle2,
  Phone,
  Mail,
  MapPin,
  GraduationCap,
  FileText,
  Clock,
  Download,
  Filter,
  Search,
  ExternalLink,
  MessageSquare,
  Sparkles,
  X,
  RefreshCw,
} from 'lucide-react';
import { JobOpening, JobApplication } from '../shared/types.ts';
import { useContent } from '../context/ContentContext.tsx';
import { WhatsAppIcon } from '../components/WhatsAppIcon.tsx';

interface CareersManagerProps {
  showToast: (type: 'success' | 'error' | 'info', message: string) => void;
}

export const CareersManager: React.FC<CareersManagerProps> = ({ showToast }) => {
  const {
    careers,
    applications,
    updateCareers,
    updateApplicationStatus,
    deleteApplication,
    refreshApplications,
  } = useContent();

  const [activeTab, setActiveTab] = useState<'openings' | 'applications'>('openings');
  const [localCareers, setLocalCareers] = useState<JobOpening[]>(careers || []);
  const [isSaving, setIsSaving] = useState(false);

  // Sync if context updates
  React.useEffect(() => {
    if (careers && careers.length > 0) {
      setLocalCareers(careers);
    }
  }, [careers]);

  // Modal for editing/adding job
  const [isJobModalOpen, setIsJobModalOpen] = useState(false);
  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  const [jobForm, setJobForm] = useState<{
    title: string;
    location: string;
    experience: string;
    qualification: string;
    salary: string;
    jobType: string;
    description: string;
    skills: string;
    openingsCount: number;
    isActive: boolean;
  }>({
    title: '',
    location: 'Chennai, Tamil Nadu',
    experience: '2-4 Years',
    qualification: 'B.E. Civil Engineering / Diploma',
    salary: 'Commensurate with experience',
    jobType: 'Full-Time',
    description: '',
    skills: 'AutoCAD, Site Supervision, Quality Inspection',
    openingsCount: 1,
    isActive: true,
  });

  // Applications filters
  const [selectedJobFilter, setSelectedJobFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [appSearch, setAppSearch] = useState<string>('');
  const [updatingAppId, setUpdatingAppId] = useState<string | null>(null);

  // Notes edit state
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [notesText, setNotesText] = useState<string>('');

  // Handle open add modal
  const handleOpenAddModal = () => {
    setEditingJobId(null);
    setJobForm({
      title: '',
      location: 'Chennai, Tamil Nadu',
      experience: '2-4 Years',
      qualification: 'B.E. Civil Engineering / Diploma',
      salary: '',
      jobType: 'Full-Time',
      description: '',
      skills: 'AutoCAD, Site Supervision, Quality Inspection',
      openingsCount: 1,
      isActive: true,
    });
    setIsJobModalOpen(true);
  };

  // Handle open edit modal
  const handleOpenEditModal = (job: JobOpening) => {
    setEditingJobId(job.id);
    setJobForm({
      title: job.title,
      location: job.location,
      experience: job.experience,
      qualification: job.qualification,
      salary: job.salary || '',
      jobType: job.jobType,
      description: job.description,
      skills: Array.isArray(job.skills) ? job.skills.join(', ') : '',
      openingsCount: job.openingsCount || 1,
      isActive: job.isActive,
    });
    setIsJobModalOpen(true);
  };

  // Handle save job form
  const handleSaveJobForm = () => {
    if (!jobForm.title.trim()) {
      showToast('error', 'Job title is required');
      return;
    }
    if (!jobForm.description.trim()) {
      showToast('error', 'Job description is required');
      return;
    }

    const skillsArray = jobForm.skills
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    let updatedList: JobOpening[];

    if (editingJobId) {
      updatedList = localCareers.map((j) =>
        j.id === editingJobId
          ? {
              ...j,
              title: jobForm.title.trim(),
              location: jobForm.location.trim(),
              experience: jobForm.experience.trim(),
              qualification: jobForm.qualification.trim(),
              salary: jobForm.salary.trim() || undefined,
              jobType: jobForm.jobType.trim() || 'Full-Time',
              description: jobForm.description.trim(),
              skills: skillsArray.length > 0 ? skillsArray : ['General'],
              openingsCount: Number(jobForm.openingsCount) || 1,
              isActive: jobForm.isActive,
              updatedAt: new Date().toISOString(),
            }
          : j
      );
    } else {
      const newJob: JobOpening = {
        id: `job-${Date.now()}`,
        title: jobForm.title.trim(),
        location: jobForm.location.trim(),
        experience: jobForm.experience.trim(),
        qualification: jobForm.qualification.trim(),
        salary: jobForm.salary.trim() || undefined,
        jobType: jobForm.jobType.trim() || 'Full-Time',
        description: jobForm.description.trim(),
        skills: skillsArray.length > 0 ? skillsArray : ['General'],
        openingsCount: Number(jobForm.openingsCount) || 1,
        isActive: jobForm.isActive,
        displayOrder: localCareers.length + 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      updatedList = [...localCareers, newJob];
    }

    setLocalCareers(updatedList);
    setIsJobModalOpen(false);
    // Auto-save and publish to live website immediately
    updateCareers(updatedList).then((res) => {
      if (res.success) {
        showToast('success', editingJobId ? 'Job opening updated live on website!' : 'New job opening published live on website!');
      } else {
        showToast('error', res.error || 'Failed to publish job opening');
      }
    }).catch(() => {
      showToast('error', 'Failed to publish job opening');
    });
  };

  // Toggle job active (Immediately publishes live so inactive jobs vanish from website)
  const handleToggleJobActive = async (jobId: string) => {
    const updated = localCareers.map((j) => (j.id === jobId ? { ...j, isActive: !j.isActive } : j));
    setLocalCareers(updated);
    const toggled = updated.find((j) => j.id === jobId);
    const statusText = toggled?.isActive ? 'Active (Published to website)' : 'Closed / Inactive (Hidden from website)';

    try {
      const res = await updateCareers(updated);
      if (res.success) {
        showToast('success', `"${toggled?.title}" is now ${statusText}`);
      } else {
        showToast('error', res.error || 'Failed to update job status');
      }
    } catch {
      showToast('error', 'Error updating job status');
    }
  };

  // Delete job with instant live update
  const handleDeleteJob = async (jobId: string) => {
    if (confirm('Are you sure you want to delete this job opening?')) {
      const updated = localCareers.filter((j) => j.id !== jobId);
      setLocalCareers(updated);
      try {
        const res = await updateCareers(updated);
        if (res.success) {
          showToast('success', 'Job opening deleted and removed from website.');
        } else {
          showToast('error', res.error || 'Failed to delete job opening');
        }
      } catch {
        showToast('error', 'Error deleting job opening');
      }
    }
  };

  // Move job order with live sync
  const handleMoveJob = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= localCareers.length) return;

    const copy = [...localCareers];
    const [moved] = copy.splice(index, 1);
    copy.splice(targetIndex, 0, moved);

    // Re-index displayOrder
    const reordered = copy.map((j, idx) => ({ ...j, displayOrder: idx + 1 }));
    setLocalCareers(reordered);
    await updateCareers(reordered);
  };

  // Save to server
  const handleSaveAndPublish = async () => {
    setIsSaving(true);
    try {
      const res = await updateCareers(localCareers);
      if (res.success) {
        showToast('success', 'Careers updated and published to the website successfully!');
      } else {
        showToast('error', res.error || 'Failed to publish careers');
      }
    } catch {
      showToast('error', 'Error connecting to server');
    } finally {
      setIsSaving(false);
    }
  };

  // Filtered applications
  const filteredApplications = applications.filter((app) => {
    if (selectedJobFilter !== 'all' && app.jobId !== selectedJobFilter) return false;
    if (statusFilter !== 'all' && app.status !== statusFilter) return false;
    if (appSearch.trim()) {
      const q = appSearch.toLowerCase();
      const matchName = app.fullName.toLowerCase().includes(q);
      const matchEmail = app.email.toLowerCase().includes(q);
      const matchPhone = app.mobileNumber.toLowerCase().includes(q);
      const matchJob = app.jobTitle.toLowerCase().includes(q);
      if (!matchName && !matchEmail && !matchPhone && !matchJob) return false;
    }
    return true;
  });

  const newApplicationsCount = applications.filter((a) => a.status === 'new').length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Briefcase className="w-4 h-4" />
            <span>Human Resources &amp; Talent Acquisition</span>
          </div>
          <h2 className="text-2xl font-bold font-serif text-white">
            Career Openings &amp; Applications Manager
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Post and manage job requirements for site engineers, architectural visualizers, and project managers.
            Applications submitted on the website appear in real-time below.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 bg-slate-800/80 p-1.5 rounded-xl border border-slate-700/80 shrink-0">
          <button
            onClick={() => setActiveTab('openings')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'openings'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Job Openings ({localCareers.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('applications')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer relative ${
              activeTab === 'applications'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Applications ({applications.length})</span>
            {newApplicationsCount > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] font-black rounded-full bg-rose-500 text-white animate-pulse">
                {newApplicationsCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ================= TAB 1: JOB OPENINGS ================= */}
      {activeTab === 'openings' && (
        <div className="space-y-6">
          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-stone-900 p-4 rounded-xl border border-stone-200 dark:border-stone-800 shadow-xs">
            <div className="flex items-center gap-3">
              <span className="text-xs text-stone-500 dark:text-stone-400">
                Active:{' '}
                <strong className="text-emerald-600 dark:text-emerald-400">
                  {localCareers.filter((j) => j.isActive).length}
                </strong>{' '}
                · Closed:{' '}
                <strong className="text-stone-600 dark:text-stone-400">
                  {localCareers.filter((j) => !j.isActive).length}
                </strong>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleOpenAddModal}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-stone-900 dark:bg-stone-800 text-white hover:bg-stone-800 dark:hover:bg-stone-700 flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4 text-emerald-400" />
                <span>Add Job Opening</span>
              </button>

              <button
                type="button"
                onClick={handleSaveAndPublish}
                disabled={isSaving}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-stone-950 flex items-center gap-1.5 shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Publishing...' : 'Save & Publish Careers'}</span>
              </button>
            </div>
          </div>

          {/* Jobs List */}
          {localCareers.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-8">
              <Briefcase className="w-12 h-12 text-stone-300 dark:text-stone-700 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-stone-800 dark:text-stone-200">No Job Openings Configured</h3>
              <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
                Add an opening so prospective applicants can view requirements and submit applications.
              </p>
              <button
                onClick={handleOpenAddModal}
                className="mt-4 px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 text-slate-950 inline-flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add First Job</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {localCareers.map((job, idx) => (
                <div
                  key={job.id}
                  className={`bg-white dark:bg-stone-900 rounded-xl p-5 border transition-all ${
                    job.isActive
                      ? 'border-stone-200 dark:border-stone-800 hover:border-emerald-500/50 shadow-xs'
                      : 'border-stone-200/50 dark:border-stone-800/50 opacity-60 bg-stone-50 dark:bg-stone-950'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    {/* Left Details */}
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            job.isActive
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                              : 'bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
                          }`}
                        >
                          {job.isActive ? 'Active Opening' : 'Closed / Inactive'}
                        </span>

                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                          {job.jobType}
                        </span>

                        <span className="text-[11px] text-stone-400">
                          {job.openingsCount} {job.openingsCount === 1 ? 'Opening' : 'Openings'}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                        {job.title}
                      </h3>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-500 dark:text-stone-400">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-amber-500" />
                          {job.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-blue-500" />
                          {job.experience}
                        </span>
                        <span className="flex items-center gap-1">
                          <GraduationCap className="w-3.5 h-3.5 text-emerald-500" />
                          {job.qualification}
                        </span>
                        {job.salary && (
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                            {job.salary}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-stone-600 dark:text-stone-400 line-clamp-2 leading-relaxed pt-1">
                        {job.description}
                      </p>

                      {/* Skills Tags */}
                      {job.skills && job.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {job.skills.map((s, sIdx) => (
                            <span
                              key={sIdx}
                              className="px-2 py-0.5 rounded text-[10px] font-mono bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Right Action Buttons */}
                    <div className="flex md:flex-col items-center justify-end gap-1.5 shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-stone-100 dark:border-stone-800">
                      {/* Reorder Buttons */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleMoveJob(idx, 'up')}
                          disabled={idx === 0}
                          className="p-1 rounded bg-stone-100 dark:bg-stone-800 text-stone-500 hover:text-stone-900 dark:hover:text-white disabled:opacity-30 cursor-pointer"
                          title="Move Up"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveJob(idx, 'down')}
                          disabled={idx === localCareers.length - 1}
                          className="p-1 rounded bg-stone-100 dark:bg-stone-800 text-stone-500 hover:text-stone-900 dark:hover:text-white disabled:opacity-30 cursor-pointer"
                          title="Move Down"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Active/Inactive Toggle */}
                      <button
                        type="button"
                        onClick={() => handleToggleJobActive(job.id)}
                        className={`text-[11px] font-bold px-2.5 py-1 rounded transition-colors cursor-pointer ${
                          job.isActive
                            ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20'
                            : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20'
                        }`}
                      >
                        {job.isActive ? 'Mark Closed' : 'Mark Active'}
                      </button>

                      {/* Edit */}
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(job)}
                        className="p-1.5 rounded-lg text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                        title="Edit Job"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => handleDeleteJob(job.id)}
                        className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                        title="Delete Job"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 2: JOB APPLICATIONS ================= */}
      {activeTab === 'applications' && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="bg-white dark:bg-stone-900 p-4 rounded-xl border border-stone-200 dark:border-stone-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 flex-1">
              {/* Search */}
              <div className="relative min-w-[200px] flex-1">
                <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search applicant name, phone, email..."
                  value={appSearch}
                  onChange={(e) => setAppSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-lg text-xs bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                />
              </div>

              {/* Job Filter */}
              <select
                value={selectedJobFilter}
                onChange={(e) => setSelectedJobFilter(e.target.value)}
                className="px-3 py-1.5 rounded-lg text-xs bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 font-medium"
              >
                <option value="all">All Jobs ({applications.length})</option>
                {localCareers.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.title}
                  </option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 rounded-lg text-xs bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 font-medium"
              >
                <option value="all">All Statuses</option>
                <option value="new">New ({applications.filter((a) => a.status === 'new').length})</option>
                <option value="reviewed">Reviewed</option>
                <option value="shortlisted">Shortlisted</option>
                <option value="contacted">Contacted</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <button
              onClick={() => {
                refreshApplications();
                showToast('info', 'Refreshed applications list.');
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 flex items-center gap-1.5 self-start md:self-auto cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
          </div>

          {/* Applications Cards */}
          {filteredApplications.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-8">
              <Users className="w-12 h-12 text-stone-300 dark:text-stone-700 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-stone-800 dark:text-stone-200">No Applications Found</h3>
              <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
                {appSearch || statusFilter !== 'all' || selectedJobFilter !== 'all'
                  ? 'No applications match the current filter criteria.'
                  : 'Applications received from job applicants will appear here with full details and resumes.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredApplications.map((app) => (
                <div
                  key={app.id}
                  className={`bg-white dark:bg-stone-900 rounded-xl p-5 border transition-all ${
                    app.status === 'new'
                      ? 'border-emerald-500/40 shadow-sm ring-1 ring-emerald-500/20'
                      : 'border-stone-200 dark:border-stone-800 shadow-xs'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    {/* Applicant Information */}
                    <div className="space-y-3 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            app.status === 'new'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                              : app.status === 'shortlisted'
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                              : app.status === 'contacted'
                              ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                              : app.status === 'rejected'
                              ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                              : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
                          }`}
                        >
                          Status: {app.status}
                        </span>

                        <span className="text-[11px] font-bold text-stone-800 dark:text-stone-200 bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded">
                          Applied For: {app.jobTitle}
                        </span>

                        <span className="text-[10px] text-stone-400">
                          {new Date(app.appliedAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      <div>
                        <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                          {app.fullName}
                        </h3>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-600 dark:text-stone-400 mt-1">
                          <a
                            href={`tel:${app.mobileNumber}`}
                            className="flex items-center gap-1 hover:text-amber-600 dark:hover:text-amber-400 font-semibold"
                          >
                            <Phone className="w-3 h-3 text-emerald-500" />
                            {app.mobileNumber}
                          </a>
                          <a
                            href={`mailto:${app.email}`}
                            className="flex items-center gap-1 hover:text-amber-600 dark:hover:text-amber-400"
                          >
                            <Mail className="w-3 h-3 text-blue-500" />
                            {app.email}
                          </a>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-amber-500" />
                            {app.location}
                          </span>
                        </div>
                      </div>

                      {/* Professional details */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-stone-50 dark:bg-stone-800/60 p-3 rounded-lg border border-stone-100 dark:border-stone-800">
                        <div>
                          <span className="text-stone-400 block text-[10px] font-bold uppercase">Experience</span>
                          <span className="font-semibold text-stone-800 dark:text-stone-200">
                            {app.yearsOfExperience}
                          </span>
                        </div>
                        <div>
                          <span className="text-stone-400 block text-[10px] font-bold uppercase">Qualification</span>
                          <span className="font-semibold text-stone-800 dark:text-stone-200">
                            {app.qualification}
                          </span>
                        </div>
                      </div>

                      {/* Applicant cover message */}
                      {app.message && (
                        <div className="text-xs bg-amber-500/5 border border-amber-500/20 p-3 rounded-lg">
                          <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider block mb-0.5">
                            Applicant Message / Cover Note
                          </span>
                          <p className="text-stone-700 dark:text-stone-300 whitespace-pre-line leading-relaxed">
                            {app.message}
                          </p>
                        </div>
                      )}

                      {/* Internal Admin Notes */}
                      <div className="text-xs pt-1">
                        {editingNotesId === app.id ? (
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                              Admin Notes:
                            </label>
                            <textarea
                              rows={2}
                              value={notesText}
                              onChange={(e) => setNotesText(e.target.value)}
                              placeholder="e.g. Called candidate, scheduled interview for Monday at 11am"
                              className="w-full p-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={async () => {
                                  await updateApplicationStatus(app.id, app.status, notesText);
                                  setEditingNotesId(null);
                                  showToast('success', 'Admin notes saved.');
                                }}
                                className="px-3 py-1 rounded bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 font-bold text-[11px]"
                              >
                                Save Note
                              </button>
                              <button
                                onClick={() => setEditingNotesId(null)}
                                className="px-3 py-1 rounded bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-[11px]"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between text-stone-500 text-[11px]">
                            <span>
                              {app.notes ? (
                                <span className="text-stone-700 dark:text-stone-300 font-medium">
                                  <strong>Notes:</strong> {app.notes}
                                </span>
                              ) : (
                                <em>No admin notes attached.</em>
                              )}
                            </span>
                            <button
                              onClick={() => {
                                setEditingNotesId(app.id);
                                setNotesText(app.notes || '');
                              }}
                              className="text-amber-600 dark:text-amber-400 hover:underline font-semibold ml-2 cursor-pointer"
                            >
                              {app.notes ? 'Edit Notes' : '+ Add Note'}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right Action Column */}
                    <div className="lg:w-60 flex flex-col gap-2 shrink-0 border-t lg:border-t-0 pt-3 lg:pt-0 border-stone-100 dark:border-stone-800">
                      {/* Resume Download / View Button */}
                      {app.resumeUrl ? (
                        <a
                          href={app.resumeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span className="truncate">Download Resume</span>
                        </a>
                      ) : (
                        <div className="w-full py-2 px-3 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-400 text-center text-xs">
                          No resume file attached
                        </div>
                      )}

                      {/* Quick Contact Buttons */}
                      <div className="grid grid-cols-2 gap-2">
                        <a
                          href={`tel:${app.mobileNumber}`}
                          className="py-1.5 px-2 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 text-xs font-semibold flex items-center justify-center gap-1"
                        >
                          <Phone className="w-3 h-3 text-emerald-500" />
                          <span>Call</span>
                        </a>
                        <a
                          href={`https://wa.me/${app.mobileNumber.replace(/\D/g, '')}?text=${encodeURIComponent(
                            `Hi ${app.fullName}, this is VSHN Builders regarding your job application for ${app.jobTitle}.`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="py-1.5 px-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center justify-center gap-1"
                        >
                          <WhatsAppIcon size={12} className="text-emerald-600" />
                          <span>WhatsApp</span>
                        </a>
                      </div>

                      {/* Status Selector */}
                      <div className="space-y-1 pt-1">
                        <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                          Change Status:
                        </label>
                        <select
                          value={app.status}
                          disabled={updatingAppId === app.id}
                          onChange={async (e) => {
                            const newStatus = e.target.value as any;
                            setUpdatingAppId(app.id);
                            try {
                              await updateApplicationStatus(app.id, newStatus);
                              showToast('success', `Status updated to ${newStatus}`);
                            } catch {
                              showToast('error', 'Failed to update status');
                            } finally {
                              setUpdatingAppId(null);
                            }
                          }}
                          className="w-full p-2 rounded-lg text-xs bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 font-semibold"
                        >
                          <option value="new">New Candidate</option>
                          <option value="reviewed">Reviewed</option>
                          <option value="shortlisted">Shortlisted</option>
                          <option value="contacted">Contacted / Interviewing</option>
                          <option value="rejected">Rejected / Archived</option>
                        </select>
                      </div>

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={async () => {
                          if (confirm(`Delete application from ${app.fullName}?`)) {
                            await deleteApplication(app.id);
                            showToast('info', 'Application deleted.');
                          }
                        }}
                        className="mt-1 py-1 px-2 rounded text-[11px] text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center justify-center gap-1 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Delete Application</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================= MODAL: ADD / EDIT JOB OPENING ================= */}
      {isJobModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-stone-900 rounded-2xl max-w-2xl w-full p-6 sm:p-8 space-y-5 my-auto max-h-[90vh] overflow-y-auto border border-stone-200 dark:border-stone-800 shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-stone-100 dark:border-stone-800">
              <div className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-amber-500" />
                <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">
                  {editingJobId ? 'Edit Job Opening' : 'Add New Job Opening'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsJobModalOpen(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-900 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Job Title */}
              <div>
                <label className="font-bold text-stone-800 dark:text-stone-200 block mb-1">
                  Job Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Civil Site Engineer, Architectural 3D Visualizer"
                  value={jobForm.title}
                  onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 font-semibold"
                />
              </div>

              {/* Grid 2-cols: Location & Job Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-stone-800 dark:text-stone-200 block mb-1">
                    Job Location *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Chennai, Tamil Nadu"
                    value={jobForm.location}
                    onChange={(e) => setJobForm({ ...jobForm, location: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800"
                  />
                </div>
                <div>
                  <label className="font-bold text-stone-800 dark:text-stone-200 block mb-1">
                    Job Type
                  </label>
                  <select
                    value={jobForm.jobType}
                    onChange={(e) => setJobForm({ ...jobForm, jobType: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 font-semibold"
                  >
                    <option value="Full-Time">Full-Time</option>
                    <option value="Part-Time">Part-Time</option>
                    <option value="Contract">Contract</option>
                    <option value="Internship">Internship</option>
                  </select>
                </div>
              </div>

              {/* Grid 2-cols: Experience & Qualification */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-stone-800 dark:text-stone-200 block mb-1">
                    Experience Required *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 2 - 5 Years"
                    value={jobForm.experience}
                    onChange={(e) => setJobForm({ ...jobForm, experience: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800"
                  />
                </div>
                <div>
                  <label className="font-bold text-stone-800 dark:text-stone-200 block mb-1">
                    Qualification *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. B.E. Civil / Diploma / B.Arch"
                    value={jobForm.qualification}
                    onChange={(e) => setJobForm({ ...jobForm, qualification: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800"
                  />
                </div>
              </div>

              {/* Grid 2-cols: Salary (Optional) & Number of Openings */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-stone-800 dark:text-stone-200 block mb-1">
                    Salary (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. ₹35,000 - ₹55,000 / month or Best in Industry"
                    value={jobForm.salary}
                    onChange={(e) => setJobForm({ ...jobForm, salary: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800"
                  />
                </div>
                <div>
                  <label className="font-bold text-stone-800 dark:text-stone-200 block mb-1">
                    Number of Openings
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={jobForm.openingsCount}
                    onChange={(e) => setJobForm({ ...jobForm, openingsCount: parseInt(e.target.value) || 1 })}
                    className="w-full p-2.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800"
                  />
                </div>
              </div>

              {/* Job Description */}
              <div>
                <label className="font-bold text-stone-800 dark:text-stone-200 block mb-1">
                  Job Description &amp; Responsibilities *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Outline key duties, responsibilities, day-to-day site expectations, and client coordination..."
                  value={jobForm.description}
                  onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 font-sans leading-relaxed"
                />
              </div>

              {/* Skills Required */}
              <div>
                <label className="font-bold text-stone-800 dark:text-stone-200 block mb-1">
                  Skills Required (comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Site Execution, Quantity Surveying, AutoCAD, MS Project, Vendor Negotiation"
                  value={jobForm.skills}
                  onChange={(e) => setJobForm({ ...jobForm, skills: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 font-mono text-xs"
                />
              </div>

              {/* Status active checkbox */}
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="jobIsActive"
                  checked={jobForm.isActive}
                  onChange={(e) => setJobForm({ ...jobForm, isActive: e.target.checked })}
                  className="rounded border-stone-300 text-amber-500 focus:ring-amber-500 h-4 w-4"
                />
                <label htmlFor="jobIsActive" className="font-bold text-stone-800 dark:text-stone-200 cursor-pointer">
                  Opening is Active (Visible on the public website)
                </label>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex justify-end gap-2 pt-4 border-t border-stone-100 dark:border-stone-800">
              <button
                type="button"
                onClick={() => setIsJobModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveJobForm}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md cursor-pointer"
              >
                {editingJobId ? 'Update Opening' : 'Add Opening'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
