import AstalHyprland from "gi://AstalHyprland"
import { Gdk } from "ags/gtk4"
import { createBinding, createComputed, For } from "gnim"

const workspaceNames: string[] = [
   'Q',
   'W',
   'E',
   'R',
   'T',
   'I',
   'II',
   'III',
   'IV',
   'V'
];

export default function WorkspacesPanel(gdkmonitor: Gdk.Monitor) {
   const hyprland = AstalHyprland.get_default();
   const workspaces = createBinding(hyprland, "workspaces").as(x => x
      .filter(workspace => workspace.monitor.name === gdkmonitor.get_connector())
      .sort((a, b) => a.id - b.id)
   );

   return (
      <box class="workspaces">
         <For each={workspaces}>
            {workspace => WorkspaceButton(workspace)}
         </For>
      </box>
   );
}

function WorkspaceButton(workspace: AstalHyprland.Workspace) {
   const hyprland = AstalHyprland.get_default();
   const focused = createBinding(hyprland, "focusedWorkspace");
   const focusedMonitor = createBinding(hyprland, "focusedMonitor");
   const activeOnMonitor = createBinding(workspace, "monitor", "activeWorkspace");

   const className = createComputed(() => {
      if (focused()?.id === workspace.id)
         return "focused";

      if (activeOnMonitor()?.id === workspace.id && focusedMonitor()?.id !== workspace.monitor.id)
         return "visible";

      return "";
   });

   return (
      <button class={className} onClicked={() => hyprland.dispatch("hl.dsp.focus", `{workspace = ${workspace.id}}`)}>
         {workspaceNames[parseInt(workspace.name) - 1]}
      </button>
   )
}
