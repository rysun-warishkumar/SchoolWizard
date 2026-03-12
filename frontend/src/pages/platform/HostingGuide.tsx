import { Link } from 'react-router-dom';

const cardStyle: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #e5e7eb',
  borderRadius: '10px',
  padding: '1rem',
  marginBottom: '1rem',
};

export default function HostingGuide() {
  return (
    <div style={{ maxWidth: '1100px' }}>
      <div style={{ marginBottom: '1rem' }}>
        <h1 style={{ margin: 0 }}>Utho Cloud Hosting Guide</h1>
        <p style={{ color: '#6b7280', marginTop: '0.4rem' }}>
          Step-by-step guide to host complete SchoolWizard on your dedicated server.
        </p>
      </div>

      <div style={cardStyle}>
        <h3 style={{ marginTop: 0 }}>1) Server Prep (Initial Setup)</h3>
        <ol>
          <li>Provision Ubuntu 22.04 LTS dedicated server on Utho Cloud.</li>
          <li>Create non-root sudo user and disable password login for root.</li>
          <li>Install base packages: Node.js LTS, npm, Nginx, MySQL, PM2, Git.</li>
          <li>Open firewall ports: 22, 80, 443 (and app ports only if needed internally).</li>
        </ol>
      </div>

      <div style={cardStyle}>
        <h3 style={{ marginTop: 0 }}>2) Code Deployment</h3>
        <ol>
          <li>Clone project to a stable path, e.g. <code>/var/www/schoolwizard</code>.</li>
          <li>Install dependencies in root, <code>backend</code>, and <code>frontend</code>.</li>
          <li>Build frontend (<code>npm run build</code> in <code>frontend</code>).</li>
          <li>Build backend (<code>npm run build</code> in <code>backend</code>).</li>
        </ol>
      </div>

      <div style={cardStyle}>
        <h3 style={{ marginTop: 0 }}>3) Database Setup</h3>
        <ol>
          <li>Create production database and DB user with least privileges.</li>
          <li>Set backend env values for DB host/user/password/name.</li>
          <li>Run SQL migrations in order (including control-plane migration).</li>
          <li>Create/verify platform admin account and school seed data.</li>
        </ol>
      </div>

      <div style={cardStyle}>
        <h3 style={{ marginTop: 0 }}>4) Environment Variables (Important)</h3>
        <ul>
          <li><code>NODE_ENV=production</code></li>
          <li><code>JWT_SECRET</code> long and secure</li>
          <li><code>FRONTEND_URL</code> set to your domain</li>
          <li>SMTP variables for emails</li>
          <li>
            SaaS flags:
            <ul>
              <li><code>SAAS_CONTROL_PLANE_ENABLED=true</code></li>
              <li><code>SAAS_DOMAIN_ROUTING_ENABLED=false</code> (enable later)</li>
              <li><code>SAAS_DEDICATED_WORKFLOW_ENABLED=false</code> (enable when ready)</li>
            </ul>
          </li>
        </ul>
      </div>

      <div style={cardStyle}>
        <h3 style={{ marginTop: 0 }}>5) Run Backend with PM2</h3>
        <ol>
          <li>Start backend via PM2 pointing to <code>backend/dist/index.js</code>.</li>
          <li>Enable PM2 startup and save process list.</li>
          <li>Confirm health endpoint and logs.</li>
        </ol>
      </div>

      <div style={cardStyle}>
        <h3 style={{ marginTop: 0 }}>6) Nginx Reverse Proxy + SSL</h3>
        <ol>
          <li>Serve frontend static build from Nginx.</li>
          <li>Proxy API routes (<code>/api</code>) to backend service port.</li>
          <li>Issue SSL with Let&apos;s Encrypt for your main domain.</li>
          <li>Force HTTPS and set security headers.</li>
        </ol>
      </div>

      <div style={cardStyle}>
        <h3 style={{ marginTop: 0 }}>7) Multi-Tenant Domain Workflow</h3>
        <ol>
          <li>In Platform Admin, register school domain in Control Plane.</li>
          <li>Update DNS in your provider to point to server/Nginx.</li>
          <li>Verify domain and SSL status in Control Plane.</li>
          <li>Enable domain routing flag only after testing fallback routes.</li>
        </ol>
      </div>

      <div style={cardStyle}>
        <h3 style={{ marginTop: 0 }}>8) Backup, Monitoring, and Security</h3>
        <ul>
          <li>Daily DB backup + uploads backup with retention policy.</li>
          <li>Set uptime monitoring and alerting on backend and Nginx.</li>
          <li>Use fail2ban, SSH key auth, and regular system updates.</li>
          <li>Rotate secrets periodically and protect .env files.</li>
        </ul>
      </div>

      <div style={cardStyle}>
        <h3 style={{ marginTop: 0 }}>9) Rollout Checklist</h3>
        <ol>
          <li>Staging smoke tests (auth, academics, fees, public CMS).</li>
          <li>Production deploy in low-traffic window.</li>
          <li>Post-deploy checks: login, email, uploads, control-plane APIs.</li>
          <li>Keep rollback snapshot ready before each major change.</li>
        </ol>
      </div>

      <p style={{ color: '#6b7280' }}>
        Need school-level insights? Visit <Link to="/platform">Platform Admin</Link> and open school details.
      </p>
    </div>
  );
}
