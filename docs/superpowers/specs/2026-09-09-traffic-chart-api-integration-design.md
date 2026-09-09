# Traffic Chart API Integration

## Scope

Connect the existing peak-hour chart to the chart objects now returned by the
Lead Scanner usage and Dashboard endpoints.

## Data flow

- `getLeadScannerUsage` maps root `data.chart` and each `data.days[].chart`.
- The Lead Scanner page uses the matching selected day's `chart`. Root
  `data.chart` is mapped as Overall data but is not rendered for the Total
  selection, per the backend guidance.
- `getDashboard` exposes `data.attendance_chart`.
- The admin Dashboard renders the existing Peak Hour Traffic card directly
  below its key metrics, with `attendance_chart`; organizer pages are out of
  scope.

The shared model accepts `hour` as a number or string, `label`, and `scans`.
The backend-supplied `label`, `peakHour`, and `peakScans` values are retained.
`peakHour` is converted to the matching point label only when the card needs
to display the peak time; `peakScans` is not recomputed. No chart values are
reformatted or synthesized by the client.

## Empty and legacy data

When a chart is absent or contains no points, the chart renders 24 zero-value
points. The existing synthetic weighted fallback is removed so the UI never
invents traffic data. Existing `hourly_traffic` support remains as a
compatibility fallback for the Lead Scanner page. The Overall day remains
excluded from the day navigator; its nested chart does not take precedence
over a selected day.

## Verification

Action tests will prove the root, daily, and dashboard response fields are
mapped, including numeric hours and peak metadata. Component tests will prove
selected daily chart data reaches the peak-hour visual and the Dashboard card
renders API data.
