import AstalHyprland from "gi://AstalHyprland"
import { Gdk } from "ags/gtk4"
import { Accessor, createBinding, createComputed, createConnection, createState, For, onCleanup } from "gnim"

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

// Must match the urgent-flash animation duration in Bar.scss.
const URGENT_FLASH_MS = 2500;

export default function WorkspacesPanel(gdkmonitor: Gdk.Monitor) {
   const hyprland = AstalHyprland.get_default();
   const workspaces = createBinding(hyprland, "workspaces").as(x => x
      .filter(workspace => workspace.monitor.name === gdkmonitor.get_connector())
      .sort((a, b) => a.id - b.id)
   );

   // AstalHyprland has no "urgent" property to bind to, only a one-shot "urgent"
   // signal fired per client, so we accumulate the urgent workspace ids ourselves.
   // A workspace is cleared once it becomes focused (i.e. the user acknowledged it).
   const urgentWorkspaces = createConnection(new Set<number>(),
      // Skip the already-focused workspace: focus never changes, so it would never be cleared (see flashingWorkspaces).
      [hyprland, "urgent", (client, current) => client && client.workspace.id !== hyprland.focusedWorkspace?.id
         ? new Set(current).add(client.workspace.id)
         : current],
      [hyprland, "notify::focused-workspace", (_pspec, current) => {
         const focusedId = hyprland.focusedWorkspace?.id;
         if (focusedId === undefined || !current.has(focusedId))
            return current;

         // Copy rather than mutate: Accessor updates are detected by identity,
         // so returning the same Set reference would not notify subscribers.
         const next = new Set(current);
         next.delete(focusedId);
         return next;
      }],
   );

   // A workspace that becomes urgent while already focused flashes once instead,
   // and is dropped again once that single animation cycle has finished.
   const [flashingWorkspaces, setFlashingWorkspaces] = createState(new Set<number>());
   const urgentHandler = hyprland.connect("urgent", (_, client) => {
      const id = client?.workspace.id;
      if (id === undefined || id !== hyprland.focusedWorkspace?.id)
         return;

      setFlashingWorkspaces(current => new Set(current).add(id));
      setTimeout(() => setFlashingWorkspaces(current => {
         const next = new Set(current);
         next.delete(id);
         return next;
      }), URGENT_FLASH_MS);
   });
   onCleanup(() => hyprland.disconnect(urgentHandler));

   return (
      <box class="workspaces">
         <For each={workspaces}>
            {workspace => WorkspaceButton(workspace, urgentWorkspaces, flashingWorkspaces)}
         </For>
      </box>
   );
}

function WorkspaceButton(workspace: AstalHyprland.Workspace, urgentWorkspaces: Accessor<Set<number>>, flashingWorkspaces: Accessor<Set<number>>) {
   const hyprland = AstalHyprland.get_default();
   const focused = createBinding(hyprland, "focusedWorkspace");
   const focusedMonitor = createBinding(hyprland, "focusedMonitor");
   const activeOnMonitor = createBinding(workspace, "monitor", "activeWorkspace");

   const className = createComputed(() => {
      const classes: string[] = [];

      // "focused" = this workspace has system-wide keyboard focus.
      // "visible" = this workspace is the active one on its own monitor, but
      // that monitor isn't the currently focused one (mutually exclusive with "focused").
      if (focused()?.id === workspace.id)
         classes.push("focused");
      else if (activeOnMonitor()?.id === workspace.id && focusedMonitor()?.id !== workspace.monitor.id)
         classes.push("visible");

      // "urgent" can stack on top of either of the above.
      if (urgentWorkspaces().has(workspace.id))
         classes.push("urgent");
      else if (flashingWorkspaces().has(workspace.id))
         classes.push("urgentOnce");

      return classes.join(" ");
   });

   return (
      // hl.dsp.focus: this Hyprland build replaced the old plaintext
      // `dispatch workspace <id>` IPC command with a Lua-based dispatcher.
      <button class={className} onClicked={() => hyprland.dispatch("hl.dsp.focus", `{workspace = ${workspace.id}}`)}>
         {workspaceNames[parseInt(workspace.name) - 1]}
      </button>
   )
}
