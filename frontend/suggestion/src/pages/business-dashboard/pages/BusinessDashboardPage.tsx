interface StatCard {
  label: string
  value: string
  delta: string
}

const statCards: StatCard[] = [
 
]

const activityList: string[] = [
 
]

export default function BusinessDashboardPage() {
  return (
    <section className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <article key={card.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">{card.label}</p>
            <p className="mt-3 text-3xl font-bold text-slate-900">{card.value}</p>
            <p className="mt-2 text-xs font-semibold text-emerald-700">{card.delta}</p>
          </article>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2">
          <h3 className="text-lg font-bold text-slate-900">Service Activity</h3>
          <ul className="mt-4 space-y-3">
            {activityList.map((activity) => (
              <li key={activity} className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                {activity}
              </li>
            ))}
          </ul>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900">Policy Reminder</h3>
          <p className="mt-4 text-sm leading-6 text-slate-700">
            Every suggestion submitted through the QR system must receive status updates within 72 hours, with audit
            logs available for departmental review.
          </p>
        </article>
      </div>
    </section>
  )
}
