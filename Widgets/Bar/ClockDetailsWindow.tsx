import { Accessor } from "gnim";

export default function ClockDetailsWindow(verboseDate: Accessor<string>) {
   return (
      <label label={verboseDate} />
   )
}
