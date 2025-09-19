import React from "react";
import HostHealth from "../pages/HostHealth";

/**
 * Route wrapper for Host Health.
 * 
 * HostHealth can operate in two modes:
 *  - With no props: shows a dropdown to select between All XIs or any authenticated XI.
 *  - If you ever pass an `instance` prop, it will lock to that XI and hide the dropdown.
 */
export default function HostHealthRoute() {
  return <HostHealth />;
}
