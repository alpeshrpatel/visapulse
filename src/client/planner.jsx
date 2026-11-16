import { createRoot } from 'react-dom/client'
import GreenCardPlanner from '../GreenCardPlanner.jsx'

// The only React island on the site. The bulletin is embedded by the build as JSON.
const mount = document.getElementById('planner-root')
const data = document.getElementById('planner-bulletin')
if (mount && data) {
  createRoot(mount).render(<GreenCardPlanner bulletin={JSON.parse(data.textContent)} />)
}
