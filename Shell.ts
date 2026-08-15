#!/usr/bin/env -S ags run
import app from "ags/gtk4/app";
import style from "./Styles/Main.scss";
import Bar from "./Widgets/Bar/Bar";

app.start({
   css: style,
   main() {
      app.get_monitors().map(Bar);
   }
});
