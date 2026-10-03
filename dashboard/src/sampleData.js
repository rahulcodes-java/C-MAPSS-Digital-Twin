// Hardcoded sample engine data from C-MAPSS FD001 test set simulation
// 5 engines across different lifecycle stages

export const SAMPLE_ENGINES = [
  {
    id: 1,
    name: "Engine #001",
    maxCycles: 180,
    cycles: Array.from({ length: 180 }, (_, i) => {
      const cycle = i + 1;
      const rul = 180 - cycle;
      const healthStage = rul > 100 ? 0 : rul > 30 ? 1 : 2;
      const degradation = cycle / 180;
      return {
        cycle,
        rul,
        health_stage: healthStage,
        is_anomalous: rul < 20,
        confidence: 0.85 + Math.random() * 0.1,
        sensors: {
          sensor_15: 1.2 + degradation * 2.1 + (Math.random() - 0.5) * 0.2,
          sensor_13: 0.8 + degradation * 1.5 + (Math.random() - 0.5) * 0.15,
          sensor_18: -0.5 + degradation * 1.8 + (Math.random() - 0.5) * 0.3,
          sensor_9:  0.2 + degradation * 0.9 + (Math.random() - 0.5) * 0.1,
          sensor_14: 1.0 + degradation * 1.2 + (Math.random() - 0.5) * 0.2,
        },
        top_sensors: ["sensor_15", "sensor_13", "sensor_18"],
        importance: [0.224, 0.130, 0.113],
        zone_health: {
          fan: rul > 80 ? "healthy" : rul > 30 ? "degrading" : "critical",
          compressor: rul > 60 ? "healthy" : rul > 20 ? "degrading" : "critical",
          turbine: rul > 100 ? "healthy" : rul > 40 ? "degrading" : "critical",
          nozzle: rul > 120 ? "healthy" : rul > 50 ? "healthy" : rul > 25 ? "degrading" : "critical",
        }
      };
    })
  },
  {
    id: 42,
    name: "Engine #042",
    maxCycles: 220,
    cycles: Array.from({ length: 220 }, (_, i) => {
      const cycle = i + 1;
      const rul = 220 - cycle;
      const healthStage = rul > 100 ? 0 : rul > 30 ? 1 : 2;
      const degradation = cycle / 220;
      return {
        cycle, rul,
        health_stage: healthStage,
        is_anomalous: rul < 15,
        confidence: 0.78 + Math.random() * 0.15,
        sensors: {
          sensor_15: 0.9 + degradation * 2.5 + (Math.random() - 0.5) * 0.25,
          sensor_13: 0.6 + degradation * 1.8 + (Math.random() - 0.5) * 0.2,
          sensor_18: -0.3 + degradation * 2.0 + (Math.random() - 0.5) * 0.3,
          sensor_9:  0.1 + degradation * 1.1 + (Math.random() - 0.5) * 0.15,
          sensor_14: 0.8 + degradation * 1.4 + (Math.random() - 0.5) * 0.2,
        },
        top_sensors: ["sensor_15", "sensor_13", "sensor_18"],
        importance: [0.224, 0.130, 0.113],
        zone_health: {
          fan: rul > 80 ? "healthy" : rul > 30 ? "degrading" : "critical",
          compressor: rul > 60 ? "healthy" : rul > 20 ? "degrading" : "critical",
          turbine: rul > 100 ? "healthy" : rul > 40 ? "degrading" : "critical",
          nozzle: rul > 120 ? "healthy" : rul > 50 ? "healthy" : rul > 25 ? "degrading" : "critical",
        }
      };
    })
  },
  {
    id: 73,
    name: "Engine #073",
    maxCycles: 150,
    cycles: Array.from({ length: 150 }, (_, i) => {
      const cycle = i + 1;
      const rul = 150 - cycle;
      const healthStage = rul > 100 ? 0 : rul > 30 ? 1 : 2;
      const degradation = cycle / 150;
      return {
        cycle, rul,
        health_stage: healthStage,
        is_anomalous: rul < 25,
        confidence: 0.82 + Math.random() * 0.12,
        sensors: {
          sensor_15: 1.5 + degradation * 1.9 + (Math.random() - 0.5) * 0.3,
          sensor_13: 1.0 + degradation * 1.3 + (Math.random() - 0.5) * 0.2,
          sensor_18: -0.8 + degradation * 2.2 + (Math.random() - 0.5) * 0.35,
          sensor_9:  0.3 + degradation * 0.8 + (Math.random() - 0.5) * 0.1,
          sensor_14: 1.2 + degradation * 1.0 + (Math.random() - 0.5) * 0.2,
        },
        top_sensors: ["sensor_15", "sensor_13", "sensor_18"],
        importance: [0.224, 0.130, 0.113],
        zone_health: {
          fan: rul > 80 ? "healthy" : rul > 30 ? "degrading" : "critical",
          compressor: rul > 60 ? "healthy" : rul > 20 ? "degrading" : "critical",
          turbine: rul > 100 ? "healthy" : rul > 40 ? "degrading" : "critical",
          nozzle: rul > 120 ? "healthy" : rul > 50 ? "healthy" : rul > 25 ? "degrading" : "critical",
        }
      };
    })
  },
  {
    id: 88,
    name: "Engine #088",
    maxCycles: 260,
    cycles: Array.from({ length: 260 }, (_, i) => {
      const cycle = i + 1;
      const rul = 260 - cycle;
      const healthStage = rul > 100 ? 0 : rul > 30 ? 1 : 2;
      const degradation = cycle / 260;
      return {
        cycle, rul,
        health_stage: healthStage,
        is_anomalous: rul < 10,
        confidence: 0.90 + Math.random() * 0.08,
        sensors: {
          sensor_15: 0.7 + degradation * 3.0 + (Math.random() - 0.5) * 0.2,
          sensor_13: 0.5 + degradation * 2.1 + (Math.random() - 0.5) * 0.15,
          sensor_18: -0.2 + degradation * 2.4 + (Math.random() - 0.5) * 0.3,
          sensor_9:  0.0 + degradation * 1.2 + (Math.random() - 0.5) * 0.12,
          sensor_14: 0.6 + degradation * 1.6 + (Math.random() - 0.5) * 0.18,
        },
        top_sensors: ["sensor_15", "sensor_13", "sensor_18"],
        importance: [0.224, 0.130, 0.113],
        zone_health: {
          fan: rul > 80 ? "healthy" : rul > 30 ? "degrading" : "critical",
          compressor: rul > 60 ? "healthy" : rul > 20 ? "degrading" : "critical",
          turbine: rul > 100 ? "healthy" : rul > 40 ? "degrading" : "critical",
          nozzle: rul > 120 ? "healthy" : rul > 50 ? "healthy" : rul > 25 ? "degrading" : "critical",
        }
      };
    })
  },
  {
    id: 99,
    name: "Engine #099",
    maxCycles: 195,
    cycles: Array.from({ length: 195 }, (_, i) => {
      const cycle = i + 1;
      const rul = 195 - cycle;
      const healthStage = rul > 100 ? 0 : rul > 30 ? 1 : 2;
      const degradation = cycle / 195;
      return {
        cycle, rul,
        health_stage: healthStage,
        is_anomalous: rul < 18,
        confidence: 0.76 + Math.random() * 0.18,
        sensors: {
          sensor_15: 1.1 + degradation * 2.3 + (Math.random() - 0.5) * 0.22,
          sensor_13: 0.7 + degradation * 1.6 + (Math.random() - 0.5) * 0.18,
          sensor_18: -0.6 + degradation * 1.9 + (Math.random() - 0.5) * 0.28,
          sensor_9:  0.15 + degradation * 0.95 + (Math.random() - 0.5) * 0.11,
          sensor_14: 0.9 + degradation * 1.1 + (Math.random() - 0.5) * 0.19,
        },
        top_sensors: ["sensor_15", "sensor_13", "sensor_18"],
        importance: [0.224, 0.130, 0.113],
        zone_health: {
          fan: rul > 80 ? "healthy" : rul > 30 ? "degrading" : "critical",
          compressor: rul > 60 ? "healthy" : rul > 20 ? "degrading" : "critical",
          turbine: rul > 100 ? "healthy" : rul > 40 ? "degrading" : "critical",
          nozzle: rul > 120 ? "healthy" : rul > 50 ? "healthy" : rul > 25 ? "degrading" : "critical",
        }
      };
    })
  }
];
