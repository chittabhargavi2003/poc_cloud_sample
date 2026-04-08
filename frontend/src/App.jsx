import React, { useState, useEffect } from 'react';
import { PrimeReactProvider } from 'primereact/api';
import CloudSelector from './components/CloudSelector';
import CredentialsForm from './components/CredentialsForm';
import GcpProjectSelect from './components/GcpProjectSelect';
import GcpBillingConfig from './components/GcpBillingConfig';
import Dashboard from './components/Dashboard';
import { clearCredentials, getSession } from './api/cloudApi';

export default function App() {
  // steps: 'cloud-select' | 'credentials' | 'gcp-project-select' | 'gcp-billing-config' | 'dashboard'
  const [step, setStep] = useState('cloud-select');
  const [provider, setProvider] = useState(null);
  const [isMock, setIsMock] = useState(true);
  const [hasGcpProjects, setHasGcpProjects] = useState(false);
  // Where the gcp-project-select step should navigate back to
  const [gcpProjectBackTo, setGcpProjectBackTo] = useState('cloud-select');
  // Where the gcp-billing-config step should navigate back to
  const [gcpBillingBackTo, setGcpBillingBackTo] = useState('gcp-project-select');
  // Current BigQuery config for the "Change Billing" pre-fill
  const [gcpBillingDataset, setGcpBillingDataset] = useState('');
  const [gcpBillingTable, setGcpBillingTable] = useState('');

  // On mount: restore an active session (handles page refresh) and GCP OAuth redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const gcpAuth = params.get('gcp_auth');

    if (gcpAuth) {
      // Remove the query param from the URL without triggering a reload
      window.history.replaceState({}, '', '/');

      if (gcpAuth === 'select_project') {
        // Multiple projects – let user pick before going to billing config
        setProvider('gcp');
        setIsMock(false);
        setGcpProjectBackTo('cloud-select');
        setStep('gcp-project-select');
        return;
      }
      // For 'success' or 'error', fall through to session check below
    }

    // Restore session state on page refresh (or after OAuth success redirect)
    getSession()
      .then((res) => {
        const { active, provider: p, mock, project_id, has_gcp_projects, bigquery_dataset, bigquery_table } = res.data;
        if (!active) return;
        setProvider(p);
        setIsMock(mock ?? false);
        if (p === 'gcp') {
          setHasGcpProjects(has_gcp_projects ?? false);
          setGcpBillingDataset(bigquery_dataset || '');
          setGcpBillingTable(bigquery_table || '');
          if (!project_id && has_gcp_projects) {
            // OAuth completed but no project selected yet
            setGcpProjectBackTo('cloud-select');
            setStep('gcp-project-select');
            return;
          }
        }
        setStep('dashboard');
      })
      .catch(() => {});
  }, []);

  const handleCloudSelect = (p) => {
    setProvider(p);
    setStep('credentials');
  };

  const handleCredentialsSuccess = (p, mock) => {
    setProvider(p);
    setIsMock(mock);
    setStep('dashboard');
  };

  const handleChangeProject = () => {
    setGcpProjectBackTo('dashboard');
    setStep('gcp-project-select');
  };

  const handleGcpProjectSuccess = (p, mock) => {
    setHasGcpProjects(true);
    setProvider(p);
    setIsMock(mock);
    // After selecting a project, go to billing config
    setGcpBillingBackTo('gcp-project-select');
    setStep('gcp-billing-config');
  };

  const handleGcpBillingSuccess = () => {
    setStep('dashboard');
  };

  const handleChangeBilling = () => {
    setGcpBillingBackTo('dashboard');
    setStep('gcp-billing-config');
  };

  const handleLogout = async () => {
    try { await clearCredentials(); } catch { /* ignore */ }
    setProvider(null);
    setIsMock(true);
    setHasGcpProjects(false);
    setGcpProjectBackTo('cloud-select');
    setGcpBillingDataset('');
    setGcpBillingTable('');
    setStep('cloud-select');
  };

  return (
    <PrimeReactProvider>
      {step === 'cloud-select' && (
        <CloudSelector onSelect={handleCloudSelect} />
      )}
      {step === 'credentials' && provider && (
        <CredentialsForm
          provider={provider}
          onSuccess={handleCredentialsSuccess}
          onBack={() => setStep('cloud-select')}
        />
      )}
      {step === 'gcp-project-select' && (
        <GcpProjectSelect
          onSuccess={handleGcpProjectSuccess}
          onBack={() => setStep(gcpProjectBackTo)}
        />
      )}
      {step === 'gcp-billing-config' && (
        <GcpBillingConfig
          initialDataset={gcpBillingDataset}
          initialTable={gcpBillingTable}
          onSuccess={handleGcpBillingSuccess}
          onBack={() => setStep(gcpBillingBackTo)}
        />
      )}
      {step === 'dashboard' && provider && (
        <Dashboard
          provider={provider}
          isMock={isMock}
          onLogout={handleLogout}
          onChangeProject={hasGcpProjects ? handleChangeProject : null}
          onChangeBilling={provider === 'gcp' ? handleChangeBilling : null}
        />
      )}
    </PrimeReactProvider>
  );
}
