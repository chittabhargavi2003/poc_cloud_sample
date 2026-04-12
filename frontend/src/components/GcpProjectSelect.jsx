import React, { useEffect, useState } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Message } from 'primereact/message';
import { getGcpProjects, selectGcpProject } from '../api/cloudApi';

export default function GcpProjectSelect({ onSuccess, onBack }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
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
    if (!selected) return;
    setSubmitting(true);
    try {
      await selectGcpProject(selected.project_id);
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
            Choose a project from the dropdown to continue.
          </p>
        </div>

        {error && <Message severity="error" text={error} className="w-full mb-3" />}

        {loading ? (
          <div className="flex justify-content-center py-4">
            <ProgressSpinner style={{ width: '40px', height: '40px' }} />
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-column gap-3">
            <Message
              severity="error"
              className="w-full"
              text={
                discoveryError
                  ? `Unable to retrieve your GCP projects: ${discoveryError}`
                  : 'No accessible GCP projects were found for your account.'
              }
            />
            <p className="text-500 text-sm m-0">
              Make sure the <strong>Cloud Resource Manager API</strong> is enabled and your
              account has the <strong>resourcemanager.projects.list</strong> permission (e.g.{' '}
              <code>roles/viewer</code> or <code>roles/browser</code>), then log out and try again.
            </p>
          </div>
        ) : (
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
              disabled={!selected || submitting}
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
