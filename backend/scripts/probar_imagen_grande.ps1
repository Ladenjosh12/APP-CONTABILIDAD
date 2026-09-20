$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Net.Http

$base = "https://contabilidad-backend-1sgr.onrender.com"
$imgPath = "C:\Users\Thomas\ContabilidadFacturas\backend\scripts\factura_grande.jpg"

$handler = New-Object System.Net.Http.HttpClientHandler
$client = New-Object System.Net.Http.HttpClient($handler)
$client.Timeout = [TimeSpan]::FromSeconds(150)

Write-Output "== POST /invoices/extract con imagen de $((Get-Item $imgPath).Length / 1KB) KB =="
$fileBytes = [System.IO.File]::ReadAllBytes($imgPath)
$content = New-Object System.Net.Http.MultipartFormDataContent
$fileContent = New-Object System.Net.Http.ByteArrayContent(,$fileBytes)
$fileContent.Headers.ContentType = [System.Net.Http.Headers.MediaTypeHeaderValue]::Parse("image/jpeg")
$content.Add($fileContent, "archivo", "factura_grande.jpg")

$sw = [System.Diagnostics.Stopwatch]::StartNew()
try {
    $resp = $client.PostAsync("$base/invoices/extract", $content).GetAwaiter().GetResult()
    $sw.Stop()
    $body = $resp.Content.ReadAsStringAsync().GetAwaiter().GetResult()
    Write-Output "Status: $($resp.StatusCode)  Tiempo: $($sw.Elapsed.TotalSeconds) s"
    Write-Output $body
} catch {
    $sw.Stop()
    Write-Output "ERROR tras $($sw.Elapsed.TotalSeconds) s: $_"
}
