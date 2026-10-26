import { Accessor, createState } from "gnim"

// One shared clock for every poll. Each poll counts ticks and only runs once
// it reaches its own threshold, so all updates land on the same frame.
const TICK_MS = 1000;

interface TickedPoll {
   everyTicks: number
   ticks: number
   run: () => void
}

const polls = new Set<TickedPoll>();
let started = false;

function tick() {
   for (const poll of polls) {
      if (++poll.ticks < poll.everyTicks) continue;
      poll.ticks = 0;
      poll.run();
   }
}

// Re-armed against the wall clock on every tick (rather than a fixed setInterval)
// so ticks land just after each whole second and never drift off it. The small
// margin keeps the clock from formatting the previous second if a timer fires early.
function scheduleNextTick() {
   const msToNextTick = TICK_MS - (Date.now() % TICK_MS) + 10;
   setTimeout(() => {
      tick();
      scheduleNextTick();
   }, msToNextTick);
}

export function createTickedPoll<T>(init: T, everyTicks: number, fn: (prev: T) => T): Accessor<T> {
   const [value, setValue] = createState(init);
   const poll: TickedPoll = {
      everyTicks: Math.max(1, Math.round(everyTicks)),
      ticks: 0,
      run: () => setValue(fn(value.peek())),
   };

   polls.add(poll);
   poll.run(); // populate immediately instead of showing init until the first threshold
   if (!started) {
      started = true;
      scheduleNextTick();
   }

   return value;
}
