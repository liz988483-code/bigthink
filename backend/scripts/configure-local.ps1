$ErrorActionPreference = "Stop"

$backendDirectory = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..")).Path
$envPath = Join-Path $backendDirectory ".env"
if (Test-Path -LiteralPath $envPath) {
  $replace = Read-Host "backend/.env already exists. Replace it with a new local configuration? (y/N)"
  if ($replace -notin @("y", "Y")) { Write-Output "Kept the existing backend/.env."; exit 0 }
}

$hostInput = Read-Host "MySQL host [localhost]"
$dbHost = if ([string]::IsNullOrWhiteSpace($hostInput)) { "localhost" } else { $hostInput.Trim() }
$portInput = Read-Host "MySQL port [3306]"
$dbPort = if ([string]::IsNullOrWhiteSpace($portInput)) { 3306 } else { [int]$portInput }
$databaseInput = Read-Host "Database/schema name [bigthink]"
$database = if ([string]::IsNullOrWhiteSpace($databaseInput)) { "bigthink" } else { $databaseInput.Trim() }
$userInput = Read-Host "MySQL application username [bigthink_app]"
$dbUser = if ([string]::IsNullOrWhiteSpace($userInput)) { "bigthink_app" } else { $userInput.Trim() }
$securePassword = Read-Host "MySQL application password" -AsSecureString
$passwordPtr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)

try {
  $dbPassword = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($passwordPtr)
  if ([string]::IsNullOrWhiteSpace($dbPassword)) { throw "A MySQL password is required." }
  $encodedUser = [Uri]::EscapeDataString($dbUser)
  $encodedPassword = [Uri]::EscapeDataString($dbPassword)
  $databaseUrl = "mysql://${encodedUser}:${encodedPassword}@${dbHost}:${dbPort}/${database}"

  $secretBytes = New-Object byte[] 32
  $random = [Security.Cryptography.RandomNumberGenerator]::Create()
  try { $random.GetBytes($secretBytes) } finally { $random.Dispose() }
  $jwtSecret = -join ($secretBytes | ForEach-Object { $_.ToString("x2") })
  [Array]::Clear($secretBytes, 0, $secretBytes.Length)

  $contents = @(
    "NODE_ENV=development"
    "PORT=4000"
    "FRONTEND_ORIGIN=http://localhost:3000"
    "DATABASE_URL=$databaseUrl"
    "JWT_ACCESS_SECRET=$jwtSecret"
  ) -join "`n"
  [IO.File]::WriteAllText($envPath, $contents, [System.Text.UTF8Encoding]::new($false))
  Write-Output "Created backend/.env with your local MySQL connection and a fresh JWT secret."
  Write-Output "Next run: npm run db:setup, then npm run dev (from the backend folder)."
}
finally {
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($passwordPtr)
  Remove-Variable dbPassword -ErrorAction SilentlyContinue
  Remove-Variable jwtSecret -ErrorAction SilentlyContinue
  Remove-Variable databaseUrl, encodedUser, encodedPassword, contents -ErrorAction SilentlyContinue
}
