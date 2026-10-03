# Dataset Specification

## NASA C-MAPSS (Commercial Modular Aero-Propulsion System Simulation)

### Overview
- **Source:** NASA Ames Prognostics Center of Excellence
- **Citation:** Saxena et al., 2008 (Damage Propagation Modeling for Aircraft Engine Run-to-Failure Simulation)
- **Type:** Simulated run-to-failure trajectories for turbofan engines
- **Availability:** Public dataset

### Subsets (We're using FD001 → FD003)

| Subset | Train Engines | Test Engines | Op. Conditions | Fault Modes | Difficulty |
|--------|---------------|--------------|----------------|-------------|-----------|
| FD001  | 100           | 100          | 1 (Sea Level)  | 1 (HPC deg) | EASY      |
| FD002  | 260           | 259          | 6 (varied)     | 1 (HPC deg) | MEDIUM    |
| FD003  | 100           | 100          | 1 (Sea Level)  | 2 (HPC+Fan) | HARD      |
| FD004  | 248           | 249          | 6 (varied)     | 2 (HPC+Fan) | HARDEST   |

### File Structure
- `train_FD00X.txt`: Full run-to-failure data. Each row = 1 operational cycle.
- `test_FD00X.txt`: Data truncated before failure. Used to predict remaining cycles.
- `RUL_FD00X.txt`: Ground truth remaining useful life (cycles) for test set.

### Columns (26 total per row)
1. **Engine ID** (unit number)
2. **Cycle** (time step, 1 to ~500 cycles per engine)
3-5. **Operational Settings** (altitude, Mach, throttle resolver angle)
6-26. **Sensor Readings** (21 sensors: temperatures, pressures, speeds at various engine points)

### Known Issues
- **Flat sensors:** ~2-3 sensors have zero or near-zero variance. Drop these in preprocessing.
- **Class imbalance:** Healthy engines >> critical engines (ratio ~10:1)
- **Noise:** Sensor readings contaminated with realistic noise (mixture of distributions)
- **Scale mismatch:** Temperatures (°R), pressures (psia), speeds (rpm) — must normalize

### Data Split Strategy
- **Training:** Engines 1-80 from FD001 train set
- **Validation:** Engines 81-90 from FD001 train set
- **Test:** All 100 engines from FD001 test set + RUL ground truth