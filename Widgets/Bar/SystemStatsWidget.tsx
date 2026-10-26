import { createComputed } from "gnim"
import { cpuTemp, cpuUsage, gpuTemp, gpuUsage, memUsage } from "./SystemStats"

export function CpuWidget() {
   const label = createComputed(() => ` ${cpuUsage()}% ${cpuTemp()}°C`);

   return (
      <box class="sysStat">
         <label label={label} />
      </box>
   );
}

export function GpuWidget() {
   const label = createComputed(() => ` ${gpuUsage()}% ${gpuTemp()}°C`);

   return (
      <box class="sysStat">
         <label class="iconLg" label="󰾲" />
         <label label={label} />
      </box>
   );
}

export function MemoryWidget() {
   const label = createComputed(() => ` ${memUsage()}%`);

   return (
      <box class="sysStat">
         <label label={label} />
      </box>
   );
}
