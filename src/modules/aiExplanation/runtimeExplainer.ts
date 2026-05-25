export function explainRuntimeChange(
  eventType: string,
  payload: any
) {
  switch (eventType) {
    case 'velocity_increase':
      return {
        title: 'Velocity Increased',
        explanation:
          'As velocity increases near perihelion, the planet sweeps equal areas in equal times according to Kepler’s Second Law.'
      }
    case 'mass_increase':
      return {
        title: 'Mass Increased',
        explanation:
          'Increasing mass affects gravitational interaction and momentum.'
      }
    default:
      return {
        title: 'Simulation Parameter Changed',
        explanation: `Active properties modified in inspector. Dynamic physics vectors have updated accordingly.`
      }
  }
}
