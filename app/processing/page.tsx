import {redirect} from 'next/navigation'
// The old timer-based "processing" screen showed fake progress. Real steps are reported by the import page.
export default function Page() { redirect('/rooms/import') }
