param(
    [string]$Host = "127.0.0.1",
    [int]$Port = 3306,
    [string]$Database = "vision_dev",
    [string]$User = "root"
)

function Ensure-MySqlAssembly {
    if (-not ([AppDomain]::CurrentDomain.GetAssemblies() | Where-Object { $_.GetName().Name -eq "MySql.Data" })) {
        $pkgPath = Join-Path $PSScriptRoot "packages/MySql.Data.8.4.0/lib/net8.0/MySql.Data.dll"
        if (-not (Test-Path $pkgPath)) {
            New-Item -ItemType Directory -Force -Path (Split-Path $pkgPath) | Out-Null
            dotnet tool update --global dotnet-serve | Out-Null
            dotnet add package MySql.Data --package-directory (Join-Path $PSScriptRoot "packages") --version 8.4.0 | Out-Null
        }
        Add-Type -Path $pkgPath
    }
}

Ensure-MySqlAssembly

$securePwd = Read-Host "Enter password for user '$User'" -AsSecureString
$plainPwd = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePwd))

$builder = New-Object MySql.Data.MySqlClient.MySqlConnectionStringBuilder
$builder.Server = $Host
$builder.Port = $Port
$builder.Database = $Database
$builder.UserID = $User
$builder.Password = $plainPwd
$builder.SslMode = "Preferred"

$conn = New-Object MySql.Data.MySqlClient.MySqlConnection($builder.ConnectionString)
try {
    $conn.Open()
    Write-Host "✅ Connected to $($conn.DataSource) / $Database" -ForegroundColor Green
    $cmd = $conn.CreateCommand()
    $cmd.CommandText = "SELECT NOW() AS server_time, USER() AS current_user;"
    $reader = $cmd.ExecuteReader()
    while ($reader.Read()) {
        Write-Host ("Server time: {0} | User: {1}" -f $reader["server_time"], $reader["current_user"])
    }
    $reader.Close()
}
catch {
    Write-Host "❌ Connection failed: $($_.Exception.Message)" -ForegroundColor Red
}
finally {
    if ($conn.State -eq "Open") { $conn.Close() }
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR([Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePwd))
}