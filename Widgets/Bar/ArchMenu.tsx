import { Gtk } from "ags/gtk4";
import { Accessor } from "gnim";

export default function ArchMenu() {
   return (
      <box class="ArchMenu" orientation={Gtk.Orientation.VERTICAL}>
         <button>
            Sleep
         </button>
         <button>
            Hibernate
         </button>
         <button>
            Reboot
         </button>
         <button>
            Shutdown
         </button>
      </box>
   )
}
