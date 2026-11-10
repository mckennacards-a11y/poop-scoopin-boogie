import { Link } from 'react-router-dom'
import PublicLayout from '../components/PublicLayout'
import { BUSINESS, FAQS } from '../lib/business'

export default function Faq() {
  return (
    <PublicLayout>
      <main className="band">
        <div className="band-inner">
          <h1 className="section-title">Frequently asked questions</h1>
          <div className="faq">
            {FAQS.map((f) => (
              <details key={f.q} open>
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
          <div className="card flat">
            <h2>Still wondering about something?</h2>
            <p>
              {BUSINESS.phone ? `Call or text us at ${BUSINESS.phone}, or ` : ''}sign up and put your question in the notes. We’ll get back to you within a day.
            </p>
            <Link to="/signup" className="btn primary">
              Sign up
            </Link>
          </div>
        </div>
      </main>
    </PublicLayout>
  )
}
