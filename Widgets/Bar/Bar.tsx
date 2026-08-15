import app from "ags/gtk4/app"
import GLib from "gi://GLib"
import { Astal, Gdk } from "ags/gtk4"
import { createPoll } from "ags/time"
import { createComputed } from "gnim"
import { FloatingWindow, FlyInWindowSettings } from "../FloatingWindow"
import WorkspacesPanel from "./WorkspacesPanel"
import ClockDetailsWindow from "./ClockDetailsWindow"
import ArchMenu from "./ArchMenu"

export default function Bar(monitor: Gdk.Monitor) {
   const now = createPoll(GLib.DateTime.new_now_local(), 1000, () => GLib.DateTime.new_now_local());
   const time = createComputed(() => now().format("%H:%M:%S %d.%m")!);
   const verboseDate = createComputed(() => now().format("%A, %d %B %Y")!);

   const clockWindow = new FlyInWindowSettings(Astal.WindowAnchor.TOP | Astal.WindowAnchor.RIGHT, {top: 47, right: -210}, {right: 5});
   clockWindow.autoHideMs = 2000;
   FloatingWindow(monitor, "ClockWindow", clockWindow, ClockDetailsWindow(verboseDate));

   const archMenu = new FlyInWindowSettings(Astal.WindowAnchor.TOP, {top: -200}, {top: 60});
   FloatingWindow(monitor, "ArchMenu", archMenu, ArchMenu());

   return (
      <window
         visible
         name="Bar"
         class="Bar"
         gdkmonitor={monitor}
         exclusivity={Astal.Exclusivity.EXCLUSIVE}
         anchor={Astal.WindowAnchor.TOP | Astal.WindowAnchor.LEFT | Astal.WindowAnchor.RIGHT}
         application={app}
      >
         <centerbox>
            <box $type="start">
               {WorkspacesPanel(monitor)}
            </box>
            <box $type="center">
               <button onClicked={archMenu.toggle}>
                  <image file="/usr/share/pixmaps/archlinux-logo.svg" pixelSize={20} />
               </button>
            </box>
            <box $type="end">
               <button label={time} onClicked={clockWindow.toggle} />
            </box>
         </centerbox>
      </window>
   );
}
