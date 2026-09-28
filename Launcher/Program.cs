using System;
using System.Diagnostics;
using System.IO;
using System.Net;
using System.Net.Sockets;
using System.Threading;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace WeaponLauncher
{
    internal static class Program
    {
        private static DateTime _lastHeartbeat = DateTime.UtcNow;
        private static readonly CancellationTokenSource _cts = new CancellationTokenSource();
        private const int HeartbeatTimeoutSeconds = 15;

        [STAThread]
        static void Main()
        {
            ApplicationConfiguration.Initialize();

            // دریافت مسیر کنار فایل اجرایی
            string baseDir = AppDomain.CurrentDomain.BaseDirectory;
            string webDir = Path.Combine(baseDir, "Weapon Tweak Pipeline");

            // بررسی وجود پوشه پروژه وب
            if (!Directory.Exists(webDir))
            {
                MessageBox.Show(
                    $"پوشه \"Weapon Tweak Pipeline\" در کنار این برنامه یافت نشد!\n\nمسیر جستجو شده:\n{webDir}",
                    "خطا در راه‌اندازی",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Error
                );
                return;
            }

            // پیدا کردن یک پورت آزاد و تصادفی روی سیستم
            int port = GetAvailablePort();
            string prefix = $"http://127.0.0.1:{port}/";

            using var listener = new HttpListener();
            listener.Prefixes.Add(prefix);

            try
            {
                listener.Start();
            }
            catch (Exception ex)
            {
                MessageBox.Show($"امکان فعال‌سازی سرور محلی وجود ندارد:\n{ex.Message}", "خطای شبکه", MessageBoxButtons.OK, MessageBoxIcon.Error);
                return;
            }

            // شروع نظارت بر تب مرورگر (Watchdog)
            Task.Run(() => Watchdog(_cts.Token));

            // پردازش درخواست‌های وب‌سرور
            Task.Run(() => HandleIncomingRequests(listener, webDir, _cts.Token));

            // باز کردن مرورگر ویندوز
            try
            {
                Process.Start(new ProcessStartInfo
                {
                    FileName = prefix,
                    UseShellExecute = true
                });
            }
            catch
            {
                MessageBox.Show($"مرورگر باز نشد. آدرس را به صورت دستی وارد کنید:\n{prefix}", "پیام", MessageBoxButtons.OK, MessageBoxIcon.Information);
            }

            // تا زمان متوقف شدن توسط سنسور نگه داشته می‌شود
            _cts.Token.WaitHandle.WaitOne();

            try { listener.Stop(); } catch { }
        }

        private static int GetAvailablePort()
        {
            using var socket = new Socket(AddressFamily.InterNetwork, SocketType.Stream, ProtocolType.Tcp);
            socket.Bind(new IPEndPoint(IPAddress.Loopback, 0));
            return ((IPEndPoint)socket.LocalEndPoint!).Port;
        }

        private static async Task HandleIncomingRequests(HttpListener listener, string webDir, CancellationToken token)
        {
            while (!token.IsCancellationRequested && listener.IsListening)
            {
                try
                {
                    var context = await listener.GetContextAsync();
                    _ = Task.Run(() => ProcessRequest(context, webDir));
                }
                catch
                {
                    if (token.IsCancellationRequested) break;
                }
            }
        }

        private static void ProcessRequest(HttpListenerContext context, string webDir)
        {
            try
            {
                string rawUrl = context.Request.Url?.AbsolutePath ?? "/";

                // دریافت پالس زنده بودن صفحه (Heartbeat)
                if (rawUrl == "/__heartbeat")
                {
                    _lastHeartbeat = DateTime.UtcNow;
                    context.Response.StatusCode = 204;
                    context.Response.Close();
                    return;
                }

                if (rawUrl == "/" || string.IsNullOrEmpty(rawUrl))
                {
                    rawUrl = "/index.html";
                }

                string relativePath = rawUrl.TrimStart('/').Replace('/', Path.DirectorySeparatorChar);
                string localFilePath = Path.Combine(webDir, relativePath);

                if (File.Exists(localFilePath))
                {
                    byte[] bytes = File.ReadAllBytes(localFilePath);
                    context.Response.ContentType = GetMimeType(Path.GetExtension(localFilePath));
                    context.Response.ContentLength64 = bytes.Length;
                    context.Response.OutputStream.Write(bytes, 0, bytes.Length);
                    context.Response.StatusCode = 200;
                }
                else
                {
                    context.Response.StatusCode = 404;
                }
            }
            catch
            {
                context.Response.StatusCode = 500;
            }
            finally
            {
                try { context.Response.Close(); } catch { }
            }
        }

        private static async Task Watchdog(CancellationToken token)
        {
            while (!token.IsCancellationRequested)
            {
                await Task.Delay(2000, token);

                if ((DateTime.UtcNow - _lastHeartbeat).TotalSeconds > HeartbeatTimeoutSeconds)
                {
                    _cts.Cancel();
                    break;
                }
            }
        }

        private static string GetMimeType(string extension)
        {
            return extension.ToLowerInvariant() switch
            {
                ".html" or ".htm" => "text/html; charset=utf-8",
                ".js" => "application/javascript; charset=utf-8",
                ".css" => "text/css; charset=utf-8",
                ".json" => "application/json; charset=utf-8",
                ".png" => "image/png",
                ".jpg" or ".jpeg" => "image/jpeg",
                ".ico" => "image/x-icon",
                ".svg" => "image/svg+xml",
                _ => "application/octet-stream"
            };
        }
    }
}