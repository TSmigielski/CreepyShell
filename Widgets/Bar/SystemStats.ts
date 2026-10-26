import GLib from "gi://GLib"
import { Accessor } from "gnim"
import { createTickedPoll } from "../Ticker"

function readFile(path: string): string {
   const [, bytes] = GLib.file_get_contents(path)
   return new TextDecoder().decode(bytes)
}

// hwmon device numbering isn't stable across reboots, so find the chip by
// name instead of hardcoding e.g. "hwmon2".
function findHwmonTempPath(...preferredChips: string[]): string | null {
   const candidates: { chip: string, path: string }[] = []

   const dir = GLib.Dir.open("/sys/class/hwmon", 0);
   for (let name = dir.read_name(); name; name = dir.read_name()) {
      const base = `/sys/class/hwmon/${name}`;
      const tempPath = `${base}/temp1_input`;
      if (!GLib.file_test(`${base}/name`, GLib.FileTest.EXISTS) || !GLib.file_test(tempPath, GLib.FileTest.EXISTS))
         continue;

      candidates.push({ chip: readFile(`${base}/name`).trim(), path: tempPath });
   }

   for (const chip of preferredChips) {
      const match = candidates.find(c => c.chip === chip);
      if (match) return match.path;
   }

   return candidates[0]?.path ?? null;
}

// The amdgpu DRM node numbering (card0, card1, ...) isn't stable either, so
// find it by driver name rather than assuming card0/card1.
function findAmdGpuBusyPercentPath(): string | null {
   const dir = GLib.Dir.open("/sys/class/drm", 0);
   for (let name = dir.read_name(); name; name = dir.read_name()) {
      if (!/^card\d+$/.test(name)) continue;

      const ueventPath = `/sys/class/drm/${name}/device/uevent`;
      const busyPath = `/sys/class/drm/${name}/device/gpu_busy_percent`;
      if (!GLib.file_test(ueventPath, GLib.FileTest.EXISTS) || !GLib.file_test(busyPath, GLib.FileTest.EXISTS))
         continue;

      if (readFile(ueventPath).includes("DRIVER=amdgpu"))
         return busyPath;
   }

   return null;
}

const cpuTempPath = findHwmonTempPath("k10temp", "coretemp");
const gpuTempPath = findHwmonTempPath("amdgpu");
const gpuBusyPercentPath = findAmdGpuBusyPercentPath();

function createCpuTemp(everyTicks = 2): Accessor<number> {
   return createTickedPoll(0, everyTicks, () => {
      if (!cpuTempPath) return 0;
      return Math.round(parseInt(readFile(cpuTempPath).trim(), 10) / 1000);
   });
}

function createGpuTemp(everyTicks = 2): Accessor<number> {
   return createTickedPoll(0, everyTicks, () => {
      if (!gpuTempPath) return 0;
      return Math.round(parseInt(readFile(gpuTempPath).trim(), 10) / 1000);
   });
}

function createGpuUsage(everyTicks = 2): Accessor<number> {
   return createTickedPoll(0, everyTicks, () => {
      if (!gpuBusyPercentPath) return 0;
      return parseInt(readFile(gpuBusyPercentPath).trim(), 10);
   });
}

function createCpuUsage(everyTicks = 2): Accessor<number> {
   let prevIdle = 0;
   let prevTotal = 0;

   return createTickedPoll(0, everyTicks, () => {
      // First line of /proc/stat: cpu user nice system idle iowait irq softirq steal guest guest_nice
      const fields = readFile("/proc/stat")
         .split("\n")[0]
         .trim()
         .split(/\s+/)
         .slice(1)
         .map(Number);

      const idle = fields[3] + fields[4];
      const total = fields.reduce((sum, n) => sum + n, 0);
      const idleDelta = idle - prevIdle;
      const totalDelta = total - prevTotal;
      prevIdle = idle;
      prevTotal = total;

      return totalDelta > 0 ? Math.round((1 - idleDelta / totalDelta) * 100) : 0;
   });
}

function createMemUsage(everyTicks = 3): Accessor<number> {
   return createTickedPoll(0, everyTicks, () => {
      const info = readFile("/proc/meminfo");
      const total = Number(/MemTotal:\s+(\d+)/.exec(info)?.[1] ?? 0);
      const available = Number(/MemAvailable:\s+(\d+)/.exec(info)?.[1] ?? 0);

      return total > 0 ? Math.round((1 - available / total) * 100) : 0;
   });
}

// Created once at module level and shared by every monitor's bar, so each
// stat is only read once per update no matter how many monitors there are.
export const cpuUsage = createCpuUsage(1);
export const cpuTemp = createCpuTemp(3);
export const gpuUsage = createGpuUsage(1);
export const gpuTemp = createGpuTemp(3);
export const memUsage = createMemUsage(5);
