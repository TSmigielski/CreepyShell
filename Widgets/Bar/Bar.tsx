import app from "ags/gtk4/app"
import GObject from "gi://GObject"
import Hyprland from "gi://AstalHyprland"

import { Astal, Gtk, Gdk } from "ags/gtk4"
import { createPoll } from "ags/time"
import WorkspacesPanel from "./WorkspacesPanel"

export default function Bar(gdkmonitor: Gdk.Monitor) {
   const time = createPoll("", 1000, "date");
   const { TOP, LEFT, RIGHT } = Astal.WindowAnchor;

   return (
      <window
         visible
         name="bar"
         class="Bar"
         gdkmonitor={gdkmonitor}
         exclusivity={Astal.Exclusivity.EXCLUSIVE}
         anchor={TOP | LEFT | RIGHT}
         application={app}
      >
         <centerbox>
            <box $type="start">
               {WorkspacesPanel(gdkmonitor)}
            </box>
            <box $type="center">
               <menubutton>
                  <label label={time} />
                  <popover>
                     <Gtk.Calendar />
                  </popover>
               </menubutton>
            </box>
            <box $type="end">
               Lorem
            </box>
         </centerbox>
      </window>
   );
}
