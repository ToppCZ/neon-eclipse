using System.IO;
using System.Windows;
using Microsoft.Web.WebView2.Core;

namespace NeonEclipseApp;

public partial class MainWindow : Window
{
    public MainWindow()
    {
        InitializeComponent();
        Loaded += async (_, _) => await InitializeBrowserAsync();
    }

    private async System.Threading.Tasks.Task InitializeBrowserAsync()
    {
        try
        {
            var userDataFolder = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                "NeonEclipse", "WebView2");
            Directory.CreateDirectory(userDataFolder);

            var env = await CoreWebView2Environment.CreateAsync(userDataFolder: userDataFolder);
            await Browser.EnsureCoreWebView2Async(env);

            var gameFolder = Path.Combine(AppContext.BaseDirectory, "game");
            Browser.CoreWebView2.SetVirtualHostNameToFolderMapping(
                "game.local", gameFolder, CoreWebView2HostResourceAccessKind.Allow);

            Browser.CoreWebView2.Settings.AreDevToolsEnabled = false;
            Browser.CoreWebView2.NavigationCompleted += (_, args) =>
            {
                LoadingText.Visibility = Visibility.Collapsed;
                if (!args.IsSuccess)
                {
                    MessageBox.Show(
                        $"Failed to load the game (error {args.WebErrorStatus}).",
                        "Neon Eclipse", MessageBoxButton.OK, MessageBoxImage.Error);
                }
            };

            Browser.CoreWebView2.Navigate("https://game.local/index.html");
        }
        catch (WebView2RuntimeNotFoundException)
        {
            MessageBox.Show(
                "Neon Eclipse needs the Microsoft Edge WebView2 Runtime, which isn't installed.\n\n" +
                "Download it from: https://go.microsoft.com/fwlink/p/?LinkId=2124703",
                "WebView2 Runtime Missing", MessageBoxButton.OK, MessageBoxImage.Error);
            Close();
        }
        catch (Exception ex)
        {
            MessageBox.Show(
                $"Neon Eclipse failed to start:\n\n{ex.Message}",
                "Neon Eclipse", MessageBoxButton.OK, MessageBoxImage.Error);
            Close();
        }
    }
}
