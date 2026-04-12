import React, { useEffect, useState } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Message } from 'primereact/message';
import { getGcpProjects, selectGcpProject } from '../api/cloudApi';

export default function GcpProjectSelect({ onSuccess, onBack }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [manualProjectId, setManualProjectId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [discoveryError, setDiscoveryError] = useState(null);

  useEffect(() => {
    getGcpProjects()
      .then((res) => {
        setProjects(res.data.projects || []);
        if (res.data.discovery_error) {
          setDiscoveryError(res.data.discovery_error);
        }
      })
      .catch(() => setError('Failed to load your GCP projects.'))
      .finally(() => setLoading(false));
  }, []);

  const handleContinue = async () => {
    const projectId = projects.length > 0 ? selected?.project_id : manualProjectId.trim();
    if (!projectId) return;
    setSubmitting(true);
    try {
      await selectGcpProject(projectId);
      onSuccess('gcp', false);
    } catch {
      setError('Failed to select project. Please try again.');
      setSubmitting(false);
    }
  };

  const projectOptions = projects.map((p) => ({
    label: `${p.name} (${p.project_id})`,
    value: p,
  }));

  const canContinue = projects.length > 0 ? !!selected : manualProjectId.trim().length > 0;

  return (
    <div
      className="flex flex-column align-items-center justify-content-center min-h-screen"
      style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)' }}
    >
      <Card style={{ width: '520px', borderRadius: '16px', boxShadow: '0 4px 24px rgba(0,0,0,0.10)' }}>
        <div className="text-center mb-4">
          <div
            className="inline-flex align-items-center justify-content-center border-circle mb-3"
            style={{ width: '60px', height: '60px', background: '#4285F4' }}
          >
            <i className="pi pi-list" style={{ color: '#fff', fontSize: '1.4rem' }} />
          </div>
          <h2 className="text-2xl font-bold m-0">Select a GCP Project</h2>
          <p className="text-500 mt-1 mb-0">
            {projects.length > 0
              ? 'Your account has access to multiple projects. Choose one to continue.'
              : 'Enter your GCP Project ID to continue.'}
          </p>
        </div>

        {error && <Message severity="error" text={error} className="w-full mb-3" />}

        {loading ? (
          <div className="flex justify-content-center py-4">
            <ProgressSpinner style={{ width: '40px', height: '40px' }} />
          </div>
        ) : projects.length > 0 ? (
          <div className="flex flex-column gap-3">
            <label className="font-semibold text-sm" htmlFor="gcp-project-dropdown">
              GCP Project
            </label>
            <Dropdown
              id="gcp-project-dropdown"
              value={selected}
              options={projectOptions}
              onChange={(e) => setSelected(e.value)}
              placeholder="Select a project..."
              className="w-full"
              disabled={submitting}
              filter
              filterPlaceholder="Search projects..."
            />
            <Button
              label="Continue"
              icon="pi pi-arrow-right"
              iconPos="right"
              className="w-full"
              disabled={!canContinue || submitting}
              loading={submitting}
              onClick={handleContinue}
            />
          </div>
        ) : (
          <div className="flex flex-column gap-3">
            {discoveryError && (
              <Message
                severity="warn"
                text={`Could not auto-discover projects: ${discoveryError}. You can enter your Project ID manually below.`}
                className="w-full mb-1"
              />
            )}
            <label className="font-semibold text-sm" htmlFor="gcp-project-manual">
              GCP Project ID
            </label>
            <InputText
              id="gcp-project-manual"
              value={manualProjectId}
              onChange={(e) => setManualProjectId(e.target.value)}
              placeholder="e.g. my-project-123"
              className="w-full"
              disabled={submitting}
            />
            <small className="text-500">
              Find your Project ID in the{' '}
              <a
                href="https://console.cloud.google.com/home/dashboard"
                target="_blank"
                rel="noreferrer"
                style={{ color: '#60a5fa' }}
              >
                GCP Console
              </a>{' '}
              dashboard.
            </small>
            <Button
              label="Continue"
              icon="pi pi-arrow-right"
              iconPos="right"
              className="w-full"
              disabled={!canContinue || submitting}
              loading={submitting}
              onClick={handleContinue}
            />
          </div>
        )}

        <div className="mt-3">
          <Button
            label="Back"
            icon="pi pi-arrow-left"
            className="p-button-outlined w-full"
            onClick={onBack}
            disabled={submitting}
          />
        </div>
      </Card>
    </div>
  );
}
