#!/usr/bin/env -S ags run
import app from "ags/gtk4/app";
import AstalHyprland from "gi://AstalHyprland";
import style from "./Styles/Main.scss";
import Bar, { archMenus } from "./Widgets/Bar/Bar";

app.start({
   css: style,
   main() {
      app.get_monitors().map(Bar);
   },
   requestHandler(argv, res) {
      switch (argv[0]) {
         case "toggle-menu": {
            const focused = AstalHyprland.get_default().focusedMonitor?.name;
            const archMenu = focused ? archMenus.get(focused) : undefined;

            if (!archMenu) {
               res("no focused monitor");
               break;
            }

            archMenu.toggle();
            res("ok");
            break;
         }
         default:
            res(`unknown command: ${argv[0]}`);
      }
   }
});
