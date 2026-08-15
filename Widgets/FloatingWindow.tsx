import app from "ags/gtk4/app"
import { Astal, Gdk } from "ags/gtk4"
import { Accessor, createState, Setter } from "gnim"
import { timeout, Timer } from "ags/time"

type Margins = {
   top: number;
   right: number;
   bottom: number;
   left: number;
}

export class FloatingWindowSettings {
   anchor: Astal.WindowAnchor;
   layer = Astal.Layer.OVERLAY;

   marginTop: Accessor<number>;
   marginRight: Accessor<number>;
   marginBottom: Accessor<number>;
   marginLeft: Accessor<number>;

   #setMarginTop: Setter<number>;
   #setMarginRight: Setter<number>;
   #setMarginBottom: Setter<number>;
   #setMarginLeft: Setter<number>;

   constructor(anchor: Astal.WindowAnchor, marginTop = 0, marginRight = 0, marginBottom = 0, marginLeft = 0) {
      this.anchor = anchor;

      [this.marginTop, this.#setMarginTop] = createState(marginTop);
      [this.marginRight, this.#setMarginRight] = createState(marginRight);
      [this.marginBottom, this.#setMarginBottom] = createState(marginBottom);
      [this.marginLeft, this.#setMarginLeft] = createState(marginLeft);
   }

   setMargins(margins: Partial<Margins>) {
      if (margins.top !== undefined)
         this.#setMarginTop(margins.top);

      if (margins.right !== undefined)
         this.#setMarginRight(margins.right);

      if (margins.bottom !== undefined)
         this.#setMarginBottom(margins.bottom);

      if (margins.left !== undefined)
         this.#setMarginLeft(margins.left);
   }
}

export class FlyInWindowSettings extends FloatingWindowSettings {
   hiddenMargins: Partial<Margins>;
   visibleMargins: Partial<Margins>;
   autoHideMs = 5000;

   #visible = false;
   #hideTimer: Timer | null = null;

   constructor(anchor: Astal.WindowAnchor, hiddenMargins: Partial<Margins>, shownMargins: Partial<Margins>) {
      super(anchor, hiddenMargins.top, hiddenMargins.right, hiddenMargins.bottom, hiddenMargins.left);
      this.hiddenMargins = hiddenMargins;
      this.visibleMargins = shownMargins;
   }

   #show = () => {
      this.#visible = true;
      this.setMargins(this.visibleMargins);

      this.#hideTimer?.cancel();
      this.#hideTimer = this.autoHideMs > 0 ? timeout(this.autoHideMs, this.#hide) : null;
   }

   #hide = () => {
      this.#hideTimer?.cancel();
      this.#hideTimer = null;
      this.#visible = false;
      this.setMargins(this.hiddenMargins);
   }

   toggle = () => {
      this.#visible ? this.#hide() : this.#show();
   }
}

export function FloatingWindow(gdkmonitor: Gdk.Monitor, title: string, settings: FloatingWindowSettings, content: JSX.Element) {
   return (
      <window
         gdkmonitor={gdkmonitor}
         class="FloatingWindow"
         name={title}
         application={app}
         layer={settings.layer}
         exclusivity={Astal.Exclusivity.IGNORE}
         anchor={settings.anchor}
         marginTop={settings.marginTop}
         marginRight={settings.marginRight}
         marginBottom={settings.marginBottom}
         marginLeft={settings.marginLeft}
         visible
      >
         {content}
      </window>
   );
}
