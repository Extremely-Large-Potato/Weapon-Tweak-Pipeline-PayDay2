/* keepalive.js
 * Only does anything when this page is served by the launcher.
 * Pings the launcher every few seconds so it knows the tab is still
 * open. If pings stop for a while (tab closed), the launcher shuts
 * itself down on its own. Harmless no-op if you open this page any
 * other way — failed pings are just ignored.
 */
(function () {
  function ping() {
    fetch('/__heartbeat', { cache: 'no-store' }).catch(function () {});
  }
  ping();
  setInterval(ping, 3000);
})();
