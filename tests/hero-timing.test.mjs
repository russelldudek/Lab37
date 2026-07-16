import assert from 'node:assert/strict';
import {
  FLIGHT_MS,
  PHASES,
  TOTAL_MS,
  cycleState,
  conveyorMotionForState,
  particleSchedule,
  phaseLabel,
  settledRatioForTime,
} from '../animation-v4.js';

const schedule = particleSchedule();
assert.equal(settledRatioForTime(0, schedule), 0, 'bowl starts empty');
assert.equal(settledRatioForTime(FLIGHT_MS - 1, schedule), 0, 'bowl stays empty before first impact');
assert.ok(settledRatioForTime(FLIGHT_MS, schedule) > 0, 'first impact begins accumulation');
assert.equal(settledRatioForTime(PHASES.fill, schedule), 1, 'all ingredients settle before validation');
assert.equal(phaseLabel(cycleState(FLIGHT_MS - 1), schedule), 'Ingredients in flight');
assert.equal(phaseLabel(cycleState(FLIGHT_MS), schedule), 'Filling the bowl');

for (const time of [0, FLIGHT_MS, PHASES.fill - 1, PHASES.fill + 100, PHASES.fill + PHASES.validate + 100]) {
  const state = cycleState(time);
  assert.equal(conveyorMotionForState(state), 0, `conveyor must be stopped during ${state.phase}`);
}
const exchange = cycleState(PHASES.fill + PHASES.validate + PHASES.release + 1000);
assert.equal(exchange.phase, 'exchange');
assert.ok(conveyorMotionForState(exchange) > 0, 'conveyor moves during exchange');
assert.equal(cycleState(TOTAL_MS).cycleIndex, 1, 'fresh bowl starts the next cycle');
console.log('hero timing contract passed');
