import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { platformService } from '../../services/api/platformService';
import './PlatformAdmin.css';

const formatDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString(undefined, { dateStyle: 'medium' }) : '—';

export default function PaymentConfiguration() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [showPaymentConfigModal, setShowPaymentConfigModal] = useState(false);
  const [showAssistantConfigModal, setShowAssistantConfigModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    is_enabled: false,
    test_mode: true,
    merchant_id: '',
    salt_key: '',
    salt_index: 1,
    registration_amount: 1,
    currency: 'INR',
    api_base_url: 'https://api-preprod.phonepe.com/apis/pg-sandbox',
    redirect_url: '',
    callback_url: '',
  });
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<'' | 'initiated' | 'success' | 'failed' | 'pending'>('');
  const [paymentSearch, setPaymentSearch] = useState('');
  const [paymentPage, setPaymentPage] = useState(1);
  const [assistantForm, setAssistantForm] = useState({
    is_enabled: false,
    provider: 'gemini' as 'gemini' | 'openai',
    model: 'gemini-1.5-flash',
    timeout_ms: 15000,
    gemini_api_key: '',
    openai_api_key: '',
  });

  const isPlatformUser =
    user?.isPlatformAdmin === true ||
    (user?.role === 'superadmin' && (user?.schoolId == null || user?.schoolId === undefined));

  useEffect(() => {
    if (user && !isPlatformUser) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, isPlatformUser, navigate]);

  const registrationPaymentQuery = useQuery(
    ['platform-registration-payment'],
    () => platformService.getRegistrationPaymentConfig(),
    {
      onSuccess: (resp) => {
        const config = resp.data;
        setPaymentForm({
          is_enabled: config.is_enabled,
          test_mode: config.test_mode,
          merchant_id: config.merchant_id || '',
          salt_key: '',
          salt_index: config.salt_index || 1,
          registration_amount: config.registration_amount || 1,
          currency: config.currency || 'INR',
          api_base_url: config.api_base_url || 'https://api-preprod.phonepe.com/apis/pg-sandbox',
          redirect_url: config.redirect_url || '',
          callback_url: config.callback_url || '',
        });
      },
    }
  );

  const updateRegistrationPaymentMutation = useMutation(
    (payload: typeof paymentForm) =>
      platformService.updateRegistrationPaymentConfig({
        ...payload,
        salt_key: payload.salt_key || undefined,
      }),
    {
      onSuccess: () => {
        showToast('Registration payment settings updated successfully', 'success');
        setShowPaymentConfigModal(false);
        queryClient.invalidateQueries(['platform-registration-payment']);
      },
      onError: (err: any) => {
        showToast(err.response?.data?.message || 'Failed to update registration payment settings', 'error');
      },
    }
  );

  const assistantConfigQuery = useQuery(
    ['platform-assistant-llm-config'],
    () => platformService.getAssistantLlmConfig(),
    {
      onSuccess: (resp) => {
        const cfg = resp.data;
        setAssistantForm({
          is_enabled: cfg.is_enabled,
          provider: cfg.provider,
          model: cfg.model || (cfg.provider === 'openai' ? 'gpt-4o-mini' : 'gemini-1.5-flash'),
          timeout_ms: cfg.timeout_ms || 15000,
          gemini_api_key: '',
          openai_api_key: '',
        });
      },
    }
  );

  const updateAssistantConfigMutation = useMutation(
    (payload: typeof assistantForm) =>
      platformService.updateAssistantLlmConfig({
        is_enabled: payload.is_enabled,
        provider: payload.provider,
        model: payload.model || undefined,
        timeout_ms: payload.timeout_ms,
        gemini_api_key: payload.gemini_api_key || undefined,
        openai_api_key: payload.openai_api_key || undefined,
      }),
    {
      onSuccess: () => {
        showToast('Assistant LLM settings updated successfully', 'success');
        setShowAssistantConfigModal(false);
        queryClient.invalidateQueries(['platform-assistant-llm-config']);
      },
      onError: (err: any) => {
        showToast(err.response?.data?.message || 'Failed to update assistant settings', 'error');
      },
    }
  );

  const paymentStatusQuery = useQuery(
    ['platform-registration-payments', paymentStatusFilter, paymentSearch, paymentPage],
    () =>
      platformService.getRegistrationPayments({
        status: paymentStatusFilter,
        search: paymentSearch || undefined,
        page: paymentPage,
        limit: 10,
      }),
    { keepPreviousData: true }
  );

  if (user && !isPlatformUser) {
    return (
      <div className="platform-admin" style={{ padding: '2rem', textAlign: 'center' }}>
        <p className="platform-admin-subtitle" style={{ marginBottom: '1rem' }}>
          Payment Configuration is only available for platform administrators.
        </p>
        <button
          type="button"
          className="platform-admin-filter-btn"
          onClick={() => navigate('/dashboard')}
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="platform-admin">
      <header className="platform-admin-header">
        <h1>Payment Configuration</h1>
        <p className="platform-admin-subtitle">Manage school registration billing and transaction status.</p>
      </header>

      <section className="platform-admin-table-wrap" style={{ marginBottom: '1rem', padding: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.1rem' }}>School Registration Billing</h2>
            <p className="platform-admin-subtitle" style={{ marginTop: '0.25rem' }}>
              Configure PhonePe once for all new school registrations.
            </p>
          </div>
          <button
            type="button"
            className="platform-admin-btn platform-admin-btn--primary"
            onClick={() => setShowPaymentConfigModal(true)}
          >
            Configure PhonePe
          </button>
        </div>
        <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <span className={`platform-admin-badge ${(registrationPaymentQuery.data?.data?.is_enabled) ? 'platform-admin-badge--active' : 'platform-admin-badge--suspended'}`}>
            {(registrationPaymentQuery.data?.data?.is_enabled) ? 'Enabled' : 'Disabled'}
          </span>
          <span className={`platform-admin-badge ${(registrationPaymentQuery.data?.data?.test_mode ?? true) ? 'platform-admin-badge--trial' : 'platform-admin-badge--active'}`}>
            {(registrationPaymentQuery.data?.data?.test_mode ?? true) ? 'Test Mode' : 'Live Mode'}
          </span>
          <span className="platform-admin-badge platform-admin-badge--trial">
            Amount: {(registrationPaymentQuery.data?.data?.currency || 'INR')} {Number(registrationPaymentQuery.data?.data?.registration_amount || 0).toFixed(2)}
          </span>
          <span className="platform-admin-badge platform-admin-badge--expired">
            Merchant: {registrationPaymentQuery.data?.data?.merchant_id ? 'Configured' : 'Missing'}
          </span>
          <span className="platform-admin-badge platform-admin-badge--expired">
            Salt Key: {registrationPaymentQuery.data?.data?.has_salt_key ? 'Configured' : 'Missing'}
          </span>
        </div>
      </section>

      <section className="platform-admin-table-wrap" style={{ marginBottom: '1rem', padding: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.1rem' }}>AI Assistant Configuration</h2>
            <p className="platform-admin-subtitle" style={{ marginTop: '0.25rem' }}>
              Enable or disable cloud LLM assistant and select provider/model.
            </p>
          </div>
          <button
            type="button"
            className="platform-admin-btn platform-admin-btn--primary"
            onClick={() => setShowAssistantConfigModal(true)}
          >
            Configure Assistant
          </button>
        </div>
        <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <span className={`platform-admin-badge ${(assistantConfigQuery.data?.data?.is_enabled) ? 'platform-admin-badge--active' : 'platform-admin-badge--suspended'}`}>
            {(assistantConfigQuery.data?.data?.is_enabled) ? 'Enabled' : 'Disabled'}
          </span>
          <span className="platform-admin-badge platform-admin-badge--trial">
            Provider: {(assistantConfigQuery.data?.data?.provider || 'gemini').toUpperCase()}
          </span>
          <span className="platform-admin-badge platform-admin-badge--trial">
            Model: {assistantConfigQuery.data?.data?.model || 'default'}
          </span>
          <span className="platform-admin-badge platform-admin-badge--trial">
            Timeout: {assistantConfigQuery.data?.data?.timeout_ms || 15000} ms
          </span>
          <span className="platform-admin-badge platform-admin-badge--expired">
            Gemini Key: {assistantConfigQuery.data?.data?.has_gemini_api_key ? 'Configured' : 'Missing'}
          </span>
          <span className="platform-admin-badge platform-admin-badge--expired">
            OpenAI Key: {assistantConfigQuery.data?.data?.has_openai_api_key ? 'Configured' : 'Missing'}
          </span>
        </div>
      </section>

      <section className="platform-admin-table-wrap" style={{ marginBottom: '1rem', padding: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Payment Status</h2>
            <p className="platform-admin-subtitle" style={{ marginTop: '0.25rem' }}>
              Track school-registration payments from PhonePe.
            </p>
          </div>
        </div>
        <div className="platform-admin-filters" style={{ marginTop: '0.75rem' }}>
          <input
            type="text"
            placeholder="Search school or transaction id..."
            value={paymentSearch}
            onChange={(e) => {
              setPaymentSearch(e.target.value);
              setPaymentPage(1);
            }}
            className="platform-admin-search"
          />
          <select
            value={paymentStatusFilter}
            onChange={(e) => {
              setPaymentStatusFilter(e.target.value as '' | 'initiated' | 'success' | 'failed' | 'pending');
              setPaymentPage(1);
            }}
            className="platform-admin-status-select"
          >
            <option value="">All statuses</option>
            <option value="initiated">Initiated</option>
            <option value="pending">Pending</option>
            <option value="success">Success</option>
            <option value="failed">Failed</option>
          </select>
        </div>
        {paymentStatusQuery.isLoading ? (
          <div className="platform-admin-loading">Loading payment status...</div>
        ) : (
          <>
            <div className="platform-admin-table-wrap">
              <table className="platform-admin-table">
                <thead>
                  <tr>
                    <th>School</th>
                    <th>Txn ID</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {(paymentStatusQuery.data?.data || []).length === 0 ? (
                    <tr><td colSpan={5}>No payment records found</td></tr>
                  ) : (
                    (paymentStatusQuery.data?.data || []).map((payment) => (
                      <tr key={payment.id}>
                        <td>{payment.school_name}</td>
                        <td>{payment.merchant_transaction_id}</td>
                        <td>{payment.currency} {Number(payment.amount || 0).toFixed(2)}</td>
                        <td>
                          <span className={`platform-admin-badge platform-admin-badge--${payment.status === 'success' ? 'active' : payment.status === 'failed' ? 'expired' : payment.status === 'pending' ? 'suspended' : 'trial'}`}>
                            {payment.status}
                          </span>
                        </td>
                        <td>{formatDate(payment.created_at)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {(paymentStatusQuery.data?.pagination?.total || 0) > (paymentStatusQuery.data?.pagination?.limit || 10) && (
              <div className="platform-admin-pagination">
                <button
                  type="button"
                  disabled={(paymentStatusQuery.data?.pagination?.page || 1) <= 1}
                  onClick={() => setPaymentPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </button>
                <span>
                  Page {paymentStatusQuery.data?.pagination?.page || 1} of {paymentStatusQuery.data?.pagination?.pages || 1}
                </span>
                <button
                  type="button"
                  disabled={(paymentStatusQuery.data?.pagination?.page || 1) >= (paymentStatusQuery.data?.pagination?.pages || 1)}
                  onClick={() => setPaymentPage((p) => p + 1)}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </section>

      {showPaymentConfigModal && (
        <div className="platform-admin-modal-overlay" onClick={() => setShowPaymentConfigModal(false)}>
          <div className="platform-admin-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Configure PhonePe Registration Billing</h2>
            <div className="platform-admin-form">
              <label>
                <input
                  type="checkbox"
                  checked={paymentForm.is_enabled}
                  onChange={(e) => setPaymentForm((prev) => ({ ...prev, is_enabled: e.target.checked }))}
                />
                Enable payment during school registration
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={paymentForm.test_mode}
                  onChange={(e) => setPaymentForm((prev) => ({ ...prev, test_mode: e.target.checked }))}
                />
                Test Mode (recommended until KYC is complete)
              </label>
              <label>Client ID (PhonePe Merchant ID)
                <input
                  type="text"
                  value={paymentForm.merchant_id}
                  onChange={(e) => setPaymentForm((prev) => ({ ...prev, merchant_id: e.target.value }))}
                  placeholder="Paste PhonePe Client ID"
                />
              </label>
              <label>Client Secret (Salt Key)
                <input
                  type="password"
                  value={paymentForm.salt_key}
                  onChange={(e) => setPaymentForm((prev) => ({ ...prev, salt_key: e.target.value }))}
                  placeholder="Paste PhonePe Client Secret (leave blank to keep existing)"
                />
              </label>
              <label>Client Version (Salt Index)
                <input
                  type="number"
                  min={1}
                  value={paymentForm.salt_index}
                  onChange={(e) => setPaymentForm((prev) => ({ ...prev, salt_index: Number(e.target.value || 1) }))}
                />
                <small>
                  For test credentials, use PhonePe Client Version here (usually 1).
                </small>
              </label>
              <label>Registration Amount
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={paymentForm.registration_amount}
                  onChange={(e) => setPaymentForm((prev) => ({ ...prev, registration_amount: Number(e.target.value || 0) }))}
                />
              </label>
              <label>Currency
                <input
                  type="text"
                  value={paymentForm.currency}
                  onChange={(e) => setPaymentForm((prev) => ({ ...prev, currency: e.target.value.toUpperCase() }))}
                  placeholder="INR"
                />
              </label>
              <label>PhonePe API Base URL
                <input
                  type="text"
                  value={paymentForm.api_base_url}
                  onChange={(e) => setPaymentForm((prev) => ({ ...prev, api_base_url: e.target.value }))}
                  placeholder="https://api-preprod.phonepe.com/apis/pg-sandbox"
                />
              </label>
              <label>Redirect URL (optional)
                <input
                  type="text"
                  value={paymentForm.redirect_url}
                  onChange={(e) => setPaymentForm((prev) => ({ ...prev, redirect_url: e.target.value }))}
                  placeholder="https://your-frontend/login?registration_payment=completed"
                />
              </label>
              <label>Callback URL (optional)
                <input
                  type="text"
                  value={paymentForm.callback_url}
                  onChange={(e) => setPaymentForm((prev) => ({ ...prev, callback_url: e.target.value }))}
                  placeholder="https://your-api/api/v1/public/schools/payment/phonepe/callback"
                />
              </label>
            </div>
            <div className="platform-admin-modal-actions">
              <button type="button" className="platform-admin-btn" onClick={() => setShowPaymentConfigModal(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="platform-admin-btn platform-admin-btn--primary"
                disabled={updateRegistrationPaymentMutation.isLoading}
                onClick={() => updateRegistrationPaymentMutation.mutate(paymentForm)}
              >
                {updateRegistrationPaymentMutation.isLoading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showAssistantConfigModal && (
        <div className="platform-admin-modal-overlay" onClick={() => setShowAssistantConfigModal(false)}>
          <div className="platform-admin-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Configure AI Assistant (Cloud LLM)</h2>
            <div className="platform-admin-form">
              <label>
                <input
                  type="checkbox"
                  checked={assistantForm.is_enabled}
                  onChange={(e) => setAssistantForm((prev) => ({ ...prev, is_enabled: e.target.checked }))}
                />
                Enable AI Assistant LLM fallback
              </label>
              <label>Provider
                <select
                  value={assistantForm.provider}
                  onChange={(e) => {
                    const provider = e.target.value as 'gemini' | 'openai';
                    setAssistantForm((prev) => ({
                      ...prev,
                      provider,
                      model: provider === 'openai' ? 'gpt-4o-mini' : 'gemini-1.5-flash',
                    }));
                  }}
                >
                  <option value="gemini">Gemini</option>
                  <option value="openai">OpenAI</option>
                </select>
              </label>
              <label>Model
                <input
                  type="text"
                  value={assistantForm.model}
                  onChange={(e) => setAssistantForm((prev) => ({ ...prev, model: e.target.value }))}
                  placeholder={assistantForm.provider === 'openai' ? 'gpt-4o-mini' : 'gemini-1.5-flash'}
                />
              </label>
              <label>Timeout (ms)
                <input
                  type="number"
                  min={2000}
                  max={60000}
                  step={1000}
                  value={assistantForm.timeout_ms}
                  onChange={(e) =>
                    setAssistantForm((prev) => ({
                      ...prev,
                      timeout_ms: Number(e.target.value || 15000),
                    }))
                  }
                />
              </label>
              <label>Gemini API Key
                <input
                  type="password"
                  value={assistantForm.gemini_api_key}
                  onChange={(e) => setAssistantForm((prev) => ({ ...prev, gemini_api_key: e.target.value }))}
                  placeholder="Leave blank to keep existing Gemini key"
                />
              </label>
              <label>OpenAI API Key
                <input
                  type="password"
                  value={assistantForm.openai_api_key}
                  onChange={(e) => setAssistantForm((prev) => ({ ...prev, openai_api_key: e.target.value }))}
                  placeholder="Leave blank to keep existing OpenAI key"
                />
              </label>
            </div>
            <div className="platform-admin-modal-actions">
              <button type="button" className="platform-admin-btn" onClick={() => setShowAssistantConfigModal(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="platform-admin-btn platform-admin-btn--primary"
                disabled={updateAssistantConfigMutation.isLoading}
                onClick={() => updateAssistantConfigMutation.mutate(assistantForm)}
              >
                {updateAssistantConfigMutation.isLoading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
