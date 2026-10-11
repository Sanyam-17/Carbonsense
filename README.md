# CarbonSense 3D (Next.js)
```
npm install
npm run dev
```
Open http://localhost:3000

Routes: `/` `/login` `/scan` `/processing` `/rooms` `/room` `/device/[id]` `/house` `/analytics` `/env`

- `components/Shell.tsx` mounts one persistent WebGL canvas and the nav; the camera flies between views as the route changes.
- `lib/engine.js` holds the Three.js scene and the simulated live data (state object `S`, `tick` in `setInterval`). Replace the simulator with your SSE/MQTT feed by writing into `S.co2`, `S.t`, `S.h`, `S.w` and calling `upd()`.
- Pages in `app/**/page.tsx` are plain markup; numbers are bound with `data-k` attributes.
