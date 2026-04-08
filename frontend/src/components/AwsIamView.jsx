import React, { useEffect, useState } from 'react';
import { Card } from 'primereact/card';
import { Tag } from 'primereact/tag';
import { Message } from 'primereact/message';
import { ProgressSpinner } from 'primereact/progressspinner';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { getAwsIamRoles } from '../api/cloudApi';

// Friendly descriptions for common AWS managed policies
const POLICY_DESCRIPTIONS = {
  AdministratorAccess: 'Full access to all AWS services and resources',
  PowerUserAccess: 'Full access except IAM user and group management',
  ReadOnlyAccess: 'Read-only access to all AWS services',
  SecurityAudit: 'Read-only access for security auditing',
  AmazonS3FullAccess: 'Full access to S3',
  AmazonS3ReadOnlyAccess: 'Read-only access to S3',
  AWSLambdaFullAccess: 'Full access to Lambda',
  AWSLambdaBasicExecutionRole: 'Write logs to CloudWatch',
  AmazonEC2FullAccess: 'Full access to EC2',
  AmazonEC2ReadOnlyAccess: 'Read-only access to EC2',
  AmazonRDSFullAccess: 'Full access to RDS',
  AmazonDynamoDBFullAccess: 'Full access to DynamoDB',
  AmazonDynamoDBReadOnlyAccess: 'Read-only access to DynamoDB',
  AmazonECRFullAccess: 'Full access to ECR',
  AWSCodeDeployFullAccess: 'Full access to CodeDeploy',
  AmazonAthenaFullAccess: 'Full access to Athena',
  AmazonSQSFullAccess: 'Full access to SQS',
};

function policyDescription(policy) {
  return POLICY_DESCRIPTIONS[policy] || policy;
}

function PoliciesCell({ policies }) {
  if (!policies || policies.length === 0) return <span style={{ color: '#64748b' }}>—</span>;
  const isAdmin = (p) => ['AdministratorAccess', 'PowerUserAccess'].includes(p);
  return (
    <div className="flex flex-wrap gap-1">
      {policies.map((policy) => (
        <span
          key={policy}
          title={policyDescription(policy)}
          className="text-xs px-2 py-1"
          style={{
            background: isAdmin(policy) ? '#450a0a' : '#1e3a5f',
            borderRadius: '12px',
            color: isAdmin(policy) ? '#fca5a5' : '#93c5fd',
            fontFamily: 'monospace',
            border: isAdmin(policy) ? '1px solid #991b1b' : 'none',
          }}
        >
          {policy}
        </span>
      ))}
    </div>
  );
}

function GroupsCell({ groups }) {
  if (!groups || groups.length === 0) return <span style={{ color: '#64748b' }}>—</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {groups.map((g) => (
        <span
          key={g}
          className="text-xs px-2 py-1"
          style={{
            background: '#1e3a5f',
            borderRadius: '12px',
            color: '#93c5fd',
            fontFamily: 'monospace',
          }}
        >
          {g}
        </span>
      ))}
    </div>
  );
}

export default function AwsIamView() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getAwsIamRoles()
      .then((res) => setData(res.data))
      .catch((err) => setError(err?.response?.data?.detail || 'Failed to load IAM data.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-content-center align-items-center" style={{ minHeight: '200px' }}>
        <ProgressSpinner style={{ width: '40px', height: '40px' }} />
      </div>
    );
  }

  if (error || data?.error) {
    return (
      <Message
        severity="error"
        text={error || data.error}
        className="w-full mt-3"
      />
    );
  }

  const { account_id, users = [], roles = [], groups = [] } = data || {};

  return (
    <div className="mt-3">
      {/* Account summary card */}
      <Card
        className="mb-4"
        style={{ background: '#1e293b', border: '1px solid #334155' }}
      >
        <div className="flex align-items-center gap-3 flex-wrap">
          <div
            className="flex align-items-center justify-content-center border-circle"
            style={{ width: '48px', height: '48px', background: '#FF9900', flexShrink: 0 }}
          >
            <i className="pi pi-shield" style={{ color: '#fff', fontSize: '1.2rem' }} />
          </div>
          <div>
            <div className="font-bold text-lg" style={{ color: '#f1f5f9' }}>
              AWS IAM Summary
            </div>
            <div className="text-sm" style={{ color: '#94a3b8' }}>
              Account ID: <span style={{ color: '#fb923c' }}>{account_id}</span>
            </div>
          </div>
          <div className="flex gap-3 ml-auto flex-wrap">
            {[
              { label: 'Users', count: users.length, icon: 'pi-user', color: '#60a5fa' },
              { label: 'Roles', count: roles.length, icon: 'pi-cog', color: '#a78bfa' },
              { label: 'Groups', count: groups.length, icon: 'pi-users', color: '#34d399' },
            ].map(({ label, count, icon, color }) => (
              <div
                key={label}
                style={{
                  background: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  padding: '10px 16px',
                  textAlign: 'center',
                  minWidth: '80px',
                }}
              >
                <i className={`pi ${icon}`} style={{ color, fontSize: '1.1rem' }} />
                <div style={{ color: '#f1f5f9', fontWeight: 700, fontSize: '1.3rem' }}>{count}</div>
                <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Users table */}
      <Card
        className="mb-4"
        style={{ background: '#1e293b', border: '1px solid #334155' }}
      >
        <div className="font-bold text-lg mb-3" style={{ color: '#f1f5f9' }}>
          <i className="pi pi-user mr-2" style={{ color: '#60a5fa' }} />
          IAM Users ({users.length})
        </div>
        <DataTable
          value={users}
          paginator
          rows={15}
          rowsPerPageOptions={[15, 30, 50]}
          emptyMessage="No IAM users found."
          style={{ background: '#1e293b' }}
          className="p-datatable-sm"
          stripedRows
          sortField="name"
          sortOrder={1}
        >
          <Column
            field="name"
            header="Username"
            sortable
            style={{ minWidth: '160px' }}
            body={(row) => (
              <div className="flex align-items-center gap-2">
                <i className="pi pi-user" style={{ color: '#60a5fa', fontSize: '0.95rem' }} />
                <span style={{ color: '#e2e8f0', fontFamily: 'monospace', fontSize: '0.85rem' }}>
                  {row.name}
                </span>
              </div>
            )}
          />
          <Column
            field="mfa_enabled"
            header="MFA"
            sortable
            style={{ width: '90px', textAlign: 'center' }}
            body={(row) => (
              row.mfa_enabled
                ? <Tag value="Enabled" severity="success" />
                : <Tag value="Disabled" severity="danger" />
            )}
          />
          <Column
            field="groups"
            header="Groups"
            style={{ minWidth: '180px' }}
            body={(row) => <GroupsCell groups={row.groups} />}
          />
          <Column
            field="policies"
            header="Policies"
            style={{ minWidth: '280px' }}
            body={(row) => <PoliciesCell policies={row.policies} />}
          />
          <Column
            field="password_last_used"
            header="Last Active"
            sortable
            style={{ width: '140px' }}
            body={(row) => (
              <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>
                {row.password_last_used
                  ? String(row.password_last_used).split('T')[0]
                  : '—'}
              </span>
            )}
          />
        </DataTable>
      </Card>

      {/* Roles table */}
      <Card
        className="mb-4"
        style={{ background: '#1e293b', border: '1px solid #334155' }}
      >
        <div className="font-bold text-lg mb-3" style={{ color: '#f1f5f9' }}>
          <i className="pi pi-cog mr-2" style={{ color: '#a78bfa' }} />
          IAM Roles ({roles.length})
        </div>
        <DataTable
          value={roles}
          paginator
          rows={15}
          rowsPerPageOptions={[15, 30, 50]}
          emptyMessage="No IAM roles found."
          style={{ background: '#1e293b' }}
          className="p-datatable-sm"
          stripedRows
          sortField="name"
          sortOrder={1}
        >
          <Column
            field="name"
            header="Role Name"
            sortable
            style={{ minWidth: '180px' }}
            body={(row) => (
              <span style={{ color: '#e2e8f0', fontFamily: 'monospace', fontSize: '0.85rem' }}>
                {row.name}
              </span>
            )}
          />
          <Column
            field="description"
            header="Description"
            style={{ minWidth: '200px' }}
            body={(row) => (
              <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>
                {row.description || '—'}
              </span>
            )}
          />
          <Column
            field="policies"
            header="Attached Policies"
            style={{ minWidth: '280px' }}
            body={(row) => <PoliciesCell policies={row.policies} />}
          />
        </DataTable>
      </Card>

      {/* Groups table */}
      <Card
        style={{ background: '#1e293b', border: '1px solid #334155' }}
      >
        <div className="font-bold text-lg mb-3" style={{ color: '#f1f5f9' }}>
          <i className="pi pi-users mr-2" style={{ color: '#34d399' }} />
          IAM Groups ({groups.length})
        </div>
        <DataTable
          value={groups}
          paginator
          rows={15}
          rowsPerPageOptions={[15, 30, 50]}
          emptyMessage="No IAM groups found."
          style={{ background: '#1e293b' }}
          className="p-datatable-sm"
          stripedRows
          sortField="name"
          sortOrder={1}
        >
          <Column
            field="name"
            header="Group Name"
            sortable
            style={{ minWidth: '180px' }}
            body={(row) => (
              <span style={{ color: '#e2e8f0', fontFamily: 'monospace', fontSize: '0.85rem' }}>
                {row.name}
              </span>
            )}
          />
          <Column
            field="member_count"
            header="Members"
            sortable
            style={{ width: '100px', textAlign: 'center' }}
            body={(row) => <Tag value={row.member_count} severity="secondary" />}
          />
          <Column
            field="policies"
            header="Attached Policies"
            style={{ minWidth: '280px' }}
            body={(row) => <PoliciesCell policies={row.policies} />}
          />
        </DataTable>
      </Card>
    </div>
  );
}
