import app from "ags/gtk4/app"
import GLib from "gi://GLib"
import { Astal, Gdk } from "ags/gtk4"
import { createPoll } from "ags/time"
import { createComputed } from "gnim"
import { FloatingWindow, FlyInWindowSettings } from "../FloatingWindow"
import WorkspacesPanel from "./WorkspacesPanel"
import ClockDetailsWindow from "./ClockDetailsWindow"
import ArchMenu from "./ArchMenu"

// keyed by Gdk.Monitor.get_connector(), one ArchMenu instance per monitor
export const archMenus = new Map<string, FlyInWindowSettings>();

export default function Bar(monitor: Gdk.Monitor) {
   const now = createPoll(GLib.DateTime.new_now_local(), 1000, () => GLib.DateTime.new_now_local());
   const time = createComputed(() => now().format("%d.%m %H:%M:%S")!);
   const verboseDate = createComputed(() => now().format("%A, %d %B %Y")!);

   const clockWindow = new FlyInWindowSettings(Astal.WindowAnchor.TOP | Astal.WindowAnchor.RIGHT, {top: 47, right: -250}, {right: 5});
   clockWindow.autoHideMs = 3000;
   FloatingWindow(monitor, "ClockWindow", clockWindow, ClockDetailsWindow(verboseDate));

   const archMenu = new FlyInWindowSettings(Astal.WindowAnchor.TOP, {top: -250}, {top: 60});
   archMenus.set(monitor.get_connector()!, archMenu);
   FloatingWindow(monitor, "ArchMenu", archMenu, ArchMenu(archMenu));

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
                  <image file="/usr/share/pixmaps/archlinux-logo.svg" pixelSize={22} />
               </button>
            </box>
            <box $type="end">
               <button label={time} onClicked={clockWindow.toggle} />
            </box>
         </centerbox>
      </window>
   );
}
