export default function DashboardPlaceholder() {
  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-4xl rounded-2xl bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">
          EduGuard Dashboard
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Login succeeded. Next phases will add alerts, requests, and monitoring
          views.
        </p>
      </div>
    </div>
  );
}
