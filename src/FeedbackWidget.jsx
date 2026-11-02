import { useState } from 'react'
import { CheckCircle2, MessageCircle, Send, X } from 'lucide-react'

const FEEDBACK_EMAIL = 'alpeshrpatel@gmail.com'
const FEEDBACK_ENDPOINT = `https://formsubmit.co/ajax/${FEEDBACK_EMAIL}`

export default function FeedbackWidget() {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState('idle')
  const [notice, setNotice] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    if (!message.trim()) {
      setNotice('Please enter your feedback before sending.')
      setStatus('error')
      return
    }

    setStatus('sending')
    setNotice('')

    try {
      const response = await fetch(FEEDBACK_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          email: email.trim() || 'not provided',
          message: message.trim(),
          _subject: 'VisaPulse feedback',
          _template: 'table',
        }),
      })

      if (!response.ok) throw new Error('Feedback request failed')
      const data = await response.json().catch(() => ({}))
      if (data.success === false || data.success === 'false') {
        throw new Error(data.message || 'Feedback request failed')
      }

      setStatus('sent')
      setNotice('Thanks! Your feedback was sent.')
      setMessage('')
      setEmail('')
      window.setTimeout(() => {
        setStatus('idle')
        setNotice('')
        setOpen(false)
      }, 2200)
    } catch (error) {
      const subject = encodeURIComponent('VisaPulse feedback')
      const body = encodeURIComponent(
        `From: ${email.trim() || 'not provided'}\n\n${message.trim()}`,
      )
      window.location.href = `mailto:${FEEDBACK_EMAIL}?subject=${subject}&body=${body}`
      setStatus('idle')
      setNotice('Opened your email app to send the feedback.')
    }
  }

  function toggle() {
    setOpen((value) => !value)
    setNotice('')
    if (status === 'error') setStatus('idle')
  }

  return (
    <div className="feedback-widget">
      {open && (
        <section className="feedback-panel" aria-labelledby="feedback-title">
          <header className="feedback-panel-header">
            <div>
              <h2 id="feedback-title">Send feedback</h2>
              <p>Share ideas, bugs, or feature requests.</p>
            </div>
            <button
              type="button"
              className="feedback-close"
              onClick={() => setOpen(false)}
              aria-label="Close feedback form"
            >
              <X size={16} />
            </button>
          </header>

          <form className="feedback-form" onSubmit={handleSubmit}>
            <label className="feedback-field">
              <span>Email (optional)</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
              />
            </label>

            <label className="feedback-field">
              <span>Feedback</span>
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Tell us what you think..."
                rows={5}
                required
              />
            </label>

            {notice && (
              <p
                className={`feedback-notice ${status === 'error' ? 'is-error' : 'is-success'}`}
                role="status"
              >
                {status === 'sent' && <CheckCircle2 size={14} />}
                {notice}
              </p>
            )}

            <button
              type="submit"
              className="feedback-submit"
              disabled={status === 'sending'}
            >
              <Send size={15} />
              {status === 'sending' ? 'Sending...' : 'Send feedback'}
            </button>
          </form>
        </section>
      )}

      <button
        type="button"
        className="feedback-toggle"
        onClick={toggle}
        aria-expanded={open}
        aria-label={open ? 'Close feedback' : 'Open feedback'}
      >
        <MessageCircle size={20} />
        <span>Feedback</span>
      </button>
    </div>
  )
}
