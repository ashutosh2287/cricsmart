# Win Probability Calibration Pipeline (M1)

This folder stores calibration-stage artifacts for win probability models.

## Supported calibrators
- Isotonic regression
- Platt scaling

## Expected artifacts
- `calibration-manifest.json`: active calibration metadata
- `reliability-report.json`: calibration curve bins and Brier metrics

The runtime service in `src/services/ml/calibration/**` consumes equivalent manifest fields.
