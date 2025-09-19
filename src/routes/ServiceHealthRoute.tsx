import React from "react";
import ServiceHealth from "../pages/ServiceHealth";

/**
 * Route wrapper for Service Health.
 * - With no props, ServiceHealth shows a dropdown for All XIs / specific XI.
 * - If you pass `instance` later, it will lock to that XI and hide the dropdown.
 */
export default function ServiceHealthRoute() {
  return <ServiceHealth />;
}
