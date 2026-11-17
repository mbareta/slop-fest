import { getCurrentTenant } from '@/lib/current-tenant';

export default async function HomePage() {
  const tenant = await getCurrentTenant();
  return (
    <main>
      <h1>Slop Fest</h1>
      {tenant && <p>Signed in to {tenant.name}</p>}
      <p>Charts and reports from your connected data sources are coming soon.</p>
    </main>
  );
}
