"""
Weapon Tweak Pipeline - local launcher

Start -> bind to a free localhost port -> start the HTTP server ->
open the browser -> hide the console -> watch for heartbeat pings
from the page -> shut everything down once the pings stop
(the tab was closed).

Expects a folder named "Weapon Tweak Pipeline" sitting in the same
directory as this script (or, once built, the same directory as the .exe).
"""

import http.server
import socketserver
import threading
import webbrowser
import os
import sys
import time
import ctypes


# ------------------------------------------------------------
# Configuration
# ------------------------------------------------------------

HEARTBEAT_TIMEOUT = 15          # Seconds without heartbeat before shutdown
WATCHDOG_CHECK_INTERVAL = 2     # How often the watchdog checks
CONSOLE_HIDE_DELAY = 1.5        # Delay before hiding the console


# ------------------------------------------------------------
# Runtime state
# ------------------------------------------------------------

_last_heartbeat = time.time()
_shutdown_event = threading.Event()


# ------------------------------------------------------------
# Paths
# ------------------------------------------------------------

def get_base_dir():
    """
    Returns the directory where the launcher is located.

    Works both when running as:
        python launcher.py

    and when frozen with PyInstaller:
        Launcher.exe
    """

    if getattr(sys, "frozen", False):
        return os.path.dirname(sys.executable)

    return os.path.dirname(os.path.abspath(__file__))


# ------------------------------------------------------------
# Console
# ------------------------------------------------------------

def hide_console():
    """
    Hides the console window on Windows.

    Does nothing on other platforms.
    """

    if sys.platform == "win32":
        hwnd = ctypes.windll.kernel32.GetConsoleWindow()

        if hwnd:
            ctypes.windll.user32.ShowWindow(hwnd, 0)  # SW_HIDE


# ------------------------------------------------------------
# HTTP handler
# ------------------------------------------------------------

def make_handler(web_dir):

    class Handler(http.server.SimpleHTTPRequestHandler):

        def __init__(self, *args, **kwargs):
            super().__init__(
                *args,
                directory=web_dir,
                **kwargs
            )

        def log_message(self, format, *args):
            """
            Disable the default request logging.

            We don't want every browser request appearing in the
            launcher console.
            """
            pass

        def do_GET(self):
            """
            Handle GET requests.

            /__heartbeat is used by the web application to tell
            the launcher that the page is still alive.
            """

            global _last_heartbeat

            if self.path == "/__heartbeat":
                _last_heartbeat = time.time()

                self.send_response(204)
                self.end_headers()

                return

            super().do_GET()

    return Handler


# ------------------------------------------------------------
# Watchdog
# ------------------------------------------------------------

def watchdog():
    """
    Watches for heartbeat requests from the web page.

    If no heartbeat is received for HEARTBEAT_TIMEOUT seconds,
    the launcher assumes that the browser tab was closed.
    """

    while not _shutdown_event.is_set():

        time.sleep(WATCHDOG_CHECK_INTERVAL)

        silence_time = time.time() - _last_heartbeat

        if silence_time > HEARTBEAT_TIMEOUT:
            _shutdown_event.set()
            break


# ------------------------------------------------------------
# Main
# ------------------------------------------------------------

def main():

    global _last_heartbeat

    # --------------------------------------------------------
    # Locate application directory
    # --------------------------------------------------------

    base_dir = get_base_dir()

    web_dir = os.path.join(
        base_dir,
        "Weapon Tweak Pipeline"
    )

    if not os.path.isdir(web_dir):

        # Keep console visible so the user can read the error.

        print(
            'Could not find the "Weapon Tweak Pipeline" folder '
            "next to this program."
        )

        print()
        print(f"Expected it at:")
        print(web_dir)

        print()
        input("Press Enter to close...")

        return

    # --------------------------------------------------------
    # Create HTTP server
    # --------------------------------------------------------

    handler = make_handler(web_dir)

    # Port 0 tells Windows to automatically choose
    # an available ephemeral port.

    httpd = socketserver.TCPServer(
        ("127.0.0.1", 0),
        handler
    )

    httpd.allow_reuse_address = True

    # Retrieve the actual port selected by Windows.

    port = httpd.server_address[1]

    # --------------------------------------------------------
    # Start server thread
    # --------------------------------------------------------

    server_thread = threading.Thread(
        target=httpd.serve_forever,
        daemon=True
    )

    server_thread.start()

    # --------------------------------------------------------
    # Build local URL
    # --------------------------------------------------------

    url = f"http://127.0.0.1:{port}"

    print(
        f"Running at {url} — this window will close on its own."
    )

    # Reset heartbeat immediately before opening the browser.
    # This prevents the watchdog from shutting down before the
    # page has had a chance to load and send its first heartbeat.

    _last_heartbeat = time.time()

    # --------------------------------------------------------
    # Open browser
    # --------------------------------------------------------

    try:

        webbrowser.open(url)

    except Exception:

        print(
            f"Could not open a browser automatically."
        )

        print(
            f"Open this URL manually: {url}"
        )

        # Give the user a few seconds to read the URL.

        time.sleep(4)

    # --------------------------------------------------------
    # Hide console
    # --------------------------------------------------------

    time.sleep(CONSOLE_HIDE_DELAY)

    hide_console()

    # --------------------------------------------------------
    # Start watchdog
    # --------------------------------------------------------

    watchdog_thread = threading.Thread(
        target=watchdog,
        daemon=True
    )

    watchdog_thread.start()

    # --------------------------------------------------------
    # Wait until shutdown is requested
    # --------------------------------------------------------

    try:

        _shutdown_event.wait()

    except KeyboardInterrupt:

        pass

    finally:

        # Stop the HTTP server.

        httpd.shutdown()


# ------------------------------------------------------------
# Entry point
# ------------------------------------------------------------

if __name__ == "__main__":
    main()