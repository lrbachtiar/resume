import { Link } from 'react-router-dom'
import '../components/Landing/Landing.css'

export default function NotFoundPage() {
  return (
    <main className="landing" style={{ justifyContent: 'center' }}>
      <p className="mono-label landing__eyebrow">Lost ball</p>
      <h1 className="landing__title">This one went into the trees.</h1>
      <p className="landing__ask">
        <Link to="/">Back to the clubhouse</Link>
      </p>
    </main>
  )
}
