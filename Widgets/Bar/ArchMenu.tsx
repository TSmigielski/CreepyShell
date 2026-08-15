import AstalHyprland from "gi://AstalHyprland"
import { Gtk } from "ags/gtk4";
import { FlyInWindowSettings } from "../FloatingWindow";

export default function ArchMenu(archMenu: FlyInWindowSettings) {
   return (
      <box class="ArchMenu" orientation={Gtk.Orientation.VERTICAL}>
         <image marginBottom={10} file="/usr/share/pixmaps/archlinux-logo.svg" pixelSize={50} />
         {PowerButton("Sleep", "systemctl suspend", archMenu)}
         {PowerButton("Hibernate", "systemctl hibernate", archMenu)}
         {PowerButton("Reboot", "hyprshutdown -t 'Rebooting down...' -p reboot", archMenu)}
         {PowerButton("Shutdown", "hyprshutdown -t 'Shutting down...' -p 'shutdown +0'", archMenu)}
      </box>
   )
}

function PowerButton(label: string, command: string, archMenu: FlyInWindowSettings) {
   const popover = (
      <popover onNotifyVisible={(self) => self.visible ? archMenu.inhibitAutoHide() : archMenu.releaseAutoHide()}>
         <box orientation={Gtk.Orientation.VERTICAL}>
            <label label={`Confirm ${label.toLowerCase()}?`} />
            <box halign={Gtk.Align.CENTER}>
               <button label="Confirm" onClicked={() => {
                  popover.popdown();
                  AstalHyprland.get_default().dispatch("hl.dsp.exec_cmd", `"${command}"`);
               }} />
               <button label="Cancel" onClicked={() => popover.popdown()} />
            </box>
         </box>
      </popover>
   ) as Gtk.Popover;

   return (
      <button
         label={label}
         onClicked={() => popover.popup()}
         $={(self) => popover.set_parent(self)}
      />
   );
}
