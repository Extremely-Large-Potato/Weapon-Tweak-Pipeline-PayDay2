(function () {
  function ping() {
    fetch('/__heartbeat', { cache: 'no-store' }).catch(function () {});
  }
  ping();
  setInterval(ping, 3000);
})();
