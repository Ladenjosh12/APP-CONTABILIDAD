$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Net.Http

$base = "https://contabilidad-backend-1sgr.onrender.com"
$imgPath = "C:\Users\Thomas\ContabilidadFacturas\backend\scripts\factura_prueba.png"

$handler = New-Object System.Net.Http.HttpClientHandler
$client = New-Object System.Net.Http.HttpClient($handler)
$client.Timeout = [TimeSpan]::FromSeconds(120)

Write-Output "== 1. POST /invoices/extract =="
$fileBytes = [System.IO.File]::ReadAllBytes($imgPath)
$content = New-Object System.Net.Http.MultipartFormDataContent
$fileContent = New-Object System.Net.Http.ByteArrayContent(,$fileBytes)
$fileContent.Headers.ContentType = [System.Net.Http.Headers.MediaTypeHeaderValue]::Parse("image/png")
$content.Add($fileContent, "archivo", "factura_prueba.png")

$resp = $client.PostAsync("$base/invoices/extract", $content).GetAwaiter().GetResult()
$body = $resp.Content.ReadAsStringAsync().GetAwaiter().GetResult()
Write-Output "Status: $($resp.StatusCode)"
Write-Output $body
$draft = $body | ConvertFrom-Json

if ($resp.StatusCode -ne "OK") { throw "extract falló" }

Write-Output "`n== 2. POST /invoices (confirmar) =="
$payloadObj = [ordered]@{
    fecha = $draft.fecha
    trimestre = $draft.trimestre
    empresa = $draft.empresa
    nif = $draft.nif
    base_imponible = $draft.base_imponible
    descuento = $draft.descuento
    iva = $draft.iva
    total = $draft.total
    upload_token = $draft.upload_token
}
$json = $payloadObj | ConvertTo-Json
$jsonContent = New-Object System.Net.Http.StringContent($json, [System.Text.Encoding]::UTF8, "application/json")
$resp2 = $client.PostAsync("$base/invoices", $jsonContent).GetAwaiter().GetResult()
$body2 = $resp2.Content.ReadAsStringAsync().GetAwaiter().GetResult()
Write-Output "Status: $($resp2.StatusCode)"
Write-Output $body2
$registro = $body2 | ConvertFrom-Json
if ($resp2.StatusCode -ne "OK") { throw "guardar factura falló" }

$anio = [int]$draft.fecha.Substring(0,4)

Write-Output "`n== 3. GET /invoices?anio=&trimestre= =="
$resp3 = $client.GetAsync("$base/invoices?anio=$anio&trimestre=$($draft.trimestre)").GetAwaiter().GetResult()
$body3 = $resp3.Content.ReadAsStringAsync().GetAwaiter().GetResult()
Write-Output "Status: $($resp3.StatusCode)"
Write-Output $body3

Write-Output "`n== 4. GET /invoices/{id}/pdf =="
$resp4 = $client.GetAsync("$base/invoices/$($registro.id)/pdf").GetAwaiter().GetResult()
$pdfBytes = $resp4.Content.ReadAsByteArrayAsync().GetAwaiter().GetResult()
Write-Output "Status: $($resp4.StatusCode)  ContentType: $($resp4.Content.Headers.ContentType)  Bytes: $($pdfBytes.Length)"

Write-Output "`n== 5. GET /invoices/export/excel =="
$resp5 = $client.GetAsync("$base/invoices/export/excel?anio=$anio").GetAwaiter().GetResult()
$excelBytes = $resp5.Content.ReadAsByteArrayAsync().GetAwaiter().GetResult()
Write-Output "Status: $($resp5.StatusCode)  ContentType: $($resp5.Content.Headers.ContentType)  Bytes: $($excelBytes.Length)"
[System.IO.File]::WriteAllBytes("C:\Users\Thomas\ContabilidadFacturas\backend\scripts\export_prueba.xlsx", $excelBytes)

Write-Output "`nTODO OK"
