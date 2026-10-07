import { SOPS } from '../lib/sop'

export default function Sops() {
  return (
    <main className="page">
      <h1>Safety & cleaning</h1>
      <div className="muted">Our standard steps for every route. Knock off the dirt, spray, wait 10 minutes, sick yards last.</div>
      {SOPS.map((s) => (
        <section key={s.title} className="card flat sop">
          <h3>{s.title}</h3>
          <ol>
            {s.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </section>
      ))}
    </main>
  )
}
